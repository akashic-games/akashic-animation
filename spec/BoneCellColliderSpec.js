global.g = require("@akashic/akashic-engine");
var utils = require("./helper/utils.js");
var Actor = require("../lib/Actor.js");
var Resource = require("../lib/Resource.js");

describe("BoneCellCollider", function() {
	var actor;

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
	});

	it("has its own name", function() {
		var colliders = actor.colliders;
		expect(colliders.length).toBe(2);
		var collider = colliders[1];
		expect(collider.name).toBe("sword");
	});

	it("can return collision volume if Actor#calc() has already been invoked", function() {
		var collider = actor.colliders[0];
		expect(collider.getVolume()).toBeUndefined();

		actor.calc();
		expect(collider.getVolume()).toBeDefined();
		expect(collider.getVolume().aabb()).toBeDefined();
	});

	it("should return undefined if not enabled", function() {
		actor.calc();
		var collider = actor.colliders[0];
		collider.enabled = false;
		expect(collider.getVolume()).toBeUndefined();
	});
});
