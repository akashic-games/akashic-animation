import {BoxVolume} from "./BoxVolume";
import {CellAttachment} from "./CellAttachment";
import {Collider} from "./Collider";

function multiply(m1: number[], m2: number[]): void {
	const m10 = m1[0];
	const m11 = m1[1];
	const m12 = m1[2];
	const m13 = m1[3];
	m1[0] = m10 * m2[0] + m12 * m2[1];
	m1[1] = m11 * m2[0] + m13 * m2[1];
	m1[2] = m10 * m2[2] + m12 * m2[3];
	m1[3] = m11 * m2[2] + m13 * m2[3];
	m1[4] = m10 * m2[4] + m12 * m2[5] + m1[4];
	m1[5] = m11 * m2[4] + m13 * m2[5] + m1[5];
}

/**
 * CellAttachmentをアタリ判定に用いるコライダー
 */
export class CellAttachmentCollider extends Collider {
	cellAttachment: CellAttachment;
	private _volume: BoxVolume;

	constructor(cellAttachment: CellAttachment, name: string, aabbFirst: boolean) {
		super(aabbFirst);
		this.name = name;
		this.dirty = true;
		this.cellAttachment = cellAttachment;
	}

	getVolume(): BoxVolume {
		if (! this.enabled || ! this.cellAttachment || ! this.cellAttachment.posture) {
			return undefined;
		}

		if (! this.dirty) {
			return this._volume;
		}

		this.dirty = false;
		if (! this._volume) {
			// 以下は静的な値であるとみなす
			this._volume = new BoxVolume();
			this._volume.matrix = new g.PlainMatrix();
			this._volume.origin.x = 0;
			this._volume.origin.y = 0;
			this._volume.size.width = this.cellAttachment.cell.size.width;
			this._volume.size.height = this.cellAttachment.cell.size.height;
		}

		this._volume.aabbFirst = this.aabbFirst;

		const m: number[] = [].concat(this.cellAttachment.posture.m._matrix);
		if (this.cellAttachment.matrix) {
			multiply(m, this.cellAttachment.matrix._matrix);
		}
		if (this.cellAttachment.pivotTransform) {
			multiply(m, this.cellAttachment.pivotTransform);
		}

		// this.cellAttachment.mirrorTransform は鏡像の行列であり、
		// 矩形の位置・形を変えない。当たり判定に際しては影響を持たない
		// ので `m` に対して乗算しない。

		this._volume.matrix._matrix = <[number, number, number, number, number, number]>m;
		this._volume.dirty = true; // trigger to update aabb

		return this._volume;
	}
}
