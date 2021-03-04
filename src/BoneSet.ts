import {Bone} from "./Bone";

/**
 * ボーン集合。
 */
export class BoneSet {
	name: string;
	bones: Bone[];

	constructor(name: string, bones: Bone[]) {
		this.name = name;
		this.bones = bones;
	}
}
