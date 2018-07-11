import {Emitter} from "./Emitter";

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

	constructor() {
		this.elapse = 0;
		this.emitters = [];
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
		this.elapse += dt;
		for (let i = 0; i < this.emitters.length; i++) {
			this.emitters[i].emitTimer(this.elapse, dt);
			this.emitters[i].update(dt);
		}
	}
}
