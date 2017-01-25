import { TimeInfo } from "./TimeInfo";

export class Smoke {
	_sprite: g.Sprite;
	x: number;
	y: number;

	vx: number;
	vy: number;
	scalev: number;
	alphav: number;
	rotv: number;

	timeInfo: TimeInfo

	get dead(): boolean {
		return this._sprite.opacity <= 0;
	}

	constructor(sprite: g.Sprite, vx: number, vy: number, scalev: number, alphav: number, rotv: number, timeInfo: TimeInfo) {
		this._sprite = sprite;
		this._sprite.hide();
		this.vx = vx;
		this.vy = vy;
		this.scalev = scalev;
		this.alphav = alphav;
		this.rotv = rotv;
		this.timeInfo = timeInfo;
	}

	reset(x: number, y: number): void {
		this.x = x;
		this.y = y;
		this._sprite.x = x;
		this._sprite.y = y;
		this._sprite.angle = 0;
		this._sprite.scale(0.0);
		this._sprite.opacity = 1;
		this._sprite.show();
		this._sprite.modified();
	}

	update(): void {
		this.x += this.vx * this.timeInfo.scale;
		this.y += this.vy * this.timeInfo.scale;

		this._sprite.scaleX += this.scalev * this.timeInfo.scale;
		this._sprite.scaleY += this.scalev * this.timeInfo.scale;
		this._sprite.angle += this.rotv * this.timeInfo.scale;
		this._sprite.opacity += this.alphav * this.timeInfo.scale;
		this._sprite.opacity = Math.min(Math.max(this._sprite.opacity, 0.0), 1.0);
		this._sprite.x = this.x - this._sprite.width / 2;
		this._sprite.y = this.y - this._sprite.height / 2;

		if (this.dead) {
			this._sprite.hide();
		}

		this._sprite.modified();
	}
}

export class SmokeEmitter {
	static VX = -20.0;
	static VY = 0.0;
	static SCALEV = 0.1;
	static ALPHAV = -0.05;
	static ROTV = -2;
	static MAX_SMOKE = 10;

	workingSmokes: Smoke[];
	sleepingSmokes: Smoke[];

	constructor(spriteParameterObject: g.SpriteParameterObject, timeInfo: TimeInfo) {
		this.workingSmokes = [];
		this.sleepingSmokes = [];
		for (let i = 0; i < SmokeEmitter.MAX_SMOKE; i++) {
			const smokeSprite = new g.Sprite(spriteParameterObject);
			this.sleepingSmokes.push(new Smoke(
				smokeSprite,
				SmokeEmitter.VX,
				SmokeEmitter.VY,
				SmokeEmitter.SCALEV,
				SmokeEmitter.ALPHAV,
				SmokeEmitter.ROTV,
				timeInfo
			));
			spriteParameterObject.scene.append(smokeSprite);
		}
	}

	emit(x: number, y: number): void {
		const smoke = this.sleepingSmokes.pop();
		if (smoke) {
			smoke.reset(x, y);
			this.workingSmokes.push(smoke);
		}
	}

	update(): void {
		const nextWorkingSmokes: Smoke[] = [];
		for (let i = 0; i < this.workingSmokes.length; i++) {
			const smoke = this.workingSmokes[i];
			smoke.update();
			if (smoke.dead) {
				this.sleepingSmokes.push(smoke);
			} else {
				nextWorkingSmokes.push(smoke);
			}
		}
		this.workingSmokes = nextWorkingSmokes;
	}
}
