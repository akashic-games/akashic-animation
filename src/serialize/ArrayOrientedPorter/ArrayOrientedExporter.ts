import { alphaBlendModes } from "../../AlphaBlendMode";
import type { AlphaBlendMode } from "../../AlphaBlendMode";
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
import { PropertyIndexMapper } from "./PropertyIndexMapper";

/**
 * put() のオプション。
 */
interface PutOption {
	/**
	 * データを格納する前に加工する。
	 *
	 * 省略時 src[key] がそのまま格納される
	 */
	exporter?: (src: any) => any;

	/**
	 * 真の時、src[key] が undefined でも exporter に値を渡す。
	 *
	 * 省略時、偽。
	 */
	handleUndefined?: boolean;
}

/**
 * オブジェクトの値を配列に格納する。
 *
 * src[key] === undefined の時、何もしない。
 *
 * @param dst データを格納する配列
 * @param src 格納するデータを持つオブジェクト
 * @param key データのキー
 * @param mapper プロパティ名とインデックスの対応表
 * @param exporter
 * @param opt オプション
 */
function put<T extends object>(
	dst: any[],
	src: T,
	key: Extract<keyof T, string>,
	mapper: PropertyIndexMapper<T>,
	opt?: PutOption,
): void {
	const { exporter, handleUndefined } = opt ?? {};
	// undefined を配列に格納すると JSON では null になる。
	// そのため undefined は格納しない。
	const value = exporter != null
		? src[key] !== undefined || handleUndefined
			? exporter(src[key])
			: src[key]
		: src[key];
	if (value === undefined) {
		return;
	}
	const idx = mapper.getIndex(key);
	dst[idx] = value;
}

function exportIpType(ipType: any): number {
	return ipType === undefined ? -1 : ipTypes.indexOf(ipType);
}

function exportIpCurve(ipCurve: any): number[] {
	return ipCurve.values;
}

