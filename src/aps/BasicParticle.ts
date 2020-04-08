import {Particle} from "./Particle";

/**
 * BasicParticle の初期化に用いるパラメータ。
 */
export interface BasicParticleParameterObject {
	lifespan: number;
	tx: number;
	ty: number;
	vx: number;
	vy: number;
	ax: number;
	ay: number;
	rz: number;
	sx: number;
	sy: number;
	alpha: number;
}

/**
 * BasicEmitter がエミットするパーティクル。
 */
export class BasicParticle implements Particle {
	elapse: number;
	lifespan: number;
	tx: number;
	ty: number;
	vx: number;
	vy: number;
	ax: number;
	ay: number;
	rz: number;
	sx: number;
	sy: number;
	alpha: number;

	constructor(param: BasicParticleParameterObject) {
		this.init(param);
	}

	/**
	 * パーティクルを初期化する。
	 *
	 * @param param 初期化パラメータ。
	 */
	init(param: BasicParticleParameterObject): void {
		this.elapse = 0;
		this.lifespan = param.lifespan;
		this.tx = param.tx;
		this.ty = param.ty;
		this.vx = param.vx;
		this.vy = param.vy;
		this.ax = param.ax;
		this.ay = param.ay;
		this.rz = param.rz;
		this.sx = param.sx;
		this.sy = param.sy;
		this.alpha = param.alpha;
	}
}
