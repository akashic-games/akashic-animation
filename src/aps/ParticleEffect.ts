import {ParticleSystem} from "./ParticleSystem";

export interface ParticleEffectParameterObject extends g.EParameterObject {
	particleSystem: ParticleSystem;
}

/**
 * particle system を描画するE。
 *
 * Emitter.userData.image に設定された ImageAsset 名の画像で particle を描画します。
 */
export class ParticleEffect extends g.E {
	particleSystem: ParticleSystem;
	surfaces: {[key: string]: g.Surface};

	constructor(param: ParticleEffectParameterObject) {
		super(param);
		this.surfaces = {};
		this.particleSystem = param.particleSystem;
		this.particleSystem.traverse((e) => {
			const imageName = e.userData.imageName;
			this.surfaces[imageName] = (this.scene.assets[imageName] as g.ImageAsset).asSurface();
		});
	}

	renderSelf(renderer: g.Renderer, camera?: g.Camera): boolean {
		const dt = 1.0 / g.game.fps;
		this.particleSystem.update(dt);

		renderer.save();

		this.particleSystem.traverse((e) => {
			const imageName = e.userData.imageName;
			const surface = this.surfaces[imageName];
			e.particles.forEach((p) => {
				const cos = Math.cos(p.rz);
				const sin = Math.sin(p.rz);
				const a = cos * p.sx;
				const b = sin * p.sx;
				const c = sin * p.sy;
				const d = cos * p.sy;
				const w = surface.width / 2;
				const h = surface.height / 2;
				renderer.save();
				renderer.transform([a, b, -c, d, p.tx, p.ty]);
				renderer.transform([1, 0, 0, 1, -w, -h]);
				renderer.drawImage(surface, 0, 0, surface.width, surface.height, 0, 0);
				renderer.restore();
			});
		});

		renderer.restore();

		return true;
	}
}