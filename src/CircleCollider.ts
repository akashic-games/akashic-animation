import {Actor} from "./Actor";
import {AttrId} from "./AttrId";
import {Bone} from "./Bone";
import {CircleVolume} from "./CircleVolume";
import {Collider} from "./Collider";
import {Posture} from "./Posture";

function getScaleFromMatrix(m: g.Matrix): [number, number] {
	const sx = Math.sqrt(m._matrix[0] * m._matrix[0] + m._matrix[1] * m._matrix[1]);
	const sy = Math.sqrt(m._matrix[2] * m._matrix[2] + m._matrix[3] * m._matrix[3]);
	return [sx, sy];
}

/**
 * 円形コライダー
 */
export class CircleCollider extends Collider {
	private _posture: Posture;
	private _volume: CircleVolume;
	private _scaleOption: string;

	/**
	 * `CircleCollider` のインスタンスを生成する
	 *
	 * @param name コライダー名。Actorにアタッチすると同じ名前のboneをActorから探索し参照する
	 * @param aabbFirst 衝突判定のさいAABBを優先することを示すフラグ
	 * @param scaleOption CircleColiderのがスケールの影響をどのようになつかうかを指定する。
	 *
	 * scaleOptionは次の値のいずれかを与える。
	 * - "min": スケールのX,Y成分を比較し小さい方を影響させる
	 * - "max": スケールのX,Y成分を比較し大きい方を影響させる
	 * - "none": スケールを影響させない
	 */
	constructor(name: string, aabbFirst: boolean, scaleOption: string) {
		super(aabbFirst);
		this.dirty = true;
		this.name = name;
		this._scaleOption = scaleOption;
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

	getVolume(): CircleVolume {
		// 2018/06/21: cellを持たないpostureでの当たり判定をサポート
		if (! this.enabled || ! this._posture.attrs[AttrId.visibility]) {
			return undefined;
		}

		if (! this.dirty) {
			return this._volume;
		}

		this.dirty = false;
		if (! this._volume) {
			this._volume = new CircleVolume();
		}

		this._volume.pos.x = this._posture.m._matrix[4];
		this._volume.pos.y = this._posture.m._matrix[5];

		// scale option に「スケールあり」が無いのは、楕円を許さないため
		if (this._scaleOption === "none") {
			this._volume.r = this._posture.attrs[AttrId.ccr];
		} else { // min or max
			// TODO: 大小を比較してからsqrtしたほうが高速
			const scales: [number, number] = getScaleFromMatrix(this._posture.m);
			this._volume.r = this._posture.attrs[AttrId.ccr];
			if (this._scaleOption === "min") {
				this._volume.r *= scales[0] < scales[1] ? scales[0] : scales[1];
			} else if (this._scaleOption === "max") {
				this._volume.r *= scales[0] > scales[1] ? scales[0] : scales[1];
			} else {
				console.warn("Unknown scale option: " + this._scaleOption);
			}
		}

		this._volume.aabbFirst = this.aabbFirst;
		this._volume.dirty = true; // trigger to update aabb

		return this._volume;
	}
}
