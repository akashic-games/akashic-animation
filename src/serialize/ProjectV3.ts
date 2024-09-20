import type { Schema } from "./Schema";

/**
 * プロジェクト(V3形式）。
 *
 * プロジェクトはさまざまなアニメーションデータのメタデータを持つ。
 */
export interface ProjectV3 {
	/**
	 * ユーザーデータ。
	 */
	userData?: any;

	/**
	 * スキーマ。
	 *
	 * 各種データの構造を定義するデータ。
	 */
	schema?: Schema;
}
