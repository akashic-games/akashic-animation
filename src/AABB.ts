import Vector2 = require("./Vector2");
import Size2 = require("./Size2");

/**
 * AABBクラス。
 */
class AABB {
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

export = AABB;
