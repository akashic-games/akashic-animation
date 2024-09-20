import type {ContentType} from "./ContentType";

/**
 * コンテント。
 *
 * ContainerV3に格納するデータを、名前、種別と共に保持する。
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
