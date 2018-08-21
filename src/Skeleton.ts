import Posture = require("./Posture");
import Bone = require("./Bone");
import Attachment = require("./Attachment");
import AttrId = require("./AttrId");
import {Animation, CurveTie, Curve, KeyFrame} from "./AnimeParams";
import {AnimationHandlerParam} from "./AnimationHandlerParams";
import * as aps from "./aps";
import * as vfx from "./vfx";

// 属性初期値テーブル
//
// akashic-animationの扱える属性の一覧でもある
// ここに無いものにアクセスすると undefined となる
// ss2asa の SpriteStudio.ts にも扱える属性に関するテーブルが存在する
// 機能を追加する際は両方に食い違いがないようにすること
const attributeInitialValues: any = {
	tx: 0,
	ty: 0,
	rz: 0,
	sx: 1.0,
	sy: 1.0,
	lsx: 1.0,
	lsy: 1.0,
	alpha: 1.0,
	lalpha: undefined,
	cv: undefined,
	pvtx: 1.0,
	pvty: 1.0,
	tu: 1.0,
	tv: 1.0,
	prio: 0,
	iflh: false,
	iflv: false,
	visibility: true,
	ccr: 0.0,
	flipH: false,
	flipV: false,
	userData: undefined,
	effect: undefined
};

function makeLinearKey(time: number, value: any): KeyFrame<any> {
	const r = new KeyFrame<any>();

	r.time = time;
	r.value = value;
	r.ipType = "linear";
	r.ipCurve = undefined;

	return r;
}

function makeLastKey(time: number, value: any): KeyFrame<any> {
	const r = new KeyFrame<any>();

	r.time = time;
	r.value = value;
	r.ipType = undefined;
	r.ipCurve = undefined;

	return r;
}

function makeDefaultKey(attribute: string): KeyFrame<any> {
	const r = new KeyFrame<any>();

	r.time = 0;
	r.value = attributeInitialValues[attribute];
	r.ipType = undefined; // no interpolation
	r.ipCurve = undefined;

	return r;
}

/*
 * 与えられた時刻に関係する２つのキーを取り出す
 *
 * アニメーションから値を導くには２つのキーが必要になる
 *
 * ２つのキーが得られない状況
 * 1. 最初のキーが（ゼロでなく）１フレーム目以降に打たれている
 * 2. 最後のキーが最終フレームより前に打たれている
 *
 * それぞれ次のように扱う
 * 1. 初期値を持ったキーが０フレーム目に打たれているとみなす
 * 2. 最後のキーと全く同じものが最終フレームにも打たれているとみなす
 *
 * そのようにキーが外挿される
 *
 * 返り値: 以下の２要素の配列
 * 1. 開始キー
 * 2. 終了キー
 *
 * @param keyFrames キーフレーム配列
 * @param time 現在時刻
 * @param frameCount keyFramesを格納するAnimationの定義するアニメーション全体の長さ（時間）
 * @param attribute この関数の返すキーフレームペアを用いる属性
 */
function pickKeyFramePairByTime(
	keyFrames: KeyFrame<any>[], time: number, frameCount: number, attribute: string): [KeyFrame<any>, KeyFrame<any>] {
	let kFrom: KeyFrame<any> = undefined;
	let kTo: KeyFrame<any> = undefined;

	// ループアニメーション用の処理
	// ループアニメーションではこの区間が存在する。この時キーを補う
	if (frameCount - 1 < time && time < frameCount) {
		kFrom = makeLinearKey(frameCount - 1, keyFrames[keyFrames.length - 1].value); // 外挿
		kTo   = makeLinearKey(frameCount,     keyFrames[0].value); // 外挿
		return [kFrom, kTo];
	}

	if (time < keyFrames[0].time) {
		kFrom = makeDefaultKey(attribute); // 外挿
		kTo = keyFrames[0];
		// kFromは"補間なし"設定。結果この区間ではkFrom.valueが採用される
		return [kFrom, kTo];
	}

	for (let k = 1; k < keyFrames.length; k++) {
		if (time < keyFrames[k].time) {
			kTo = keyFrames[k];
			kFrom = keyFrames[k - 1];
			return [kFrom, kTo];
		}
	}

	kFrom = keyFrames[keyFrames.length - 1];
	kTo = makeLastKey(frameCount - 1, kFrom.value); // 外挿

	return [kFrom, kTo];
}

function interpolateLinear(kFrom: KeyFrame<any>, kTo: KeyFrame<any>, time: number): number {
	const t: number = (time - kFrom.time) / (kTo.time - kFrom.time);
	return kFrom.value * (1 - t) + kTo.value * t;
}

