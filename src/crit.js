// Crits: one rule, in one place, called wherever work happens.
//
// A crit is a unit of work that counts for several. An unbounded job (a swing,
// a stoop, a trip) ADDS, so the unit is worth `mult`; a bounded job (a dig, a
// bolt at the star) PULLS FORWARD several of the units already owed, so the
// total never moves. See "Crits" in DESIGN.md. Nothing here knows which kind
// a station is: it hands back a multiplier and the station decides.
//
// Two ladders reach every station: how often (`chance`) and how much (`mult`),
// on the bench (the crit rows in upgrades.js), levels `S.critChanceLevel` /
// `S.critMultLevel`.

import { S } from './state.js';
import { rand } from './rng.js';
import {
  rungValue,
} from './config.js';

// Both off their lists (config/rungs.js), the chance written as a percent. A
// level past the list reads as the top.
export const critChance = (lvl = S.critChanceLevel) => rungValue('critchance', lvl) / 100;

// Whole units off its list, so no rung repeats a value and a row never reads
// "4 -> 4". A saved level past the top reads as the top.
export const critMult = (lvl = S.critMultLevel) => rungValue('critmult', lvl);

// The expected multiplier on a unit of work over many swings: 1 + chance*(mult - 1).
export const critEV = () => 1 + critChance() * (critMult() - 1);

// A check forces the roll: null rolls for real, true is always a crit, false
// never one. Play never touches this (the `__crit` handle in hooks.js).
let forced = null;
export const forceCrit = v => { forced = v; };

// The one roll: `mult` on a crit, 1 otherwise. `bonus` is extra chance in
// points for a body under a bracing tonic, which raises this one body's chance
// without touching the bench ladder everybody shares.
export function critRoll(bonus = 0) {
  const hit = forced != null ? forced : rand() < critChance() + bonus;
  return hit ? critMult() : 1;
}
