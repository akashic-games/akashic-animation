import asa = require("@akashic-extension/akashic-animation");
import Particle = require("./Particle");
import UI = require("./UI");

const game = g.game;

// actor's play speed
const PLAY_SPEED = 0.33;

// button image asset names
const BUTTON_IMAGE_ASSET_NAMES = [
	"loop",
	"particle",
	"play",
	"showbone",
	"subweapon",
	"yrot"
];

// akashic-animation project text asset name
const ASA_PJ_NAME = "pj_stickman";

// Actor parameters
const SKIN_NAMES     = ["stickman"];
const BONESET_NAME   = "stickman";
const ANIMATION_NAME = "anime_1";
const WIDTH          = 320;
const HEIGHT         = 320;

function equipSecondaryBloodSword(actor: asa.Actor): any {
	// attach cell "sword" retrieved from actor's skin by name to bone "arm_l2"
	const m = new g.PlainMatrix();
	m.update(0, 0, 1, 1, -90, 0, 60);
	const attachment = actor.attach("sword", "arm_l2", m);

	// add collider (collision detection object)
	// CellAttachmentCollider uses CellAttachment as collision volume source
	const collider = new asa.CellAttachmentCollider(<asa.CellAttachment>attachment, "追加コライダー", false);
	actor.addCollider(collider);

	return {attachment: attachment, collder: collider};
}

function rotateBody(actor: asa.Actor): void {
	var handler = (param: asa.AnimationHandlerParams.AnimationHandlerParam) => {
		const t = param.currentFrame / param.frameCount;
		param.posture.attrs[asa.AttrId.sx] = Math.cos(Math.PI * 2 * t * 4 + Math.PI / 2);
		param.posture.updateMatrix();
	};
	actor.calculated("body", true).add(handler);
}

function stopBody(actor: asa.Actor): void {
	const trigger = actor.calculated("body", false);
	if (trigger) {
		trigger.removeAll();
	}
}

function updateParticles(actor: asa.Actor, particles: Particle[]) {
	const colliders = actor.colliders;

	for (let i = 0; i < particles.length; i++) {
		const p = particles[i];

		if (p.collidable) {
			colliders.forEach((c: asa.Collider) => {
				const volume = c.getVolume();
				if (! volume) return;
				const aabb = volume.aabb();
				if (aabb.origin.x - aabb.extent.width < p.x && p.x < aabb.origin.x + aabb.extent.width) {
					if (aabb.origin.y - aabb.extent.height < p.y && p.y < aabb.origin.y + aabb.extent.height) {
						p.collide();
					}
				}
			});
		}

		particles[i].update();
	}
}

function attachBoneNameText(actor: asa.Actor): asa.Attachment[] {
	const attachments: asa.Attachment[] = [];
	actor.skeleton.bones.forEach((bone: asa.Bone) => {
		attachments.push(actor.attach(new SystemTextAttachment(bone.name), bone.name));
	});
	return attachments;
}

function removeBoneNameText(actor: asa.Actor, attachments: asa.Attachment[]): void {
	if (! attachments) {
		return;
	}
	attachments.forEach((attachment: asa.Attachment) => {
		actor.removeAttachment(attachment);
	});
}

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

class SystemTextAttachment extends asa.Attachment {
	text: string;

	constructor(text: string) {
		super();
		this.text = text;
	}

	render(renderer: g.Renderer): void {
		const mi = invertMatrix(this.posture.m._matrix);
		if (! mi) {
			return;
		}

		renderer.save();
		{
			renderer.transform(mi); // cancel posture matrix
			renderer.drawSystemText(
				this.text,
				this.posture.m._matrix[4], this.posture.m._matrix[5], 128,
				12, g.TextAlign.Left, g.TextBaseline.Alphabetic, "#FF8080", g.FontFamily.Monospace,
				4, "#000FF", false
			);
		}
		renderer.restore();
	}
}

class DemoScene extends g.Scene {
	actor: asa.Actor;
	equipment: any;
	particles: Particle[] = [];
	indicator: UI.Indicator;
	playBtn: UI.ToggleButton;
	attachments: asa.Attachment[];

	constructor(param: g.SceneParameterObject) {
		super(param);
		this.loaded.add(this.onLoaded, this);
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
			animationName: ANIMATION_NAME,
			skinNames: SKIN_NAMES,
			boneSetName: BONESET_NAME,
			width: WIDTH,
			height: HEIGHT,
			playSpeed: PLAY_SPEED
		};
		this.actor = new asa.Actor(param);
		this.actor.x                 = 256;
		this.actor.y                 = 128;
		this.actor.colliderVisible   = true;
		this.actor.nullVisible       = false;
		this.actor.boneCoordsVisible = false;
		this.actor.ended.add(() => {
			this.playBtn.setState(false);
			game.logger.info("アニメーション再生終了イベント");
		});
		this.actor.calculated("root", true).add((param: asa.AnimationHandlerParams.AnimationHandlerParam) => {
			if (param.left.time === param.currentFrame && param.left.userData) {
				game.logger.info(
					(param.posture ? "[P]" : "[_]") +
					"root: " + param.currentFrame + ": " +
					param.left.userData.str +
					(param.posture ? "" : "(handling past user data)")
				);
			}
			if (param.posture) {
				param.posture.updateMatrix();
			}
		});
		this.actor.play(ANIMATION_NAME, 0, true, PLAY_SPEED);
		this.append(this.actor);

