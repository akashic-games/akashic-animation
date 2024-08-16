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
	/**
	 * バージョン。
	 *
	 * メジャーバージョンが3である "3.x.x" のような形式でなければならない。
	 */
	version: string;

	/**
	 * コンテナの種別。
	 */
	type: ContainerV3Type;

	/**
	 * コンテンツ配列。
	 */
	contents: Content<any>[];

	/**
	 * コンストラクタ。
	 *
	 * @param version バージョン
	 * @param type コンテナの種別
	 * @param contents コンテンツ配列。
	 */
	constructor(version: string, type: ContainerV3Type, contents: Content<any>[]) {
		this.version = version;
		this.type = type;
		this.contents = contents;
	}
}
