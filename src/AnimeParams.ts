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

/**
 * 補間方法の配列。
 *
 * 補間方法を表す文字列リテラルの配列上の位置（インデックス）を利用する
 * ことがあるため、順序を変更してはならない。
 */
export const ipTypes = [
	"undefined",
	"linear",
	"bezier",
	"hermite",
	"acceleration",
	"deceleration",
] as const;

/**
 * 補間方法型。
 *
 * キーフレーム間の補間方法を表す。
 */
export type IpType = typeof ipTypes[number];

export class KeyFrame<T> {
	time: number;
	value: T;
	ipType: IpType;
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
