// The gatherers: yard haulers lent to the deep while scales lie on its floor
// (`rebalance` in staffing.js; DESIGN.md, "The crusher"). A scale on the
// floor is not money; a gatherer makes it so. It works the floor the way a
// yard hauler works dust, with a yard hauler's load and pace: to the
// stretch of the bed that banks the most for the swim (`nextStretch`),
// scooping up to its load, then across to the crusher's side to toss the
// load up over the lip, and a scale is counted as it lands in the hopper (`tossIn`, deep/scales.js).
//
// What it carries is `w.load` (the shades) and `w.carry` (how many), the two
// fields a yard body's load is already saved in (`KEEPS`), so a reload finds
// it with the same handful.

import { held } from '../reset.js';
import { S, deepBed } from '../state.js';
import { P, WORKER, GATHER_SCOOP } from '../config.js';
import { haulCap, haulSpeed } from '../levels.js';
import { topRow, gridFrame } from '../grid.js';
import { frames } from '../clock.js';
import { tossX } from './place.js';
import { scoop, nextStretch, bedX, tossIn } from './scales.js';
import { mid, feet, working, swim } from './arms.js';
import { rest } from './rest.js';
import { TYPE } from '../jobs.js';
import { loadOf, count, push, clear } from '../carry.js';

// How far either side of where it stands a gatherer reaches for scales.
const REACH = P * 3;
// A gatherer's stretch (`w.col`) is its claim while it goes for it and
// scoops there: no other picks a stretch whose reach would cross it, so two
// never scoop the same scales or stand in one body's place. It is let go when
// the hands turn for the crusher, so a heap is not held by a body away
// tossing. `w.col` is not saved: after a reload each picks again in turn,
// and the claims come back from the picks.
const APART = 2 * REACH / P;
// The gatherers among the crew and their places in it, found once a frame:
// each of forty asking the whole crew about every other, every frame, was most
// of the endgame's step.
let crewAt = -1, gang = [], order = new Map(); // held: the gatherers found this grid frame; the grid's frame is not the yard's, so a new game drops them
held('deep-gang', () => { crewAt = -1; gang = []; order = new Map(); });
function gangNow() {
  if (crewAt !== gridFrame()) {
    gang = []; order = new Map();
    S.workers.forEach((o, i) => { order.set(o, i); if (o.type === TYPE.GATHER) gang.push(o); });
    crewAt = gridFrame();
  }
  return gang;
}
const claimed = w => {
  const kept = [];
  for (const o of gangNow()) if (o !== w && o.type === w.type && o.col >= 0 && o.goal !== 'haul') kept.push(o.col);
  return kept;
};

// Two gatherers set off together -- from the crusher after tossing at
// once, or down the shaft -- would swim the same line at the same pace and
// read as one body. A gatherer about to swim on top of one moving the same
// way just ahead of it (or level with it and earlier in the crew) holds a
// beat, so they go in file a body's width apart. Only behind a body that is
// moving: one stood scooping is swum past, never waited on.
const ahead = (w, o, dir, step) => {
  const d = (o.x - w.x) * dir;
  return d < WORKER + step && (d > 0 || (d === 0 && order.get(o) < order.get(w)));
};
const go = (w, tx, ty, pace) => {
  const dir = Math.sign(tx - w.x), step = pace * frames();
  if (dir && gangNow().some(o => o !== w && o.type === w.type && o.heading === dir &&
                                 (o.goal === 'go' || o.goal === 'haul') &&
                                 Math.abs(o.y - w.y) < WORKER && ahead(w, o, dir, step))) return false;
  w.heading = dir;
  return swim(w, tx, ty, pace);
};

export const stepGatherer = (w, c) => {
  w.heading = 0;
  if (!working(w)) return;
  const cap = haulCap();
  const pace = haulSpeed();
  loadOf(w);
  w.carry = count(w);
  // Full, or on its way with what it has, or nothing left to pick up: to the
  // crusher, and the load goes over the lip.
  if (w.carry >= cap || (w.carry > 0 && (w.goal === 'haul' || !deepBed.n))) {
    w.goal = 'haul';
    w.col = -1;
    if (!go(w, tossX() - WORKER / 2, feet(), pace)) return;
    tossIn(mid(w), w.y, w.load);
    clear(w);
    w.goal = 'seek';
    return;
  }
  // A bare floor: it waits by the crusher for the next shower, at rest on
  // the crusher's ground (deep/rest.js).
  if (!deepBed.n) {
    w.goal = 'rest';
    rest(w, 'crusher', c, pace);
    return;
  }
  // The stretch it was working gave out, or it has none: pick again.
  if (!(w.col >= 0) || w.col >= deepBed.cols || topRow(deepBed, w.col) < 0) {
    w.col = nextStretch(mid(w), cap - w.carry, tossX(), REACH, claimed(w), APART);
    w.owed = 0;
    // Everything lying is somebody else's: home with what it has, or wait by
    // the crusher until a stretch comes free.
    if (w.col < 0) {
      if (w.carry > 0) w.goal = 'haul';
      else { w.goal = 'rest'; rest(w, 'crusher', c, pace); }
      return;
    }
  }
  if (!go(w, bedX(w.col) - WORKER / 2, feet(), pace)) { w.goal = 'go'; return; }
  w.heading = 0;
  w.goal = 'scoop';
  w.owed = (w.owed || 0) + GATHER_SCOOP * c.dt / 1000;
  const n = Math.min(cap - w.carry, Math.floor(w.owed));
  if (n <= 0) return;
  w.owed -= n;
  const got = scoop(mid(w), n, REACH);
  for (const v of got) push(w, v);
  if (got.length < n) w.col = -1;
};
