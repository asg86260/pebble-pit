// Where the deep is, and where everything in it stands.
//
// The deep lies under the world, below the yard's bottom edge: a body that
// goes down the shaft arrives somewhere real, and every position in the deep
// is an ordinary world position that the route, the camera and the drawing
// all read the same way. Nothing here moves on its own except the serpent's
// body, which is a function of the clock and so needs nothing saved.
//
// Track SERPENT owns this file (docs/wave-serpent.md); every other track reads
// it.

import { S, pit } from '../state.js';
import { P, DEEP_GAP, DEEP_H, DEEP_LEFT, DEEP_W, DEEP_MOUTH, DEEP_SPOTS,
         DEEP_STAND_W, DEEP_STAND_H, COIL_SEGS, COIL_X0, COIL_X1, COIL_Y, COIL_AMP,
         COIL_WAVES, COIL_SWAY_MS, BELLY_AT } from '../config.js';

const snap = v => Math.round(v / P) * P;

export const deepTop = () => snap(S.worldH + DEEP_GAP);
export const deepFloor = () => deepTop() + DEEP_H;
export const deepX0 = () => snap(Math.max(0, pit.x - DEEP_LEFT));
export const deepX1 = () => deepX0() + DEEP_W;
export const deepRect = () => ({ x: deepX0(), y: deepTop(), w: DEEP_W, h: DEEP_H });
export const inDeep = (x, y) => y >= deepTop() && y <= deepFloor() && x >= deepX0() && x <= deepX1();

// The shaft: where a body steps off the plank into the drowned pit, and where
// it comes up again. The same x at the top and at the bottom, so the way down
// is straight.
export const mouthX = () => snap(pit.x + DEEP_MOUTH);

// A station's middle, on the floor, and the rect you stand over to open its
// board.
export const spotX = key => snap(deepX0() + DEEP_SPOTS[key] * DEEP_W);
export const standOf = key => ({ x: spotX(key) - DEEP_STAND_W / 2, y: deepFloor() - DEEP_STAND_H,
                                 w: DEEP_STAND_W, h: DEEP_STAND_H });

// The serpent's body: segment `i` of COIL_SEGS, head (0) to tail, at time `t`
// in ms. A travelling wave along a line across the deep, snapped to the cell
// grid so it never draws a hairline.
export function coilAt(i, t) {
  const k = i / (COIL_SEGS - 1);
  const x = deepX0() + (COIL_X0 + (COIL_X1 - COIL_X0) * k) * DEEP_W;
  const y = deepTop() + COIL_Y * DEEP_H
          + COIL_AMP * Math.sin(2 * Math.PI * (k * COIL_WAVES - t / COIL_SWAY_MS));
  return { x: snap(x), y: snap(y) };
}
export const bellySeg = () => Math.round(BELLY_AT * (COIL_SEGS - 1));
export const bellyAt = t => coilAt(bellySeg(), t);

// The segment nearest a point, and how far it is: the one question a click, a
// lance and a grenade all ask of the body.
export function nearestSeg(x, y, t) {
  let best = 0, d = Infinity;
  for (let i = 0; i < COIL_SEGS; i++) {
    const p = coilAt(i, t);
    const e = Math.hypot(p.x - x, p.y - y);
    if (e < d) { d = e; best = i; }
  }
  return { seg: best, d };
}
