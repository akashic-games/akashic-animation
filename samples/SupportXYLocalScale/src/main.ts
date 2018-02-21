import Resource = require("../../../src/Resource");
import Actor = require("../../../src/Actor");
import AttrId = require("../../../src/AttrId");

const ASA_PJ_NAME = "pj_stop_motion";

class DemoScene extends g.Scene {
	private actor: Actor;
	private heartItems: {[key: string]: HeartItem} = {};

	constructor(param: g.SceneParameterObject) {
		super(param);
		this.loaded.add(this.onLoaded, this);
	}

	private onLoaded() {
		const resource = new Resource();
		resource.loadProject(ASA_PJ_NAME, this.assets, g.game.assets);
		this.actor = new Actor({
			scene: this,
			resource: resource,
			animationName: "stop_motion",
			skinNames: ["stickman"],
			boneSetName: "stop_motion",
			width: 320,
			height: 320,
			x: 160,
			y: 160,
			playSpeed: 1.0
		});
		this.append(this.actor);

		this.heartItems["x++"] = this.generateHeartItem("x_plus", 0, 0, 0.7, 0);
		this.heartItems["y++"] = this.generateHeartItem("y_plus", 64, 0, 0, 0.7);
		this.heartItems["x--"] = this.generateHeartItem("x_minus", 128, 0, -0.5, 0);
		this.heartItems["y--"] = this.generateHeartItem("y_minus", 192, 0, 0, -0.5);
		Object.keys(this.heartItems).forEach((key: string) => {
			const heartItem = this.heartItems[key];
			heartItem.sprite.pointMove.add((ev) => {
				const nextX = heartItem.sprite.x + ev.prevDelta.x;
				const nextY = heartItem.sprite.y + ev.prevDelta.y;
				if (
					0 <= nextX
					&& nextX + heartItem.sprite.width <= g.game.width
					&& 0 <= nextY
					&& nextY + heartItem.sprite.height <= g.game.height
				) {
					heartItem.sprite.x = nextX;
					heartItem.sprite.y = nextY;
					heartItem.sprite.modified();
				}
			});
			this.append(heartItem.sprite);
		});

		const messageLabel = new g.SystemLabel({
			text: "ハートを棒人間にくっつけてみよう",
			fontSize: 18,
			textAlign: g.TextAlign.Center,
			textBaseline: g.TextBaseline.Alphabetic,
			textColor: "black",
			fontFamily: g.FontFamily.SansSerif,
			strokeWidth: 0.25,
			x: g.game.width / 2 | 0,
			y: g.game.height * 9 / 10 | 0,
			scene: this
		});
		this.append(messageLabel);

		this.update.add(() => {
			this.actor.colliders.forEach((c) => {
				const volume = c.getVolume();
				if (! volume) return;
				const aabb = volume.aabb();
				const collisions = Object.keys(this.heartItems).filter((key: string) => {
					const item = this.heartItems[key];
					return g.Collision.intersect(
						aabb.origin.x,
						aabb.origin.y,
						aabb.extent.width,
						aabb.extent.height,
						item.sprite.x,
						item.sprite.y,
						item.sprite.width,
						item.sprite.height
					);
				});
				if (collisions.length === 0) {
					this.removeLocalScaleEvent(c.name);
				} else {
					collisions.forEach((key: string) => {
						const item = this.heartItems[key];
						this.generateLocalScaleEvent(c.name, item.localXScale, item.localYScale);
					});
				}
			});
			this.actor.modified();
			this.actor.calc();
		});
	}

	private generateLocalScaleEvent(partsName: string, localXScale: number, localYScale: number): void {
		this.actor.calculated(partsName, true).addOnce((param) => {
			if (param.posture) {
				const t = param.currentFrame / param.frameCount;
				param.posture.attrs[AttrId.lsx] += localXScale * t;
				param.posture.attrs[AttrId.lsy] += localYScale * t;
				param.posture.updateMatrix();
			}
		});
	}

	private removeLocalScaleEvent(partsName: string) {
		const trigger = this.actor.calculated(partsName, false);
		if (trigger) {
			trigger.removeAll();
		}
	}

	private generateHeartItem(assetId: string, x: number, y: number, localXScale: number, localYScale: number): HeartItem {
		const sprite = new g.Sprite({
			scene: this,
			src: this.assets[assetId] as g.ImageAsset,
			x: x,
			y: y,
			width: 40,
			height: 40,
			srcWidth: 207,
			srcHeight: 167,
			opacity: 0.6,
			touchable: true
		});
		return {
			sprite,
			localXScale,
			localYScale
		};
	}
}

interface HeartItem {
	sprite: g.Sprite;
	localXScale: number;
	localYScale: number;
}

export = (param: g.GameMainParameterObject): void => {
	const scene = new DemoScene({
		game: g.game,
		assetIds: [
			"stickman",
			"x_minus",
			"x_plus",
			"y_minus",
			"y_plus",
			"an_stop_motion",
			"bn_stop_motion",
			"pj_stop_motion",
			"sk_stickman"
		]
	});
	g.game.pushScene(scene);
};
