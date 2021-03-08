var Cell = require("../lib/Cell.js").Cell;
/*
this.pos = new Vector2();
this.size = new Size2();
this.pivot = new Vector2();
this.rz = 0;
*/

describe("Cell", function() {
	it("constructs itself properly", function() {
		var cell = new Cell();
		expect(cell.pos).toBeDefined();
		expect(cell.size).toBeDefined();
		expect(cell.pivot).toBeDefined();
		expect(cell.rz).toBe(0);
	});
});
