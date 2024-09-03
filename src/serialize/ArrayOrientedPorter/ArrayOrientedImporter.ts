import type { AlphaBlendMode} from "../../AlphaBlendMode";
import { alphaBlendModes } from "../../AlphaBlendMode";
import type { IpType, Animation, Curve, CurveTie, KeyFrame, IpCurve, CellValue} from "../../AnimeParams";
import { ipTypes } from "../../AnimeParams";
import type { ParticleInitialParameterObject } from "../../aps";
import { AttrId } from "../../AttrId";
import type { Bone } from "../../Bone";
import type { BoneSet } from "../../BoneSet";
import type { Cell } from "../../Cell";
import type { ColliderInfo } from "../../ColliderInfo";
import type { Size2 } from "../../Size2";
import type { Skin } from "../../Skin";
import type { Vector2 } from "../../Vector2";
import type * as vfx from "../../vfx";
import type { AOPSchema } from "./AOPSchema";

/**
 * put() のオプション。
 */
interface PutOption {
	/**
	 * 格納先のプロパティがオプショナルであるとき、真にする。
	 *
	 * 省略時、偽。
	 */
	optional?: boolean;

	/**
	 * 配列から取り出した値を変換する関数。
	 *
	 * 省略時、変換しない。
	 */
	importer?: (data: any) => any;
}

/**
 * 配列から値を取り出してオブジェクトに格納する。
 *
 * @param obj 値を格納するオブジェクト
 * @param key 値を格納するプロパティ名
 * @param mapper 配列とプロパティのマッピング
 * @param data 配列
 * @param opts オプション
 * @returns
 */
function put<T extends object>(
	obj: T,
	key: Extract<keyof T, string>,
	mapper: Array<Extract<keyof T, string>>,
	data: any[],
	opts?: PutOption,
): void {
	const { optional, importer } = opts ?? {};
	const idx = mapper.indexOf(key);

	if (idx === -1) {
		if (optional) {
			return;
		}
		throw new Error(`Failed to get the index of ${key}`);
	}

	const value = data[idx];

	// 前提:
	// 1. mapper から key のインデックスがを取得できても optional な
	//    プロパティの場合 data[idx] に値が存在しないこともある。
	// 2. data は JSON.parse() の結果であるため data 中に undefined
	//    は存在しない(stringify() した時 null に置き換えられる)。
	//
	// data[key] が null なら、それは以下のいずれかの理由である。
	// 1. 正しく null を格納した
	// 2. 誤って undefined を格納し JSON によって null に置き換えられた
	// 3. a=[],a[0]=v1,a[2]=v2 が [v1, null, v2] となった
	//
	// data[key] が undefined なら、key が配列の範囲外である。
	//
	if (value === undefined) {
		// 配列の範囲外の場合。値は格納されていない
	} else if (value === null && optional) {
		// 配列中に null があるが optional なプロパティの場合。
		// 上で述べた 3. のケースと解釈する。そのため、
		// { foo?: Foo | null = null } のようなプロパティの
		// null をシリアライズできないことに注意。
	} else {
		obj[key] = importer ? importer(value) : value;
	}
}

function importIpType(value: any): IpType {
	return value === -1 ? undefined : ipTypes[value];
}

function importIpCurve(value: any): IpCurve {
	// Resource クラスに倣い IpCurve クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new IpCurve しない。
	return { values: value };
}

function importKeyFrame(
	data: any[],
	schema: AOPSchema,
	importer?: (value: any) => any
): KeyFrame<any> {
	const mapper = schema.propertyIdMaps.keyFrame;
	// Resource クラスに倣い KeyFrame クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new KeyFrame しない。
	const keyFrame = {} as KeyFrame<any>;

	put(keyFrame, "time", mapper, data);
	put(keyFrame, "value", mapper, data, { importer });
	put(keyFrame, "ipType", mapper, data, { importer: importIpType });
	put(keyFrame, "ipCurve", mapper, data, { importer: importIpCurve, optional: true });

	return keyFrame;
}

function importKeyFrames(
	data: any[],
	schema: AOPSchema,
	valueImporter?: (value: any) => any
): KeyFrame<any>[] {
	return data.map(value => importKeyFrame(value, schema, valueImporter));
}

function importCellValueKeyFrame(indices: [number, number], schema: AOPSchema): CellValue {
	const skinMapper = schema.propertyIdMaps.skinName;
	const cellMapper = schema.propertyIdMaps.cellName;

	// Resource クラスに倣い CellValue クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new CellValue しない。
	const cv = {} as CellValue;
	cv.skinName = skinMapper[indices[0]];
	cv.cellName = cellMapper[indices[1]];

	return cv;
}

