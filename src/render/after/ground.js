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
// Each layer moves as one piece: drawn on its own grid and set down at its
// offset off the world, so nothing in a layer shears against the rest of it
// or jitters when the camera slides. Nothing rolls.

import { P, GREY, GROUND_FAR, GROUND_FORE, GROUND_PATH, GROUND_LINE } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';
import { layerAt, fillOnPixels } from '../frame.js';
import { horizonY } from '../../after/sky.js';
import { afterFloor, afterOpenX, billow } from '../../after/place.js';
import { W, PALE, MID } from './kit.js';

const lerp = (a, b, k) => a + (b - a) * k;
const hsh = (a, b = 0, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
// lip() draws straight onto the page: every fill on whole device pixels, so a
// thin line never blends into a tone between the four.
const fr = (x, y, w, h, tone) => { ctx.fillStyle = GREY[tone]; fillOnPixels(ctx, x, y, w, h); };

const LINE = GROUND_LINE;

// A layer sliding `rate` as fast as the camera: its offset off the world,
// landing on a whole device pixel of its own (render/frame.js, `layerAt`).
// It stands where its x says with the window's middle where the act opens.
const layerOff = rate => layerAt(0, rate, afterOpenX());

// --- a layer as one piece ----------------------------------------------------------------
// Art on the cell grid, motion smooth (CLAUDE.md, house style): a layer is
// drawn once onto a canvas of its own, at the window's device resolution, its
// cells on that canvas's grid, over a stretch two windows wide -- and set down
// every frame as one image at the layer's place. Nothing inside it is rounded
// against the camera on its own, so it slides without shearing, and a frame
// that only slides it costs one drawImage rather than a fill a cell. It is
// drawn again when the window has slid off the stretch, or the zoom, the
// window or the theme has changed.
function piece() { return { c: null, L: 0, R: 0, key: '' }; }
function setDown(p, off, top, bot, paint) {
  const k = S.zoom * S.dpr, x0 = S.camX - off, x1 = x0 + S.viewW;
  const key = `${k}|${top}|${bot}|${S.viewW}|${GREY[W]}|${GREY[PALE]}|${GREY[MID]}`;
  if (!p.c || p.key !== key || x0 < p.L || x1 > p.R) {
    const L = Math.floor((x0 - S.viewW / 2) / P) * P, R = L + Math.ceil(2 * S.viewW / P) * P;
    p.c ||= document.createElement('canvas');
    p.c.width = Math.ceil((R - L) * k); p.c.height = Math.ceil((bot - top) * k);
    const g = p.c.getContext('2d'), px = v => Math.round(v * k);
    // a fill on the canvas's own whole pixels, so a thin line never blends
    // into a tone between the four
    const put = (x, y, w, h, tone) => {
      const a = px(x - L), b = px(y - top);
      g.fillStyle = GREY[tone]; g.fillRect(a, b, px(x + w - L) - a, px(y + h - top) - b);
    };
    paint(put, L, R);
    Object.assign(p, { L, R, key });
  }
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(p.c, p.L + off, top, p.c.width / k, p.c.height / k);
  ctx.imageSmoothingEnabled = smooth;
}

// --- the far cloud --------------------------------------------------------------------
// A few broken rows on the way back, each a run of billow tops a cell high,
// its cells smaller the nearer the horizon, in the pale line tone: a stretch
// of `seg` cells drawn, or left open (a share `gaps` of them), so no row is a
// ruled line across the window. A row's profile repeats every `period` of its
// own cells.
const farRows = new Map();
function farRow(i) {
  let el = farRows.get(i);
  if (!el) { el = billow(GROUND_FAR.period, GROUND_FAR.seed + i * 7, 1); farRows.set(i, el); }
  return el;
}
const far = piece();
function drawFar() {
  const F = GROUND_FAR, hy = horizonY();
  const top = hy + Math.min(...F.rows.map(([down, c]) => down * P - c)), bot = hy + Math.max(...F.rows.map(([down]) => down * P)) + LINE;
  setDown(far, layerOff(F.rate), top, bot, (put, x0, x1) => F.rows.forEach(([down, c], i) => {
    const y = hy + down * P, el = farRow(i), n = el.length;
    const at = j => el[((j % n) + n) % n];
    for (let s = Math.floor(x0 / c / F.seg) - 1; s <= Math.ceil(x1 / c / F.seg); s++) {
      if (hsh(s, i, 5) < F.gaps) continue;
      const j0 = s * F.seg, j1 = j0 + Math.round(F.seg * (0.5 + 0.5 * hsh(s, i, 6)));
      for (let j = j0; j < j1; j++) {
        const v = at(j);
        put(j * c, y - v * c, c, LINE, PALE);
        if (j > j0 && v !== at(j - 1)) put(j * c - (v > at(j - 1) ? 0 : LINE), y - Math.max(v, at(j - 1)) * c, LINE, c, PALE);
      }
    }
  }));
}

// --- the foreground ---------------------------------------------------------------------
// Big calm clouds below the main plane, a few to a window: each a round head
// of paper cells with a line of mid along its top, set irregularly along a
// row a band down off the path, the nearer row bigger and lower.
function puff(put, cx, base, w, h) {
  const n = Math.round(w), x0 = Math.round(cx / P - n / 2);
  let prev = 0;
  for (let i = 0; i <= n; i++) {
    const u = (i + 0.5 - n / 2) / (n / 2), t = i < n ? Math.round(h * Math.sqrt(Math.max(0, 1 - u * u))) : 0;
    const x = (x0 + i) * P;
    if (t > 0) { put(x, base - t * P, P, t * P, W); put(x, base - t * P, P, LINE, MID); }
    if (t !== prev && i > 0) put(x - (t > prev ? 0 : LINE), base - Math.max(t, prev) * P, LINE, Math.abs(t - prev) * P, MID);
    prev = t;
  }
}
const fore = piece();
function drawFore() {
  const F = GROUND_FORE, fl = afterFloor() + GROUND_PATH.depth * P;
  const top = fl + Math.min(...F.rows.map(r => (r.down - r.h[1]) * P)), bot = fl + Math.max(...F.rows.map(r => r.down * P));
  if (top > S.camY + S.viewH) return;
  setDown(fore, layerOff(F.rate), top, bot, (put, x0, x1) => F.rows.forEach((row, r) => {
    const base = fl + row.down * P;
    const k0 = Math.floor((x0 - row.w[1] * P) / (row.every * P)), k1 = Math.ceil((x1 + row.w[1] * P) / (row.every * P));
    for (let k = k0; k <= k1; k++) {
      if (hsh(k, r, 1) < F.gaps) continue;
      const cx = (k + 0.5 + (hsh(k, r, 2) - 0.5) * 0.6) * row.every * P;
      puff(put, cx, base, lerp(row.w[0], row.w[1], hsh(k, r, 3)), lerp(row.h[0], row.h[1], hsh(k, r, 4)));
    }
  }));
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
