// The hole in the ground: what goes in it, what it can hold, and what paying
// takes back out.
//
// The pile is the dust, not a picture of it: one grain is one dust, and the pile
// always shows as much of the hole as will fit in it. `PIT_GRAINS` in config.js
// lists the sizes a grain may be drawn at -- adding finer ones lets the pile
// settle to them as it fills, keeping every grain and only losing resolution.

import { P, PIT_W, PIT_H, PIT_GRAINS, CORE_CELL, SHADES } from './config.js';
import { S, pit } from './state.js';
import { at, put, addGrain, countDust, bottomY, settle } from './grid.js';

// The pit is drawn through a scratch canvas one pixel per grain, blitted up to
// size. A million fillRects a frame is not a drawing routine; one drawImage is.
export const pitPix = document.createElement('canvas');
export const pitPixCtx = pitPix.getContext('2d', { willReadFrequently: true });

// SHADES as packed RGBA, so a grain is one array write
export const SHADE_RGBA = SHADES.map(h => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
});

export function markPit(c, r) {
  if (c < S.pitLo) S.pitLo = c;
  if (c > S.pitHi) S.pitHi = c;
  if (r < S.pitTop || S.pitTop < 0) S.pitTop = r;
  if (r > S.pitBot) S.pitBot = r;
}

export function setPitGrain(step) {
  S.pitStep = Math.max(0, Math.min(PIT_GRAINS.length - 1, step));
  pit.p = PIT_GRAINS[S.pitStep];
  pit.cols = PIT_W / pit.p;
  pit.rows = PIT_H / pit.p;
  pit.grid = new Uint8Array(pit.cols * pit.rows);
  S.pitPainted = false;
}

// nothing bars the pile, it just fills; it lies flat rather than heaping; and
// every change is told to the painter
export function wirePit() {
  pit.blocked = null;
  pit.repose = false;
  pit.onPut = markPit;
}

// A million cells is too many to walk every frame, so the pit is settled a band
// of columns at a time, picking up where it left off. The pile slumps a beat
// behind itself, which nobody can see, and the frame cost is flat.
const SETTLE_BUDGET = 40000;               // cells of pit to look at per frame

export function settlePit() {
  const band = Math.max(1, Math.min(pit.cols, Math.floor(SETTLE_BUDGET / pit.rows)));
  settle(pit, null, S.settleAt, Math.min(pit.cols, S.settleAt + band));
  S.settleAt += band;
  if (S.settleAt >= pit.cols) S.settleAt = 0;
}

export function bankDust(x, shade = 1) {
  S.stored++;                                // every pixel is worth one
  S.dirty = true;
  if (!addGrain(pit, x, null, shade)) {
    refinePit();                           // full: settle finer and carry on
    addGrain(pit, x, null, shade);
  }
}

// how many dust the pit could hold at its current grain
export const pitCapacity = () => pit.cols * pit.rows;

// Settle the pile to the next grain down. Every grain is kept: each column of
// the old pile is shared out across the finer columns that stand where it did,
// so the profile survives and only the resolution changes. With one grain size
// configured there is nowhere finer to go, and a full pit simply stays full --
// the count keeps rising, the picture does not.
export function refinePit() {
  if (S.pitStep >= PIT_GRAINS.length - 1) return;    // already as fine as it gets

  const oldP = pit.p, oldCols = pit.cols, oldRows = pit.rows, oldGrid = pit.grid;
  S.pitStep++;
  pit.p = PIT_GRAINS[S.pitStep];
  pit.cols = PIT_W / pit.p;
  pit.rows = PIT_H / pit.p;
  pit.grid = new Uint8Array(pit.cols * pit.rows);

  // Where each old column lands. The ratio is not always a whole number (three
  // pixels to two is one and a half), so a column's span is taken from the
  // boundaries rather than assumed: spans of one and two alternate, and every
  // finer column is claimed exactly once. Nothing is dropped on the floor.
  const k = oldP / pit.p;
  const edge = c => Math.min(pit.cols, Math.floor(c * k));

  for (let c = 0; c < oldCols; c++) {
    const stack = [];
    for (let r = 0; r < oldRows; r++) {
      const v = oldGrid[r * oldCols + c];
      if (v && v !== CORE_CELL) stack.push(v);     // S.cores are re-seeded after
    }
    if (!stack.length) continue;

    const a = edge(c);
    const span = Math.max(1, edge(c + 1) - a);
    for (let i = 0; i < stack.length; i++) {
      const nc = a + (i % span);
      const nr = (i - i % span) / span;
      if (nc < pit.cols && nr < pit.rows) put(pit, nc, nr, stack[i]);
    }
  }
  seedPitCores();
  S.pitPainted = false;
  S.dirty = true;
}

// paying comes out of the hole: grains are lifted off the top until the pile is
// worth no more than the counter says
// The pile always shows as much of the hole as will fit in it: one grain one
// dust, up to the brim. Spending lifts grains off the top until it says the
// right thing again -- which is a straight subtraction while there is room, and
// nothing at all while the pit is over the brim and the pile is already short.
export function spend(cost) {
  if (window.__spends) window.__spends.push(cost);   // dev: what took dust out
  S.stored -= cost;
  let left = countDust(pit) - Math.min(S.stored, pitCapacity());
  for (let r = pit.rows - 1; r >= 0 && left > 0; r--) {
    for (let c = 0; c < pit.cols && left > 0; c++) {
      const v = at(pit, c, r);
      if (!v || v === CORE_CELL) continue;
      put(pit, c, r, 0);
      left--;
      if (S.paid.length < 200) {               // a few hundred is plenty to read
        S.paid.push({
          x0: pit.x + c * pit.p,
          y0: bottomY(pit) - (r + 1) * pit.p,
          x: pit.x + c * pit.p,
          y: bottomY(pit) - (r + 1) * pit.p,
          t: -Math.random() * 0.5,           // they leave in a stream, not a block
          rate: 0.012 + Math.random() * 0.01,
          lift: 60 + Math.random() * 90,     // how high it arcs on the way
          s: v
        });
      }
    }
  }
}


// the pile shows exactly the cores you still hold: top up after a resize, and
// take them back out when they are spent
export function seedPitCores() {
  if (!pit.grid) return;
  let have = 0;
  for (const v of pit.grid) if (v === CORE_CELL) have++;
  for (let i = have; i < S.cores; i++) {
    // near the lip, where the dust is and where you can see them: the pit runs
    // a long way right, and a core out in the empty end is a core nobody finds
    addGrain(pit, pit.x + (0.1 + 0.8 * ((i + 0.5) / Math.max(1, S.cores))) * 700, null, CORE_CELL);
  }
  if (have > S.cores) takeCoreCells(have - S.cores);
}

// lift core cells out of the pile, topmost first
export function takeCoreCells(n) {
  for (let r = pit.rows - 1; r >= 0 && n > 0; r--) {
    for (let c = 0; c < pit.cols && n > 0; c++) {
      if (at(pit, c, r) === CORE_CELL) { put(pit, c, r, 0); n--; }
    }
  }
}
