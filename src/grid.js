// The falling-sand grid, and nothing else.
//
// A grid is any object of the shape below. Nothing in here knows what a rock or
// a pit or a worker is, so a new one -- a quarry floor, a farm plot -- is a new
// object, not new code.
//
//   { x, y, cols, rows, p, grid }        where and how big, and the cells
//   blocked(c)                           optional: columns dust may not settle in
//   ceiling(c)                           optional: how high a column may stand
//   fixed(c, r)                          optional: a cell that never moves
//   onPut(c, r)                          optional: told about every cell written
//   repose                               optional: heaps stand up instead of spreading flat
//   region(c)                            optional: which ground a column is; a heap keeps to its own
//   lattice(c, z)                        optional: the left column of the size-z slot holding c, or -1
//   onMove(from, to)                     optional: told when a block's bottom-left cell moves
//   awake, awakeOf, awakeN, awakeList    which columns are still moving; see below
//
// The four `awake*` fields are this file's own, but a new grid should still
// declare them empty in its object literal: a grid object is read a hundred
// thousand times a frame and growing its shape late costs more than they
// save. See `floor` in state.js.
//
// Cells hold a shade, 1..SHADES.length, or 0 for empty. Anything above that is
// for the owner to mean what it likes by (the finds, the cut's rock, and the
// kinds of unit in config/blocks.js, `KINDS`).
//
// A unit bigger than a grain is a block: a size-by-size square of cells of one
// value, tracked by a second layer on the grid (`block`, each cell naming its
// block's bottom-left cell). The layer, and every bit of settling that reads
// it, exists only on a grid that has been given a block (`blockN`), so a plot
// of grains runs exactly the rule below and never asks. See "units bigger
// than a grain" at the foot of this file.

import { SHADES, KINDS } from './config.js';
import { rand } from './rng.js';

export const shadeOf = v => SHADES[Math.min(SHADES.length, Math.max(1, v)) - 1];

// The perf gate's counters (test/perf-gate.test.mjs): counted per frame, not
// timed, because a count is the same on a loaded machine. Published on
// `globalThis` so the check reads the live module's count and not a second
// instance's. `route.js` adds to `ways` and `stances`; `addGrain` adds to the
// other two; `surveyFloor` (game.js) to `surveys` and the cells it read;
// `topRow` to `tops` and the cells it read finding them; `blocks` counts the
// blocks a settle pass looked at, which is nothing on a plot of grains.
globalThis.__perf = { ways: 0, grainCols: 0, grains: 0, stances: 0, surveys: 0, surveyCells: 0, tops: 0, topCells: 0, blocks: 0 };

// A cell holds a shade of dust, or something that is not dust at all (a spark,
// a shard, a spore). They move the same way; they are not worth one dust.
export const isDust = v => v > 0 && v <= SHADES.length;

// Shade reads how much rock is left, relative to that rock's own thickness:
// black at full thickness, paling as it is worn through. Nothing of ours is
// ever drawn over the rock, so black on black never comes up.
export const depthShade = (v, max) =>
  Math.max(1, Math.min(SHADES.length, Math.ceil(SHADES.length * v / Math.max(1, max))));

// A shade near a given one, for anything that makes dust without a reason to
// pick a darkness: one fixed tone gives a heap that is a flat block where
// every other pile is mottled. Clamped, so a center near either end leans
// that way instead of running off it.
export const shadeNear = (centre, spread = 1) =>
  Math.max(1, Math.min(SHADES.length,
                       Math.round(centre + (rand() * 2 - 1) * spread)));

export const at = (b, c, r) => b.grid[r * b.cols + c];

// --- which columns are still moving -------------------------------------------
//
// Sand only moves where something has just touched it, so each grid keeps
// one flag per column. A column is woken when a cell in it or beside it is
// written and sleeps again when a pass over it moves nothing; a settled heap
// is not read at all. Per column because a grain leaving a cell disturbs the
// whole column above it; the two neighbors as well so a grain can topple
// sideways into ground that was asleep.
//
// The flags are deliberately generous: waking a column that did not need it
// costs one pass, while a grid that believes it is settled when it is not is
// dust hanging in mid-air. Anything that writes cells behind `put`'s back
// says so (`recount`, `wakeGrid`), and a grid whose cells were swapped out
// wholesale is spotted here and woken end to end.
function awakeCols(b) {
  if (b.awake && b.awake.length === b.cols && b.awakeOf === b.grid) return b.awake;
  b.awake = new Uint8Array(b.cols);
  b.awakeOf = b.grid;
  b.awake.fill(1);
  b.awakeN = b.cols;
  return b.awake;
}

