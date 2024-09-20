import type { Animation } from "../AnimeParams";
import type { BoneSet } from "../BoneSet";
import type { Skin } from "../Skin";
import type * as vfx from "../vfx";
import type { Schema } from "./Schema";

/**
 * インポーター。
 *
 * ポーターはこのインターフェースに従ってインポーターを実装しなければならない。
 *
 * インポーターはスキーマをいつでも設定できなければならない。
 *
 * 将来、ポーターを追加・交換する機能を整備するとき、このインターフェースは変更
 * されるかもしれない。そのため、これを Akashic Animation の外部に公開しない。
 */
export interface Importer {
	/**
	 * スキーマを検証する。
	 *
	 * このインポータで利用可能なスキーマかどうかを検証する。
	 *
	 * @param scehema スキーマ
	 * @returns 真の時、利用可能なスキーマ。
	 */
	validateSchema(schema: Schema): boolean;

	/**
	 * スキーマを設定する。
	 *
	 * インポートする前にスキーマを設定しなければならない。
	 *
	 * @param schema スキーマ
	 */
	setSchema(schema: Schema): void;

	/**
	 * アニメーションをインポートする。
	 *
	 * @param data データ
	 */
	importAnimation(data: unknown): Animation;

	/**
	 * ボーンセットをインポートする。
	 *
	 * @param data データ
	 */
	importBoneSet(data: unknown): BoneSet;

	/**
	 * スキンをインポートする。
	 *
	 * @param data データ
	 */
	importSkin(data: unknown): Skin;

	/**
	 * エフェクトをインポートする。
	 *
	 * @param data データ
	 */
	importEffect(data: unknown): vfx.EffectParameterObject;
}
