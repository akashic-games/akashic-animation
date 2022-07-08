import type {Actor} from "./Actor";
import {AttrId} from "./AttrId";
import type {Bone} from "./Bone";
import {BoxVolume} from "./BoxVolume";
import {Collider} from "./Collider";
import type {Posture} from "./Posture";

/**
 * セル用コライダー
 *
 * セルの矩形から当たり判定用ボリュームを算出するコライダー
 * 初期化にはセルを含むPostureを与える
 */
export class BoneCellCollider extends Collider {
	private _posture: Posture;
	private _volume: BoxVolume;

	private static _centeringMatrix: g.Matrix;

	constructor(name: string, aabbFirst: boolean) {
		super(aabbFirst);
		this.dirty = true;
		this.name = name;

		if (! BoneCellCollider._centeringMatrix) {
			const m = new g.PlainMatrix();
			m._matrix[4] = -0.5;
			m._matrix[5] = -0.5;
			BoneCellCollider._centeringMatrix = m;
		}
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
		if (! this.enabled || ! this._posture.attrs[AttrId.visibility]) {
			return undefined;
		}

		if (! this.dirty) {
			return this._volume;
		}

		this.dirty = false;
		if (! this._volume) {
			this._volume = new BoxVolume();
		}

		// 2018/06/21: cellを持たないpostureでの当たり判定をサポート
		const fCell = this._posture.finalizedCell;
		this._volume.aabbFirst = this.aabbFirst;
		this._volume.origin.x = 0;
		this._volume.origin.y = 0;
		this._volume.size.width = fCell ? fCell.cell.size.width : 1.0;
		this._volume.size.height = fCell ? fCell.cell.size.height : 1.0;
		this._volume.matrix = this._posture.m.multiplyNew(fCell ? fCell.matrix : BoneCellCollider._centeringMatrix);
		this._volume.dirty = true; // trigger to update aabb

		return this._volume;
	}
}
