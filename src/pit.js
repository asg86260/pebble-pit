// The hole in the ground: what goes in it, what it can hold, and what paying
// takes back out.
//
// The pile is the dust, not a picture of it: one grain is one dust, and the pile
// always shows as much of the hole as will fit in it. `PIT_GRAINS` in config.js
// lists the sizes a grain may be drawn at -- adding finer ones lets the pile
// settle to them as it fills, keeping every grain and only losing resolution.

import { P, WORKER, PIT_W_MAX,
        PIT_H, PIT_HEAP, PIT_HEAP_SLOPE, PIT_GRAINS, PACK_SPARKS, CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL,
        findKind, someFind } from './config.js';
import { S, pit } from './state.js';
import { at, put, addGrain, count, countDust, isDust, roomFor, recount, bottomY, settleSome, wakeGrid,
         surfaceY, colOf } from './grid.js';
import { SETTLE_BUDGET } from './config.js';
import { makePainter } from './painter.js';
import { buildShop } from './shop.js';
import { rand } from './rng.js';

// --- how big the hole is -----------------------------------------------------
// One hole, the whole thing, from the first frame.
//
// It used to be dug out a purchase at a time, from a scrape to the full pit --
// twenty-three of them. Which made the hole the ceiling on everything else: what
// you could hold was what you had dug, so every price in the game was really a
// statement about how much pit you had bought first, and a row you could not
// afford was as often a row you had nowhere to put as one you had not earned.
//
// The hole is scenery with a number in it. It is not the thing the game is
// about, and making it the gate on the things the game *is* about was the tail
// wagging the dog.
export const pitWidth = () => PIT_W_MAX;
export const pitDepth = () => PIT_H;

// --- the shape of it, for anybody who has to walk it -------------------------
// Where the top of the pile is and where the rungs are. It is geometry of the
// hole, so it lives with the hole.
//
// It used to live in smog.js, because the muck layer was the first thing that
// needed to know how deep the pile was and the answer got written where it was
// first asked for. Which left `route.js` -- the file that says where a body may
// walk -- importing the pit's ladders out of the file about the sky. Nobody
// reading either of them would look there.
//
// The ladders into the hole: one down each wall, and the dust in the bottom
// between them.
//
// The crew used to reach the layer in the pit from the lip, arm out over the
// mouth. It read as a fudge -- somebody shovelling a thing eight cells away and
// two deep without going near it -- and every other hole in this yard is one you
// go down: the quarry has a ladder in its near corner and the crew climb it hand
// over hand.
//
// Two of them, because the hole has two sides and there is ground beyond it. A
// single ladder in the near wall made the pit a dead end: everything past it was
// somewhere the crew could see muck lying and never reach, since the lip clamp
// pins them this side of the mouth. With a ladder in each wall the pit stops
// being a wall and becomes a way through -- down one side, across the top of the
// pile, and up the other.
export const NEAR = -1, FAR = 1;

export function pitLadder(side) {
  const x = side === FAR ? pit.x + pit.w - P : pit.x + P;
  return { x, top: S.groundY - WORKER, foot: pitTop(x) - WORKER };
}

// The top of whatever is in the hole at a place: the dust, or the floor when it
// is empty. What a body in the pit stands on, and what the muck lies on.
//
// `surfaceY` answers a different question -- where the *next* grain down this
// column would come to rest -- and that is one cell above the dust already
// there. Read as a surface it put everything a cell too high: the layer hung
// over the pile with daylight under it, and the crew walked the hole a cell off
// the ground the way they walk the yard a cell off the ground, which is to say
// not at all. One cell down is the top of the pile itself.
export function pitTop(wx) {
  const c = colOf(pit, wx);
  if (c < 0 || c >= pit.cols) return S.groundY + pitDepth();
  return surfaceY(pit, c) + pit.p;
}

