interface ColliderInfo {
	// コライダーの内部形状 (cell, box, circle)
	// Volumeを生成する元になる形状
	geometryType: string;

 	// コライダー境界形状 (aabb, box, circle)
	// どのようなVolumeを生成するか
	boundType: string;

	// geometry type: cell
	cellName?: string;

	// geometry type: circle
	center?: { x: number, y: number }; // bone相対位置
	radius?: number; // アタリ半径。アニメーションで定義されているとき上書きされる
	scaleOption?: string; // 半径のスケール方法(min, max, or none)

	// geometry type: box
	width?: number;
	height?: number;
}

export = ColliderInfo;
