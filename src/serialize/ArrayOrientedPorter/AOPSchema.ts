import type { Schema } from "../Schema";
import type { PropertyIndexMaps } from "./PropertyIdMaps";

/**
 * AOPスキーマ。
 */
export interface AOPSchema extends Schema {
	type: "aop";
	propertyIdMaps: PropertyIndexMaps;
}
