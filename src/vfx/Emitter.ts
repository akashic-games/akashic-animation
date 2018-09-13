import {AlphaBlendMode} from "..";
import * as aps from "../aps";
import {Particle, ParticleParameterObject} from "./Particle";

function limit(val: number, min: number, max: number): number {
	if (min != null && val < min) return min;
	else if (max != null && val > max) return max;
	else return val;
}

/**
 * Emitterがパーティクルを初期化するときに利用するパラメータ。
 */
export interface ParticleInitialParameterObject extends aps.BasicParticleInitialParameterObject {
	txMin?: number[];
	txMax?: number[];

	tyMin?: number[];
	tyMax?: number[];

	vMin?: number[];
	vMax?: number[];

	tv?: number[];
	tvRelIV?: number[];
	tvNTOA?: number[];

	aMin?: number[];
	aMax?: number[];

	rzMin?: number[];
	rzMax?: number[];

	vrz?: number[]; // Z軸角速度
	vrzMin?: number[];
	vrzMax?: number[];

	arz?: number[]; // Z軸角加速度
	arzMin?: number[];
	arzMax?: number[];

	sxMin?: number[];
	sxMax?: number[];

	vsx?: number[];
	vsxMin?: number[];
	vsxMax?: number[];

	asx?: number[];
	asxMin?: number[];
	asxMax?: number[];

	syMin?: number[];
	syMax?: number[];

	vsy?: number[];
	vsyMin?: number[];
	vsyMax?: number[];

	asy?: number[];
	asyMin?: number[];
	asyMax?: number[];

	sxy?: number[];
	sxyMin?: number[];
	sxyMax?: number[];

	vsxy?: number[];
	vsxyMin?: number[];
	vsxyMax?: number[];

	asxy?: number[];
	asxyMin?: number[];
	asxyMax?: number[];

	tsx?: number[]; // 目標Xスケール
	tsy?: number[]; // 目標Yスケール
	tsxy?: number[]; // 目標XYスケール

	fadeInNT?: number[]; // 正規化フェードイン完了時刻
	fadeOutNT?: number[]; // 正規化フェードアウト開始時刻

	tvrz?: number[]; // 目標角速度
	tvrzRelIVRZ?: number[]; // 目標角速度（初期角速度相対）
	tvrzC?: number[]; // 目標角速度（初期角速度係数）
	tvrzNTOA?: number[]; // 正規化目標角速度到達時間
}

/**
 * パーティクルの材質。
 */
export interface Material {
	skinName: string;
	cellName: string;
	alphaBlendMode: AlphaBlendMode;
}

/**
 * Emitterのコンストラクタに渡すパラメータ。
 */
export interface EmitterParameterObject extends aps.BasicEmitterParameterObject {
	initParam: ParticleInitialParameterObject;
	userData: Material;
}

/**
 * エフェクトで用いるエミッタ。
 */
export class Emitter extends aps.BasicEmitter {
	particles: Particle[];
	initParam: ParticleInitialParameterObject;

	userData: Material;

	constructor(param: EmitterParameterObject) {
		super(param);

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

			sx: param.initParam.sx,
			sxMin: param.initParam.sxMin,
			sxMax: param.initParam.sxMax,

			vsx: param.initParam.vsx,
			vsxMin: param.initParam.vsxMin,
			vsxMax: param.initParam.vsxMax,

			asx: param.initParam.asx,
			asxMin: param.initParam.asxMin,
			asxMax: param.initParam.asxMax,

			sy: param.initParam.sy,
			syMin: param.initParam.syMin,
			syMax: param.initParam.syMax,

			vsy: param.initParam.vsy,
			vsyMin: param.initParam.vsyMin,
			vsyMax: param.initParam.vsyMax,

			asy: param.initParam.asy,
			asyMin: param.initParam.asyMin,
			asyMax: param.initParam.asyMax,

			sxy: param.initParam.sxy,
			sxyMin: param.initParam.sxyMin,
			sxyMax: param.initParam.sxyMax,

			vsxy: param.initParam.vsxy,
			vsxyMin: param.initParam.vsxyMin,
			vsxyMax: param.initParam.vsxyMax,

			asxy: param.initParam.asxy,
			asxyMin: param.initParam.asxyMin,
			asxyMax: param.initParam.asxyMax,

			tsx: param.initParam.tsx,
			tsy: param.initParam.tsy,
			tsxy: param.initParam.tsxy,

			alpha: param.initParam.alpha,
			fadeInNT: param.initParam.fadeInNT,
			fadeOutNT: param.initParam.fadeOutNT,

			lifespan: param.initParam.lifespan
		};

