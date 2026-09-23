// A painter keeps a scratch canvas at one pixel per cell, is told about every
// cell that changes, pushes only those across, and blits the whole thing up to
// size in one drawImage; a grain a fillRect is the most expensive thing in the
// frame once there are tens of thousands. Give a grid one and hand it `mark`
// as its `onPut` (wirePit, wireGround). Anything the painter has no color for
// is left clear, so a grid can keep values of its own (the pit's cores) and
// draw them itself, on top.

import { SHADES, FIND_COLOR } from './config.js';
import { inkOf } from './ink.js';   // the bytes go straight in, past the context's setter

const rgb = h => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// the shades as packed RGBA, so a grain is four array writes
const RGBA = SHADES.map(h => rgb(inkOf(h)));

// The colors for the cells that are not dust: a shard in a pile is painted by
// the same pass as the dust around it. Anything with no color here is left
// clear for its owner to draw on top.
const EXTRA = new Map();
for (const [base, tones] of Object.entries(FIND_COLOR)) {
  tones.forEach((h, i) => EXTRA.set(+base + i, rgb(inkOf(h))));
}

// Cells rewritten since the last reset, the same handle `settleWork` in grid.js
// keeps: a count of cells rather than a stopwatch reading that would mean
// something different on every machine.
let work = 0;
export const paintWork = () => work;
export const resetPaintWork = () => { work = 0; };

// How big a patch the painter tracks as one, in cells. A tile is the smallest
// thing that can be dirty, so one grain landing costs a whole tile. Measured
// on a pressed hole with two hundred thousand dust, in cells rewritten a
// frame (mean / worst): 32 -> 3314 / 11936, 8 -> 576 / 2344, 4 -> 269 / 1140.
// Four and eight are both small enough that the number stopped mattering, so
// eight, which is half the tiles to track. A shift rather than a divide.
const TILE = 8, SHIFT = 3;

export function makePainter(b) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let image = null;

  // What has changed since the last paint, as tiles rather than one bounding
  // box: paying for something lifts grains off the top of the pile along the
  // whole length of it, and the box around that is the width of the hole
  // (20,859 cells on the worst frame against 2344 in tiles). `dirty` is the
  // list of tiles somebody has marked; `flag` is the set, so a tile marked
  // twice is listed once.
  let flag = null, dirty = [], tCols = 0, tRows = 0;
  let all = true;                          // true means push the whole grid across

  const mark = (c, r) => {
    if (!flag) return;                     // nothing sized yet: the next paint is a full one
    const t = (r >> SHIFT) * tCols + (c >> SHIFT);
    if (flag[t]) return;
    flag[t] = 1;
    dirty.push(t);
  };

  // the grid changed out from under us -- resized, refilled, loaded
  const repaint = () => { all = true; };
  // Only its bottom `rows` changed, all the way across: the belt's load,
  // moved a cell along a strip that runs to the top of the world.
  const repaintBelow = rows => {
    for (let r = 0; r < rows; r += TILE) for (let c = 0; c < b.cols; c += TILE) mark(c, r);
  };

  // Rewrite one tile's worth of pixels, clamped to the plot at its far edges.
  // Row 0 is the floor of the grid, so the image is built upside down.
  const writeTile = (d, c0, r0) => {
    const cEnd = Math.min(c0 + TILE, b.cols), rEnd = Math.min(r0 + TILE, b.rows);
    for (let r = r0; r < rEnd; r++) {
      const py = b.rows - 1 - r;
      for (let c = c0; c < cEnd; c++) {
        const v = b.grid[r * b.cols + c];
        const i = (py * b.cols + c) * 4;
        const col = v >= 1 && v <= RGBA.length ? RGBA[v - 1] : EXTRA.get(v);
        if (!col) { d[i + 3] = 0; continue; }
        d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
      }
    }
    work += (cEnd - c0) * (rEnd - r0);
  };

  const paint = (into, x, y, w, h) => {
    if (!b.grid) return;
    if (canvas.width !== b.cols || canvas.height !== b.rows) {
      canvas.width = b.cols;
      canvas.height = b.rows;
      image = ctx.createImageData(b.cols, b.rows);
      // A fresh scratch canvas holds nothing, so everything is dirty.
      tCols = Math.ceil(b.cols / TILE);
      tRows = Math.ceil(b.rows / TILE);
      flag = new Uint8Array(tCols * tRows);
      dirty = [];
      all = true;
    }

    if (all) {
      const d = image.data;
      for (let r0 = 0; r0 < b.rows; r0 += TILE)
        for (let c0 = 0; c0 < b.cols; c0 += TILE) writeTile(d, c0, r0);
      ctx.putImageData(image, 0, 0);
      flag.fill(0);
      dirty.length = 0;
      all = false;
    } else if (dirty.length) {
      const d = image.data;
      // Written per tile, blitted in one call: a `putImageData` over the box
      // around a handful of tiles is a native copy and cheap; the same box
      // walked in JavaScript is what the cost was.
      let cLo = b.cols, cHi = -1, rLo = b.rows, rHi = -1;
      for (const t of dirty) {
        const c0 = (t % tCols) * TILE, r0 = ((t - t % tCols) / tCols) * TILE;
        writeTile(d, c0, r0);
        flag[t] = 0;
        if (c0 < cLo) cLo = c0;
        if (c0 + TILE > cHi) cHi = Math.min(c0 + TILE, b.cols);
        if (r0 < rLo) rLo = r0;
        if (r0 + TILE > rHi) rHi = Math.min(r0 + TILE, b.rows);
      }
      dirty.length = 0;
      ctx.putImageData(image, 0, 0, cLo, b.rows - rHi, cHi - cLo, rHi - rLo);
    }

    const smooth = into.imageSmoothingEnabled;
    into.imageSmoothingEnabled = false;    // grains are squares, not smudges
    into.drawImage(canvas, x, y, w, h);
    into.imageSmoothingEnabled = smooth;
  };

  return { mark, repaint, repaintBelow, paint };
}
