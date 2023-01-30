import * as asa from "@akashic-extension/akashic-animation";
import * as UI from "./UI";
import { TimeInfo } from "./TimeInfo";
import { SmokeEmitter } from "./Smoke";

const game = g.game;

const ACTOR_PLAY_SPEED = 1.0;
const GROUND_TOP = 426;
const BUTTON_IMAGE_ASSET_NAMES = [
	"showbone",
	"speedctrl"
];
const ASA_PJ_NAME = "pj_runningman";

class DemoScene extends g.Scene {
	actor: asa.Actor;
	equipment: any;
	indicator: UI.Indicator;
	emitter: SmokeEmitter;
	timeInfo: TimeInfo;

	constructor(param: g.SceneParameterObject) {
		super(param);
		this.onLoad.add(this.onLoaded, this);
		this.timeInfo = new TimeInfo(1.0);
	}

	onLoaded() {
		//
		// Load ASA resource
		//
		const resource = new asa.Resource();
		resource.loadProject(ASA_PJ_NAME, this.assets, game.assets);

		//
		// Setup Actor
		//
		const param = {
			scene: this,
			resource: resource,
			animationName: "run",
			skinNames: ["runningman"],
			boneSetName: "runningman",
			width: 320,
			height: 320,
			playSpeed: ACTOR_PLAY_SPEED
		};
		this.actor = new asa.Actor(param);
		this.actor.x                 = 256;
		this.actor.y                 = 128;
		this.actor.colliderVisible   = false;
		this.actor.boneCoordsVisible = false;
		this.append(this.actor);

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
		// Setup UI
		//
		this.setupButtons();
		this.indicator = new UI.Indicator(this);
		this.append(this.indicator);

		this.emitter = new SmokeEmitter({
			scene: this,
			src: this.asset.getImageById("smoke")
		}, this.timeInfo);

		this.onUpdate.add(this.handleUpdate, this);
	}

	handleUpdate(): void {
		this.actor.modified();
		this.actor.calc();
		this.indicator.position = this.actor.currentFrame / (this.actor.animation.frameCount - 1);
		this.indicator.modified();

		const targetBoneNames = ["leg_r3", "leg_l3"];
		for (let i = 0; i < targetBoneNames.length; i++) {
			const name = targetBoneNames[i];
			const boneMtrx = this.actor.getBoneMatrix(name);
			if (boneMtrx._matrix[5] > GROUND_TOP) {
				this.emitter.emit(boneMtrx._matrix[4], boneMtrx._matrix[5]);
			}
		}

		this.emitter.update();
	}

	private setupButtons(): void {
		let btnX = 0;

		const showBoneBtn = new UI.ToggleButton({
			scene: this,
			src: this.asset.getImageById("showbone"),
			x: btnX,
			y: 0,
			touchable: true,
			onoff: this.actor.nullVisible
		});
		showBoneBtn.toggled.add((onoff: boolean) => {
			if (onoff) {
				this.actor.boneCoordsVisible = true;
			} else {
				this.actor.boneCoordsVisible = false;
			}
		});
		this.append(showBoneBtn);
		btnX += showBoneBtn.width;

		const speedCtrlBtn = new UI.ToggleButton({
			scene: this,
			src: this.asset.getImageById("speedctrl"),
			x: btnX,
			y: 0,
			touchable: true,
			onoff: false
		});
		speedCtrlBtn.toggled.add((onoff: boolean) => {
			if (onoff) {
				this.timeInfo.scale = 0.25;
			} else {
				this.timeInfo.scale = 1.0;
			}
			this.actor.playSpeed = ACTOR_PLAY_SPEED * this.timeInfo.scale;
		});
		this.append(speedCtrlBtn);
		btnX += speedCtrlBtn.width;
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
			["smoke"],
			BUTTON_IMAGE_ASSET_NAMES,
			skinImageAssetNames,
			animationAssetNames,
			bonesetAssetNames,
			skineAssetNames
		)
	});
}
