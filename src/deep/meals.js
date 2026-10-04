// The serpent's meals (DESIGN.md, "The serpent eats to heal"): the near
// stream of creatures, and which of them a meal is and when. All of it is read
// off the game clock and the time since the last meal landed (`S.mealT`), so a
// reload lands the same creature on the same beat and a check can be made
// frame by frame. The heal itself is banked and landed in `deep/serpent.js`.

import { S } from '../state.js';
import { MEAL_MIN_S, MEAL_SWIM_S, MEAL_GULP_S, MEAL_SWALLOW_S, MEAL_JAW_LEAD_S, MEAL_JAW_OPEN_S,
         MEAL_JAW_SHUT_S, MEAL_GAPE, MEAL_HINGE, SNOUT, DEEP_W, FLOW_NEAR_EVERY_S, FLOW_NEAR_SPEED,
         FLOW_NEAR_OUT, FLOW_NEAR_AWAY, FLOW_NEAR_JITTER, FLOW_KINDS } from '../config.js';
import { now } from '../clock.js';
import { deepX0, coilEnds } from './place.js';

export const nowS = () => now() / 1000;

// A unit number from an integer, the same on every machine (Math.sin is not).
function unit(n) {
  let x = (n | 0) + 0x6D2B79F5;
  x = Math.imul(x ^ (x >>> 15), x | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}
// Where the meal is in seconds before it lands: the creature is at the mouth
// at `BITE_BEFORE`, all in it at `MEAL_SWALLOW_S`, the swallow at the belly at 0.
export const BITE_BEFORE = MEAL_GULP_S + MEAL_SWALLOW_S;
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

// --- the near stream -------------------------------------------------------------
// The near creatures swim the deep end to end, in from beyond its walls, on a
// schedule that is a fact of the clock alone (seconds of game time), a whole
// crossing ahead so the water is full from the start.
const nearSpan = () => DEEP_W + FLOW_NEAR_OUT * 2;
const AHEAD = () => nearSpan() / (FLOW_NEAR_SPEED * 0.8);
const startOf = i => i * FLOW_NEAR_EVERY_S + unit(i * 41) * FLOW_NEAR_EVERY_S * FLOW_NEAR_JITTER;
// Every FLOW_NEAR_AWAY-th swims away from the mouth; the rest come at nearly
// one pace, so they reach it about a slot apart.
const dirOf = i => (i % FLOW_NEAR_AWAY === FLOW_NEAR_AWAY - 1 ? -1 : 1);
const speedOf = i => FLOW_NEAR_SPEED * (dirOf(i) > 0 ? 0.95 + unit(i * 47) * 0.1 : 0.8 + unit(i * 47) * 0.4);
export function nearAt(i, clock) {
  const t = clock + AHEAD(), at = startOf(i), speed = speedOf(i), dir = dirOf(i);
  const run = (t - at) * speed;
  if (t < at || run > nearSpan()) return null;
  const x0 = deepX0() - FLOW_NEAR_OUT;
  return { i, at, dir, speed, kind: Math.floor(unit(i * 53) * FLOW_KINDS), lane: unit(i * 59),
           x: dir > 0 ? x0 + run : x0 + nearSpan() - run };
}
export function nearAll(clock) {
  const t = clock + AHEAD(), out = [], last = Math.floor(t / FLOW_NEAR_EVERY_S);
  const first = Math.max(0, last - Math.ceil(AHEAD() / FLOW_NEAR_EVERY_S) - 2);
  for (let i = first; i <= last; i++) { const c = nearAt(i, clock); if (c) out.push(c); }
  return out;
}

// --- the meals ------------------------------------------------------------------
// The serpent eats out of the stream (the owner, 2026-10-04): a meal is the
// first creature heading for the mouth to reach it once MEAL_MIN_S has passed
// since the last one landed. It swims its own path at its own pace all the
// way; only its height drifts to the mouth's over the last MEAL_SWIM_S.
export const mouthX = () => coilEnds().x0 - SNOUT;
// When creature `i`'s front reaches the mouth, on the clock; null if it is
// swimming the other way.
function biteOf(i) {
  if (dirOf(i) < 0) return null;
  return startOf(i) + (mouthX() - (deepX0() - FLOW_NEAR_OUT)) / speedOf(i) - AHEAD();
}
// The meal after a landing at `lastLand`: which creature, its kind, when it
// bites and when the meal lands.
export function nextMeal(lastLand) {
  const after = lastLand + MEAL_MIN_S - BITE_BEFORE;
  const reach = (mouthX() - (deepX0() - FLOW_NEAR_OUT)) / FLOW_NEAR_SPEED;
  const guess = Math.floor((after + AHEAD() - reach) / FLOW_NEAR_EVERY_S);
  let best = null;
  for (let i = Math.max(0, guess - 12); i <= guess + 40; i++) {
    const b = biteOf(i);
    if (b == null || b < after) continue;
    if (!best || b < best.bite) best = { i, bite: b };
  }
  return { i: best.i, bite: best.bite, land: best.bite + BITE_BEFORE, kind: Math.floor(unit(best.i * 53) * FLOW_KINDS) };
}
// Where the meal is, by the game clock: the creature, and the seconds before
// it lands (the creature is at the mouth at BITE_BEFORE, all in it at
// MEAL_SWALLOW_S, the swallow at the belly at 0).
export function mealNow(clock = nowS()) {
  const m = nextMeal(clock - S.mealT);
  return { n: S.meal, i: m.i, kind: m.kind, toLand: m.land - clock };
}
// The meals that landed before the last one, back as far as a creature could
// still be in the water: the stream does not draw them.
export function eatenBefore(clock = nowS()) {
  const last = clock - S.mealT, out = new Set();
  let land = last - AHEAD() * 1.2;
  for (let k = 0; k < 200; k++) {
    const m = nextMeal(land);
    if (m.land > last + 0.05) break;
    out.add(m.i);
    land = m.land;
  }
  // and the last one itself, by when it landed
  for (let i = Math.max(0, Math.floor((last + AHEAD()) / FLOW_NEAR_EVERY_S) - 40); i <= Math.floor((last + AHEAD()) / FLOW_NEAR_EVERY_S) + 2; i++) {
    const b = biteOf(i);
    if (b != null && Math.abs(b + BITE_BEFORE - last) < 0.05) out.add(i);
  }
  return out;
}
