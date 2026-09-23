// A block of cells painted into an image, a pixel a cell, and drawn once
// scaled up with no smoothing. For the things drawn a cell at a time over a
// large stretch of the window every frame -- the serpent's coil -- where a
// fillRect a cell was the frame's whole cost on a large screen. The tones go
// through the page's own palette (`inkOf`), as a fillStyle would, so a cell
// comes out the color it would have been drawn.

import { P } from '../config.js';
import { inkOf } from '../ink.js';

const rgbOf = new Map();
function rgba(c) {
  let v = rgbOf.get(c);
  if (v) return v;
  const h = inkOf(c).replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(d => d + d).join('') : h, 16);
  v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  rgbOf.set(c, v);
  return v;
}

// One reusable image a caller, grown as needed.
export function cellImage() {
  let img = null, g = null, buf = null, cols = 0, rows = 0;
  return {
    // Start a block `c` cells by `r`, every cell clear.
    begin(c, r) {
      cols = c; rows = r;
      if (!img) { img = document.createElement('canvas'); g = img.getContext('2d'); }
      if (img.width < c || img.height < r) { img.width = Math.max(img.width, c); img.height = Math.max(img.height, r); buf = null; }
      if (!buf || buf.width !== c || buf.height !== r) buf = g.createImageData(c, r);
      buf.data.fill(0);
    },
    // Cell `i` (row-major) in the color `c`.
    put(i, c) {
      const [r, gg, b] = rgba(c), d = buf.data, k = i * 4;
      d[k] = r; d[k + 1] = gg; d[k + 2] = b; d[k + 3] = 255;
    },
    // The block onto `ctx`, its first cell at world (x, y).
    draw(ctx, x, y) {
      g.putImageData(buf, 0, 0);
      const smooth = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, cols, rows, x, y, cols * P, rows * P);
      ctx.imageSmoothingEnabled = smooth;
    }
  };
}
