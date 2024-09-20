/**
 * Akashic Animation がサポートするアルファブレンドの配列。
 *
 * 配列上の位置を利用することがあるため、順序を変更してはならない。
 */
export const alphaBlendModes = [
	"normal",
	"add",
] as const;

/**
 * Akashic Animation がサポートするアルファブレンドの種類。
 */
export type AlphaBlendMode = typeof alphaBlendModes[number];
