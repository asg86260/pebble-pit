// Where hell is (DESIGN.md, "Acts 3 and 4", act 4, "The place: a run of
// chambers down to the cage room").
//
// Under the deep's floor, so the way down -- the pit, the abyss, the deep and
// through its floor -- arrives somewhere real and every position in hell is an
// ordinary world position, the deep's rule (deep/place.js) carried one place
// further down. The run of chambers, each lower and further right than the
// last, is laid out inside this extent when it is built (chambers.js); the
// scaffold stands the extent alone.

import { P, HELL_GAP, HELL_H, HELL_W, HELL_FLOOR_MARGIN, HELL_OPEN_AT } from '../config.js';
import { deepFloor, deepX0 } from '../deep/place.js';

const snap = v => Math.round(v / P) * P;

export const hellTop = () => snap(deepFloor() + HELL_GAP);
export const hellFloor = () => hellTop() + HELL_H;
export const hellX0 = () => deepX0();
export const hellX1 = () => hellX0() + HELL_W;
export const hellRect = () => ({ x: hellX0(), y: hellTop(), w: HELL_W, h: HELL_H });
export const inHell = (x, y) => y >= hellTop() && y <= hellFloor() && x >= hellX0() && x <= hellX1();
// Where across it the camera opens: over the landing, where the road arrives.
export const hellOpenX = () => snap(hellX0() + HELL_OPEN_AT * HELL_W);
// The place as the camera reads it (acts.js, `PLACES`).
export const HELL_PLACE = { x0: hellX0, x1: hellX1, top: hellTop, floor: hellFloor, open: hellOpenX,
                            margin: HELL_FLOOR_MARGIN, h: HELL_H };
