import Skin = require("./Skin");
import Bone = require("./Bone");
import BoneSet = require("./BoneSet");
import Container = require("./Container");
import AttrId = require("./AttrId");
import {Animation, Curve} from "./AnimeParams";
import * as vfx from "./vfx";

function checkVersion(version: string, fname: string): void {
	const r = version.match(/(\d+)\.\d+.\d+/);
	if (!r || r[1] !== "2") { // v2.x.x であることを確認
		throw g.ExceptionFactory.createAssertionError("Invalid fileformat version: " + fname + ", " + version + "<2.0.0");
	}
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

function loadResourceFromTextAsset<T>(
	fileNames: string[],
	assets: {[key: string]: g.Asset},
	resolver: (c: T, assets: {[key: string]: g.Asset}) => void): T[] {
	const resources: T[] = [];

	if (fileNames) {
		fileNames.forEach((fname: string): void => {
			const assetName: string = fname.split(".")[0]; // アセット名は拡張子を覗いたファイル名
			const data: Container = JSON.parse((<g.TextAsset>assets[assetName]).data);

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
class Resource {
	skins: Skin[] = [];
	boneSets: BoneSet[] = [];
	animations: Animation[] = [];
	effectParameters: vfx.EffectParameterObject[] = [];

	constructor() {
		// ...
	}

	/**
	 * asapjテキストアセットを読み込み、さらに関連するアセットも読み込む
	 *
	 * @param assetName asapjテキストアセット名
	 * @param assets 利用できるアセット
	 * @param ...otherAssets 利用できるアセット（可変長引数）
	 */
	loadProject(assetName: string, assets: {[key: string]: g.Asset}, ...otherAssets: {[key: string]: g.Asset}[]): void {
		const mergedAssets = mergeAssetArray([assets].concat(otherAssets));

		const json: any = (<g.TextAsset>mergedAssets[assetName]).data;
		const data: Container = JSON.parse(json);

		checkVersion(data.version, assetName);

		this.boneSets = loadResourceFromTextAsset<BoneSet>(
			data.contents.boneSetFileNames,
			mergedAssets,
			(c: BoneSet, asseta: {[key: string]: g.Asset}): void => {
				constructBoneTree(c.bones);
		});
		this.skins = loadResourceFromTextAsset<Skin>(data.contents.skinFileNames, mergedAssets, bindTextureFromAsset);
		this.animations = loadResourceFromTextAsset<Animation>(data.contents.animationFileNames, mergedAssets, undefined);
		this.animations.forEach((animation: Animation) => {
			assignAttributeID(animation);
		});
		this.effectParameters = loadResourceFromTextAsset<vfx.EffectParameterObject>(data.contents.effectFileNames, mergedAssets, undefined);
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
}

export = Resource;
