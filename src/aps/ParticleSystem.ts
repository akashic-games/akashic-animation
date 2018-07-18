import {Emitter, EmitterStatus} from "./Emitter";

function traverse(e: Emitter, callback: (e: Emitter) => void): void {
	if (! e) return;

	callback(e);

	for (let i = 0; i < e.children.length; i++) {
		traverse(e.children[i], callback);
	}
}

/**
 * パーティクルシステム。
 *
 * 複数の Emitter の位置や時間をまとめて操作します。
 */
export class ParticleSystem {
	elapse: number;

	emitters: Emitter[];

	private emitterStatus: EmitterStatus;

	constructor() {
		this.elapse = 0;
		this.emitters = [];
		this.emitterStatus = EmitterStatus.Stop;
	}

	start(): void {
		this.emitterStatus = EmitterStatus.Running;
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].start();
		}
	}

	stop(): void {
		this.emitterStatus = EmitterStatus.Stop;
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].stop();
		}
	}

	pause(): void {
		this.emitterStatus = EmitterStatus.Pause;
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].pause();
		}
	}

	reset(): void {
		// リセットによって次の状態になる
		// * Stop(=放出しない状態)にする
		//    * ∴ 放出済みのパーティクルは運動を続ける
		//    * ∴ emitTimer用の時間変数が増加しない
		// * elapseをゼロにする
		this.stop();
		this.elapse = 0;
	}

	move(dx: number, dy: number): void {
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].tx += dx;
			this.emitters[i].ty += dy;
		}
	}

	moveTo(x: number, y: number): void {
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].tx = x;
			this.emitters[i].ty = y;
		}
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
		if (this.emitterStatus === EmitterStatus.Pause) {
			return;
		}

		if (this.emitterStatus === EmitterStatus.Running) {
			this.elapse += dt;
			for (let i = 0; i < this.emitters.length; i++) {
				this.emitters[i].emitTimer(this.elapse, dt);
				this.emitters[i].update(dt);
			}
		} else if (this.emitterStatus === EmitterStatus.Stop) {
			for (let i = 0; i < this.emitters.length; i++) {
				this.emitters[i].update(dt);
			}
		}
	}
}
