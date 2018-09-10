import {Emitter} from "./Emitter";
import {BasicParticle, BasicParticleParameterObject} from "./BasicParticle";

// 時刻比較に用いられる許容誤差
//
// Emitter.intervalによる定期的なemit処理にて現在時刻と
// emitタイミングを比較するとき
//   Math.abs(エミットタイミング - 現在時刻) <= TOLERANCE
// ならばエミットする
//
// apsは時刻を浮動小数で表現してよい。浮動小数同士の比較では
// 誤差を許容する必要がある。
//
// JavaScriptでは数値はIEEE754倍精度浮動小数で表現される。
// IEEE754倍精度浮動小数の有効桁数は十進数で16桁弱となる。
export const TOLERANCE = 1e-7;

// エミッタ最大活動期間
// 初期値は 100000000 である。
export const MAX_ACTIVEPERIOD = 100000000; // 99999999.9999999 + TOLERANCE;

export interface BasicParticleInitialParameterObject {
	lifespan: number[];
	angle: number[];
	tx: number[];
	ty: number[];
	v: number[];
	a: number[];
	rz: number[];
	sx: number[];
	sy: number[];
	alpha: number[];
}

export interface BasicEmitterParameterObject {
	gx: number;
	gy: number;
	interval: number;
	activePeriod: number;
	delayEmit: number;
	numParticlesPerEmit: number;
	maxParticles: number;
	children: Emitter[];
	randomFunc: () => number;
	initParam: BasicParticleInitialParameterObject;
}

export class BasicEmitter implements Emitter {
	particles: BasicParticle[];
	children: Emitter[];

	/// このエミッタのエミットしたパーティクルに作用する重力加速度(X方向)
	gx: number;

	/// このエミッタのエミットしたパーティクルに作用する重力加速度(Y方向)
	gy: number;

	/// 定期エミット時間間隔
	interval: number;

	/// エミッタ活動期間。満了後 interval に基づいた定期的エミットが停止する。負のとき無制限。
	activePeriod: number;

	/// 最大パーティクル数
	maxParticles: number;

	/// エミット開始遅延。interval に基づいたエミットの開始を遅延する。
	delayEmit: number;

	/// 一度のエミット動作で実際に放出されるパーティクル数
	numParticlesPerEmit: number;

	/// パーティクル初期化パラメタ
	initParam: BasicParticleInitialParameterObject;

	/// エミッタの利用するランダム関数
	randomFunc: () => number;

	constructor(param: BasicEmitterParameterObject) {
		this.gx = param.gx;
		this.gy = param.gy;
		this.interval = param.interval;
		this.activePeriod = param.activePeriod;
		this.delayEmit = param.delayEmit;
		this.maxParticles = param.maxParticles;
		this.numParticlesPerEmit = param.numParticlesPerEmit;
		this.children = param.children || [];
		this.randomFunc = param.randomFunc;
	}

	reset(): void {
		this.particles = [];
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].reset();
		}
	}

	emitOneAt(x: number, y: number): void {
		if (this.unusedParticleCount() <= 0) {
			return;
		}

		const tx = this.pickParam(this.initParam.tx, 0);
		const ty = this.pickParam(this.initParam.ty, 0);
		const v = this.pickParam(this.initParam.v, 0);
		const a = this.pickParam(this.initParam.a, 0);
		const angle = this.pickParam(this.initParam.angle, 0);
		const rz = this.pickParam(this.initParam.rz, 0);
		const sx = this.pickParam(this.initParam.sx, 1);
		const sy = this.pickParam(this.initParam.sy, 1);
		const alpha = this.pickParam(this.initParam.alpha, 1);
		const lifespan = this.pickParam(this.initParam.lifespan, 1);

		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		this.createParticle({
			lifespan: lifespan,
			tx: x + tx,
			ty: y + ty,
			vx: cos * v,
			vy: sin * v,
			ax: cos * a,
			ay: sin * a,
			rz: rz,
			sx: sx,
			sy: sy,
			alpha: alpha
		});
	}

	emitAt(x: number, y: number): void {
		for (let i = 0; i < this.numParticlesPerEmit; i++) {
			this.emitOneAt(x, y);
		}
	}

	/**
	 * 前回のエミットした時刻から現在時刻の間に Emitter#interval 間隔で訪れるエミットタイミングが一度以上存在する場合エミットする。
	 *
	 * @param currentTime Emitterの現在時刻。０以上の実数
	 * @param dt 前回のエミットからの経過時間。０より大きい実数
	 * @param x エミットするX座標
	 * @param y エミットするY座標
	 */
	emitTimerAt(currentTime: number, dt: number, x: number, y: number): void {
		if (this.activePeriod === 0) {
			return;
		}

		if (this.particles.length >= this.maxParticles) {
			return;
		}

		currentTime += TOLERANCE;

		if (currentTime < this.delayEmit) {
			return;
		}

		currentTime -= this.delayEmit;

		const keyTime = Math.floor(currentTime / this.interval) * this.interval;

		if (this.activePeriod > 0 && keyTime >= this.activePeriod) {
			return;
		}

		if (currentTime - dt < keyTime) {
			this.emitAt(x, y);
		}
	}

	update(dt: number): void {
		this.particles = this.particles.filter(p => {
			p.elapse += dt;
			return p.elapse <= p.lifespan;
		});

		for (let i = 0; i < this.children.length; i++) {
			this.children[i].update(dt);
		}

		for (let i = 0, len = this.particles.length; i < len; i++) {
			const p = this.particles[i];

			p.vx += (this.gx + p.ax) * dt;
			p.vy += (this.gy + p.ay) * dt;
			p.tx += p.vx * dt;
			p.tx += p.vy * dt;

			for (let j = 0; j < this.children.length; j++) {
				this.children[j].emitTimerAt(p.elapse, dt, p.tx, p.ty);
			}
		}
	}

	protected createParticle(param: BasicParticleParameterObject): BasicParticle {
		if (this.particles.length >= this.maxParticles) {
			return null;
		}

		const p = new BasicParticle(param);
		this.particles.push(p);

		return p;
	}

	protected unusedParticleCount(): number {
		return Math.max(0, this.maxParticles - this.particles.length);
	}

	protected pickParam(p: number[], defaultValue: number): number {
		if (!p) {
			return defaultValue;
		} else if (p.length === 1) {
			return p[0];
		} else {
			const t = this.randomFunc();
			return t * p[0] + (1 - t) * p[1];
		}
	}
}
