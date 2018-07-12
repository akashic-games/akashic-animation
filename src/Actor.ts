import ActorParameterObject = require("./ActorParameterObject");
import Skin = require("./Skin");
import Posture = require("./Posture");
import Skeleton = require("./Skeleton");
import Bone = require("./Bone");
import Resource = require("./Resource");
import Attachment = require("./Attachment");
import CellAttachment = require("./CellAttachment");
import FinalizedCell = require("./FinalizedCell");
import ColliderInfo = require("./ColliderInfo");
import Collider = require("./Collider");
import BoneCellCollider = require("./BoneCellCollider");
import CircleCollider = require("./CircleCollider");
import BoxVolume = require("./BoxVolume");
import CircleVolume = require("./CircleVolume");
import AttrId = require("./AttrId");
import {Animation} from "./AnimeParams";
import {AnimationHandlerParam} from "./AnimationHandlerParams";
import AlphaBlendMode = require("./AlphaBlendMode");
import * as vfx from "./vfx";

const g_flipHMatrix  = new g.PlainMatrix(0, 0, -1,  1, 0);
const g_flipVMatrix  = new g.PlainMatrix(0, 0,  1, -1, 0);

/*
 * アニメーションフレームカウンタを適切な範囲に調整する。
 *
 * loop===falseの時:
 * cntrが０より小さければ0を、frameCount-1以上であればframeCount-1を返す。
 *
 * loop===trueの時:
 * cntrが時計の針のように[0,frameCount]で一周し循環するように調整されたものを返す。
 *
 * @param cntr アニメーションフレームカウンタ
 * @param frameCount アニメーションのフレーム数
 * @param loop ループ再生するアニメーションならtrueを与える
 */
function adjustCounter(cntr: number, frameCount: number, loop: boolean): number {
	if (loop) {
		while (cntr >= frameCount) {
			cntr -= frameCount;
		}
		while (cntr < 0) {
			cntr += frameCount;
		}
	} else {
		if (cntr < 0) {
			cntr = 0;
		} else if (cntr > frameCount - 1) {
			cntr = frameCount - 1;
		}
	}

	return cntr;
}

function setupColliderForCell(info: ColliderInfo, bone: Bone): Collider {
	let collider: Collider;

	switch (info.boundType) {
		case "aabb":
		case "box":
			collider = new BoneCellCollider(bone.name, info.boundType === "aabb");
			break;
		default:
			g.game.logger.warn("Invalid type combination: " + info.geometryType + ", " + info.boundType);
			break;
	}

	return collider;
}

function setupColliderForCircle(info: ColliderInfo, bone: Bone): Collider {
	let collider: Collider;

	switch (info.boundType) {
		case "aabb":
		case "circle":
			collider = new CircleCollider(bone.name, info.boundType === "aabb", info.scaleOption);
			break;
		default:
			g.game.logger.warn("Invalid type combination: " + info.geometryType + ", " + info.boundType);
			break;
	}

	return collider;
}

// 全てのgeometoryTypeと boundtypeの組み合わせが利用可能 というわけ**ではない**
function setupCollider(bones: Bone[], actor: Actor): void {
	bones.forEach((bone: Bone) => {
		if (! bone.colliderInfos) {
			return;
		}
		bone.colliderInfos.forEach((info: ColliderInfo) => {
			let collider: Collider;
			switch (info.geometryType) {
				case "cell":   collider = setupColliderForCell(info, bone); break;
				case "circle": collider = setupColliderForCircle(info, bone); break;
				case "box":    g.game.logger.warn("Not implemented geometory type " + info.geometryType); break;
				default:       g.game.logger.warn("Unknown geometory type " + info.geometryType); break;
			}
			if (collider) {
				actor.addCollider(collider);
			}
		});
	});
}

