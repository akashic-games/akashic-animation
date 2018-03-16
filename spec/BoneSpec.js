var Bone = require("../lib/Bone.js");

describe("Bone", function() {
	it("should constructs itself properly", function() {
		var bone = new Bone();
		expect(bone.children).toBeDefined();
		expect(bone.children instanceof Array).toBe(true);
		expect(bone.children.length).toBe(0);
		expect(bone.arrayIndex).toBe(-1);
		expect(bone.parentIndex).toBe(-1);
		expect(bone.AlphaBlendMode).toBeUndefined();
	});
});
