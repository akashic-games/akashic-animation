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
import type { Importer } from "../Importer";
import type { AOPSchema } from "./AOPSchema";

/**
 * put() のオプション。
 */
interface RestoreOption {
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
 * 配列に格納した値を値を取り出してオブジェクトに復元する。
 *
 * @param dst 値を格納するオブジェクト
 * @param key 値を格納するプロパティ名
 * @param src 配列
 * @param mapper 配列とプロパティの対応
 * @param opts オプション
 * @returns
 */
function restore<T extends object>(
	dst: T,
	key: Extract<keyof T, string>,
	src: any[],
	mapper: Array<Extract<keyof T, string>>,
	opts?: RestoreOption,
): void {
	const { optional, importer } = opts ?? {};
	const idx = mapper.indexOf(key);

	if (idx === -1) {
		if (optional) {
			return;
		}
		throw new Error(`Failed to get the index of ${key}`);
	}

	const value = src[idx];

	// 前提:
	// 1. mapper から key のインデックスを取得できても optional な
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
		dst[key] = importer ? importer(value) : value;
	}
}

function importIpType(value: any): IpType | undefined {
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
	const mapper = schema.propertyIndexMaps.keyFrame;
	// Resource クラスに倣い KeyFrame クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new KeyFrame しない。
	const keyFrame = {} as KeyFrame<any>;

	restore(keyFrame, "time", data, mapper);
	restore(keyFrame, "value", data, mapper, { importer });
	restore(keyFrame, "ipType", data, mapper, { importer: importIpType });
	restore(keyFrame, "ipCurve", data, mapper, { importer: importIpCurve, optional: true });

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
	const skinMapper = schema.propertyIndexMaps.skinName;
	const cellMapper = schema.propertyIndexMaps.cellName;

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
	const mapper = schema.propertyIndexMaps.curve;

	restore(curve, "attribute", data, mapper, {
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

	restore(curve, "keyFrames", data, mapper, {
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
	const mapper = schema.propertyIndexMaps.curveTie;

	// Resource クラスに倣い CurveTie クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new CurveTie しない。
	const curveTie = {} as CurveTie;
	restore(curveTie, "boneName", data, mapper, {
		importer: idx => schema.propertyIndexMaps.boneName[idx]
	});
	restore(curveTie, "curves", data, mapper, {
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
	const mapper = schema.propertyIndexMaps.colliderInfo;

	// Resource クラスに倣い ColliderInfo クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new ColliderInfo しない。
	const colliderInfo = {} as ColliderInfo;

	restore(colliderInfo, "geometryType", data, mapper);
	restore(colliderInfo, "boundType", data, mapper);

	// optional properties
	const optional = true;
	restore(colliderInfo, "cellName", data, mapper, { optional });
	restore(colliderInfo, "center", data, mapper, { optional });
	restore(colliderInfo, "center", data, mapper, { optional, importer: importVectorLike });
	restore(colliderInfo, "radius", data, mapper, { optional });
	restore(colliderInfo, "scaleOption", data, mapper, { optional });
	restore(colliderInfo, "width", data, mapper, { optional });
	restore(colliderInfo, "height", data, mapper, { optional });

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
	const mapper = schema.propertyIndexMaps.bone;

	// Resource クラスに倣い Bone クラスを用いない。
	// Resource クラスは JSON.parse() の結果をそのまま実行時の
	// データとして用いる。つまり new Bone しない。
	const bone = {} as Bone;
	restore(bone, "parentIndex", data, mapper);
	restore(bone, "name", data, mapper, { importer: data => schema.propertyIndexMaps.boneName[data] });

	// children は export されていない

	restore(bone, "arrayIndex", data, mapper);
	restore(bone, "colliderInfos", data, mapper);
	restore(bone, "colliderInfos", data, mapper, { importer: data => importColliderInfos(data, schema) });
	restore(bone, "alphaBlendMode", data, mapper, { importer: importAlphaBlendMode });
	restore(bone, "effectName", data, mapper, {
		importer: data => schema.propertyIndexMaps.effectName[data],
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
	const mapper = schema.propertyIndexMaps.cell;

	restore(cell, "name", data, mapper, { importer: idx => schema.propertyIndexMaps.cellName[idx] });
	restore(cell, "pos", data, mapper, { importer: importVector });
	restore(cell, "size", data, mapper, { importer: importSize });
	restore(cell, "pivot", data, mapper, { importer: importVector });
	restore(cell, "rz", data, mapper);

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
	const mapper = schema.propertyIndexMaps.emitterUserData;

	restore(userData, "skinName", data, mapper, { importer: idx => schema.propertyIndexMaps.skinName[idx] });
	restore(userData, "cellName", data, mapper, { importer: idx => schema.propertyIndexMaps.cellName[idx] });
	restore(userData, "alphaBlendMode", data, mapper, { importer: v => importAlphaBlendMode(v) });

	return userData;
}

function importParticleInitialParameter(data: any[], schema: AOPSchema): ParticleInitialParameterObject {
	const param = {} as ParticleInitialParameterObject;
	const mapper = schema.propertyIndexMaps.particleInitialParam;

	// 全て単純な number[] 型なのでループで処理する
	for (const key of mapper) {
		restore(param, key, data, mapper);
	}

	return param;
}

function importEmitterParameter(data: any[], schema: AOPSchema): vfx.EmitterParameterObject {
	const param = {} as vfx.EmitterParameterObject;
	const mapper = schema.propertyIndexMaps.emitterParam;

	// APS
	restore(param, "gx", data, mapper, { optional: true });
	restore(param, "gy", data, mapper, { optional: true });
	restore(param, "interval", data, mapper, { optional: true });
	restore(param, "activePeriod", data, mapper, { optional: true });
	restore(param, "delayEmit", data, mapper, { optional: true });
	restore(param, "numParticlesPerEmit", data, mapper, { optional: true });
	restore(param, "maxParticles", data, mapper, { optional: true });
	// children: Emitter[] はエクスポートされない
	restore(param, "initParam", data, mapper, {
		importer: initParam => importParticleInitialParameter(initParam, schema)
	});

	// VFX
	restore(param, "parentIndex", data, mapper);
	restore(param, "userData", data, mapper, {
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
export class ArrayOrientedImporter implements Importer {
	private schema: AOPSchema;

	/**
	 * コンストラクタ。
	 *
	 * スキーマのバージョンや種別が不正な時、例外を投げる。
	 *
	 * @param schema スキーマ。
	 */
	constructor(schema: AOPSchema) {
		if (schema.type !== "aop") {
			throw new Error(`Invalid type: ${schema.type}`);
		}
		if (schema.version !== "1.0.0") {
			throw new Error(`Unsupported version: ${schema.version}`);
		}
		this.schema = schema;
	}

	importAnimation(data: any[]): Animation {
		const mapper = this.schema.propertyIndexMaps.animation;
		// Resource クラスに倣い Animation クラスを用いない。
		// Resource クラスは JSON.parse() の結果をそのまま実行時の
		// データとして用いる。つまり new Animation しない。
		const animation = {} as Animation;

		restore(animation, "name", data, mapper);
		restore(animation, "fps", data, mapper);
		restore(animation, "frameCount", data, mapper);
		restore(animation, "curveTies", data, mapper, {
			importer: curveTies => importCurveTies(curveTies, this.schema)
		});

		return animation;
	}

	importBoneSet(data: any[]): BoneSet {
		const mapper = this.schema.propertyIndexMaps.boneSet;
		// Resource クラスに倣い BoneSet クラスを用いない。
		// Resource クラスは JSON.parse() の結果をそのまま実行時の
		// データとして用いる。つまり new BoneSet しない。
		const boneSet = {} as BoneSet;

		restore(boneSet, "name", data, mapper);
		restore(boneSet, "bones", data, mapper, {
			importer: bones => importBones(bones, this.schema)
		});

		return boneSet;
	}

	importSkin(data: any[]): Skin {
		const mapper = this.schema.propertyIndexMaps.skin;
		// Resource クラスに倣い Skin クラスを用いない。
		// Resource クラスは JSON.parse() の結果をそのまま実行時の
		// データとして用いる。つまり new Skin しない。
		const skin = {} as Skin;

		restore(skin, "name", data, mapper, {
			importer: idx => this.schema.propertyIndexMaps.skinName[idx]
		});
		restore(skin, "imageAssetName", data, mapper);
		restore(skin, "imageSizeH", data, mapper);
		restore(skin, "imageSizeW", data, mapper);
		restore(skin, "cells", data, mapper, {
			importer: cells => importCells(cells, this.schema)
		});

		return skin;
	}

	importEffect(data: any[]): vfx.EffectParameterObject {
		const mapper = this.schema.propertyIndexMaps.effectParam;
		const effect = {} as vfx.EffectParameterObject;

		restore(effect, "name", data, mapper, {
			importer: idx => this.schema.propertyIndexMaps.effectName[idx]
		});
		restore(effect, "emitterParameters", data, mapper, {
			importer: emitterParameters => importEmitterParameters(emitterParameters, this.schema)
		});

		return effect;
	}
}
