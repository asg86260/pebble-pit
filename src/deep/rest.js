// The deep's crew at rest (DESIGN.md, "The deep's crew at rest", D of the
// mocks): a body whose station has nothing for it strolls, floats or hops
// about its station's ground, a stroll most often, with a rest between.
//
// The rest moves the body's real x and y, so the body is where it is drawn,
// and it writes no destination the work must undo: the moment the station
// wants the body again its own step takes over and `swim` carries it on a
// straight line from wherever the rest left it, mid-air included.
//
// What the body is in the middle of lives on `w.lull`, which no save keeps
// (`KEEPS` has `x` and `y` and nothing of this). A lull not carried on from
// the frame before -- the body was called to work, or read back from a save
// -- is over, and a body found off the floor with none starts a slow sink
// from where it is, which reads as the float ending rather than a snap.

import { S } from '../state.js';
import { P, WORKER, CRUSHER_W, DEEP_STAND_W, DEEP_SURFACE,
         DEEP_REST_WALK, DEEP_REST_BOB, DEEP_REST_STRIDE, DEEP_REST_REACH, DEEP_REST_MS,
         DEEP_REST_MORE_MS, DEEP_REST_MIX, DEEP_REST_RISE, DEEP_REST_RISE_MS, DEEP_REST_HANG_MS,
         DEEP_REST_SWAY, DEEP_REST_SWAY_MS, DEEP_REST_CURRENT, DEEP_REST_DRIFT, DEEP_REST_PULL,
         DEEP_REST_DRAG, DEEP_REST_SOFT, DEEP_REST_SINK, DEEP_REST_HOP, DEEP_REST_HOP_REACH,
         DEEP_REST_HOPS, DEEP_REST_CROUCH_MS, DEEP_REST_HEADROOM, DEEP_REST_SILT } from '../config.js';
import { frames } from '../clock.js';
import { rand } from '../rng.js';
import { spawnGrit } from '../grit.js';
import { amble } from '../crew/idle.js';
import { deepTop, deepFloor, deepX0, deepX1, spotX, tossX, crusherRect, inDeep } from './place.js';
import { current } from './scales.js';
import { mid, feet, swim, afloat } from './arms.js';

const between = ([lo, hi]) => lo + rand() * (hi - lo);
const ease = k => k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;

// A station's ground: DEEP_STAND_W about its middle, inside the deep. `at` is
// a key of DEEP_SPOTS, or the middle of a fighter's station as an x: the
// party's stations stand at floor slots, not at named spots. The crusher's
// hands wait at its side (`tossX`), not in its middle, so their ground is
// the same width run out from that side rather than across the machine.
export function restGround(at) {
  const crusher = at === 'crusher';
  const post = (crusher ? tossX() : typeof at === 'number' ? at : spotX(at)) - WORKER / 2;
  const lo = crusher ? crusherRect().x + CRUSHER_W : post - DEEP_STAND_W / 2;
  return {
    post,
    lo: Math.max(lo, deepX0() + P),
    hi: Math.min(lo + DEEP_STAND_W, deepX1() - P - WORKER)
  };
}

// The highest a resting body's top goes: well under the water line, so no
// float reaches the surface's clip.
export const restCeiling = () => deepTop() + DEEP_SURFACE + DEEP_REST_HEADROOM;

// Somewhere on the ground within `reach` of where it is: a few tries, and the
// one furthest from every other body down there, so they spread rather than
// bunch.
function spotFor(w, g, reach) {
  let best = w.x, far = -1;
  for (let i = 0; i < 6; i++) {
    const x = Math.max(g.lo, Math.min(g.hi, w.x + (rand() * 2 - 1) * reach));
    let near = Infinity;
    for (const o of S.workers) {
      if (o === w || !inDeep(mid(o), o.y + WORKER - 1)) continue;
      near = Math.min(near, Math.abs((o.lull?.tx ?? o.x) - x));
    }
    if (near > far) { far = near; best = x; }
  }
  return best;
}

const still = (w, t) => ({ act: 'still', until: t + DEEP_REST_MS + rand() * DEEP_REST_MORE_MS });

function jump(w, r, g) {
  r.tx = spotFor(w, g, DEEP_REST_HOP_REACH);
  const up = between(DEEP_REST_HOP);
  r.vy = -up;
  // Roughly a hop's time in the water, so it comes down near where it aimed.
  r.vx = (r.tx - w.x) / (up / DEEP_REST_PULL * 1.6);
  if (r.vx) w.face = r.vx > 0 ? 1 : -1;
}

