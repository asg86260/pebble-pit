// The deep's stream (DESIGN.md, "The serpent eats to heal"; the owner's C,
// docs/mocks/deep-flow-2026-10-03.html): where its creatures are, and a
// click on one. The near stream swims the world (deep/meals.js keeps its
// schedule, which the meals are picked from); the far and middle crossings
// slide on the glass at their own parallax, a fixed schedule off the clock.
// render/fish.js draws both from here.
//
// A click on one (the owner's A for each kind, FLOW_REACT) plays its
// reaction over its path, and the first click on it shakes loose the bird's
// handful, as a zone creature's does (`S.streamShed`, saved: each creature
// that swims in is a visit of its own). The reaction is picture only: the stream's paths and the
// meal's timing never read it, so a meal is due when it was due. The near
// creature a meal is, or is about to be before its reaction would be over,
// is not there to be clicked.

import { S } from '../state.js';
import { P, DEEP_H, COIL_Y, FLOW_EVERY_S, FLOW_CELL, FLOW_SPEED, FLOW_PARALLAX, FLOW_SHARE, FLOW_MARGIN,
         FLOW_NEAR_BAND, FLOW_NEAR_EDGE, FLOW_NEAR_DIP, FLOW_FAR_ZONES, FLOW_KINDS, FLOW_LENGTHS, FLOW_HEIGHTS, FLOW_REACT, FAUNA_SCALES, BIRD_REACH, SERPENT_PHASES, MEAL_SWIM_S } from '../config.js';
import { now } from '../clock.js';
import { unit, zoneOf, ROWS, waterTop, floorRowAt } from './fauna.js';
import { deepTop, deepFloor, deepX0, deepX1 } from './place.js';
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

// --- the far and middle crossings -----------------------------------------------
// On the glass: each depth slides with FLOW_PARALLAX of the camera's pan, and
// a crossing wraps round only off the glass, so nothing appears in the water.
// Which creature, which way and how deep is a fixed schedule off the clock.
export const depthOf = h => (h < FLOW_SHARE[0] ? 0 : h < FLOW_SHARE[0] + FLOW_SHARE[1] ? 1 : 2);
// The water's band on the glass, top to bottom.
export const water = () => ({ top: (deepTop() - S.camY) * S.zoom, bottom: (deepFloor() - S.camY) * S.zoom });

// Each depth's track runs, on its own sliding plane, from off the glass with
// the camera at the deep's left end to off the glass with it at the right:
// whatever the view, a crossing starts and ends out of sight. The schedule
// runs a whole crossing ahead of the clock, so the water is full from the
// first frame.
function track(d) {
  const z = S.zoom * FLOW_PARALLAX[d];
  return { from: deepX0() * z - FLOW_MARGIN, to: Math.max(deepX0(), deepX1() - S.viewW) * z + S.W + FLOW_MARGIN };
}
const AHEAD = () => (Math.max(...[0, 1].map(d => track(d).to - track(d).from)) / (Math.min(...FLOW_SPEED) * 0.8));
export function crossings(want, now0) {
  const out = [], ahead = AHEAD(), t = now0 + ahead;
  for (let i = Math.max(0, Math.floor((t - ahead) / FLOW_EVERY_S) - 1); i <= Math.floor(t / FLOW_EVERY_S); i++) {
    const at = i * FLOW_EVERY_S + unit(i * 31) * FLOW_EVERY_S;
    const d = depthOf(unit(i * 5));
    if (!want(d) || at > t) continue;
    const { from, to } = track(d), span = to - from;
    const dir = unit(i * 7) < 0.5 ? 1 : -1, speed = FLOW_SPEED[d] * (0.8 + unit(i * 19) * 0.4);
    const run = (t - at) * speed;
    if (run > span) continue;
    const x = (dir > 0 ? from + run : to - run) - S.camX * S.zoom * FLOW_PARALLAX[d];
    out.push({ i, d, dir, x, at, kind: Math.floor(unit(i * 13) * FLOW_KINDS), y: unit(i * 17) });
  }
  return out;
}
// A crossing's cell on the glass, and the height of its front tip there.
export const farCell = c => Math.max(1, Math.round(P * S.zoom * FLOW_CELL[c.d]));
export function farY(c, t) {
  const { top, bottom } = water(), band = bottom - top;
  // each depth in its own zones (FLOW_FAR_ZONES), above the fight's band; the
  // first zone's top is the top of the water the window shows, as the
  // wanderers' is, so a tall window's water over the ceiling is crossed too
  const [hi, lo] = FLOW_FAR_ZONES[c.d].map(zoneOf);
  const from = hi.from ? top + band * hi.from / ROWS : top + waterTop() * P * S.zoom, to = top + band * lo.to / ROWS;
  return from + c.y * (to - from) + Math.sin((t - c.at) * 1.3 + c.at) * farCell(c) * 2;
}

// --- a click's reaction ---------------------------------------------------------
// Which stream creatures are reacting, and since when: `n<i>` a near one on
// the stream's clock (`nowS`), `f<i>` a crossing on the page's (the clock
// each is drawn on). This session's, like a zone creature's.
const REACTS = new Map();
const LONGEST = Math.max(...FLOW_REACT.map(R => R.end));
const clockOf = key => (key[0] === 'n' ? nowS() : now() / 1000);
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
// world pixels (the near ones' own, the crossings' where they stand on the
// glass) and whether it can be clicked now: for the click, the cursor, the
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
  const tf = now() / 1000;
  for (const c of crossings(d => d < 2, tf)) {
    const key = 'f' + c.i, cell = farCell(c), L = FLOW_LENGTHS[c.kind], h = FLOW_HEIGHTS[c.kind];
    const pose = streamPose(key, c.kind, tf);
    // glass pixels to world
    const wx = gx => gx / S.zoom + S.camX, wy = gy => gy / S.zoom + S.camY;
    const front = c.x + c.dir * (pose ? pose.dx : 0) * cell, y = farY(c, tf) + (pose ? pose.dy : 0) * cell;
    const a = front - c.dir * L * cell, b = front + c.dir * 2 * cell;
    out.push({ key, near: false, i: c.i, kind: c.kind, dir: c.dir, depth: c.d,
               l: wx(Math.min(a, b)), r: wx(Math.max(a, b)), top: wy(y - h / 2 * cell), bot: wy(y + h / 2 * cell),
               x: wx(front - c.dir * L / 2 * cell), y: wy(y), reacting: !!pose, eaten: false, meal: false,
               clickable: !pose });
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
