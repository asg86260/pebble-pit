// The core buried in each rock: how it comes loose, and how it is banked.

import { P, CORE_SIZE, CORE_CELL, ROCK_SINK } from './config.js';
import { S, pit } from './state.js';
import { addGrain } from './grid.js';
import { rockEdge } from './world.js';
import { aim } from './dust.js';
import { buildShop } from './shop.js';
import { GRAV } from './config.js';
import { floor } from './state.js';
import { at, colOf, bottomY, surfaceY } from './grid.js';
import { boulderAlive, makeBoulder } from './rock.js';
import { rockLeft } from './world.js';
import { bankDust } from './pit.js';
import { blocked } from './world.js';

// the core sits at the middle of the rock and only comes loose when it is bare
export function coreHome() {
  return { x: S.cx - CORE_SIZE / 2, y: S.groundY + ROCK_SINK - S.gh * P * 0.42 - CORE_SIZE / 2 };
}

export function dropCore() {
  const h = coreHome();
  S.coreBuried = false;
  // Thrown clear of the rock, out towards the bench. The next rock stands where
  // the last one did, so a core that settled in its footprint would be one you
  // could not pick up -- it is aimed past the edge rather than left to roll.
  const land = rockEdge(1) + P * 3 + Math.random() * P * 8;
  const v = aim(h.x, h.y, land, CORE_SIZE);
  S.coreItem = { x: h.x, y: h.y, vx: v.vx, vy: v.vy, rest: false };
}

export function bankCore(x) {
  S.cores++;
  S.seenCore = true;
  const at = (x ?? pit.x + pit.w / 2) + (Math.random() - 0.5) * P * 10;
  addGrain(pit, Math.max(pit.x, Math.min(pit.x + pit.w - P, at)), null, CORE_CELL);
  S.dirty = true;
  buildShop();              // core-priced rows appear the first time one lands
}


// where the top of the dust sits in a floor column
export function pileTop(col) {
  return surfaceY(floor, Math.max(0, Math.min(floor.cols - 1, col))) + P;
}

export function stepCore() {
  // the moment the last pixel goes, the core is loose and falls from the middle
  if (S.coreBuried && !boulderAlive()) {
    dropCore();
    S.nextBoulderAt = performance.now() + 2500;      // backstop if it never falls clear
    S.dirty = true;
  }

  // the next rock rolls in once the core has dropped out of its way
  if (!S.coreBuried && !boulderAlive()) {
    const clear = !S.coreItem || S.heldCore || S.coreItem.rest;   // it has rolled clear
    if (clear || performance.now() > S.nextBoulderAt) {
      S.boulderNo++;
      makeBoulder();
      S.dirty = true;
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

  // A core must never settle under the rock. It is aimed clear when it drops,
  // but a rock that grew over it, or a throw of your own, can still leave one
  // there: it is relaunched, once, on an arc that clears the edge -- not left to
  // bounce its way out a few pixels at a time.
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
      S.coreItem = null;
      bankCore(where);
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
      if (Math.abs(k.vx) < 0.25) { k.vx = 0; k.rest = true; S.dirty = true; }
    }
  }
}

