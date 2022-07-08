import type {ContentType} from "./ContentType";

/**
 * コンテンツデータ。
 */
export class Content<T> {
	type: ContentType;
	name: string;
	data: T;

	constructor(type: ContentType, name: string, data: T) {
		this.type = type;
		this.name = name;
		this.data = data;
	}
}
