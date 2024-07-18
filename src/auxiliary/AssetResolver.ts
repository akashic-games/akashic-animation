type AssetsOrAccessor = {[key: string]: g.Asset} | g.AssetAccessor;

/**
 * akashic-engine v2 以前のアセットマップと akashic-engine v3 以降の g.AssetAccessor の差異を吸収するクラス。
 */
export class AssetResolver {
	assets: {[key: string]: g.Asset} | null = null;
	accessor: g.AssetAccessor | null = null;
	basePath: string | null = null;

	constructor(assetsOrAccessor: AssetsOrAccessor, basePath?: string) {
		if (assetsOrAccessor instanceof g.AssetAccessor) {
			if (!basePath) throw g.ExceptionFactory.createAssertionError("`basePath` is required when using AssetAccessor");
			this.accessor = assetsOrAccessor;
			this.basePath = basePath;
		} else {
			this.assets = assetsOrAccessor;
		}
	}

	getImage(name: string, exts: string[] = [".png", ".jpg", ".jpeg"]): g.ImageAsset {
		if (this.accessor) {
			let asset: g.ImageAsset;
			for (const ext of exts) {
				try {
					const assetPath = g.PathUtil.resolvePath(this.basePath, `${name}${ext}`);
					asset = this.accessor.getImage(assetPath);
				} catch (error) {
					// nothing to do.
				}
			}

			if (!asset) {
				throw g.ExceptionFactory.createAssetLoadError(
					`Failed to load asset ${exts.map(ext => name + ext).join(" or ")}`
				);
			}

			return asset;
		} else {
			const assetId = name.split(".")[0]; // アセット ID は拡張子を除いたファイル名
			return this.assets[assetId] as g.ImageAsset;
		}
	}

	getJSON<T>(name: string): T {
		let data: T;

		if (this.accessor) {
			const assetPath = g.PathUtil.resolvePath(this.basePath, name);
			data = this.accessor.getJSONContent(assetPath);
		} else {
			const assetId = name.split(".")[0]; // アセット ID は拡張子を覗いたファイル名
			data = JSON.parse((<g.TextAsset> this.assets[assetId]).data);
		}

		return data;
	}
}
