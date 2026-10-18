// The click, the pair's speech, and rebel (the owner, 2026-10-18: the cloud-
// clicking faith loop replaced). Placeholder drawing (render/after.js).
//
// The pair stand on a pedestal in the camp, facing God's yard. A click on
// them is a line of a speech: a pose held, a shout mark over them, and rebel
// knocked off their heads as motes that drift down to the pile at the
// pedestal's foot and are counted where they land, never on the click
// (nothing teleports). An agitator at a post beside the pedestal gives a
// line of their own on a slow clock, worth less than the pair's. Rebel is all
// either makes: a speech wins nobody (signs and posters do, union.js).
//
// A click on a station works it by hand (work.js), and on the sawdust heap
// tips a load (mill.js).
//
// With the axe -- bought on the pedestal's card (call 15, settled), which
// owes the `axe` beat that hands it over -- a click on a grown tree is a chop;
// a click on a stump is a swing digging it out (grove.js), axe or no axe.
//
// The clouds drift over the place as scenery and nothing clicks them. They
// and the motes in the air are saved (`S.after.clouds`, `S.after.motes`): a
// mote is rebel already won, and a reload must not lose it on the way down.

import { S } from '../state.js';
import { P, AFTER_CLOUDS, AFTER_CLOUD_EVERY_S, AFTER_CLOUD_DRIFT, AFTER_CLOUD_SIZE, AFTER_CLOUD_FADE_S,
         AFTER_MOTE_FALL, AFTER_MOTE_RISE, AFTER_MOTES_A_HIT, AFTER_AGITATE_REBEL, WORKER } from '../config.js';
import { arand, secs, nextId } from './util.js';
import { shoutRebel } from './levels.js';
import { afterX0, afterX1, afterFloor, skyLo, skyHi, stationBox, speakerAt, pileX, heapX, notchX } from './place.js';
import { treeAt, chopTree, stumpAt, digStump } from './grove.js';
import { pairBuilding } from './build.js';
import { tipSawdust } from './mill.js';
import { workAfter, WORKED } from './work.js';
import { built } from './levels.js';

// --- a cloud's shape ----------------------------------------------------------------
// A cloud of `size` puffs is an oval of cells (2·size + 2) across and size + 1
// high; which cells of the oval's ragged edge stand is fixed by its id, so it
// holds still frame to frame.
export const cloudW = c => (2 * c.size + 2) * P;
export const cloudH = c => (c.size + 1) * P;
export function cloudCells(c) {
  const w = 2 * c.size + 2, h = c.size + 1, out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const nx = (i + 0.5) / w * 2 - 1, ny = (j + 0.5) / h * 2 - 1;
    const d = nx * nx + ny * ny;
    const ragged = ((((c.id * 31 + i * 7 + j * 13) * 2654435761) >>> 0) % 100) / 100;
    if (d < 0.75 || (d < 1.05 && ragged < 0.55)) out.push([i, j]);
  }
  return out;
}
const alive = c => c.die == null;

let spawnIn = 0;
function spawnCloud(a) {
  const size = AFTER_CLOUD_SIZE[0] + Math.floor(arand() * (AFTER_CLOUD_SIZE[1] - AFTER_CLOUD_SIZE[0] + 1));
  const [lo, hi] = AFTER_CLOUD_DRIFT;
  const vx = lo + arand() * (hi - lo);
  const y = Math.round((skyHi() + arand() * (skyLo() - skyHi() - (size + 1) * P)) / P) * P;
  const x = Math.round((afterX0() + arand() * (afterX1() - afterX0() - (2 * size + 2) * P)) / P) * P;
  a.clouds.push({ id: nextId(), x, y, size, vx, age: 0, die: null });
}

// --- the motes ------------------------------------------------------------------------
// The motes coming down: { x, y, v, up, age } -- knocked up `up` px first,
// then falling to the pile.
export const airMotes = () => (S.after ? S.after.motes : []);
// `v` rebel shed at (x, y), shared across at most AFTER_MOTES_A_HIT: knocked
// up off a head first, or (`rise` false) let go where they are.
function shed(x, y, v, rise = true) {
  const n = Math.max(1, Math.min(AFTER_MOTES_A_HIT, v));
  let left = v;
  for (let k = 0; k < n; k++) {
    const each = k === n - 1 ? left : Math.floor(v / n);
    left -= each;
    S.after.motes.push({ x: x + (k - (n - 1) / 2) * P, y, v: each, up: rise ? AFTER_MOTE_RISE + k * P : 0, age: 0 });
  }
}

