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
         COIL_SEGS, COIL_X0, COIL_X1, COIL_Y, COIL_AMP,
         COIL_WAVES, COIL_SWAY_MS, SPLIT_LENGTHS, SPLIT_WRITHE, SPLIT_WRITHE_MS, BELLY_AT, CRUSHER_W, CRUSHER_H, HOPPER_W, HOPPER_LIP,
         GATHER_TOSS_FROM, POD_W, POD_H, POD_GAP, POD_COLS } from '../config.js';
import { SPRITES } from './sprites.js';

const snap = v => Math.round(v / P) * P;

export const deepTop = () => snap(S.worldH + DEEP_GAP);
export const deepFloor = () => deepTop() + DEEP_H;
export const deepX0 = () => snap(Math.max(0, pit.x - DEEP_LEFT));
export const deepX1 = () => deepX0() + DEEP_W;
export const deepRect = () => ({ x: deepX0(), y: deepTop(), w: DEEP_W, h: DEEP_H });
// The ground a thing at world height y stands on: the deep's floor for
// anything down there, the yard's ground line for anything else. What a bar,
// a fence or a mark is hung off, so each is drawn in the half its site is in.
export const groundOf = y => (y != null && y > deepTop() ? deepFloor() : S.groundY);
export const inDeep = (x, y) => y >= deepTop() && y <= deepFloor() && x >= deepX0() && x <= deepX1();

// The shaft: where a body steps off the plank into the drowned pit, and where
// it comes up again. The same x at the top and at the bottom, so the way down
// is straight.
export const mouthX = () => snap(pit.x + DEEP_MOUTH);

// A station's middle, on the floor.
export const spotX = key => snap(deepX0() + DEEP_SPOTS[key] * DEEP_W);

// The drawn cells' extent inside a sprite's grid. A sprite's blank rows and
// columns are room for its dome, not part of the station.
const inked = new Map();
function inkOf(key) {
  if (inked.has(key)) return inked.get(key);
  const rows = SPRITES[key];
  let c0 = rows[0].length, c1 = -1, r0 = rows.length, r1 = -1;
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    c0 = Math.min(c0, c); c1 = Math.max(c1, c); r0 = Math.min(r0, r); r1 = Math.max(r1, r);
  }));
  const ink = { c0, r0, cols: c1 - c0 + 1, rows: r1 - r0 + 1 };
  inked.set(key, ink);
  return ink;
}

// Where a station's sprite is painted: its whole grid, standing on the floor,
// with the DRAWING's middle on its spot rather than the grid's, so a blank
// column more on one side of a sprite moves nothing.
export function spriteRect(key) {
  const rows = SPRITES[key], ink = inkOf(key);
  const w = rows[0].length * P, h = rows.length * P;
  return { x: snap(spotX(key) - (ink.c0 + ink.cols / 2) * P), y: deepFloor() - h, w, h };
}

// The ground a station stands on: the station as drawn, so the pointer, the
// fence round its door and the stack of works over it all answer to the
// picture rather than to the dome round it.
export function standOf(key) {
  const s = spriteRect(key), ink = inkOf(key);
  return { x: s.x + ink.c0 * P, y: s.y + ink.r0 * P, w: ink.cols * P, h: ink.rows * P };
}

// The crusher at the deep's left end, standing on the floor, and the hopper
// across its top: the purse's mouth (DESIGN.md, "The crusher"). A scale is
// taken once it is inside the mouth and HOPPER_LIP below its rim.
export const crusherRect = () => ({ x: snap(spotX('crusher') - CRUSHER_W / 2), y: deepFloor() - CRUSHER_H,
                                     w: CRUSHER_W, h: CRUSHER_H });
export const hopperRect = () => {
  const c = crusherRect();
  return { x: snap(c.x + (CRUSHER_W - HOPPER_W) / 2), y: c.y, w: HOPPER_W, h: HOPPER_LIP };
};
export const inHopper = (x, y) => {
  const h = hopperRect();
  return x >= h.x && x < h.x + h.w && y >= h.y + h.h && y < h.y + CRUSHER_H / 2;
};
// Pod `i`, bottom course first and left to right within a course, standing
// on the deep's floor at the pods' spot; and the ground the stack stands on,
// for the build going up there and the pointer.
export function podAt(i) {
  const across = POD_COLS * (POD_W + POD_GAP) - POD_GAP;
  const left = snap(spotX('pods') - across / 2);
  const col = i % POD_COLS, row = Math.floor(i / POD_COLS);
  return { x: left + col * (POD_W + POD_GAP), y: deepFloor() - (row + 1) * (POD_H + POD_GAP) + POD_GAP,
           w: POD_W, h: POD_H };
}
export const podsRect = () => {
  const a = podAt(0), top = podAt(Math.max(0, S.pods)).y;
  const across = POD_COLS * (POD_W + POD_GAP) - POD_GAP;
  return { x: a.x, y: top, w: across, h: deepFloor() - top };
};

// Where a gatherer stands to toss a load in: on the floor, beside the
// crusher on the side the rest of the deep is.
export const tossX = () => crusherRect().x + CRUSHER_W + GATHER_TOSS_FROM;

// The serpent's centerline at `u` segments from the head (fractional), at
// time `t` in ms: a travelling wave along a line across the deep, and in the
// splitting stage a thrash running down it on top. Unsnapped, so the body
// can be laid smoothly along it; everything that asks where a segment is
// uses `coilAt`, the same point on the grid.
export function coilLine(u, t) {
  const k = u / (COIL_SEGS - 1);
  const x = deepX0() + (COIL_X0 + (COIL_X1 - COIL_X0) * k) * DEEP_W;
  let y = deepTop() + COIL_Y * DEEP_H
        + COIL_AMP * Math.sin(2 * Math.PI * (k * COIL_WAVES - t / COIL_SWAY_MS));
  if (S.serpentStage === 2 && !S.serpentFreed)
    y += SPLIT_WRITHE * Math.sin(2 * Math.PI * (k * SPLIT_LENGTHS - t / SPLIT_WRITHE_MS));
  return { x, y };
}
// Segment `i`, on the cell grid.
export function coilAt(i, t) {
  const p = coilLine(i, t);
  return { x: snap(p.x), y: snap(p.y) };
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
