// Seeds (DESIGN.md, "Act 3's grove, rebuilt", track D). Until track D lands
// this is track A's placeholder of the woodcutter's planting (A1), so the
// grove keeps turning over while the basket lasts: a woodcutter with empty
// hands and a bare plot takes the basket's top acorn, walks it to the plot
// and plants it (after/grove.js, `plantAcorn`). No kneel, no seeds row, no
// self-seeding: those are track D's. True while it has the body this frame
// (after/bodies.js calls it each frame).
import { S } from '../state.js';
import { AFTER_PUT_S } from '../config.js';
import { plantable, plantAcorn, layGood } from './grove.js';
import { pileCount, takeBlock } from './piles.js';
import { pileMid, plotX, floorAt, AP } from './place.js';
import { isEmpty, push, pop, count } from '../carry.js';
import { walk } from './util.js';

// A walk along the floor, true once there.
const go = (w, x, dt) => { const there = walk(w, x, floorAt(x), dt); w.y = floorAt(w.x); return there; };

export function plantStep(w, dt) {
  const a = S.after;
  if (w.plant == null) {
    if (!isEmpty(w) || pileCount('seeds') <= 0) return false;
    const i = a.plots.findIndex((p, k) => plantable(k) && !a.bodies.some(o => o !== w && o.plant === k));
    if (i < 0) return false;
    w.plant = i; w.t = 0;
  }
  if (!count(w)) {
    if (!go(w, pileMid('forestry', 'seeds'), dt)) return true;
    const v = takeBlock('seeds');
    if (!v) { w.plant = null; return false; }
    push(w, v);
    return true;
  }
  if (!go(w, plotX(w.plant) + AP * 3, dt)) return true;
  w.t += dt;
  if (w.t < AFTER_PUT_S) return true;
  const v = pop(w);
  // the plot taken meanwhile: the acorn set down beside it, for a gatherer
  if (!plantAcorn(w.plant, v)) layGood('acorn', w.x, w.y - AP * 3, v);
  w.plant = null; w.t = 0;
  return true;
}
