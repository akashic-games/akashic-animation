/**
 * コライダー情報。
 *
 * Colliderの生成に用いる情報。
 */
export interface ColliderInfo {
	/**
	 * コライダー形状。
	 *
	 * cell, box, circle がある。
	 */
	geometryType: string;

	/**
	 * コライダー境界形状。
	 *
	 * aabb, box, circle がある。
	 */
	boundType: string;

	/**
	 * コライダーの形状が cell の時参照するセルの名前。
	 */
	cellName?: string;

	/**
	 * circle の中心位置。
	 *
	 * bone相対位置。
	 *
	 * コライダーの形状が circle の時参照される。
	 */
	center?: { x: number; y: number };

	/**
	 * circle の半径。
	 *
	 * アニメーションで定義されているとき上書きされる。
	 *
	 * コライダーの形状が circle の時参照される。
	 */
	radius?: number;

	/**
	 * circle の半径のスケール方法。
	 *
	 * min, max, または none 。
	 *
	 * コライダーの形状が circle の時参照される。
	 */
	scaleOption?: string;

	/**
	 * box の幅。
	 *
	 * コライダーの形状が box の時参照される。
	 */
	width?: number;

	/**
	 * box の高さ。
	 *
	 * コライダーの形状が box の時参照される。
	 */
	height?: number;
}

