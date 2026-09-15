// Crits: one rule, in one place, called wherever work happens.
//
// A crit is a unit of work that counts for several. What it does depends on the
// job -- an unbounded job (your swing, a rockhand's, a stoop, a trip, a second of
// research) ADDS, so the unit is worth `mult` and the output rises with no
// ceiling; a bounded job (a dig, a bolt at the star) PULLS FORWARD, so the crit
// takes several of the units already owed in one go and the total never moves.
// See "Crits" in DESIGN.md. Nothing in here knows which kind a station is: it
// hands back a multiplier, and the station decides whether that adds output or
// pulls owed work forward. That is what keeps the rule one rule.
//
// Two ladders reach every station because the rule does: how often (`chance`)
// and how much (`mult`). They live on the bench -- see the crit rows in
// upgrades.js -- and their levels are `S.critChanceLevel` / `S.critMultLevel`.

import { S } from './state.js';
import { rand } from './rng.js';
import {
  LADDER, CRIT_CHANCE_MIN, CRIT_CHANCE_MAX, CRIT_MULT, rungValue,
} from './config.js';

// A level clamped to the ladder, the way lab.js clamps its own -- a save from
// before this landed reads as level nought rather than as some rung nothing
// agrees with.
const rung = lvl => Math.max(0, Math.min(LADDER, lvl | 0));

// How often a swing crits, and how much it is worth when it does. Both ease
// straight across the ladder from the base to the top over `LADDER` rungs.
export const critChance = (lvl = S.critChanceLevel) =>
  CRIT_CHANCE_MIN + (CRIT_CHANCE_MAX - CRIT_CHANCE_MIN) * (rung(lvl) / LADDER);

// Whole units off its list, so no rung repeats a value: the eased five-rung
// ladder rounded two neighbors to the same figure and the row read "4 -> 4".
// A saved level past the top reads as the top.
export const critMult = (lvl = S.critMultLevel) => rungValue(CRIT_MULT, lvl);

// The expected multiplier on a unit of work over many swings, for a check that
// wants to know what a run should come to: 1 + chance*(mult - 1).
export const critEV = () => 1 + critChance() * (critMult() - 1);

// A check forces the roll so a crit can be made to happen (or not) on demand:
// null rolls for real, true is always a crit, false is never one. Play never
// touches this -- see the `__crit` handle in hooks.js.
let forced = null;
export const forceCrit = v => { forced = v; };

// The one roll. Every station calls this the same way and gets back what its
// unit of work is worth this time: `mult` on a crit, 1 otherwise. A station that
// adds multiplies its output by it; a station that is bounded pulls that many of
// the units it already owes forward. Neither branch is in here.
// `bonus` is extra chance in points, for a body under a bracing tonic -- the
// apothecary's crit tonic raises this one body's chance without touching the
// bench ladder everybody shares. Zero for a plain swing and for your own hand.
export function critRoll(bonus = 0) {
  const hit = forced != null ? forced : rand() < critChance() + bonus;
  return hit ? critMult() : 1;
}
