
import {BasicParticle, BasicParticleParameterObject} from "../aps";

export interface ParticleParameterObject extends BasicParticleParameterObject {
	txMin: number;
	txMax: number;

	tyMin: number;
	tyMax: number;

	vMin: number;
	vMax: number;

	aMin: number;
	aMax: number;

	rzMin: number;
	rzMax: number;

	vrz: number;
	vrzMin: number;
	vrzMax: number;

	arz: number;
	arzMin: number;
	arzMax: number;

	sxMin: number;
	sxMax: number;

	vsx: number;
	vsxMin: number;
	vsxMax: number;

	asx: number;
	asxMin: number;
	asxMax: number;

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

	fadeInNT: number;
	fadeOutNT: number;
}

export class Particle extends BasicParticle {
	txMin: number;
	txMax: number;

	tyMin: number;
	tyMax: number;

	vMin: number;
	vMax: number;

	aMin: number;
	aMax: number;

	rzMin: number;
	rzMax: number;

	vrz: number;
	vrzMin: number;
	vrzMax: number;

	arz: number;
	arzMin: number;
	arzMax: number;

	sxMin: number;
	sxMax: number;

	vsx: number;
	vsxMin: number;
	vsxMax: number;

	asx: number;
	asxMin: number;
	asxMax: number;

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

	fadeInNT: number;
	fadeOutNT: number;

	constructor(param: ParticleParameterObject) {
		super(param);
		this.init(param);
	}

	init(param: ParticleParameterObject) {
		super.init(param);

		this.txMin = param.txMin;
		this.txMax = param.txMax;

		this.tyMin = param.tyMin;
		this.tyMax = param.tyMax;

		this.vy = param.vy;
		this.vMin = param.vMin;
		this.vMax = param.vMax;

		this.aMin = param.aMin;
		this.aMax = param.aMax;

		this.rzMin = param.rzMin;
		this.rzMax = param.rzMax;

		this.vrz = param.vrz;
		this.vrzMin = param.vrzMin;
		this.vrzMax = param.vrzMax;

		this.arz = param.arz;
		this.arzMin = param.arzMin;
		this.arzMax = param.arzMax;

		this.sxMin = param.sxMin;
		this.sxMax = param.sxMax;

		this.vsx = param.vsx;
		this.vsxMin = param.vsxMin;
		this.vsxMax = param.vsxMax;

		this.asx = param.asx;
		this.asxMin = param.asxMin;
		this.asxMax = param.asxMax;

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

		this.fadeInNT = param.fadeInNT;
		this.fadeOutNT = param.fadeOutNT;
	}
}