// this column and the two beside it are worth another look
export function wake(b, c) {
  const a = awakeCols(b);
  const lo = c > 0 ? c - 1 : 0, hi = c + 1 < b.cols ? c + 1 : b.cols - 1;
  for (let n = lo; n <= hi; n++) if (!a[n]) { a[n] = 1; b.awakeN++; }
}

// For anything that has written cells without going through `put`, or has
// changed the rules the last pass settled against (a new ceiling, a strip
// just opened, a save being unpacked).
export function wakeGrid(b) {
  if (!b.cols) return;
  awakeCols(b).fill(1);
  b.awakeN = b.cols;
}

// How many columns `settle` has looked at, so "an untouched yard does no
// work" is a fact about the code and not a stopwatch reading.
let work = 0;  // page: a measurement for the checks, zeroed by `resetSettleWork` when one asks
export const settleWork = () => work;
export const resetSettleWork = () => { work = 0; };

// A grid may keep a live count of its occupied cells (`n`) and of its dust
// (`d`); leave them undefined and nothing is counted. The pit asks "is there
// room" thousands of times a frame, and the counter of banked dust is the
// wrong answer by exactly one core. What makes a second copy of a fact safe
// is the alarm: everything that writes cells behind `put`'s back says so
// (`recount`, `fillFlat`), and verify.js rule 7 fails on the frame a ledger
// and its cells disagree.
//
// `age` is when each cell was last written, in frames, for a grid that keeps
// one (`resizeGrid`). A grain that rolls is re-stamped where it lands, so the
// age is how long it has lain *there*. Read by the carters' pick: the ground
// whose oldest grain has lain longest breaks a tie (`firstPick` in
// crew/hauler.js).
let clock = 0;  // page: a frame count for the page's life, only ever forward, so the per-frame keys read off it never repeat
export const tickGrid = () => { clock++; };
// The frame's count, for a reader that may take one walk of a grid a frame.
export const gridFrame = () => clock;
export const ageAt = (b, c, r) => b.age ? b.age[r * b.cols + c] : 0;

// And a ledger a column (`colsOf` the cells it was taken of, `colN` its
// grains, `colOdd` its cells that are not dust), for a grid whose reader asks
// about every column and would otherwise walk every cell: the floor's survey,
// four times a second. Taken from the cells the first time it is asked and
// again whenever the cells are not the ones it was taken of, the way the
// awake flags are, so a grid swapped or refilled behind `put`'s back is
// re-ledgered rather than believed (`recount`, `fillFlat` drop it).
// verify.js rule 7 watches it like the others.
export function columnsOf(b) {
  if (b.colsOf !== b.grid) {
    b.colN = new Int32Array(b.cols);
    b.colOdd = new Int32Array(b.cols);
    for (let i = 0, c = 0; i < b.grid.length; i++) {
      const v = b.grid[i];
      if (v) { b.colN[c]++; if (!isDust(v)) b.colOdd[c]++; }
      if (++c === b.cols) c = 0;
    }
    b.colsOf = b.grid;
  }
  return { n: b.colN, odd: b.colOdd };
}

// And the top of every column (`topsOf` the cells it was taken of, `tops` the
// row, `topSure` whether that is the row or only a row nothing stands above),
// because a grain landing, a body standing and a heap measured all ask where
// a column's top is, and the walk down to it through the empty rows over a
// low heap was half of a storm's frame. Taking the top off a column only
// unsettles it (the old row is still a ceiling), and the next asker walks
// down from there; a grain put above the top is the top. Taken from the
// cells the way the column counts are, and dropped with them (`rewritten`).
// verify.js rule 7 watches it like the others.
function topsOf(b) {
  if (b.topsOf !== b.grid || b.tops.length !== b.cols) {
    b.tops = new Int32Array(b.cols).fill(-1);
    b.topSure = new Uint8Array(b.cols).fill(1);
    globalThis.__perf.topCells += b.grid.length;     // the perf gate's: cells read for a top
    for (let i = 0, c = 0, r = 0; i < b.grid.length; i++) {
      if (b.grid[i]) b.tops[c] = r;
      if (++c === b.cols) { c = 0; r++; }
    }
    b.topsOf = b.grid;
  }
  return b.tops;
}