// Where the plot sits and how many cells it is. The near lip never moves: a dig
// takes the far wall out and the floor down, so nothing you can already see
// changes place. Called from the layout, and again on every dig.
export function shapePit() {
  pit.w = pitWidth();
  pit.h = pitDepth() + PIT_HEAP;         // the hole, and room to heap over it
  pit.cols = pit.w / pit.p;
  pit.rows = pit.h / pit.p;
  pit.y = S.groundY - PIT_HEAP;          // the plot starts above the ground line
}

// A bigger plot with the same pile in it. Columns keep their number, so the pile
// stays where it was against the near lip; rows do too, so the sand comes down
// onto the new floor rather than hanging in the air over it. Nothing is lost and
// nothing is counted twice -- this is a bigger box, not a new one.
function regridPit() {
  const want = pit.cols * pit.rows;
  if (pit.grid && pit.grid.length === want && pit.gridCols === pit.cols) return;
  const old = pit.grid, oldCols = pit.gridCols || 0, oldRows = pit.gridRows || 0;
  pit.grid = new Uint8Array(want);
  pit.gridCols = pit.cols;
  pit.gridRows = pit.rows;
  if (old && oldCols) {
    for (let c = 0; c < Math.min(oldCols, pit.cols); c++)
      for (let r = 0; r < Math.min(oldRows, pit.rows); r++)
        pit.grid[r * pit.cols + c] = old[r * oldCols + c];
  }
  recount(pit);                          // the cells were copied, not put
  pit.painter = makePainter(pit);        // the scratch canvas is the grid's size
  pit.onPut = pit.painter.mark;
}

// One dig, bought at the bench: the far wall goes out and the floor goes down.
// The world is not laid out again -- it never depended on how far the hole had
// got, only on how far it can ever get -- so this is the plot and nothing else.
// its painter, made fresh whenever the grid underneath changes shape
export function setPitGrain(step) {
  S.pitStep = Math.max(0, Math.min(PIT_GRAINS.length - 1, step));
  pit.p = PIT_GRAINS[S.pitStep];
  shapePit();
  pit.grid = null;                       // a new grain is a new pile, not a resize
  pit.gridCols = 0;
  regridPit();
  if (pit.ceiling) wirePit();            // the ceiling and the room are the new shape's
}

// nothing bars the pile, it just fills; it lies flat rather than heaping; and
// every change is told to the painter
export function wirePit() {
  regridPit();                             // as big as it has been dug out
  pit.blocked = null;                      // nothing bars the pile, it just fills
  pit.repose = false;                      // and inside the hole it lies flat
  // What stands above the brim is a heap in the middle of the hole, and nothing
  // at either end. Two rules, and they are both about not lying to you:
  //
  //   the hole fills first  -- nothing goes over the brim while there is still
  //                            room down there, so a pile above the ground line
  //                            always means the hole underneath it is full;
  //   and it heaps from the -- so it tapers away to nothing at the lip instead
  //   middle                   of standing there as a wall against the ground.
  // Whether the heap over the mouth is unlocked yet is a question about the
  // *pile*, not about the counter. They are nearly the same number and the
  // difference is the whole bug: a core in the pile takes a cell and is not
  // dust, so the hole was physically full one grain before the counter agreed,
  // the heap never unlocked, and the crew stood at the lip throwing dust at a
  // brim with nowhere under it.
  pit.holeCap = pit.cols * (pitDepth() / pit.p);
  pit.ceiling = c => pit.n < pit.holeCap ? pitDepth() / pit.p : heapCeiling(c);
  measurePit();
  if (!pit.painter) pit.painter = makePainter(pit);
  pit.onPut = pit.painter.mark;            // every change is told to the painter
  pit.painter.repaint();
  wakeGrid(pit);                           // a dug hole is a new ceiling over every column
}

