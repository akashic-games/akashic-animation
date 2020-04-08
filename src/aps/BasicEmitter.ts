import {Emitter} from "./Emitter";
import {BasicParticle, BasicParticleParameterObject} from "./BasicParticle";

/**
 * 時刻比較に用いられる許容誤差
 *
 * Emitter#emitTimerAt() で現在時刻とエミットタイミングとの
 * 比較の際に用いられる。
 *
 * 備考:
 * JavaScriptでは数値はIEEE754倍精度浮動小数で表現される。
 * IEEE754倍精度浮動小数の有効桁数は十進数で16桁弱となる。
 */
export const TOLERANCE = 1e-7;

/**
 * BasicEmitterがパーティクルを初期化するときに利用するパラメータ。
 *
 * すべてのパラメータは配列となっている。配列に２つ以上の要素が
 * 存在するとき、最初の要素と２つ目の要素を範囲とするランダムな値が
 * 実際のパーティクルのパラメータとなる。
 *
 * パラメータが null または undefined の時、BasicEmitter の持つ
 * 既定値が用いられる。
 */
export interface BasicParticleInitialParameterObject {
	/// パーティクルの寿命。
	lifespan: number[];

	/// パーティクルの射出角(rad)。
	angle: number[];

	/// パーティクル初期X座標。エミッタ相対。
	tx: number[];

	/// パーティクル初期Y座標。エミッタ相対。
	ty: number[];

	/// パーティクルの初速。向きはangleに従う。
	v: number[];

	/// パーティクルの加速度の大きさ。向きはangleに従う。
	a: number[];

	/// 回転角(rad)
	rz: number[];

	/// Xスケール。
	sx: number[];

	/// Yスケール。
	sy: number[];

	/// 不透明度。
	alpha: number[];
}

/**
 * BasicEmitter のコンストラクタに渡すパラメータ。
 *
 * 詳細はBasicEmitterの同名メンバの説明を参照すること。
 */
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

/**
 * BasicParticle をエミットする基本的な機能を持ったエミッタ。
 */
export class BasicEmitter implements Emitter {
	/// パーティクル。参照専用。
	particles: BasicParticle[];

	/// 子エミッタ。
	children: Emitter[];

	/// このエミッタのエミットしたパーティクルに作用する重力加速度(X方向)
	gx: number;

	/// このエミッタのエミットしたパーティクルに作用する重力加速度(Y方向)
	gy: number;

	/// 定期エミットの時間間隔。emitTimerAt() で用いられる。
	interval: number;

	/// エミッタ活動期間。満了後 emitTimerAt() はエミットを行わない。負のとき無制限。
	activePeriod: number;

	/// 最大パーティクル数。
	maxParticles: number;

	/// エミット開始遅延。 emitTimerAt() によるエミットが遅延される。
	delayEmit: number;

	/// 一度のエミットで放出されるパーティクル数。
	numParticlesPerEmit: number;

	/// パーティクル初期化パラメタ。
	initParam: BasicParticleInitialParameterObject;

	/// エミッタの利用するランダム関数。
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
		this.particles = [];
		this.initParam = {
			lifespan: param.initParam.lifespan,
			angle: param.initParam.angle,
			tx: param.initParam.tx,
			ty: param.initParam.ty,
			v: param.initParam.v,
			a: param.initParam.a,
			rz: param.initParam.rz,
			sx: param.initParam.sx,
			sy: param.initParam.sy,
			alpha: param.initParam.alpha
		};
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
		const p = this.acquireParticle(x, y);
		this.particles.push(p);
	}

	/**
	 * numParticlesPerEmit 個のパーティクルをエミットする。
	 *
	 * @param x エミット位置のX座標。
	 * @param y エミット位置のY座標。
	 */
	emitAt(x: number, y: number): void {
		for (let i = 0; i < this.numParticlesPerEmit; i++) {
			this.emitOneAt(x, y);
		}
	}

	/**
	 * 前回のエミットした時刻から現在時刻の間に Emitter#interval 間隔で訪れるエミットタイミングが一度以上存在する場合エミットする。
	 *
	 * @param currentTime Emitterの現在時刻。０以上の実数。
	 * @param dt 前回のエミットからの経過時間。０より大きい実数。
	 * @param x エミット位置のX座標。
	 * @param y エミット位置のY座標。
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
		// particleの加齢
		this.particles = this.particles.filter(p => {
			p.elapse += dt;
			return p.elapse <= p.lifespan;
		});

		// particle更新
		for (let i = 0, len = this.particles.length; i < len; i++) {
			this.updateParticle(this.particles[i], dt);
		}

		// 子エミッタ更新（子エミッタのemitTimerAtに先んじる）
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].update(dt);
		}

		// 子エミッタのemitTimerAt
		for (let i = 0, len = this.particles.length; i < len; i++) {
			const p = this.particles[i];
			for (let j = 0; j < this.children.length; j++) {
				this.children[j].emitTimerAt(p.elapse, dt, p.tx, p.ty);
			}
		}
	}

	/**
	 * パーティクルを更新する。
	 *
	 * @param p パーティクル。
	 * @param dt 経過時間。
	 */
	protected updateParticle(p: BasicParticle, dt: number): void {
		p.vx += (this.gx + p.ax) * dt;
		p.vy += (this.gy + p.ay) * dt;
		p.tx += p.vx * dt;
		p.ty += p.vy * dt;
	}

	/**
	 * パーティクル初期化パラメータを生成する。
	 *
	 * @param x パーティクルのX座標。
	 * @param y パーティクルのY座標。
	 */
	// TODO: particle pool を用意するとしてもこちらでオブジェクトを
	// 作っていては片手落ちになる。１つのオブジェクトを再利用する。a
	protected createParticleParameterObject(x: number, y: number): BasicParticleParameterObject {
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

		return {
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
		};
	}

	/**
	 * パーティクルを生成する。
	 *
	 * @param x パーティクルのX座標。
	 * @param y パーティクルのY座標。
	 */
	protected createParticle(x: number, y: number): BasicParticle {
		return new BasicParticle(this.createParticleParameterObject(x, y));
	}

	/**
	 * 乱数を返す。
	 *
	 * 乱数生成機として randomFunc が用いられる。
	 *
	 * @param p 乱数の範囲を定める配列。配列長が1の時、最初の要素が用いられる。配列長が２以上の時、最初の要素が最小値、その次の要素が最大値として用いられるa。
	 * @param defaultValue p が falsy の時用いられる既定値。
	 */
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

	/*
	 * 初期化済みのパーティクルインスタンスを獲得する。
	 *
	 * @param x パーティクルのX座標。
	 * @param y パーティクルのY座標。
	 */
	private acquireParticle(x: number, y: number): BasicParticle {
		if (this.particles.length >= this.maxParticles) {
			return null;
		}

		const p = this.createParticle(x, y);
		// 再利用の仕組みを導入した際は初期化メソッドを利用する
		// p.init(this.createParticleParameterObject(x, y));

		return p;
	}

	/*
	 * 使用中のパーティクルを開放する。
	 *
	 * @param p パーティクル。
	 */
	private releaseParticle(p: BasicParticle): void {
		// ...
	}

	/*
	 * 未使用パーティクル数。
	 */
	private unusedParticleCount(): number {
		return Math.max(0, this.maxParticles - this.particles.length);
	}
}