function getInverse(width: number, height: number, scaleX: number, scaleY: number, angle: number, x: number, y: number): g.Matrix {
	const m = new g.PlainMatrix();

	const r = angle * Math.PI / 180;
	const _cos = Math.cos(r);
	const _sin = Math.sin(r);
	const a = _cos / scaleX;
	const b = _sin / scaleY;
	const c = _sin / scaleX;
	const d = _cos / scaleY;
	const w = width / 2;
	const h = height / 2;

	m._matrix[0] = a;
	m._matrix[1] = -b;
	m._matrix[2] = c;
	m._matrix[3] = d;
	m._matrix[4] = -a * (w + x) - c * (h + y) + w;
	m._matrix[5] =  b * (w + x) - d * (h + y) + h;

	return m;
}

/**
 * ボーンベースのアニメーションを描画するエンティティ。
 */
class Actor extends g.E {
	resource: Resource;
	animation: Animation;
	skeleton: Skeleton;
	skins: {[key: string]: Skin}; // もしこれがより複雑な構造になるなら Appearance クラスを導入してそこに保持
	colliders: Collider[];

	/**
	 * 再生速度。
	 *
	 * 1.0で通常速度となる。
	 * 初期値は1.0である。
	 */
	playSpeed: number;

	/**
	 * 再生を一時停止しているかを表す。
	 *
	 * 初期値は `false` である。
	 */
	pause: boolean;

	/**
	 * ループ再生するかを表す。
	 *
	 * 初期値は `true` である。
	 */
	loop: boolean;

	/**
	 * CELLを持たないボーンを描画するかを表す。
	 *
	 * 初期値は `false` である。
	 */
	nullVisible: boolean;

	/**
	 * ボーン座標系のX,Y軸を描画するかを表す。
	 *
	 * 初期値は`false`である。
	 */
	boneCoordsVisible: boolean;

	/**
	 * 当たり判定の領域を描画するかを表す。
	 *
	 * 初期値は`false`である。
	 */
	colliderVisible: boolean;

	private _cntr: number;
	private _nextCntr: number;
	private _elapse: number;
	private _ended: g.Trigger<void>;

	/**
	 * 各種パラメータを指定して `Actor` のインスタンスを生成する。
	 */
	constructor(param: ActorParameterObject) {
		super(param);

		// resource
		this.resource = param.resource;

		// skeleton
		const boneSet = this.resource.getBoneSetByName(param.boneSetName);
		this.skeleton = new Skeleton(boneSet.bones, () => {
			return this.getMatrix();
		});

		// collider
		this.colliders = [];
		setupCollider(boneSet.bones, this);

		// skin
		this.skins = {};
		for (let i = 0; i < param.skinNames.length; i = (i + 1) | 0) {
			const name = param.skinNames[i];
			this.skins[name] = this.resource.getSkinByName(name);
		}

		// animation
		this.animation = this.resource.getAnimationByName(param.animationName);

		// effect
		for (let i = 0, len = this.skeleton.bones.length; i < len; i++) {
			const bone = this.skeleton.bones[i];
			if (! bone.effectName) continue;
			for (let j = 0; j < this.resource.effectParameters.length; j++) {
				const effectParam = this.resource.effectParameters[j];
				if (effectParam.name !== bone.effectName) continue;
				const effect = vfx.createEffect(effectParam);
				this.skeleton.getPostureByName(bone.name).effects.push(effect);
			}
		}

		// TODO: アニメーションリソースから大きさを導き出す方法を考える
		this.width = param.width;
		this.height = param.height;

		// and others
		this._cntr = 0;
		this._nextCntr = 0;
		this._elapse = 0;
		this.pause = false;
		this.loop = true;
		this.playSpeed = param.playSpeed !== undefined && param.playSpeed !== null ? param.playSpeed : 1.0;
		this.nullVisible = false;
		this.boneCoordsVisible = false;
		this.colliderVisible = false;
	}

	/**
	 * コライダーを追加する。
	 *
	 * @param 追加されるコライダー
	 */
	addCollider(collider: Collider): void {
		// TODO: アタッチの成否を扱うべきか検討
		collider.onAttached(this);
		this.colliders.push(collider);
	}

	/**
	 * コライダーを削除する。
	 *
	 * @param collider 削除されるコライダー
	 */
	removeCollider(collider: Collider): void {
		const index = this.colliders.indexOf(collider);
		if (index !== -1) {
			this.colliders.splice(index, 1);
		}
	}