// kFrom.time, kTo.timeをベジェ補間した結果 key.time === time となるような 媒介変数を逆算する
// SSに倣った
// https://github.com/SpriteStudio/SpriteStudio5-SDK/blob/master/Common/Loader/ssInterpolation.cpp#L52
function calcBackParameter(kFrom: KeyFrame<any>, kTo: KeyFrame<any>, time: number): number {
	// ２分探索。探索回数次第で精度が決まる.
	// 探索回数８はSpriteStudioに従った
	// 30FPSから考えると、８回なら誤差は1フレーム(0.033sec)に満たない
	let t = 0.5;
	let stride = 0.25;
	const values = kFrom.ipCurve.values;
	const p1 = kFrom.time;
	const p2 = kFrom.time + values[0];
	const p3 = kTo.time   + values[2];
	const p4 = kTo.time;
	for (let i = 0; i < 8; i = (i + 1) | 0) {
		const s  = 1 - t;
		const s2 = s * s;
		const t2 = t * t;
		const interpolated =
			s  * s2 * p1 +
			3  * t  * s2 * p2 +
			3  * s  * t2 * p3 +
			t  * t2 * p4;
		if (interpolated > time) {
			t -= stride;
		} else {
			t += stride;
		}
		stride /= 2;
	}

	return t;
}

function interpolateBezier(kFrom: KeyFrame<any>, kTo: KeyFrame<any>, time: number): number {
	const t = calcBackParameter(kFrom, kTo, time);
	const values = kFrom.ipCurve.values;
	const s  = 1 - t;
	const s2 = s * s;
	const t2 = t * t;
	return (
		s * s2 *  kFrom.value +
		3 * t * s2 * (kFrom.value + values[1]) +
		3 * s * t2 * (kTo.value   + values[3]) +
		t * t2 *  kTo.value
	);
}

// see: https://github.com/SpriteStudio/SpriteStudio5-SDK/blob/master/Common/Loader/ssInterpolation.cpp#L112
function interpolateHermite(kFrom: KeyFrame<any>, kTo: KeyFrame<any>, time: number): number {
	const t: number = (time - kFrom.time) / (kTo.time - kFrom.time);
	const values = kFrom.ipCurve.values;
	const from   = kFrom.value;
	const to     =  kTo.value;
	const t2     = t  * t;
	const t3     = t2 * t;
	return (
		( 2 * t3 - 3 * t2 + 1) * from +
		(-2 * t3 + 3 * t2    ) * to +
		(     t3 - 2 * t2 + t) * (values[1] - from) +
		(     t3 -     t2    ) * (values[3] - to)
	);
}

// SSの実装は次の通り
// https://github.com/SpriteStudio/SpriteStudio5-SDK/blob/master/Common/Animator/ssplayer_animedecode.cpp
// https://github.com/SpriteStudio/SpriteStudio5-SDK/blob/master/Common/Loader/ssInterpolation.cpp
function interpolate(kFrom: KeyFrame<any>, kTo: KeyFrame<any>, time: number): any {
	// 非numberの補間は最初のキーの値を採用する（ステップ関数）
	// ipType===undefinedは「補間しない」を表す有効な値である
	// ２つのキーが同時刻を指すとき最初のキーの値を採用する
	if (typeof kFrom.value !== "number" || typeof kFrom.ipType === "undefined" || kFrom.time === kTo.time) {
		return kFrom.value;
	} else {
		switch (kFrom.ipType) {
			case "linear":  return interpolateLinear(kFrom, kTo, time);
			case "bezier":  return interpolateBezier(kFrom, kTo, time);
			case "hermite": return interpolateHermite(kFrom, kTo, time);
			// case "acceleration": // SpriteStuioのサポートする方式。一般的でないかもしれないので対応保留
			// case "deceleration": // SpriteStuioのサポートする方式。一般的でないかもしれないので対応保留
			default:
				// 未知の補間方法は不正なデータである
				g.game.logger.warn("Unknown interpolation: " + kFrom.ipType);
				// 補間できない。最初のキーの値を採用する
				return kFrom.value;
		}
	}
}

/**
 * スケルトンクラス
 *
 * スケルトンクラスはアニメーションの計算と結果の保持を行う。
 */
class Skeleton {
	bones: Bone[];
	caches: Posture[];
	composedCaches: Posture[];
	matrixFunc: () => g.Matrix;

	private _triggeringBones: Bone[];

