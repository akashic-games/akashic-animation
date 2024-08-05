import type {Content} from "./Content";

/**
 * コンテナ(V3)の種別
 *
 * - bundle: プロジェクトデータと、それに関連するデータを全て持つ。
 */
export type ContainerV3Type = "bundle";

/**
 * v3 のデータコンテナ
 *
 * ASAファイルのデータが格納されている
 */
export class ContainerV3 {
	// "3.x.x" でなければならない
	version: string;
	type: ContainerV3Type;
	contents: Content<any>[];

	constructor(version: string, type: ContainerV3Type, contents: Content<any>[]) {
		this.version = version;
		this.type = type;
		this.contents = contents;
	}
}
