global.g = require("@akashic/akashic-engine");
var fs = require("fs");

function createImageAsset(fileName, scene) {
	var name = fileName.split(".")[0];
	var asset = new g.ImageAsset(name, "/dummy/path", 256, 256);
	asset.asSurface = function() { // browser-engineで実装される部分が抜けているのでここで埋め合わせる
		return {width: 256, height: 256};
	};
	scene.assets[name] = asset;
}

function createTextAsset(fileName, scene) {
	var name = fileName.split(".")[0];
	var asset = new g.TextAsset(name, "/dummy/path");
	var content = fs.readFileSync("./spec/asset/text/" + fileName);
	asset.data = content;
	scene.assets[name] = asset;
}

module.exports = {
	createImageAsset: createImageAsset,
	createTextAsset: createTextAsset
};
