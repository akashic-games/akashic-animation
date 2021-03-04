import {AABB} from "./AABB";

/**
 * アタリ判定用領域インターフェース
 */
export interface Volume {
	aabbFirst: boolean;
	dirty: boolean; // to recalculate aabb
	aabb(): AABB;
}
