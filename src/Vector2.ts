/**
 * 2Dベクトルクラス
 */
export class Vector2 implements g.CommonOffset {
	x: number;
	y: number;

	constructor(x?: number, y?: number) {
		this.x = x ? x : 0;
		this.y = y ? y : 0;
	}
}
