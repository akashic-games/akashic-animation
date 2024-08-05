import { Animation, Curve, CurveTie, KeyFrame, IpCurve, CellValue, ipTypes } from "../../AnimeParams";
import type { ParticleInitialParameterObject } from "../../aps";
import { AttrId } from "../../AttrId";
import { Bone } from "../../Bone";
import { BoneSet } from "../../BoneSet";
import { Cell } from "../../Cell";
import type { ColliderInfo } from "../../ColliderInfo";
import { Size2 } from "../../Size2";
import { Skin } from "../../Skin";
import { Vector2 } from "../../Vector2";
import type * as vfx from "../../vfx";
import type { AOPSchema } from "./AOPSchema";

/**
 * 配列からプロパティの値を取得する。
 *
 * @param data 配列
 * @param mapper 配列とプロパティのマッピング
 * @param propertyName プロパティ名
 * @param optional 真の時、プロパティが存在しない場合 undefined を返す。省略時、偽
 * @returns プロパティの値。プロパティが存在しない場合 undefined
 */
function get<T>(data: any[], mapper: T[], propertyName: T, optional?: boolean): any {
	const idx = mapper.indexOf(propertyName);

	if (idx !== -1) {
		return data[idx];
	}

	if (!optional) {
		throw new Error(`Failed to get ${propertyName} index`);
	}

	return undefined;
}

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

	// mapper から key の index がを取得できても optional な
	// プロパティの場合 data[key] に値が存在しないこともある。
	//
	// つまりあるときは data に値を格納して、あるときは格納しない、
	// といったことがあり得る。
	//
	// data は JSON.parse() の結果であるため data 中に undefined
	// は存在しない(stringify() した時 null に置き換えられる)。
	//
	// data[key] が null なら、それは以下のいずれかの理由である。
	// - 正しく null を格納した
	// - 誤って undefined を格納した
	// - [v1, なし v2] のような配列が [v1, null, v2] となった
	//   - arr[1] に何も代入されないケース
	//
	// data[key] が undefined なら、key が配列の範囲外である。
	if (idx === -1) {
		if (optional) {
			return;
		}
		throw new Error(`Failed to get the index of ${key}`);
	}

	if (data[idx] === undefined) {
		// 配列の範囲外の場合。値は格納されていない
	} else if (data[idx] === null && optional) {
		// 配列中に null があるが optional なプロパティの場合。
		// このとき、省略されたプロパティの値(=undefined)が格納された
		// と解釈する。
		// { foo?: Foo | null = null } のようなプロパティの null を
		// シリアライズできないことに注意。
	} else {
		obj[key] = importer ? importer(data[idx]) : data[idx];
	}
}

function importKeyFrame(
	data: any[],
	schema: AOPSchema,
	valuePredicate?: (value: any) => any
): KeyFrame<any> {
	const mapper = schema.propertyIdMaps.keyFrame;
	const keyFrame = new KeyFrame<any>();

	put(keyFrame, "time", mapper, data);
	put(keyFrame, "value", mapper, data, { importer: valuePredicate });
	put(keyFrame, "ipType", mapper, data, {
		importer: value => {
			console.log(`ipTypes: ${value}`);
			return value === "undefined" ? undefined : ipTypes[value];
		}
	});
	put(keyFrame, "ipCurve", mapper, data, {
		optional: true,
		importer: value => {
			console.log(`value = ${value}`);
			const ipCurve = new IpCurve();
			ipCurve.values = value;
			return ipCurve;
		}
	});

	return keyFrame;
}

function importKeyFrames(
	data: any[],
	schema: AOPSchema,
	valuePredicate?: (value: any) => any
): KeyFrame<any>[] {
	return data.map(value => importKeyFrame(value, schema, valuePredicate));
}

function importCurve(data: any[], schema: AOPSchema): Curve<any> {
	const curve = new Curve<any>();

	const mapper = schema.propertyIdMaps.curve;
	const booleanAttributes = [
		"iflh",
		"iflv",
		"visibility",
		"flipH",
		"flipV"
	];

	curve.attribute = AttrId[get(data, mapper, "attribute")];

	curve.keyFrames = importKeyFrames(
		get(data, mapper, "keyFrames"),
		schema,
		curve.attribute === "cv"
			? (indices: [number, number]) => {
				const skinMapper = schema.propertyIdMaps.skinName;
				const cellMapper = schema.propertyIdMaps.cellName;
				const cv = new CellValue();
				cv.skinName = skinMapper[indices[0]];
				cv.cellName = cellMapper[indices[1]];
				return cv;
			}
			: curve.attribute === "effect"
				? (value: any): vfx.EffectValue => ({ emitterOp: value })
				: curve.attribute === "userData"
					? (value: any) => value
					: booleanAttributes.indexOf(curve.attribute) !== -1
						? (value: any) => value !== 0
						: (value: any) => value
	);

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

	const curveTie = new CurveTie();
	curveTie.boneName = schema.propertyIdMaps.boneName[get(data, mapper, "boneName")];
	curveTie.curves = importCurves(get(data, mapper, "curves"), schema);

	return curveTie;
}

