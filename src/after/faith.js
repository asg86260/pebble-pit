// REVIEW faith-fill
// Faith: the ring over the shrine (the owner, 2026-11-13: "ring should fill
// as collect"). The prayers of the faithful fill it (`S.after.faith`, a
// share of the ring) at the rate the prayer ladder multiplies; full, it
// holds until a click on it collects it (`S.after.took`, the act's clock
// at the click): held a beat, unwound, empty a beat, and filled again from
// nothing. A collect adds to no
// count yet: faith is not a coin of the act's.
//
// The fill is a fact the sim steps, not a curve of the clock, so a rung
// landing mid-fill changes only how fast the arc grows from where it is, and
// the arc never jumps.
//
// Where the ring stands is worked out here, off the shrine's frame and the
// look standing under it (or rising: the ring rides the work as it is
// laid), so the drawing (render/after/stations.js), the click and the click
// cue (render/aftercues.js) all read one place.

import { S } from '../state.js';
import { P, AFTER_FAITH, AFTER_SHRINE_RING, AFTER_SHRINE_LOOKS } from '../config.js';
import { stationX0, groundOf } from './place.js';
import { prayerRung, prayerRaise, prayerMult } from './levels.js';
import { progressOf } from '../works.js';
import { secs } from './util.js';

const A = AFTER_FAITH, R = AFTER_SHRINE_RING;
const ease3 = k => k * k * (3 - 2 * k);
const clamp01 = v => Math.max(0, Math.min(1, v));
const rate = () => prayerMult() / A.fillS;
// The seconds from a collect to the prayers filling the ring again.
const EMPTIED = () => A.press + A.unwind + A.empty;

// Whether the ring is being emptied at act time `q`: from the click until it
// starts to fill again. No prayer sets out then.
export const emptyingAt = (q = S.after.t) => S.after.took != null && q >= S.after.took && q - S.after.took < EMPTIED();
export const faithFull = () => !!S.after && S.after.faith >= 1 && !emptyingAt();

export function stepFaith(c) {
  const a = S.after;
  if (emptyingAt()) return;
  a.faith = Math.min(1, a.faith + secs(c) * rate());
}

// The share of the ring drawn inked at act time `q`, now or a moment off
// (a prayer's landing, a trail's lag): the fill as it stands carried on at
// today's rate, and through a collect the held beat, the unwinding and the
// empty ring.
export function fillAt(q = S.after.t) {
  const a = S.after, took = a.took;
  if (took != null && q < took) return 1;
  if (took != null && q - took < EMPTIED()) {
    const e = q - took;
    if (e < A.press) return 1;
    if (e < A.press + A.unwind) return 1 - ease3((e - A.press) / A.unwind);
    return 0;
  }
  // refilling: from the empty's end, while the sim has not got there yet
  const from = took == null ? -Infinity : took + EMPTIED();
  return clamp01(a.faith + (q - Math.max(a.t, from)) * rate());
}

// The cells the ring floats over: the look standing, or as far as the next
// has been laid, whichever is higher.
export function lookTop() {
  const L = AFTER_SHRINE_LOOKS.tops, top = L.length - 1, n = Math.min(top, prayerRung()), w = prayerRaise();
  return w && n < top ? Math.max(L[n], L[n + 1] * progressOf(w)) : L[n];
}
// The ring's square in world px, at its true height.
export const ringBox = () => ({
  x: stationX0('shrine') + R.x * P, y: groundOf('shrine') - (lookTop() + R.gap + R.size) * P, w: R.size * P, h: R.size * P
});
export const overRing = (x, y) => { const b = ringBox(); return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h; };

// A click on the full ring collects it; anywhere else, or on a ring not yet
// full, it is no click of the ring's.
export function clickFaith(x, y) {
  if (!faithFull() || !overRing(x, y)) return false;
  S.after.faith = 0;
  S.after.took = S.after.t;
  return true;
}
