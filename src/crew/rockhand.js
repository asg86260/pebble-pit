// The gang on the hill: how one is made, where the working layer is, and one
// frame of taking the rock off it.
//
// The crew take the hill off in layers: a rockhand walks the top layer,
// striking the rock under its feet, turning at the ends of the layer and
// before walking into a mate.

import { P, WORKER, IDLE_BEAT, IDLE_STRIDE, IDLE_PACE, ROCKHAND_WALK, COMMUTE_PACE,
         SWING_BOB, SWING_DRIVE } from '../config.js';
import { S } from '../state.js';
import { standOn, rockLeft } from '../world.js';
import { climbTo } from '../route.js';
import { boulderAlive, knockOff, rockTopY, rockPatch } from '../rock.js';
import { tidyStep } from '../tidy.js';
import { rockhandMs, rockhandBite } from '../upgrades.js';
import { speedBoost, stronger } from '../apothecary.js';
import { TYPE } from '../jobs.js';
import { rockMuck } from '../smog.js';
import { frames } from '../clock.js';
import { amble } from './idle.js';
import { rand } from '../rng.js';
import { stopJig } from './dance.js';

const MINE_BAND = 3;      // cells below the peak still counted as the top layer

export function findPeak() {
  S.peakRow = S.gh;
  for (let c = 0; c < S.gw; c++) {
    if (S.rockTops[c] >= 0 && S.rockTops[c] < S.peakRow) S.peakRow = S.rockTops[c];
  }
}

const inBand = c =>
  c >= 0 && c < S.gw && S.rockTops[c] >= 0 && S.rockTops[c] <= S.peakRow + MINE_BAND;

const colAtX = x => Math.max(0, Math.min(S.gw - 1, Math.round((x - rockLeft()) / P)));

// the nearest column that is still part of the working layer, or null when no
// column is: there is no rock to work
export function nearestInBand(from) {
  for (let d = 0; d < S.gw; d++) {
    if (inBand(from - d)) return from - d;
    if (inBand(from + d)) return from + d;
  }
  return null;
}

// Somebody already working the stretch this one is about to walk into. Asks
// `mineDir`, the way it is working along the row, not which way it is facing:
// a heading is remembered and turned at the ends, a facing is measured off
// the ground just covered (`faceTravel`).
export function elbowed(w, x) {
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.ROCK) continue;
    if ((o.x - w.x) * w.mineDir <= 0) continue;         // behind it: not in the way
    if (Math.abs(o.x - x) < WORKER * 1.2) return true;
  }
  return false;
}

export function newRockhand() {
  return {
    type: TYPE.ROCK, next: 0, lunge: 0,
    x: rockLeft() + rand() * S.gw * P, y: S.cy,
    mineDir: rand() < 0.5 ? -1 : 1,  // which way along the layer it is working
    ph: rand() * Math.PI * 2,        // where in its wobble it starts
    sp: 0.5 + rand() * 0.9,          // how fast it sways
    wob: 0.05 + rand() * 0.10,       // how far it drifts round its seat
    rw: 0.4 + rand() * 0.9           // how much it drifts in and out
  };
}

export function rockhandWork(w, c) {
  const { now } = c;

  // Back to it: the dance leaves its ground, its move and its say behind, or a
  // body walks back up the hill still shouting about the last rock.
  if (w.jigAt != null) stopJig(w);

  // The crew stand where they are while the rock's pile is full, or dust with
  // nowhere to go rolls into the pit and banks for nothing. And a gang with no
  // layer to work at all: given no layer, the walk-back branch below marches
  // the body in whatever direction it last worked, out to the world's edge.
  if (S.pileFull.rock || nearestInBand(colAtX(w.x + WORKER / 2)) === null) {
    w.resting = true;                      // stopped, and free to take five
    // Standing down is not being switched off: it shifts its weight about
    // the spot it stopped on, on its own phase.
    if (w.idleAt == null) w.idleAt = w.x;
    const idle = now / 1000 * IDLE_BEAT + w.ph;
    // Stepped toward the sway's target, never assigned to it: an absolute
    // assignment overwrites the climber's refusal of a step and drags the
    // body over edges.
    const swayTo = w.idleAt + Math.sin(idle * IDLE_STRIDE) * P;
    amble(w, swayTo, IDLE_PACE);
    const surf = rockTopY(colAtX(w.x + WORKER / 2));
    w.y = climbTo(w, standOn(surf));
    w.next = now + rockhandMs();
    return;
  }
  w.resting = false;
  w.idleAt = null;

  const t = now / 1000;

  // Walk the layer, turning at its ends and before walking into a mate. Off
  // the layer (the gang took the row down around it, or it was hired onto a
  // flank) it climbs back rather than boring a shaft.
  const here = colAtX(w.x + WORKER / 2);
  if (!inBand(here)) {
    const back = nearestInBand(here);      // never null here: the stand-down above caught that
    if (back !== here) w.mineDir = Math.sign(back - here);
    w.x += w.mineDir * COMMUTE_PACE * frames();   // a walk, at the pace it crosses the yard
  } else {
    const step = w.x + w.mineDir * ROCKHAND_WALK * frames();
    if (inBand(colAtX(step + WORKER / 2)) && !elbowed(w, step)) w.x = step;
    else w.mineDir = -w.mineDir;
  }

  const col = colAtX(w.x + WORKER / 2);
  const surf = rockTopY(col);
  // Climbed to, not assigned. The bob and the swing go on top of the foot,
  // not into it: easing them would damp them into nothing.
  w.y = climbTo(w, standOn(surf)) + Math.sin(t * w.sp + w.ph) * SWING_BOB
      + w.lunge * P * SWING_DRIVE;

  if (boulderAlive() && now >= w.next && S.rockTops[col] >= 0) {
    // twice the bite for a breaker, and a strong brew on top (`stronger`)
    const bite = stronger(w, rockhandBite() * (w.trained ? 2 : 1));
    knockOff(w.x + WORKER / 2, surf + P / 2, bite, true, w);
    w.mined = (w.mined || 0) + bite;
    w.lunge = 1;
    // A hearty stew quickens the swing; `speedBoost` is 1 with no stew.
    w.next = now + rockhandMs() / speedBoost(w) * (0.85 + rand() * 0.3);    // never quite in time
  } else if (boulderAlive()) {
    // Between swings, never instead of one: a grain lying on the hill goes on
    // the rock's own heap (tidy.js; `rockSand` in rock.js for what it lies on).
    tidyStep(w, rockPatch(), c.rockTaken, now);
  }
}

// A mess on the rock comes before the rock, or a face nobody is mining stays
// under muck for good. Its own site and not the whole yard, unless its pile
// is full and there is nothing else for it to do.
export const rockhandMess = () => rockMuck() > 0 || S.pileFull.rock;

// A rockhand carries no goal of its own, so the shovel's is put down with the
// shovel.
export function rockhandBack(w) {
  if (w.goal === 'muck') { w.goal = null; w.muckAt = null; }
}
