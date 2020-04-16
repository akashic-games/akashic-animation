import Content = require("./Content");
import ContentType = require("./ContentType");

/**
 * v3 のアニメーションデータコンテナ
 *
 * ASAファイルのデータが格納されている
 */
class ContainerV3 {
	// "3.x.x" でなければならない
	version: string;
	type: ContentType;
	contents: Content<any>[];

	constructor(version: string, type: ContentType, contents: Content<any>[]) {
		this.version = version;
		this.type = type;
		this.contents = contents;
	}
}

export = ContainerV3;
