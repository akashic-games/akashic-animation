var AABB = require("../lib/AABB.js").AABB;
var Vector2 = require("../lib/Vector2.js").Vector2;
var Size2 = require("../lib/Size2.js").Size2;

describe("AABB", function() {
	it("should construct itself with params properly", function() {
		var aabb = new AABB();
		expect(aabb.origin).toBeDefined();
		expect(aabb.extent).toBeDefined();
		expect(aabb.origin instanceof Vector2).toBe(true);
		expect(aabb.extent instanceof Size2).toBe(true);
	});
});
