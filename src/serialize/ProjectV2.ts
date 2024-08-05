import type { Schema } from "./Schema";

export interface ProjectV2 {
	boneSetFileNames: string[];
	skinFileNames: string[];
	animationFileNames: string[];
	effectFileNames: string[];
	userData?: any;

	/**
	 * スキーマ
	 *
	 * プロジェクト配下のファイルのスキーマ。
	 */
	schema?: Schema;
}
