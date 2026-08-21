// Drawing a sand grid one grain at a time is fine until there are tens of
// thousands of them, and then it is the most expensive thing in the frame.
//
// A painter keeps a scratch canvas at one pixel per cell. It is told about every
// cell that changes, pushes only those across, and blits the whole thing up to
// size in a single call. A million fillRects a frame is not a drawing routine;
// one drawImage is.
//
// Give a grid one and hand it the `mark` as its `onPut` -- see wirePit and
// wireGround. Anything the painter does not have a colour for is left clear, so
// a grid can keep values of its own in cells (the pit keeps cores in its pile)
// and draw them itself, on top.

import { SHADES } from './config.js';

// the shades as packed RGBA, so a grain is four array writes
const RGBA = SHADES.map(h => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
});

export function makePainter(b) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  let image = null;
  let painted = false;                     // false means push the whole grid across
  let lo = 0, hi = -1, top = -1, bot = 0;  // what has changed since the last paint

  const mark = (c, r) => {
    if (c < lo) lo = c;
    if (c > hi) hi = c;
    if (r < top || top < 0) top = r;
    if (r > bot) bot = r;
  };

  // the grid changed out from under us -- resized, refilled, loaded
  const repaint = () => { painted = false; };

  const paint = (into, x, y, w, h) => {
    if (!b.grid) return;
    if (canvas.width !== b.cols || canvas.height !== b.rows) {
      canvas.width = b.cols;
      canvas.height = b.rows;
      image = ctx.createImageData(b.cols, b.rows);
      painted = false;
    }
    if (!painted) { lo = 0; hi = b.cols - 1; top = 0; bot = b.rows - 1; }

    if (hi >= lo && top >= 0) {
      const d = image.data;
      for (let r = top; r <= bot; r++) {
        // row 0 is the floor of the grid, so the image is built upside down
        const py = b.rows - 1 - r;
        for (let c = lo; c <= hi; c++) {
          const v = b.grid[r * b.cols + c];
          const i = (py * b.cols + c) * 4;
          const rgb = v >= 1 && v <= RGBA.length ? RGBA[v - 1] : null;
          if (!rgb) { d[i + 3] = 0; continue; }
          d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255;
        }
      }
      ctx.putImageData(image, 0, 0, lo, b.rows - 1 - bot, hi - lo + 1, bot - top + 1);
      painted = true;
      lo = b.cols; hi = -1; top = -1; bot = 0;
    }

    const smooth = into.imageSmoothingEnabled;
    into.imageSmoothingEnabled = false;    // grains are squares, not smudges
    into.drawImage(canvas, x, y, w, h);
    into.imageSmoothingEnabled = smooth;
  };

  return { mark, repaint, paint };
}
