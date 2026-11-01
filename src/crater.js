// The crater the house's rock knocks into the ground (the owner's G,
// 2026-10-31: "slight crater"): a shallow bowl round the ruin that bodies
// walk down into and out of, the rock sitting on its floor. It is the
// ground itself, not a drawing over it: `groundTop` (route.js) dips by
// `craterDip`, so every way, every stance and `feetOn` walk the bowl, and the
// ground line follows it (render/ground.js).
//
// Nothing about it is saved: it stands while the house lies fallen
// (`S.acts.house`, saved by actbeats.js), and its depth is read off the rock
// still on it (`rockRowsLeft`, mansion.js), so the bowl fills a cell at a
// time as the mansion's builders break the rock up for its blocks and is
// level ground by the time the last row goes and the mansion rises.
//
// The bowl in cells off the house's middle (ACT_CRATER, config/acts.js):
// flat across the rock's width, the rock's own footing, and sloping up to its
// lips `half` cells out; each column's depth whole cells, so its outline
// steps on the grid.

// REVIEW act-3-the-intro-built
import { S } from './state.js';
import { P, ACT_CRATER, ACT_ROCK_W, ACT_ROCK_H, FINALE_END_CELLS, FINALE_DOOR_CELL, FINALE_HOUSE_W } from './config.js';

// How many rows of the rock still lie in it (mansion.js, `rockRowsLeft`),
// handed over by mansion.js as it loads: the ground (route.js) is read by
// everything from the first module on, and asking mansion.js for it
// directly would load the act's whole story ahead of the yard.
let rowsLeft = () => ACT_ROCK_H; // cache: wired once at load (`craterRows`), never changed after
export const craterRows = fn => { rowsLeft = fn; };
// The house's middle, where the rock came down: the bowl's middle line.
export const craterMid = () => (FINALE_END_CELLS - FINALE_DOOR_CELL) * P + FINALE_HOUSE_W * P / 2;
// How deep the bowl is under the rock, in cells, for `rows` of rock left on
// it: the whole of ACT_CRATER.depth under the whole rock, less as it goes.
export const craterDepth = (rows = rowsLeft()) => ACT_CRATER.depth * Math.max(0, Math.min(1, rows / ACT_ROCK_H));
// The depth under column `i` (the cell from the middle line `i` cells over),
// in whole cells, of a bowl `deep` cells deep under the rock.
export function craterCol(i, deep) {
  const m = Math.abs(i + 0.5), flat = ACT_ROCK_W / 2;
  const k = m <= flat ? 1 : Math.max(0, 1 - (m - flat) / (ACT_CRATER.half - flat));
  return Math.round(deep * k);
}

// The bowl as the frame has it: its depth under the rock, worked out once a
// tick (`rockRowsLeft` walks the mansion's pieces, and the ground is asked a
// hundred times a frame), or 0 with no fallen house.
let deepFor = -1, deepNow = 0; // cache: the bowl's depth, for the tick in `deepFor`
export function craterNow() {
  if (!S.acts || S.acts.house !== 'fallen') return 0;
  if (deepFor !== S.tick) { deepFor = S.tick; deepNow = craterDepth(); }
  return deepNow;
}

// How far the ground lies under the yard's ground line at x: the bowl's
// depth there, in world pixels, or 0 off it. A range compare and a lookup:
// `groundTop` asks it for every cell a body stands on.
export function craterDip(x) {
  const deep = craterNow();
  if (deep <= 0) return 0;
  const c = craterMid(), half = ACT_CRATER.half * P;
  if (x < c - half || x >= c + half) return 0;
  return craterCol(Math.floor((x - c) / P), deep) * P;
}
