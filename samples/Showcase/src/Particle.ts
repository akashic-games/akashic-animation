
class Particle {
	static running = false;

	scene: g.Scene;
	e: g.FilledRect;
	x: number;
	y: number;
	vx: number;
	vy: number;
	avz: number;
	collidable: boolean;

	constructor(scene: g.Scene) {
		this.scene = scene;
		this.e = new g.FilledRect({scene: scene, cssColor: "#FF0000", width: 8, height: 8});
		this.scene.append(this.e);
		this.reset();
	}

	reset(): void {
		this.x = this.scene.game.width * g.game.random.generate();
		this.y = -8;
		this.vx = ((g.game.random.generate() - 0.5) * 2) * 5;
		this.vy = 0;
		this.avz = 0;
		this.collidable = true;

		this.e.x = this.x;
		this.e.y = this.y;
		this.e.cssColor = "#FF0000";
		this.e.angle = 0;
	}

	collide(): void {
		this.vy *= -0.75;
		this.avz = (g.game.random.generate() * 2 - 1) * 20;
		this.collidable = false;
		this.e.cssColor = "#7C5684";
	}

	update(): void {
		if (!Particle.running && this.y === -8) {
			return;
		}

		var acc = 0.4;
		this.vy += acc;
		this.x += this.vx;
		this.y += this.vy;

		if (this.x < 0 || this.x > this.scene.game.width || this.y > this.scene.game.height) {
			this.reset();
		} else {
			this.e.x = this.x;
			this.e.y = this.y;
			this.e.angle += this.avz;
			this.e.modified();
		}
	}
}

export = Particle;
