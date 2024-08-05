import type { Animation, Curve, CurveTie, KeyFrame } from "../../AnimeParams";
import type { ParticleInitialParameterObject } from "../../aps";
import type { Bone } from "../../Bone";
import type { BoneSet } from "../../BoneSet";
import type { Cell } from "../../Cell";
import type { ColliderInfo } from "../../ColliderInfo";
import type { Skin } from "../../Skin";
import type { EffectParameterObject, EmitterParameterObject, EmitterParameterUserData } from "../../vfx";

export interface PropertyIdMaps {
	animation: Array<Extract<keyof Animation, string>>;
	curveTie: Array<Extract<keyof CurveTie, string>>;
	curve: Array<Extract<keyof Curve<any>, string>>;
	keyFrame: Array<Extract<keyof KeyFrame<any>, string>>;

	boneSet: Array<Extract<keyof BoneSet, string>>;
	bone: Array<Extract<keyof Bone, string>>;
	colliderInfo: Array<Extract<keyof ColliderInfo, string>>;

	skin: Array<Extract<keyof Skin, string>>;
	cell: Array<Extract<keyof Cell, string>>;

	effectParam: Array<Extract<keyof EffectParameterObject, string>>;
	emitterParam: Array<Extract<keyof EmitterParameterObject, string>>;
	particleInitialParam: Array<Extract<keyof ParticleInitialParameterObject, string>>;
	emitterUserData: Array<Exclude<keyof EmitterParameterUserData, "userData">>;

	boneName: string[];
	skinName: string[];
	cellName: string[];
}
