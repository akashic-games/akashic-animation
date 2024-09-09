import { alphaBlendModes } from "../../AlphaBlendMode";
import type { AlphaBlendMode } from "../../AlphaBlendMode";
import type { Animation, CellValue, Curve, CurveTie, KeyFrame } from "../../AnimeParams";
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
interface StoreOption {
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
 * @param mapper プロパティ名とインデックスの対応
 * @param exporter
 * @param opts オプション
 */
function store<T extends object>(
	dst: any[],
	src: T,
	key: Extract<keyof T, string>,
	mapper: PropertyIndexMapper<T>,
	opts?: StoreOption,
): void {
	const { exporter, handleUndefined } = opts ?? {};
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

	store(exported, keyFrame, "time", mapper);
	store(exported, keyFrame, "value", mapper, { exporter });
	store(exported, keyFrame, "ipType", mapper, {
		exporter: exportIpType,
		handleUndefined: true,
	});
	store(exported, keyFrame, "ipCurve", mapper, { exporter: exportIpCurve });

	return exported;
}

function exportKeyFrames(keyFrames: KeyFrame<any>[], mapperTable: MapperTable, attribute: string): any[] {
	let exporter: (value: any) => any;

	if (attribute === "cv") {
		exporter = value => exportKeyFrameCellValue(value, mapperTable);
	} else if (attribute === "effect") {
		exporter = value => value.emitterOp;
	} else {
		exporter = value => typeof value === "boolean" ? (value ? 1 : 0) : value;
	}

	return keyFrames.map(
		keyFrame => exportKeyFrame(keyFrame, mapperTable, exporter)
	);
}

/**
 * CellValue をエクスポートする。
 *
 * スキン名とセル名のインデックスを、この順番で格納した配列を返す。
 *
 * @param value
 * @param mapperTable
 * @returns スキン名とセル名のインデックスの配列。
 */
function exportKeyFrameCellValue(value: CellValue, mapperTable: MapperTable): [number, number] {
	return [
		mapperTable.skinName.getIndex(value.skinName),
		mapperTable.cellName.getIndex(value.cellName)
	];
}

function exportCurve(curve: Curve<any>, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.curve;

	store(exported, curve, "attribute", mapper, {
		exporter: attribute => {
			const attrId = AttrId[attribute as keyof typeof AttrId];
			if (attrId === undefined) {
				throw new Error(`Unknown curve attribute: ${curve.attribute}`);
			}
			return attrId;
		}
	});

	store(exported, curve, "keyFrames", mapper, {
		exporter: keyFrames => exportKeyFrames(keyFrames, mapperTable, curve.attribute)
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

	store(exported, curveTie, "boneName", mapper, {
		exporter: name => mapperTable.boneName.getIndex(name)
	});
	store(exported, curveTie, "curves", mapper, {
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

	store(exported, colliderInfo, "geometryType", mapper);
	store(exported, colliderInfo, "boundType", mapper);
	store(exported, colliderInfo, "cellName", mapper);
	store(exported, colliderInfo, "center", mapper, { exporter: exportVector });
	store(exported, colliderInfo, "radius", mapper);
	store(exported, colliderInfo, "scaleOption", mapper);
	store(exported, colliderInfo, "width", mapper);
	store(exported, colliderInfo, "height", mapper);

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

	store(exported, bone, "parentIndex", mapper);
	store(exported, bone, "name", mapper, {
		exporter: name => mapperTable.boneName.getIndex(name)
	});

	// children はエクスポートしない

	store(exported, bone, "arrayIndex", mapper);
	store(exported, bone, "colliderInfos", mapper, {
		exporter: colliderInfos => exportColliderInfos(colliderInfos, mapperTable)
	});
	store(exported, bone, "alphaBlendMode", mapper, {
		exporter: exportAlphaBlendMode,
		handleUndefined: true
	});
	store(exported, bone, "effectName", mapper, {
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

	store(exported, cell, "name", mapper, {
		exporter: name => mapperTable.cellName.getIndex(name)
	});
	store(exported, cell, "pos", mapper, { exporter: exportVector });
	store(exported, cell, "size", mapper, { exporter: exportSize });
	store(exported, cell, "pivot", mapper, { exporter: exportVector });
	store(exported, cell, "rz", mapper);

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
			store(exported, initParam, key as keyof typeof initParam, mapper);
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

	store(exported, userData, "skinName", mapper, {
		exporter: name => mapperTable.skinName.getIndex(name)
	});
	store(exported, userData, "cellName", mapper, {
		exporter: name => mapperTable.cellName.getIndex(name)
	});
	store(exported, userData, "alphaBlendMode", mapper, { exporter: exportAlphaBlendMode });

	return exported;
}

function exportEmitterParameter(emitterParam: EmitterParameterObject, mapperTable: MapperTable): any[] {
	const exported: any[] = [];
	const mapper = mapperTable.emitterParam;

	// APS
	store(exported, emitterParam, "gx", mapper);
	store(exported, emitterParam, "gy", mapper);
	store(exported, emitterParam, "interval", mapper);
	store(exported, emitterParam, "activePeriod", mapper);
	store(exported, emitterParam, "delayEmit", mapper);
	store(exported, emitterParam, "numParticlesPerEmit", mapper);
	store(exported, emitterParam, "maxParticles", mapper);
	// children はエクスポートしない
	store(exported, emitterParam, "initParam", mapper, {
		exporter: initParam => exportParticleInitialParameter(initParam, mapperTable)
	});

	// VFX
	store(exported, emitterParam, "parentIndex", mapper);
	// APS では userData: any だが、VFX つまり ASA のレイヤでは userData の型が
	// 定義されているので、それに合わせた形でエクスポートする。
	store(exported, emitterParam, "userData", mapper, {
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
		store(exported, anim, "name", mapper);
		store(exported, anim, "fps", mapper);
		store(exported, anim, "frameCount", mapper);
		store(exported, anim, "curveTies", mapper, {
			exporter: curveTies => exportCurveTies(curveTies, mapperTable)
		});

		return exported;
	}

	exportBoneSet(boneSet: BoneSet): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.boneSet;
		const exported: any[] = [];

		store(exported, boneSet, "name", mapper);
		store(exported, boneSet, "bones", mapper, {
			exporter: bones => exportBones(bones, mapperTable)
		});

		return exported;
	}

	exportSkin(skin: Skin): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.skin;
		const exported: any[] = [];

		store(exported, skin, "name", mapper, {
			exporter: name => mapperTable.skinName.getIndex(name)
		});
		store(exported, skin, "imageAssetName", mapper);
		store(exported, skin, "imageSizeH", mapper);
		store(exported, skin, "imageSizeW", mapper);
		store(exported, skin, "cells", mapper, {
			exporter: cells => exportCells(cells, mapperTable)
		});

		return exported;
	}

	exportEffect(effectParam: EffectParameterObject): any[] {
		const mapperTable = this.mapperTable;
		const mapper = mapperTable.effectParam;
		const exported: any[] = [];

		store(exported, effectParam, "name", mapper, {
			exporter: name => mapperTable.effectName.getIndex(name)
		});
		store(exported, effectParam, "emitterParameters", mapper, {
			exporter: emitterParams => exportEmitterParameters(emitterParams, mapperTable)
		});

		return exported;
	}

	getSchema(): AOPSchema {
		const mapperTable = this.mapperTable;

		return {
			type: "aop",
			version: "1.0.0",
			propertyIndexMaps: {
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