export const put = (b, c, r, v) => {
  const i = r * b.cols + c;
  if (b.topsOf === b.grid) {
    if (v) { if (r >= b.tops[c]) { b.tops[c] = r; b.topSure[c] = 1; } }
    else if (r === b.tops[c]) b.topSure[c] = 0;
  }
  if (b.colsOf === b.grid) {
    const was = b.grid[i];
    b.colN[c] += (v ? 1 : 0) - (was ? 1 : 0);
    b.colOdd[c] += (v && !isDust(v) ? 1 : 0) - (was && !isDust(was) ? 1 : 0);
  }
  if (b.age) b.age[i] = v ? clock : 0;
  if (b.n != null) b.n += (v ? 1 : 0) - (b.grid[i] ? 1 : 0);
  // The rift asks how much dust is in the hole every frame it swallows, and
  // `countDust` was a fifth of the endgame's whole simulation.
  if (b.d != null) b.d += (isDust(v) ? 1 : 0) - (isDust(b.grid[i]) ? 1 : 0);
  b.grid[i] = v;
  wake(b, c);                              // and this is the one place sand starts moving
  if (b.onPut) b.onPut(c, r);
};

export const inside = (b, c, r) => c >= 0 && c < b.cols && r >= 0 && r < b.rows;
export const bottomY = b => b.y + b.rows * b.p;    // world y of the grid floor
export const colOf = (b, x) => Math.floor((x - b.x) / b.p);

export const count = b => { let n = 0; for (const v of b.grid) if (v) n++; return n; };
// after anything that writes the cells wholesale rather than through `put`
export const recount = b => { b.n = count(b); b.d = countDust(b); rewritten(b); };
// After cells were written behind `put`'s back: the ledgers kept a column at
// a time are taken again from the cells when next asked, and every column
// gets another look.
export const rewritten = b => { b.colsOf = null; b.topsOf = null; wakeGrid(b); };
export const countDust = b => {
  let n = 0;
  for (const v of b.grid) if (isDust(v)) n++;
  return n;
};
// Off the ledger when the grid keeps one, by walking when not. `countDust`
// stays the walk: a check and verify.js rule 7 want the truth, not the copy.
export const dustIn = b => b.d != null ? b.d : countDust(b);
export const grainsIn = b => b.n != null ? b.n : count(b);

// world y where a grain falling down column c would come to rest
export const surfaceY = (b, c) => bottomY(b) - (topRow(b, c) + 2) * b.p;

// the topmost grain in a column, or -1
export function topRow(b, c) {
  globalThis.__perf.tops++;                  // the perf gate's: one top asked for
  if (!(c >= 0 && c < b.cols)) return scanTop(b, c);
  const t = topsOf(b);
  if (!b.topSure[c]) {
    let r = t[c];
    while (r >= 0 && !at(b, c, r)) r--;
    globalThis.__perf.topCells += t[c] - r + 1;
    t[c] = r;
    b.topSure[c] = 1;
  }
  return t[c];
}
// The walk itself, for a column off the grid, which has no ledger to keep.
function scanTop(b, c) {
  for (let r = b.rows - 1; r >= 0; r--) if (at(b, c, r)) return r;
  return -1;
}

// How high a column may stand. A grid with no ceiling has no limit; a
// ceiling is how a bank is kept from standing up as a wall.
export const roomFor = (b, c, r) => !b.ceiling || r < b.ceiling(c);

// How far a column may stand over the one beside it, in cells, where heaps
// stand up (`repose`): a grain slides only into a drop deeper than this, so
// at rest a heap's face is this steep and no steeper. The belt puts a grain
// down where this already holds (`restOn` in dust.js).
export const REPOSE_DROP = 2;

// How far a grain may walk to get out from under something that is not
// ground, in columns: however wide the thing in the way is, and the widest
// is the hill with its clearance, a little over eighty columns. Past the
// reach the grain is dropped: falling off the world is truer than appearing
// in a heap nobody filled. A rock grown wider wants this raised.
export const BARRED_REACH = 96;

// What `addGrain` keeps to when it keeps to no ground at all: a value no
// `region` can answer.
const ANYWHERE = Symbol('anywhere');

// Where the last grain `addGrain` took went in, for a caller keeping its own
// reading of the columns' tops between grains (`stepChips`).
export const landed = { c: -1, r: -1 };

