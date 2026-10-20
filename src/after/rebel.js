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
// The stations, the trees and the heap are worked by the hand's own motions
// where they stand (after/gestures.js), not by this click.
//
// The sky over the place is the one cloud renderer's (render/after/
// cloudsky.js), scenery, and nothing clicks it. The motes in the air are
// saved (`S.after.motes`): a mote is rebel already won, and a reload must not
// lose it on the way down.

import { S } from '../state.js';
import { P, AFTER_MOTE_FALL, AFTER_MOTE_RISE, AFTER_MOTES_A_HIT, AFTER_AGITATE_REBEL, WORKER } from '../config.js';
import { secs } from './util.js';
import { shoutRebel } from './levels.js';
import { afterFloor, speakerAt, pileX } from './place.js';
import { pairBuilding } from './build.js';

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

// A click on the place, in world pixels: true if it was the afterlife's -- the
// pair given a line while they stand on the pedestal. Everything else up
// here is the hand work's, tried first (after/gestures.js): a station's
// moving part dragged, a tree sawn, a stump lifted, the heap tipped, and a
// plain click on a station its board.
export function clickPlace(x, y) {
  if (!S.after) return false;
  if (!pairBuilding() && inBox(x, y, pairBox())) { shout(); return true; }
  return false;
}

// The axe: bought on the grove's card, owed until the beat hands it over
// (story.js). Track C's actbeats.js reads `axeDue`.
export const axeDue = () => !!S.after && !!S.after.axeBought && !S.after.axe;
export const giveAxe = () => { if (S.after) S.after.axe = true; };

// One frame of the air over the place.
export function stepRebel(c) {
  const a = S.after, dt = secs(c);
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

