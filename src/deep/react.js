// A creature's reaction to a click, read off its table (FAUNA_REACT for the
// zones' kinds, FLOW_REACT for the stream's eight): the pose it holds `s`
// seconds after the click. Pure, so the drawing, the report and the checks
// all ask the same question and get the same answer; who is reacting, and
// since when, is the caller's (deep/fauna.js, deep/flow.js).

import { FAUNA_STARTLE, FAUNA_SILT } from '../config.js';

// The held clock: a pose changes on the startle's beat and holds between,
// the way every reaction in the mock is drawn.
const RATE = FAUNA_STARTLE.rate;
export const held = s => Math.floor(s * RATE + 1e-6) / RATE;
export const STEP = 1 / RATE;

// Straight between keys, held past both ends; a second key at the same
// second is a jump.
function lin(pts, s, round) {
  let v = pts[pts.length - 1][1];
  if (s <= pts[0][0]) v = pts[0][1];
  else for (let i = 1; i < pts.length; i++) {
    if (s < pts[i][0]) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i];
      v = v0 + (v1 - v0) * (s - t0) / (t1 - t0);
      break;
    }
  }
  return round ? Math.round(v) : v;
}
// The value from its key on; before the first, and on a null, nothing.
function from(pts, s) {
  if (!pts) return undefined;
  let v;
  for (const [k, x] of pts) { if (s >= k) v = x; else break; }
  return v == null ? undefined : v;
}
// The seconds a quickened clock has run ahead by `s`: each stretch's pace
// less one, over the stretch, so the frames speed up and slow down without
// a jump.
function gain(pts, s) {
  let g = 0;
  for (let i = 0; i < pts.length; i++) {
    const [k, m] = pts[i], next = i + 1 < pts.length ? pts[i + 1][0] : Infinity;
    if (s <= k) break;
    g += (m - 1) * (Math.min(s, next) - k);
  }
  return g;
}

// The pose of reaction `R` at `s` seconds after its click, on the held clock.
export function poseAt(R, s) {
  const h = held(s);
  return {
    s: h,
    dx: R.x ? lin(R.x, h, true) : 0,
    dy: R.y ? lin(R.y, h, true) : 0,
    turn: !!from(R.turn, h),
    gain: R.quick ? gain(R.quick, s) : 0,
    pose: from(R.pose, h),
    lights: from(R.lights, h),
    halo: !!from(R.halo, h),
    vflip: !!from(R.vflip, h),
    spacing: R.spacing ? lin(R.spacing, h, false) : 1,
    amp: from(R.amp, h),
    clock: from(R.clock, h),
    knot: from(R.knot, h) || 0,
    mouths: from(R.mouths, h),
    // how long ago each puff of silt was kicked up, those still out
    silt: (R.silt || []).map(k => h - k).filter(a => a >= 0 && a < FAUNA_SILT.last),
  };
}

// Whether a reaction started at `r0` is playing at `t`: one started after
// `t` (a clock that has gone back) is not.
export const playing = (R, r0, t) => r0 != null && r0 >= 0 && t >= r0 && t < r0 + R.end;
