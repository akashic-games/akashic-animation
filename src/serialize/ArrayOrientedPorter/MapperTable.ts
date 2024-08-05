import type { Animation, Curve, CurveTie, KeyFrame } from "../../AnimeParams";
import type * as aps from "../../aps";
import type { Bone } from "../../Bone";
import type { BoneSet } from "../../BoneSet";
import type { Cell } from "../../Cell";
import type { ColliderInfo } from "../../ColliderInfo";
import type { Skin } from "../../Skin";
import type { EffectParameterObject, EmitterParameterObject, EmitterParameterUserData } from "../../vfx";
import type { PropertyIdMapper } from "./PropertyIdMapper";

export interface MapperTable {
	animation: PropertyIdMapper<Animation>;
	curveTie: PropertyIdMapper<CurveTie>;
	curve: PropertyIdMapper<Curve<any>>;
	keyFrame: PropertyIdMapper<KeyFrame<any>>;

	boneSet: PropertyIdMapper<BoneSet>;
	bone: PropertyIdMapper<Bone>;
	colliderInfo: PropertyIdMapper<ColliderInfo>;

	skin: PropertyIdMapper<Skin>;
	cell: PropertyIdMapper<Cell>;

	effectParam: PropertyIdMapper<EffectParameterObject>;
	emitterParam: PropertyIdMapper<EmitterParameterObject>;
	particleInitialParam: PropertyIdMapper<aps.ParticleInitialParameterObject>;
	emitterUserData: PropertyIdMapper<EmitterParameterUserData>;

	boneName: PropertyIdMapper<{ [key: string]: string }>;
	skinName: PropertyIdMapper<{ [key: string]: string }>;
	cellName: PropertyIdMapper<{ [key: string]: string }>;
}
