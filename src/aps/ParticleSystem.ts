import type {Emitter} from "./Emitter";
import { EmitterStatus} from "./Emitter";

function traverse(e: Emitter, callback: (e: Emitter) => void): void {
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
	tx: number;
	ty: number;
	emitterTime: number;

	emitters: Emitter[];

	emitterStatus: EmitterStatus;

	private skipTick: boolean;

	constructor() {
		this.tx = 0;
		this.ty = 0;
		this.emitters = [];
		this.reset();
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
		this.emitterTime = 0;
		this.emitterStatus = EmitterStatus.Stop;
		this.skipTick = true;
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
		if (this.emitterStatus === EmitterStatus.Pause) {
			// nothing to do.
		} else if (this.emitterStatus === EmitterStatus.Running) {
			for (let i = 0; i < this.emitters.length; i++) {
				this.emitters[i].update(dt);
			}
			this.tick(dt);
			for (let i = 0; i < this.emitters.length; i++) {
				this.emitters[i].emitTimerAt(this.emitterTime, dt, this.tx, this.ty);
			}
		} else if (this.emitterStatus === EmitterStatus.Stop) {
			for (let i = 0; i < this.emitters.length; i++) {
				this.emitters[i].update(dt);
			}
		}
	}

	private tick(dt: number): void {
		if (this.skipTick) {
			this.skipTick = false;
		} else {
			this.emitterTime += dt;
		}
	}
}
