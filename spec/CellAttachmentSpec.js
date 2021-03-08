global.g = require("@akashic/akashic-engine");
var utils = require("./helper/utils.js");
var Resource = require("../lib/Resource.js").Resource;
var CellAttachment = require("../lib/CellAttachment.js").CellAttachment;

describe("CellAttachment", function() {
	var resource;

	beforeEach(function() {
		var game = new g.Game(utils.gameParam);
		var scene = new g.Scene({game: game});

		utils.createImageAsset("stickman.png", scene);
		utils.createTextAsset("an_anime_1.asaan", scene);
		utils.createTextAsset("an_anime_1_bezier.asaan", scene);
		utils.createTextAsset("an_anime_1_liner.asaan", scene);
		utils.createTextAsset("bn_stickman.asabn", scene);
		utils.createTextAsset("pj_stickman.asapj", scene);
		utils.createTextAsset("sk_stickman.asask", scene);

		resource = new Resource();
		resource.loadProject("pj_stickman", scene.assets);
	});

	it("should constructs itself properly", function() {
		var skin = resource.getSkinByName("stickman");
		expect(skin).not.toBeUndefined()
		var attachment = new CellAttachment("sword", skin);
		expect(attachment.cell).not.toBeUndefined();
		expect(attachment.skin).not.toBeUndefined();
	});
});
