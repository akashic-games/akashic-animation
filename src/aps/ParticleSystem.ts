import {Emitter} from "./Emitter";

/**
 * パーティクルシステム。
 *
 * 複数の Emitter の位置や時間をまとめて操作します。
 */
export class ParticleSystem {
	elapse: number;

	emitters: Emitter[];

	constructor() {
		this.elapse = 0;
		this.emitters = [];
	}

	move(dx: number, dy: number): void {
		this.emitters.forEach((e) => {
			e.tx += dx;
			e.ty += dy;
		});
	}

	moveTo(x: number, y: number): void {
		this.emitters.forEach((e) => {
			e.tx = x;
			e.ty = y;
		});
	}

	addEmitter(e: Emitter): void {
		this.emitters.push(e);
	}

	_downwell(e: Emitter, callback: (e: Emitter) => void): void {
		while (e) {
			callback(e);
			e = e.subEmitter;
		}
	}

	traverse(callback: (e: Emitter) => void): void {
		this.emitters.forEach((e) => {
			this._downwell(e, callback);
		});
	}

	update(dt: number): void {
		this.elapse += dt;
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].emitTimer(this.elapse, dt);
			this.emitters[i].update(dt);
		}
	}
}