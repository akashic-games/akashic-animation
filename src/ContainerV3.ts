import type {Content} from "./Content";
import type {ContentType} from "./ContentType";

/**
 * v3 のアニメーションデータコンテナ
 *
 * ASAファイルのデータが格納されている
 */
export class ContainerV3 {
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
