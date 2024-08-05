import type {Cell} from "./Cell";

/**
 * スキンクラス
 *
 * スキンはActorの各ボーンに取り付けられる表示物であるセルの集合である。
 */
export class Skin {
	/**
	 * スキン名。
	 */
	name: string;

	/**
	 * 画像アセット名。
	 *
	 * スキンで使用する画像のアセット名。
	 */
	imageAssetName: string;

	/**
	 * 画像の幅。
	 */
	imageSizeH: number;

	/**
	 * 画像の高さ。
	 */
	imageSizeW: number;

	surface: g.Surface;

	/**
	 * セルのセット。
	 *
	 * キーはセル名。
	 */
	cells: {[key: string]: Cell} = {};
}
