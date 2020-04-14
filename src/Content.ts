import ContentType = require("./ContentType");

/**
 * コンテンツデータ。
 */
class Content<T> {
	type: ContentType;
	name: string;
	data: T;

	constructor(type: ContentType, name: string, data: T) {
		this.type = type;
		this.name = name;
		this.data = data;
	}
}

export = Content;
