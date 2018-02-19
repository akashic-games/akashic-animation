import Attachment = require("./Attachment");
import FinalizedCell = require("./FinalizedCell");
import AttrId = require("./AttrId");
import {AnimationHandlerParam} from "./AnimationHandlerParams";
import {CellValue} from "./AnimeParams";

// 動的ボーン
// Boneが静的で様々なシステムから参照されるのに対し、
// Postureは実行時に定まるボーンの情報を扱う
// 主なものはAnimationの計算結果
//
class Posture {
	private static _costbl: number[] = [];

	attrs: any[] = [];

	m: g.Matrix;

	// 以下、アニメーション結果から直接決まらないが、実行時にボーンに与えたい情報
	attachments: Attachment[];
	finalizedCell: FinalizedCell;
	index: number; // Array.prototype.sortを安定にするための追加情報

	_trigger: g.Trigger<AnimationHandlerParam>;

	constructor() {
		this.m = new g.PlainMatrix();
		this.attrs[AttrId.cv] = new CellValue();
		this.attachments = [];

		if (Posture._costbl.length === 0) {
			// [0, 90] degree の範囲をテーブル化
			for (let i = 0; i <= 0x4000; i++) {
				const rad = (Math.PI / 2) * (i / 0x4000);
				Posture._costbl.push(Math.cos(rad));
			}
		}
	}

	reset(): void {
		const attrs = this.attrs;
		attrs[AttrId.tx]    = attrs[AttrId.ty]   = 0;
		attrs[AttrId.rz]    = 0;
		attrs[AttrId.sx]    = attrs[AttrId.sy]   = 1;
		attrs[AttrId.lsx]    = attrs[AttrId.lsy]   = 1;
		attrs[AttrId.alpha] = 1;
		attrs[AttrId.tu]    = attrs[AttrId.tv]   = 0;
		attrs[AttrId.pvtx]  = attrs[AttrId.pvty] = 0;
		attrs[AttrId.prio]  = 0;
		attrs[AttrId.visibility] = true;
		attrs[AttrId.cv]    = undefined;
		attrs[AttrId.ccr]   = 0;
		attrs[AttrId.flipH] = false;
		attrs[AttrId.flipV] = false;

		this.m.reset();
		// アニメーション以外の処理で与えられた値はクリアしない
	}

	quickcos(rz_in: number): number {
		let rz = (rz_in * 65536 / 360) | 0; // JSにrzが整数であると伝える。僅かに性能が良くなる気がする、程度だが
		if (rz >= 0) {
			 rz =             rz & 0xFFFF;
		} else {
			 rz = 0x10000 - (-rz & 0xFFFF);
		}
		if (rz < 0x4000) {
			return Posture._costbl[rz];
		} else if (rz < 0x8000) {
			return -Posture._costbl[0x4000 - (rz - 0x4000)];
		} else if (rz < 0xC000) {
			return -Posture._costbl[rz - 0x8000];
		} else {
			return Posture._costbl[0x4000 - (rz - 0xC000)];
		}
	}

	updateMatrix(): void {
		const attrs = this.attrs;
		const _cos = this.quickcos(attrs[AttrId.rz]);
		const _sin = this.quickcos(attrs[AttrId.rz] - 90);

		const m = this.m._matrix;
		m[0] =  _cos * attrs[AttrId.sx];
		m[1] =  _sin * attrs[AttrId.sx];
		m[2] = -_sin * attrs[AttrId.sy];
		m[3] =  _cos * attrs[AttrId.sy];
		m[4] = attrs[AttrId.tx];
		m[5] = attrs[AttrId.ty];
	}
}

export = Posture;
