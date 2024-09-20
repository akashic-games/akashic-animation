import type {ContainerV2} from "./ContainerV2";
import type {ContainerV3} from "./ContainerV3";

/**
 * コンテナ型。
 *
 * コンテナはASAデータを格納するオブジェクトである。
 */
export type Container = ContainerV2 | ContainerV3;
