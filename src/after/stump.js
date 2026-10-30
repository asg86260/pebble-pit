// The stump, F3a-1 "the earth gives" (DESIGN.md, "Act 3's grove, rebuilt",
// call 10 and track C).
//
// A felled tree leaves its stump, one whole log block, held in the ground by
// three roots. It comes out a root at a time, by the same rule whoever pulls:
// held up past the strain height (GESTURE_STRAIN_LIFT), a root gives every
// GESTURE_STRAIN_S of strain (`strainStep`), and with the last it is free and
// comes out as a log (grove.js, `digStump`) -- straight into the hand that
// holds it (`intoHand`, through the one hand's `holdUnit`) or into the
// woodcutter's arms (`pullStep`), never set down somewhere first.
//
// The hand's pull is the gesture's (after/gestures.js, the stump's DEF); the
// woodcutter's, once stump removal is bought, is a run of beats on its own
// body (`w.pull`): it walks to the stump's shack side, takes hold, heaves the
// stump up to the root's height, leans back while the root strains, and
// after each snap's held jerk heaves again; the last root out, it swings the
// stump-log up onto its head and goes home with it as with any log
// (bodies.js, `gather`). The beats are kept on the body, so a reload mid-pull
// stands it straining where it was.
//
// Each snap is remembered where it was made -- `snap` (the act's clock),
// `snapK` (the root) and `snapI` (the plot), on the gesture's record or the
// body's pull -- so the drawing (render/after/stump.js) holds the jerk and
// throws the dirt as a pure function of when it happened.

import { S } from '../state.js';
import { P, AFTER_TREE, AFTER_DIG_CLICKS, AFTER_PULL, GESTURE_STRAIN_LIFT, GESTURE_STRAIN_S, GESTURE_STUMP_MAX, STUMP_HOLD_EASE, STUMP_JERK_S } from '../config.js';
import { stumped, standing, digStump, layGood } from './grove.js';
import { stumpsOn } from './levels.js';
import { plotX, groundOf, floorAt, AP } from './place.js';
import { walk } from './util.js';
import { push, isEmpty } from '../carry.js';
import { holdUnit } from '../hands.js';

const ease = u => u * u * (3 - 2 * u);
const clamp01 = v => Math.max(0, Math.min(1, v));
const T = () => S.after.t;

// A stump that can be pulled now: standing whole, its tree down and its
// crown done breaking (until then the plot is the fall's to draw).
export const pullable = p => !!p && stumped(p) && p.fell == null;

// --- the strain, the hand's and the woodcutter's alike ----------------------------------
// A record `r` with a `strain` (seconds) one frame on: held (`held`) with the
// stump up past the strain height (`lift` px), the strain builds; let go or
// down, it is lost. True on the frame a root gives, the strain spent.
export function strainStep(r, dt, held, lift) {
  if (!held || lift < GESTURE_STRAIN_LIFT) { r.strain = 0; return false; }
  r.strain += dt;
  if (r.strain < GESTURE_STRAIN_S) return false;
  r.strain = 0;
  return true;
}
// The root `k` of plot i snapped now, remembered on `r` for the drawing.
export function snapRoot(r, i, k) { r.snap = T(); r.snapK = k; r.snapI = i; }

// --- the hand --------------------------------------------------------------------------
// Where the stump of plot i is, lifted `lift` px: its block's middle.
function stumpMid(i, lift) {
  const { c0, w, stump: h } = AFTER_TREE;
  return { x: plotX(i) + (c0 + w / 2) * AP, y: groundOf('grove') - h * AP / 2 - lift };
}
// The stump-log of plot i, lifted `lift` px, into the hand: held from where
// it came out (hands.js, `holdUnit`), so it is never anywhere it was not, and
// remembered on `r` so it swings in to hang off the pointer (`settleHeld`).
// A hand that cannot take it (full of another kind) lets it fall where it
// came out, as a log let go there would.
export const intoHand = (r, i, lift) => v => {
  const m = holdUnit(v, stumpMid(i, lift));
  if (m) { r.mote = m; return; }
  const { c0, stump: h } = AFTER_TREE;
  layGood('log', plotX(i) + c0 * AP, groundOf('grove') - h * AP - lift, v);
};
// The stump in the hand swung in, from the distance it came out at to the
// one a log hangs at off the pointer (its mote's `home`), smoothly.
export function settleHeld(r, dt) {
  const m = r.mote;
  if (!m) return;
  if (!S.motes.includes(m)) { r.mote = null; return; }
  m.d += (m.home - m.d) * Math.min(1, dt * STUMP_HOLD_EASE);
}

