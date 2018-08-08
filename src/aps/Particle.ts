interface ParticleParameterObject {
	lifespan: number;

	// position
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

	// rotation
	rz: number;
	rzMin: number;
	rzMax: number;

	vrz: number;
	vrzMin: number;
	vrzMax: number;

	arz: number;
	arzMin: number;
	arzMax: number;

	// scale
	sx: number;
	sxMin: number;
	sxMax: number;

	vsx: number;
	vsxMin: number;
	vsxMax: number;

	asx: number;
	asxMin: number;
	asxMax: number;

	sy: number;
	syMin: number;
	syMax: number;

	vsy: number;
	vsyMin: number;
	vsyMax: number;

	asy: number;
	asyMin: number;
	asyMax: number;

	sxy: number;
	sxyMin: number;
	sxyMax: number;

	vsxy: number;
	vsxyMin: number;
	vsxyMax: number;

	asxy: number;
	asxyMin: number;
	asxyMax: number;

	// transparency
	alpha: number;
}

export class Particle {
	elapse: number;

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

	// scale
	sx: number;
	sxMin: number;
	sxMax: number;

	vsx: number;
	vsxMin: number;
	vsxMax: number;

	asx: number;
	asxMin: number;
	asxMax: number;

	sy: number;
	syMin: number;
	syMax: number;

	vsy: number;
	vsyMin: number;
	vsyMax: number;

	asy: number;
	asyMin: number;
	asyMax: number;

	sxy: number;
	sxyMin: number;
	sxyMax: number;

	vsxy: number;
	vsxyMin: number;
	vsxyMax: number;

	asxy: number;
	asxyMin: number;
	asxyMax: number;

	// transparency
	alpha: number;

	constructor(param: ParticleParameterObject) {
		this.elapse = 0;

		this.lifespan = param.lifespan;

		// position
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

		// rotation
		this.rz = param.rz;
		this.rzMin = param.rzMin;
		this.rzMax = param.rzMax;

		this.vrz = param.vrz;
		this.vrzMin = param.vrzMin;
		this.vrzMax = param.vrzMax;

		this.arz = param.arz;
		this.arzMin = param.arzMin;
		this.arzMax = param.arzMax;

		// scale
		this.sx = param.sx;
		this.sxMin = param.sxMin;
		this.sxMax = param.sxMax;

		this.vsx = param.vsx;
		this.vsxMin = param.vsxMin;
		this.vsxMax = param.vsxMax;

		this.asx = param.asx;
		this.asxMin = param.asxMin;
		this.asxMax = param.asxMax;

		this.sy = param.sy;
		this.syMin = param.syMin;
		this.syMax = param.syMax;

		this.vsy = param.vsy;
		this.vsyMin = param.vsyMin;
		this.vsyMax = param.vsyMax;

		this.asy = param.asy;
		this.asyMin = param.asyMin;
		this.asyMax = param.asyMax;

		this.sxy = param.sxy;
		this.sxyMin = param.sxyMin;
		this.sxyMax = param.sxyMax;

		this.vsxy = param.vsxy;
		this.vsxyMin = param.vsxMin;
		this.vsxyMax = param.vsxyMax;

		this.asxy = param.asxy;
		this.asxyMin = param.asxyMin;
		this.asxyMax = param.asxyMax;

		this.alpha = param.alpha;
	}
}
