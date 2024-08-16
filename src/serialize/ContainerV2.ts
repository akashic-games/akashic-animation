/**
 * V2形式のASAデータコンテナ。
 */
export class ContainerV2 {
	/**
	 * バージョン。
	 *
	 * メジャーバージョンが2である "2.x.x" のような形式でなければならない。
	 */
	version: string;

	/**
	 * コンテンツ。
	 */
	contents: any;

	/**
	 * コンストラクタ。
	 *
	 * @param version バージョン。
	 * @param contents コンテンツ。
	 */
	constructor(version: string, contents: any) {
		this.version = version;
		this.contents = contents;
	}
}
