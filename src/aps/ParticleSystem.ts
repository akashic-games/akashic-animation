import {Emitter} from "./Emitter";

function traverse(e: Emitter, callback: (e: Emitter) => void): void {
	callback(e);
	for (let i = 0; i < e.children.length; i++) {
		traverse(e.children[i], callback);
	}
}

export enum ParticleSystemStatus {
	/// 停止。エミットを停止
	Stop = 0,

	/// 動作中。エミットとパーティクルの更新を行う
	Running
}

/**
 * パーティクルシステム。
 *
 * 複数の Emitter の位置や時間をまとめて操作します。
 */
export class ParticleSystem {
	tx: number;
	ty: number;

	emitters: Emitter[];

	status: ParticleSystemStatus;

	emitterTime: number;
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

	move(dx: number, dy: number): void {
		this.tx += dx;
		this.ty += dy;
	}

	moveTo(tx: number, ty: number): void {
		this.tx = tx;
		this.ty = ty;
	}

	addEmitter(e: Emitter): void {
		this.emitters.push(e);
	}

	traverse(callback: (e: Emitter) => void): void {
		for (let i = 0; i < this.emitters.length; i++) {
			traverse(this.emitters[i], callback);
		}
	}

	update(dt: number): void {
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].update(dt);
		}

		if (this.status === ParticleSystemStatus.Running) {
			this.tick(dt);
			for (let i = 0; i < this.emitters.length; i++) {
				this.emitters[i].emitTimerAt(this.emitterTime, this.tx, this.ty);
			}
		} else if (this.status === ParticleSystemStatus.Stop) {
			// nothing to do.
		}
	}

	tick(dt: number): void {
		if (this.nextEmitterTime != null) {
			this.emitterTime = this.nextEmitterTime;
			this.nextEmitterTime = null;
		} else {
			this.emitterTime += dt;
		}
	}
}
