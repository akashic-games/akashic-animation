/**
 * パーティクルのインターフェース。
 *
 * パーティクルは１つの粒子を表現する。
 */
export interface Particle {
	/// particle生成からの経過時間(ms)。
	elapse: number;

	/// particleの寿命(ms)。
	lifespan: number;

	/// X座標。
	tx: number;

	/// Y座標。
	ty: number;

	/// X速度。
	vx: number;

	/// Y速度。
	vy: number;

	/// X加速度。
	ax: number;

	/// Y加速度。
	ay: number;

	/// Z回転量(rad)。
	rz: number;

	/// Xスケール。
	sx: number;

	/// Yスケール。
	sy: number;

	/// 不透明度。
	alpha: number;
}