// drop one grain in at x. If that column is full or barred it goes in the
// nearest one that is not; false means there was nowhere at all.
// `free` ignores the ceiling: what a bank may stand at is about heaps of dust,
// and a single thing that is not dust lies where it was dropped.
export function addGrain(b, x, skip = b.blocked, shade = 1, free = false) {
  let col = Math.max(0, Math.min(b.cols - 1, colOf(b, x)));
  globalThis.__perf.grains++;                // the perf gate's: one grain dropped in
  // Two reasons a column will not take a grain, with two answers. **Barred**
  // is not ground at all (under the rock, over a mouth): the grain has to go
  // somewhere, the search crosses whatever it likes and stops at
  // `BARRED_REACH`. **Heaped** is ground at its ceiling: the search may spread
  // as far as it likes inside the strip or bare ground it landed on, and never
  // out of it, or a grain lands in a station's heap nobody carried it to.
  // A column stacked to the plot's lid is heaped, not barred: the pit's heap
  // stands to the lid along its whole middle, and read as barred a grain
  // landing there gave up BARRED_REACH columns out and tore a hole with room
  // in it.
  const barred = c => skip && skip(c);
  // (the increment is the perf gate's: one per column asked whether it has room)
  const full = c => (globalThis.__perf.grainCols++,
    barred(c) || at(b, c, b.rows - 1) || (!free && !roomFor(b, c, topRow(b, c) + 1)));
  if (full(col)) {
    const out = barred(col);
    // `region` answers `null` for the bare yard between strips, which is
    // ground like any strip and bounded like one. So "no region to keep to"
    // -- barred, or a grid with no regions -- is its own answer, and not the
    // bare yard's, or a grain on a full stretch of bare yard walks into the
    // strip next door.
    const from = out || !b.region ? ANYWHERE : b.region(col);
    const reach = out ? BARRED_REACH : b.cols;
    // The region is asked *before* the column is, and a side that has left
    // the region is not looked at again: `full` walks a column's rows, and
    // asking it of every column in the world for each grain landing on a
    // heaped strip was the whole of the endgame's frame spike.
    const inRegion = c => from === ANYWHERE || b.region(c) === from;
    let alt = -1, left = true, right = true;
    for (let d = 1; d <= reach && d < b.cols && (left || right); d++) {
      if (left) {
        const c = col - d;
        if (c < 0 || !inRegion(c)) left = false;
        else if (!full(c)) { alt = c; break; }
      }
      if (right) {
        const c = col + d;
        if (c >= b.cols || !inRegion(c)) right = false;
        else if (!full(c)) { alt = c; break; }
      }
    }
    col = alt;
  }
  if (col < 0) return false;
  for (let r = 0; r < b.rows; r++) {
    if (!at(b, col, r)) { landed.c = col; landed.r = r; put(b, col, r, shade); return true; }
  }
  return false;
}

// One sand tick: unsupported grains fall, then slump sideways. `from`/`to`
// limit it to a band of columns, so a very large grid can be settled a piece
// a frame. Only the awake columns of the band are walked, and all are put
// back to sleep before the walk: every move goes through `put`, which wakes
// the column it wrote and the two beside it, so a column earns its next pass
// by having done something in this one.
//
// Returns how many columns it looked at, which is the cost of the call.
export function settle(b, skip = b.blocked, from = 0, to = b.cols) {
  const awake = awakeCols(b);
  if (!b.awakeN) return 0;                 // nothing anywhere has moved: no cell is read
  // Only a grid that holds a block asks anything of the block rule, and the
  // blocks to look at are picked before the flags below are cleared.
  const blocks = b.blockN ? liveBlocks(b) : null;
  const moving = blocks ? blocksAwake(b, awake) : null;
  // A list, because the rows are the outer loop: the band would otherwise be
  // scanned once per row instead of once per pass.
  const cols = b.awakeList || (b.awakeList = []);
  cols.length = 0;
  for (let c = from; c < to; c++) {
    if (!awake[c]) continue;
    awake[c] = 0;
    b.awakeN--;
    cols.push(c);
  }
  work += cols.length;
  if (!cols.length && !(moving && moving.length)) return 0;
  const wide = cols.length;
  for (let r = 1; r < b.rows; r++) {
    for (let k = 0; k < wide; k++) {
      const c = cols[k];
      if (!at(b, c, r)) continue;
      if (blocks && blocks[r * b.cols + c]) continue;   // a block's cell moves with its block, below
      // A cell that is not dust and never moves: the quarry keeps undug rock
      // in the same grid as the fallen dust (`cut` in state.js). It supports
      // what is above it like any occupied cell, but must never be read as a
      // grain with somewhere to slide, or undug ground migrates to a column
      // nobody has swung at.
      if (b.fixed && b.fixed(c, r)) continue;
      const v = at(b, c, r);
      if (!at(b, c, r - 1)) { put(b, c, r, 0); put(b, c, r - 1, v); continue; }
      const first = (c + r) & 1 ? -1 : 1;   // alternate bias so piles stay even
      for (const d of [first, -first]) {
        const n = c + d;
        if (!inside(b, n, r - 1) || (skip && skip(n))) continue;
        if (!roomFor(b, n, r - 1)) continue;          // that column may not stand that high
        // where heaps stand up, a grain only slides if there is a real drop
        // beside it, so a pile keeps its shape instead of spreading flat
        if (b.repose && r >= REPOSE_DROP && at(b, n, r - REPOSE_DROP)) continue;
        if (!at(b, n, r - 1) && !at(b, n, r)) {
          put(b, c, r, 0);
          put(b, n, r - 1, v);
          break;
        }
      }
    }
  }
  if (moving) for (const ai of moving) stepBlock(b, ai, skip);
  return wide;
}

