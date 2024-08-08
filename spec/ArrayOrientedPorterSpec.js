var utils = require("./helper/utils.js");
var aop = require("../lib/serialize/ArrayOrientedPorter");
var fs = require("fs");

describe("ArrayOrientedPorter", function () {
	it("imports and exports ASA data", function () {
		const asapj = JSON.parse(fs.readFileSync("./spec/asset/text/pj_stickman.asapj", "utf8"));

		const { boneSetFileNames, skinFileNames, animationFileNames } = asapj.contents;

		const boneSets = boneSetFileNames.map(fileName => {
			const asabn = JSON.parse(fs.readFileSync(`./spec/asset/text/${fileName}`, "utf8"));
			return asabn.contents;
		});

		const skins = skinFileNames.map(fileName => {
			const asask = JSON.parse(fs.readFileSync(`./spec/asset/text/${fileName}`, "utf8"));
			return asask.contents
		});

		const animations = animationFileNames.map(fileName => {
			const asaan = JSON.parse(fs.readFileSync(`./spec/asset/text/${fileName}`, "utf8"));
			return asaan.contents;
		});

		const exporter = new aop.AOPExporter();

		const exportedBoneSets = boneSets.map(boneSet => exporter.exportBoneSet(boneSet));
		const exportedSkins = skins.map(skin => exporter.exportSkin(skin));
		const exportedAnimations = animations.map(animation => exporter.exportAnimation(animation));

		const importer = new aop.AOPImporter(exporter.getSchema());

		const importedBoneSets = exportedBoneSets.map(boneSet => importer.importBoneSet(boneSet));
		const importedSkins = exportedSkins.map(skin => importer.importSkin(skin));
		const importedAnimations = exportedAnimations.map(animation => importer.importAnimation(animation));

		expect(utils.deepEqual(boneSets, importedBoneSets)).toBe(true);
		expect(utils.deepEqual(skins, importedSkins)).toBe(true);
		expect(utils.deepEqual(animations, importedAnimations)).toBe(true);
	});
});
