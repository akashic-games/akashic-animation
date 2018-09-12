import {Particle} from "./Particle";

/**
 * エミッタのインターフェース。
 *
 * エミッタはパーティクルを放出・更新する役割を持つ。
 */
export interface Emitter {
	/**
	 * このエミッタがエミットしたパーティクル。
	 *
	 * particles が操作可能(要素の追加や削除、値の変更など)であるかは実装による。
	 */
	particles: Particle[];

	/**
	 * 子エミッタ。
	 *
	 * children が操作可能(要素の追加や削除、値の変更など)であるかは実装による。
	 */
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
	 * @param x エミット位置のX座標。
	 * @param y エミット位置のY座標。
	 */
	emitOneAt(x: number, y: number): void;

	/**
	 * パーティクルをエミットする。
	 *
	 * @param x エミット位置のX座標。
	 * @param y エミット位置のY座標。
	 */
	emitAt(x: number, y: number): void;

	/**
	 * 時間経過に応じてエミットする。
	 *
	 * @param currentTime Emitterの現在時刻。０以上の実数。
	 * @param dt 前回のエミットからの経過時間。０より大きい実数。
	 * @param x エミット位置のX座標。
	 * @param y エミット位置のY座標。
	 */
	emitTimerAt(currentTime: number, dt: number, x: number, y: number): void;

	/**
	 * パーティクルを更新する。
	 *
	 * @param dt
	 */
	update(dt: number): void;
}