function importCurve(data: any[], schema: AOPSchema): Curve<any> {
	const booleanAttributes = [
		"iflh",
		"iflv",
		"visibility",
		"flipH",
		"flipV"
	];

	// Resource クラスに倣い Curve クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new Curve しない。
	const curve = {} as Curve<any>;
	const mapper = schema.propertyIdMaps.curve;

	put(curve, "attribute", mapper, data, {
		importer: value => AttrId[value]
	});

	let keyFrameValueImporter: (value: any) => any;

	if (curve.attribute === "cv") {
		keyFrameValueImporter = value => importCellValueKeyFrame(value, schema);
	} else if (curve.attribute === "effect") {
		keyFrameValueImporter = value => ({ emitterOp: value });
	} else if (booleanAttributes.indexOf(curve.attribute) !== -1) {
		keyFrameValueImporter = value => value !== 0;
	} else {
		// nop;
	}

	put(curve, "keyFrames", mapper, data, {
		importer: keyFrames => importKeyFrames(keyFrames, schema, keyFrameValueImporter)
	});

	return curve;
}

function importCurves(data: any[], schema: AOPSchema): Curve<any>[] {
	const curves: Curve<any>[] = [];
	for (const value of data) {
		const curve = importCurve(value, schema);
		curves.push(curve);
	}
	return curves;
}

function importCurveTie(data: any[], schema: AOPSchema): CurveTie {
	const mapper = schema.propertyIdMaps.curveTie;

	// Resource クラスに倣い CurveTie クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new CurveTie しない。
	const curveTie = {} as CurveTie;
	put(curveTie, "boneName", mapper, data, {
		importer: idx => schema.propertyIdMaps.boneName[idx]
	});
	put(curveTie, "curves", mapper, data, {
		importer: curves => importCurves(curves, schema)
	});

	return curveTie;
}

function importCurveTies(data: any[], schema: AOPSchema): { [key: string]: CurveTie } {
	const curveTies: { [key: string]: CurveTie } = {};
	for (const value of data) {
		const curveTie = importCurveTie(value, schema);
		curveTies[curveTie.boneName] = curveTie;
	}
	return curveTies;
}

function importVectorLike(data: [number, number]): { x: number; y: number } {
	return { x: data[0], y: data[1] };
}

function importVector(data: [number, number]): Vector2 {
	// Resource クラスに倣い Vector2 クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new Vector2 しない。
	return importVectorLike(data);
}

function importSize(data: [number, number]): Size2 {
	// Resource クラスに倣い Size2 クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new Size2 しない。
	return { width: data[0], height: data[1] };
}

function importColliderInfo(data: any[], schema: AOPSchema): ColliderInfo {
	const mapper = schema.propertyIdMaps.colliderInfo;

	// Resource クラスに倣い ColliderInfo クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new ColliderInfo しない。
	const colliderInfo = {} as ColliderInfo;

	put(colliderInfo, "geometryType", mapper, data);
	put(colliderInfo, "boundType", mapper, data);

	// optional properties
	const optional = true;
	put(colliderInfo, "cellName", mapper, data, { optional });
	put(colliderInfo, "center", mapper, data, { optional });
	put(colliderInfo, "center", mapper, data, { optional, importer: importVectorLike });
	put(colliderInfo, "radius", mapper, data, { optional });
	put(colliderInfo, "scaleOption", mapper, data, { optional });
	put(colliderInfo, "width", mapper, data, { optional });
	put(colliderInfo, "height", mapper, data, { optional });

	return colliderInfo;
}

function importColliderInfos(data: any[], schema: AOPSchema): ColliderInfo[] {
	const colliderInfos: ColliderInfo[] = [];

	for (const value of data) {
		colliderInfos.push(importColliderInfo(value, schema));
	}

	return colliderInfos;
}

function importBone(data: any[], schema: AOPSchema): Bone {
	const mapper = schema.propertyIdMaps.bone;

	// Resource クラスに倣い Bone クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new Bone しない。
	const bone = {} as Bone;
	put(bone, "parentIndex", mapper, data);
	put(bone, "name", mapper, data, { importer: data => schema.propertyIdMaps.boneName[data] });

	// children は export されていない

	put(bone, "arrayIndex", mapper, data);
	put(bone, "colliderInfos", mapper, data);
	put(bone, "colliderInfos", mapper, data, { importer: data => importColliderInfos(data, schema) });
	put(bone, "alphaBlendMode", mapper, data, { importer: importAlphaBlendMode });
	put(bone, "effectName", mapper, data, {
		importer: data => schema.propertyIdMaps.effectName[data],
		optional: true,
	});

	return bone;
}

function importBones(data: any[], schema: AOPSchema): Bone[] {
	const bones: Bone[] = [];

	for (const value of data) {
		bones.push(importBone(value, schema));
	}

	return bones;
}

function importCell(data: any[], schema: AOPSchema): Cell {
	// Resource クラスに倣い Cell クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new Cell しない。
	const cell = {} as Cell;
	const mapper = schema.propertyIdMaps.cell;

	put(cell, "name", mapper, data, { importer: idx => schema.propertyIdMaps.cellName[idx] });
	put(cell, "pos", mapper, data, { importer: importVector });
	put(cell, "size", mapper, data, { importer: importSize });
	put(cell, "pivot", mapper, data, { importer: importVector });
	put(cell, "rz", mapper, data);

	return cell;
}

function importCells(data: any[], schema: AOPSchema): { [key: string]: Cell } {
	const cells: { [key: string]: Cell } = {};

	for (const value of data) {
		const cell = importCell(value, schema);
		cells[cell.name] = cell;
	}

	return cells;
}