// Whether the hole underneath was full the last time the pile was settled. The
// pit is the one grid whose ceiling changes for every column at once: while
// there is room down there nothing may stand above the brim, and the moment the
// hole fills every column is allowed to heap. That is a rule change, not a cell
// change, so the grain that happened to fill the hole wakes its own column and
// nothing else -- and every other column would sit at the old brim for ever.
// One comparison a frame buys the whole plot another look at the moment it
// matters. It goes the other way too: spending lifts grains off the top, the
// hole stops being full, and the brim comes back down over the lot.
let wasFull = false;

export function settlePit() {
  const full = pit.n >= pit.holeCap;
  if (full !== wasFull) { wasFull = full; wakeGrid(pit); }
  settleSome(pit, SETTLE_BUDGET);
}

// A full hole takes nothing. The pile is the dust -- one grain one dust, always
// -- so a counter that went on climbing while the pile stood still would be the
// number and the picture saying different things, which is the one thing this
// game does not do. When there is no room the dust does not go in and is not
// counted, and the way to bank another grain is to dig.
//
// A find is counted in with everything else. It used to go in over the ceiling
// on the grounds that a shard is a thing you went and got rather than a grain
// that happened -- but a hole that holds everything except the four things it
// does not hold is a hole with a rule you cannot see, and the counter over it
// stops being a reading of what is down there. One capacity, one queue: a shard
// takes a grain of room the same as a grain of dust does, and the crew book it
// the same way.
export const pitFull = () => pit.n >= pitCapacity();

// Grains of dust the hole would still take. What the crew book their trips
// against: see `pitFree` in crew.js.
export const pitRoom = () => Math.max(0, pitCapacity() - pit.n);

// Something goes in the hole. A grain of dust is worth one dust; a shard, a
// or a spore is worth one of itself. Either way it is a grain in the pile
// from here on, and the pile shows exactly what you are holding. False means
// the hole would not take it, and whatever was carrying it still has it.
export function bankDust(x, shade = 1) {
  if (!addGrain(pit, x, null, shade)) {
    refinePit();                           // full: settle finer and carry on
    if (!addGrain(pit, x, null, shade)) return false;
  }
  if (isDust(shade)) {
    S.stored++;                              // every pixel is worth one
    S.banked++;                              // the books count what came in, not what is left
  } else if (findKind(shade) === SHARD_CELL) { S.shards++; S.seenShard = true; buildShop(); }
  else if (findKind(shade) === SPORE_CELL) { S.spores++; S.seenSpore = true; buildShop(); }
  // The red out of the meteor's core. It came down out of the sky, was fetched
  // off the ground like anything else, and is counted where everything else is
  // counted: in the hole.
  else if (findKind(shade) === SPARK_CELL) { S.sparks++; S.seenSpark = true; buildShop(); }
  S.dirty = true;
  return true;
}

// How much the plot can actually hold, which is no longer the whole of it: the
// hole fills to the brim everywhere, and above the brim only as much as the
// heap is allowed to lean. Counted once when the plot changes shape rather than
// every time somebody pays for something.
// how high a column may stand once the hole beneath it is full
function heapCeiling(c) {
  const fromEnd = Math.min(c, pit.cols - 1 - c);
  return pitDepth() / pit.p + Math.min(PIT_HEAP / pit.p, fromEnd * PIT_HEAP_SLOPE);
}

// What the plot would hold at a given dig, without digging it. The board asks
// this for the next one along, so it can say what the purchase buys.
export function capacityAt() {
  const p = pit.p;
  const cols = pitWidth() / p;
  const holeRows = pitDepth() / p;
  const rows = holeRows + PIT_HEAP / p;
  let n = 0;
  for (let c = 0; c < cols; c++) {
    // a column holds every row *below* its ceiling, so a ceiling of 71.4 is
    // seventy-two rows and not seventy-one
    const fromEnd = Math.min(c, cols - 1 - c);
    n += Math.min(rows, Math.ceil(holeRows + Math.min(PIT_HEAP / p, fromEnd * PIT_HEAP_SLOPE)));
  }
  return n;
}

