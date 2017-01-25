global.g = require("@akashic/akashic-engine");
var BoxVolume = require("../lib/BoxVolume.js");

describe("BoxVolume", function() {
	it("should return AABB based on itself", function() {
		var vol = new BoxVolume();
		vol.origin.x = 0;
		vol.origin.y = 0;
		vol.size.width = 16;
		vol.size.height = 16;
		vol.matrix = new g.PlainMatrix();
		vol.matrix.update(vol.size.width, vol.size.height, 1, 1, 45, 10, 10);

		var aabb = vol.aabb();
		expect(aabb).toBeDefined();
		// https://www.safaribooksonline.com/library/view/javascript-testing-with/9781449356729/_nearness_tobecloseto.html
		expect(aabb.origin.x).toBeCloseTo(vol.size.width / 2 + 10, 5);
		expect(aabb.origin.y).toBeCloseTo(vol.size.height / 2 + 10, 5);
		expect(aabb.extent.width).toBeCloseTo(vol.size.width / 2 * Math.sqrt(2), 5);
		expect(aabb.extent.height).toBeCloseTo(vol.size.height / 2 * Math.sqrt(2), 5);
	});
});
