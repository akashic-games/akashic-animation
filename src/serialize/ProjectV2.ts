import type { Schema } from "./Schema";

/**
 * プロジェクト(V2形式）。
 *
 * プロジェクトはさまざまなアニメーションデータのメタデータを持つ。
 */
export interface ProjectV2 {
	/**
	 * boneSetファイル名のリスト。
	 */
	boneSetFileNames: string[];

	/**
	 * skinファイル名のリスト。
	 */
	skinFileNames: string[];

	/**
	 * animationファイル名のリスト。
	 */
	animationFileNames: string[];

	/**
	 * effectファイル名のリスト。
	 */
	effectFileNames: string[];

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