	/**
	 * スキンを追加する。
	 *
	 * 同じ名前を持つスキンがすでにActor内にあるとき、上書きされる。
	 *
	 * @param skins Actorに追加されるスキンの配列
	 */
	setSkins(skins: Skin[]): void {
		for (let i = 0; i < skins.length; i = (i + 1) | 0) {
			let skin = skins[i];
			this.skins[skin.name] = skin;
		}
	}

	/**
	 * アニメーションの計算を行う。
	 *
	 * フレームカウンタがインクリメントされ、アニメーションカーブに基づいた各種プロパティの計算を行います。
	 */
	calc(): void {
		if (this.pause) {
			return;
		}

		const anime: Animation = this.animation;
		if (anime === undefined) {
			return;
		}

		if (this._elapse !== 0) {
			this.skeleton._handleUserEvent(this._cntr, this._elapse, anime);
		}

		// Set current frame counter
		this._cntr = this._nextCntr;

		// Update posture with animation
		this.skeleton.update(this._cntr, anime, this._elapse / this.scene.game.fps);

		if (!this.loop && (
			(this._cntr === this.animation.frameCount - 1 && this.playSpeed >= 0) ||
			(this._cntr === 0                             && this.playSpeed <= 0)
		)) {
			this.ended.fire();
			this.pause = true;
		}

		// Update additional information around posture
		for (let i = 0; i < this.skeleton.composedCaches.length; i = (i + 1) | 0) {
			let cc = this.skeleton.composedCaches[i];
			cc.finalizedCell = createFinalizedCell(cc, this.skins);
		}

		// Set dirty flag for colliders
		for (let i = 0; i < this.colliders.length; i = (i + 1) | 0) {
			this.colliders[i].dirty = true;
		}

		this._elapse = (anime.fps / this.scene.game.fps) * this.playSpeed;
		const nextCntr = this._cntr + this._elapse;
		this._nextCntr = adjustCounter(nextCntr, anime.frameCount, this.loop);
	}

	/**
	 * アニメーションを再生する。
	 *
	 * @param animationName アニメーション名
	 * @param startFrame 再生開始フレーム
	 * @param loopFlag 再生をループするか指定するフラグ。真の時ループ再生
	 * @param playSpeed 再生速度。1.0で通常の再生速度
	 */
	play(animationName: string, startFrame: number, loopFlag: boolean, playSpeed: number): void {
		this.pause = false;
		this.animation = this.resource.getAnimationByName(animationName);
		this.loop = loopFlag;
		this.playSpeed = playSpeed;
		this._nextCntr = adjustCounter(startFrame, this.animation.frameCount, this.loop);
		this._cntr = this._nextCntr;
		this._elapse = 0;
	}

	/**
	 * 現在のアニメーション再生位置。
	 */
	set currentFrame(frame: number) {
		this._nextCntr = adjustCounter(frame, this.animation.frameCount, this.loop);
		this._cntr = this._nextCntr;
		this._elapse = 0;
	}
	get currentFrame(): number {
		return this._cntr;
	}

	/**
	 * アニメーション再生終了イベント。
	 */
	get ended(): g.Trigger<void> {
		if (! this._ended) {
			this._ended = new g.Trigger<void>();
		}
		return this._ended;
	}

	/**
	 * アニメーション計算ハンドラを扱うg.Triggerを取得する。
	 *
	 * @param boneName ボーン名
	 * @param createIfNotExists? g.Triggerが存在しない時、生成するなら true を与える。省略した時 undefined
	 */
	calculated(boneName: string, createIfNotExists?: boolean): g.Trigger<AnimationHandlerParam> {
		return this.skeleton._getTrigger(boneName, createIfNotExists);
	}

