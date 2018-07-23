interface ParticleParameterObject {
	lifespan: number;

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
}

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

	constructor(param?: ParticleParameterObject) {
		if (! param) return;

		this.lifespan = param.lifespan;

		this.tx = param.tx;
		this.txMin = param.txMin;
		this.txMax = param.txMax;

		this.ty = param.ty;
		this.tyMin = param.tyMin;
		this.tyMax = param.tyMax;

		this.vx = param.vx;
		this.vy = param.vy;
		this.vMin = param.vMin;
		this.vMax = param.vMax;

		this.ax = param.ax;
		this.ay = param.ay;
		this.aMin = param.aMin;
		this.aMax = param.aMax;

		this.rz = param.rz;
		this.rzMin = param.rzMin;
		this.rzMax = param.rzMax;

		this.vrz = param.vrz;
		this.vrzMin = param.vrzMin;
		this.vrzMax = param.vrzMax;

		this.arz = param.arz;
		this.arzMin = param.arzMin;
		this.arzMax = param.arzMax;

		this.sx = param.sx;
		this.sy = param.sy;

		this.alpha = param.alpha;
	}
}
