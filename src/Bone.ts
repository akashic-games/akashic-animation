import ColliderInfo = require("./ColliderInfo");
import AlphaBlendMode = require("./AlphaBlendMode");

/**
 * ボーンクラス。
 */
class Bone {
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

export = Bone;