	/**
	 * Skeletonのインスタンスを生成する。
	 *
	 * @param bones ボーン配列
	 * @param matrixFunc ルートボーンに前から乗算されるマトリクスを返す関数オブジェクト
	 */
	constructor(bones: Bone[], matrixFunc?: () => g.Matrix) {
		this.bones = bones;
		this.matrixFunc = matrixFunc;
		this._triggeringBones = [];

		this.caches = new Array<Posture>(bones.length);
		for (let i = 0; i < this.caches.length; i++) {
			this.caches[i] = new Posture();
			this.caches[i].index = i;
		}
		this.composedCaches = new Array<Posture>(bones.length);
		for (let i = 0; i < this.composedCaches.length; i++) {
			this.composedCaches[i] = new Posture();
			this.composedCaches[i].index = i;
		}
	}

	getPostureByName(name: string): Posture {
		for (let i = 0; i < this.bones.length; i = (i + 1) | 0) {
			if (this.bones[i].name === name) {
				return this.caches[this.bones[i].arrayIndex];
			}
		}

		return undefined;
	}

	/**
	 * アタッチメントを取り付ける
	 *
	 * 通常ゲーム開発者はこのメソッドを直接呼び出す必要はない。
	 *
	 * @param attachment アタッチメント
	 * @param boneName 取り付ける先のボーン名
	 */
	attach(attachment: Attachment, boneName: string): void {
		this.bones.some((bone: Bone) => {
			if (bone.name === boneName) {
				this.caches[bone.arrayIndex].attachments.push(attachment);
				attachment.posture = this.composedCaches[bone.arrayIndex];
				return true;
			}
			return false;
		});
	}

	/**
	 * アタッチメントを取り外す。
	 *
	 * @param attachment 取り外すアタッチメント
	 */
	removeAttachment(attachment: Attachment): void {
		this.bones.some((bone: Bone) => {
			let posture = this.caches[bone.arrayIndex];
			let index = posture.attachments.indexOf(attachment);
			if (index === -1) {
				return false;
			}
			let removed = posture.attachments.splice(index, 1);
			removed[0].posture = undefined;
			return true;
		});
	}

	/**
	 * エフェクトのリセット
	 */
	resetEffect(): void {
		for (let i = 0; i < this.composedCaches.length; i++) {
			const effects = this.composedCaches[i].effects;
			for (let j = 0; j < effects.length; j++) {
				effects[j].particleSystem.reset();
			}
		}
	}

	/**
	 * デバッグ用
	 */
	_startEffect(): void {
		for (let i = 0; i < this.caches.length; i++) {
			const effects = this.caches[i].effects;
			for (let j = 0; j < effects.length; j++) {
				effects[j].particleSystem.start();
			}
		}
	}

	/**
	 * アニメーションの計算と描画の準備を行う。
	 *
	 * 通常ゲーム開発者はこのメソッドを直接呼び出す必要はない。
	 *
	 * @param time 現在のフレーム
	 * @param anim 計算に用いるアニメーション
	 * @param dt 前回のupdate()呼び出しからの経過時間
	 */
	update(time: number, anim: Animation, dt: number): void {
		// アニメーションを計算。結果をcacheに収める
		this.updateCache(time, anim);
		// キャッシュの中身を接続
		this.traverse(this.bones[0]); // 0 番目にrootがあること
		// エフェクトの更新
		this.updateEffect(dt);
	}

	_getBoneByName(boneName: string): Bone {
		const bones = this.bones;
		for (let i = 0; i < bones.length; i = (i + 1) | 0) {
			if (bones[i].name === boneName) {
				return bones[i];
			}
		}

		return undefined;
	}

	/**
	 * ボーンからアニメーションハンドラのためのg.Triggerインスタンスを取得する。
	 *
	 * @param boneName ボーン名
	 * @param createIfNotExists 無ければg.Triggerインスタンスを生成するならtrueを与える
	 */
	_getTrigger(boneName: string, createIfNotExists?: boolean): g.Trigger<AnimationHandlerParam> {
		const bone = this._getBoneByName(boneName);
		if (! bone) {
			return undefined;
		}

		const posture = this.caches[bone.arrayIndex];
		if (! posture) {
			return undefined;
		}

		if (! posture._trigger && createIfNotExists) {
			posture._trigger = new g.Trigger<AnimationHandlerParam>();
			this._triggeringBones.push(bone);
		}

		return posture._trigger;
	}

