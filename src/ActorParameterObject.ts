import type {Resource} from "./Resource";

/**
 * アクターコンストラクタパラメータ。
 */
export interface ActorParameterObject extends g.EParameterObject {
	scene: g.Scene;
	resource: Resource;
	animationName: string;
	skinNames: string[];
	boneSetName: string;
	width: number;
	height: number;
	playSpeed?: number;
}