	/**
	 * アタッチメントを追加する。
	 *
	 * 返り値は追加されたアタッチメントである。
	 * 第一引数に文字列を指定した時、同名のセルをスキン中から探索、それをboneNameで指定したボーンにアタッチする。
	 *
	 * @param attachable アタッチメントインスタンスまたは装着済みのスキン中のセルを指定する文字列(セル名)
	 * @param boneName アタッチ先のボーン名
	 * @param matrix? アタッチ位置を調節するマトリクス
	 */
	attach(attachable: string | Attachment, boneName: string, matrix?: g.Matrix): Attachment {
		let attachment: Attachment = undefined;

		if (typeof attachable === "string") {
			let cellName = <string>attachable;
			Object.keys(this.skins).some((key: string): boolean => {
				let skin = this.skins[key];
				let cell = skin.cells[cellName];
				if (cell) {
					attachment = new CellAttachment(cellName, skin, matrix);
				}
				return !!cell; // trueを返すとsome()を終了する
			});
		} else if (attachable instanceof Attachment) {
			attachment = <Attachment>attachable;
		}

		if (attachment) {
			this.skeleton.attach(attachment, boneName);
		}

		return attachment;
	}

	/**
	 * アタッチメントを削除する。
	 *
	 * @param attachment 削除するアタッチメント。
	 */
	removeAttachment(attachment: Attachment): void {
		this.skeleton.removeAttachment(attachment);
	}

	/**
	 * ボーンの行列を取得する。
	 *
	 * @param boneName ボーン名。
	 */
	getBoneMatrix(boneName: string): g.Matrix {
		const bones = this.skeleton.bones;
		for (let i = 0, len = bones.length; i < len; i++) {
			if (bones[i].name === boneName) {
				return this.skeleton.composedCaches[bones[i].arrayIndex].m;
			}
		}
		return undefined;
	}

	renderSelf(renderer: g.Renderer, camera?: g.Camera): boolean {
		// E#render()から呼ばれる
		// すでに E#x, E#y で translate されている

		// # compoedCachesのソートをやめる
		//
		// ソートは最後の最後なのでなんの影響も残さないと考えていたが間違いだった
		// 例えばクリックイベントでActorの機能を使用し、それがcompsosedCachesにアクセスするとする
		// それはゲームループ(大抵はScene#update())以外のタイミングで実行される
		// そのため期待した並び(ソート済み)では *ない* データへのアクセスとなる
		//
		// ソートされた後もcomposedCachesは再利用され、その時の並びでBone#arrayIndexに応じたボーン情報を持つ
		// つまりActor#calc()の時点でcomposedCachesの各Postureは担当するボーンが変化している
		//
		// そのことでわかりにくいバグが生まれた。BoneCellColliderの参照するセルが変化した
		//
		// 単純のためここで配列を複製し、それをソートする
		let sortedComposedCaches: Posture[] = [].concat(this.skeleton.composedCaches);
		sortedComposedCaches.sort((a: Posture, b: Posture): number => {
			if (a.attrs[AttrId.prio] === b.attrs[AttrId.prio]) {
				// Array.prototype.sort()は不安定。安定にするために一手間加える
				// DCCツールで優先順位の指定がないとき（全て等しい時）
				// postureの配列の順に描画することを保証したい
				// そのため、prioが等しい時は配列の添字で比較する
				return a.index - b.index;
			} else {
				return a.attrs[AttrId.prio] - b.attrs[AttrId.prio];
			}
		});

		renderer.save();
		{
			// E#render()が乗算したActor#getMatrix()をキャンセルする。Postureはこのマトリクスを含んでいる
			const inv = getInverse(this.width, this.height, this.scaleX, this.scaleY, this.angle, this.x, this.y);
			renderer.transform(inv._matrix);

			// render myself
			this.renderPostures(sortedComposedCaches, renderer, camera);

			// render bone local coordinates
			if (this.boneCoordsVisible) {
				this.renderAxes(renderer);
			}

			// render colliders
			if (this.colliderVisible) {
				this.renderColliders(renderer);
			}
		}
		renderer.restore();

		return true;
	}

	private renderAxes(renderer: g.Renderer): void {
		this.skeleton.composedCaches.forEach((cc: Posture): void => {
			renderer.save();
			{
				renderer.transform(cc.m._matrix);
				renderer.fillRect(0, 0, 16,  1, "#ff0000");
				renderer.fillRect(0, 0,  1, 16, "#00ff00");
			}
			renderer.restore();
		});
	}

