// The yard's four multipliers: what they are worth, how far up each one is, and
// what a rung of one costs in somebody's time.
//
// This was the top of lab.js, and it never belonged to the lab. The farm, the
// quarry, the tower and the wizards all read `mult` to work out their own rates;
// what the lab owned was the *room the work happened in*, and that room is gone.
// See DESIGN.md, "The lab is deleted".

import { S } from './state.js';
import { LAB_WORK, MULT_MAX, RUNGS } from './config.js';

// Each level is a quarter again on top. Four ladders, deliberately few: three
// currencies and a wall of percentages is where cozy turns into a spreadsheet.
export const STEP = 1.25;

// Each multiplier stands on its own, and each has an end -- `RUNGS` rungs, like
// every other ladder in the game.
//
// It used to have none. The price went up nine tenths a level and that was the
// whole of the limit, which is the arithmetic of a row meant to be bought for
// ever: you stop when the number gets silly, at a rung nobody wrote down, and
// the board could not tell you how far along you were because there was no along
// to be far. Four ladders that end are four things to *finish*, and finishing
// them is what the rest of the yard is waiting on.
//
// Clamped where it is read rather than only where it is bought, so a save from
// before the ceiling -- which may hold any level at all -- reads as a finished
// ladder rather than as a multiplier nothing else in the game agrees with.
// The cap is per key rather than one for all of them -- `MULT_MAX` in
// config/tiers.js says why -- and it is still applied on read, which is the
// whole trick: a save from before a ceiling existed may hold any level at all,
// and it reads as a finished ladder rather than as a multiplier nothing else in
// the game agrees with.
export const levelOf = k => Math.min(MULT_MAX[k] ?? RUNGS, S.mult[k] || 0);
export const mult = k => Math.pow(STEP, levelOf(k));

// Which of the four rates each row climbs. The keys are the old lab keys, kept
// because a work in flight in somebody's save quotes them -- see the note at the
// top of upgrades/rows-mult.js.
// The four speed keys are the old lab keys; the two yield ones are new, and are
// the only multipliers in the game that never belonged to the lab.
export const FIELD = { labcave: 'quarry', labtend: 'tend', labcrop: 'crop', labseam: 'seam' };

// What a rung asks of the crew, in worker-seconds, climbing with the rung the
// way the price does.
//
// Anything without a field of its own is a plain piece of work at the base
// effort. Without that fallback it asked for `S.mult` under `undefined`, which
// is NaN worker-seconds: a piece of work that could never be finished and never
// even properly started.
export const workFor = key => Math.round(LAB_WORK * Math.pow(1.35, levelOf(FIELD[key])));

// A rung landing. The row's own `buy` calls this; the announcing is `workFinished`
// in works.js, which every site shares.
export function finish(key) {
  if (FIELD[key]) S.mult[FIELD[key]]++;
  S.dirty = true;
}
