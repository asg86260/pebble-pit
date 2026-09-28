// Statuses: what the fighters leave on the serpent, and on each other
// (docs/wave-party.md, "Statuses"; docs/serpent-classes.md section 0).
//
// On the serpent a status is on the whole snake, never a length of it:
// `S.statuses[key] = { until, k }`, `until` on the game's clock and `k` its
// strength. Laying one that is already on keeps the longer and the stronger
// of the two, so a status refreshes and never stacks -- except Bleeding,
// which is kept a source at a time (`src`, by the hit that cut it): each
// fighter's bleed refreshes itself and ticks under its own hit, and two
// bleeders' add up. The stun is not one of these: it is the built stun
// (`S.serpentStun`), with its grace.
//
//   bleed     ticks: `k` is its damage a second (the one status whose k is
//             not a share), struck through the Swordsman's hit
//   exposed   `k` more from everything
//   held      no heal while it lasts (the Hexer's capstone)
//   weakened  the heal cut by `k`
//
// On a fighter the two buffs live on the body, as fields no save keeps:
// `inspiredUntil` / `inspiredK` (its hits `k` more) and `hastedUntil` (it
// swings HASTE more often).
//
// Every amp is added up and multiplied in once, capped at AMP_MAX; every heal
// cut likewise, capped at HEAL_CUT_MAX. Read in `strike` and `healNow`.

import { S } from '../state.js';
import { DOT_TICK_S, EXPOSED_AMP, AMP_MAX, HEAL_CUT_MAX, HASTE } from '../config.js';
import { now } from '../clock.js';
import { coilAt } from './place.js';
import { strike } from './serpent.js';

export const STATUSES = ['bleed', 'exposed', 'held', 'weakened'];

const on = () => S.statuses || (S.statuses = {});

// Lay `key` at strength `k` for `s` seconds; `at` is where it was laid (a
// segment), for the drawing and for where a bleed's ticks land; `from` is a
// bleed's source, the hit that cut it.
export function lay(key, k, s, at = null, from = 'sword') {
  const t = now(), until = t + s * 1000;
  if (key === 'bleed') return bleed(k, until, at, from, t);
  const was = on()[key];
  if (was && t < was.until) {
    was.until = Math.max(was.until, until);
    was.k = Math.max(was.k, k);
    if (at != null) was.seg = at;
    return was;
  }
  const e = { until, k, at: t, seg: at };
  on()[key] = e;
  return e;
}
// Bleeding, a source at a time: the whole status's `until` the latest of its
// sources' and its `k` their sum, so what reads it reads the lot.
function bleed(k, until, at, from, t) {
  let e = on().bleed;
  if (!e || !(t < e.until)) e = on().bleed = { until, k: 0, at: t, seg: at, src: {} };
  const was = e.src[from];
  if (was && t < was.until) {
    was.until = Math.max(was.until, until);
    was.k = Math.max(was.k, k);
    if (at != null) was.seg = at;
  } else e.src[from] = { until, k, seg: at, tickAt: t + DOT_TICK_S * 1000 };
  if (at != null) e.seg = at;
  sumBleed(e);
  return e;
}
function sumBleed(e) {
  const live = Object.values(e.src);
  e.k = live.reduce((n, b) => n + b.k, 0);
  e.until = live.reduce((n, b) => Math.max(n, b.until), 0);
}
export const has = key => { const e = on()[key]; return !!e && now() < e.until; };
export const level = key => (has(key) ? on()[key].k : 0);
// Everything gone at once: a phase that breaks takes what was laid on it.
export const clearStatuses = () => { S.statuses = {}; };

// What a hit is raised by: Exposed on everything, and the striker's own
// Inspired. Added, capped, and handed back as the one multiplier.
export function ampOf(tick, by) {
  let a = level('exposed');
  if (by) a += inspiredK(by);
  return 1 + Math.min(AMP_MAX, a);
}
// The heal's share left after the cuts: Weakened, capped.
export const healLeft = () => 1 - Math.min(HEAL_CUT_MAX, level('weakened'));

// A fighter's buffs.
export const inspiredK = w => (w && now() < (w.inspiredUntil || 0) ? w.inspiredK || 0 : 0);
export const hasted = w => !!w && now() < (w.hastedUntil || 0);
// Inspired for `s` seconds at `k`: a fresher or stronger song keeps the better.
export function inspire(w, k, s) {
  const t = now(), until = t + s * 1000;
  if (!(t < (w.inspiredUntil || 0))) { w.inspiredUntil = until; w.inspiredK = k; return; }
  w.inspiredUntil = Math.max(w.inspiredUntil, until);
  w.inspiredK = Math.max(w.inspiredK || 0, k);
}
export const haste = (w, s) => { w.hastedUntil = Math.max(w.hastedUntil || 0, now() + s * 1000); };
// The seconds between two attacks, Hasted or not.
export const tempo = (w, every) => (hasted(w) ? every / (1 + HASTE) : every);

// One frame: a status run out is gone, and a bleed ticks where it was cut.
// A tick is not a blow: it bites nothing and never stuns.
export function stepStatuses(c) {
  const all = on(), t = c.now;
  const e = all.bleed;
  if (e && S.snatched) {
    for (const [from, b] of Object.entries(e.src)) {
      while (b.tickAt <= t && b.tickAt <= b.until) {
        const p = coilAt(b.seg ?? 0, t);
        strike(from, b.k * DOT_TICK_S, p.x, p.y, b, 0, { tick: true });
        b.tickAt += DOT_TICK_S * 1000;
      }
      if (!(t < b.until)) delete e.src[from];
    }
    sumBleed(e);
  }
  for (const key of Object.keys(all)) if (!(t < all[key].until)) delete all[key];
}
