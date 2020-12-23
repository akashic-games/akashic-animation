import * as asa from "@akashic-extension/akashic-animation";
import * as UI from "./UI";

const game = g.game;

const ACTOR_PLAY_SPEED = 1.0;
const GROUND_TOP = 426;
const BUTTON_IMAGE_ASSET_NAMES = [
	"showbone",
	"torch"
];
const ASA_PJ_NAME = "pj_fireman";

function invertMatrix(m: [number, number, number, number, number, number]): [number, number, number, number, number, number] {
	const a = m[0];
	const b = m[1];
	const c = m[2];
	const d = m[3];
	const dt = a * d - b * c;	// det
	if (dt === 0) {
		return undefined;
	}
	const e = m[4];
	const f = m[5];

	const mi = <[number, number, number, number, number, number]>new Array<number>(6);
	mi[0] =  d / dt;
	mi[1] = -b / dt;
	mi[2] = -c / dt;
	mi[3] =  a / dt;
	mi[4] =  (c * f - d * e) / dt;
	mi[5] = -(a * f - b * e) / dt;

	return mi;

}

class ActorAttachment extends asa.Attachment {
	actor: asa.Actor;

	constructor(actor: asa.Actor) {
		super();
		this.actor = actor;
	}

	render(renderer: g.Renderer): void {
		const mi = invertMatrix(this.posture.m._matrix);
		if (! mi) {
			return;
		}

		renderer.save();
		{
			renderer.transform(mi); // cancel posture matrix
			renderer.transform([1, 0, 0, 1, this.posture.m._matrix[4], this.posture.m._matrix[5]]);
			this.actor.render(renderer);
		}
		renderer.restore();
	}
}

class DemoScene extends g.Scene {
	runner: asa.Actor;
	torch: asa.Actor;
	darkness: g.FilledRect;
	equipment: any;
	indicator: UI.Indicator;
	attachment: asa.Attachment;

	constructor(param: g.SceneParameterObject) {
		super(param);
		this.onLoad.add(this.handleLoad, this);
	}

	handleLoad() {
		//
		// Load ASA resource
		//
		const resource = new asa.Resource();
		resource.loadProject(ASA_PJ_NAME, this.assets, game.assets);

		//
		// Setup Actors
		//
		this.setupRunner(resource);
		this.setupTorch(resource);

		//
		// Setup Ground
		//
		this.append(new g.FilledRect({
			scene: this,
			x: 0,
			y: GROUND_TOP,
			width: game.width,
			height: game.height - GROUND_TOP,
			cssColor: "#B16833"
		}));

		//
		// Setup darkness
		//
		this.darkness = new g.FilledRect({
			scene: this,
			x: 0,
			y: 0,
			width: game.width,
			height: game.height,
			cssColor: "#000000"
		});
		this.darkness.opacity = 0.4;
		this.append(this.darkness);

		//
		// Setup UI
		//
		this.setupButtons();
		this.indicator = new UI.Indicator(this);
		this.append(this.indicator);

		this.onUpdate.add(this.handleUpdate, this);
	}

	handleUpdate(): void {
		this.runner.modified();
		this.runner.calc();
		this.torch.modified();
		this.torch.calc();
		this.indicator.position = this.runner.currentFrame / (this.runner.animation.frameCount - 1);
		this.indicator.modified();
	}

	private setupRunner(resource: asa.Resource): void {
		const param = {
			scene: this,
			resource: resource,
			animationName: "run",
			skinNames: ["fireman"],
			boneSetName: "fireman",
			width: 320,
			height: 320,
			playSpeed: ACTOR_PLAY_SPEED
		};

		this.runner = new asa.Actor(param);
		this.runner.x                 = 16;
		this.runner.y                 = 128;
		this.runner.colliderVisible   = false;
		this.runner.boneCoordsVisible = false;

		this.append(this.runner);
	}

	private setupTorch(resource: asa.Resource): void {
		const param = {
			scene: this,
			resource: resource,
			animationName: "burn",
			skinNames: ["fire"],
			boneSetName: "torch",
			width: 64,
			height: 128,
			playSpeed: ACTOR_PLAY_SPEED
		};

		this.torch = new asa.Actor(param);
		this.torch.x                 = 0;
		this.torch.y                 = 0;
		this.torch.colliderVisible   = false;
		this.torch.boneCoordsVisible = false;

		this.attachment = new ActorAttachment(this.torch);
	}

	private setupButtons(): void {
		let btnX = 0;

		const showBoneBtn = new UI.ToggleButton({
			scene: this,
			src: this.asset.getImageById("showbone"),
			x: btnX,
			y: 0,
			touchable: true,
			onoff: this.runner.nullVisible
		});
		showBoneBtn.toggled.add((onoff: boolean) => {
			if (onoff) {
				this.runner.boneCoordsVisible = true;
			} else {
				this.runner.boneCoordsVisible = false;
			}
		});
		this.append(showBoneBtn);
		btnX += showBoneBtn.width;

		const torchBtn = new UI.ToggleButton({
			scene: this,
			src: this.asset.getImageById("torch"),
			x: btnX,
			y: 0,
			touchable: true,
			onoff: false
		});
		torchBtn.toggled.add((onoff: boolean) => {
			if (onoff) {
				this.runner.attach(this.attachment, "arm_l3");
				this.runner.playSpeed = ACTOR_PLAY_SPEED * 2.5;
				this.darkness.hide();
			} else {
				this.runner.removeAttachment(this.attachment);
				this.runner.playSpeed = ACTOR_PLAY_SPEED;
				this.darkness.show();
			}
		});
		this.append(torchBtn);
	}
}

function getAssetNames(relatedFileInfo: any, target: string): string[] {
	const assetNames: string[] = [];
	const fileNames: string[] = <string[]>relatedFileInfo[target];

	for (let i = 0; i < fileNames.length; i++) {
		const fileName = fileNames[i];
		const matches = fileName.match(/(.*)\.[^.]+$/);
		const assetName = matches ? matches[1] : fileName;
		assetNames.push(assetName);
	}

	return assetNames;
}

export function createScene(snapshot: any) {
	// NOTE: ASA_PJ_NAMEアセットはグローバル設定
	const sspj = JSON.parse((<g.TextAsset>game.assets[ASA_PJ_NAME]).data);
	// NOTE: ss2asaのユーザデータ出力機能で関連アセット名を取得
	const relatedFileInfo = sspj.contents.userData.relatedFileInfo;
	const skinImageAssetNames = getAssetNames(relatedFileInfo, "imageFileNames");
	const animationAssetNames = getAssetNames(relatedFileInfo, "animationFileNames");
	const bonesetAssetNames = getAssetNames(relatedFileInfo, "boneSetFileNames");
	const skineAssetNames = getAssetNames(relatedFileInfo, "skinFileNames");

	return new DemoScene({
		game: game,
		assetIds: [].concat(
			BUTTON_IMAGE_ASSET_NAMES,
			skinImageAssetNames,
			animationAssetNames,
			bonesetAssetNames,
			skineAssetNames
		)
	});
}