// A big grid is settled a band of columns at a time, picking up where it
// left off. With only awake columns walked, the band is what caps the one
// frame after a whole grid is woken (a save loading, a rock landing), so
// that pass is spread over a few frames instead of arriving as a hitch.
export function settleSome(b, budget) {
  const band = Math.max(1, Math.min(b.cols, Math.floor(budget / b.rows)));
  const from = b.settleAt || 0;
  const did = settle(b, undefined, from, Math.min(b.cols, from + band));
  b.settleAt = from + band >= b.cols ? 0 : from + band;
  return did;
}

// re-pack n grains into a grid from the bottom up, ignoring shape
export function fillFlat(b, n) {
  b.grid.fill(0);
  if (b.n != null) b.n = 0;                // and the ledgers went with them
  if (b.d != null) b.d = 0;
  rewritten(b);                            // the cells went, and not through `put`
  if (b.painter) b.painter.repaint();
  n = Math.min(n, b.cols * b.rows);
  const shade = 4;                         // repacked dust, middling gray
  for (let r = 0; r < b.rows && n > 0; r++) {
    for (let c = 0; c < b.cols && n > 0; c++) {
      if (b.blocked && b.blocked(c)) continue;
      put(b, c, r, shade);
      n--;
    }
  }
}

// keep the grain count across a resize, re-packed flat
export function resizeGrid(b) {
  const want = b.cols * b.rows;
  const had = b.grid ? count(b) : 0;
  // Called whenever the world is laid out again, which is when the rules a
  // column settled against may have moved under it (a strip, the apron, a
  // ceiling), so the whole grid gets one more look even at the same size.
  wakeGrid(b);
  if (b.grid && b.grid.length === want) return;
  b.grid = new Uint8Array(want);
  b.age = new Uint32Array(want);
  fillFlat(b, had);
  if (b.painter) b.painter.repaint();
}

// --- units bigger than a grain --------------------------------------------------
//
// A cell's value says what it is and which tone it keeps (`KINDS`, config/
// blocks.js), so a unit keeps its tone however it moves. A kind of size 1 is a
// grain and everything above is the sand rule; a kind of size z above 1 is a
// block, a z-by-z square of one value.
//
// The grid keeps a second layer for blocks, `block`: every cell of a block
// holds its bottom-left cell's index plus one, so a take that finds any cell of
// a block takes the whole block (`takeUnit`). It is made the first time a block
// is put, and `blockSet` lists the bottom-left cells, so a plot that never
// holds a block never reads any of it. A layer whose cells were swapped out
// wholesale is spotted by its grid, as the awake flags are, and dropped.
//
// A block stands on its own lattice: its left column is a multiple of its
// size, so it falls straight down its own columns and rolls off a heap's side
// a whole block at a time. Its row moves by the cell, so it comes to rest on
// anything, a grain, a plank, fixed ground, with no gap under it. It is held up
// when any cell under its bottom row is full and never tips.
//
// A grid with regions may lay the lattice off each region's own first column
// (`lattice`): act 3's piles stand where the camp's layout puts them, at no
// common multiple of a log's width, and a pile's blocks must line up with
// its own edges or its last slot hangs half outside it. A slot is then whole
// inside one region, and a block never rolls out of the region it is in, so
// a heap keeps to its strip as a heap of grains does (`addGrain`).

// The left column of the size-z slot that holds column c, or -1 where no
// whole slot does (the odd columns at a region's end).
const slotOf = (b, c, z) => (b.lattice ? b.lattice(c, z) : c - c % z);
// Whether two columns are on one ground, for a grid that has more than one.
const sameRegion = (b, c, n) => !b.region || b.region(c) === b.region(n);

const KIND_OF = new Array(256).fill(null);
for (const k of Object.values(KINDS)) for (let i = 0; i < k.tones; i++) KIND_OF[k.first + i] = k;