export function measurePit() {
  pit.cap = capacityAt();
  return pit.cap;
}

export const pitCapacity = () => pit.cap || pit.cols * pit.rows;

// Settle the pile to the next grain down. Every grain is kept: each column of
// the old pile is shared out across the finer columns that stand where it did,
// so the profile survives and only the resolution changes. With one grain size
// configured there is nowhere finer to go, and a full pit simply stays full --
// the count keeps rising, the picture does not.
export function refinePit() {
  if (S.pitStep >= PIT_GRAINS.length - 1) return;    // already as fine as it gets
  // and no finer than has been paid for. A hole that quietly packed itself the
  // moment it filled would be a hole with no ceiling, and the ceiling is the
  // point: what a full pit means is that the yard has outgrown it, and the
  // answer to that is something you go and get rather than something that
  // happens to you. See `packPit`.
  if (S.pitStep >= (S.pitFine || 0)) return;

  const oldP = pit.p, oldCols = pit.cols, oldRows = pit.rows, oldGrid = pit.grid;
  S.pitStep++;
  pit.p = PIT_GRAINS[S.pitStep];
  shapePit();
  pit.grid = new Uint8Array(pit.cols * pit.rows);
  pit.gridCols = pit.cols;
  pit.gridRows = pit.rows;
  pit.n = 0;                             // and it is filled a `put` at a time below
  pit.painter = makePainter(pit);
  pit.onPut = pit.painter.mark;

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

// Sparks, pressing the pile.
//
// The machinery for this was written when the hole was built and then pinned
// shut at one grain size -- `refinePit` shares every grain of the old pile out
// across the finer columns standing where it did, so the profile survives and
// only the resolution changes. What was missing was a reason: a pile that packs
// itself when it is full has no ceiling, and something has to be spent.
//
// So the red out of the star's core buys it, and it happens the moment it is
// bought rather than the next time the hole fills. You watch the pile settle
// into itself and the room appear, which is the whole of what you paid for.
export function packPit() {
  if (!canPack()) return false;
  S.pitFine = (S.pitFine || 0) + 1;
  refinePit();
  measurePit();
  buildShop();
  S.dirty = true;
  return true;
}

// whether there is a finer grain left to buy at all
export const canPack = () => (S.pitFine || 0) < PIT_GRAINS.length - 1;
// and what the next one costs
export const packCost = () => PACK_SPARKS[Math.min(S.pitFine || 0, PACK_SPARKS.length - 1)];
// What it buys, said as a multiple of what the hole holds now. A grain half the
// width holds four of itself in the same square of ground, so this is the ratio
// squared and it is worked out rather than written down -- change PIT_GRAINS and
// the row on the board says the right thing without anybody editing it.
export function packGain() {
  const now = PIT_GRAINS[S.pitStep] || PIT_GRAINS[0];
  const next = PIT_GRAINS[Math.min(PIT_GRAINS.length - 1, (S.pitStep || 0) + 1)];
  return Math.round((now / next) ** 2 * 10) / 10;
}

// paying comes out of the hole: grains are lifted off the top until the pile is
// worth no more than the counter says
// The pile always shows as much of the hole as will fit in it: one grain one
// dust, up to the brim. Spending lifts grains off the top until it says the
// right thing again -- which is a straight subtraction while there is room, and
// nothing at all while the pit is over the brim and the pile is already short.
export function spend(cost) {
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
          t: -rand() * 0.5,           // they leave in a stream, not a block
          rate: 0.012 + rand() * 0.01,
          lift: 60 + rand() * 90,     // how high it arcs on the way
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
      // near the lip, where the dust is and where you can see them: a dug-out pit
      // runs a long way right, and one out in the empty end is one nobody finds.
      // A hole that has not been dug that far is spread over what there is.
      addGrain(pit, pit.x + (0.1 + 0.8 * ((i + 0.5) / Math.max(1, want))) * Math.min(700, pit.w), null,
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
