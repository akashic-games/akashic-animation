import {Particle} from "./Particle";

const TOLERANCE = 1e-7;

function limit(val: number, min: number, max: number): number {
	if (min != null && val < min) return min;
	else if (max != null && val > max) return max;
	else return val;
}

export interface ParticleInitialParameterObject {
	tx: number[];
	txMin?: number[];
	txMax?: number[];

	ty: number[];
	tyMin?: number[];
	tyMax?: number[];

	v: number[]; // 初速度
	vMin?: number[];
	vMax?: number[];

	tv?: number[];
	tvRelIV?: number[];
	tvNTOA?: number[];

	a: number[]; // 加速度
	aMin?: number[];
	aMax?: number[];

	angle: number[]; // 射出方向

	rz: number[]; // Z軸角度（描画）
	rzMin?: number[];
	rzMax?: number[];

	vrz: number[]; // Z軸角速度（描画）
	vrzMin?: number[];
	vrzMax?: number[];

	tvrz?: number[];
	tvrzRelIVRZ?: number[];
	tvrzC?: number[];
	tvrzNTOA?: number[]; // 正規化最大角速度到達時間

	arz: number[]; // Z軸角加速度（描画）
	arzMin?: number[];
	arzMax?: number[];

	lifespan: number[]; // 寿命
}

export interface EmitterParameterObject {
	gx: number; // 重力加速度
	gy: number;
	interval: number; // 射出間隔
	activePeriod: number; // emitterの活動期間。負の時、無制限
	delayEmit: number; // 射出開始遅延時間
	numParticlesPerEmit: number; // 一度の放出で放出されるパーティクル数
	maxParticles: number; // emitter の保持する最大パーティクル数
	children: Emitter[]; // 各パーティクルがさらにパーティクルを放出するためのエミッタ
	randomFunc: () => number;
	initParam: ParticleInitialParameterObject;
	userData: any;
}

export enum EmitterStatus {
	/// 停止。エミットを停止
	Stop = 0,

	/// 動作中。エミットとパーティクルの更新を行う
	Running,

	/// ポーズ。エミットとパーティクルの更新を停止
	Pause
}

export class Emitter {
	status: EmitterStatus;

	gx: number;
	gy: number;
	interval: number;
	randomFunc: () => number;

	activePeriod: number;
	maxParticles: number;
	children: Emitter[];
	delayEmit: number;
	numParticlesPerEmit: number;

	initParam: ParticleInitialParameterObject;
	userData: any;

	particles: Particle[];

	onInitParticleHandlers: Array<(p: Particle, emitter: Emitter) => void>;
	onPreUpdateParticleHandlers: Array<(p: Particle, emitter: Emitter, dt: number) => void>;

	constructor(param: EmitterParameterObject) {
		this.status = EmitterStatus.Stop;
		this.gx = param.gx;
		this.gy = param.gy;
		this.interval = param.interval;
		this.activePeriod = param.activePeriod;
		this.delayEmit = param.delayEmit;
		this.maxParticles = param.maxParticles;
		this.numParticlesPerEmit = param.numParticlesPerEmit;
		this.children = param.children || [];
		this.randomFunc = param.randomFunc;
		this.onInitParticleHandlers = [];
		this.onPreUpdateParticleHandlers = [];

		this.initParam = {
			tx: param.initParam.tx,
			txMin: param.initParam.txMin,
			txMax: param.initParam.txMax,

			ty: param.initParam.ty,
			tyMin: param.initParam.tyMin,
			tyMax: param.initParam.tyMax,

			v: param.initParam.v,
			vMin: param.initParam.vMin,
			vMax: param.initParam.vMax,

			tv: param.initParam.tv,
			tvRelIV: param.initParam.tvRelIV,
			tvNTOA: param.initParam.tvNTOA,

			a: param.initParam.a,
			aMin: param.initParam.aMin,
			aMax: param.initParam.aMax,

			angle: param.initParam.angle,

			rz: param.initParam.rz,
			rzMin: param.initParam.rzMin,
			rzMax: param.initParam.rzMax,

			vrz: param.initParam.vrz,
			vrzMin: param.initParam.vrzMin,
			vrzMax: param.initParam.vrzMax,

			tvrz: param.initParam.tvrz,
			tvrzRelIVRZ: param.initParam.tvrzRelIVRZ,
			tvrzNTOA: param.initParam.tvrzNTOA,
			tvrzC: param.initParam.tvrzC,

			arz: param.initParam.arz,
			arzMin: param.initParam.arzMin,
			arzMax: param.initParam.arzMax,

			lifespan: param.initParam.lifespan
		};

		this.userData = param.userData;

		this.particles = [];
	}

