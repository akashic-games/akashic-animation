import type {Animation, Curve} from "./AnimeParams";
import {AttrId} from "./AttrId";
import { AssetResolver } from "./auxiliary/AssetResolver";
import type {Bone} from "./Bone";
import type {BoneSet} from "./BoneSet";
import type {Container} from "./Container";
import type {ContainerV2} from "./ContainerV2";
import type {ContainerV3} from "./ContainerV3";
import type {Content} from "./Content";
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

function bindTextureFromAsset(skin: Skin, assetResolver: AssetResolver): void {
	const anAsset = assetResolver.getImage(skin.imageAssetName);
	skin.surface = anAsset.asSurface();
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
	assetResolver: AssetResolver,
	resolver?: (c: T, assetResolver: AssetResolver) => void,
): T[] {
	const resources: T[] = [];

	for (let i = 0; i < contents.length; i++) {
		const content = contents[i];
		if (resolver) {
			resolver(content.data, assetResolver);
		}
		resources.push(content.data);
	}

	return resources;
}

function loadResourceFromTextAsset<T>(
	fileNames: string[],
	assetResolver: AssetResolver,
	resolver?: (c: T, assetResolver: AssetResolver) => void,
): T[] {
	const resources: T[] = [];

	if (fileNames) {
		fileNames.forEach((fname: string): void => {
			const data = assetResolver.getJSON<ContainerV2>(fname);
			checkVersion(data.version, fname);

			if (resolver) {
				resolver(data.contents, assetResolver);
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
	 * すでに読み込んだasapjテキストアセットがあった場合、このResourceインスタンスから削除される。
	 *
	 * @deprecated 第2引数に `scene.asset` または `game.asset` を指定すべきである。
	 * @param assetName asapjテキストアセット名
	 * @param assets 利用できるアセット
	 * @param ...otherAssets 利用できるアセット（可変長引数）
	 */
	loadProject(assetName: string, assets: {[key: string]: g.Asset}, ...otherAssets: {[key: string]: g.Asset}[]): void;

	/**
	 * asapjテキストアセットを読み込む。関連するアセットがある場合、それも読み込む。
	 * 関連するアセットはすべて同一ディレクトリに存在しなければならないことに注意。
	 * すでに読み込んだasapjテキストアセットがあった場合、このResourceインスタンスから削除される。
	 *
	 * @param projectPath asapjのファイルパス
	 * @param asset 利用するアセットアクセッサ
	 */
	loadProject(projectPath: string, asset: g.AssetAccessor): void;

	loadProject(
		assetNameOrProjectPath: string,
		assetsOrAccessor: {[key: string]: g.Asset} | g.AssetAccessor,
		...otherAssets: {[key: string]: g.Asset}[]
	): void {
		let assetResolver: AssetResolver;

		if (assetsOrAccessor instanceof g.AssetAccessor) {
			const basePath = g.PathUtil.resolveDirname(assetNameOrProjectPath);
			assetResolver = new AssetResolver(assetsOrAccessor, basePath);
		} else {
			const assets = mergeAssetArray([assetsOrAccessor].concat(otherAssets));
			assetResolver = new AssetResolver(assets);
		}

		const data = assetResolver.getJSON<Container>(assetNameOrProjectPath);
		const majorVersion = checkVersion(data.version, assetNameOrProjectPath);

		if (majorVersion === "2") {
			this.loadProjectV2(data, assetResolver);
			return;
		}

		this.loadProjectV3(data as ContainerV3, assetResolver);
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

	protected loadProjectV2(data: ContainerV2, assetResolver: AssetResolver): void {
		this.boneSets = loadResourceFromTextAsset<BoneSet>(
			data.contents.boneSetFileNames,
			assetResolver,
			(c: BoneSet): void => {
				constructBoneTree(c.bones);
			}
		);
		this.skins = loadResourceFromTextAsset<Skin>(data.contents.skinFileNames, assetResolver, bindTextureFromAsset);
		this.animations = loadResourceFromTextAsset<Animation>(data.contents.animationFileNames, assetResolver);
		this.animations.forEach((animation: Animation) => {
			assignAttributeID(animation);
		});
		this.effectParameters = loadResourceFromTextAsset<vfx.EffectParameterObject>(
			data.contents.effectFileNames,
			assetResolver,
		);
	}

	protected loadProjectV3(data: ContainerV3, assetResolver: AssetResolver): void {
		if (data.type !== "bundle") {
			throw  g.ExceptionFactory.createAssertionError("Invalid file type: " + data.type + ", supported only \"bundle\" type");
		}

		this.boneSets = loadResourceFromContents<BoneSet>(
			data.contents.filter(content => content.type === "bone"),
			assetResolver,
			c => constructBoneTree(c.bones)
		);
		this.skins = loadResourceFromContents<Skin>(
			data.contents.filter(content => content.type === "skin"),
			assetResolver,
			bindTextureFromAsset
		);
		this.animations = loadResourceFromContents<Animation>(
			data.contents.filter(content => content.type === "animation"),
			assetResolver
		);
		this.animations.forEach((animation: Animation) => {
			assignAttributeID(animation);
		});
		this.effectParameters = loadResourceFromContents<vfx.EffectParameterObject>(
			data.contents.filter(content => content.type === "effect"),
			assetResolver,
		);
	}
}
