var BoneSet = require("../lib/BoneSet.js").BoneSet;
var Bone = require("../lib/Bone.js").Bone;

describe("BoneSet", function() {
	it("should constructs itself properly", function() {
		var bones = [new Bone(), new Bone()];
		var boneSet = new BoneSet("Bob", bones);
		expect(boneSet.name).toBe("Bob");
		expect(boneSet.bones).toEqual(bones);
	});
});