function importCurveTies(
	data: any[],
	schema: AOPSchema
): { [key: string]: CurveTie } {
	const curveTies: { [key: string]: CurveTie } = {};
	for (const value of data) {
		const curveTie = importCurveTie(value, schema);
		curveTies[curveTie.boneName] = curveTie;
	}
	return curveTies;
}

function importVector(data: [number, number]): { x: number; y: number } {
	return new Vector2(data[0], data[1]);
}

function importSize(data: [number, number]): Size2 {
	return new Size2(data[0], data[1]);
}

function importColliderInfo(data: any[], schema: AOPSchema): ColliderInfo {
	const mapper = schema.propertyIdMaps.colliderInfo;

	const colliderInfo: ColliderInfo =  {
		geometryType: get(data, mapper, "geometryType"),
		boundType: get(data, mapper, "boundType"),
	};

	// optional properties
	const optional = true;
	put(colliderInfo, "cellName", mapper, data, { optional });
	put(colliderInfo, "center", mapper, data, { optional });
	put(colliderInfo, "center", mapper, data, { optional, importer: importVector });
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


// コンソール中のdiffを見るに、おそらく、元データに undefined なプロパティがあるせいで比較したとき失敗する。JSONをシリアライザに用いる限り、
// 1. undefinedは保存しない
// 2. arr = []; arr[0] = "a"; arr[2] = "b" のような途中の欠落した配列は
// ["a", null, "b"] となる。 はoptionalなプロパティだと値を格納したり
// しなかったりするので arr[1] のようなことになる。オプショナルかつ
// null を代入可能なプロパティは正しく扱えない。扱えるようにできるのかも
// しれないが、ここでは「扱えない」とする。この制約に従うこと。
//
// JSONでシリアライズするときのルールまとめ
// 1. undefined をデータに含めない
// 2. オプショナルなプロパティはnullを代入できない
// 3. 配列中の null は undefined と解釈し、読み込まない（プロパティを作らない）

function importBone(data: any[], schema: AOPSchema): Bone {
	const mapper = schema.propertyIdMaps.bone;

	const bone = new Bone();
	put(bone, "parentIndex", mapper, data);
	put(bone, "name", mapper, data, { importer: data => schema.propertyIdMaps.boneName[data] });
	put(bone, "children", mapper, data);
	put(bone, "arrayIndex", mapper, data);
	put(bone, "colliderInfos", mapper, data);
	put(bone, "colliderInfos", mapper, data, { importer: data => importColliderInfos(data, schema) });
	put(bone, "alphaBlendMode", mapper, data);
	put(bone, "effectName", mapper, data, { optional: true });

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
	const cell = new Cell();
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

function importEmitterUserData(data: any[], schema: AOPSchema): vfx.EmitterParameterUserData {
	const userData = {} as vfx.EmitterParameterUserData;
	const mapper = schema.propertyIdMaps.emitterUserData;

	put(userData, "skinName", mapper, data, { importer: idx => schema.propertyIdMaps.skinName[idx] });
	put(userData, "cellName", mapper, data, { importer: idx => schema.propertyIdMaps.cellName[idx] });
	put(userData, "alphaBlendMode", mapper, data);

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

export class AOPImporter {
	private schema: AOPSchema;

	constructor(schema: AOPSchema) {
		this.schema = schema;
	}

	importAnimation(data: any[]): Animation {
		const mapper = this.schema.propertyIdMaps.animation;
		const animation = new Animation();

		put(animation, "name", mapper, data);
		put(animation, "fps", mapper, data);
		put(animation, "frameCount", mapper, data);
		animation.curveTies = importCurveTies(get(data, mapper, "curveTies"), this.schema);

		return animation;
	}

	importBoneSet(data: any[]): BoneSet {
		const mapper = this.schema.propertyIdMaps.boneSet;
		const boneSet = new BoneSet("", []);

		put(boneSet, "name", mapper, data);
		boneSet.bones = importBones(get(data, mapper, "bones"), this.schema);

		return boneSet;
	}

	importSkin(data: any[]): Skin {
		const mapper = this.schema.propertyIdMaps.skin;
		const skin = new Skin();

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

		put(effect, "name", mapper, data);
		put(effect, "emitterParameters", mapper, data, {
			importer: emitterParameters => importEmitterParameters(emitterParameters, this.schema)
		});

		return effect;
	}
}
