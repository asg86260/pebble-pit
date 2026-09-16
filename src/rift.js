// The rift: the black hole hanging in the pit, and what it swallows.
//
// The hole holds 37,566 grains at full size and an endgame yard banks that in
// minutes; what is banked past it goes through here, where it costs nothing
// to keep because nothing about it is drawn. The pit is the working floor,
// not where the dust is kept. See `## The rift` in DESIGN.md.
//
// Nobody holds it open and nothing sells it: the hole tears itself the first
// time the pit cannot take a grain, and from then on takes everything thrown
// at the pit at full strength. It is not a station; it is what the hole does
// with its overflow. What is here is where it hangs and how much it takes;
// the grains are moved by `swallow` in pit.js, the same lift off the top of
// the pile that paying uses.

import { P, RIFT_W0, RIFT_WMAX, ABYSS_AT, RIFT_AT, RIFT_UP, RIFT_GULP,
         RIFT_GULP_SHOW, RIFT_SHAKE, RIFT_REACH0,
         RIFT_INHALE_MAX, RIFT_INHALE_SHOW } from './config.js';
import { S, pit, rift } from './state.js';
import { swallow, pitWidth, pitGrains } from './pit.js';
import { sfx } from './audio.js';

// --- how big it is -------------------------------------------------------------
// The disc grows with what it has eaten (`S.riftAte`) and nothing else, and
// the diameter is derived here rather than stored. The square root
// front-loads the growth and slows toward the ceiling. Whole cells: a disc
// half a cell wider is a hairline.
export function riftCells() {
  const k = Math.sqrt(Math.min(1, (S.riftAte || 0) / ABYSS_AT));
  return Math.round(RIFT_W0 + (RIFT_WMAX - RIFT_W0) * k);
}

// --- where it hangs ------------------------------------------------------------
// Over the near end of the hole (the end that is on screen, where the haulers
// tip in), and clear of the ground line by RIFT_UP cells: a black disc buried
// in a gray pile has no silhouette, and the grains it takes have to climb out
// of the hole across white sky to reach it, which is most of whether it can
// be seen working.
//
// `PIT_PAD` and every column count are untouched: a changed column count
// invalidates every saved floor grid (see `placeSites` in world.js). The disc
// moves within ground the pit and the sky already own.
export function seatRift() {
  const w = riftCells() * P;
  rift.w = w;
  rift.h = w;
  rift.x = pit.x + Math.round(pitWidth() * RIFT_AT / P) * P;
  rift.y = S.groundY - w - RIFT_UP * P;
}

// The middle of it: where the orbit tightens to, and where a grain is gone.
export const riftMouth = () => rift.x + rift.w * 0.5;
export const riftCenter = () => ({ x: rift.x + rift.w * 0.5, y: rift.y + rift.h * 0.5 });
export const riftRadius = () => rift.w * 0.5;

// Whether it is swallowing: torn. There is nothing else to it.
export const riftOpen = () => !!S.riftOpen;

// --- how fast ----------------------------------------------------------------
// It inhales: no rate, no ladder, nothing to buy. What it eats is bounded by a
// **reach** (below), so a young rift skims a crater out of the top of the
// pile under its mouth and a grown one takes the whole hole. Every grain the
// yard tips in lands inside the reach, so a full pit stays impossible.
//
// RIFT_INHALE_MAX is not a balance number: a hundred thousand grains arriving
// in one act are taken over a few frames instead of walking a million cells
// inside one.
export const riftBite = () => Math.min(pitGrains(), RIFT_INHALE_MAX);

// How far past the air under it it eats, in cells: RIFT_REACH0 at birth, the
// far corner of the hole at full size, geometric between. A straight line
// toward a six-hundred-cell hole is ninety cells at the first sign of
// growth, which is the empty pit again.
export function riftReach() {
  const k = (riftCells() - RIFT_W0) / Math.max(1, RIFT_WMAX - RIFT_W0);
  const all = pit.cols + pit.rows;
  return RIFT_UP + RIFT_REACH0 * Math.pow(all / RIFT_REACH0, Math.max(0, Math.min(1, k)));
}

// --- the swallowing ----------------------------------------------------------
// Nothing is accumulated between frames and no remainder is carried: what is
// in the hole is what goes.
export function stepRift(dt) {
  if (!riftOpen()) return 0;                  // not torn: nothing is pulled
  // Reseated every step because it grows: the bottom edge stays RIFT_UP
  // cells off the ground and the swelling goes upward.
  if (!S.drowned) seatRift();
  // The drowning: the hole has eaten its fill and gives way downward. The
  // gulp runs again, this time as `abyssLine` rising out of the floor
  // (pit.js). One-way, once.
  if (!S.drowned && (S.riftAte || 0) >= ABYSS_AT) {
    S.drowned = true;
    S.riftGulp = RIFT_GULP;
    S.riftShake = RIFT_SHAKE;
    sfx('rift-open', { x: pit.x + pit.w / 2 });
  }
  if (S.riftGulp > 0) return gulp(dt);        // and the tearing is its own thing
  const take = riftBite();
  if (!take) return 0;
  return swallow(take, RIFT_INHALE_SHOW, false, riftReach());
}

// The tearing: the hole emptied over RIFT_GULP seconds, however much is in it.
// The share is worked out against the time *left*, so whatever is in the hole
// on the last frame is taken then and the hole is empty at the end by
// construction. It takes from everywhere rather than nearest the mouth, or a
// tear would empty the end you are looking at and leave the rest standing off
// the side of the window.
function gulp(dt) {
  const was = S.riftGulp;
  const left = Math.max(0, was - dt / 1000);
  S.riftGulp = left;
  const have = pitGrains();
  if (!have) return 0;
  const take = left <= 0 ? have : Math.ceil(have * Math.min(1, (was - left) / was));
  return swallow(take, RIFT_GULP_SHOW, true);
}
