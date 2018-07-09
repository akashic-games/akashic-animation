export class Particle {
	lifespan: number;
	elapse: number;

	tx: number;
	txMin: number;
	txMax: number;

	ty: number;
	tyMin: number;
	tyMax: number;

	vx: number;
	vy: number;
	vMin: number;
	vMax: number;

	ax: number;
	ay: number;
	aMin: number;
	aMax: number;

	rz: number;
	rzMin: number;
	rzMax: number;

	vrz: number;
	vrzMin: number;
	vrzMax: number;

	arz: number;
	arzMin: number;
	arzMax: number;

	sx: number;
	sy: number;

	alpha: number;

	constructor() {
		this.lifespan = 1;
		this.elapse = 0;

		this.tx = 0;
		this.ty = 0;
		this.vx = 0;
		this.vy = 0;
		this.ax = 0;
		this.ay = 0;

		this.rz = 0;
		this.vrz = 0;
		this.arz = 0;

		this.sx = 1;
		this.sy = 1;

		this.alpha = 1.0;
	}
}
