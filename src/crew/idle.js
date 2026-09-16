// --- the yard at rest ---------------------------------------------------------
// Where a body with nothing to do wanders to: a spot chosen from a handful of
// real ones, weighted. A random walk with no destination reads as insects;
// going over to somebody is what gives the break code its conversations.

import { WORKER, ROCK_CLEAR } from '../config.js';
import { S, pit, shack } from '../state.js';
import { rockLeft, yardLeft } from '../world.js';
import { TYPE } from '../jobs.js';
import { frames } from '../clock.js';
import { rand } from '../rng.js';

export const ROAM_RANGE = 420;   // how far an idle worker will wander for no reason
export const ROAM_PACE = 0.45;   // and how slowly it goes about it
const ROAM_ELBOW = WORKER * 1.4; // how close two of them will stand

function nearIdle(w) {
  let best = null, near = Infinity;
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.HAUL || o.inside || o.carry || o.walking) continue;
    if (o.goal !== 'idle') continue;
    const d = Math.abs(o.x - w.x);
    if (d < 24 || d > ROAM_RANGE * 1.6 || d >= near) continue;
    near = d;
    best = o;
  }
  return best;
}

export function strollTo(w) {
  const spots = [];
  const add = (weight, x) => { if (x != null) for (let i = 0; i < weight; i++) spots.push(x); }

  // a few steps, and nothing more: most of what waiting looks like
  add(5, w.x + (rand() - 0.5) * ROAM_RANGE);
  // over to somebody, and stopping beside them rather than on them
  const mate = nearIdle(w);
  add(4, mate ? mate.x + Math.sign(w.x - mate.x) * ROAM_ELBOW : null);
  // and the things in this yard worth going and looking at
  add(2, rockLeft() - ROCK_CLEAR - WORKER * 2);
  add(2, pit.x - WORKER * 3);
  // The gang's hut, once there is one: a building nobody drifts past reads as
  // scenery.
  add(2, S.shackOpen ? shack.x + shack.w + WORKER : null);

  const lo = yardLeft(), hi = pit.x - WORKER;
  return Math.max(lo, Math.min(hi, spots[Math.floor(rand() * spots.length)]));
}

// Nobody stands inside anybody: two idlers on the same spot drift apart.
export function elbowIdle(w) {
  for (const o of S.workers) {
    if (o === w || o.type !== TYPE.HAUL || o.inside || o.goal !== 'idle') continue;
    const d = o.x - w.x;
    if (Math.abs(d) >= ROAM_ELBOW) continue;
    w.x -= Math.sign(d || 1) * 0.25 * frames();
    return;
  }
}
