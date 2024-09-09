import type { Animation } from "../AnimeParams";
import type { BoneSet } from "../BoneSet";
import type { Skin } from "../Skin";
import type * as vfx from "../vfx";

/**
 * インポーター。
 *
 * ポーターはこのインターフェースに従ってインポーターを実装しなければならない。
 *
 * 将来、ポーターを追加・交換する機能を整備するとき、このインターフェースは変更
 * されるかもしれない。そのため、これを Akashic Animation の外に公開しない。
 */
export interface Importer {
	importAnimation(data: unknown): Animation;
	importBoneSet(data: unknown): BoneSet;
	importSkin(data: unknown): Skin;
	importEffect(data: unknown): vfx.EffectParameterObject;
}
