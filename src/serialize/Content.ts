import type {ContentType} from "./ContentType";

/**
 * コンテンツデータ。
 *
 * 任意のデータとその種別、名前を持つ。
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
