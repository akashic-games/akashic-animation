import {AABB} from "./AABB";
import {Size2} from "./Size2";
import {Vector2} from "./Vector2";
import {Volume} from "./Volume";

/**
 * BoxVolume
 *
 * アタリ判定用矩形Volume。
 *
 * 実際にアタリ判定を行うときは `BoxVolume#matrix`,`origin` そして, `size` を用いてワールド座標系での領域を求める必要があります。
 */
export class BoxVolume implements Volume {
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
			points.push(this.matrix.multiplyPoint(this.origin));
			points.push(this.matrix.multiplyPoint(new Vector2(this.origin.x + this.size.width, this.origin.y)));
			points.push(this.matrix.multiplyPoint(new Vector2(this.origin.x,                   this.origin.y + this.size.height)));
			points.push(this.matrix.multiplyPoint(new Vector2(this.origin.x + this.size.width, this.origin.y + this.size.height)));

			// AABBの左上隅
			const lefttop = new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
			// AABBの右下隅
			const rightbottom = new Vector2(-Number.MAX_VALUE, -Number.MAX_VALUE);

			for (let i = 0, len = points.length; i < len; i += 1) {
				const p = points[i];
				if (p.x > rightbottom.x) rightbottom.x = p.x;
				if (p.x < lefttop.x) lefttop.x = p.x;
				if (p.y > rightbottom.y) rightbottom.y = p.y;
				if (p.y < lefttop.y) lefttop.y = p.y;
			}

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
