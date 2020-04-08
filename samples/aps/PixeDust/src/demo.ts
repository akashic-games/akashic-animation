import * as asa from "@akashic-extension/akashic-animation";
import { BasicEmitterParameterObject } from "@akashic-extension/akashic-animation/lib/aps";

interface BasicEmitterEParameterObject extends g.EParameterObject {
	surface: g.Surface;
	particleSystem: asa.aps.ParticleSystem;
}

class BasicEmitterE extends g.E {
	surface: g.Surface;
	particleSystem: asa.aps.ParticleSystem;

	constructor(param: BasicEmitterEParameterObject) {
		super(param);
		this.surface = param.surface;
		this.particleSystem = param.particleSystem;
		this.particleSystem.start();
		this.update.handle(() => {
			this.particleSystem.update(1 / g.game.fps);
			this.modified();
		});
	}

	renderSelf(renderer: g.Renderer, camera?: g.Camera): boolean {
		const w2 = this.surface.width / 2;
		const h2 = this.surface.height / 2;

		renderer.save();

		this.particleSystem.traverse((emitter) => {
			for (let i = 0, particles = emitter.particles; i < particles.length; i++) {
				const p = particles[i];
				const c = Math.cos(p.rz);
				const s = Math.sin(p.rz);
				renderer.setTransform([
					c  * p.sx, s * p.sx,
					-s * p.sy, c * p.sy,
					c * (-p.sx * w2) - s * (-p.sy * h2) + p.tx, s * (-p.sx * w2) + c * (-p.sy * h2) + p.ty
				]);
				renderer.setOpacity(p.alpha);
				renderer.drawImage(this.surface, 0, 0, this.surface.width, this.surface.height, 0, 0);
			}
		});

		renderer.restore();

		return true;
	}
}

interface BouncingEmitterParameterObject extends BasicEmitterParameterObject {
}

class BouncingEmitter extends asa.aps.BasicEmitter {
	constructor(param: BouncingEmitterParameterObject) {
		super(param);
	}

	protected updateParticle(p: asa.aps.BasicParticle, dt: number): void {
		super.updateParticle(p, dt);
		if (p.tx < 0) {
			p.tx = 0;
			p.vx = Math.abs(p.vx);
			p.ax = Math.abs(p.ax);
		} else if (p.tx >= g.game.width) {
			p.tx = g.game.width - 1;
			p.vx = -Math.abs(p.vx);
			p.ax = -Math.abs(p.ax);
		}
		if (p.ty < 0) {
			p.ty = 0;
			p.vy = Math.abs(p.vy);
			p.ay = Math.abs(p.ay);
		} else if (p.ty >= g.game.height) {
			p.ty = g.game.height - 1;
			p.vy = -Math.abs(p.vy);
			p.ay = -Math.abs(p.ay);
		}
	}
}

class DemoScene extends g.Scene {
	basicParticleE: BasicEmitterE;

	constructor(param: g.SceneParameterObject) {
		super(param);
		this.loaded.add(this.onLoaded, this);
	}

	onLoaded() {
		this.append(new g.FilledRect({
			scene: this,
			width: g.game.width,
			height: g.game.height,
			cssColor: "blue"
		}));

		const planeBasicEmitter = new asa.aps.BasicEmitter({
			gx: 0,
			gy: 450,
			interval: 1 / g.game.fps,
			activePeriod: -1,
			delayEmit: 0,
			numParticlesPerEmit: 10,
			maxParticles: 10000,
			children: [],
			randomFunc: () => Math.random(),
			initParam: {
				lifespan: [3],
				angle: [0, Math.PI * 2],
				tx: [-8, 8],
				ty: [-8, 8],
				v: [128],
				a: [0],
				rz: [0, Math.PI * 2],
				sx: [0.75, 1],
				sy: [0.75, 1],
				alpha: [0.2, 1]
			}
		});

		const bounsingEmitter = new BouncingEmitter({
			gx: 0,
			gy: 0,
			interval: 1 / g.game.fps,
			activePeriod: -1,
			delayEmit: 0,
			numParticlesPerEmit: 1,
			maxParticles: 1,
			children: [planeBasicEmitter],
			randomFunc: () => Math.random(),
			initParam: {
				lifespan: [60 * 60 * 24],
				angle: [0, Math.PI * 2],
				tx: [0],
				ty: [0],
				v: [256],
				a: [0],
				rz: [0],
				sx: [0],
				sy: [0],
				alpha: [0]
			}
		});

		const particleSystem = new asa.aps.ParticleSystem();
		particleSystem.addEmitter(bounsingEmitter);

		this.basicParticleE = new BasicEmitterE({
			scene: this,
			particleSystem: particleSystem,
			surface: (this.assets["pSmoke"] as g.ImageAsset).asSurface()
		});
		this.basicParticleE.particleSystem.moveTo(g.game.width / 2, g.game.height / 2);
		this.append(this.basicParticleE);

		let maxParticleCount = 0;
		this.update.add(() => {
			if (planeBasicEmitter.particles.length > maxParticleCount) {
				maxParticleCount = planeBasicEmitter.particles.length;
				console.log(maxParticleCount);
			}
		});
	}
}

export function createScene(snapshot: any) {
	return new DemoScene({
		game: g.game,
		assetIds: ["pSmoke"]
	});
}
