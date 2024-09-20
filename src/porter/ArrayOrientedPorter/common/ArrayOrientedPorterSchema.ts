import type { Schema } from "../../../serialize";
import type { PropertyIndexMaps } from "./PropertyIndexMaps";

/**
 * ArrayOrientedPorter スキーマ。
 */
export interface ArrayOrientedPorterSchema extends Schema {
	type: "aop";
	propertyIndexMaps: PropertyIndexMaps;
}
