// A number on its way to its value.
//
// `S` changes in a step; nothing else in this game moves in a step, so a
// display never asks `S` directly for the number it draws. It asks here, by a
// name of its own, and gets back wherever that name's count has run to. The
// run is a fact about the screen, not the yard, so it lives here rather than
// on `S`: a save has no half-counted number in it, and a check that reads the
// yard reads the real count. Under less motion a count is its value.

import { TWEEN_MIN_MS, TWEEN_MAX_MS, TWEEN_BASE_MS, TWEEN_PER_UNIT_MS } from './config.js';
import { now } from './clock.js';
import { reducedMotion } from './prefs.js';

// one run to a name: where it started, where it is going and when it set out
const runs = new Map();

// The count `name` shows this frame, on its way to `to`. The first reading of
// a name is its value: a card that opened counting up from nothing would be
// announcing money that was always there.
export function shown(name, to, at = now()) {
  to = Number(to) || 0;
  if (reducedMotion()) { runs.delete(name); return to; }
  let r = runs.get(name);
  if (!r) { runs.set(name, r = { from: to, to, at, ms: 1 }); return to; }
  if (r.to !== to) {
    // set out again from wherever it had got to, so a count that changes twice
    // in a second runs on rather than jumping back to start over
    r.from = shownOf(r, at);
    r.to = to;
    r.at = at;
    r.ms = Math.max(TWEEN_MIN_MS, Math.min(TWEEN_MAX_MS, TWEEN_BASE_MS + Math.abs(to - r.from) * TWEEN_PER_UNIT_MS));
  }
  return shownOf(r, at);
}

function shownOf(r, at) {
  const t = Math.max(0, Math.min(1, (at - r.at) / r.ms));
  const ease = 1 - Math.pow(1 - t, 3);                  // out-cubic
  return r.from + (r.to - r.from) * ease;
}

// Every number is its value from here on. A restored save, a fresh game and a
// seeded run all call this: a reading that ran from the old yard's count to
// the new one would be a story that never happened.
export function snapShown() { runs.clear(); }
