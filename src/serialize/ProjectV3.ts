import type { Schema } from ".";

export interface ProjectV3 {
	/**
	 * ユーザーデータ。
	 *
	 * ユーザーは任意のデータを格納できる。
	 */
	userData?: any;

	/**
	 * スキーマ
	 *
	 * プロジェクトに関連するデータのスキーマ。
	 */
	schema?: Schema;
}