// the kind a cell value is of, or null for dust, a find or the rock
export const kindOf = v => KIND_OF[v] || null;
// which of its kind's palette a value is, 0 up; -1 for a value of no kind
export const toneOf = v => (KIND_OF[v] ? v - KIND_OF[v].first : -1);
// the cell value of a kind (by key) in one of its tones
// (clamped to its palette, so a tone past it never spills into the next kind's run)
// MOCK after-goods  option C: a unit made with no tone asked for takes a random one of its kind's six, once
// MOCK after-goods  a stored shade of n: C uniform over six, D near the middle of ten as act 1's `shadeNear` is, the ends rare
export const mockShade = (n, block) => {
  const look = globalThis.__goodsLook;
  if (look !== 'c' && look !== 'd') return 0;
  const u = () => ((Math.sin((globalThis.__goodsSeq = (globalThis.__goodsSeq || 0) + 1) * 12.9898) * 43758.5453) % 1 + 1) % 1;
  if (look === 'c') return Math.floor(u() * Math.min(n, 6));
  return Math.max(0, Math.min(9, Math.round(4.5 + (u() + u() - 1) * 4.5)));
};
export const cellOf = (kind, tone) => {
  if (tone === undefined) tone = KINDS[kind].tones > 1 ? mockShade(KINDS[kind].tones, true) : 0;
  return KINDS[kind].first + Math.max(0, Math.min(KINDS[kind].tones - 1, tone | 0));
};
// cells a side of whatever a value is: one for everything that is not a block
export const sizeOfCell = v => (KIND_OF[v] ? KIND_OF[v].size : 1);

// The layer, when it is the grid's own and a block is on it.
function liveBlocks(b) {
  if (b.blockGrid === b.grid) return b.block;
  b.blockN = 0;                              // the cells were swapped: the blocks went with them
  return null;
}
function layerOf(b) {
  if (b.blockGrid !== b.grid) {
    b.block = new Int32Array(b.grid.length);
    b.blockSet = new Set();
    b.blockGrid = b.grid;
    b.blockN = 0;
  }
  return b.block;
}

// The blocks to look at this pass: any with a column awake in it or a block's
// width either side, since what it rolls onto is as much its business as what
// it stands on. Lowest first, so a stack falls together as grains do.
function blocksAwake(b, awake) {
  const out = [];
  for (const ai of b.blockSet) {
    const c0 = ai % b.cols, z = sizeOfCell(b.grid[ai]);
    const lo = Math.max(0, c0 - z), hi = Math.min(b.cols - 1, c0 + 2 * z - 1);
    for (let c = lo; c <= hi; c++) if (awake[c]) { out.push(ai); break; }
  }
  return out.sort((x, y) => x - y);
}

// the block square, written through `put` so the ledgers and the awake flags keep up
function writeBlock(b, c0, r0, z, v) {
  const lay = layerOf(b), a = r0 * b.cols + c0 + 1;
  for (let j = 0; j < z; j++) for (let i = 0; i < z; i++) lay[(r0 + j) * b.cols + c0 + i] = a;
  b.blockSet.add(a - 1);
  b.blockN++;
  for (let j = 0; j < z; j++) for (let i = 0; i < z; i++) put(b, c0 + i, r0 + j, v);
}
function eraseBlock(b, c0, r0, z) {
  const lay = b.block;
  for (let j = 0; j < z; j++) for (let i = 0; i < z; i++) lay[(r0 + j) * b.cols + c0 + i] = 0;
  b.blockSet.delete(r0 * b.cols + c0);
  b.blockN--;
  for (let j = 0; j < z; j++) for (let i = 0; i < z; i++) put(b, c0 + i, r0 + j, 0);
}

// is the c..c+w-1 by r..r+h-1 rectangle on the plot and empty of every cell
const emptyRect = (b, c, r, w, h) => {
  if (c < 0 || r < 0 || c + w > b.cols) return false;
  for (let j = r; j < Math.min(b.rows, r + h); j++)
    for (let i = c; i < c + w; i++) if (b.grid[j * b.cols + i]) return false;
  return true;
};

// Put a unit with its bottom-left cell at (c0, r0), as it is: no falling.
// A block must stand on its lattice, fit the plot and have its square empty;
// false otherwise, and nothing is written.
export function putBlock(b, c0, r0, v) {
  const z = sizeOfCell(v);
  if (z === 1) {
    if (!inside(b, c0, r0) || at(b, c0, r0)) return false;
    put(b, c0, r0, v);
    return true;
  }
  if (c0 < 0 || slotOf(b, c0, z) !== c0 || r0 < 0 || r0 + z > b.rows || !emptyRect(b, c0, r0, z, z)) return false;
  writeBlock(b, c0, r0, z, v);
  return true;
}

