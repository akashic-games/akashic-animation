import {Emitter} from "./Emitter";

function traverse(e: Emitter, callback: (e: Emitter) => void): void {
	callback(e);
	for (let i = 0; i < e.children.length; i++) {
		traverse(e.children[i], callback);
	}
}

/**
 * ParticleSystemの状態を表す定数。
 */
export enum ParticleSystemStatus {
	/// 停止。エミットを停止する。パーティクルの更新は行う。
	Stop = 0,

	/// 動作中。エミットとパーティクルの更新を行う。
	Running
}

/**
 * パーティクルシステム。
 *
 * いくつかの Emitter の位置や時間をまとめて操作する。。
 */
export class ParticleSystem {
	/// エミッタのX座標。
	tx: number;

	/// エミッタのY座標。
	ty: number;

	/// エミッタ配列。参照専用。
	emitters: Emitter[];

	/// ParticleSystemの状態。
	status: ParticleSystemStatus;

	// エミッタの時刻。参照専用。
	emitterTime: number;

	/// null または undefined でないとき tick() はこの値を emitterTime に代入する。
	nextEmitterTime: number;

	constructor() {
		this.tx = 0;
		this.ty = 0;
		this.emitters = [];
		this.reset();
	}

	// エミットを開始する
	start(): void {
		this.status = ParticleSystemStatus.Running;
	}

	// エミットを停止する
	stop(): void {
		this.status = ParticleSystemStatus.Stop;
	}

	// 初期状態にする
	reset(): void {
		this.emitterTime = 0;
		this.nextEmitterTime = 0;
		this.status = ParticleSystemStatus.Stop;
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].reset();
		}
	}

	/**
	 * エミッタの移動。
	 *
	 * @param dx X座標の移動量。
	 * @param dy Y座標の移動量。
	 */
	move(dx: number, dy: number): void {
		this.tx += dx;
		this.ty += dy;
	}

	/**
	 * エミッタの移動。
	 *
	 * @param tx 移動先のX座標。
	 * @param ty 移動先のY座標。
	 */
	moveTo(tx: number, ty: number): void {
		this.tx = tx;
		this.ty = ty;
	}

	/**
	 * エミッタの追加。
	 *
	 * @param e エミッタ。
	 */
	addEmitter(e: Emitter): void {
		this.emitters.push(e);
	}

	/**
	 * エミッタをすべて訪れて逐次コールバック関数を実行する。
	 *
	 * @param callback コールバック関数。
	 */
	traverse(callback: (e: Emitter) => void): void {
		for (let i = 0; i < this.emitters.length; i++) {
			traverse(this.emitters[i], callback);
		}
	}

	/**
	 * エミッタを更新する。
	 *
	 * Emitter#status が Running の時 Emitter#emitTimerAt() も実行する。
	 * @param dt 前回呼び出しからの経過時間。
	 */
	update(dt: number): void {
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].update(dt);
		}

		if (this.status === ParticleSystemStatus.Running) {
			this.tick(dt);
			for (let i = 0; i < this.emitters.length; i++) {
				this.emitters[i].emitTimerAt(this.emitterTime, dt, this.tx, this.ty);
			}
		} else if (this.status === ParticleSystemStatus.Stop) {
			// nothing to do.
		}
	}

	/*
	 * emitterTime の時刻を進める。
	 *
	 * @param dt 経過時間。
	 */
	private tick(dt: number): void {
		if (this.nextEmitterTime != null) {
			this.emitterTime = this.nextEmitterTime;
			this.nextEmitterTime = null;
		} else {
			this.emitterTime += dt;
		}
	}
}
