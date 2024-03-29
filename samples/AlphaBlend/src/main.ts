import * as asa from "@akashic-extension/akashic-animation";

const ASA_PJ_NAME = "pj_practice_swing";
const CSS_COLORS = [
	"green",
	"lime",
	"aqua",
	"yellow",
	"fuchsia",
	"olive",
	"purple",
	"maroon",
	"white",
	"gray",
	"blue",
	"navy",
	"teal"
];
const ALPHA_BLEND_TYPES: asa.AlphaBlendMode[] = ["normal", "add"];

class DemoScene extends g.Scene {
	private actor: asa.Actor = undefined;
	private bgRect: g.FilledRect = undefined;
	private bgColorIndex: number = 0;
	private colorButton: g.E = undefined;
	private alphaBlendIndex: number = 0;

	constructor(param: g.SceneParameterObject) {
		super(param);
		this.onLoad.add(this.onLoaded, this);
	}

	private onLoaded(): void {
		const resource = new asa.Resource();
		resource.loadProject(ASA_PJ_NAME, this.assets, g.game.assets);

		// 背景色
		this.bgRect = new g.FilledRect({
			scene: this,
			cssColor: CSS_COLORS[this.bgColorIndex],
			width: g.game.width,
			height: g.game.height,
			x: 0,
			y: 0,
			touchable: true
		});
		this.bgRect.onPointDown.add(() => {
			this.bgColorIndex = (this.bgColorIndex + 1) % CSS_COLORS.length;
			this.bgRect.cssColor = CSS_COLORS[this.bgColorIndex];
		});
		this.append(this.bgRect);

		// Actor
		this.actor = new asa.Actor({
			scene: this,
			resource: resource,
			animationName: "anime_1",
			skinNames: ["stickman"],
			boneSetName: "stickman",
			width: 320,
			height: 320,
			x: 180,
			y: 180,
			playSpeed: 0.3
		});
		this.append(this.actor);

		// ボタン
		this.colorButton = this.generateColorButton(g.game.width * 3 / 10, g.game.height * 7.5 / 10);
		this.append(this.colorButton);

		const dynamicFont = new g.DynamicFont({
			game: g.game,
			fontFamily: "sans-serif",
			strokeWidth: 0.25,
			size: 16
		});
		const messageLabel = new g.Label({
			text: "ボタンを押すと剣、背景を押すと背景の色が変わります",
			fontSize: 16,
			textAlign: "center",
			textColor: "black",
			font: dynamicFont,
			x: 0,
			y: g.game.height * 9.5 / 10 | 0,
			scene: this
		});
		this.append(messageLabel);

		this.onUpdate.add(() => {
			this.actor.modified();
			this.actor.calc();
		});
	}

	private generateColorButton(x: number, y: number): g.E {
		const button = new g.E({
			scene: this,
			x: x,
			y: y
		});
		const buttonSprite = this.generateButtonSprite("button");
		button.append(buttonSprite);
		const pushedButtonSprite = this.generateButtonSprite("pushed_button");
		pushedButtonSprite.hide();
		button.append(pushedButtonSprite);
		const dynamicFont = new g.DynamicFont({
			game: g.game,
			fontFamily: "sans-serif",
			size: 12,
			fontWeight: "bold"
		});
		const buttonLabel = new g.Label({
			text: this.getButtonText(ALPHA_BLEND_TYPES[this.alphaBlendIndex]),
			fontSize: 12,
			textAlign: "center",
			textColor: "white",
			font: dynamicFont,
			x: buttonSprite.width / 2,
			y: buttonSprite.height / 2,
			scene: this,
			anchorX: 0.5,
			anchorY: 0.5
		});
		button.append(buttonLabel);
		const touchableRect = new g.FilledRect({
			scene: this,
			cssColor: "white",
			width: buttonSprite.width,
			height: buttonSprite.height,
			opacity: 0,
			touchable: true
		});
		touchableRect.onPointDown.add(() => {
			buttonSprite.hide();
			pushedButtonSprite.show();
		});
		touchableRect.onPointUp.add(() => {
			pushedButtonSprite.hide();
			buttonSprite.show();
			this.alphaBlendIndex = (this.alphaBlendIndex + 1) % ALPHA_BLEND_TYPES.length;
			buttonLabel.text = this.getButtonText(ALPHA_BLEND_TYPES[this.alphaBlendIndex]);
			buttonLabel.invalidate();
			this.getBone("dagger").alphaBlendMode = ALPHA_BLEND_TYPES[this.alphaBlendIndex];
		});
		button.append(touchableRect);
		return button;
	}

	private generateButtonSprite(assetId: string): g.Sprite {
		return new g.Sprite({
			scene: this,
			src: this.assets[assetId] as g.ImageAsset,
			width: 120,
			height: 60,
			srcWidth: 205,
			srcHeight: 111
		});
	}

	private getButtonText(alphaBlendMode: asa.AlphaBlendMode): string {
		const buttonText = "α-blend：";
		switch (alphaBlendMode) {
			case "add":
			case "normal":
				return buttonText + alphaBlendMode;
			default:
				return buttonText + "unknown";
		}
	}

	private getBone(name: string): asa.Bone {
		const targetBones = this.actor.skeleton.bones.filter(bone => name === bone.name);
		return targetBones[0];
	}
}

export = (param: g.GameMainParameterObject): void => {
	const scene = new DemoScene({
		game: g.game,
		assetIds: [
			"stickman",
			"button",
			"pushed_button",
			"an_anime_1",
			"bn_stickman",
			"sk_stickman",
			"pj_practice_swing"
		]
	});
	g.game.pushScene(scene);
};
