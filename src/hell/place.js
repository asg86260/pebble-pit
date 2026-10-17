// Where hell is, and where everything in it stands (DESIGN.md, "Acts 3 and
// 4", act 4, "The place: a run of chambers down to the cage room").
//
// Under the deep's floor, so the way down -- the pit, the abyss, the deep and
// through its floor -- arrives somewhere real and every position in hell is an
// ordinary world position, the deep's rule (deep/place.js) carried one place
// further down. The run of chambers steps down and to the right inside this
// extent, the last chamber's floor on hell's own; every station's spot is a
// function of its chamber here, so the sim, the drawing and the pointer read
// one layout.

import { P, HELL_GAP, HELL_H, HELL_W, HELL_FLOOR_MARGIN, HELL_TIERS,
         HELL_X_IN, CHAMBER_W, CHAMBER_GAP, CHAMBER_H, CHAMBER_STEP, PASS_H, LADDER_AT, FACE_H,
         VENT_AT, FURNACE_AT, FURNACE_W, FURNACE_H, ANVIL_AT, STORE_AT, ROAD_AT, SPOIL_AT,
         BARRIER_IN, BARRIER_W, CAGE_AT, CAGE_W, CAGE_H, CAGE_SPOIL_AT, ROAD_SPAWN_UP } from '../config.js';
import { deepFloor, deepX0 } from '../deep/place.js';
import { S } from '../state.js';

const snap = v => Math.round(v / P) * P;

export const hellTop = () => snap(deepFloor() + HELL_GAP);
export const hellFloor = () => hellTop() + HELL_H;
export const hellX0 = () => deepX0();
export const hellX1 = () => hellX0() + HELL_W;
export const hellRect = () => ({ x: hellX0(), y: hellTop(), w: HELL_W, h: HELL_H });
export const inHell = (x, y) => y >= hellTop() && y <= hellFloor() && x >= hellX0() && x <= hellX1();

// --- the run of chambers -----------------------------------------------------
const N = () => HELL_TIERS.length;
// Chamber i's left wall, right wall, floor and roof, in world px.
export const chamberX0 = i => hellX0() + (HELL_X_IN + i * (CHAMBER_W + CHAMBER_GAP)) * P;
export const chamberX1 = i => chamberX0(i) + CHAMBER_W * P;
export const chamberFloor = i => hellFloor() - (N() - 1 - i) * CHAMBER_STEP * P;
export const chamberRoof = i => chamberFloor(i) - CHAMBER_H * P;
// Which chamber a world x is over, the gap after a chamber counted as its; -1 off the run.
export const chamberAtX = x => {
  const i = Math.floor((x / P - hellX0() / P - HELL_X_IN) / (CHAMBER_W + CHAMBER_GAP));
  return i >= 0 && i < N() ? i : -1;
};
// The middle of a chamber and the gap after it: where the camera holds it,
// the next barrier toward its right edge.
export const chamberFocusX = i => snap((chamberX0(i) + chamberX1(i) + (i < N() - 1 ? CHAMBER_GAP * P : 0)) / 2);

// The ledge in chamber i's left wall (i above nought), where the passage from
// the chamber before comes out, level with that chamber's floor; and the
// ladder down off it.
export const ledgeY = i => chamberFloor(i) - CHAMBER_STEP * P;
export const ladderX = i => chamberX0(i) + LADDER_AT * P;

// --- the stations, by chamber ------------------------------------------------
// The face is the left wall under the ledge, cut back `depth` cells.
export const faceX = (i, depth) => chamberX0(i) - depth * P;
export const faceTop = i => chamberFloor(i) - FACE_H * P;
export const faceStand = (i, depth) => faceX(i, depth) + 2 * P;
export const ventX = i => chamberX0(i) + VENT_AT * P;
export const furnaceBox = i => ({ x: chamberX0(i) + FURNACE_AT * P, y: chamberFloor(i) - FURNACE_H * P,
                                  w: FURNACE_W * P, h: FURNACE_H * P });
export const furnaceStand = i => chamberX0(i) + (FURNACE_AT - 2) * P;
export const anvilX = () => chamberX0(0) + ANVIL_AT * P;
export const storeX = () => chamberX0(0) + STORE_AT * P;
export const roadX = () => chamberX0(0) + ROAD_AT * P;
export const roadTop = () => hellTop() - ROAD_SPAWN_UP * P;
export const spoilX = i => chamberX0(i) + (i < N() - 1 ? SPOIL_AT : CAGE_SPOIL_AT) * P;

// A barrier's block of cells, the passage's full height. The last is the cage,
// standing in its own chamber rather than in a gap.
export const barrierBox = i => i < N() - 1
  ? { x: chamberX1(i) + BARRIER_IN * P, y: chamberFloor(i) - PASS_H * P, w: BARRIER_W * P, h: PASS_H * P }
  : { x: chamberX0(i) + CAGE_AT * P, y: chamberFloor(i) - CAGE_H * P, w: CAGE_W * P, h: CAGE_H * P };
// Where a barrier's gang stands, on its chamber's floor: short of the gap,
// or short of the cage.
export const barrierStand = (i, k = 0) => barrierBox(i).x - (2 + k) * P;

// Where across it the camera opens: over the deepest chamber reached.
export const hellOpenX = () => chamberFocusX(S.hell ? Math.min(S.hell.chamber, N() - 1) : 0);
// The place as the camera reads it (acts.js, `PLACES`).
export const HELL_PLACE = { x0: hellX0, x1: hellX1, top: hellTop, floor: hellFloor, open: hellOpenX,
                            margin: HELL_FLOOR_MARGIN, h: HELL_H };
