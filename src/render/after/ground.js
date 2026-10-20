// The afterlife's ground, in three rigid layers (the owner, 2026-10-20: "for
// the main plane, the plane where all the stations are on, where the workers
// exist. that should be the same distance and camera setup as the yard ...
// the only things that change are the surrounding aspects. the foreground, in
// front of the main plane can be clouds, the plane should static cloud like
// paths, not a flat plane"):
//
// - the far cloud, between the horizon and the main plane: a few calm rows of
//   billow lines, smaller toward the horizon, on God's slow layer;
// - the main plane's own ground is render/after/floor.js's path, on the world
//   itself (speed 1), the camera the yard's;
// - the foreground, below the main plane: a few big calm clouds, sparse.
//
// Each layer moves as one piece: its offset off the world is worked out once
// a frame and put on a whole device pixel, and everything in it is laid on
// the cell grid off that offset, so nothing in a layer shears against the
// rest of it or jitters when the camera slides. Nothing rolls.

import { P, GREY, AFTER_HORIZON, GROUND_FAR, GROUND_FORE, GROUND_PATH } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';
import { layerAt } from '../frame.js';
import { horizonY } from '../../after/sky.js';
import { afterFloor, afterOpenX, billow } from '../../after/place.js';
import { W, PALE, MID } from './kit.js';

const lerp = (a, b, k) => a + (b - a) * k;
const hsh = (a, b = 0, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const fr = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; ctx.fillRect(x, y, w, h); };

// A layer sliding `rate` as fast as the camera: its offset off the world,
// landing on a whole device pixel of its own (render/frame.js, `layerAt`).
// It stands where its x says with the window's middle where the act opens.
const layerOff = rate => layerAt(0, rate, afterOpenX());

// --- the far cloud --------------------------------------------------------------------
// Rows at depths along the way back, each a run of billow tops a cell or two
// high, its cells 1/d of the near layer's across, in the pale line tone. A
// row's profile repeats every `period` of its own cells.
const farRows = new Map();
function farRow(i) {
  let el = farRows.get(i);
  if (!el) { el = billow(GROUND_FAR.period, GROUND_FAR.seed + i * 7, 1); farRows.set(i, el); }
  return el;
}
function drawFar() {
  const off = layerOff(GROUND_FAR.rate), hy = horizonY(), x0 = S.camX - off, x1 = x0 + S.viewW;
  GROUND_FAR.depths.forEach((d, i) => {
    const y = Math.round((hy + AFTER_HORIZON * P / d) / 2) * 2, c = Math.max(2, Math.round(P / d / 2) * 2), el = farRow(i);
    const j0 = Math.floor(x0 / c) - 1, j1 = Math.ceil(x1 / c) + 1, n = el.length;
    ctx.fillStyle = GREY[PALE];
    let run = j0, at = el[((j0 % n) + n) % n];
    const flush = j => { if (j > run) ctx.fillRect(run * c + off, y - at * c, (j - run) * c, 2); };
    for (let j = j0 + 1; j <= j1; j++) {
      const v = el[((j % n) + n) % n];
      if (v === at) continue;
      flush(j);
      // the step between the two, joined down
      ctx.fillRect(j * c + off - (v > at ? 0 : 2), y - Math.max(v, at) * c, 2, Math.abs(v - at) * c);
      run = j; at = v;
    }
    flush(j1);
  });
}

// --- the foreground ---------------------------------------------------------------------
// Big calm clouds below the main plane, a few to a window: each a round head
// of paper cells with a line of mid along its top, set irregularly along a
// row a band down off the path, the nearer row bigger and lower.
function puff(cx, base, w, h) {
  const n = Math.round(w), x0 = Math.round(cx / P - n / 2);
  let prev = 0;
  for (let i = 0; i <= n; i++) {
    const u = (i + 0.5 - n / 2) / (n / 2), t = i < n ? Math.round(h * Math.sqrt(Math.max(0, 1 - u * u))) : 0;
    const x = (x0 + i) * P;
    if (t > 0) { fr(x, base - t * P, P, t * P, W); fr(x, base - t * P, P, 2, MID); }
    if (t !== prev && i > 0) fr(x - (t > prev ? 0 : 2), base - Math.max(t, prev) * P, 2, Math.abs(t - prev) * P, MID);
    prev = t;
  }
}
function drawFore() {
  const F = GROUND_FORE, off = layerOff(F.rate), fl = afterFloor() + GROUND_PATH.depth * P;
  const x0 = S.camX - off, x1 = x0 + S.viewW, bot = S.camY + S.viewH;
  F.rows.forEach((row, r) => {
    const base = fl + row.down * P;
    if (base - row.h[1] * P > bot) return;
    const k0 = Math.floor((x0 - row.w[1] * P) / (row.every * P)), k1 = Math.ceil((x1 + row.w[1] * P) / (row.every * P));
    for (let k = k0; k <= k1; k++) {
      if (hsh(k, r, 1) < F.gaps) continue;
      const cx = (k + 0.5 + (hsh(k, r, 2) - 0.5) * 0.6) * row.every * P;
      const w = lerp(row.w[0], row.w[1], hsh(k, r, 3)), h = lerp(row.h[0], row.h[1], hsh(k, r, 4));
      ctx.save(); ctx.translate(off, 0); puff(cx, base, w, h); ctx.restore();
    }
  });
}

export function drawGround() {
  if (!ctx) return;
  drawFar();
}
export function drawForeground() {
  if (!ctx) return;
  drawFore();
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
