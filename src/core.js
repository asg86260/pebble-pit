// The core buried in each rock: how it comes loose, and how it is banked.

import { P, WORKER, CORE_SIZE, CORE_CELL, ROCK_SINK, DANCE_MS, CORE_FROM, ROCK_GAP_MS } from './config.js';
import { S, pit } from './state.js';
import { noteRockCleared } from './notices.js';
import { addGrain } from './grid.js';
import { rockEdge } from './world.js';
import { aim } from './dust.js';
import { GRAV } from './config.js';
import { floor } from './state.js';
import { at, colOf, surfaceY } from './grid.js';
import { boulderAlive, makeBoulder, dropZone } from './rock.js';
import { onYard } from './crew/body.js';
import { rockLeft } from './world.js';
import { now } from './clock.js';
import { ownsYard, beatDone } from './beats.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';
import { earned } from './income.js';

// The core sits at the *foot* of the rock: the gang take the rock down from
// the top, and a core pinned to a fraction of the full height ends up hanging
// in the air over the last low mound.
export function coreHome() {
  return { x: S.cx - CORE_SIZE / 2, y: S.groundY + ROCK_SINK - CORE_SIZE };
}

export function dropCore() {
  const h = coreHome();
  S.coreBuried = false;
  // Aimed past the rock's edge: the next rock stands where the last one did,
  // and a core that settled in its footprint could not be picked up.
  const land = rockEdge(1) + P * 3 + rand() * P * 8;
  const v = aim(h.x, h.y, land, CORE_SIZE);
  S.coreItem = { x: h.x, y: h.y, vx: v.vx, vy: v.vy, rest: false };
}

// A core loose in the world, on the save (persist.js, `SAVERS`).
export const SAVE = {
  fields: ['coreItem'],
  write(out) {
    // A core on the cursor is written where the cursor was.
    out.core = S.coreItem && !S.heldCore ? { x: S.coreItem.x, y: S.coreItem.y }
             : S.heldCore && S.mouse ? { x: S.mouse.x - CORE_SIZE / 2, y: S.groundY - CORE_SIZE } : null;
    out.coreLoose = S.heldCore || !!S.coreItem;
  },
  read(s) {
    // `coreTaker` is a body, and the bodies are about to be built again: a
    // claim left pointing at a body no longer in the yard leaves the core
    // lying there for good (`haulerWork` defers to the taker). A restore in
    // a running page has to say so.
    S.coreTaker = null;
    if (s.coreLoose) {
      S.coreItem = s.core
        ? { x: s.core.x, y: s.core.y, vx: 0, vy: 0, rest: true }
        : { x: S.worldW * 0.2, y: S.groundY - CORE_SIZE, vx: 0, vy: 0, rest: false };
    }
  },
  blank() { S.coreItem = null; }
};

// A core into the hole, if the hole will have it. It takes a grain of room
// like everything else, so a full pit turns one away; false means the core is
// still out there and still yours, lying where it is until a dig makes room.
export function bankCore(x) {
  const at = (x ?? pit.x + pit.w / 2) + (rand() - 0.5) * P * 10;
  if (!addGrain(pit, Math.max(pit.x, Math.min(pit.x + pit.w - P, at)), null, CORE_CELL)) return false;
  sfx('core-bank', { x: at, big: true });   // a core is a boulder's worth of weight
  S.cores++;
  earned('core', 1);
  S.seenCore = true;
  S.shopStale = true;       // core-priced rows appear the first time one lands
  return true;
}


// where the top of the dust sits in a floor column
export function pileTop(col) {
  return surfaceY(floor, Math.max(0, Math.min(floor.cols - 1, col))) + P;
}

// Nobody is standing on the ground the next rock is coming down on. The crew
// step out of the footprint when the last rock dies (crew/step.js) and the
// rock waits in the sky for them. A body in your hand or seeing stars cannot
// step out, so `nextBoulderAt` still brings the rock down rather than hold
// the yard on one body for ever.
const footprintClear = () => {
  const zone = dropZone();
  if (!zone) return true;
  return !S.workers.some(w => onYard(w) && w.x + WORKER > zone.from && w.x < zone.to);
};

