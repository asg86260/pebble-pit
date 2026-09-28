// Statuses: what the fighters leave on the serpent, and on each other
// (docs/wave-party.md, "Statuses"; docs/serpent-classes.md section 0).
//
// On the serpent a status is on the whole snake, never a length of it:
// `S.statuses[key] = { until, k }`, `until` on the game's clock and `k` its
// strength. Laying one that is already on keeps the longer and the stronger
// of the two, so a status refreshes and never stacks. The stun is not one of
// these: it is the built stun (`S.serpentStun`), with its grace.
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
// segment), for the drawing and for where a bleed's ticks land.
export function lay(key, k, s, at = null) {
  const t = now(), until = t + s * 1000;
  const was = on()[key];
  if (was && t < was.until) {
    was.until = Math.max(was.until, until);
    was.k = Math.max(was.k, k);
    if (at != null) was.seg = at;
    return was;
  }
  const e = { until, k, at: t, seg: at };
  if (key === 'bleed') e.tickAt = t + DOT_TICK_S * 1000;
  on()[key] = e;
  return e;
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
  const b = all.bleed;
  if (b && S.snatched) {
    while (b.tickAt <= t && b.tickAt <= b.until) {
      const p = coilAt(b.seg ?? 0, t);
      strike('sword', b.k * DOT_TICK_S, p.x, p.y, b, 0, { tick: true });
      b.tickAt += DOT_TICK_S * 1000;
    }
  }
  for (const key of Object.keys(all)) if (!(t < all[key].until)) delete all[key];
}
