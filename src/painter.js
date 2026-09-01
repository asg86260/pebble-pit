// Drawing a sand grid one grain at a time is fine until there are tens of
// thousands of them, and then it is the most expensive thing in the frame.
//
// A painter keeps a scratch canvas at one pixel per cell. It is told about every
// cell that changes, pushes only those across, and blits the whole thing up to
// size in a single call. A million fillRects a frame is not a drawing routine;
// one drawImage is.
//
// Give a grid one and hand it the `mark` as its `onPut` -- see wirePit and
// wireGround. Anything the painter does not have a color for is left clear, so
// a grid can keep values of its own in cells (the pit keeps cores in its pile)
// and draw them itself, on top.

import { SHADES, FIND_COLOR } from './config.js';

const rgb = h => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// the shades as packed RGBA, so a grain is four array writes
const RGBA = SHADES.map(rgb);

// and the colors for the cells that are not dust. A shard in a pile is painted
// by the same pass that paints the dust around it, which is what makes a heap of
// them as solid as a heap of anything else. Anything with no color here is
// still left clear, for its owner to draw on top -- the pit's cores are drawn as
// rings that way, because a core is a thing rather than a grain.
const EXTRA = new Map();
for (const [base, tones] of Object.entries(FIND_COLOR)) {
  tones.forEach((h, i) => EXTRA.set(+base + i, rgb(h)));
}

// What the painters have actually rewritten since it was last reset, in cells.
// The same handle `settleWork` in grid.js keeps, and for the same reason: what
// this file is for is not doing work, so the check that it does not do work is
// written as a count of cells read rather than as a stopwatch reading that would
// mean something different on every machine that ran it.
let work = 0;
export const paintWork = () => work;
export const resetPaintWork = () => { work = 0; };

// How big a patch the painter tracks as one, in cells. A tile is the smallest
// thing that can be dirty, so one grain landing costs a whole tile however few
// cells actually moved -- which makes the size a floor under every frame, and
// the floor is what has to be measured rather than guessed.
//
// Measured on a pressed hole with two hundred thousand dust in it, the machines
// running and the belt feeding the lip, in cells rewritten per frame:
//
//   tile   mean   worst frame
//    32    3314      11936     -- a whole tile to move one grain: worse than a box
//     8     576       2344
//     4     269       1140
//
// Thirty-two loses to the bounding box it replaced on an ordinary frame and only
// wins on the bad ones, which is the wrong trade. Four is better again, and both
// it and eight are already small enough that the number stopped mattering -- so
// eight, which is half the tiles to keep track of for a cost that is the same
// nothing. It is a shift rather than a divide.
const TILE = 8, SHIFT = 3;

export function makePainter(b) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let image = null;

  // What has changed since the last paint.
  //
  // This used to be one bounding box -- the lowest and highest column and row
  // any `mark` had named -- and a box is the wrong shape for what happens to a
  // pile. Two grains landing at opposite ends of the hole are two cells changed
  // and a box the full width of the plot, so nearly the whole grid was rewritten
  // to move two grains.
  //
  // What that actually cost had to be measured rather than argued, and the
  // measurement is smaller than the argument: on a pressed hole with two hundred
  // thousand dust in it the box averaged 1749 cells a frame and its worst frame
  // was 20,859 -- against a plot of 383,400. So the box was never rewriting the
  // whole plot every frame, and this was not the thing making the endgame slow.
  //
  // It is still the wrong shape, and the bad frames are the ones that show it:
  // paying for something lifts grains off the top of the pile along the whole
  // length of it, and the box around that is the width of the hole by however
  // deep the payment cut. Diced into tiles the same frame is 2344 cells instead
  // of 20,859, and the ordinary frame is 576 instead of 1749.
  //
  // `dirty` is the list of tiles somebody has marked, so a frame that touches
  // four tiles looks at four rather than at all of them; `flag` is the set, so a
  // tile marked twice is only listed once.
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
      // A fresh scratch canvas holds nothing, so whatever any tile was told
      // about before it is no longer on the glass. Everything is dirty.
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
      // The pixels are written per tile, but they go across in one call: a
      // `putImageData` is a copy the browser does natively, and the box around
      // a handful of tiles is cheap in a way that the same box walked in
      // JavaScript is not. So the box is back -- for the blit alone, which
      // never cared, and not for the rewrite, which is what the cost was.
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

  return { mark, repaint, paint };
}