		//
		// Setup UI
		//
		this.setupButtons();
		this.indicator = new UI.Indicator(this);
		this.append(this.indicator);

		//
		// Setup particle
		//
		for (let i = 0; i < 30; i++) {
			this.particles.push(new Particle(this));
		}

		this.update.add(this.onUpdate, this);
	}

	onUpdate(): void {
		updateParticles(this.actor, this.particles);
		this.actor.modified();
		this.actor.calc();
		this.indicator.position = this.actor.currentFrame / (this.actor.animation.frameCount - 1);
		this.indicator.modified();
	}

	private setupButtons(): void {
		let btnX = 0;

		const showBoneBtn = new UI.ToggleButton({scene: this, src: this.assets["showbone"], x: btnX, y: 0, touchable: true, onoff: this.actor.nullVisible});
		showBoneBtn.toggled.add((onoff: boolean) => {
			if (onoff) {
				this.actor.nullVisible = true;
				this.actor.boneCoordsVisible = true;
				this.attachments = attachBoneNameText(this.actor);
				game.logger.info("NULLとボーン座標系の表示");
			} else {
				this.actor.nullVisible = false;
				this.actor.boneCoordsVisible = false;
				removeBoneNameText(this.actor, this.attachments);
				game.logger.info("NULLとボーン座標系の非表示");
			}
		});
		this.append(showBoneBtn);
		btnX += showBoneBtn.width;

		const subWeaponBtn = new UI.ToggleButton({scene: this, src: this.assets["subweapon"], x: btnX, y: 0, touchable: true, onoff: false});
		subWeaponBtn.toggled.add((onoff: boolean) => {
			if (onoff) {
				this.equipment = equipSecondaryBloodSword(this.actor);
				game.logger.info("サブウェポンの装備");
			} else if (this.equipment) {
				this.actor.removeAttachment(this.equipment.attachment);
				this.actor.removeCollider(this.equipment.collider);
				game.logger.info("サブウェポンの非装備");
			}
		});
		this.append(subWeaponBtn);
		btnX += subWeaponBtn.width;

		const yrotBtn = new UI.ToggleButton({scene: this, src: this.assets["yrot"], x: btnX, y: 0, touchable: true, onoff: false});
		yrotBtn.toggled.add((onoff: boolean) => {
			if (onoff) {
				rotateBody(this.actor);
				game.logger.info("アニメーション計算ハンドラによる回転開始");
			} else {
				stopBody(this.actor);
				game.logger.info("アニメーション計算ハンドラによる回転終了");
			}
		});
		this.append(yrotBtn);
		btnX += yrotBtn.width;

		const particleBtn = new UI.ToggleButton({scene: this, src: this.assets["particle"], x: btnX, y: 0, touchable: true, onoff: false});
		particleBtn.toggled.add((onoff: boolean) => {
			Particle.running = onoff;
			game.logger.info("衝突判定用パーティクル: " + (particleBtn.onoff ? "オン" : "オフ"))
		});
		this.append(particleBtn);
		btnX += particleBtn.width;

		const loopBtn = new UI.ToggleButton({scene: this, src: this.assets["loop"], x: btnX, y: 0, touchable: true, onoff: this.actor.loop});
		loopBtn.toggled.add((onoff: boolean) => {
			this.actor.loop = onoff;
			game.logger.info("アニメーションループ: " + (loopBtn.onoff ? "オン" : "オフ"))
		});
		this.append(loopBtn);
		btnX += loopBtn.width;

		const playBtn = new UI.ToggleButton({scene: this, src: this.assets["play"], x: btnX, y: 0, touchable: true, onoff: true});
		playBtn.toggled.add((onoff: boolean) => {
			if (onoff) {
				this.actor.play(ANIMATION_NAME, this.actor.currentFrame, this.actor.loop, PLAY_SPEED);
			} else {
				this.actor.pause = true;
			}
			game.logger.info("アニメーション: " + (playBtn.onoff ? "再生" : "停止"))
		});
		this.append(playBtn);
		btnX += playBtn.width;

		this.playBtn = playBtn;
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
		assetIds: [].concat(BUTTON_IMAGE_ASSET_NAMES, skinImageAssetNames, animationAssetNames, bonesetAssetNames, skineAssetNames)
	});
}
