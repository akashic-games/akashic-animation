import type { Animation, Curve, CurveTie, KeyFrame } from "../../AnimeParams";
import { ipTypes } from "../../AnimeParams";
import type { ParticleInitialParameterObject } from "../../aps";
import { AttrId } from "../../AttrId";
import type { Bone } from "../../Bone";
import type { BoneSet } from "../../BoneSet";
import type { Cell } from "../../Cell";
import type { ColliderInfo } from "../../ColliderInfo";
import type { Skin } from "../../Skin";
import type { EffectParameterObject, EmitterParameterObject, EmitterParameterUserData } from "../../vfx";
import type { AOPSchema } from "./AOPSchema";
import type { MapperTable } from "./MapperTable";
import { PropertyIdMapper } from "./PropertyIdMapper";

function exportKeyFrame(
	keyFrame: KeyFrame<any>,
	mapperTable: MapperTable,
	valuePredicate?: (value: any) => any
): any[] {
	const mapper = mapperTable.keyFrame;

	const exported: any[] = [];

	put(exported, keyFrame, "time", mapper);
	put(exported, keyFrame, "value", mapper, valuePredicate);

	// undefined を出力するため、put を用いない
	exported[mapper.getIndex("ipType")] = keyFrame.ipType === undefined ? "undefined" : ipTypes.indexOf(keyFrame.ipType);

	put(exported, keyFrame, "ipCurve", mapper, ipCurve => ipCurve.values);

	return exported;
}

function exportKeyFrames(keyFrames: KeyFrame<any>[], mapperTable: MapperTable, valuePredicate?: (value: any) => any): any[] {
	return keyFrames.map(
		keyFrame => exportKeyFrame(keyFrame, mapperTable, valuePredicate)
	);
}

function exportCurve(curve: Curve<any>, mapperTable: MapperTable): any[] {
	const exported: any[] = [];

	const mapper = mapperTable.curve;
	const attrId = AttrId[curve.attribute as keyof typeof AttrId];
	if (attrId === undefined) {
		throw new Error(`Unknown attribute: ${curve.attribute}`);
	}

	// TODO: put()を使う
	exported[mapper.getIndex("attribute")] = attrId;
	exported[mapper.getIndex("keyFrames")] = exportKeyFrames(
		curve.keyFrames,
		mapperTable,
		curve.attribute === "cv"
			? (value: any) => {
				// cell value は スキン名とセル名の辞書を作成し、そのインデックスを格納する
				return [
					mapperTable.skinName.getIndex(value.skinName),
					mapperTable.cellName.getIndex(value.cellName)
				];
			}
			: curve.attribute === "effect"
				? (value: any) => value.emitterOp
				: (value: any) => {
					if (typeof value === "boolean") {
						return value ? 1 : 0;
					}
					return value;
				}
	);

	return exported;
}

function exportCurves(curves: Curve<any>[], mapperTable: MapperTable): any[] {
	const exported: any[] = [];

	for (const curve of curves) {
		exported.push(exportCurve(curve, mapperTable));
	}

	return exported;
}

function exportCurveTie(
	curveTie: CurveTie,
	mapperTable: MapperTable
): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.curveTie;

	put(exported, curveTie, "boneName", mapper, name => mapperTable.boneName.getIndex(name));
	put(exported, curveTie, "curves", mapper, curves => exportCurves(curves, mapperTable));

	return exported;
}

function exportCurveTies(
	curveTies: { [key: string]: CurveTie },
	mapperTable: MapperTable
): any[] {
	const exported: any[] = [];

	// curveTies["bone_name"] === curveTies["bone_name"].name
	// なのでキーをシリアライズしない。
	for (const key in curveTies) {
		if (Object.prototype.hasOwnProperty.call(curveTies, key)) {
			const curveTie = curveTies[key];
			exported.push(exportCurveTie(curveTie, mapperTable));
		}
	}

	return exported;
}

/**
 * オブジェクトのデータを配列に格納する。
 *
 * src[key] === undefined の時、何もしない。
 *
 * @param dst データを格納する配列
 * @param src 格納するデータを持つオブジェクト
 * @param key データのキー
 * @param mapper プロパティ名とインデックスの対応表
 * @param exporter データを配列に変換する関数。省略時 src[key] がそのまま格納される
 */
