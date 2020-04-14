import Content = require("./Content");
import ContentType = require("./ContentType");

/**
 * アニメーションデータコンテナ
 *
 * ASAファイルのデータが格納されている
 */
class Container {
	version: string;
	type: ContentType;
	contents: Content<any>[];

	constructor(version: string, type: ContentType, contents: Content<any>[]) {
		this.version = version;
		this.type = type;
		this.contents = contents;
	}
}

export = Container;
