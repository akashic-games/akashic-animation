import {Particle} from "./Particle";

export interface Emitter {
	/// パーティクル
	particles: Particle[];

	/// 子エミッタ
	children: Emitter[];

	/**
	 * エミッタをリセットする。
	 *
	 * 放出済みのパーティクルは破棄される。
	 */
	reset(): void;

	/**
	 * パーティクルを１つエミットする。
	 *
	 * @param x X座標
	 * @param y Y座標
	 */
	emitOneAt(x: number, y: number): void;

	/**
	 * パーティクルを１つ以上エミットする。
	 *
	 * @param x X座標
	 * @param y Y座標
	 */
	emitAt(x: number, y: number): void;

	/**
	 * 時間経過に基づいてエミットする。
	 *
	 * @param currentTime Emitterの現在時刻。０以上の実数
	 * @param dt 前回のエミットからの経過時間。０より大きい実数
	 * @param x エミットするX座標
	 * @param y エミットするY座標
	 */
	emitTimerAt(currentTime: number, dt: number, x: number, y: number): void;

	/**
	 * パーティクルを更新する。
	 *
	 * @param dt
	 */
	update(dt: number): void;
}


