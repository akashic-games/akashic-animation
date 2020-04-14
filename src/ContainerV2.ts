/**
 * v2 (旧形式) のアニメーションデータコンテナ
 *
 * ASAファイル(拡張子がasa...(asapj, asaan and etc))に格納されるデータにバージョン情報を追加する
 */
class ContainerV2 {
	version: string;
	contents: any;

	constructor(version: string, contents: any) {
		this.version = version;
		this.contents = contents;
	}
}

export = ContainerV2;
