// The afterlife's ground, in three rigid layers (the owner, 2026-10-20: "for
// the main plane, the plane where all the stations are on, where the workers
// exist. that should be the same distance and camera setup as the yard ...
// the only things that change are the surrounding aspects. the foreground, in
// front of the main plane can be clouds, the plane should static cloud like
// paths, not a flat plane"):
//
// - the far bank, between the horizon and the main plane, on God's slow layer;
// - the main plane's own ground is render/after/floor.js's path, on the world
//   itself (speed 1), the camera the yard's, its near edge lapped by cloud;
// - the foreground, below the main plane, rolling cloud.
//
// The far bank and the foreground are the one cloud renderer's
// (render/after/cloudsky.js): each layer set down as one piece at its offset
// off the world, so nothing in it shears or jitters as the camera slides.

import { P, GREY } from '../../config.js';
import { ctx } from '../ctx.js';
import { fillOnPixels } from '../frame.js';
import { W } from './kit.js';
import { putAfterCloud } from './cloudsky.js';

const lerp = (a, b, k) => a + (b - a) * k;
const hsh = (a, b = 0, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
// lip() draws straight onto the page: every fill on whole device pixels, so a
// thin line never blends into a tone between the four.
const fr = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; fillOnPixels(ctx, x, y, w, h); };

// --- the far bank and the foreground ------------------------------------------------------
// Both are the one cloud renderer's ground billows (render/after/cloudsky.js,
// CLOUDS_ACT3): the far bank from the horizon down behind the main plane, on
// God's slow layer; the foreground rolling below the path, faster than the
// camera, solid to the bottom of the window.
export function drawGround() {
  if (!ctx) return;
  putAfterCloud('far');
}
export function drawForeground() {
  if (!ctx) return;
  putAfterCloud('fore');
}

// --- a lip of billow -----------------------------------------------------------------------
// A lip standing on cell row `base` from cell x0 to x1, h cells tall: a few
// round tops side by side, paper, with `line` along the top -- the floor's
// own drawing, put in front of a body's feet. Cells are world cells.
export function lip(x0, x1, base, h, line, seed, rw) {
  const rb = rw || Math.max(2, h * 1.7), n = Math.max(1, Math.round((x1 - x0) / (1.5 * rb))), step = (x1 - x0) / n;
  const tops = new Array(x1 - x0 + 3).fill(0);
  for (let b = 0; b <= n; b++) {
    const c = x0 + b * step + (hsh(seed, b) - 0.5) * step * 0.4, hb = h * lerp(0.75, 1.1, hsh(seed, b, 3));
    for (let x = x0 - 1; x <= x1 + 1; x++) {
      const u = (x + 0.5 - c) / rb;
      if (Math.abs(u) < 1) tops[x - x0 + 1] = Math.max(tops[x - x0 + 1], hb * Math.sqrt(1 - u * u));
    }
  }
  for (let x = x0 - 1; x <= x1 + 1; x++) {
    const t = Math.round(tops[x - x0 + 1]);
    if (t < 1) continue;
    const l = Math.round(tops[x - x0] || 0), r = Math.round(tops[x - x0 + 2] || 0);
    fr(x * P, (base - t) * P, P, t * P, W);
    const lo = l < 1 || r < 1 ? 1 : Math.max(1, Math.min(t, t - Math.min(l, r) + 1));
    if (line != null) fr(x * P, (base - t - 1) * P, P, Math.min(lo, t) * P, line);
  }
}
