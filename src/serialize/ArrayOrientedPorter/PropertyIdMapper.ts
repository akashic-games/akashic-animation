export class PropertyIdMapper<T> {
	properties: Array<Extract<keyof T, string>>;

	constructor() {
		this.properties = [];
	}

	getIndex(name: Extract<keyof T, string>): number {
		const idx = this.properties.indexOf(name);
		if (idx !== -1) {
			return idx;
		}

		this.properties.push(name);
		return this.properties.length - 1;
	}

	getProperty(index: number): keyof T {
		const property = this.properties[index];
		if (property == null) {
			throw new Error(`Unknown index: ${index}`);
		}
		return property;
	}
}
