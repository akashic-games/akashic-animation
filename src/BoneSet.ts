import Bone = require("./Bone");

/**
 * ボーン集合。
 */
class BoneSet {
	name: string;
	bones: Bone[];

	constructor(name: string, bones: Bone[]) {
		this.name = name;
		this.bones = bones;
	}
}

export = BoneSet;
