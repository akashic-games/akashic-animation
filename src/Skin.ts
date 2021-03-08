import {Cell} from "./Cell";

/**
 * スキンクラス
 *
 * スキンはActorの各ボーンに取り付けられる表示物であるセルの集合です
 */
export class Skin {
	name: string;
	imageAssetName: string;
	imageSizeH: number;
	imageSizeW: number;
	surface: g.Surface;
	cells: {[key: string]: Cell} = {};
}