// Take whatever occupies (c, r): the whole block if a cell of one, the grain
// if a grain. Returns its value, 0 if the cell was empty, never moves (ground
// is not a thing to take), or is a block with anything resting on it: a block
// is only ever taken off the top of a heap (the owner, 2026-10-28), so nothing
// under another is ever pulled out and nothing above an emptied cell is left
// floating. This is the door for a hand or a body; `put(.., 0)` on one cell of
// a block would leave the rest standing.
export function takeUnit(b, c, r) {
  if (!inside(b, c, r)) return 0;
  const v = at(b, c, r);
  if (!v || (b.fixed && b.fixed(c, r))) return 0;
  const a = b.blockN && liveBlocks(b) ? b.block[r * b.cols + c] : 0;
  if (!a) { put(b, c, r, 0); return v; }
  const c0 = (a - 1) % b.cols, r0 = Math.floor((a - 1) / b.cols), z = sizeOfCell(v);
  if (!emptyRect(b, c0, r0 + z, z, 1)) return 0;
  eraseBlock(b, c0, r0, z);
  return v;
}

// Take the top unit of column c: what a press over a heap, or a body at the
// foot of one, takes. 0 when the column is bare or its top block has another
// resting on it from the next column (that one is the top of its own).
export const takeTop = (b, c) => {
  const r = inside(b, c, 0) ? topRow(b, c) : -1;
  return r < 0 ? 0 : takeUnit(b, c, r);
};

// The bottom-left cell {c, r} of the block holding (c, r), or null when that
// cell is empty or a grain.
export function blockAt(b, c, r) {
  if (!b.blockN || !inside(b, c, r) || !liveBlocks(b)) return null;
  const a = b.block[r * b.cols + c];
  return a ? { c: (a - 1) % b.cols, r: Math.floor((a - 1) / b.cols) } : null;
}

// Drop a unit in at x, as `addGrain` drops a grain: a block lands on the top of
// the highest column under it, on the lattice slot x falls in, and if that slot
// is full or barred it goes in the nearest slot that is not, a slot at a time,
// keeping to the region it landed on. False means there was nowhere at all.
// It lands where it is put and the next settle rolls it off a slope.
export function addBlock(b, x, v, skip = b.blocked, free = false) {
  const z = sizeOfCell(v);
  if (z === 1) return addGrain(b, x, skip, v, free);
  if (b.cols < z) return false;
  const col = Math.max(0, Math.min(b.cols - 1, colOf(b, x)));
  // The slot x falls in, or the nearest whole one beside it where x falls in
  // the odd columns at a region's end.
  let slot = slotOf(b, col, z);
  for (let d = 1; slot < 0 && d < z; d++) {
    for (const c of [col - d, col + d]) {
      const s = c >= 0 && c < b.cols ? slotOf(b, c, z) : -1;
      if (s >= 0) { slot = s; break; }
    }
  }
  if (slot < 0) return false;
  // the row it would rest at in the slot starting at column s, or -1 when it cannot go there
  const restAt = s => {
    let r0 = 0;
    for (let c = s; c < s + z; c++) {
      if (skip && skip(c)) return -1;
      r0 = Math.max(r0, topRow(b, c) + 1);
    }
    if (r0 + z > b.rows) return -1;
    if (!free && b.ceiling) for (let c = s; c < s + z; c++) if (!roomFor(b, c, r0 + z - 1)) return -1;
    return r0;
  };
  let use = slot, r0 = restAt(slot);
  if (r0 < 0) {
    const out = skip && skip(slot);
    const from = out || !b.region ? ANYWHERE : b.region(slot);
    const reach = out ? Math.ceil(BARRED_REACH / z) : Math.ceil(b.cols / z);
    // A step of a block's width keeps to the lattice inside a region; across
    // regions (a barred column's search, which may go anywhere) each step is
    // put on the lattice of the region it lands in.
    let left = true, right = true;
    use = -1;
    for (let d = 1; d <= reach && (left || right); d++) {
      for (const c of [slot - d * z, slot + d * z]) {
        const isLeft = c < slot;
        if (isLeft ? !left : !right) continue;
        const stop = () => { if (isLeft) left = false; else right = false; };
        if (c < 0 || c + z > b.cols || (from !== ANYWHERE && b.region(c) !== from)) { stop(); continue; }
        const s = slotOf(b, c, z);
        if (s < 0) { if (from !== ANYWHERE) stop(); continue; }
        const r = restAt(s);
        if (r >= 0) { use = s; r0 = r; break; }
      }
      if (use >= 0) break;
    }
    if (use < 0) return false;
  }
  landed.c = use; landed.r = r0;
  writeBlock(b, use, r0, z, v);
  return true;
}

