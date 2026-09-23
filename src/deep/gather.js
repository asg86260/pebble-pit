// The gatherers: the deep's haulers (DESIGN.md, "The crusher"). A scale on
// the floor is not money; a gatherer makes it so. It works the floor the way
// a yard hauler works dust -- to the richest stretch of the bed for the swim,
// scooping up to its carry at its pace -- then swims to the crusher's side
// and tosses the load up over the lip, and a scale is counted as it lands in
// the hopper (`tossIn`, deep/scales.js).
//
// What it carries is `w.load` (the shades) and `w.carry` (how many), the two
// fields a yard body's load is already saved in (`KEEPS`), so a reload finds
// it with the same handful.

import { S, deepBed } from '../state.js';
import { P, WORKER, rungValue } from '../config.js';
import { topRow } from '../grid.js';
import { tossX } from './place.js';
import { scoop, richestNear, bedX, tossIn } from './scales.js';
import { mid, feet, working, swim } from './arms.js';

// How far either side of where it stands a gatherer reaches for scales.
const REACH = P * 3;

export const stepGatherer = (w, c) => {
  if (!working(w)) return;
  const cap = rungValue('gathercarry', S.gathercarryLevel);
  w.load = Array.isArray(w.load) ? w.load : [];
  w.carry = w.load.length;
  // Full, or on its way with what it has, or nothing left to pick up: to the
  // crusher, and the load goes over the lip.
  if (w.carry >= cap || (w.carry > 0 && (w.goal === 'haul' || !deepBed.n))) {
    w.goal = 'haul';
    if (!swim(w, tossX() - WORKER / 2, feet())) return;
    tossIn(mid(w), w.y, w.load);
    w.load = [];
    w.carry = 0;
    w.goal = 'seek';
    return;
  }
  // A bare floor: it waits by the crusher for the next shower.
  if (!deepBed.n) {
    w.goal = 'rest';
    swim(w, tossX() - WORKER / 2, feet());
    return;
  }
  // The stretch it was working gave out, or it has none: pick again.
  if (!(w.col >= 0) || w.col >= deepBed.cols || topRow(deepBed, w.col) < 0) {
    w.col = richestNear(mid(w));
    w.owed = 0;
    if (w.col < 0) return;
  }
  if (!swim(w, bedX(w.col) - WORKER / 2, feet())) { w.goal = 'go'; return; }
  w.goal = 'scoop';
  w.owed = (w.owed || 0) + rungValue('gatherpace', S.gatherpaceLevel) * c.dt / 1000;
  const n = Math.min(cap - w.carry, Math.floor(w.owed));
  if (n <= 0) return;
  w.owed -= n;
  const got = scoop(mid(w), n, REACH);
  w.load = w.load.concat(got);
  w.carry = w.load.length;
  if (got.length < n) w.col = -1;
};
