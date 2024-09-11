import type { Animation, Curve } from "./AnimeParams";
import { AttrId } from "./AttrId";
import { AssetResolver } from "./auxiliary/AssetResolver";
import type { Bone } from "./Bone";
import type { BoneSet } from "./BoneSet";
import { ArrayOrientedImporter } from "./porter/ArrayOrientedPorter/importer";
import type { Container, ContainerV2, ContainerV3, ProjectV2, ProjectV3, Schema } from "./serialize";
import type { Importer } from "./serialize/Importer";
import type { Skin } from "./Skin";
import type * as vfx from "./vfx";

const versionRegexp = /(\d+)\.\d+.\d+/;

function isContaienr(container: unknown): container is Container {
	return typeof container === "object"
		&& container != null
		&& "version" in container
		&& typeof (container as any).version === "string";
}

function isContainerV2(container: unknown): container is ContainerV2 {
	if (!isContaienr(container)) {
		return false;
	}

	const r = container.version.match(versionRegexp);

	return r && r[1] === "2";
}

function isContainerV3(container: unknown): container is ContainerV3 {
	if (!isContaienr(container)) {
		return false;
	}

	const r = container.version.match(versionRegexp);

	return r && r[1] === "3";
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

/**
 * 複数のファイルの内容を取得する。
 *
 * fileNames が null または undefined の場合、空の配列を返す。
 *
 * 各ファイルは ContainerV2 形式でなければならない。
 *
 * この関数はプロジェクトの持つファイル名のリストを利用してデータを読み込むため
 * に使用される。それらリストは型定義上必須プロパティであるが、歴史的経緯から古
 * いプロジェクトファイルではリストが欠落している懸念がある。そのため、この関数
 * では null または undefined を正常系とし、空の配列を受けった場合と同じ結果に
 * なるようにする。
 *
 * @param fileNames ファイル名前の配列
 * @param assetResolver アセットを取得するためのアクセッサ
 * @returns 読み込んだデータの配列
 */
function getMultipleFileContents(
	fileNames: string[] | null | undefined,
	assetResolver: AssetResolver
): unknown[] {
	const resources: unknown[] = [];

	fileNames?.forEach(fname => {
		const data = assetResolver.getJSON(fname);
		if (isContainerV2(data)) {
			resources.push(data.contents);
		} else {
			throw g.ExceptionFactory.createAssertionError("File is corrupted or has an invalid format: " + fname);
		}
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
 * デフォルトインポーター。
 *
 * データををそのまま返すインポーター。ポーターを利用していないデータを読み込む
 * とき利用する。
 */
class DefaultImporter implements Importer {
	validateSchema(_schema: Schema): boolean {
		return true;
	}

	setSchema(_schema: Schema): void {
		// nop
	}

	importAnimation(data: unknown): Animation {
		return data as Animation;
	}

	importBoneSet(data: unknown): BoneSet {
		return data as BoneSet;
	}

	importSkin(data: unknown): Skin {
		return data as Skin;
	}

	importEffect(data: unknown): vfx.EffectParameterObject {
		return data as vfx.EffectParameterObject;
	}
}

/**
 * アニメーションリソースクラス
 */
export class Resource {
	skins: Skin[] = [];
	boneSets: BoneSet[] = [];
	animations: Animation[] = [];
	effectParameters: vfx.EffectParameterObject[] = [];

	private importers: Importer[];
	private defaultImporter: DefaultImporter;

	constructor() {
		this.importers = [ new ArrayOrientedImporter() ];
		this.defaultImporter = new DefaultImporter();
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

		const data = assetResolver.getJSON(assetNameOrProjectPath);

		if (isContainerV2(data)) {
			this.loadProjectV2(data, assetResolver);
			return;
		}

		if (isContainerV3(data)) {
			this.loadProjectV3(data, assetResolver);
			return;
		}

		throw g.ExceptionFactory.createAssertionError("File is corrupted or has an invalid format: " + assetNameOrProjectPath);
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

		const importer = this.getImporter(project.schema);

		if (importer == null) {
			throw g.ExceptionFactory.createAssertionError(`Unknown schema: ${project.schema}`);
		}

		const boneSets = getMultipleFileContents(project.boneSetFileNames, assetResolver);
		this.boneSets = boneSets.map(boneSet => importer.importBoneSet(boneSet));
		this.boneSets.forEach(boneSet => constructBoneTree(boneSet.bones));

		const skins = getMultipleFileContents(project.skinFileNames, assetResolver) as any[][];
		this.skins = skins.map(skin => importer.importSkin(skin));
		this.skins.forEach(skin => bindTextureFromAsset(skin, assetResolver));

		const animations = getMultipleFileContents(project.animationFileNames, assetResolver) as any[][];
		this.animations = animations.map(animation => importer.importAnimation(animation));
		this.animations.forEach(animation => assignAttributeID(animation));

		const effectParameters = getMultipleFileContents(project.effectFileNames, assetResolver) as any[][];
		this.effectParameters = effectParameters.map(effectParameter => importer.importEffect(effectParameter));
	}

	protected loadProjectV3(container: ContainerV3, assetResolver: AssetResolver): void {
		if (container.type !== "bundle") {
			throw  g.ExceptionFactory.createAssertionError(`Invalid container type ${container.type}, supported only bundle type`);
		}

		let project: ProjectV3;

		for (const content of container.contents) {
			if (content.type === "project") {
				// ContainerV3 の格納するプロジェクトは常に ProjectV3 型
				project = content.data;
				break;
			}
		}

		if (project == null) {
			throw g.ExceptionFactory.createAssertionError("Invalid V3 container: project not found");
		}

		const importer = this.getImporter(project.schema);

		if (importer == null) {
			throw g.ExceptionFactory.createAssertionError(`Unknown schema: ${project.schema}`);
		}

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
	}

	/**
	 * スキーマに応じたインポーターを取得する。
	 *
	 * @param schema スキーマ。
	 * @returns インポーター。存在しない時、null 。
	 */
	protected getImporter(schema: Schema | null | undefined): Importer | null {
		if (schema == null) {
			return this.defaultImporter;
		}

		for (const importer of this.importers) {
			if (importer.validateSchema(schema)) {
				importer.setSchema(schema);
				return importer;
			}
		}

		return null;
	}
}
