import type { Animation, Curve, CurveTie, KeyFrame } from "../../AnimeParams";
import type * as aps from "../../aps";
import type { Bone } from "../../Bone";
import type { BoneSet } from "../../BoneSet";
import type { Cell } from "../../Cell";
import type { ColliderInfo } from "../../ColliderInfo";
import type { Skin } from "../../Skin";
import type { EffectParameterObject, EmitterParameterObject, EmitterParameterUserData } from "../../vfx";
import type { PropertyIndexMapper } from "./PropertyIdMapper";

/**
 * マッパーテーブル。
 *
 * 各種オブジェクトのマッパーの一覧。
 *
 * プロパティ名以外にも、ボーン名などの何度も現れる文字列を数値で表すための
 * マッパーを持つ。
 */
export interface MapperTable {
	animation: PropertyIndexMapper<Animation>;
	curveTie: PropertyIndexMapper<CurveTie>;
	curve: PropertyIndexMapper<Curve<any>>;
	keyFrame: PropertyIndexMapper<KeyFrame<any>>;

	boneSet: PropertyIndexMapper<BoneSet>;
	bone: PropertyIndexMapper<Bone>;
	colliderInfo: PropertyIndexMapper<ColliderInfo>;

	skin: PropertyIndexMapper<Skin>;
	cell: PropertyIndexMapper<Cell>;

	effectParam: PropertyIndexMapper<EffectParameterObject>;
	emitterParam: PropertyIndexMapper<EmitterParameterObject>;
	particleInitialParam: PropertyIndexMapper<aps.ParticleInitialParameterObject>;
	emitterUserData: PropertyIndexMapper<EmitterParameterUserData>;

	boneName: PropertyIndexMapper<{ [key: string]: string }>;
	skinName: PropertyIndexMapper<{ [key: string]: string }>;
	cellName: PropertyIndexMapper<{ [key: string]: string }>;
	effectName: PropertyIndexMapper<{ [key: string]: string }>;
}
