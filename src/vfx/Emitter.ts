import {AlphaBlendMode} from "..";
import * as aps from "../aps";
import {Particle, ParticleParameterObject, Transition} from "./Particle";

// function limit(val: number, min: number, max: number): number {
// 	if (min != null && val < min) return min;
// 	else if (max != null && val > max) return max;
// 	else return val;
// }

// 乱数を定数に置き換える。
function createFixedTransition(src: Transition, randomFunc: () => number): Transition {
	if (!src) return null;

	const points: number[] = [];
	let i;
	// src.pointsが正しい内容の時、src.points.lengthの取りうる値は
	// 初項 2, 公差 3 の等差数列になる。
	for (i = 0; src.points.length - i >= 5; i += 3) {
		const t = randomFunc();
		points.push(src.points[i]);
		points.push(src.points[i + 1] * (1 - t) + src.points[i + 2] * t);
	}

	const t = randomFunc();
	points.push(src.points[i] * (1 - t) + src.points[i + 1] * t);

	return {
		multipyInitialValue: src.multipyInitialValue,
		points: points
	};
}

/**
 *
 */
function calcCurrentValue(points: number[], initialValue: number, t: number): number {
	let t0 = 0;
	let v0 = initialValue;
	for (let i = 0; i < points.length; i += 2) {
		if (points.length - i === 1) {
			const deno = (1 - t0);
			t = deno !== 0 ? (t - t0) / deno : 1;
			return v0 * (1 - t) + points[i] * t;
		} else if (t < points[i]) {
			const deno = (points[i] - t0);
			t = deno !== 0 ? (t - t0) / deno : 1;
			return v0 * (1 - t) + points[i + 1] * t;
		} else {
			t0 = points[i];
			v0 = points[i + 1];
		}
	}
}

/**
 * Emitterがパーティクルを初期化するときに利用するパラメータ。
 */
export interface ParticleInitialParameterObject extends aps.BasicParticleInitialParameterObject {
	vrz: number[];
	sxy: number[];
	velocityTransition: Transition;
	angularVelocityTransition: Transition;
	scaleXTransition: Transition;
	scaleYTransition: Transition;
	scaleXYTransition: Transition;
	alphaTransition: Transition;
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
	material: Material;
}

/**
 * エフェクトで用いるエミッタ。
 */
export class Emitter extends aps.BasicEmitter {
	particles: Particle[];
	initParam: ParticleInitialParameterObject;

	material: Material;

	constructor(param: EmitterParameterObject) {
		super(param);

		this.initParam.vrz = param.initParam.vrz;
		this.initParam.sxy = param.initParam.sxy;
		this.initParam.velocityTransition = param.initParam.velocityTransition;
		this.initParam.angularVelocityTransition = param.initParam.angularVelocityTransition;
		this.initParam.scaleXTransition = param.initParam.scaleXTransition;
		this.initParam.scaleYTransition = param.initParam.scaleYTransition;
		this.initParam.scaleXYTransition = param.initParam.scaleXYTransition;
		this.initParam.alphaTransition = param.initParam.alphaTransition;
		this.material = param.material;
	}

	protected updateParticle(p: Particle, dt: number): void {
		const t = p.elapse / p.lifespan;

		if (! p.velocityTransition) {
			super.updateParticle(p, dt);
		} else {
			const v = calcCurrentValue(p.velocityTransition.points, p.v0, t);
			p.tx += v * p.cosFireAngle * dt;
			p.ty += v * p.sinFireAngle * dt;
		}

		if (p.angularVelocityTransition) {
			const c = calcCurrentValue(p.angularVelocityTransition.points, 1, t);
			p.vrz = p.vrz0 * c;
		}
		p.rz += p.vrz * dt;

		const sx = p.scaleXTransition ? calcCurrentValue(p.scaleXTransition.points, p.sx0, t) : p.sx0;
		const sy = p.scaleYTransition ? calcCurrentValue(p.scaleYTransition.points, p.sy0, t) : p.sy0;
		const sxy = p.scaleXYTransition ? calcCurrentValue(p.scaleXYTransition.points, p.sxy0, t) : p.sxy0;
		p.sx = sx * sxy;
		p.sy = sy * sxy;

		if (p.alphaTransition) {
			p.alpha = calcCurrentValue(p.alphaTransition.points, 0, t);
		}
	}

	protected createParticleParameterObject(x: number, y: number): ParticleParameterObject {
		const tx = this.pickParam(this.initParam.tx, 0);
		const ty = this.pickParam(this.initParam.ty, 0);
		const v = this.pickParam(this.initParam.v, 0);
		const a = this.pickParam(this.initParam.a, 0);
		const angle = this.pickParam(this.initParam.angle, 0);
		const rz = this.pickParam(this.initParam.rz, 0);
		const sx = this.pickParam(this.initParam.sx, 1);
		const sy = this.pickParam(this.initParam.sy, 1);
		const sxy = this.pickParam(this.initParam.sxy, 1);
		const alpha = this.pickParam(this.initParam.alpha, 1);
		const lifespan = this.pickParam(this.initParam.lifespan, 1);

		const vrz = this.pickParam(this.initParam.vrz, 0);
		const cosFireAngle = Math.cos(angle);
		const sinFireAngle = Math.sin(angle);

		return {
			lifespan: lifespan,
			tx: x + tx,
			ty: y + ty,
			vx: cosFireAngle * v,
			vy: sinFireAngle * v,
			ax: cosFireAngle * a,
			ay: sinFireAngle * a,
			rz: rz,
			sx: sx * sxy,
			sy: sy * sxy,
			//
			vrz: vrz,
			v0: v,
			vrz0: vrz,
			sx0: sx,
			sy0: sy,
			sxy0: sxy,
			alpha: alpha,
			cosFireAngle: cosFireAngle,
			sinFireAngle: sinFireAngle,
			velocityTransition: createFixedTransition(this.initParam.velocityTransition, this.randomFunc),
			angularVelocityTransition: createFixedTransition(this.initParam.angularVelocityTransition, this.randomFunc),
			scaleXTransition: createFixedTransition(this.initParam.scaleXTransition, this.randomFunc),
			scaleYTransition: createFixedTransition(this.initParam.scaleYTransition, this.randomFunc),
			scaleXYTransition: createFixedTransition(this.initParam.scaleXYTransition, this.randomFunc),
			alphaTransition: createFixedTransition(this.initParam.alphaTransition, this.randomFunc)
		};
	}

	protected createParticle(x: number, y: number): Particle {
		return new Particle(this.createParticleParameterObject(x, y));
	}
}
