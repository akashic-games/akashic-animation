const g = require("@akashic/akashic-engine");
const utils = require("../helper/utils");
const { AssetResolver } = require("../../lib/auxiliary/AssetResolver");

global.g = g;

const { readFileSync } = require("fs");
const { ImageAsset, TextAsset } = require("@akashic/pdi-common-impl");
const { parse } = require("path");

// utils.createImageAsset() に asset.path を与えられるように修正した関数
// NOTE: 既存のテストに影響を与えないため utils とは別に定義する
function createImageAsset(fileName, assetPath) {
	const assetId = parse(fileName).name;
	const asset = new ImageAsset(assetId, assetPath, 256, 256);
	asset.asSurface = () => ({ width: 256, height: 256 });
	return asset;
}

// utils.createTextAsset() に asset.path を与えられるように修正した関数
// NOTE: 既存のテストに影響を与えないため utils とは別に定義する
function createTextAsset(fileName, assetPath) {
	const assetId = parse(fileName).name;
	const asset = new TextAsset(assetId, assetPath);
	asset.data = readFileSync("./spec/asset/text/" + fileName);
	return asset;
}

function prepare() {
	const game = new g.Game(utils.gameParam);
	const scene = new g.Scene({ game });
	return { game, scene };
}

function createMockAssetAccessor({ scene, base }) {
	const accessor = scene.asset;

	const assets = [
		...["stickman.png"].map(name => createImageAsset(name, g.PathUtil.resolvePath(base, name))),
		...["pj_stickman.asapj", "bn_stickman.asabn", "sk_stickman.asask"].map(name => createTextAsset(name, g.PathUtil.resolvePath(base, name))),
	];

	const resolveAsset = pathOrId => assets.find(asset => asset.id === pathOrId || asset.path === pathOrId);

	spyOn(accessor, "getImage").and.callFake(resolveAsset);
	spyOn(accessor, "getText").and.callFake(resolveAsset);

	const assetsMap = {};
	for (const asset of assets) {
		assetsMap[asset.id] = asset;
	}

	return {
		assets,
		assetsMap,
		accessor,
	};
}

describe("AssetResolver", () => {

	function doTest(resolver) {
		const stickman = resolver.getImage("stickman");
		expect(stickman.path).toBe("/path/to/base/stickman.png");

		const projectData = resolver.getJSON("pj_stickman.asapj");
		expect(projectData.version).toBe("2.0.0");
		expect(projectData.contents).toBeDefined(); // NOTE: 中身は関与しない

		const boneData = resolver.getJSON("bn_stickman.asabn");
		expect(boneData.version).toBe("2.0.0");
		expect(boneData.contents).toBeDefined(); // NOTE: 中身は関与しない

		const skeletonData = resolver.getJSON("sk_stickman.asask");
		expect(skeletonData.version).toBe("2.0.0");
		expect(skeletonData.contents).toBeDefined(); // NOTE: 中身は関与しない
	}

	it("access via the AssetsMap", () => {
		const base = "/path/to/base";
		const { assetsMap } = createMockAssetAccessor({ ...prepare(), base });
		const resolver = new AssetResolver(assetsMap);
		doTest(resolver);
	});

	it("access via the AssetAccessor", () => {
		const base = "/path/to/base";
		const { accessor } = createMockAssetAccessor({ ...prepare(), base });
		const resolver = new AssetResolver(accessor, base);
		doTest(resolver);
	});
});
