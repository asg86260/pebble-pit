// The serpent's meals (DESIGN.md, "The serpent eats to heal"): the near
// stream of creatures, and which of them a meal is and when. All of it is read
// off the game clock and the time since the last meal landed (`S.mealT`), so a
// reload lands the same creature on the same beat and a check can be made
// frame by frame. The heal itself lands in `deep/serpent.js`.

import { S } from '../state.js';
import { SERPENT_WINDOW, MEAL_SWIM_S, MEAL_GULP_S, MEAL_SWALLOW_S, MEAL_JAW_LEAD_S, MEAL_JAW_OPEN_S,
         MEAL_JAW_SHUT_S, MEAL_GAPE, MEAL_HINGE, SNOUT, DEEP_W, FLOW_NEAR_EVERY_S, FLOW_NEAR_SPEED,
         FLOW_NEAR_OUT, FLOW_NEAR_AWAY, FLOW_NEAR_JITTER, FLOW_KINDS, JAW_POSES } from '../config.js';
import { now } from '../clock.js';
import { deepX0, coilEnds } from './place.js';
import { held } from '../motion.js';

// The stream's clock, in seconds: the page's, carried on across a refresh.
// The page's clock starts again near nought on every load, and the stream,
// the meal that has turned (`S.mealI`) and the eaten are all creatures picked
// off it by number, so read off the page's alone a refresh moves every one of
// them, and a turned meal is put back as far off as the last page had run.
// `S.streamOff` is how far the stream's clock stands ahead of the page's.
export const streamS = (ms = now()) => ms / 1000 + (S.streamOff || 0);
export const nowS = () => streamS();

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

// How far open the jaws are, 0..1: from a beat before the creature is at the
// mouth, held while it goes in, shut as it is all in. Stepped through the
// jaw's one pose table, as every opening of that mouth is (`jawPose`).
export function jawOpen(toLand) {
  const from = BITE_BEFORE + MEAL_JAW_LEAD_S, shut = MEAL_SWALLOW_S;
  if (toLand > from || toLand < shut) return 0;
  return jawPose(Math.min(1, (from - toLand) / MEAL_JAW_OPEN_S, (toLand - shut) / MEAL_JAW_SHUT_S));
}
// The jaw's held poses (JAW_POSES: shut, ajar, gape): how far open `k` (0..1)
// of the way to a full gape shows. The bite, the snatch and the roar all
// step through it, so the one mouth opens one way.
export const jawPose = k => JAW_POSES[Math.round(held(k, JAW_POSES.length - 1) * (JAW_POSES.length - 1))];
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
const dirOf = i => (FLOW_NEAR_AWAY > 0 && i % FLOW_NEAR_AWAY === FLOW_NEAR_AWAY - 1 ? -1 : 1);
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
// first creature heading for the mouth to reach it once the phase's window
// (SERPENT_WINDOW) has run since the last one landed. It swims its own path at
// its own pace all the way; only its height drifts to the mouth's over the
// last MEAL_SWIM_S. Once it has turned for the mouth it is the meal
// (`S.mealI`), whatever the window does after: a stun or Held moves the
// window, never a creature already swimming in.
export const mouthX = () => coilEnds().x0 - SNOUT;
// When creature `i`'s front reaches the mouth, on the clock; null if it is
// swimming the other way.
function biteOf(i) {
  if (dirOf(i) < 0) return null;
  return startOf(i) + (mouthX() - (deepX0() - FLOW_NEAR_OUT)) / speedOf(i) - AHEAD();
}
export const windowS = () => SERPENT_WINDOW[Math.max(0, Math.min(SERPENT_WINDOW.length - 1, S.serpentStage))];
const mealOf = i => { const b = biteOf(i); return { i, bite: b, land: b + BITE_BEFORE, kind: Math.floor(unit(i * 53) * FLOW_KINDS) }; };
// The meal after a landing at `lastLand`, biting no sooner than `floor`: which
// creature, its kind, when it bites and when the meal lands.
export function nextMeal(lastLand, floor = -Infinity) {
  const after = Math.max(lastLand + windowS() - BITE_BEFORE, floor);
  const reach = (mouthX() - (deepX0() - FLOW_NEAR_OUT)) / FLOW_NEAR_SPEED;
  const guess = Math.floor((after + AHEAD() - reach) / FLOW_NEAR_EVERY_S);
  let best = null;
  for (let i = Math.max(0, guess - 12); i <= guess + 40; i++) {
    const b = biteOf(i);
    if (b == null || b < after) continue;
    if (!best || b < best.bite) best = { i, bite: b };
  }
  return mealOf(best.i);
}
// Where the meal is, by the game clock: the creature, and the seconds before
// it lands (the creature is at the mouth at BITE_BEFORE, all in it at
// MEAL_SWALLOW_S, the swallow at the belly at 0).
export function mealNow(clock = nowS()) {
  // the creature turned for the mouth; else the next, from those not yet near enough to
  const m = S.mealI != null ? mealOf(S.mealI) : nextMeal(clock - S.mealT, clock + MEAL_SWIM_S - TURN_SLACK);
  return { n: S.meal, i: m.i, kind: m.kind, toLand: m.land - clock };
}
// A frame's grace on the turn, so the creature the window picks is still the
// one that turns on the frame it comes in reach.
const TURN_SLACK = 0.25;
// Whether the meal has turned for the mouth: it is in its swim.
export const turned = toLand => toLand <= BITE_BEFORE + MEAL_SWIM_S;
// The creatures eaten lately (`S.eaten`, saved): the stream does not draw them.
export const eatenBefore = () => new Set(S.eaten || []);

// --- the save -------------------------------------------------------------------
// The stream's clock goes down as it reads, and comes back as an offset on the
// new page's. A save from before it was written has no stream to carry on:
// its turned meal and its eaten are numbers off a clock nobody kept, so the
// next meal is picked again from the window, which is saved whole (`S.mealT`).
export const SAVE = {
  fields: ['streamOff'],
  write(out) { out.stream = streamS(); },
  read(s) {
    if (Number.isFinite(s.stream)) { S.streamOff = s.stream - now() / 1000; return; }
    S.streamOff = 0;
    S.mealI = null;
    S.eaten = [];
  },
  blank() { S.streamOff = 0; }
};
