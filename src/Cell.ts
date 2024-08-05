import {Size2} from "./Size2";
import {Vector2} from "./Vector2";

/**
 * セル
 *
 *
 */
export class Cell {
	name: string;
	pos: Vector2;
	size: Size2;
	pivot: Vector2;
	rz: number; // rotation Z

	// 回転とセンタリングを表す行列
	// rzが非ゼロの時のみ、`Actor#calc()`の時点でただ一度算出される
	m: g.Matrix;

	constructor() {
		this.pos = new Vector2();
		this.size = new Size2();
		this.pivot = new Vector2();
		this.rz = 0;
		this.m = undefined;
	}
}
