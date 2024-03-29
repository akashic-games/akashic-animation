import type {Posture} from "./Posture";

/**
 * AnimationHandlerParamのためのキーフレーム情報
 */
export interface AnimationHandlerKeyFrameInfo {
	time: number;
	userData?: any;
}

/**
 * Actor#addHandlerForBone()で登録されたハンドラの呼び出し時に渡されるパラメータ
 */
export interface AnimationHandlerParam {
	/**
	 * アニメーション計算結果
	 *
	 * スキップされたユーザーデータ処理のためのハンドラ呼び出しでは`undefined`となる。
	 */
	posture?: Posture;

	/**
	 * 左キーフレーム情報
	 *
	 * AnimationHandlerParam#currentFrameと同じか直前のKeyFrameの情報
	 */
	left?: AnimationHandlerKeyFrameInfo;

	/**
	 * 右キーフレーム情報
	 *
	 * AnimationHandlerParam#currentFrameの直後のKeyFrameの情報
	 */
	right?: AnimationHandlerKeyFrameInfo;

	/**
	 * 現在のフレーム番号
	 */
	currentFrame: number;

	/**
	 * 現在再生されているアニメーションのフレーム数
	 */
	frameCount: number;
}
