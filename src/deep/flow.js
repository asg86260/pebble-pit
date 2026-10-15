// The deep's stream (DESIGN.md, "The serpent eats to heal"; the owner's C,
// docs/mocks/deep-flow-2026-10-03.html): where its creatures are, and a
// click on one. The near stream swims the world (deep/meals.js keeps its
// schedule, which the meals are picked from). render/fish.js draws it from here.
//
// A click on one (the owner's A for each kind, FLOW_REACT) plays its
// reaction over its path, and the first click on it shakes loose the bird's
// handful, as a zone creature's does (`S.streamShed`, saved: each creature
// that swims in is a visit of its own). The reaction is picture only: the stream's paths and the
// meal's timing never read it, so a meal is due when it was due. The near
// creature a meal is, or is about to be before its reaction would be over,
// is not there to be clicked.

import { S } from '../state.js';
import { P, DEEP_H, COIL_Y,
         FLOW_NEAR_BAND, FLOW_NEAR_EDGE, FLOW_NEAR_DIP, FLOW_LENGTHS, FLOW_HEIGHTS, FLOW_REACT, FAUNA_SCALES, BIRD_REACH, SERPENT_PHASES, MEAL_SWIM_S } from '../config.js';
import { waterTop, floorRowAt } from './fauna.js';
import { deepTop, deepFloor, deepX0 } from './place.js';
import { nearAll, nowS, mealNow, eatenBefore, BITE_BEFORE, mouthX } from './meals.js';
import { smoothstep as ease } from '../motion.js';
import { shed } from './scales.js';
import { poseAt, playing, leadOf } from './react.js';

// --- the near stream ------------------------------------------------------------
// A near creature's height, world pixels: by the mouth, its lane in the band
// over the coil's middle, where a meal is taken from; away from it, the same
// lane spread over the whole water the window shows (from the top the zones'
// wanderers swim to, `waterTop`, to the floor), eased between over
// FLOW_NEAR_DIP; bobbing.
export function nearY(c, t) {
  const band = deepTop() + COIL_Y * DEEP_H - FLOW_NEAR_BAND * (0.2 + c.lane);
  const top = deepTop() + waterTop() * P + FLOW_NEAR_EDGE[0], bottom = deepFloor() - FLOW_NEAR_EDGE[1];
  // and never down in the scales heaped on the floor, which the wanderers keep off too
  const heap = deepTop() + floorRowAt((c.x - deepX0()) / P) * P - FLOW_NEAR_EDGE[1];
  const wide = Math.min(bottom - (bottom - top) * c.lane, heap);
  const [near, far] = FLOW_NEAR_DIP, k = ease((far - Math.abs(c.x - mouthX())) / (far - near));
  return wide + (band - wide) * k + Math.sin((t - c.at) * 1.3 + c.at) * P * 2;
}

// --- a click's reaction ---------------------------------------------------------
// Which stream creatures are reacting, and since when: `n<i>` a near one, on
// the stream's clock (`nowS`). This session's, like a zone creature's.
const REACTS = new Map();
const LONGEST = Math.max(...FLOW_REACT.map(R => R.end));
const clockOf = () => nowS();
export const streamReacting = (key, kind, t = clockOf(key)) => playing(FLOW_REACT[kind], REACTS.get(key), t);
// The pose stream creature `key` holds at `t`, or null when it is not reacting.
export function streamPose(key, kind, t = clockOf(key)) {
  if (!streamReacting(key, kind, t)) return null;
  return poseAt(FLOW_REACT[kind], t - REACTS.get(key));
}
// How far ahead each one's frame clock runs for its quickened reactions, so
// its drawing carries on from the reaction rather than snapping back: `from`
// while one plays, `to` after.
const LEADS = new Map();
export function streamLead(key, kind, t = clockOf(key)) {
  const L = LEADS.get(key);
  return !L ? 0 : streamReacting(key, kind, t) ? L.from : L.to;
}
export function resetStream() { REACTS.clear(); LEADS.clear(); }
// A save read back on the clock that wrote it keeps those under way.
export function settleStream() {
  for (const [key, r0] of REACTS) if (r0 > clockOf(key)) REACTS.delete(key);
}

const shown = () => S.view === 'deep' && S.snatched;
const mealsOn = () => !S.serpentFreed && S.serpentStage < SERPENT_PHASES;

// Every stream creature a click could find, each with its box and middle in
// world pixels and whether it can be clicked now: for the click, the cursor, the
// checks and the scenes.
export function streamReport() {
  if (!shown()) return [];
  const out = [], tn = nowS(), gone = eatenBefore();
  const meal = mealsOn() ? mealNow(tn) : null;
  for (const c of nearAll(tn)) {
    const key = 'n' + c.i, L = FLOW_LENGTHS[c.kind], h = FLOW_HEIGHTS[c.kind];
    const pose = streamPose(key, c.kind, tn);
    const front = c.x / P + c.dir * (pose ? pose.dx : 0), row = Math.round(nearY(c, tn) / P) + (pose ? pose.dy : 0);
    const a = front - c.dir * L, b = front + c.dir * 2;
    // the meal in its swim is the serpent's, and one about to turn for the
    // mouth is let be, so its reaction never runs into its swim
    const due = meal && meal.i === c.i && meal.toLand - BITE_BEFORE - MEAL_SWIM_S < FLOW_REACT[c.kind].end;
    out.push({ key, near: true, i: c.i, kind: c.kind, dir: c.dir, front, row,
               l: Math.min(a, b) * P, r: Math.max(a, b) * P, top: (row - h / 2) * P, bot: (row + h / 2) * P,
               x: (front - c.dir * L / 2) * P, y: row * P, reacting: !!pose, eaten: gone.has(c.i), meal: !!due,
               clickable: !pose && !gone.has(c.i) && !due });
  }
  return out;
}

// The stream creature a click at world (wx, wy) lands on, within the bird's
// reach of its box, the nearest if several.
export function streamUnder(wx, wy, all = streamReport()) {
  let best = null, near = Infinity;
  for (const f of all) {
    if (!f.clickable) continue;
    const d = Math.max(f.l - wx, 0, wx - f.r, f.top - wy, wy - f.bot);
    if (d <= BIRD_REACH && d < near) { near = d; best = f; }
  }
  return best;
}
export const overStream = (wx, wy) => !!streamUnder(wx, wy);

// A click on a stream creature: its reaction, and the first time the bird's
// handful from its middle. True if one was there.
export function startleStream(wx, wy) {
  const all = streamReport(), f = streamUnder(wx, wy, all);
  if (!f) return false;
  for (const [key, r0] of REACTS) if (clockOf(key) - r0 > LONGEST) REACTS.delete(key);   // played out
  // the marks of those swum off or eaten go: their visits are over
  const here = new Set(all.map(c => c.key)), had = (S.streamShed || []).filter(k => here.has(k));
  for (const k of LEADS.keys()) if (!here.has(k) && k !== f.key) LEADS.delete(k);
  if (!had.includes(f.key)) { shed(f.x, f.y, FAUNA_SCALES); had.push(f.key); }
  S.streamShed = had;
  REACTS.set(f.key, clockOf(f.key));
  const was = LEADS.has(f.key) ? LEADS.get(f.key).to : 0;
  LEADS.set(f.key, { from: was, to: was + leadOf(FLOW_REACT[f.kind]) });
  return true;
}
// Whether stream creature `key` (a `streamReport` key) has shaken its handful loose.
export const streamShed = key => (S.streamShed || []).includes(key);