function put<T extends object>(
	dst: any[],
	src: T,
	key: Extract<keyof T, string>,
	mapper: PropertyIdMapper<T>,
	exporter?: (src: any) => any
): void {
	// undefined を配列に格納すると JSON では null になる。
	// そのため undefined は格納しない。
	if (src[key] === undefined) {
		return;
	}
	const idx = mapper.getIndex(key);
	dst[idx] = exporter ? exporter(src[key]) : src[key];
}

function exportVector(vec: { x: number; y: number }): number[] {
	return [vec.x, vec.y];
}

function exportColliderInfo(colliderInfo: ColliderInfo, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.colliderInfo;

	put(exported, colliderInfo, "geometryType", mapper);
	put(exported, colliderInfo, "boundType", mapper);
	put(exported, colliderInfo, "cellName", mapper);
	put(exported, colliderInfo, "center", mapper, exportVector);
	put(exported, colliderInfo, "radius", mapper);
	put(exported, colliderInfo, "scaleOption", mapper);
	put(exported, colliderInfo, "width", mapper);
	put(exported, colliderInfo, "height", mapper);

	return exported;
}

function exportColliderInfos(colliderInfos: ColliderInfo[], mapperTable: MapperTable): any[] {
	const exported: any[] = [];

	for (const colliderInfo of colliderInfos) {
		exported.push(exportColliderInfo(colliderInfo, mapperTable));
	}

	return exported;
}

function exportBone(bone: Bone, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.bone;

	put(exported, bone, "parentIndex", mapper);
	put(exported, bone, "name", mapper, name => mapperTable.boneName.getIndex(name));
	put(exported, bone, "children", mapper);
	put(exported, bone, "arrayIndex", mapper);
	put(exported, bone, "colliderInfos", mapper, colliderInfos => exportColliderInfos(colliderInfos, mapperTable));
	put(exported, bone, "alphaBlendMode", mapper);
	put(exported, bone, "effectName", mapper);

	return exported;
}

function exportBones(bones: Bone[], mapperTable: MapperTable): any[] {
	const exported: any[] = [];

	for (const bone of bones) {
		exported.push(exportBone(bone, mapperTable));
	}

	return exported;
}

function exportSize(size: { width: number; height: number }): number[] {
	return [size.width, size.height];
}

function exportCell(cell: Cell, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.cell;

	put(exported, cell, "name", mapper, name => mapperTable.cellName.getIndex(name));
	put(exported, cell, "pos", mapper, exportVector);
	put(exported, cell, "size", mapper, exportSize);
	put(exported, cell, "pivot", mapper, exportVector);
	put(exported, cell, "rz", mapper);

	return exported;
}

function exportCells(cells: { [key: string]: Cell }, mapperTable: MapperTable): any[] {
	const exported: any[] = [];

	for (const key in cells) {
		if (Object.prototype.hasOwnProperty.call(cells, key)) {
			exported.push(exportCell(cells[key], mapperTable));
		}
	}

	return exported;
}

function exportParticleInitialParameter(initParam: ParticleInitialParameterObject, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.particleInitialParam;

	// 全て単純な number[] 型なのでループで処理する
	for (const key in initParam) {
		if (Object.prototype.hasOwnProperty.call(initParam, key)) {
			put(exported, initParam, key as keyof typeof initParam, mapper);
		}
	}

	return exported;
}

function exportEmitterUserData(userData: EmitterParameterUserData, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.emitterUserData;

	put(exported, userData, "skinName", mapper, name => mapperTable.skinName.getIndex(name));
	put(exported, userData, "cellName", mapper, name => mapperTable.cellName.getIndex(name));
	put(exported, userData, "alphaBlendMode", mapper);

	return exported;
}

function exportEmitterParameter(emitterParam: EmitterParameterObject, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.emitterParam;

	// APS
	put(exported, emitterParam, "gx", mapper);
	put(exported, emitterParam, "gy", mapper);
	put(exported, emitterParam, "interval", mapper);
	put(exported, emitterParam, "activePeriod", mapper);
	put(exported, emitterParam, "delayEmit", mapper);
	put(exported, emitterParam, "numParticlesPerEmit", mapper);
	put(exported, emitterParam, "maxParticles", mapper);
	// children: Emitter[] はエクスポートしない
	put(exported, emitterParam, "initParam", mapper, initParam => exportParticleInitialParameter(initParam, mapperTable));

	// VFX
	put(exported, emitterParam, "parentIndex", mapper);
	// APS は userData: any だが、VFX つまり ASA のレイヤでは userData の型が
	// 定義されているので、それに合わせた形aでエクスポートする。
	put(exported, emitterParam, "userData", mapper, userData => exportEmitterUserData(userData, mapperTable));

	return exported;
}