export function stepCore() {
  // Nothing rolls in while a beat owns the yard: the opening is empty on
  // purpose and its second act puts the rock down itself. (The second dance,
  // after the sqwife is saved, is the ending beat's own -- beats.js.)
  if (ownsYard()) return;

  // The moment the last pixel goes the rock is done with. `coreBuried` really
  // says "this rock still has something to give up", so it comes down even on
  // a coreless rock; deciding it at build time skipped this branch on those,
  // and the next rock came down the same frame on a crew that had not been
  // told to move.
  if (S.coreBuried && !boulderAlive()) {
    if (S.boulderNo >= CORE_FROM) dropCore();
    else S.coreBuried = false;
    // The dance is for the first rock only (the rescue has its own). No
    // dancers, no dance: five seconds of standing about is most of the early
    // game.
    S.danceUntil = S.boulderNo === 1 && S.rockhands > 0 ? now() + DANCE_MS : 0;
    S.nextBoulderAt = now() + ROCK_GAP_MS;   // backstop if it never falls clear
  }

  // The reunion (`meet` in beats.js) needs a moment with the first rock dead
  // and the next not yet in the sky. The first rocks have no core to roll
  // clear, so without this the next boulder is built in the same call and
  // the beat never plays.
  if (beatDone('show') && !beatDone('part') && S.boulderNo === 1 && !boulderAlive()) return;

  // the next rock rolls in once the core has dropped out of its way
  if (!S.coreBuried && !boulderAlive()) {
    const clear = !S.coreItem || S.heldCore || S.coreItem.rest;   // it has rolled clear
    // Nothing lands on top of the celebration, or on top of anybody.
    if (((clear && footprintClear()) || now() > S.nextBoulderAt) && now() >= S.danceUntil) {
      noteRockCleared();   // what the one just finished was like
      S.boulderNo++;
      makeBoulder(true);
    }
  }

  if (!S.coreItem) return;

  const k = S.coreItem;
  const cells = CORE_SIZE / P;
  const leftCol = () => colOf(floor, k.x);
  // the core rests on the highest dust anywhere under it
  const supportY = () => {
    let top = Infinity;
    for (let i = 0; i < cells; i++) top = Math.min(top, pileTop(leftCol() + i));
    return top;
  };

  // A core must never settle under the rock. A rock that grew over it, or a
  // throw of your own, can leave one there: relaunched once on an arc that
  // clears the edge, not left to bounce out a few pixels at a time.
  if (k.rest && k.x + CORE_SIZE > rockLeft() && k.x < rockLeft() + S.gw * P) {
    const side = k.x + CORE_SIZE / 2 < S.cx ? -1 : 1;
    const v = aim(k.x, k.y, rockEdge(side) + side * P * 4, CORE_SIZE);
    k.rest = false;
    k.vx = v.vx;
    k.vy = v.vy;
  }

  // resting until the dust under it goes away
  if (k.rest) {
    if (k.y + CORE_SIZE >= supportY() - P) return;
    k.rest = false;
  }

  k.vy += GRAV;
  k.x += k.vx;
  k.y += k.vy;

  if (k.x < 0) { k.x = 0; k.vx = Math.abs(k.vx) * 0.4; }

  // past the ledge it drops down the shaft and banks when it hits the dust
  if (k.x + CORE_SIZE > pit.x && k.y + CORE_SIZE > S.groundY) {
    if (k.x < pit.x) { k.x = pit.x; k.vx = 0; }
    if (k.x > pit.x + pit.w - CORE_SIZE) { k.x = pit.x + pit.w - CORE_SIZE; k.vx = 0; }
    const pc = Math.max(0, Math.min(pit.cols - 1, colOf(pit, k.x + CORE_SIZE / 2)));
    if (k.y + CORE_SIZE >= surfaceY(pit, pc) + P) {
      const where = k.x + CORE_SIZE / 2;
      if (bankCore(where)) { S.coreItem = null; return; }
      // The hole would not take it: thrown back out on to the ground by the
      // lip, in plain sight, until a dig makes room.
      const v = aim(k.x, k.y, pit.x - P * 6, CORE_SIZE);
      k.vx = v.vx;
      k.vy = v.vy;
      k.rest = false;
    }
    return;
  }

  if (k.x > S.worldW - CORE_SIZE) { k.x = S.worldW - CORE_SIZE; k.vx = -Math.abs(k.vx) * 0.4; }

  // landing on the ground, or on whatever dust is piled there
  const floorY = supportY() - CORE_SIZE;
  if (k.y >= floorY) {
    k.y = floorY;
    k.vy *= -0.28;
    k.vx *= 0.72;
    if (Math.abs(k.vy) < 1.3) {
      k.vy = 0;
      if (Math.abs(k.vx) < 0.25) { k.vx = 0; k.rest = true; }
    }
  }
}