// What it does once its rest is up: one of the three, by DEEP_REST_MIX.
function pick(w, g, t) {
  const { walk, float, hop } = DEEP_REST_MIX;
  const k = rand() * (walk + float + hop);
  if (k < walk) return { act: 'walk', tx: spotFor(w, g, (g.hi - g.lo) * DEEP_REST_REACH), stride: 0 };
  if (k < walk + float) {
    return { act: 'rise', y0: w.y, top: Math.max(restCeiling(), feet() - P * Math.round(between(DEEP_REST_RISE))),
             t0: t, dur: between(DEEP_REST_RISE_MS), drift: (rand() * 2 - 1) * DEEP_REST_DRIFT };
  }
  const r = { act: 'hop', hops: 1 + Math.floor(rand() * DEEP_REST_HOPS) };
  jump(w, r, g);
  return r;
}

// Down on the floor: a puff of the bed's silt where it lands (grit.js throws
// silt for anything struck in the deep).
function land(w) {
  w.y = feet();
  spawnGrit(mid(w), deepFloor() - P, { n: DEEP_REST_SILT, floor: deepFloor() });
}

// One frame of a body at rest by station `at` (a key or an x, as
// `restGround`). `pace` is the swim that takes it back onto its ground if it
// is off it.
export function rest(w, at, c, pace) {
  const g = restGround(at);
  const t = c.now, f = frames();
  let r = w.lull;
  if (r && !(r.tick >= S.tick - 1)) r = null;
  if (!r) {
    w.pace = 0;
    // Off its ground -- just down the shaft, or back from work further out:
    // to its place on the floor first, the way it always went.
    if (w.x < g.lo - 0.5 || w.x > g.hi + 0.5) { w.lull = null; swim(w, g.post, feet(), pace); return; }
    r = w.y < feet() - 0.5 ? { act: 'sink', vy: 0 } : { act: 'still', until: t + rand() * DEEP_REST_MS };
  }
  r.tick = S.tick;
  const push = current(t) * DEEP_REST_CURRENT;
  switch (r.act) {
    case 'still':
      w.y = feet();
      if (t >= r.until) r = pick(w, g, t);
      break;
    case 'walk': {
      const was = w.x;
      const there = amble(w, r.tx, DEEP_REST_WALK);
      if (w.x !== was) w.face = w.x > was ? 1 : -1;
      // The bob grows and dies with the pace, so it starts and stops with the stroll.
      r.stride += Math.abs(w.x - was) / DEEP_REST_STRIDE;
      w.y = feet() - Math.abs(Math.sin(r.stride * Math.PI)) * DEEP_REST_BOB * Math.min(1, w.pace / DEEP_REST_WALK);
      if (there) { w.y = feet(); r = still(w, t); }
      break;
    }
    case 'rise': {
      w.x += (push + r.drift) * f;
      const k = Math.min(1, (t - r.t0) / r.dur);
      w.y = r.y0 + (r.top - r.y0) * ease(k);
      if (k >= 1) r = { act: 'hang', top: r.top, drift: r.drift, t0: t, dur: between(DEEP_REST_HANG_MS) };
      break;
    }
    case 'hang':
      w.x += (push + r.drift) * f;
      w.y = r.top + Math.sin((t - r.t0) / DEEP_REST_SWAY_MS * Math.PI * 2) * DEEP_REST_SWAY;
      if (t - r.t0 > r.dur) r = { act: 'sink', vy: 0 };
      break;
    case 'sink':
      w.x += push * f;
      r.vy = (r.vy + DEEP_REST_PULL * DEEP_REST_SINK * f) * DEEP_REST_DRAG ** f;
      // and it comes in soft: never faster than the floor's distance allows
      r.vy = Math.min(r.vy, DEEP_REST_SOFT[0] + (feet() - w.y) * DEEP_REST_SOFT[1]);
      w.y += r.vy * f;
      if (w.y >= feet() - 0.3) { land(w); r = still(w, t); }
      break;
    case 'hop':
      r.vy = (r.vy + DEEP_REST_PULL * f) * DEEP_REST_DRAG ** f;
      w.x += r.vx * f;
      w.y += r.vy * f;
      if (w.y < restCeiling()) { w.y = restCeiling(); r.vy = Math.max(0, r.vy); }
      if (w.y >= feet() && r.vy > 0) {
        land(w);
        r = --r.hops > 0 ? { act: 'crouch', hops: r.hops, until: t + between(DEEP_REST_CROUCH_MS) } : still(w, t);
      }
      break;
    case 'crouch':
      w.y = feet();
      if (t >= r.until) { r.act = 'hop'; jump(w, r, g); }
      break;
  }
  r.tick = S.tick;
  w.lull = r;
  // Held to its ground, over the floor and under the ceiling on every frame.
  w.x = Math.max(g.lo, Math.min(g.hi, w.x));
  w.y = Math.max(restCeiling(), Math.min(feet(), w.y));
  afloat(w);
}
