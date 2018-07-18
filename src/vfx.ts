import * as aps from "./aps";
import AlphaBlendMode = require("./AlphaBlendMode");

export interface EmitterParameterObject extends aps.EmitterParameterObject {
	parentIndex: number;
	userData: {
		skinName: string;
		cellName: string;
		alphaBlendMode: AlphaBlendMode;
	};
}

export interface EffectParameterObject {
	name: string;
	emitterParameters: EmitterParameterObject[];
	randomFunc?: () => number;
}

export interface Effect {
	name: string;
	particleSystem: aps.ParticleSystem;
}

export enum EmitterOperation {
	start = 0,
	stop = 1,
	pause = 2
}

export interface EffectValue {
	emitterOp: EmitterOperation;
}

export function createEffect(effParam: EffectParameterObject): Effect {
	const emitters: aps.Emitter[] = [];

	const randomFunc = effParam.randomFunc || (() => g.game.random.get(0, 65535) / 65535);
	const setValue = <T>(data: any, def: T): T => typeof data === typeof def ? data : def;

	for (let i = 0; i < effParam.emitterParameters.length; i++) {
		const edata = effParam.emitterParameters[i];
		const pdata = edata.initParam;

		const param: aps.EmitterParameterObject = {
			tx: 0,
			ty: 0,
			gx: setValue(edata.gx, 0),
			gy: setValue(edata.gy, 0),
			interval: setValue(edata.interval, 1),
			activePeriod: setValue(edata.activePeriod, 1),
			delayEmit: setValue(edata.delayEmit, 0),
			maxParticles: setValue(edata.maxParticles, 0),
			numParticlesPerEmit: setValue(edata.numParticlesPerEmit, 1),
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

				lifespan: pdata.lifespan || [0]
			},
			userData: {
				skinName: edata.userData.skinName,
				cellName: edata.userData.cellName,
				alphaBlendMode: edata.userData.alphaBlendMode
			}
		};

		emitters.push(new aps.Emitter(param));
	}

	const ps = new aps.ParticleSystem();

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