	private renderColliders(renderer: g.Renderer): void {
		renderer.save();
		{
			renderer.opacity(0.25);
			this.colliders.forEach((c: Collider) => {
				const v = c.getVolume();

				if (! v) return;

				// Draw AABB
				const aabb = v.aabb();
				renderer.fillRect(
					aabb.origin.x - aabb.extent.width, aabb.origin.y - aabb.extent.height, // position
					aabb.extent.width * 2, aabb.extent.height * 2, // width, height
					"#ff0000"
				);

				// Draw Box
				if (v instanceof BoxVolume) {
					const box = <BoxVolume>v;
					renderer.save();
					{
						renderer.transform(box.matrix._matrix);
						renderer.fillRect(
							box.origin.x, box.origin.y,
							box.size.width, box.size.height, // width, height
							"#00ff00"
						);
					}
					renderer.restore();
				} else if (v instanceof CircleVolume) {
					const circle = <CircleVolume>v;
					renderer.save();
					{
						const div = 128;
						for (let i = 0; i < div; i++) {
							renderer.fillRect(
								circle.pos.x + Math.cos(2 * Math.PI / div * i) * circle.r,
								circle.pos.y + Math.sin(2 * Math.PI / div * i) * circle.r,
								4, 4,
								"#0000ff"
							);
						}
					}
					renderer.restore();
				}
			});
		}
		renderer.restore();
	}

	private renderEffect(effect: vfx.Effect, renderer: g.Renderer, camera: g.Camera): void {
		effect.particleSystem.traverse((e) => {
			// const skin = this.skins[e.userData.skinName];
			const skin = this.resource.getSkinByName(e.userData.skinName);
			const surface = skin.surface;
			const cell = skin.cells[e.userData.cellName];
			e.particles.forEach((p) => {
				const cos = Math.cos(p.rz);
				const sin = Math.sin(p.rz);
				const a = cos * p.sx;
				const b = sin * p.sx;
				const c = sin * p.sy;
				const d = cos * p.sy;
				const w = surface.width / 2;
				const h = surface.height / 2;

				// TODO: cellを用いた位置調整
				renderer.save();
				renderer.transform([a, b, -c, d, p.tx, p.ty]);
				renderer.transform([1, 0, 0, 1, -w, -h]);
				renderer.drawImage(surface, 0, 0, surface.width, surface.height, 0, 0);
				renderer.restore();
			});
		});
	}

	private renderPostures(sortedComposedCaches: Posture[], renderer: g.Renderer, camera: g.Camera): void {
		const length = sortedComposedCaches.length;
		for (let i = 0; i < length; i = (i + 1) | 0) {
			const cc = sortedComposedCaches[i];

			if (!cc.attrs[AttrId.visibility]) {
				continue;
			}

			renderer.save();
			{
				renderer.opacity(this.opacity * cc.attrs[AttrId.alpha]);

				renderer.save();
				if (cc.effects.length > 0) {
					for (let j = 0; j < cc.effects.length; j++) {
						this.renderEffect(cc.effects[j], renderer, camera);
					}
				} else {
					renderer.transform(cc.m._matrix); // ボーンのマトリクスを乗算
					if (cc.finalizedCell) {
						renderer.transform(cc.finalizedCell.matrix._matrix);
					}
					this.renderSelfCore(renderer, camera, cc.finalizedCell);
				}
				renderer.restore();

				cc.attachments.forEach((attachment: Attachment) => {
					attachment.render(renderer);
				});
			}
			renderer.restore();
		}
	}

	private renderSelfCore(renderer: g.Renderer, camera: g.Camera, finalizedCell: FinalizedCell): void {
		// 原点に描画する。CANVAS座標系
		// +----------> x
		// |   /\
		// |  /__\
		// | /    \
		// |
		// v
		if (finalizedCell) {
			// ミックスはデフォルト値なので、αブレンドがミックスの場合はcomposite-operation指定処理を省略する
			if (finalizedCell.alphaBlendMode !== undefined && finalizedCell.alphaBlendMode !== "normal") {
				renderer.setCompositeOperation(getCompositeOperation(finalizedCell.alphaBlendMode));
			}
			renderer.drawImage(
				finalizedCell.surface,
				finalizedCell.cell.pos.x + (finalizedCell.u * finalizedCell.surface.width),
				finalizedCell.cell.pos.y + (finalizedCell.v * finalizedCell.surface.height),
				finalizedCell.cell.size.width,
				finalizedCell.cell.size.height,
				0, 0 // 転送先座標
			);
		} else if (this.nullVisible) {
			renderer.fillRect(0, 0, 16, 16, "#ff00ff");
		}
	}
}

