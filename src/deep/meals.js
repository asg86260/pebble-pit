// The serpent's meals (DESIGN.md, "The serpent eats to heal"): when the next
// creature comes and which one. Both are read off the meal counter, so a
// reload lands the same creature on the same beat and a check can be made
// frame by frame. The heal itself is banked and landed in `deep/serpent.js`;
// this only says where in a meal the picture is.

import { S } from '../state.js';
import { MEAL_MIN_S, MEAL_MAX_S, MEAL_SWIM_S, MEAL_GULP_S, MEAL_SWALLOW_S, MEAL_JAW_LEAD_S, MEAL_JAW_OPEN_S,
         MEAL_JAW_SHUT_S, MEAL_GAPE, MEAL_HINGE } from '../config.js';

// A unit number from an integer, the same on every machine (Math.sin is not).
function unit(n) {
  let x = (n | 0) + 0x6D2B79F5;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
// How long meal `n` waits after the last one landed, and which of `count`
// creatures it is.
export const cycleS = n => MEAL_MIN_S + unit(n * 2 + 1) * (MEAL_MAX_S - MEAL_MIN_S);
export const kindOf = (n, count) => Math.floor(unit(n * 2 + 2) * count);

// Where the meal is, in seconds before it lands: the creature is at the
// mouth at `bite`, all in it at `gulp`, the swallow is at the belly at 0.
export const BITE_BEFORE = MEAL_GULP_S + MEAL_SWALLOW_S;
export function mealNow() {
  const cycle = cycleS(S.meal);
  return { n: S.meal, cycle, toLand: cycle - S.mealT };
}
export const SWIM_BEFORE = () => MEAL_SWIM_S + BITE_BEFORE;

const ease = k => k * k * (3 - 2 * k);
// How far open the jaws are, 0..1: from a beat before the creature is at the
// mouth, held while it goes in, shut as it is all in.
export function jawOpen(toLand) {
  const from = BITE_BEFORE + MEAL_JAW_LEAD_S, shut = MEAL_SWALLOW_S;
  if (toLand > from || toLand < shut) return 0;
  return ease(Math.min(1, (from - toLand) / MEAL_JAW_OPEN_S, (toLand - shut) / MEAL_JAW_SHUT_S));
}
// How far each jaw stands off the mouth's line `d` cells back from the tip,
// for jaws `open` 0..1: widest at the tip, nothing at the hinge. Both the
// head (render/serpent.js) and the creature going in (render/fish.js) read it,
// so the creature is cut by the same lines the jaws are drawn on.
export const jawGap = (d, open) => (open > 0 && d < MEAL_HINGE ? MEAL_GAPE * open * (1 - Math.max(0, d) / MEAL_HINGE) : 0);
