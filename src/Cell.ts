import Vector2 = require("./Vector2");
import Size2 = require("./Size2");

/**
 * セル
 */
class Cell {
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

export = Cell;
