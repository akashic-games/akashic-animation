var pci = require("@akashic/pdi-common-impl");
var fs = require("fs");

function createImageAsset(fileName, scene) {
	var name = fileName.split(".")[0];
	var asset = new pci.ImageAsset(name, "/dummy/path", 256, 256);
	asset.asSurface = function() { // browser-engineで実装される部分が抜けているのでここで埋め合わせる
		return {width: 256, height: 256};
	};
	scene.assets[name] = asset;
}

function createTextAsset(fileName, scene) {
	var name = fileName.split(".")[0];
	var asset = new pci.TextAsset(name, "/dummy/path");
	var content = fs.readFileSync("./spec/asset/text/" + fileName);
	asset.data = content;
	scene.assets[name] = asset;
}

function notUndefinedKeys(obj) {
	const keys = Object.keys(obj);
	const result = [];

	for (const key of keys) {
		if (obj[key] !== undefined) {
			result.push(key);
		}
	}

	return result;
}

// based on https://github.com/epoberezkin/fast-deep-equal
function _deepEqual(a, b, info) {
	if (a === b) return true;

	if (a && b && typeof a == "object" && typeof b == "object") {
		if (a.constructor !== b.constructor) {
			info.push("a is " + a.constructor.name + ", b is " + b.constructor.name);
			return false;
		}

		let length, i, keys;
		if (Array.isArray(a)) {
			length = a.length;
			if (length !== b.length) {
				info.push("a.length=" + a.length + ", b.length=" + b.length);
				return false;
			}
			for (i = length; i-- !== 0;) {
				if (!_deepEqual(a[i], b[i], info)) {
					info.unshift(i);
					return false;
				}
			}
			return true;
		}

		if (a.constructor === RegExp) {
			const result = a.source === b.source && a.flags === b.flags;
			if (result) {
				return true;
			}
			info.push("a.source=" + a.source + ", b.source=" + b.source + ", a.flags=" + a.flags + ", b.flags=" + b.flags);
			return false;
		}
		if (a.valueOf !== Object.prototype.valueOf) {
			const result = a.valueOf() === b.valueOf();
			if (result) {
				return true;
			}
			info.push("a.valueOf()=" + a.valueOf() + ", b.valueOf()=" + b.valueOf());
			return false;
		}
		if (a.toString !== Object.prototype.toString) {
			const result = a.toString() === b.toString();
			if (result) {
				return true;
			}
			info.push("a.toString()=" + a.toString() + ", b.toString()=" + b.toString());
			return false;
		}

		// undefined を持つプロパティは比較しない。つまり、一方にあるプロパティ
		// の値が undefined でもう一方にはそのプロパティが存在しないこと、を
		// 許容する
		const aKeys = notUndefinedKeys(a);
		const bKeys = notUndefinedKeys(b);
		if (aKeys.length !== bKeys.length) {
			info.push(
				"a.keys=[" + aKeys.sort().join(",") + "]" + ", " +
				"b.keys=[" + bKeys.sort().join(",") + "]"
			);
			return false;
		}
		keys = aKeys;
		length = aKeys.length;

		for (i = length; i-- !== 0;) {
			if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
				info.push("b does not have key " + keys[i]);
				info.unshift(keys[i]);
				return false;
			}
		}

		for (i = length; i-- !== 0;) {
			const key = keys[i];
			if (!_deepEqual(a[key], b[key], info)) {
				info.unshift(key);
				return false;
			}
		}

		return true;
	}

	// true if both NaN, false otherwise
	return a !== a && b !== b;
}

/**
 * オブジェクトを比較する
 *
 * 値が undefined のプロパティは比較しない。
 *
 * @param a オブジェクト
 * @param b オブジェクト
 * @returns オブジェクトが一致した時、真。一致しなかった時、一致しなかったプロパティのパスと詳細の文字列
 */
function deepEqual(a, b) {
	const info = [];

	const result = _deepEqual(a, b, info);

	if (result) {
		return true;
	}

	const detail = info.pop();

	return info.join(".") + " (" + detail + ")";
}

const gameConfiguration = {
	width: 320,
	height: 320,
	fps: 30,
	main: "",
	assets: {}
};

const handlerSet = {
	removeAllEventFilters: function () { }
};

const gameParam = {
	configuration: gameConfiguration,
	engineModule: {},
	handlerSet: handlerSet,
	resourceFactory: new pci.ResourceFactory(),
	operationPluginViewInfo: null
};

module.exports = {
	createImageAsset,
	createTextAsset,
	deepEqual,
	gameParam,
};
