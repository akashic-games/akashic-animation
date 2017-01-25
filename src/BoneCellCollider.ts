import Collider = require("./Collider");
import Bone = require("./Bone");
import Posture = require("./Posture");
import BoxVolume = require("./BoxVolume");
import Actor = require("./Actor");
import AttrId = require("./AttrId");

/**
 * セル用コライダー
 *
 * セルの矩形から当たり判定用ボリュームを算出するコライダー
 * 初期化にはセルを含むPostureを与える
 */
class BoneCellCollider extends Collider {
	private _posture: Posture;
	private _volume: BoxVolume;

	constructor(name: string, aabbFirst: boolean) {
		super(aabbFirst);
		this.dirty = true;
		this.name = name;
	}

	onAttached(actor: Actor): void {
		actor.skeleton.bones.some((bone: Bone): boolean => {
			if (bone.name !== this.name) {
				return false;
			}
			this._posture = actor.skeleton.composedCaches[bone.arrayIndex];
			return true;
		});
	}

	getVolume(): BoxVolume {
		// TODO: 以下の処理の流れを定式化し、必要なoverrideのみ実装させるようにするべきか
		if (! this.enabled || ! this._posture.finalizedCell || ! this._posture.attrs[AttrId.visibility]) {
			return undefined;
		}
		if (this.dirty) {
			this.dirty = false;
			if (! this._volume) {
				this._volume = new BoxVolume();
			}
			var fCell = this._posture.finalizedCell;
			this._volume.aabbFirst = this.aabbFirst;
			this._volume.origin.x = 0;
			this._volume.origin.y = 0;
			this._volume.size.width = fCell.cell.size.width;
			this._volume.size.height = fCell.cell.size.height;
			this._volume.matrix = this._posture.m.multiplyNew(fCell.matrix);
			this._volume.dirty = true; // trigger to update aabb
		}
		return this._volume;
	}
}

export = BoneCellCollider;
