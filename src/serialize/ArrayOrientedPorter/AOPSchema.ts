import type { Schema } from "../Schema";
import type { PropertyIndexMaps } from "./PropertyIndexMaps";

/**
 * AOPスキーマ。
 */
export interface AOPSchema extends Schema {
	type: "aop";
	propertyIndexMaps: PropertyIndexMaps;
}
