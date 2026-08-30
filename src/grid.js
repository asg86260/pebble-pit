// The falling-sand grid, and nothing else.
//
// A grid is any object of the shape below. Nothing in here knows what a rock or
// a pit or a worker is, so a new one -- a quarry floor, a farm plot -- is a new
// object, not new code.
//
//   { x, y, cols, rows, p, grid }        where and how big, and the cells
//   blocked(c)                           optional: columns dust may not settle in
//   ceiling(c)                           optional: how high a column may stand
//   onPut(c, r)                          optional: told about every cell written
//   repose                               optional: heaps stand up instead of spreading flat
//   spillsInto(x), spillsAt, spill(x, y, v)   optional: where a heap topples over an edge
//
// Cells hold a shade, 1..SHADES.length, or 0 for empty. Anything above that is
// for the owner to mean what it likes by (the pit puts cores in its pile).

import { SHADES } from './config.js';

export const shadeOf = v => SHADES[Math.min(SHADES.length, Math.max(1, v)) - 1];

// A cell holds a shade of dust, or something that is not dust at all: a core,
// a shard or a spore. They live in the same plots and move the same way;
// what they are not is worth one dust.
export const isDust = v => v > 0 && v <= SHADES.length;

// Shade reads how much rock is left, relative to that rock's own thickness: a
// rock is black where it is at full thickness and pales as it is worn through.
// So rock 1, one sheet everywhere, is solid black, and so is the dust off it.
// Nothing of ours is ever drawn over the rock -- the crew stand on top of it and
// the spoil lands to either side of it -- so black on black never comes up.
export const depthShade = (v, max) =>
  Math.max(1, Math.min(SHADES.length, Math.ceil(SHADES.length * v / Math.max(1, max))));

// A shade near a given one, for anything that makes dust without a reason to
// pick a particular darkness. Spoil off the rock has a reason -- it comes out
// the shade of the depth it was cut from, see `depthShade` -- but a machine
// handing back what it caught has none, and paying out on one fixed tone gave
// a heap that was a flat block of a single grey where every other pile in the
// yard is mottled. Clamped, so a centre near either end of the range simply
// leans that way instead of running off it.
export const shadeNear = (centre, spread = 1) =>
  Math.max(1, Math.min(SHADES.length,
                       Math.round(centre + (Math.random() * 2 - 1) * spread)));

export const at = (b, c, r) => b.grid[r * b.cols + c];

// A grid may keep a live count of how many of its cells are occupied. Give it an
// `n` and this maintains it; leave `n` undefined and nothing is counted.
//
// It exists because the pit has to ask "is there room in the hole" thousands of
// times a frame, and walking sixty thousand cells to answer that is not on. It
// used to ask the *counter* instead -- how much dust you have banked -- which is
// nearly the same number and was wrong in exactly the way that matters: a core
// in the pile takes a cell and is not dust, so the hole filled up one grain
// before the counter said it had, the heap over the mouth never unlocked, and
// the crew stood at the lip throwing dust at a brim that would not take it.
export const put = (b, c, r, v) => {
  const i = r * b.cols + c;
  if (b.n != null) b.n += (v ? 1 : 0) - (b.grid[i] ? 1 : 0);
  b.grid[i] = v;
  if (b.onPut) b.onPut(c, r);
};

export const inside = (b, c, r) => c >= 0 && c < b.cols && r >= 0 && r < b.rows;
export const bottomY = b => b.y + b.rows * b.p;    // world y of the grid floor
export const colOf = (b, x) => Math.floor((x - b.x) / b.p);

export const count = b => { let n = 0; for (const v of b.grid) if (v) n++; return n; };
// after anything that writes the cells wholesale rather than through `put`
export const recount = b => { b.n = count(b); };
export const countDust = b => {
  let n = 0;
  for (const v of b.grid) if (isDust(v)) n++;
  return n;
};

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

// how high a column is allowed to stand. A grid with no ceiling has no limit:
// this is how a bank is kept from standing up as a wall against whatever is
// beside it, by letting it rise only as it gets further away.
export const roomFor = (b, c, r) => !b.ceiling || r < b.ceiling(c);