	/**
	 * アニメーション計算ハンドラを実行する。
	 */
	_handleUserEvent(startFrame: number, elapse: number, anim: Animation): void {
		for (let i = 0; i < this._triggeringBones.length; i++) {
			const bone: Bone = this._triggeringBones[i];
			const cache: Posture = this.caches[bone.arrayIndex];

			// skip if there's no handler
			if (cache._trigger.length === 0) {
				continue;
			}

			// skip if there's no curve for the bone
			const ct: CurveTie = anim.curveTies[bone.name];
			if (ct === undefined) {
				continue;
			}

			// NOTE: データ読み込み時にuserDataがあるかどうか目印を付けて実行時の探索を軽減可能では
			for (let j = 0; j < ct.curves.length; j++) { // curve(=attribute) loop
				const curve: Curve<any> = ct.curves[j];
				if ((<any>curve).attrId === AttrId.userData && curve.keyFrames.length > 0) {
					if (elapse > 0) {
						this.fastForward(cache, curve.keyFrames, startFrame, elapse, anim.frameCount);
					} else {
						this.fastBackward(cache, curve.keyFrames, startFrame, elapse, anim.frameCount);
					}
				}
			}
		}
	}

	private fastForward(cache: Posture, keyFrames: KeyFrame<any>[], startFrame: number, elapse: number, animFrameCount: number): void {
		let i = 0;
		let nLoop = 0;
		const endFrame = startFrame + elapse;

		while (true) {
			const keyFrame = keyFrames[i];
			const time = keyFrame.time + animFrameCount * nLoop;

			if (time >= endFrame) {
				break;
			}

			if (startFrame < time) {
				cache._trigger.fire({
					left: {time: keyFrame.time, userData: keyFrame.value},
					currentFrame: keyFrame.time,
					frameCount: animFrameCount
				});
			}

			if (++i === keyFrames.length) {
				i = 0;
				nLoop++;
			}
		}
	}

	private fastBackward(cache: Posture, keyFrames: KeyFrame<any>[], startFrame: number, elapse: number, animFrameCount: number): void {
		let i = keyFrames.length - 1;
		let nLoop = 0;
		const endFrame = startFrame + elapse;

		while (true) {
			const keyFrame = keyFrames[i];
			const time = keyFrame.time - animFrameCount * nLoop;

			if (time <= endFrame) {
				break;
			}

			if (time < startFrame) {
				cache._trigger.fire({
					left: {time: keyFrame.time, userData: keyFrame.value},
					currentFrame: keyFrame.time,
					frameCount: animFrameCount
				});
			}

			if (--i === -1) {
				i = keyFrames.length - 1;
				nLoop++;
			}
		}
	}

	private updateCache(time: number, anim: Animation): void {
		for (let i = 0; i < this.bones.length; i++) { // bone loop
			const bone: Bone = this.bones[i];
			const cache: Posture = this.caches[bone.arrayIndex];
			cache.reset();

			const ct: CurveTie = anim.curveTies[bone.name];
			if (ct === undefined) {
				continue;
			}

			let left: any;
			let right: any;
			for (let j = 0; j < ct.curves.length; j++) { // curve(=attribute) loop
				const c: Curve<any> = ct.curves[j];

				// pick key frame pair
				const pair: [KeyFrame<any>, KeyFrame<any>] = pickKeyFramePairByTime(c.keyFrames, time, anim.frameCount, c.attribute);
				const kFrom: KeyFrame<any> = pair[0];
				const kTo: KeyFrame<any> = pair[1];

				const attrId = (<any>c).attrId;
				if (attrId === AttrId.userData) {
					left  = {time: kFrom.time, userData: kFrom.value};
					right = {time:   kTo.time, userData:   kTo.value};
				}

				// interpolation
				cache.attrs[attrId] = interpolate(kFrom, kTo, time);
			}

			if (cache._trigger && (cache._trigger.length > 0)) {
				// handler should call cache.updateMatrix()
				cache._trigger.fire({
					posture: cache,
					left: left,
					right: right,
					currentFrame: time,
					frameCount: anim.frameCount
				});
			} else {
				cache.updateMatrix();
			}

			cache.alphaBlendMode = bone.alphaBlendMode;
		}
	}

