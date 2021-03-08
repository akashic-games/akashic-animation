import {Size2} from "./Size2";
import {Vector2} from "./Vector2";

/**
 * AABBクラス。
 */
export class AABB {
	/**
	 * Bounding Box の中心位置。
	 */
	origin: Vector2;

	/**
	 * `origin`からの広がり。矩形のサイズの半分となる。
	 */
	extent: Size2;

	constructor() {
		this.origin = new Vector2();
		this.extent = new Size2();
	}
}
