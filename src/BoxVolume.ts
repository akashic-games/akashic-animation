import Volume = require("./Volume");
import AABB = require("./AABB");
import Vector2 = require("./Vector2");
import Size2 = require("./Size2");

/**
 * BoxVolume
 *
 * アタリ判定用矩形Volume。
 *
 * 実際にアタリ判定を行うときは `BoxVolume#matrix`,`origin` そして, `size` を用いてワールド座標系での領域を求める必要があります。
 */
class BoxVolume implements Volume {
	/**
	 * 矩形の原点（ローカル座標）
	 */
	origin: Vector2;

	/**
	 * 矩形のサイズ（スケール前）
	 */
	size: Size2;

	/**
	 * ワールド座標に変換する行列
	 */
	matrix: g.Matrix;

	aabbFirst: boolean;
	dirty: boolean;

	private _aabb: AABB; // cache

	constructor() {
		this.origin = new Vector2();
		this.size = new Size2();
		this.aabbFirst = false;
		this.dirty = true;
	}

	aabb(): AABB {
		if (! this._aabb || this.dirty) {
			this.dirty = false;

			const points: Vector2[] = []; // ! 実際は CommonOffsetがpushされる
			// TODO: 直す。multplyPointはtypoで廃止されるが、手元に新しいのがないのでこちらを使う。いまだけ
			points.push(this.matrix.multplyPoint(this.origin));
			points.push(this.matrix.multplyPoint(new Vector2(this.origin.x + this.size.width, this.origin.y)));
			points.push(this.matrix.multplyPoint(new Vector2(this.origin.x,                   this.origin.y + this.size.height)));
			points.push(this.matrix.multplyPoint(new Vector2(this.origin.x + this.size.width, this.origin.y + this.size.height)));

			// AABBの左上隅
			const lefttop = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
			// AABBの右下隅
			const rightbottom = new Vector2(-Number.MAX_VALUE, -Number.MAX_VALUE);

			points.forEach((p: Vector2) => {
				if (p.x > rightbottom.x) rightbottom.x = p.x;
				if (p.x < lefttop.x) lefttop.x = p.x;
				if (p.y > rightbottom.y) rightbottom.y = p.y;
				if (p.y < lefttop.y) lefttop.y = p.y;
			});

			this._aabb = new AABB();
			this._aabb.origin.x = (lefttop.x + rightbottom.x) / 2;
			this._aabb.origin.y = (lefttop.y + rightbottom.y) / 2;
			this._aabb.extent.width = rightbottom.x - this._aabb.origin.x;
			this._aabb.extent.height = rightbottom.y - this._aabb.origin.y;
		}

		return this._aabb;
	}

	// TODO: 検討。BoxVolumeについてはOBBを返すメソッドがあっても良い
}

export = BoxVolume;
