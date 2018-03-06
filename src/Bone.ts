import ColliderInfo = require("./ColliderInfo");

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
	alphaBlendType: string = undefined;

	constructor() {
		this.children = [];
		this.arrayIndex = -1;
		this.parentIndex = -1;
	}
}

export = Bone;
