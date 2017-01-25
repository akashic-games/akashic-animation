/**
 * アニメーションデータコンテナ
 *
 * ASAファイル(拡張子がasa...(asapj, asaan and etc))に格納されるデータにバージョン情報を追加する
 */
class Container {
	version: string;
	contents: any;

	constructor(version: string, contents: any) {
		this.version = version;
		this.contents = contents;
	}
}

export = Container;