// One block's turn in a settle pass, and the whole rule of a heap of blocks:
//   - nothing under any of its columns: it falls a cell;
//   - supported under at least half its width: it rests, however uneven the
//     ground under it, and never tips;
//   - supported under less than half (it overhangs): it rolls a whole block's
//     width toward the side with less under it, a cell down, if that strip is
//     open (not barred, not too tall for the ceiling, clear through the rows
//     it passes), else it rests where it is;
//   - supported, with nothing on it, but standing a whole block's height or
//     more over the slot beside it (its bottom at or above that slot's top
//     plus its size): it rolls into that slot the same way. This is the
//     block's repose, as REPOSE_DROP is a grain's: a column of blocks never
//     stands more than a block over its neighbor, so logs dropped on one spot
//     make a mound a block a step, on a pile or on open ground alike, and
//     never a tower (the owner, 2026-10-28: "the way logs pile up and level
//     out is weird").
// A roll never leaves the block's region nor its lattice, so a pile's heap
// keeps to its strip. Every move goes down a cell, so a heap only ever
// settles: nothing moves sideways at the same height, nothing levels out once
// it has come to rest, and nothing can oscillate.
function stepBlock(b, ai, skip) {
  globalThis.__perf.blocks++;
  const cols = b.cols, c0 = ai % cols, r0 = (ai - c0) / cols, v = b.grid[ai], z = sizeOfCell(v);
  if (r0 === 0) return;
  let left = 0, right = 0;
  for (let i = 0; i < z; i++) if (b.grid[(r0 - 1) * cols + c0 + i]) { if (i < z / 2) left++; else right++; }
  if (left + right === 0) { moveBlock(b, c0, r0, c0, r0 - 1, z, v); return; }
  // Whether it may roll into the slot beside it on side `dir`, from `lowest`
  // up: on the plot, on the lattice and in its region, not barred, not too
  // tall for the ceiling, and clear from `lowest` through the rows it passes.
  const open = (dir, lowest) => {
    const n0 = c0 + dir * z;
    if (n0 < 0 || n0 + z > cols || slotOf(b, n0, z) !== n0 || !sameRegion(b, c0, n0)) return false;
    // Whether that strip may hold it where it will come to rest, the top of
    // what lies there, not where the block is now: a column over a lower
    // ceiling is still a place to roll down to (a spike three blocks tall
    // beside a pile's lower flank rolls into it).
    let rest = 0;
    for (let c = n0; c < n0 + z; c++) {
      if (skip && skip(c)) return false;
      rest = Math.max(rest, topRow(b, c) + 1);
    }
    for (let c = n0; c < n0 + z; c++) if (!roomFor(b, c, Math.min(r0 + z - 2, rest + z - 1))) return false;
    return emptyRect(b, n0, lowest, z, r0 + z - lowest);
  };
  const first = (Math.floor(c0 / z) + r0) & 1 ? -1 : 1;
  if ((left + right) * 2 >= z) {
    if (r0 < z || !emptyRect(b, c0, r0 + z, z, 1)) return;
    for (const dir of [first, -first]) if (open(dir, r0 - z)) { moveBlock(b, c0, r0, c0 + dir * z, r0 - 1, z, v); return; }
    return;
  }
  const dir = left < right ? -1 : right < left ? 1 : first;
  if (open(dir, r0 - 1)) moveBlock(b, c0, r0, c0 + dir * z, r0 - 1, z, v);
}
function moveBlock(b, c0, r0, n0, nr, z, v) {
  eraseBlock(b, c0, r0, z);
  writeBlock(b, n0, nr, z, v);
  if (b.onMove) b.onMove(r0 * b.cols + c0, nr * b.cols + n0);
}

// What must hold of a grid's blocks, for a check or a verify rule: every block
// is whole (its square all one value and all naming it), on its lattice, and
// no layer cell names a block that is not there. Empty when sound.
export function blockProblems(b) {
  const bad = [];
  if (!b.blockN) return bad;
  const lay = liveBlocks(b);
  if (!lay) return ['the block layer is for other cells'];
  const named = new Set();
  for (const ai of b.blockSet) {
    const c0 = ai % b.cols, r0 = (ai - c0) / b.cols, v = b.grid[ai], z = sizeOfCell(v);
    if (z === 1) { bad.push(`the block at ${c0},${r0} is not a block's value (${v})`); continue; }
    if (slotOf(b, c0, z) !== c0) bad.push(`the block at ${c0},${r0} is off its lattice (${z})`);
    for (let j = 0; j < z; j++) for (let i = 0; i < z; i++) {
      const k = (r0 + j) * b.cols + c0 + i;
      if (b.grid[k] !== v || lay[k] !== ai + 1) bad.push(`the block at ${c0},${r0} is missing its cell ${c0 + i},${r0 + j}`);
      named.add(k);
    }
  }
  for (let k = 0; k < lay.length; k++) if (lay[k] && !named.has(k)) bad.push(`cell ${k % b.cols},${Math.floor(k / b.cols)} names a block that is not there`);
  return bad;
}
