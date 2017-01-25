var Size2 = require("../lib/Size2.js");

describe("Size2", function() {
	it("should construct itself properly", function() {
		var s = new Size2();
		expect(s.width).toBe(0);
		expect(s.height).toBe(0);
	});

	it("should construct itself with width properly", function() {
		var s = new Size2(100);
		expect(s.width).toBe(100);
		expect(s.height).toBe(0);
	});

	it("should construct itself with width and height properly", function() {
		var s = new Size2(100, 200);
		expect(s.width).toBe(100);
		expect(s.height).toBe(200);
	});
});
