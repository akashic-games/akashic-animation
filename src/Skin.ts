import Cell = require("./Cell");

/**
 * スキンクラス
 *
 * スキンはActorの各ボーンに取り付けられる表示物であるセルの集合です
 */
class Skin {
	name: string;
	imageAssetName: string;
	imageSizeH: number;
	imageSizeW: number;
	surface: g.SurfaceLike;
	cells: {[key: string]: Cell} = {};
}

export = Skin;
