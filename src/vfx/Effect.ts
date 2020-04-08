import * as aps from "../aps";
import {Emitter, EmitterParameterObject} from "./Emitter";

let randomGenerator: g.RandomGenerator;
let defaultRandomFunc: () => number;

function getDefaultRandomFunc(): () => number {
	if (! defaultRandomFunc) {
		randomGenerator = new g.XorshiftRandomGenerator(Date.now());
		defaultRandomFunc = () => randomGenerator.get(0, 65535) / 65535;
	}
	return defaultRandomFunc;
}

/**
 * シリアライズされた時加えられる情報を定義した EmitterParameterObject 。
 */
export interface EffectEmitterParameterObject extends EmitterParameterObject {
	parentIndex: number;
}

/**
 * createEffect() に渡すパラメータ。
 */
export interface EffectParameterObject {
	name: string;
	emitterParameters: EffectEmitterParameterObject[];

	/**
	 * 0 ~ 1 の値を返すランダム関数。
	 *
	 * パーティクル放出時などに用いられる。
	 * 省略された時、akashic-animationの抱え持つランダム関数が用いられる。
	 * またリプレイやマルチプレイにおいてパーティクルの状態は一致しなくなる。
	 */
	randomFunc?: () => number;
}

/**
 * エフェクト。
 */
export interface Effect {
	name: string;
	particleSystem: aps.ParticleSystem;
}

/**
 * エフェクトの状態操作定数。
 */
export enum EmitterOperation {
	start = 0,
	stop = 1
}

/**
 * エフェクトのキーフレームデータ。
 */
export interface EffectValue {
	emitterOp: EmitterOperation;
}

/**
 * デシリアライズされた EmitterParameterObject から不足した情報を埋め合わたオブジェクトを返す。
 *
 * @param edata 情報が不足しているかもしれないパラメータ。
 * @param randomFunc この関数が返す EmitterParameterObject に与えるランダム関数。
 */
function normalizeEmitterParameter(edata: EmitterParameterObject, randomFunc: () => number): EmitterParameterObject {
	const getValue = <T>(data: any, def: T): T => typeof data === typeof def ? data : def;
	const pdata = edata.initParam;

	return {
		gx: getValue(edata.gx, 0),
		gy: getValue(edata.gy, 0),
		interval: getValue(edata.interval, 1),
		activePeriod: getValue(edata.activePeriod, 1),
		delayEmit: getValue(edata.delayEmit, 0),
		maxParticles: getValue(edata.maxParticles, 0),
		numParticlesPerEmit: getValue(edata.numParticlesPerEmit, 1),
		children: [],
		randomFunc: randomFunc,
		initParam: {
			tx: pdata.tx || [0],
			ty: pdata.ty || [0],
			v: pdata.v || [0],
			a: pdata.a || [0],
			angle: pdata.angle || [0],
			rz: pdata.rz || [0],
			sx: pdata.sx || [1],
			sy: pdata.sy || [1],
			sxy: pdata.sxy || [1],
			alpha: pdata.alpha || [1],
			lifespan: pdata.lifespan || [0],
			//
			vrz: pdata.vrz || [0],
			velocityTransition: pdata.velocityTransition,
			angularVelocityTransition: pdata.angularVelocityTransition,
			scaleXTransition: pdata.scaleXTransition,
			scaleYTransition: pdata.scaleYTransition,
			scaleXYTransition: pdata.scaleXYTransition,
			alphaTransition: pdata.alphaTransition
		},
		material: {
			skinName: edata.material.skinName,
			cellName: edata.material.cellName,
			alphaBlendMode: edata.material.alphaBlendMode
		}
	};
}

/**
 * エフェクトを生成する。
 *
 * @param effParam エフェクトを生成するためのパラメータ。
 */
export function createEffect(effParam: EffectParameterObject): Effect {
	// エミッタ生成。
	const emitters: Emitter[] = [];
	const randomFunc = effParam.randomFunc || getDefaultRandomFunc();
	for (let i = 0; i < effParam.emitterParameters.length; i++) {
		const param = normalizeEmitterParameter(effParam.emitterParameters[i], randomFunc);
		emitters.push(new Emitter(param));
	}

	const ps = new aps.ParticleSystem();

	// エミッタツリー構築。
	for (let i = 0; i < effParam.emitterParameters.length; i++) {
		const edata = effParam.emitterParameters[i];
		if (edata.parentIndex >= 0) {
			emitters[edata.parentIndex].children.push(emitters[i]);
		} else {
			ps.addEmitter(emitters[i]);
		}
	}

	return {
		name: effParam.name,
		particleSystem: ps
	};
}
