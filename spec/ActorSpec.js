global.g = require("@akashic/akashic-engine");
var utils = require("./helper/utils.js");
var fs = require("fs");
var Actor = require("../lib/Actor.js");
var Resource = require("../lib/Resource.js");
var CellAttachment = require("../lib/CellAttachment.js");
var CircleCollider = require("../lib/CircleCollider.js");
var AttrId = require("../lib/AttrId.js");

describe("Actor", function() {
	var scene;
	var resource;
	var param;
	var actor;

	beforeEach(function() {
		var game = new g.Game({width: 320, height: 320, fps: 30});
		scene = new g.Scene({game: game});

		utils.createImageAsset("stickman.png", scene);
		utils.createTextAsset("an_anime_1.asaan", scene);
		utils.createTextAsset("an_anime_1_bezier.asaan", scene);
		utils.createTextAsset("an_anime_1_liner.asaan", scene);
		utils.createTextAsset("bn_stickman.asabn", scene);
		utils.createTextAsset("pj_stickman.asapj", scene);
		utils.createTextAsset("sk_stickman.asask", scene);

		resource = new Resource();
		resource.loadProject("pj_stickman", scene.assets);

		param = {
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

	afterEach(function() {
		// nothing to do
	});

	it("should construct itself with param object properly", function() {
		expect(actor.width).toBe(256);
		expect(actor.height).toBe(256);
		expect(actor._cntr).toBe(0);
		expect(actor._nextCntr).toBe(0);
		expect(actor.pause).toBe(false);
		expect(actor.loop).toBe(true);
		expect(actor.nullVisible).toBe(false);
		expect(actor.boneCoordsVisible).toBe(false);
		expect(actor.colliderVisible).toBe(false);
		expect(actor.currentFrame).toBe(0);
		expect(actor.resource).toBe(resource);
		expect(actor.animation.name).toBe("anime_1");
		expect(actor.skins["stickman"].name).toBe("stickman");
	});

	it("can add collider to itself", function() {
		var collider = new CircleCollider("marui", false, "none");
		var numCollider = actor.colliders.length;
		actor.addCollider(collider);
		expect(actor.colliders.length).toBe(numCollider + 1);
	});

	it("can remove collider from itself", function() {
		var collider = new CircleCollider("marui", false, "none");
		var numCollider = actor.colliders.length;
		actor.addCollider(collider);
		actor.removeCollider(collider);
		expect(actor.colliders.length).toBe(numCollider);
	});

	describe("playing animation", function() {
		var startFrame = 0;
		var isLoop = false;
		var playSpeed = 1.0;

		beforeEach(function() {
			actor.play(param.animationName, startFrame, isLoop, playSpeed);
		});

		it("should be ready for playing next frame", function() {
			expect(actor.currentFrame).toBe(startFrame);
			expect(actor.loop).toBe(isLoop);
			expect(actor.playSpeed).toBe(playSpeed);
		});

		it("should have an incremented frame counter internally after calling calc()", function() {
			actor.calc();
			expect(actor.currentFrame).toBe(startFrame);
			expect(actor._nextCntr).toBe(startFrame + 1);
		});

		it("should normalize current frame value based on loop flag if it's out of range (actor.loop===false)", function() {
			// actor's current animation length === 30;
			actor.loop = false;

			actor.currentFrame = 1000;
			expect(actor.currentFrame).toBe(29);
			actor.currentFrame = -1;
			expect(actor.currentFrame).toBe(0);
			actor.currentFrame = 10;
			expect(actor.currentFrame).toBe(10);
		});

		it("should normalize current frame value based on loop flag if it's out of range (actor.loop===true)", function() {
			// actor's current animation length === 30;
			actor.loop = true;
			actor.currentFrame = 1000;
			expect(actor.currentFrame).toBe(10); // 1000 - 30 * 33
			actor.currentFrame = -1;
			expect(actor.currentFrame).toBe(29); // 30 - 1
			actor.currentFrame = 10;
			expect(actor.currentFrame).toBe(10);
		});
	});

	describe("playing loop animation", function() {
		beforeEach(function() {
			actor.play(param.animationName, 0, true, 1.0);
		});

		it("should reach zero frame at next frame of last frame", function() {
			var animation = resource.getAnimationByName(param.animationName);

			for (var i = 0; i < animation.frameCount + 1; i++) {
				actor.calc();
			}

			expect(actor.currentFrame).toBe(0);
		});
	});

	describe("playing loop animation with handler", function() {
		var handlerName;
		var passedUserDataCount;

		beforeEach(function() {
			handlerName = "handler name";
			actor.calculated("root", true).handle(this, function(param) {
				if (param.left.time === param.currentFrame && param.left.userData) {
					passedUserDataCount++;
				}
			}, handlerName);
			passedUserDataCount = 0;
		});

		it("should list gunners", function() {
			expect(actor.skeleton._triggeringBones.length).toBe(1);

			actor.calculated("root", true).handle(function(param) {}, "hdlrR");
			expect(actor.skeleton._triggeringBones.length).toBe(1);

			actor.calculated("body", true).handle(function(param) {}, "hdlrB");
			expect(actor.skeleton._triggeringBones.length).toBe(2);
		});

		it("(at playSpeed = 0.4) should call handler properly", function() {
			actor.play(param.animationName, 0, true, 0.4);
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();
			}
			// last frame = 29 * 0.4 = 11.6
			expect(passedUserDataCount).toBe(1);
		});

		it("(at playSpeed = 1.0) should call handler properly", function() {
			actor.play(param.animationName, 0, true, 1.0);
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();
			}
			// last frame = 29 * 1.0 = 29
			expect(passedUserDataCount).toBe(2);
		});

		it("(at playSpeed = 1.25) should call handler properly", function() {
			actor.play(param.animationName, 0, true, 1.25);
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();
			}
			// last frame = 29 * 1.25 = 36.25
			expect(passedUserDataCount).toBe(2);
		});

		it("(at playSpeed = 5.0) should call handler properly", function() {
			actor.play(param.animationName, 0, true, 5.0);
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();
			}
			// last frame = 29 * 5.0 = 145
			expect(passedUserDataCount).toBe(10);
		});

		it("(at playSpeed = -0.4) should call handler properly", function() {
			actor.play(param.animationName, 0, true, -0.4);
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();
			}
			// last frame = 29 * -0.4 = -11.6 -> -11.6 + 30 = 18.4
			expect(passedUserDataCount).toBe(1);
		});

		it("(at playSpeed = -1.0) should call handler properly", function() {
			actor.play(param.animationName, 0, true, -1.0);
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();
			}
			// last frame = 29 * -1.0 = -29 -> -29 + 30 = 1
			expect(passedUserDataCount).toBe(2);
		});

		it("(at playSpeed = -1.25) should call handler properly", function() {
			actor.play(param.animationName, 0, true, -1.25);
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();
			}
			// last frame = 29 * -1.25 = -36.25 -> -36.25 + 30 + 30 = 23.75
			expect(passedUserDataCount).toBe(3);
		});

		it("(at playSpeed = -5.0) should call handler properly", function() {
			actor.play(param.animationName, 0, true, -5.0);
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();
			}
			// last frame = 29 * -5.0 = -145 -> -145 + 30 + 30 + 30 + 30 + 30 = 5
			expect(passedUserDataCount).toBe(10);
		});
	});

	it("should return undefined when attaching with incorrect cell name", function() {
		expect(actor.attach("dingdongdang", "body")).toBeUndefined();
	});

	it("should return cell attachment when attaching with cell name", function() {
		var attachment = actor.attach("sword", "arm_l2");
		expect(attachment).toBeDefined();
		expect(attachment instanceof CellAttachment).toBe(true);
	});

	it("should remove attachment from its skeleton", function() {
		var attachment = actor.attach("sword", "arm_l2");
		expect(attachment).toBeDefined();
		expect(function() { actor.removeAttachment(attachment); }).not.toThrow();
	});

	it("should render itself", function() {
		var renderer = {
			save: function() { },
			restore: function() { },
			opacity: function(o) { },
			transform: function(m) { },
			fillRect: function(x, y, w, h, c) { },
			drawImage: function(s, x, y, w, h, tx, ty) { }
		};

		actor.nullVisible = true;
		actor.boneCoordsVisible = true;
		actor.colliderVisible = true;
		actor.attach("sword", "arm_l2", new g.PlainMatrix(0, 0, 1, 1, 0));

		var animation = resource.getAnimationByName(param.animationName);

		for (var i = 0; i < animation.frameCount; i++) {
			actor.calc();
			expect(function() { actor.renderSelf(renderer, undefined); }).not.toThrow();
		}
	});

	describe("animation to change attributes", function() {
		var game;
		var scene;
		var resource;
		var param;

		beforeEach(function() {
			game = new g.Game({width: 320, height: 320, fps: 30});
			scene = new g.Scene({game: game});

			utils.createImageAsset("change_attributes.png", scene);
			utils.createTextAsset("an_change_local_alpha.asaan", scene);
			utils.createTextAsset("an_change_local_scale.asaan", scene);
			utils.createTextAsset("bn_change_attributes.asabn", scene);
			utils.createTextAsset("pj_change_attributes.asapj", scene);
			utils.createTextAsset("sk_change_attributes.asask", scene);

			resource = new Resource();
			resource.loadProject("pj_change_attributes", scene.assets);

			param = {
				scene: scene,
				resource: resource,
				animationName: "",
				skinNames: ["change_attributes"],
				boneSetName: "change_attributes",
				width: 320,
				height: 320
			};
		});

		it("should change local scale", function() {
			param.animationName = "change_local_scale";
			var actor = new Actor(param);
			var getTargetMatrixs = function() {
				return actor.skeleton.composedCaches.map(function(cache) {
					return cache.m._matrix.slice();
				});
			};
			actor.calc();
			var beforeMatrixs = getTargetMatrixs();
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();

				// bodyパーツのマトリクスのm21とm22の値は変わるが、それ以外の値は変わらない
				expect(actor.skeleton.composedCaches[1].m._matrix[0]).toBe(beforeMatrixs[1][0]);
				expect(actor.skeleton.composedCaches[1].m._matrix[1]).toBe(beforeMatrixs[1][1]);
				expect(actor.skeleton.composedCaches[1].m._matrix[2]).not.toBe(beforeMatrixs[1][2]);
				expect(actor.skeleton.composedCaches[1].m._matrix[3]).not.toBe(beforeMatrixs[1][3]);

				// arm_legパーツのマトリクスのm11とm12の値は変わるが、それ以外の値は変わらない
				expect(actor.skeleton.composedCaches[2].m._matrix[0]).not.toBe(beforeMatrixs[2][0]);
				expect(actor.skeleton.composedCaches[2].m._matrix[1]).not.toBe(beforeMatrixs[2][1]);
				expect(actor.skeleton.composedCaches[2].m._matrix[2]).toBe(beforeMatrixs[2][2]);
				expect(actor.skeleton.composedCaches[2].m._matrix[3]).toBe(beforeMatrixs[2][3]);

				// arm_leg_1パーツのマトリクスの値は変わらない
				expect(actor.skeleton.composedCaches[3].m._matrix[0]).toBe(beforeMatrixs[3][0]);
				expect(actor.skeleton.composedCaches[3].m._matrix[1]).toBe(beforeMatrixs[3][1]);
				expect(actor.skeleton.composedCaches[3].m._matrix[2]).toBe(beforeMatrixs[3][2]);
				expect(actor.skeleton.composedCaches[3].m._matrix[3]).toBe(beforeMatrixs[3][3]);

				beforeMatrixs = getTargetMatrixs();
			}
		});

		it("should reflect local alpha", function() {
			param.animationName = "change_local_alpha";
			var actor = new Actor(param);
			var getAlphaValues = function() {
				return actor.skeleton.composedCaches.map(function(cache) {
					return cache.attrs[AttrId.alpha];
				});
			};
			actor.calc();
			var beforeAlphaValues = getAlphaValues();
			for (var i = 0; i < resource.getAnimationByName(param.animationName).frameCount; i++) {
				actor.calc();

				// bodyパーツのローカルα値が固定値となっているためbodyパーツのα値は変わらないが、rootパーツでα値が設定されているため他パーツのα値は変わる
				expect(actor.skeleton.composedCaches[0].attrs[AttrId.alpha]).not.toBe(beforeAlphaValues[0]);
				expect(actor.skeleton.composedCaches[1].attrs[AttrId.alpha]).toBe(beforeAlphaValues[1]);
				expect(actor.skeleton.composedCaches[2].attrs[AttrId.alpha]).not.toBe(beforeAlphaValues[2]);
				expect(actor.skeleton.composedCaches[3].attrs[AttrId.alpha]).not.toBe(beforeAlphaValues[3]);

				beforeAlphaValues = getAlphaValues();
			}
		});
	});
});