	/**
	 * エミッタの動作を開始する。
	 */
	start(): void {
		this.status = EmitterStatus.Running;
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].start();
		}
	}

	/**
	 * エミッタの動作を停止する。
	 *
	 * すでにエミットされたパーティクルの更新は行われる。
	 */
	stop(): void {
		this.status = EmitterStatus.Stop;
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].stop();
		}
	}

	/*
	 * エミッタの動作を一時停止する。
	 *
	 * エミット及びパーティクルの更新を一時停止する。
	 */
	pause(): void {
		this.status = EmitterStatus.Pause;
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].pause();
		}
	}

	/*
	 * エミッタをリセットする。
	 *
	 * 放出済みのパーティクルは破棄される。
	 */
	reset(): void {
		this.status = EmitterStatus.Stop;
		this.particles = [];
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].reset();
		}
	}

	emitOneAt(x: number, y: number): void {
		if (this.particles.length >= this.maxParticles) {
			return;
		}

		const tx = this.pickParam(this.initParam.tx, 0);
		const txMin = this.pickParam(this.initParam.txMin, undefined);
		const txMax = this.pickParam(this.initParam.txMax, undefined);

		const ty = this.pickParam(this.initParam.ty, 0);
		const tyMin = this.pickParam(this.initParam.tyMin, undefined);
		const tyMax = this.pickParam(this.initParam.tyMax, undefined);

		let   v = this.pickParam(this.initParam.v, 0);
		let   vMin = this.pickParam(this.initParam.vMin, undefined);
		let   vMax = this.pickParam(this.initParam.vMax, undefined);

		const tv = this.pickParam(this.initParam.tv, undefined);
		const tvRelIV = this.pickParam(this.initParam.tvRelIV, undefined);
		const tvNTOA = this.pickParam(this.initParam.tvNTOA, undefined);

		let   a = this.pickParam(this.initParam.a, 0);
		const aMin = this.pickParam(this.initParam.aMin, undefined);
		const aMax = this.pickParam(this.initParam.aMax, undefined);

		const angle = this.pickParam(this.initParam.angle, 0);

		const rz = this.pickParam(this.initParam.rz, 0);
		const rzMin = this.pickParam(this.initParam.rzMin, undefined);
		const rzMax = this.pickParam(this.initParam.rzMax, undefined);

		const vrz = this.pickParam(this.initParam.vrz, 0);
		let   vrzMin = this.pickParam(this.initParam.vrzMin, undefined);
		let   vrzMax = this.pickParam(this.initParam.vrzMax, undefined);

		// 現時点では参照されていない。これらのパラメータのよう不要は後ほどよく考えるとして、
		// 一旦 lint エラーに対応するためコメントアウトする
		// const tvrz = this.pickParam(this.initParam.tvrz, undefined);
		// const tvrzRelIVRZ = this.pickParam(this.initParam.tvrzRelIVRZ, undefined);
		const tvrzNTOA = this.pickParam(this.initParam.tvrzNTOA, undefined);
		const tvrzC = this.pickParam(this.initParam.tvrzC, undefined);

		let   arz = this.pickParam(this.initParam.arz, 0);
		const arzMax = this.pickParam(this.initParam.arzMin, undefined);
		const arzMin = this.pickParam(this.initParam.arzMax, undefined);

		const lifespan = this.pickParam(this.initParam.lifespan, 1);

		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		// resolve parameters depending on initial values.
		if (tvNTOA != null) {
			const tvTOA = lifespan * tvNTOA;
			if (tv) { // target velocity = tv + v
				a = tv / tvTOA;
				if (tv >= 0) vMax = tv + v;
				else vMin = tv + v;
			} else if (tvRelIV) { // target velocity = tvRelIV
				// TODO: impl
			}
		}

		if (tvrzC != null && tvrzNTOA != null) {
			const trvz = vrz * tvrzC;
			const trvzTOA = lifespan * tvrzNTOA;
			arz = (trvz - vrz) / trvzTOA;
			if (trvz >= vrz) vrzMax = trvz;
			else vrzMin = trvz;
		}

		const p = new Particle({
			lifespan: lifespan,

			tx: x + tx,
			txMin: txMin,
			txMax: txMax,

			ty: y + ty,
			tyMin: tyMin,
			tyMax: tyMax,

			vx: cos * v,
			vy: sin * v,
			vMin: vMin,
			vMax: vMax,

			ax: cos * a,
			ay: sin * a,
			aMin: aMin,
			aMax: aMax,

			rz: rz,
			rzMin: rzMin,
			rzMax: rzMax,

			vrz: vrz,
			vrzMin: vrzMin,
			vrzMax: vrzMax,

			arz: arz,
			arzMin: arzMin,
			arzMax: arzMax,

			sx: 1.0,
			sy: 1.0,

			alpha: 1.0
		});

		for (let i = 0; i < this.onInitParticleHandlers.length; i++) {
			this.onInitParticleHandlers[i](p, this);
		}

		this.particles.push(p);
	}

	emitAt(x: number, y: number): void {
		for (let i = 0; i < this.numParticlesPerEmit; i++) {
			this.emitOneAt(x, y);
		}
	}

	/**
	 * Emitter.interval間隔でエミットする。
	 *
	 * @param time Emitterの現在時刻。０以上の実数
	 * @param dt 前回のエミットからの経過時間。０より大きい実数
	 * @param x エミットするX座標
	 * @param y エミットするY座標
	 */
	emitTimerAt(time: number, dt: number, x: number, y: number): void {
		if (this.activePeriod === 0) {
			return;
		}

		if (this.status !== EmitterStatus.Running) {
			return;
		}

		if (this.particles.length >= this.maxParticles) {
			return;
		}

		if (time < this.delayEmit - TOLERANCE) {
			return;
		}

		time -= this.delayEmit;

		const interval = this.interval;
		const t1 = time;
		const t0 = t1 - dt;
		const ti0 = ((t1 / interval | 0) + 1) * interval;
		const tiN = Math.max((t0 / interval | 0) * interval, 0);

		const activePeriod = this.activePeriod > 0 ? this.activePeriod : 60 * 60 * 60 * 24 * 7;
		if (dt === 0) {
			const isActive = t1 < activePeriod - TOLERANCE;
			if (isActive && (ti0 - TOLERANCE <= t1 || t1 <= tiN + TOLERANCE)) {
				this.emitAt(x, y);
			}
		} else {
			for (let ti = ti0; ti >= tiN; ti -= interval) {
				if (ti >= activePeriod - TOLERANCE) continue;
				const ts = ti - TOLERANCE;
				const te = ti + TOLERANCE;
				if (t0 < ts && (t1 > te || (ts <= t1 && t1 <= te))) {
					this.emitAt(x, y);
				}
			}
		}
	}

	update(dt: number): void {
		if (this.status === EmitterStatus.Pause) {
			return;
		}

		this.particles = this.particles.filter(p => {
			p.elapse += dt;
			return p.elapse <= p.lifespan;
		});

		for (let i = 0, len = this.particles.length; i < len; i++) {
			const p = this.particles[i];

			for (let j = 0; j < this.onPreUpdateParticleHandlers.length; j++) {
				this.onPreUpdateParticleHandlers[j](p, this, dt);
			}

			p.vx += (this.gx + p.ax) * dt;
			p.vy += (this.gy + p.ay) * dt;
			if (p.vMin != null || p.vMax != null) {
				const v2 = p.vx * p.vx + p.vy * p.vy;
				if (p.vMax != null && v2 > p.vMax * p.vMax) {
					const v = Math.sqrt(v2);
					p.vx = p.vx / v * p.vMax;
					p.vy = p.vy / v * p.vMax;
				} else if (p.vMin != null && v2 < p.vMin * p.vMin) {
					const v = Math.sqrt(v2);
					p.vx = p.vx / v * p.vMin;
					p.vy = p.vy / v * p.vMin;
				}
			}

			p.tx = limit(p.tx + p.vx * dt, p.txMin, p.txMax);
			p.ty = limit(p.ty + p.vy * dt, p.tyMin, p.tyMax);

			p.vrz = limit(p.vrz + p.arz * dt, p.vrzMin, p.vrzMax);
			p.rz = limit(p.rz + p.vrz * dt, p.rzMin, p.rzMax);

			for (let j = 0; j < this.children.length; j++) {
				this.children[j].emitTimerAt(p.elapse, dt, p.tx, p.ty);
			}
		}

		for (let j = 0; j < this.children.length; j++) {
			this.children[j].update(dt);
		}
	}

	private pickParam(p: number[], defaultValue: number): number {
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
