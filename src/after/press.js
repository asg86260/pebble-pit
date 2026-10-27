// The workshop: what the union makes to spend (DESIGN.md, "Acts 3 and 4",
// act 3, "The chain: trees to signs" and "How support spreads").
// Placeholder drawing.
//
// The workshop joins timber into a sign (two at once with its second bench);
// a carrier takes it out into the crowd and plants it where the files are
// palest (call 13, settled: the carriers choose), inking rims round it to the
// full. Signs are timber alone (call 11, settled: ink is cut). Every sign is
// a body's load (bodies.js). A sign put up after its card's upgrade is a
// bigger one and reaches further (`big`); those already up stay as they
// were.
//
// The signs planted are `S.after.signs` ({ id, f, r, askew, pull, big }).

import { S } from '../state.js';
import { CROWD_FILES, AFTER_SIGN_TIMBER, AFTER_SIGN_GAP } from '../config.js';
import { arand, nextId } from './util.js';
import { benchSigns, bigSigns } from './levels.js';
import { crowdRanks, inkAround } from './union.js';

// A joining at the workshop, a sign a bench: false while timber is short of one.
export function joinSign() {
  const st = S.after.stock;
  const n = Math.min(benchSigns(), Math.floor(st.timber / AFTER_SIGN_TIMBER));
  if (n < 1) return false;
  st.timber -= AFTER_SIGN_TIMBER * n;
  st.signs += n;
  return true;
}


// Where the next sign goes: of a handful of spots anywhere in the crowd, the
// one with the least ink round it (a soul walked out counts as inked: an
// empty spot wins nobody), away from the signs already standing. Null when
// no spot is free.
export function signSpot() {
  const a = S.after;
  const ranks = crowdRanks();
  let best = null, bestInk = Infinity;
  for (let k = 0; k < 12; k++) {
    const f = Math.floor(arand() * CROWD_FILES), r = Math.floor(arand() * ranks);
    if (a.signs.some(s => Math.abs(s.f - f) < AFTER_SIGN_GAP && Math.abs(s.r - r) < AFTER_SIGN_GAP)) continue;
    const ink = inkAround(f, r);
    if (ink < bestInk) { bestInk = ink; best = { f, r }; }
  }
  return best;
}
export const plantSign = (f, r) => { S.after.signs.push({ id: nextId(), f, r, askew: false, pull: null, big: bigSigns() }); };
