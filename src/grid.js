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
// for the owner to mean what it likes by (the pit puts cores in its pile).

import { SHADES } from './config.js';
import { rand } from './rng.js';

export const shadeOf = v => SHADES[Math.min(SHADES.length, Math.max(1, v)) - 1];

// The perf gate's counters (test/perf-gate.test.mjs): counted per frame, not
// timed, because a count is the same on a loaded machine. Published on
// `globalThis` so the check reads the live module's count and not a second
// instance's. `route.js` adds to `ways`; `addGrain` adds to the other two.
globalThis.__perf = { ways: 0, grainCols: 0, grains: 0 };

// A cell holds a shade of dust, or something that is not dust at all (a core,
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
let work = 0;
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
// age is how long it has lain *there*. Read by the carters' `HAUL_FIFO` pick.
let clock = 0;
export const tickGrid = () => { clock++; };
export const ageAt = (b, c, r) => b.age ? b.age[r * b.cols + c] : 0;

export const put = (b, c, r, v) => {
  const i = r * b.cols + c;
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
export const recount = b => { b.n = count(b); b.d = countDust(b); wakeGrid(b); };
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
export function surfaceY(b, c) {
  for (let r = b.rows - 1; r >= 0; r--) {
    if (at(b, c, r)) return bottomY(b) - (r + 2) * b.p;
  }
  return bottomY(b) - b.p;
}

// the topmost grain in a column, or -1
export function topRow(b, c) {
  for (let r = b.rows - 1; r >= 0; r--) if (at(b, c, r)) return r;
  return -1;
}

// How high a column may stand. A grid with no ceiling has no limit; a
// ceiling is how a bank is kept from standing up as a wall.
export const roomFor = (b, c, r) => !b.ceiling || r < b.ceiling(c);

// How far a grain may walk to get out from under something that is not
// ground, in columns: however wide the thing in the way is, and the widest
// is the hill with its clearance, a little over eighty columns. Past the
// reach the grain is dropped: falling off the world is truer than appearing
// in a heap nobody filled. A rock grown wider wants this raised.
export const BARRED_REACH = 96;

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
  const barred = c => at(b, c, b.rows - 1) || (skip && skip(c));
  // (the increment is the perf gate's: one per column asked whether it has room)
  const full = c => (globalThis.__perf.grainCols++, barred(c) || (!free && !roomFor(b, c, topRow(b, c) + 1)));
  if (full(col)) {
    const out = barred(col);
    const from = out || !b.region ? null : b.region(col);
    const reach = out ? BARRED_REACH : b.cols;
    // The region is asked *before* the column is, and a side that has left
    // the region is not looked at again: `full` walks a column's rows, and
    // asking it of every column in the world for each grain landing on a
    // heaped strip was the whole of the endgame's frame spike.
    const inRegion = c => from === null || b.region(c) === from;
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
    if (!at(b, col, r)) { put(b, col, r, shade); return true; }
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
        if (b.repose && r >= 2 && at(b, n, r - 2)) continue;
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
  wakeGrid(b);                             // the cells went, and not through `put`
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
