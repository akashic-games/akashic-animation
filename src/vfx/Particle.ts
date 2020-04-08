
import {BasicParticle, BasicParticleParameterObject} from "../aps";

/**
 * 推移する量。
 *
 * トランジションは時間とともに変化する量を表す。時刻は 0 ~ 1 の
 * 正規化された値を用いる。
 *
 * 時刻 0 の量を Transition では扱わない。Transition によって
 * 時間変化させる対象は Transition とは別に存在している、としている。
 *
 * Transition の実体は次のいずれかである。
 *
 * 1. 時刻とその時刻における量の組の配列
 * 2. 時刻とその時刻における量の最小値と最大値の組の配列
 *
 * ただし最後の時刻は必ず 1 であるとし、省略される。
 *
 * 2の形式ではトランジションの計算は最小値と最大値の範囲にある乱数を量とする。
 *
 * Transition が 1, 2 のいずれの形式であるかは Transition 自身は知らない。
 */
export interface Transition {
	/**
	 * transitionの値に対象となる量の初期値を乗算して利用する時、真。
	 */
	multipyInitialValue: boolean;

	/**
	 * 推移を表す時刻、最小値、最大値の並び。
	 *
	 * 配列は時刻と量の組の並びである。
	 */
	points: number[];
}

/**
 * Particle の初期化に用いるパラメータ。
 */
export interface ParticleParameterObject extends BasicParticleParameterObject {
	vrz: number;
	v0: number;
	vrz0: number;
	sx0: number;
	sy0: number;
	sxy0: number;
	cosFireAngle: number;
	sinFireAngle: number;
	velocityTransition: Transition;
	angularVelocityTransition: Transition;
	scaleXTransition: Transition;
	scaleYTransition: Transition;
	scaleXYTransition: Transition;
	alphaTransition: Transition;
}

/**
 * Emitter がエミットするパーティクル。
 */
export class Particle extends BasicParticle {
	vrz: number;
	v0: number;
	vrz0: number;
	sx0: number;
	sy0: number;
	sxy0: number;
	cosFireAngle: number;
	sinFireAngle: number;
	// TODO: 配列をでなくnumber型変数の並びにすることで高速化される可能性がある
	velocityTransition: Transition;
	angularVelocityTransition: Transition;
	scaleXTransition: Transition;
	scaleYTransition: Transition;
	scaleXYTransition: Transition;
	alphaTransition: Transition;

	constructor(param: ParticleParameterObject) {
		super(param);
		this.init(param);
	}

	init(param: ParticleParameterObject) {
		super.init(param);
		this.vrz = param.vrz;
		this.v0 = param.v0;
		this.vrz0 = param.vrz0;
		this.sx0 = param.sx0;
		this.sy0 = param.sy0;
		this.sxy0 = param.sxy0;
		this.cosFireAngle = param.cosFireAngle;
		this.sinFireAngle = param.sinFireAngle;
		this.velocityTransition = param.velocityTransition;
		this.angularVelocityTransition = param.angularVelocityTransition;
		this.scaleXTransition = param.scaleXTransition;
		this.scaleYTransition = param.scaleYTransition;
		this.scaleXYTransition = param.scaleXYTransition;
		this.alphaTransition = param.alphaTransition;
	}
}

