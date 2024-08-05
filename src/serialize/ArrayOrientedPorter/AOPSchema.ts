import type { Schema } from "../Schema";
import type { PropertyIdMaps } from "./PropertyIdMaps";

export interface AOPSchema extends Schema {
	type: "aop";
	propertyIdMaps: PropertyIdMaps;
}
