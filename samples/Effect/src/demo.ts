import * as asa from "@akashic-extension/akashic-animation";
import * as UI from "./UI";

const game = g.game;

const ACTOR_PLAY_SPEED = 1.0;
const ASA_PJ_NAME = "pj_ParticleTest";

class DemoScene extends g.Scene {
	actor: asa.Actor;
	equipment: any;
	indicator: UI.Indicator;

	constructor(param: g.SceneParameterObject) {
		super(param);
		this.onLoad.add(this.onLoaded, this);
	}

	onLoaded() {
		const resource = new asa.Resource();
		resource.loadProject(ASA_PJ_NAME, this.assets, game.assets);

		const param = {
			scene: this,
			resource: resource,
			animationName: "anim_anime_1",
			skinNames: [],
			boneSetName: "anim",
			width: 320,
			height: 320,
			playSpeed: ACTOR_PLAY_SPEED
		};
		this.actor = new asa.Actor(param);
		this.actor.x = g.game.width / 2;
		this.actor.y = g.game.height / 2;
		this.actor.boneCoordsVisible = true;
		this.append(this.actor);

		this.indicator = new UI.Indicator(this);
		this.append(this.indicator);

		this.onUpdate.add(this._onUpdateHandler, this);
	}

	private _onUpdateHandler(): void {
		this.actor.modified();
		this.actor.calc();
		this.indicator.position = this.actor.currentFrame / (this.actor.animation.frameCount - 1);
		this.indicator.modified();
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
	// ASA_PJ_NAMEアセットはグローバル設定 (see: game.json)
	const sspj = JSON.parse((<g.TextAsset>game.assets[ASA_PJ_NAME]).data);

	// ss2asaのユーザデータ出力機能で関連アセット名を取得
	const relatedFileInfo = sspj.contents.userData.relatedFileInfo;
	const skinImageAssetNames = getAssetNames(relatedFileInfo, "imageFileNames");
	const animationAssetNames = getAssetNames(relatedFileInfo, "animationFileNames");
	const bonesetAssetNames = getAssetNames(relatedFileInfo, "boneSetFileNames");
	const skinAssetNames = getAssetNames(relatedFileInfo, "skinFileNames");
	const effectAssetNames = getAssetNames(relatedFileInfo, "effectFileNames");

	return new DemoScene({
		game: game,
		assetIds: [].concat(
			skinImageAssetNames,
			animationAssetNames,
			bonesetAssetNames,
			skinAssetNames,
			effectAssetNames
		)
	});
}
