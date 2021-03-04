/**
 * 2Dサイズクラス
 */
export class Size2 implements g.CommonSize {
	width: number;
	height: number;

	constructor(width?: number, height?: number) {
		this.width = width !== undefined ? width : 0;
		this.height = height !== undefined ? height : 0;
	}
}
