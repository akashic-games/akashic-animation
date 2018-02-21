/**
 * 属性ID
 *
 * Posture#attrs 属性配列に格納された値にアクセスするための添字として用いる。
 * 例えばX方向移動量にアクセスするには posture.attrs[AttrId.tx] とする。
 */
enum AttrId {
	/**
	 * X方向移動。
	 */
	tx = 0,

	/**
	 * Y方向移動。
	 */
	ty,

	/**
	 * Z軸回転(deg)。
	 */
	rz,

	/**
	 * X方向スケール。
	 */
	sx,

	/**
	 * Y方向スケール。
	 */
	sy,

	/**
	 * X方向ローカルスケール
	 */
	lsx,

	/**
	 * Y方向ローカルスケール
	 */
	lsy,

	/**
	 * 半透明度。
	 *
	 * 0で透明、1で不透明を表す。
	 */
	alpha,

	/**
	 * セル値。
	 *
	 * CellValueクラスを参照。
	 */
	cv,

	/**
	 * セル回転位置X座標。
	 *
	 * セルの中心位置は pvtx, pvty 属性によって与えられる。
	 */
	pvtx,

	/**
	 * セル回転位置Y座標。
	 *
	 * セルの中心位置は pvtx, pvty 属性によって与えられる。
	 */
	pvty,

	/**
	 * セルテクスチャU座標。
	 *
	 * セルの参照する画像上の参照位置。正規化されている。
	 */
	tu,

	/**
	 * セルテクスチャV座標。
	 *
	 * セルの参照する画像上の参照位置。正規化されている。
	 */
	tv,

	/**
	 * セル描画優先順位。
	 *
	 * あるActorをレンダリングするときのセル間の描画優先順位。
	 */
	prio,

	/**
	 * 可視属性。
	 */
	visibility,

	/**
	 * 円アタリ判定半径。
	 */
	ccr,

	/**
	 * 水平フリップ。
	 */
	flipH,

	/**
	 * 垂直フリップ。
	 */
	flipV,

	/**
	 * ユーザデータ。
	 */
	userData
}

export = AttrId;