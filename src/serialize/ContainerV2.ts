/**
 * V2形式のASAデータコンテナ。
 */
export class ContainerV2 {
	/**
	 * バージョン。
	 *
	 * メジャーバージョンが２である"2.x.x" のような形式でなければならない。
	 */
	version: string;
	contents: any;

	constructor(version: string, contents: any) {
		this.version = version;
		this.contents = contents;
	}
}
