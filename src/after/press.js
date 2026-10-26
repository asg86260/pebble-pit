// The workshop and the printing press: what the union makes to spend
// (DESIGN.md, "Acts 3 and 4", act 3, "The chain: trees to signs and posters"
// and "How support spreads"). Placeholder drawing.
//
// The workshop joins timber into a sign (two at once with its second bench);
// a carrier takes it out into the crowd and plants it where the files are
// palest (call 13, settled: the carriers choose), inking rims round it to the
// full. The press prints paper into posters, a stack at a time; pasters carry
// the stacks out and paste them on the fence at the crowd's front, inking
// down the file to half (POSTER_CAP). Signs are timber alone and posters
// paper alone (call 11, settled: ink is cut). Every sign and stack is a
// body's load (bodies.js). A sign or poster put up after its card's upgrade
// is a bigger one and reaches further (`big`); those already up stay as they
// were.
//
// The signs planted are `S.after.signs` ({ id, f, r, askew, pull, big }) and
// the posters pasted `S.after.posters` ({ id, slot, age, torn, big }).

import { S } from '../state.js';
import { CROWD_FILES, AFTER_SIGN_TIMBER, AFTER_POSTER_PAPER, AFTER_POSTER_LIFE_S,
         AFTER_POSTER_FADE_S, AFTER_SIGN_GAP } from '../config.js';
import { arand, secs, nextId } from './util.js';
import { stackOf, benchSigns, bigSigns, bigPosters } from './levels.js';
import { wallSlots } from './place.js';
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

// One stack off the press: false while paper is short.
export function printStack() {
  const st = S.after.stock;
  if (st.paper < AFTER_POSTER_PAPER) return false;
  st.paper -= AFTER_POSTER_PAPER;
  st.posters += stackOf();
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

// A free slot on the fence for a poster, the nearest slot `near` first, past
// any in `skip` (another paster's): null when the fence is papered.
export function freeSlot(near = 0, skip = null) {
  const taken = new Set(S.after.posters.map(p => p.slot));
  if (skip) for (const k of skip) taken.add(k);
  const n = wallSlots();
  let best = null;
  for (let s = 0; s < n; s++) if (!taken.has(s) && (best == null || Math.abs(s - near) < Math.abs(best - near))) best = s;
  return best;
}
export const pastePoster = slot => { S.after.posters.push({ id: nextId(), slot, age: 0, torn: null, big: bigPosters() }); };

// One frame of what is out in the crowd: posters weathering and, torn, their
// strips fading off before the poster is gone.
export function stepPress(c) {
  const a = S.after, dt = secs(c);
  for (const p of a.posters) {
    p.age += dt;
    if (p.torn == null && p.age >= AFTER_POSTER_LIFE_S) p.torn = a.t;
  }
  a.posters = a.posters.filter(p => p.torn == null || a.t - p.torn < AFTER_POSTER_FADE_S);
}