// drop one grain in at x. If that column is full or barred it goes in the
// nearest one that is not; false means there was nowhere at all.
// `free` ignores the ceiling: what a bank may stand at is about heaps of dust,
// and a single thing that is not dust lies where it was dropped.
export function addGrain(b, x, skip = b.blocked, shade = 1, free = false) {
  let col = Math.max(0, Math.min(b.cols - 1, colOf(b, x)));
  // Two different reasons a column will not take a grain, and they want two
  // different answers.
  //
  // **Barred** is not ground at all: under the rock, over the mouth of the hole,
  // over the mouth of the cut. A grain aimed there has to go somewhere, and how
  // far it has to walk to find ground is however wide the thing in the way is --
  // the rock is forty cells across. So that search stays unbounded.
  //
  // **Heaped** is ground that has simply reached its ceiling. That search used
  // to be unbounded too, and it is where dust was teleporting from: a grain
  // landing on a full patch of bare yard walked outward until it found room,
  // which was usually the nearest station's strip, a hundred cells away. The
  // spout paid out and the grain appeared in the farm's heap.
  //
  // A grain rolling off the shoulder of a heap onto the next column is a thing
  // that happens. Travelling the length of the yard to find a hole is not, and
  // it is worse than losing the grain, because it puts dust somewhere nobody
  // carried it. So it looks a few cells either side and then gives up.
  const barred = c => at(b, c, b.rows - 1) || (skip && skip(c));
  const full = c => barred(c) || (!free && !roomFor(b, c, topRow(b, c) + 1));
  if (full(col)) {
    // ...and it may not cross out of the ground it landed on.
    //
    // Distance was the wrong rule to reach for. A heap is *meant* to spread: a
    // load tipped at the lip fills the hole end to end, and the scrubbing house's
    // chute pays out along its own strip until the strip is full. What was
    // actually wrong is that a grain could spread out of one kind of ground and
    // into another -- land on a full patch of bare yard, walk outward looking for
    // room, and come to rest in the nearest station's heap a hundred cells away.
    // The spout paid out and the dust appeared somewhere nobody had carried it.
    //
    // So it spreads as far as it likes inside the strip it is in, or along the
    // bare ground it is on, and never from one into the other. See `floor.region`.
    //
    // Barred ground is the exception and stays exempt: under the rock, over the
    // mouth of the hole, over the mouth of the cut. That is not ground at all, a
    // grain aimed there has to go *somewhere*, and how far it must walk is
    // however wide the thing in the way is.
    const from = barred(col) || !b.region ? null : b.region(col);
    const ok = c => !full(c) && (from === null || b.region(c) === from);
    let alt = -1;
    for (let d = 1; d < b.cols; d++) {
      if (col - d >= 0 && ok(col - d)) { alt = col - d; break; }
      if (col + d < b.cols && ok(col + d)) { alt = col + d; break; }
    }
    col = alt;
  }
  if (col < 0) return false;
  for (let r = 0; r < b.rows; r++) {
    if (!at(b, col, r)) { put(b, col, r, shade); return true; }
  }
  return false;
}

// One sand tick: unsupported grains fall, then slump sideways. `from`/`to` limit
// it to a band of columns, so a very large grid can be settled a piece a frame.
export function settle(b, skip = b.blocked, from = 0, to = b.cols) {
  for (let r = 1; r < b.rows; r++) {
    for (let c = from; c < to; c++) {
      if (!at(b, c, r)) continue;
      const v = at(b, c, r);
      if (!at(b, c, r - 1)) { put(b, c, r, 0); put(b, c, r - 1, v); continue; }
      const first = (c + r) & 1 ? -1 : 1;   // alternate bias so piles stay even
      for (const d of [first, -first]) {
        const n = c + d;
        // A heap against an edge topples over it. It has to be piled up to do
        // it: a thin scatter just rests against the wall.
        if (b.spill && d > 0 && r >= b.spillsAt && n < b.cols && b.spillsInto(b.x + n * b.p)) {
          put(b, c, r, 0);
          b.spill(b.x + n * b.p, bottomY(b) - (r + 1) * b.p, v);
          break;
        }
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
}

// A big grid is too many cells to walk every frame, so it is settled a band of
// columns at a time, picking up where it left off. The sand slumps a beat behind
// itself, which nobody can see, and the frame cost is flat whatever the size.
export function settleSome(b, budget) {
  const band = Math.max(1, Math.min(b.cols, Math.floor(budget / b.rows)));
  const from = b.settleAt || 0;
  settle(b, undefined, from, Math.min(b.cols, from + band));
  b.settleAt = from + band >= b.cols ? 0 : from + band;
}

// re-pack n grains into a grid from the bottom up, ignoring shape
export function fillFlat(b, n) {
  b.grid.fill(0);
  if (b.painter) b.painter.repaint();
  n = Math.min(n, b.cols * b.rows);
  const shade = 4;                         // repacked dust, middling grey
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
  if (b.grid && b.grid.length === want) return;
  b.grid = new Uint8Array(want);
  fillFlat(b, had);
  if (b.painter) b.painter.repaint();
}