function importAlphaBlendMode(value: any): AlphaBlendMode {
	return value === -1 ? undefined : alphaBlendModes[value];
}

function importEmitterUserData(data: any[], schema: AOPSchema): vfx.EmitterParameterUserData {
	const userData = {} as vfx.EmitterParameterUserData;
	const mapper = schema.propertyIdMaps.emitterUserData;

	put(userData, "skinName", mapper, data, { importer: idx => schema.propertyIdMaps.skinName[idx] });
	put(userData, "cellName", mapper, data, { importer: idx => schema.propertyIdMaps.cellName[idx] });
	put(userData, "alphaBlendMode", mapper, data, { importer: v => importAlphaBlendMode(v) });

	return userData;
}

function importParticleInitialParameter(data: any[], schema: AOPSchema): ParticleInitialParameterObject {
	const param = {} as ParticleInitialParameterObject;
	const mapper = schema.propertyIdMaps.particleInitialParam;

	// 全て単純な number[] 型なのでループで処理する
	for (const key of mapper) {
		put(param, key, mapper, data);
	}

	return param;
}

function importEmitterParameter(data: any[], schema: AOPSchema): vfx.EmitterParameterObject {
	const param = {} as vfx.EmitterParameterObject;
	const mapper = schema.propertyIdMaps.emitterParam;

	// APS
	put(param, "gx", mapper, data, { optional: true });
	put(param, "gy", mapper, data, { optional: true });
	put(param, "interval", mapper, data, { optional: true });
	put(param, "activePeriod", mapper, data, { optional: true });
	put(param, "delayEmit", mapper, data, { optional: true });
	put(param, "numParticlesPerEmit", mapper, data, { optional: true });
	put(param, "maxParticles", mapper, data, { optional: true });
	// children: Emitter[] はエクスポートされない
	put(param, "initParam", mapper, data, {
		importer: initParam => importParticleInitialParameter(initParam, schema)
	});

	// VFX
	put(param, "parentIndex", mapper, data);
	put(param, "userData", mapper, data, {
		importer: userData => importEmitterUserData(userData, schema)
	});

	return param;
}

function importEmitterParameters(data: any[], schema: AOPSchema): vfx.EmitterParameterObject[] {
	const emitterParameters: vfx.EmitterParameterObject[] = [];

	for (const value of data) {
		const emitterParameter = importEmitterParameter(value, schema);
		emitterParameters.push(emitterParameter);
	}

	return emitterParameters;
}

/**
 * AOP形式のインポータ。
 */
export class ArrayOrientedImporter {
	private schema: AOPSchema;

	constructor(schema: AOPSchema) {
		this.schema = schema;
	}

	importAnimation(data: any[]): Animation {
		const mapper = this.schema.propertyIdMaps.animation;
		// Resource クラスに倣い Animation クラスを用いない。
		// Resource クラスは JSON.parse() の結果をそのまま実行時の
		// データとして用いる。つまり new Animation しない。
		const animation = {} as Animation;

		put(animation, "name", mapper, data);
		put(animation, "fps", mapper, data);
		put(animation, "frameCount", mapper, data);
		put(animation, "curveTies", mapper, data, {
			importer: curveTies => importCurveTies(curveTies, this.schema)
		});

		return animation;
	}

	importBoneSet(data: any[]): BoneSet {
		const mapper = this.schema.propertyIdMaps.boneSet;
		// Resource クラスに倣い BoneSet クラスを用いない。
		// Resource クラスは JSON.parse() の結果をそのまま実行時の
		// データとして用いる。つまり new BoneSet しない。
		const boneSet = {} as BoneSet;

		put(boneSet, "name", mapper, data);
		put(boneSet, "bones", mapper, data, {
			importer: bones => importBones(bones, this.schema)
		});

		return boneSet;
	}

	importSkin(data: any[]): Skin {
		const mapper = this.schema.propertyIdMaps.skin;
		// Resource クラスに倣い Skin クラスを用いない。
		// Resource クラスは JSON.parse() の結果をそのまま実行時の
		// データとして用いる。つまり new Skin しない。
		const skin = {} as Skin;

		put(skin, "name", mapper, data, {
			importer: idx => this.schema.propertyIdMaps.skinName[idx]
		});
		put(skin, "imageAssetName", mapper, data);
		put(skin, "imageSizeH", mapper, data);
		put(skin, "imageSizeW", mapper, data);
		put(skin, "cells", mapper, data, {
			importer: cells => importCells(cells, this.schema)
		});

		return skin;
	}

	importEffect(data: any[]): vfx.EffectParameterObject {
		const mapper = this.schema.propertyIdMaps.effectParam;
		const effect = {} as vfx.EffectParameterObject;

		put(effect, "name", mapper, data, {
			importer: idx => this.schema.propertyIdMaps.effectName[idx]
		});
		put(effect, "emitterParameters", mapper, data, {
			importer: emitterParameters => importEmitterParameters(emitterParameters, this.schema)
		});

		return effect;
	}
}
