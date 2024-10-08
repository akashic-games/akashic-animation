import type {Posture} from "./Posture";

/**
 * アタッチメント。
 *
 * ボーンに追従して描画するオブジェクトの基底クラス。
 */
export abstract class Attachment {
	/**
	 * Actor#attach()の際に与えられる接続先Posture
	 *
	 * Posture#mにはActorの行列と親ボーンの行列を全て乗算した結果が格納される
	 */
	posture: Posture;

	/**
	 * 描画処理
	 *
	 * アタッチしたボーンの座標系で描画される
	 *
	 * @param renderer レンダラ
	 */
	abstract render(renderer: g.Renderer): void;
}
