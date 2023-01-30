/*
 * トグルボタンパラメタオブジェクト
 */
export interface ToggleButtonParameterObject extends g.SpriteParameterObject {
	onoff: boolean;
}


/*
 * トグルボタン
 */
export class ToggleButton extends g.Sprite {
	onoff: boolean;
	highlight: g.FilledRect;
	toggled: g.Trigger<boolean>;

	constructor(param: ToggleButtonParameterObject) {
		super(param);
		this.onoff = param.onoff;

		this.highlight = new g.FilledRect({scene: param.scene, cssColor: "#208020", width: this.width, height: 2});
		this.highlight.y = this.height;
		this.append(this.highlight);

		this.toggled = new g.Trigger<boolean>();

		this.onPointDown.add(this.handlePointDown, this);

		if (param.onoff) {
			this.highlight.show();
		} else {
			this.highlight.hide();
		}
	}

	handlePointDown(e: g.PointDownEvent): void {
		this.toggle();
		this.toggled.fire(this.onoff);
	}

	setState(onoff: boolean): void {
		if (this.onoff !== onoff) {
			this.toggle();
			this.toggled.fire(this.onoff);
		}
	}

	private toggle(): void {
		this.onoff = !this.onoff;
		if (this.onoff) {
			this.highlight.show();
		} else {
			this.highlight.hide();
		}
		this.highlight.modified();
	}
}

/*
 * インジケータ
 */
export class Indicator extends g.FilledRect {
	progress: g.FilledRect;

	constructor(scene: g.Scene) {
		super({scene: scene, x: 0, y: scene.game.height - 2, cssColor: "#A0A0A0", width: scene.game.width, height: 2});

		this.progress = new g.FilledRect({scene: scene, x: 0, y: 0, cssColor: "#FF6060", width: 0, height: 2});
		this.append(this.progress);
	}

	set position(p: number) {
		this.progress.width = this.scene.game.width * p;
	}
}
