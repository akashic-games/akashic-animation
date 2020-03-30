import Cell = require("./Cell");
import AlphaBlendMode = require("./AlphaBlendMode");

// FinalizedCell = 画像 + Cell(静的データ) + アニメーション(動的)パラメタ
class FinalizedCell {
	surface: g.SurfaceLike;
	cell: Cell;
	u: number;
	v: number;
	matrix: g.Matrix;
	alphaBlendMode: AlphaBlendMode;
}

export = FinalizedCell;