function exportEmitterParameters(emitterParams: EmitterParameterObject[], mapperTable: MapperTable): any[] {
	const exported: any[] = [];

	for (const emitterParam of emitterParams) {
		exported.push(exportEmitterParameter(emitterParam, mapperTable));
	}

	return exported;
}

function createMappterTable(): MapperTable {
	const mapperTable: MapperTable = {
		// プロパティ名をキーとして、インデックスを格納する
		animation: new PropertyIdMapper<Animation>(),
		curveTie: new PropertyIdMapper<CurveTie>(),
		curve: new PropertyIdMapper<Curve<any>>(),
		keyFrame: new PropertyIdMapper<KeyFrame<any>>(),

		boneSet: new PropertyIdMapper<BoneSet>(),
		bone: new PropertyIdMapper<Bone>(),
		colliderInfo: new PropertyIdMapper<ColliderInfo>(),

		skin: new PropertyIdMapper<Skin>(),
		cell: new PropertyIdMapper<Cell>(),

		effectParam: new PropertyIdMapper<EffectParameterObject>(),
		emitterParam: new PropertyIdMapper<EmitterParameterObject>(),
		particleInitialParam: new PropertyIdMapper<ParticleInitialParameterObject>(),
		emitterUserData: new PropertyIdMapper<EmitterParameterUserData>(),

		// ボーン名などの文字列を短縮するために数値で置き換える
		boneName: new PropertyIdMapper<{ [key: string]: string }>(),
		skinName: new PropertyIdMapper<{ [key: string]: string }>(),
		cellName: new PropertyIdMapper<{ [key: string]: string }>(),
	};
	return mapperTable;
}

export class AOPExporter {
	private mapperTable: MapperTable;

	constructor() {
		this.mapperTable = createMappterTable();
	}

	exportAnimation(anim: Animation): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.animation;
		const exported: any[] = [];

		exported[mapper.getIndex("name")] = anim.name;
		exported[mapper.getIndex("fps")] = anim.fps;
		exported[mapper.getIndex("frameCount")] = anim.frameCount;
		exported[mapper.getIndex("curveTies")] = exportCurveTies(anim.curveTies, mapperTable);

		return exported;
	}

	exportBoneSet(boneSet: BoneSet): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.boneSet;
		const exported: any[] = [];

		put(exported, boneSet, "name", mapper);
		put(exported, boneSet, "bones", mapper, bones => exportBones(bones, mapperTable));

		return exported;
	}

	exportSkin(skin: Skin): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.skin;
		const exported: any[] = [];

		put(exported, skin, "name", mapper, name => mapperTable.skinName.getIndex(name));
		put(exported, skin, "imageAssetName", mapper);
		put(exported, skin, "imageSizeH", mapper);
		put(exported, skin, "imageSizeW", mapper);
		put(exported, skin, "cells", mapper, cells => exportCells(cells, mapperTable));

		return exported;
	}

	exportEffect(effectParam: EffectParameterObject): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.effectParam;
		const exported: any[] = [];

		put(exported, effectParam, "name", mapper);
		put(exported, effectParam, "emitterParameters", mapper,
			emitterParams => exportEmitterParameters(emitterParams, mapperTable)
		);

		return exported;
	}

	getSchema(): AOPSchema {
		const mapperTable = this.mapperTable;

		return {
			type: "aop",
			propertyIdMaps: {
				animation: mapperTable.animation.properties,
				curveTie: mapperTable.curveTie.properties,
				curve: mapperTable.curve.properties,
				keyFrame: mapperTable.keyFrame.properties,

				boneSet: mapperTable.boneSet.properties,
				bone: mapperTable.bone.properties,
				colliderInfo: mapperTable.colliderInfo.properties,

				skin: mapperTable.skin.properties,
				cell: mapperTable.cell.properties,

				effectParam: mapperTable.effectParam.properties,
				emitterParam: mapperTable.emitterParam.properties,
				particleInitialParam: mapperTable.particleInitialParam.properties,
				emitterUserData: mapperTable.emitterUserData.properties,

				boneName: mapperTable.boneName.properties,
				skinName: mapperTable.skinName.properties,
				cellName: mapperTable.cellName.properties
			}
		};
	}
}
