// A creature's reaction to a click, read off its table (FAUNA_REACT): the
// pose it holds `s` seconds after the click. Pure, so the drawing, the report
// and the checks all ask the same question and get the same answer; who is
// reacting, and since when, is the caller's (deep/fauna.js).

import { FAUNA_SILT, FAUNA_REACT_MOTION } from '../config.js';
import { smoothstep as smooth } from '../motion.js';


// Through the keys on a monotone cubic: still at the first and the last key
// and at every key where the motion stops or turns back, carried through at
// speed where it goes on the same way, and never past a key's value, so a
// held stretch holds. Held before the first key and after the last.
function curve(pts, s) {
  const n = pts.length;
  if (s <= pts[0][0]) return pts[0][1];
  if (s >= pts[n - 1][0]) return pts[n - 1][1];
  let i = 1;
  while (s >= pts[i][0]) i++;
  const [t0, v0] = pts[i - 1], [t1, v1] = pts[i], h = t1 - t0;
  const slope = j => (j < 1 || j >= n ? 0 : (pts[j][1] - pts[j - 1][1]) / (pts[j][0] - pts[j - 1][0] || Infinity));
  // the speed through key j: none where either side is still or the sides disagree
  const tan = j => {
    if (j <= 0 || j >= n - 1) return 0;
    const a = slope(j), b = slope(j + 1);
    return a * b <= 0 ? 0 : 2 * a * b / (a + b);
  };
  const u = (s - t0) / h, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * tan(i - 1)
    + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * tan(i);
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

// How much of the reaction's offset is laid over the path at `s`: none at the
// click and none at the end, eased between, so it starts and ends on it.
export function blendAt(R, s) {
  const B = FAUNA_REACT_MOTION.blend;
  return smooth(s / B) * smooth((R.end - s) / B);
}

// The pose of reaction `R` at `s` seconds after its click, at whatever moment
// it is asked: the offset in whole cells, the drawing's holds on their keys.
export function poseAt(R, s) {
  const k = blendAt(R, s);
  return {
    s,
    dx: R.x ? Math.round(curve(R.x, s) * k) : 0,
    dy: R.y ? Math.round(curve(R.y, s) * k) : 0,
    turn: !!from(R.turn, s),
    gain: R.quick ? gain(R.quick, s) : 0,
    pose: from(R.pose, s),
    lights: from(R.lights, s),
    halo: !!from(R.halo, s),
    vflip: !!from(R.vflip, s),
    spacing: R.spacing ? 1 + (curve(R.spacing, s) - 1) * k : 1,
    amp: from(R.amp, s),
    clock: from(R.clock, s),
    knot: R.knot ? Math.max(0, curve(R.knot, s) * k) : 0,
    mouths: from(R.mouths, s),
    smear: !!from(R.smear, s),
    // how long ago each puff of silt was kicked up, those still out
    silt: (R.silt || []).map(k0 => s - k0).filter(a => a >= 0 && a < FAUNA_SILT.last),
  };
}

// How far ahead a reaction leaves its creature's frame clock: what its
// quickened stretch gained. The caller carries it on after the end, so the
// drawing goes on from where the reaction left it instead of snapping back.
export const leadOf = R => (R.quick ? gain(R.quick, R.end) : 0);

// Whether a reaction started at `r0` is playing at `t`: one started after
// `t` (a clock that has gone back) is not.
export const playing = (R, r0, t) => r0 != null && r0 >= 0 && t >= r0 && t < r0 + R.end;
