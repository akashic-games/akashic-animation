import type {Animation, Curve} from "./AnimeParams";
import {AttrId} from "./AttrId";
import { AssetResolver } from "./auxiliary/AssetResolver";
import type {Bone} from "./Bone";
import type {BoneSet} from "./BoneSet";
import type { ProjectV3 } from "./serialize";
import { aop } from "./serialize";
import type { AOPSchema } from "./serialize/ArrayOrientedPorter/AOPSchema";
import type {Container} from "./serialize/Container";
import type {ContainerV2} from "./serialize/ContainerV2";
import type {ContainerV3} from "./serialize/ContainerV3";
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

function loadResourceFromTextAsset<T>(
	fileNames: string[],
	assetResolver: AssetResolver
): T[] {
	const resources: T[] = [];

	if (fileNames == null) {
		return resources;
	}

	fileNames.forEach(fname => {
		const data = assetResolver.getJSON<ContainerV2>(fname);
		checkVersion(data.version, fname);
		resources.push(data.contents);
	});

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

	protected loadProjectV2(container: ContainerV2, assetResolver: AssetResolver): void {
		const project = container.contents as ProjectV2;

		if (project.schema == null) {
			this.boneSets = loadResourceFromTextAsset(project.boneSetFileNames, assetResolver);
			this.boneSets.forEach(boneSet => constructBoneTree(boneSet.bones));

			this.skins = loadResourceFromTextAsset(project.skinFileNames, assetResolver);
			this.skins.forEach(skin => bindTextureFromAsset(skin, assetResolver));

			this.animations = loadResourceFromTextAsset(project.animationFileNames, assetResolver);
			this.animations.forEach(animation => assignAttributeID(animation));

			this.effectParameters = loadResourceFromTextAsset(project.effectFileNames, assetResolver);
		} else if (project.schema.type === "aop") {
			const schema = project.schema as AOPSchema;
			const importer = new aop.AOPImporter(schema);

			const boneSets = loadResourceFromTextAsset<any[][]>(project.boneSetFileNames, assetResolver);
			this.boneSets = boneSets.map(boneSet => importer.importBoneSet(boneSet));
			this.boneSets.forEach(boneSet => constructBoneTree(boneSet.bones));

			const skins = loadResourceFromTextAsset<any[][]>(project.skinFileNames, assetResolver);
			this.skins = skins.map(skin => importer.importSkin(skin));
			this.skins.forEach(skin => bindTextureFromAsset(skin, assetResolver));

			const animations = loadResourceFromTextAsset<any[][]>(project.animationFileNames, assetResolver);
			this.animations = animations.map(animation => importer.importAnimation(animation));
			this.animations.forEach(animation => assignAttributeID(animation));

			const effectParameters = loadResourceFromTextAsset<any[][]>(project.effectFileNames, assetResolver);
			this.effectParameters = effectParameters.map(effectParameter => importer.importEffect(effectParameter));
		} else {
			throw g.ExceptionFactory.createAssertionError(`Unknown schema: ${project.schema}`);
		}
	}

	protected loadProjectV3(container: ContainerV3, assetResolver: AssetResolver): void {
		if (container.type !== "bundle") {
			throw  g.ExceptionFactory.createAssertionError(`Invalid container type ${container.type}, supported only bundle type`);
		}

		let project: ProjectV3;
		for (const contents of container.contents) {
			if (contents.type === "project") {
				// ContainerV3 の格納するプロジェクトは必ず ProjectV3 型
				project = contents.data;
				break;
			}
		}

		if (project == null) {
			throw g.ExceptionFactory.createAssertionError("Invalid V3 container: project not found");
		}

		if (project.schema == null) {
			this.boneSets = container.contents
				.filter(content => content.type === "bone")
				.map(content => content.data);
			this.boneSets.forEach(boneSet => constructBoneTree(boneSet.bones));

			this.skins = container.contents
				.filter(content => content.type === "skin")
				.map(content => content.data);
			this.skins.forEach(skin => bindTextureFromAsset(skin, assetResolver));

			this.animations = container.contents
				.filter(content => content.type === "animation")
				.map(content => content.data);
			this.animations.forEach(animation => assignAttributeID(animation));

			this.effectParameters = container.contents
				.filter(content => content.type === "effect")
				.map(content => content.data);
		} else if (project.schema.type === "aop") {
			const schema = project.schema as AOPSchema;
			const importer = new aop.AOPImporter(schema);

			this.boneSets = container.contents
				.filter(content => content.type === "bone")
				.map(content => importer.importBoneSet(content.data));
			this.boneSets.forEach(boneSet => constructBoneTree(boneSet.bones));

			this.skins = container.contents
				.filter(content => content.type === "skin")
				.map(content => importer.importSkin(content.data));
			this.skins.forEach(skin => bindTextureFromAsset(skin, assetResolver));

			this.animations = container.contents
				.filter(content => content.type === "animation")
				.map(content => importer.importAnimation(content.data));
			this.animations.forEach(animation => assignAttributeID(animation));

			this.effectParameters = container.contents
				.filter(content => content.type === "effect")
				.map(content => importer.importEffect(content.data));
		} else {
			throw g.ExceptionFactory.createAssertionError(`Unknown schema: ${project.schema}`);
		}
	}
}
