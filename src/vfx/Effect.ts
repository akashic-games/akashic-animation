import * as aps from "../aps";
import {Emitter, EmitterParameterObject} from "./Emitter";

let randomGenerator: g.RandomGenerator;
let defaultRandomFunc: () => number;

function initDefaultRandomFunc(): () => number {
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
			txMin: pdata.txMin,
			txMax: pdata.txMax,

			ty: pdata.ty || [0],
			tyMin: pdata.tyMin,
			tyMax: pdata.tyMax,

			v: pdata.v || [0],
			vMin: pdata.tyMin,
			vMax: pdata.tyMax,

			tv: pdata.tv,
			tvRelIV: pdata.tvRelIV,
			tvNTOA: pdata.tvNTOA,

			a: pdata.a || [0],
			aMin: pdata.aMin,
			aMax: pdata.aMax,

			angle: pdata.angle || [0],

			rz: pdata.rz || [0],
			rzMin: pdata.rzMin,
			rzMax: pdata.rzMax,

			vrz: pdata.vrz || [0],
			vrzMin: pdata.vrzMin,
			vrzMax: pdata.vrzMax,

			tvrz: pdata.tvrz,
			tvrzRelIVRZ: pdata.tvrzRelIVRZ,
			tvrzC: pdata.tvrzC,
			tvrzNTOA: pdata.tvrzNTOA,

			arz: pdata.arz || [0],
			arzMin: pdata.arzMin,
			arzMax: pdata.arzMax,

			// scale
			sx: pdata.sx || [1],
			sxMin: pdata.sxMin,
			sxMax: pdata.sxMax,

			vsx: pdata.vsx || [0],
			vsxMin: pdata.vsxMin,
			vsxMax: pdata.vsxMax,

			asx: pdata.asx || [0],
			asxMin: pdata.asxMin,
			asxMax: pdata.asxMax,

			sy: pdata.sy || [1],
			syMin: pdata.syMin,
			syMax: pdata.syMax,

			vsy: pdata.vsy || [0],
			vsyMin: pdata.vsyMin,
			vsyMax: pdata.vsyMax,

			asy: pdata.asy || [0],
			asyMin: pdata.asyMin,
			asyMax: pdata.asyMax,

			sxy: pdata.sxy || [1],
			sxyMin: pdata.sxyMin,
			sxyMax: pdata.sxyMax,

			vsxy: pdata.vsxy || [0],
			vsxyMin: pdata.vsxyMin,
			vsxyMax: pdata.vsxyMax,

			asxy: pdata.asxy || [0],
			asxyMin: pdata.asxyMin,
			asxyMax: pdata.asxyMax,

			tsx: pdata.tsx,
			tsy: pdata.tsy,
			tsxy: pdata.tsxy,

			alpha: pdata.alpha || [1],
			fadeInNT: pdata.fadeInNT,
			fadeOutNT: pdata.fadeOutNT,

			lifespan: pdata.lifespan || [0]
		},
		userData: {
			skinName: edata.userData.skinName,
			cellName: edata.userData.cellName,
			alphaBlendMode: edata.userData.alphaBlendMode
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
	const randomFunc = effParam.randomFunc || initDefaultRandomFunc();
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
