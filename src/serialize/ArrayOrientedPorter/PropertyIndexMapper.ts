/**
 * プロパティ名とインデックスのマッパー。
 *
 * プロパティの値を配列のどの位置に格納するか管理する。
 */
export class PropertyIndexMapper<T> {
	/**
	 * プロパティ名の配列。
	 *
	 * プロパティ名の配列上の位置が、プロパティの値を格納する配列上の位置となる。
	 */
	properties: Array<Extract<keyof T, string>>;

	constructor() {
		this.properties = [];
	}

	/**
	 * インデックスの取得。
	 *
	 * @param name プロパティ名
	 * @returns インデックス。
	 */
	getIndex(name: Extract<keyof T, string>): number {
		const idx = this.properties.indexOf(name);
		if (idx !== -1) {
			return idx;
		}

		this.properties.push(name);
		return this.properties.length - 1;
	}

	/**
	 * プロパティ名の取得。
	 *
	 * @param index 配列上の位置。
	 * @returns プロパティ名。
	 */
	getProperty(index: number): keyof T {
		const property = this.properties[index];
		if (property == null) {
			throw new Error(`Unknown index: ${index}`);
		}
		return property;
	}
}
