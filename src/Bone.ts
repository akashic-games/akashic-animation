import type { AlphaBlendMode } from "./AlphaBlendMode";
import type { ColliderInfo } from "./ColliderInfo";

/**
 * ボーンクラス。
 */
export class Bone {
	/**
	 * 親ボーンのインデックス。
	 */
	parentIndex: number;

	/**
	 * 親ボーン。
	 *
	 * Boneをシリアライズする時 parent をシリアライズしないよう undefined にする。
	 */
	parent: Bone;

	/**
	 * 子ボーン。
	 *
	 * Boneをシリアライズする時 children をシリアライズしないよう undefined にする。
	 */
	children: Bone[];

	/**
	 * ボーン名。
	 */
	name: string;

	/**
	 * インデックス。
	 *
	 * ボーンに関連する情報の配列のインデックス。
	 */
	arrayIndex: number;

	/**
	 * コライダー情報配列。
	 */
	colliderInfos: ColliderInfo[];

	/**
	 * アルファブレンドモード。
	 */
	alphaBlendMode: AlphaBlendMode = undefined;

	/**
	 *エフェクト名。
	 */
	effectName: string;

	constructor() {
		this.children = [];
		this.arrayIndex = -1;
		this.parentIndex = -1;
	}
}
