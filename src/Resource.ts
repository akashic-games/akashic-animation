import type {Animation, Curve} from "./AnimeParams";
import {AttrId} from "./AttrId";
import type {Bone} from "./Bone";
import type {BoneSet} from "./BoneSet";
import { aop } from "./serialize";
import type { AOPSchema } from "./serialize/ArrayOrientedPorter/AOPSchema";
import type {Container} from "./serialize/Container";
import type {ContainerV2} from "./serialize/ContainerV2";
import type {ContainerV3} from "./serialize/ContainerV3";
import type {Content} from "./serialize/Content";
import type { ProjectV2 } from "./serialize/ProjectV2";
import type {Skin} from "./Skin";
import type * as vfx from "./vfx";

function checkVersion(version: string, fname: string): string {
	const r = version.match(/(\d+)\.\d+.\d+/);
	if (!r || (r[1] !== "2" && r[1] !== "3")) {
		// v2.x.x または v3.x.x であることを確認
		throw g.ExceptionFactory.createAssertionError("Invalid fileformat version: " + fname + ", " + version + "<2.0.0");
	}
	return r[1];
}

function bindTextureFromAsset(skin: Skin, assets: {[key: string]: g.Asset}): void {
	const assetName = skin.imageAssetName ? skin.imageAssetName : skin.name;
	const anAsset: g.Asset = assets[assetName];
	skin.surface = (<g.ImageAsset>anAsset).asSurface();
}

function constructBoneTree(bones: Bone[]): void {
	for (let i = 0; i < bones.length; i++) {
		const bone: Bone = bones[i];
		// シリアライズの時点で欠落するのでここで追加
		bone.parent = undefined;
		bone.children = [];
	}

	for (let i = 0; i < bones.length; i++) {
		const bone: Bone = bones[i];
		if (bone.parentIndex >= 0) {
			bone.parent = bones[bone.parentIndex];
			bone.parent.children.push(bone);
		}
	}
}

function loadResourceFromContents<T>(
	contents: Content<T>[],
	assets: {[key: string]: g.Asset},
	resolver?: (c: T, assets: {[key: string]: g.Asset}) => void): T[] {
	const resources: T[] = [];

	for (let i = 0; i < contents.length; i++) {
		const content = contents[i];
		if (resolver) {
			resolver(content.data, assets);
		}
		resources.push(content.data);
	}

	return resources;
}

function loadResourceFromTextAsset<T>(
	fileNames: string[],
	assets: {[key: string]: g.Asset},
	resolver: (c: T, assets: {[key: string]: g.Asset}) => void): T[] {
	const resources: T[] = [];

	if (fileNames) {
		fileNames.forEach((fname: string): void => {
			const assetName: string = fname.split(".")[0]; // アセット名は拡張子を覗いたファイル名
			const data: ContainerV2 = JSON.parse((<g.TextAsset>assets[assetName]).data);

			checkVersion(data.version, fname);

			if (resolver) {
				resolver(data.contents, assets);
			}

			resources.push(data.contents);
		});
	}

	return resources;
}

function assignAttributeID(animation: Animation): void {
	const ct = animation.curveTies;
	for (const key in ct) {
		if (ct.hasOwnProperty(key)) {
			ct[key].curves.forEach((c: Curve<any>) => {
				const attrId = (<any>AttrId)[c.attribute];
				(<any>c).attrId = attrId;
			});
		}
	}
}

function mergeAssetArray(assetArray: {[key: string]: g.Asset}[]): {[key: string]: g.Asset} {
	const merged: {[key: string]: g.Asset} = {};

	for (let i = 0; i < assetArray.length; i++) {
		const assets = assetArray[i];
		for (const key in assets) {
			if (assets.hasOwnProperty(key)) {
				merged[key] = assets[key];
			}
		}
	}

	return merged;
}

/**
 * アニメーションリソースクラス
 */
export class Resource {
	skins: Skin[] = [];
	boneSets: BoneSet[] = [];
	animations: Animation[] = [];
	effectParameters: vfx.EffectParameterObject[] = [];

	constructor() {
		// ...
	}

	/**
	 * asapjテキストアセットを読み込む。関連するアセットがある場合、それも読み込む。
	 *
	 * すでに読み込んだaapjテキストアセットがあった場合、このResourceインスタンスから削除される。
	 *
	 * @param assetName asapjテキストアセット名
	 * @param assets 利用できるアセット
	 * @param ...otherAssets 利用できるアセット（可変長引数）
	 */
	loadProject(assetName: string, assets: {[key: string]: g.Asset}, ...otherAssets: {[key: string]: g.Asset}[]): void {
		const mergedAssets = mergeAssetArray([assets].concat(otherAssets));

		const json = (<g.TextAsset>mergedAssets[assetName]).data;
		const container: Container = JSON.parse(json);
		const majorVersion = checkVersion(container.version, assetName);

		if (majorVersion === "2") {
			// asapjファイルのコンテナがv2なら、contentsはProjectV2である
			this.loadProjectV2(container.contents, assets, ...otherAssets);
			return;
		}

		this.loadProjectV3(container as ContainerV3, assets, ...otherAssets);
	}

