// The workshop and the printing press: what the union makes to spend
// (DESIGN.md, "Acts 3 and 4", act 3, "The chain: trees to signs and posters"
// and "How support spreads"). Placeholder drawing.
//
// The workshop joins timber into a sign and letters it with ink; a carrier
// takes it out into the crowd and plants it (close, SIGN_REACH, inking rims
// to the full). The press prints paper with ink into posters, a stack at a
// time; pasters carry the stacks out and paste them on the fence at the
// crowd's front (wide, POSTER_REACH, to half: POSTER_CAP). Both letter from
// the one well. Every sign and stack is a body's load (bodies.js). Where a
// sign goes is the carriers' choice for now (call 13 open: a picket mark,
// recommended, is a seam here -- `signSpot`).
//
// The signs planted are `S.after.signs` ({ id, f, r, askew, pull }) and the
// posters pasted `S.after.posters` ({ id, slot, age, torn }).

import { S } from '../state.js';
import { CROWD_FILES, CROWD_NEAR, AFTER_SIGN_TIMBER, AFTER_SIGN_INK, AFTER_POSTER_PAPER, AFTER_POSTER_INK,
         AFTER_POSTER_LIFE_S, AFTER_POSTER_FADE_S, AFTER_SIGN_GAP, SIGN_REACH } from '../config.js';
import { arand, secs, nextId } from './util.js';
import { stackOf } from './levels.js';
import { wallSlots } from './place.js';
import { crowdRanks, inkAround } from './union.js';

// One sign out of the workshop: false while timber or ink is short.
export function joinSign() {
  const a = S.after, st = a.stock;
  if (st.timber < AFTER_SIGN_TIMBER || a.ink < AFTER_SIGN_INK) return false;
  st.timber -= AFTER_SIGN_TIMBER; a.ink -= AFTER_SIGN_INK;
  st.signs += 1;
  return true;
}

// One stack off the press: false while paper or ink is short.
export function printStack() {
  const a = S.after, st = a.stock;
  if (st.paper < AFTER_POSTER_PAPER || a.ink < AFTER_POSTER_INK) return false;
  st.paper -= AFTER_POSTER_PAPER; a.ink -= AFTER_POSTER_INK;
  st.posters += stackOf();
  return true;
}

// Where the next sign goes: of a handful of spots in the crowd's near ranks
// and the first far ones, the one with the least ink round it, away from the
// signs already standing. Null when no spot is free.
export function signSpot() {
  const a = S.after;
  const ranks = Math.min(crowdRanks(), CROWD_NEAR + SIGN_REACH);
  let best = null, bestInk = Infinity;
  for (let k = 0; k < 12; k++) {
    const f = Math.floor(arand() * CROWD_FILES), r = Math.floor(arand() * ranks);
    if (a.signs.some(s => Math.abs(s.f - f) < AFTER_SIGN_GAP && Math.abs(s.r - r) < AFTER_SIGN_GAP)) continue;
    const ink = inkAround(f, r);
    if (ink < bestInk) { bestInk = ink; best = { f, r }; }
  }
  return best;
}
export const plantSign = (f, r) => { S.after.signs.push({ id: nextId(), f, r, askew: false, pull: null }); };

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
export const pastePoster = slot => { S.after.posters.push({ id: nextId(), slot, age: 0, torn: null }); };

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
