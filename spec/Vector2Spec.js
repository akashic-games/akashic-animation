var Vector2 = require("../lib/Vector2.js");

describe("Vector2", function() {
	it("should construct itself properly", function() {
		var v = new Vector2();
		expect(v.x).toBe(0);
		expect(v.y).toBe(0);
	});

	it("should construct itself properly with two arguments", function() {
		var v = new Vector2(10, 20);
		expect(v.x).toBe(10);
		expect(v.y).toBe(20);
	});

	it("should construct itself properly with only one argument", function() {
		var v = new Vector2(10);
		expect(v.x).toBe(10);
		expect(v.y).toBe(0);
	});
});
