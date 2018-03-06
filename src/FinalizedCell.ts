import Cell = require("./Cell");

// FinalizedCell = 画像 + Cell(静的データ) + アニメーション(動的)パラメタ
class FinalizedCell {
	surface: g.Surface;
	cell: Cell;
	u: number;
	v: number;
	matrix: g.Matrix;
	alphaBlendType: string;
}

export = FinalizedCell;
