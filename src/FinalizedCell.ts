import {AlphaBlendMode} from "./AlphaBlendMode";
import {Cell} from "./Cell";

// FinalizedCell = 画像 + Cell(静的データ) + アニメーション(動的)パラメタ
export class FinalizedCell {
	surface: g.Surface;
	cell: Cell;
	u: number;
	v: number;
	matrix: g.Matrix;
	alphaBlendMode: AlphaBlendMode;
}
