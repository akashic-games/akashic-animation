import {Emitter} from "./Emitter";

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
	elapse: number;

	emitters: Emitter[];

	constructor() {
		this.elapse = 0;
		this.emitters = [];
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
		this.elapse += dt;
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].emitTimerAt(this.elapse, dt, this.tx, this.ty);
			this.emitters[i].update(dt);
		}
	}
}
