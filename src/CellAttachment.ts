import Attachment = require("./Attachment");
import Cell = require("./Cell");
import Skin = require("./Skin");

/**
 * セル用アタッチメント
 *
 * セルを`Actor`の任意のボーンにアタッチするためのアタッチメント。
 */
class CellAttachment extends Attachment {
	matrix: g.Matrix;
	cell: Cell;
	skin: Skin;
	pivotTransform: number[];

	/**
	 * コンストラクタ
	 *
	 * @param cellName セル名
	 * @param skin スキン
	 * @param matrix? ボーンに対してセルの位置や向きを変えるための行列(optional)
	 */
	constructor(cellName: string, skin: Skin, matrix?: g.Matrix) {
		super();
		this.matrix = matrix;
		this.cell = skin.cells[cellName];
		this.skin = skin;

		// pvtx, pvtyはセル矩形の中心を原点とした正規化された座標 [-0.5, +0.5]
		// ピクセル単位に変換してから行列の平行移動成分に与える
		if (this.cell.pivot.x !== 0 || this.cell.pivot.y !== 0) {
			const pvtx = (this.cell.size.width  * this.cell.pivot.x) + (this.cell.size.width  / 2);
			const pvty = (this.cell.size.height * this.cell.pivot.y) + (this.cell.size.height / 2);
			this.pivotTransform = [1, 0, 0, 1, -pvtx, -pvty]; // (pvtx, pvty) がボーンの位置に来るように逆に移動
		}
	}

	render(renderer: g.Renderer): void {
		renderer.save();
		{
			if (this.matrix) {
				renderer.transform(this.matrix._matrix);
			}
			if (this.pivotTransform) {
				renderer.transform(this.pivotTransform);
			}
			renderer.drawImage(
				this.skin.surface,
				this.cell.pos.x,
				this.cell.pos.y,
				this.cell.size.width,
				this.cell.size.height,
				0, 0 // 転送先座標
			);
		}
		renderer.restore();
	}
}

export = CellAttachment;