		this.userData = param.userData;
	}

	protected updateParticle(p: Particle, dt: number): void {
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

		p.vsx = limit(p.vsx + p.asx * dt, p.vsxMin, p.vsxMax);
		p.sx = limit(p.sx + p.vsx * dt, p.sxMin, p.sxMax);

		p.vsy = limit(p.vsy + p.asy * dt, p.vsyMin, p.vsyMax);
		p.sy = limit(p.sy + p.vsy * dt, p.syMin, p.syMax);

		p.vsxy = limit(p.vsxy + p.asxy * dt, p.vsxyMin, p.vsxyMax);
		p.sxy = limit(p.sxy + p.vsxy * dt, p.sxyMin, p.sxyMax);

		if (p.fadeInNT !== 0 || p.fadeOutNT !== 1) {
			const t = p.elapse / p.lifespan;
			if (t < p.fadeInNT) {
				p.alpha = t / p.fadeInNT;
			} else if (t > p.fadeOutNT) {
				p.alpha = 1 - (t - p.fadeOutNT) / (1 - p.fadeOutNT);
			} else {
				p.alpha = 1;
			}
		}
	}

	protected createParticleParameterObject(x: number, y: number): ParticleParameterObject {
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

		const sx = this.pickParam(this.initParam.sx, 1);
		let sxMin = this.pickParam(this.initParam.sxMin, 1);
		let sxMax = this.pickParam(this.initParam.sxMax, 1);

		let vsx = this.pickParam(this.initParam.vsx, 0);
		let vsxMin = this.pickParam(this.initParam.vsxMin, 0);
		let vsxMax = this.pickParam(this.initParam.vsxMax, 0);

		let asx = this.pickParam(this.initParam.asx, 0);
		const asxMin = this.pickParam(this.initParam.asxMin, 0);
		const asxMax = this.pickParam(this.initParam.asxMax, 0);

		const sy = this.pickParam(this.initParam.sy, 1);
		let syMin = this.pickParam(this.initParam.syMin, 1);
		let syMax = this.pickParam(this.initParam.syMax, 1);

		let vsy = this.pickParam(this.initParam.vsy, 0);
		let vsyMin = this.pickParam(this.initParam.vsyMin, 0);
		let vsyMax = this.pickParam(this.initParam.vsyMax, 0);

		let asy = this.pickParam(this.initParam.asy, 0);
		const asyMin = this.pickParam(this.initParam.asyMin, 0);
		const asyMax = this.pickParam(this.initParam.asyMax, 0);

		const sxy = this.pickParam(this.initParam.sxy, 1);
		let sxyMin = this.pickParam(this.initParam.sxyMin, 1);
		let sxyMax = this.pickParam(this.initParam.sxyMax, 1);

		let vsxy = this.pickParam(this.initParam.vsxy, 0);
		const vsxyMin = this.pickParam(this.initParam.vsxyMin, 0);
		let vsxyMax = this.pickParam(this.initParam.vsxyMax, 0);

		let asxy = this.pickParam(this.initParam.asxy, 0);
		const asxyMin = this.pickParam(this.initParam.asxyMin, 0);
		const asxyMax = this.pickParam(this.initParam.asxyMax, 0);

		const tsx = this.pickParam(this.initParam.tsx, undefined);
		const tsy = this.pickParam(this.initParam.tsy, undefined);
		const tsxy = this.pickParam(this.initParam.tsxy, undefined);

		const lifespan = this.pickParam(this.initParam.lifespan, 1);

		// `trans_colorfade`
		//
		// 透明から始まりフェードイン、フェードアウトする。つまり
		// [fadeInNT,fadeOutNT] が表示区間である。
		// コマンド: "フェード"
		let alpha: number;
		const fadeInNT = this.pickParam(this.initParam.fadeInNT, 0);
		const fadeOutNT = this.pickParam(this.initParam.fadeOutNT, 1);
		if (fadeInNT !== 0 && fadeOutNT !== 1) {
			alpha = 0;
		} else {
			alpha = this.pickParam(this.initParam.alpha, 1);
		}

		// `trans_speed_beh`
		//
		// 初速と目標速度が与えられ、lifespanで変化する
		// コマンド "速度：変化"
		if (tvNTOA != null) {
			const tvTOA = lifespan * tvNTOA;
			if (tv) {
				// target velocity = tv + v
				// target=tvの関係にしたい
				a = tv / tvTOA;
				if (tv >= 0) vMax = tv + v;
				else vMin = tv + v;
			} else if (tvRelIV) { // target velocity = tvRelIV
				// TODO: impl
			}
		}

		// `trans_rotation_beh`
		//
		// `init_rotation` による rz, vrz (いずれも乱数)をベースに
		// 目標角度と目標角度到達時間を定める
		// コマンド: "Z軸回転速度変更"
		if (tvrzC != null && tvrzNTOA != null) {
			const trvz = vrz * tvrzC;
			const trvzTOA = lifespan * tvrzNTOA;
			arz = (trvz - vrz) / trvzTOA;
			if (trvz >= vrz) vrzMax = trvz;
			else vrzMin = trvz;
		}

		// `trans_size_beh`
		//
		// tsx, tsy, tsz を設定する。
		// それぞれに目標値（乱数）を与える。
		// コマンド: "スケール：変化"
		if (tsx) {
			vsx = (tsx - sx) / lifespan;
			vsxMin = sx;
			vsxMax = vsx;
			asx = 0;
			sxMin = sx;
			sxMax = tsx;
		}
		if (tsy) {
			vsy = (tsy - sy) / lifespan;
			vsyMax = vsy;
			asy = 0;
			syMin = sy;
			syMax = tsy;
		}
		if (tsxy) {
			vsxy = (tsxy - sxy) / lifespan;
			vsxMin = sxy;
			vsxyMax = vsxy;
			asxy = 0;
			sxyMin = sxy;
			sxyMax = tsxy;
		}

		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		return {
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

			sx: sx,
			sxMin: sxMin,
			sxMax: sxMax,

			vsx: vsx,
			vsxMin: vsxMin,
			vsxMax: vsxMax,

			asx: asx,
			asxMin: asxMin,
			asxMax: asxMax,

			sy: sy,
			syMin: syMin,
			syMax: syMax,

			vsy: vsy,
			vsyMin: vsyMin,
			vsyMax: vsyMax,

			asy: asy,
			asyMin: asyMin,
			asyMax: asyMax,

			sxy: sxy,
			sxyMin: sxyMin,
			sxyMax: sxyMax,

			vsxy: vsxy,
			vsxyMin: vsxyMin,
			vsxyMax: vsxyMax,

			asxy: asxy,
			asxyMin: asxyMin,
			asxyMax: asxyMax,

			alpha: alpha,
			fadeInNT: fadeInNT,
			fadeOutNT: fadeOutNT
		};
	}

	protected createParticle(x: number, y: number): Particle {
		return new Particle(this.createParticleParameterObject(x, y));
	}
}
