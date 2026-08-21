// The hole in the ground: what goes in it, what it can hold, and what paying
// takes back out.
//
// The pile is the dust, not a picture of it: one grain is one dust, and the pile
// always shows as much of the hole as will fit in it. `PIT_GRAINS` in config.js
// lists the sizes a grain may be drawn at -- adding finer ones lets the pile
// settle to them as it fills, keeping every grain and only losing resolution.

import { P, PIT_W, PIT_H, PIT_HEAP, PIT_HEAP_SLOPE, PIT_GRAINS, CORE_CELL, SHARD_CELL, SPORE_CELL,
         findKind, someFind,
         SHADES } from './config.js';
import { S, pit } from './state.js';
import { at, put, addGrain, countDust, isDust, bottomY, settleSome } from './grid.js';
import { SETTLE_BUDGET } from './config.js';
import { makePainter } from './painter.js';
import { buildShop } from './shop.js';

// its painter, made fresh whenever the grid underneath changes shape
export function setPitGrain(step) {
  S.pitStep = Math.max(0, Math.min(PIT_GRAINS.length - 1, step));
  pit.p = PIT_GRAINS[S.pitStep];
  pit.cols = PIT_W / pit.p;
  pit.rows = (PIT_H + PIT_HEAP) / pit.p;
  pit.grid = new Uint8Array(pit.cols * pit.rows);
  pit.painter = makePainter(pit);
  pit.onPut = pit.painter.mark;
  if (pit.ceiling) measurePit();
}

// nothing bars the pile, it just fills; it lies flat rather than heaping; and
// every change is told to the painter
export function wirePit() {
  pit.blocked = null;                      // nothing bars the pile, it just fills
  pit.repose = false;                      // and inside the hole it lies flat
  // but what stands above the brim is a heap, and leans away from the lip
  pit.ceiling = c => PIT_H / pit.p + Math.max(0, PIT_HEAP / pit.p - c * PIT_HEAP_SLOPE);
  measurePit();
  if (!pit.painter) pit.painter = makePainter(pit);
  pit.onPut = pit.painter.mark;            // every change is told to the painter
}

export function settlePit() {
  settleSome(pit, SETTLE_BUDGET);
}

// Something goes in the hole. A grain of dust is worth one dust; a shard, a
// or a spore is worth one of itself. Either way it is a grain in the pile
// from here on, and the pile shows exactly what you are holding.
export function bankDust(x, shade = 1) {
  if (isDust(shade)) {
    S.stored++;                              // every pixel is worth one
    S.banked++;                              // the books count what came in, not what is left
  } else if (findKind(shade) === SHARD_CELL) { S.shards++; S.seenShard = true; buildShop(); }
  else if (findKind(shade) === SPORE_CELL) { S.spores++; S.seenSpore = true; buildShop(); }
  S.dirty = true;
  if (!addGrain(pit, x, null, shade)) {
    refinePit();                           // full: settle finer and carry on
    addGrain(pit, x, null, shade);
  }
}

// How much the bed can actually hold, which is no longer the whole of it: the
// hole fills to the brim everywhere, and above the brim only as much as the
// heap is allowed to lean. Counted once when the bed changes shape rather than
// every time somebody pays for something.
export function measurePit() {
  let n = 0;
  for (let c = 0; c < pit.cols; c++) {
    // a column holds every row *below* its ceiling, so a ceiling of 71.4 is
    // seventy-two rows and not seventy-one
    n += Math.min(pit.rows, Math.ceil(pit.ceiling ? pit.ceiling(c) : pit.rows));
  }
  pit.cap = n;
  return n;
}

export const pitCapacity = () => pit.cap || pit.cols * pit.rows;

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
  pit.rows = (PIT_H + PIT_HEAP) / pit.p;
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
      if (isDust(v)) stack.push(v);                // the rest are re-seeded after
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
  pit.painter.repaint();
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
      if (!isDust(v)) continue;
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


// The pile shows exactly what you still hold, of everything that is not dust:
// top up after a resize or a reload, and take them back out when they are spent.
// Nothing about where any one of them sits is worth saving, so this is also how
// they come back from a save.
const HELD = [[CORE_CELL, 'cores'], [SHARD_CELL, 'shards'],
              [SPORE_CELL, 'spores']];

export function seedPitCores() {
  if (!pit.grid) return;
  for (const [cell, count] of HELD) {
    let have = 0;
    for (const v of pit.grid) if (v === cell || (cell !== CORE_CELL && findKind(v) === cell)) have++;
    const want = S[count];
    for (let i = have; i < want; i++) {
      // near the lip, where the dust is and where you can see them: the pit runs
      // a long way right, and one out in the empty end is one nobody finds
      addGrain(pit, pit.x + (0.1 + 0.8 * ((i + 0.5) / Math.max(1, want))) * 700, null,
               cell === CORE_CELL ? cell : someFind(cell));
    }
    if (have > want) takeCoreCells(have - want, cell);
  }
}

// lift cells of one kind out of the pile, topmost first
export function takeCoreCells(n, cell = CORE_CELL) {
  for (let r = pit.rows - 1; r >= 0 && n > 0; r--) {
    for (let c = 0; c < pit.cols && n > 0; c++) {
      const v = at(pit, c, r);
      // by kind, not by tone: a shard is a shard whichever blue it happens to be
      if (v === cell || (cell !== CORE_CELL && findKind(v) === cell)) {
        put(pit, c, r, 0);
        n--;
      }
    }
  }
}
