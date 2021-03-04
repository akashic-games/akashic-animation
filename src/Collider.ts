import { Actor } from "./Actor";
import { Volume } from "./Volume";

/**
 * コリジョンのためのVolume算出役
 */
export class Collider {
	/**
	 * 名前
	 *
	 * 利用方法の詳細は各派生クラスのリファレンスを参照してください。
	 */
	name: string;

	/**
	 * コンバータによってはこれに値を与える。どう使うかは開発者次第。システムは関知しない
	 */
	tag: number;

	/**
	 * dirtyフラグ。開発者はこれを使うことはない。
	 */
	dirty: boolean;

	/**
	 * 有効・無効フラグ
	 *
	 * `false`の時、`getVolume()`は`undefined`を返す。
	 * 初期値は`true`である。
	 */
	enabled: boolean;

	/**
	 * AABB優先フラグ
	 *
	 * `getVolume()`の返す`Volume`はこの値がコピーされる。
	 */
	aabbFirst: boolean;

	constructor(aabbFirst?: boolean) {
		this.dirty = false;
		this.enabled = true;
		this.aabbFirst = !!aabbFirst;
	}

	getVolume(): Volume {
		return undefined;
	}

	onAttached(_actor: Actor): void {
		// nothing to do
	}
}