// --- the speech -------------------------------------------------------------------------
// The pair's box on the pedestal, for the click: both of them, head to feet.
export function pairBox() {
  const a = speakerAt(0), b = speakerAt(1);
  return { x: a.x, y: a.y - WORKER, w: b.x + P * 3 - a.x, h: WORKER };
}
const inBox = (x, y, b) => x >= b.x && x < b.x + b.w && y >= b.y && y <= b.y + b.h;
// A line of the pair's speech: the pose and the mark (`S.after.shout`), the
// rebel shed off both heads -- or, for a line popped out of a speech bubble,
// out of the bubble where it burst (`from`, a world point), drifting down to
// the pile from there.
export function shout(from = null) {
  const a = S.after, at = speakerAt(0);
  a.shout = a.t;
  if (from) shed(from.x, from.y, shoutRebel(), false);
  else shed(at.x + P * 3, at.y - WORKER, shoutRebel());
}
// An agitator's line, off its own head: rebel only.
export const agitate = w => { shed(w.x, w.y - WORKER, AFTER_AGITATE_REBEL); };

// The sawdust heap under a world point: its ground from the heap's foot to
// the notch, a few cells up.
const onHeap = (x, y) => x >= heapX() && x < notchX() + P * 2 && y <= afterFloor() + P && y >= afterFloor() - P * 9;
// A station worked by the click under a world point: its box, below the
// strip along its roof that a board will open on.
export function workAt(x, y) {
  for (const key of WORKED) {
    const b = stationBox(key);
    if (built(key) && x >= b.x && x < b.x + b.w && y >= b.y + P * 2 && y <= b.y + b.h) return key;
  }
  return null;
}

// A click on the place, in world pixels: true if it was the afterlife's -- a
// grown tree chopped with the axe, a stump dug at, the sawdust heap tipped, a
// station worked, or the pair given a line while they stand on the pedestal
// (the pedestal itself opens its card, rows.js `cardAt`).
export function clickPlace(x, y) {
  if (!S.after) return false;
  if (S.after.axe) {
    const t = treeAt(x, y);
    if (t != null) { chopTree(t, true); return true; }
  }
  const st = stumpAt(x, y);
  if (st != null) { digStump(st, true); return true; }
  if (onHeap(x, y)) return tipSawdust() > 0;
  const key = workAt(x, y);
  if (key) { workAfter(key, 1, true); return true; }
  if (!pairBuilding() && inBox(x, y, pairBox())) { shout(); return true; }
  return false;
}

// The axe: bought on the pedestal's card, owed until the beat hands it over
// (story.js). Track C's actbeats.js reads `axeDue`.
export const axeDue = () => !!S.after && !!S.after.axeBought && !S.after.axe;
export const giveAxe = () => { if (S.after) S.after.axe = true; };

// One frame of the sky and the air over the place.
export function stepRebel(c) {
  const a = S.after, dt = secs(c);
  for (const cl of a.clouds) {
    cl.age += dt;
    cl.x += cl.vx * dt;
    if (alive(cl) && cl.x > afterX1()) cl.die = a.t;
  }
  a.clouds = a.clouds.filter(cl => alive(cl) || a.t - cl.die < AFTER_CLOUD_FADE_S);
  spawnIn -= dt;
  if (spawnIn <= 0 && a.clouds.filter(alive).length < AFTER_CLOUDS) { spawnCloud(a); spawnIn = AFTER_CLOUD_EVERY_S; }
  // Motes: up off the head, then down on the air, steered to the pile and
  // counted where they land.
  const land = afterFloor(), tx = pileX(), motes = a.motes;
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i];
    m.age += dt;
    const step = AFTER_MOTE_FALL * dt;
    if (m.up > 0) { const u = Math.min(m.up, step * 2); m.y -= u; m.up -= u; continue; }
    const left = Math.max(1, (land - m.y) / AFTER_MOTE_FALL);
    m.x += (tx - m.x) * Math.min(1, dt / left);
    m.y += step;
    if (m.y >= land) { a.rebel += m.v; motes.splice(i, 1); }
  }
  // A save from after the axe's beat, with the axe not yet in hand.
  if (axeDue() && S.beatsDone.includes('axe')) giveAxe();
}

// The clouds drifting now, for the drawing.
export const clouds = () => (S.after ? S.after.clouds : []);
export const cloudAlpha = (cl, t) => cl.die != null ? Math.max(0, 1 - (t - cl.die) / AFTER_CLOUD_FADE_S)
                                                 : Math.min(1, cl.age / AFTER_CLOUD_FADE_S);
