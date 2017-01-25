/**
 * セルアニメーションの値。
 *
 * KeyFrame<CellValue>に格納されセルアニメーション（時間とともに変化するセル）に利用される。
 */
export class CellValue {
	skinName: string;
	cellName: string;
}

export class IpCurve {
	values: number[] = [];
}

export class KeyFrame<T> {
	time: number;
	value: T;
	ipType: string;
	ipCurve: IpCurve;
}

export class Curve<T> {
	attribute: string = "";
	keyFrames: KeyFrame<T>[] = [];
}

export class CurveTie {
	boneName: string = "";
	curves: Curve<any>[] = [];
}

export class Animation {
	name: string = "";
	fps: number = 0;
	frameCount: number = 0;
	curveTies: { [key: string]: CurveTie } = {}; // key = curveTie.boneName
}
