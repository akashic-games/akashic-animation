import AABB = require("./AABB");

/**
 * アタリ判定用領域インターフェース
 */
interface Volume {
	aabbFirst: boolean;
	dirty: boolean; // to recalculate aabb
	aabb(): AABB;
}

export = Volume;
