import {AlphaBlendMode} from "./AlphaBlendMode";
import {ColliderInfo} from "./ColliderInfo";

/**
 * ボーンクラス。
 */
export class Bone {
	parentIndex: number;
	parent: Bone;
	children: Bone[];
	name: string;
	arrayIndex: number;
	colliderInfos: ColliderInfo[];
	alphaBlendMode: AlphaBlendMode = undefined;
	effectName: string;

	constructor() {
		this.children = [];
		this.arrayIndex = -1;
		this.parentIndex = -1;
	}
}