function exportKeyFrame(
	keyFrame: KeyFrame<any>,
	mapperTable: MapperTable,
	exporter?: (value: any) => any
): any[] {
	const mapper = mapperTable.keyFrame;

	const exported: any[] = [];

	put(exported, keyFrame, "time", mapper);
	put(exported, keyFrame, "value", mapper, { exporter });
	put(exported, keyFrame, "ipType", mapper, {
		exporter: exportIpType,
		handleUndefined: true,
	});
	put(exported, keyFrame, "ipCurve", mapper, { exporter: exportIpCurve });

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

	put(exported, curve, "attribute", mapper, {
		exporter: attribute => {
			const attrId = AttrId[attribute as keyof typeof AttrId];
			if (attrId === undefined) {
				throw new Error(`Unknown curve attribute: ${curve.attribute}`);
			}
			return attrId;
		}
	});

	let keyFrameValueExporter: (value: any) => any;

	if (curve.attribute === "cv") {
		keyFrameValueExporter = value => [
			mapperTable.skinName.getIndex(value.skinName),
			mapperTable.cellName.getIndex(value.cellName)
		];
	} else if (curve.attribute === "effect") {
		keyFrameValueExporter = value => value.emitterOp;
	} else {
		keyFrameValueExporter = value => typeof value === "boolean" ? (value ? 1 : 0) : value;
	}

	put(exported, curve, "keyFrames", mapper, {
		exporter: keyFrames => exportKeyFrames(keyFrames, mapperTable, keyFrameValueExporter)
	});

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

	put(exported, curveTie, "boneName", mapper, {
		exporter: name => mapperTable.boneName.getIndex(name)
	});
	put(exported, curveTie, "curves", mapper, {
		exporter: curves => exportCurves(curves, mapperTable)
	});

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

function exportVector(vec: { x: number; y: number }): number[] {
	return [vec.x, vec.y];
}

function exportColliderInfo(colliderInfo: ColliderInfo, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.colliderInfo;

	put(exported, colliderInfo, "geometryType", mapper);
	put(exported, colliderInfo, "boundType", mapper);
	put(exported, colliderInfo, "cellName", mapper);
	put(exported, colliderInfo, "center", mapper, { exporter: exportVector });
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
	put(exported, bone, "name", mapper, {
		exporter: name => mapperTable.boneName.getIndex(name)
	});

	// children はエクスポートしない

	put(exported, bone, "arrayIndex", mapper);
	put(exported, bone, "colliderInfos", mapper, {
		exporter: colliderInfos => exportColliderInfos(colliderInfos, mapperTable)
	});
	put(exported, bone, "alphaBlendMode", mapper, {
		exporter: exportAlphaBlendMode,
		handleUndefined: true
	});
	put(exported, bone, "effectName", mapper, {
		exporter: name => mapperTable.effectName.getIndex(name)
	});

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

	put(exported, cell, "name", mapper, {
		exporter: name => mapperTable.cellName.getIndex(name)
	});
	put(exported, cell, "pos", mapper, { exporter: exportVector });
	put(exported, cell, "size", mapper, { exporter: exportSize });
	put(exported, cell, "pivot", mapper, { exporter: exportVector });
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

function exportAlphaBlendMode(mode: AlphaBlendMode | undefined): number {
	return mode === undefined ? -1 : alphaBlendModes.indexOf(mode);
}

function exportEmitterUserData(userData: EmitterParameterUserData, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.emitterUserData;

	put(exported, userData, "skinName", mapper, {
		exporter: name => mapperTable.skinName.getIndex(name)
	});
	put(exported, userData, "cellName", mapper, {
		exporter: name => mapperTable.cellName.getIndex(name)
	});
	put(exported, userData, "alphaBlendMode", mapper, { exporter: exportAlphaBlendMode });

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
	// children はエクスポートしない
	put(exported, emitterParam, "initParam", mapper, {
		exporter: initParam => exportParticleInitialParameter(initParam, mapperTable)
	});

	// VFX
	put(exported, emitterParam, "parentIndex", mapper);
	// APS では userData: any だが、VFX つまり ASA のレイヤでは userData の型が
	// 定義されているので、それに合わせた形でエクスポートする。
	put(exported, emitterParam, "userData", mapper, {
		exporter: userData => exportEmitterUserData(userData, mapperTable)
	});

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
		animation: new PropertyIndexMapper<Animation>(),
		curveTie: new PropertyIndexMapper<CurveTie>(),
		curve: new PropertyIndexMapper<Curve<any>>(),
		keyFrame: new PropertyIndexMapper<KeyFrame<any>>(),

		boneSet: new PropertyIndexMapper<BoneSet>(),
		bone: new PropertyIndexMapper<Bone>(),
		colliderInfo: new PropertyIndexMapper<ColliderInfo>(),

		skin: new PropertyIndexMapper<Skin>(),
		cell: new PropertyIndexMapper<Cell>(),

		effectParam: new PropertyIndexMapper<EffectParameterObject>(),
		emitterParam: new PropertyIndexMapper<EmitterParameterObject>(),
		particleInitialParam: new PropertyIndexMapper<ParticleInitialParameterObject>(),
		emitterUserData: new PropertyIndexMapper<EmitterParameterUserData>(),

		// ボーン名などの文字列を短縮するために数値で置き換える
		boneName: new PropertyIndexMapper<{ [key: string]: string }>(),
		skinName: new PropertyIndexMapper<{ [key: string]: string }>(),
		cellName: new PropertyIndexMapper<{ [key: string]: string }>(),
		effectName: new PropertyIndexMapper<{ [key: string]: string }>(),
	};
	return mapperTable;
}

/**
 * AOP形式のエクスポータ。
 */
export class ArrayOrientedExporter {
	private mapperTable: MapperTable;

	constructor() {
		this.mapperTable = createMappterTable();
	}

	exportAnimation(anim: Animation): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.animation;
		const exported: any[] = [];

		// アニメーション名は繰り返さないのでそのまま格納する
		put(exported, anim, "name", mapper);
		put(exported, anim, "fps", mapper);
		put(exported, anim, "frameCount", mapper);
		put(exported, anim, "curveTies", mapper, {
			exporter: curveTies => exportCurveTies(curveTies, mapperTable)
		});

		return exported;
	}

	exportBoneSet(boneSet: BoneSet): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.boneSet;
		const exported: any[] = [];

		put(exported, boneSet, "name", mapper);
		put(exported, boneSet, "bones", mapper, {
			exporter: bones => exportBones(bones, mapperTable)
		});

		return exported;
	}

	exportSkin(skin: Skin): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.skin;
		const exported: any[] = [];

		put(exported, skin, "name", mapper, {
			exporter: name => mapperTable.skinName.getIndex(name)
		});
		put(exported, skin, "imageAssetName", mapper);
		put(exported, skin, "imageSizeH", mapper);
		put(exported, skin, "imageSizeW", mapper);
		put(exported, skin, "cells", mapper, {
			exporter: cells => exportCells(cells, mapperTable)
		});

		return exported;
	}

	exportEffect(effectParam: EffectParameterObject): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.effectParam;
		const exported: any[] = [];

		put(exported, effectParam, "name", mapper, {
			exporter: name => mapperTable.effectName.getIndex(name)
		});
		put(exported, effectParam, "emitterParameters", mapper, {
			exporter: emitterParams => exportEmitterParameters(emitterParams, mapperTable)
		});

		return exported;
	}

	getSchema(): AOPSchema {
		const mapperTable = this.mapperTable;

		return {
			type: "aop",
			version: "1.0.0",
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
				cellName: mapperTable.cellName.properties,
				effectName: mapperTable.effectName.properties,
			}
		};
	}
}
