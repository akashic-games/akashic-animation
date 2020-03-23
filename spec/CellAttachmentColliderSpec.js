global.g = require("@akashic/akashic-engine");
var utils = require("./helper/utils.js");
var Actor = require("../lib/Actor.js");
var Resource = require("../lib/Resource.js");
var CellAttachmentCollider = require("../lib/CellAttachmentCollider");

describe("CellAttachmentCollider", function() {
	var actor;
	var collider;

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

		var resource = new Resource();
		resource.loadProject("pj_stickman", scene.assets);

		var param = {
			scene: scene,
			resource: resource,
			animationName: "anime_1",
			skinNames: ["stickman"],
			boneSetName: "stickman",
			width: 256,
			height: 256
		};

		actor = new Actor(param);

		var m = new g.PlainMatrix();
		m.update(0, 0, 1, 1, 90, 0, -60);
		attachment = actor.attach("sword", "arm_l2", m);
		collider = new CellAttachmentCollider(attachment, "追加コライダー", false);
		actor.addCollider(collider);
	});

	it("has its own name", function() {
		expect(collider.name).toBe("追加コライダー");
	});

	it("can return collision volume anytime", function() {
		expect(collider.getVolume()).toBeDefined();
		expect(collider.getVolume().aabb()).toBeDefined();
	});

	it("should return undefined if not enabled", function() {
		actor.calc();
		collider.enabled = false;
		expect(collider.getVolume()).toBeUndefined();
	});
});
