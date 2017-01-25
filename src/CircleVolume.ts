import Volume = require("./Volume");
import AABB = require("./AABB");
import Vector2 = require("./Vector2");

/**
 * CircleVolume。
 *
 * アタリ判定用真円形Volume。
 */
class CircleVolume implements Volume {
	/**
	 * 位置（ワールド座標）。
	 */
	pos: Vector2;

	/**
	 * 半径。
	 */
	r: number;

	aabbFirst: boolean;
	dirty: boolean;

	private _aabb: AABB; // cache

	constructor() {
		this.pos = new Vector2();
		this.r = 0;
	}

	aabb(): AABB {
		if (! this._aabb || this.dirty) {
			this.dirty = false;
			if (! this._aabb) this._aabb = new AABB();
			this._aabb.origin.x = this.pos.x;
			this._aabb.origin.y = this.pos.y;
			this._aabb.extent.width = this.r;
			this._aabb.extent.height = this.r;
		}
		return this._aabb;
	}
}

export = CircleVolume;