// --- the woodcutter --------------------------------------------------------------------
// Where a woodcutter stands to pull plot i's stump (its x, the body's left
// edge a cell left of it): AFTER_PULL.stand cells off the stump's side toward
// the shack, the side the tree did not fall to.
export const pullX = i => plotX(i) + (AFTER_TREE.c0 + AFTER_TREE.w + AFTER_PULL.stand) * AP + P;
// The height root k holds the stump at, px: the strain height for the first,
// the hand's most for the last, so the stump comes up a step a root.
export const rootLift = k => GESTURE_STRAIN_LIFT + (GESTURE_STUMP_MAX - GESTURE_STRAIN_LIFT) * Math.min(1, k / Math.max(1, AFTER_DIG_CLICKS - 1));
// The beats in which the woodcutter has hold of the stump.
export const PULL_HOLDS = ['grip', 'heave', 'strain', 'jerk', 'hoist'];
// A stump no other woodcutter is pulling, nearest `w`.
function freeStump(w) {
  const a = S.after;
  let best = null;
  a.plots.forEach((p, k) => {
    if (!pullable(p) || a.bodies.some(o => o !== w && o.dig && o.target === k)) return;
    if (best == null || Math.abs(pullX(k) - w.x) < Math.abs(pullX(best) - w.x)) best = k;
  });
  return best;
}
// A step of the walk to x along the floor, down to it first from wherever
// the body is off it (the crowd's rows). True once there.
function toward(w, x, dt) {
  if (Math.abs(w.y - floorAt(w.x)) >= 0.5) { walk(w, w.x, floorAt(w.x), dt); return false; }
  const there = walk(w, x, w.y, dt);
  w.y = floorAt(w.x);
  return there;
}
// A woodcutter's frame at a stump, once stump removal is bought: true while
// the pull has the body (bodies.js asks it each frame, after the logs lying
// have been carried in). It starts only with empty arms and never off a tree
// the body is sawing; the stump is claimed (`w.dig`, `w.target`) so no two
// pull one.
export function pullStep(w, dt) {
  const a = S.after, plots = a.plots;
  let r = w.pull, i = w.dig && w.target != null && r && r.i === w.target && pullable(plots[w.target]) ? w.target : null;
  if (i == null) {
    if (w.dig) { w.dig = false; w.target = null; if (r) r.ph = 'done'; }
    if (!stumpsOn() || !isEmpty(w)) return false;
    const was = w.target != null ? plots[w.target] : null;
    if (was && standing(was)) return false;
    i = freeStump(w);
    if (i == null) return false;
    Object.assign(w, { target: i, dig: true, t: 0, at: null });
    // the last snap's record kept, so its dirt still falls as the next begins
    w.pull = r = { i, ph: 'walk', t: 0, lift: 0, from: 0, strain: 0, lean: 0, snap: r ? r.snap : null, snapK: r ? r.snapK : null, snapI: r ? r.snapI : null };
  }
  const p = plots[i], x = pullX(i), L = AFTER_PULL;
  // Taken off the stump by something else (the logs lying, carried in
  // first): it lets go, and walks back to take hold again.
  if (r.ph !== 'walk' && Math.abs(w.x - x - r.lean) > 1) Object.assign(r, { ph: 'walk', lift: 0, strain: 0, lean: 0 });
  if (r.ph === 'walk') {
    if (!toward(w, x, dt)) return true;
    Object.assign(r, { ph: 'grip', t: 0 });
  }
  w.face = -1;
  r.t += dt;
  if (r.ph === 'grip') {
    if (r.t >= L.grip) Object.assign(r, { ph: 'heave', t: 0, from: r.lift });
  } else if (r.ph === 'heave') {
    // up to the root's height, straightening out of the last lean
    const u = ease(clamp01(r.t / L.heave));
    r.lift = r.from + (rootLift(p.dug) - r.from) * u;
    r.lean = r.lean * (1 - u);
    if (r.t >= L.heave) Object.assign(r, { ph: 'strain', t: 0, strain: 0, lean: 0 });
  } else if (r.ph === 'strain') {
    // leaning back into it as the strain builds: the hand's rule, held
    const gave = strainStep(r, dt, true, r.lift);
    r.lean = (gave ? 1 : clamp01(r.strain / GESTURE_STRAIN_S)) * L.lean * AP;
    if (gave) {
      snapRoot(r, i, p.dug);
      // The last root: the stump free, swung up onto the head before it is
      // counted out of the ground (`hoist`), so it never jumps there.
      if (p.dug + 1 >= AFTER_DIG_CLICKS) Object.assign(r, { ph: 'hoist', t: 0 });
      else { digStump(i, false); Object.assign(r, { ph: 'jerk', t: 0 }); }
    }
  } else if (r.ph === 'jerk') {
    if (r.t >= STUMP_JERK_S) Object.assign(r, { ph: 'heave', t: 0, from: r.lift });
  } else if (r.ph === 'hoist') {
    r.lean = r.lean * (1 - clamp01(r.t / L.hoist));
    if (r.t >= L.hoist) {
      digStump(i, false, v => push(w, v));
      Object.assign(r, { ph: 'done', lean: 0, lift: 0, strain: 0 });
      w.dig = false; w.target = null;
    }
  }
  w.x = x + r.lean;
  return true;
}