	private traverse(bone: Bone): void {
		const cache: Posture = this.caches[bone.arrayIndex];
		const composedCache: Posture = this.composedCaches[bone.arrayIndex];

		// compose
		if (bone.parent) {
			const parentComposedCache = this.composedCaches[bone.parent.arrayIndex];
			if (parentComposedCache === undefined) {
				g.game.logger.warn("Invalid array index for " + bone.parent.name);
			} else {
				const m0 = composedCache.m._matrix;
				const m1 = parentComposedCache.m._matrix;
				const m2 = cache.m._matrix;

				// m0 = m1 * m2
				m0[0] = m1[0] * m2[0] + m1[2] * m2[1];
				m0[1] = m1[1] * m2[0] + m1[3] * m2[1];
				m0[2] = m1[0] * m2[2] + m1[2] * m2[3];
				m0[3] = m1[1] * m2[2] + m1[3] * m2[3];
				m0[4] = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
				m0[5] = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];

				composedCache.attrs[AttrId.alpha] = parentComposedCache.attrs[AttrId.alpha] * cache.attrs[AttrId.alpha];
			}
		} else { // root
			const m1 = composedCache.m._matrix;
			if (this.matrixFunc) {
				const m2 = this.matrixFunc()._matrix;
				m1[0] = m2[0];
				m1[1] = m2[1];
				m1[2] = m2[2];
				m1[3] = m2[3];
				m1[4] = m2[4];
				m1[5] = m2[5];
			} else {
				m1[0] = 1;
				m1[1] = 0;
				m1[2] = 0;
				m1[3] = 1;
				m1[4] = 0;
				m1[5] = 0;
			}
			composedCache.m.multiply(cache.m);

			composedCache.attrs[AttrId.alpha] = cache.attrs[AttrId.alpha];
		}

		// go down well.
		if (bone.children) {
			for (let i = 0; i < bone.children.length; i++) {
				this.traverse(bone.children[i]);
			}
		}

		// ローカルXYスケールの反映
		composedCache.m._matrix[0] *= cache.attrs[AttrId.lsx];
		composedCache.m._matrix[1] *= cache.attrs[AttrId.lsx];
		composedCache.m._matrix[2] *= cache.attrs[AttrId.lsy];
		composedCache.m._matrix[3] *= cache.attrs[AttrId.lsy];

		// ローカル不透明度の反映
		if (cache.attrs[AttrId.lalpha] != null) {
			// akashic-animation のローカル不透明度の仕様として、ローカル不透明度が設定されていた場合、不透明度に乗算せずローカル不透明度の値を上書きする
			composedCache.attrs[AttrId.alpha] = cache.attrs[AttrId.lalpha];
		}

		// 継承関係のない属性の値を直接コピー
		composedCache.attrs[AttrId.cv]    = cache.attrs[AttrId.cv];
		composedCache.attrs[AttrId.pvtx]  = cache.attrs[AttrId.pvtx];
		composedCache.attrs[AttrId.pvty]  = cache.attrs[AttrId.pvty];
		composedCache.attrs[AttrId.tu]    = cache.attrs[AttrId.tu];
		composedCache.attrs[AttrId.tv]    = cache.attrs[AttrId.tv];
		composedCache.attrs[AttrId.prio]  = cache.attrs[AttrId.prio];
		composedCache.attrs[AttrId.iflh]  = cache.attrs[AttrId.iflh];
		composedCache.attrs[AttrId.iflv]  = cache.attrs[AttrId.iflv];
		composedCache.attrs[AttrId.visibility] = cache.attrs[AttrId.visibility];
		composedCache.attachments = cache.attachments;
		composedCache.attrs[AttrId.ccr]   = cache.attrs[AttrId.ccr];
		composedCache.attrs[AttrId.flipH] = cache.attrs[AttrId.flipH];
		composedCache.attrs[AttrId.flipV] = cache.attrs[AttrId.flipV];
		composedCache.attrs[AttrId.effect] = cache.attrs[AttrId.effect];
		composedCache.alphaBlendMode = cache.alphaBlendMode;
		composedCache.effects = cache.effects;
	}

	private updateEffect(dt: number): void {
		for (let i = 0; i < this.composedCaches.length; i++) {
			const cc = this.composedCaches[i];
			const effects = cc.effects;
			const effectValue: vfx.EffectValue = cc.attrs[AttrId.effect];
			if (! effectValue) continue;
			for (let j = 0; j < effects.length; j++) {
				const ps = effects[j].particleSystem;
				switch (effectValue.emitterOp) {
					case vfx.EmitterOperation.start: ps.start(); break;
					case vfx.EmitterOperation.stop: ps.stop(); break;
					case vfx.EmitterOperation.pause: ps.pause(); break;
				}
				// ps.moveTo(cc.m._matrix[4], cc.m._matrix[5]);
				ps.update(dt);
			}
		}
	}
}

export = Skeleton;
