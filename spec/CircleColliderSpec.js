global.g = require("@akashic/akashic-engine");
var utils = require("./helper/utils.js");
var Actor = require("../lib/Actor.js");
var Resource = require("../lib/Resource.js");
var CircleCollider = require("../lib/CircleCollider.js");

describe("CircleCollider", function() {
	var actor;
	var circleCollider;

	beforeEach(function() {

		var game = new g.Game({width: 320, height: 320, fps: 30});
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
		circleCollider = new CircleCollider("head", true, "none");
		actor.addCollider(circleCollider);
	});

	it("has its own name", function() {
		expect(circleCollider.name).toBe("head");
	});

	it("can return collision volume if Actor#calc() has already been invoked", function() {
		expect(circleCollider.getVolume()).toBeUndefined();

		actor.calc();
		expect(circleCollider.getVolume()).toBeDefined();
		expect(circleCollider.getVolume().aabb()).toBeDefined();
	});

	it("should return undefined if not enabled", function() {
		actor.calc();
		circleCollider.enabled = false;
		expect(circleCollider.getVolume()).toBeUndefined();
	});
});