	/**
	 * スキンを取得する。
	 *
	 * @param name スキン名
	 */
	getSkinByName(name: string): Skin {
		for (let i = 0; i < this.skins.length; i++) {
			if (this.skins[i].name === name) {
				return this.skins[i];
			}
		}
		return undefined;
	}

	/**
	 * ボーンセットを取得する。
	 *
	 * @param name ボーンセット名
	 */
	getBoneSetByName(name: string): BoneSet {
		let found: BoneSet;
		this.boneSets.some((boneSet: BoneSet): boolean => {
			if (boneSet.name === name) {
				found = boneSet;
				return true;
			} else {
				return false;
			}
		});
		return found;
	}

	/**
	 * アニメーションを取得する。
	 *
	 * @param name アニメーション名
	 */
	getAnimationByName(name: string): Animation {
		for (let i = 0; i < this.animations.length; i++) {
			if (this.animations[i].name === name) {
				return this.animations[i];
			}
		}
		return undefined;
	}

	/**
	 * エフェクトパラメタを取得する。
	 *
	 * @param name エフェクパラメタ名
	 */
	getEffectParameterByName(name: string): vfx.EffectParameterObject {
		for (let i = 0, len = this.effectParameters.length; i < len; i++) {
			if (this.effectParameters[i].name === name) {
				return this.effectParameters[i];
			}
		}
		return undefined;
	}

	protected loadProjectV2(proj: ProjectV2, assets: { [key: string]: g.Asset }, ...otherAssets: { [key: string]: g.Asset }[]): void {
		const mergedAssets = mergeAssetArray([assets].concat(otherAssets));

		this.boneSets = loadResourceFromTextAsset<BoneSet>(
			proj.boneSetFileNames,
			mergedAssets,
			(c: BoneSet, _asseta: {[key: string]: g.Asset}): void => {
				constructBoneTree(c.bones);
			}
		);
		this.skins = loadResourceFromTextAsset<Skin>(proj.skinFileNames, mergedAssets, bindTextureFromAsset);
		if (proj.schema) {
			if (proj.schema.type === "aop") {
				console.log("Import aop animation");
				const schema = proj.schema as AOPSchema;
				const animations = loadResourceFromTextAsset<any[][]>(proj.animationFileNames, mergedAssets, undefined);
				const importer = new aop.AOPImporter(schema);
				this.animations = animations.map(animation => importer.importAnimation(animation));
			} else {
				throw  g.ExceptionFactory.createAssertionError(`Unknown schema: ${proj.schema}`);
			}
		} else {
			this.animations = loadResourceFromTextAsset<Animation>(proj.animationFileNames, mergedAssets, undefined);
		}
		this.animations.forEach((animation: Animation) => {
			assignAttributeID(animation);
		});
		this.effectParameters = loadResourceFromTextAsset<vfx.EffectParameterObject>(
			proj.effectFileNames,
			mergedAssets,
			undefined
		);
	}

	protected loadProjectV3(data: ContainerV3, assets: {[key: string]: g.Asset}, ...otherAssets: {[key: string]: g.Asset}[]): void {
		if (data.type !== "bundle") {
			throw  g.ExceptionFactory.createAssertionError("Invalid file type: " + data.type + ", supported only \"bundle\" type");
		}

		const mergedAssets = mergeAssetArray([assets].concat(otherAssets));

		this.boneSets = loadResourceFromContents<BoneSet>(
			data.contents.filter(content => content.type === "bone"),
			mergedAssets,
			c => constructBoneTree(c.bones)
		);
		this.skins = loadResourceFromContents<Skin>(
			data.contents.filter(content => content.type === "skin"),
			mergedAssets,
			bindTextureFromAsset
		);
		this.animations = loadResourceFromContents<Animation>(
			data.contents.filter(content => content.type === "animation"),
			mergedAssets
		);
		this.animations.forEach((animation: Animation) => {
			assignAttributeID(animation);
		});
		this.effectParameters = loadResourceFromContents<vfx.EffectParameterObject>(
			data.contents.filter(content => content.type === "effect"),
			mergedAssets
		);
	}
}
