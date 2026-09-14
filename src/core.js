// The core buried in each rock: how it comes loose, and how it is banked.

import { P, WORKER, CORE_SIZE, CORE_CELL, ROCK_SINK, DANCE_MS, CORE_FROM } from './config.js';
import { S, pit } from './state.js';
import { noteRockCleared } from './notices.js';
import { addGrain } from './grid.js';
import { rockEdge } from './world.js';
import { aim } from './dust.js';
import { buildShop } from './shop.js';
import { GRAV } from './config.js';
import { floor } from './state.js';
import { at, colOf, surfaceY } from './grid.js';
import { boulderAlive, makeBoulder, dropZone } from './rock.js';
import { onYard } from './crew/body.js';
import { rockLeft } from './world.js';
import { now } from './clock.js';
import { introHolds } from './intro.js';
import { rand } from './rng.js';
import { sfx } from './audio.js';

// The core sits at the *foot* of the rock and only comes loose when it is bare.
//
// It used to sit four tenths of the way up, which is a fine place for it in a
// whole rock and the wrong place in a worn one: the gang take the rock down from
// the top, so the last of it is a low mound -- and a core pinned to a fraction
// of the rock's full height ends up hanging in the air above what is left of it,
// which is the one thing in this yard that is not standing on something.
//
// At the foot it is under the rock the whole way down and comes out of the last
// of it, which is also the better reveal: you dig until the ground shows.
export function coreHome() {
  return { x: S.cx - CORE_SIZE / 2, y: S.groundY + ROCK_SINK - CORE_SIZE };
}

export function dropCore() {
  const h = coreHome();
  S.coreBuried = false;
  // Thrown clear of the rock, out over its own spoil. The next rock stands where
  // the last one did, so a core that settled in its footprint would be one you
  // could not pick up -- it is aimed past the edge rather than left to roll.
  const land = rockEdge(1) + P * 3 + rand() * P * 8;
  const v = aim(h.x, h.y, land, CORE_SIZE);
  S.coreItem = { x: h.x, y: h.y, vx: v.vx, vy: v.vy, rest: false };
}

// A core into the hole, if the hole will have it. It takes a grain of room like
// everything else does -- one capacity, one queue -- so a full pit turns one
// away, and false means the core is still out there and still yours. It is never
// lost: the caller leaves it lying where it is until there is somewhere to put
// it, which is a hole you have to dig rather than a core you dropped.
export function bankCore(x) {
  const at = (x ?? pit.x + pit.w / 2) + (rand() - 0.5) * P * 10;
  if (!addGrain(pit, Math.max(pit.x, Math.min(pit.x + pit.w - P, at)), null, CORE_CELL)) return false;
  sfx('core-bank', { x: at, big: true });   // a core is a boulder's worth of weight
  S.cores++;
  S.seenCore = true;
  S.dirty = true;
  buildShop();              // core-priced rows appear the first time one lands
  return true;
}


// where the top of the dust sits in a floor column
export function pileTop(col) {
  return surfaceY(floor, Math.max(0, Math.min(floor.cols - 1, col))) + P;
}

// Nobody is standing on the ground the next rock is coming down on. The crew
// step out of the footprint the moment the last rock dies (the drop-zone stage
// in crew/step.js), and the rock waits in the sky for them: a gang stood in the
// middle of a rock cannot cross half of it in the time a fall takes, and the
// dance that used to buy them that time is gone from every rock but the first.
// A body in your hand or seeing stars over the footprint cannot step out of it,
// so `nextBoulderAt` still brings the rock down rather than hold the yard on
// one body for ever.
const footprintClear = () => {
  const zone = dropZone();
  if (!zone) return true;
  return !S.workers.some(w => onYard(w) && w.x + WORKER > zone.from && w.x < zone.to);
};

export function stepCore() {
  // Nothing rolls in while a scene owns the yard. The opening is deliberately
  // empty for those few seconds -- two squares and bare ground -- and the second
  // act puts the rock down itself, at the moment it means something. The rule
  // below, that a bare yard gets a rock, is exactly the rule that would spoil
  // both.
  if (introHolds()) return;

  // The second dance, after the sqwife is saved. It starts when the player
  // puts the `#saved` sheet down (`storyTold`, set only by the sheet's button
  // in ending.js), not while the sheet still hides the yard -- a party nobody
  // can see is not one. Kept as a saved fact so it plays once: a yard that has
  // danced this already does not dance again on reload, and a save written
  // before the field existed loads with it already marked (persist.js).
  if (S.storyTold && !S.storyDanced) {
    S.storyDanced = true;
    if (S.rockhands > 0) S.danceUntil = now() + DANCE_MS;
    S.dirty = true;
  }

  // The moment the last pixel goes the rock is done with. If there was a core in
  // it, it is loose now and falls from the middle; if there was not -- the first
  // four have none -- the flag comes down anyway, because what it really says is
  // "this rock still has something to give up", and this one has not. Deciding
  // it when the rock is *built* instead skipped this whole branch on a coreless
  // rock: no dance, and the next one came down the same frame on a crew that had
  // not been told to move.
  if (S.coreBuried && !boulderAlive()) {
    if (S.boulderNo >= CORE_FROM) dropCore();
    else S.coreBuried = false;
    // The dance is for the first rock only. Every rock used to get one, and
    // five seconds plus a fall on every rock is a wait the player sat through
    // for weeks; the rocks that earn a celebration are the first one and the
    // rescue (below). After any other rock the crew go straight back to work.
    // No dancers, no dance either: on a game with nobody hired yet this would
    // be five seconds of standing about, and that is most of the early game.
    S.danceUntil = S.boulderNo === 1 && S.rockhands > 0 ? now() + DANCE_MS : 0;
    S.nextBoulderAt = now() + 2500;      // backstop if it never falls clear
    S.dirty = true;
  }

  // The one beat the game gets to show what it is about waits here.
  //
  // After the first rock the pair are reunited on the bare ground and then the
  // next rock comes down on it -- see `maybeReunion`. That needs a moment with
  // the first rock dead and the next one not yet in the sky, and on a rock with
  // a core in it there is one: the core has to roll clear first. The first four
  // rocks have no core, so the whole thing happened inside a single call --
  // the rock died, the flag came down and the next boulder was built before
  // anything else in the frame had a chance to look -- and the beat never
  // played at all. It was being held up by the very thing it is not about.
  if (S.introDone && !S.reunionDone && S.boulderNo === 1 && !boulderAlive()) return;

  // the next rock rolls in once the core has dropped out of its way
  if (!S.coreBuried && !boulderAlive()) {
    const clear = !S.coreItem || S.heldCore || S.coreItem.rest;   // it has rolled clear
    // Nothing lands on top of the celebration, or on top of anybody. The next
    // rock waits for the crew to finish and to step clear of its footprint,
    // then comes down out of the sky on to the bare ground.
    if (((clear && footprintClear()) || now() > S.nextBoulderAt) && now() >= S.danceUntil) {
      noteRockCleared();   // what the one just finished was like
      S.boulderNo++;
      makeBoulder(true);
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
      if (bankCore(where)) { S.coreItem = null; return; }
      // The hole would not take it. It is thrown back out on to the ground by
      // the lip and waits there, in plain sight, until a dig makes room.
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
      if (Math.abs(k.vx) < 0.25) { k.vx = 0; k.rest = true; S.dirty = true; }
    }
  }
}

