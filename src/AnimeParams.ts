/**
 * セルアニメーションの値。
 *
 * KeyFrame<CellValue>に格納されセルアニメーション（時間とともに変化するセル）に利用される。
 */
export class CellValue {
	skinName: string;
	cellName: string;
}

/**
 * カーブの補間パラメータ。
 */
export class IpCurve {
	values: number[] = [];
}

/**
 * 補間方法の配列。
 *
 * 各方法の配列上の位置を利用することがあるため、順序を変更してはならない。
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

/**
 * キーフレーム。
 *
 * 描画に関する属性のある時刻の値と補間方法を表す。
 */
export class KeyFrame<T> {
	time: number;
	value: T;
	ipType: IpType | undefined;
	ipCurve: IpCurve;
}

/**
 * カーブ。
 *
 * 描画に関する属性の時間に伴う変化を表す。
 */
export class Curve<T> {
	attribute: string = "";
	keyFrames: KeyFrame<T>[] = [];
}

/**
 * カーブタイ。
 *
 * 複数のカーブをまとめ、ボーンに対応づける。
 */
export class CurveTie {
	boneName: string = "";
	curves: Curve<any>[] = [];
}

/**
 * アニメーション。
 *
 * 各ボーンのアニメーションを保持する。
 */
export class Animation {
	name: string = "";
	fps: number = 0;
	frameCount: number = 0;
	curveTies: { [key: string]: CurveTie } = {}; // key = curveTie.boneName
}
