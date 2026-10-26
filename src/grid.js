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
//   awake, awakeOf, awakeN, awakeList    which columns are still moving; see below
//
// The four `awake*` fields are this file's own, but a new grid should still
// declare them empty in its object literal: a grid object is read a hundred
// thousand times a frame and growing its shape late costs more than they
// save. See `floor` in state.js.
//
// Cells hold a shade, 1..SHADES.length, or 0 for empty. Anything above that is
// for the owner to mean what it likes by (the finds, and the cut's rock).

import { SHADES } from './config.js';
import { rand } from './rng.js';

export const shadeOf = v => SHADES[Math.min(SHADES.length, Math.max(1, v)) - 1];

// The perf gate's counters (test/perf-gate.test.mjs): counted per frame, not
// timed, because a count is the same on a loaded machine. Published on
// `globalThis` so the check reads the live module's count and not a second
// instance's. `route.js` adds to `ways` and `stances`; `addGrain` adds to the
// other two; `surveyFloor` (game.js) to `surveys` and the cells it read;
// `topRow` to `tops` and the cells it read finding them.
globalThis.__perf = { ways: 0, grainCols: 0, grains: 0, stances: 0, surveys: 0, surveyCells: 0, tops: 0, topCells: 0 };

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
  if (!cols.length) return 0;
  const wide = cols.length;
  for (let r = 1; r < b.rows; r++) {
    for (let k = 0; k < wide; k++) {
      const c = cols[k];
      if (!at(b, c, r)) continue;
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