function createFinalizedCell(posture: Posture, skins: {[key: string]: Skin}): FinalizedCell {
	if (posture === undefined || posture.attrs[AttrId.cv] === undefined) {
		return undefined;
	}

	const attrs = posture.attrs;

	const skin = skins[attrs[AttrId.cv].skinName];
	if (! skin) {
		return undefined;
	}

	const cell = skin.cells[attrs[AttrId.cv].cellName];
	if (! cell) {
		return undefined;
	}

	// セル中心位置にアニメーションを反映
	const sgnX = attrs[AttrId.iflh] ? -1 : 1;
	const sgnY = attrs[AttrId.iflv] ? -1 : 1;
	let pvtx = sgnX * (cell.pivot.x + attrs[AttrId.pvtx]);
	let pvty = sgnY * (cell.pivot.y + attrs[AttrId.pvty]);

	// 正規化された値からピクセル座標系へ
	pvtx = cell.size.width * pvtx;
	pvty = cell.size.height * pvty;

	// セルのボーンに対する姿勢を表す行列を求める
	let m: g.Matrix = new g.PlainMatrix();

	if (cell.rz === 0) {
		// pivot(セル中心)がセンターに来るようにマトリクスを操作
		// m = [pivot平行移動] x [センタリング]
		m._matrix[4] = -pvtx - cell.size.width / 2;
		m._matrix[5] = -pvty - cell.size.height / 2;
	} else {
		// NOTE: `Cell#rz`のアニメーションをサポートするならキャッシュを諦めることになる
		if (! cell.m) { // lazy construction.
			// m = [回転] x [センタリング]
			const m = new g.PlainMatrix();
			const th = Math.PI * (cell.rz / 180);
			const c = Math.cos(th);
			const s = Math.sin(th);
			const tx = -(cell.size.width / 2);
			const ty = -(cell.size.height / 2);
			m._matrix[0] =  c;
			m._matrix[1] =  s;
			m._matrix[2] = -s;
			m._matrix[3] =  c;
			m._matrix[4] = c * tx - s * ty;
			m._matrix[5] = s * tx + c * ty;

			cell.m = m;
		}

		// pivot(セル中心)がセンターに来るようにマトリクスを操作
		// m = [pivot平行移動] x [回転] x [センタリング]
		m._matrix[4] = -pvtx;
		m._matrix[5] = -pvty;
		m.multiply(cell.m);
	}

	// セルの水平(垂直)フリップとセル画像の左右(上下)反転の両方が指定されていると二重に反転して元に戻るので、どちらか片方が指定されている時のみ反転させる
	if (attrs[AttrId.flipH] !== attrs[AttrId.iflh]) {
		m = g_flipHMatrix.multiplyNew(m);
	}
	if (attrs[AttrId.flipV] !== attrs[AttrId.iflv]) {
		m = g_flipVMatrix.multiplyNew(m);
	}

	const finalizedCell = new FinalizedCell();
	finalizedCell.surface = skin.surface;
	finalizedCell.cell = cell;
	finalizedCell.u = attrs[AttrId.tu];
	finalizedCell.v = attrs[AttrId.tv];
	finalizedCell.matrix = m;
	finalizedCell.alphaBlendMode = posture.alphaBlendMode;

	return finalizedCell;
}

function getCompositeOperation(alphaBlendMode: AlphaBlendMode): g.CompositeOperation {
	switch (alphaBlendMode) {
		case "add":
			return g.CompositeOperation.Lighter;
		default:
			return g.CompositeOperation.SourceOver;
	}
}

export = Actor;
