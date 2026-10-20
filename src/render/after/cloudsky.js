// The afterlife's sky: ranges of cloud drawn by math (DESIGN.md, "God's camp
// stands in the clouds", take S3, taller; docs/mocks/act3-clouds-2026-10-19,
// a3cloudsky2). Three ranges, far to near, each a skyline of seeded value
// noise over position and slow time, cut at a floor so a range dips out in
// places and the three overlap irregularly. Billow heads sit on the ridge and
// swell, shrink to nothing and come back on their own clock; the shading --
// white tops toward the light, a crescent under each head, the body in
// shade, the line -- is read off the shape each time, so it stays right as
// the shape changes. A slow weather term swings it calm to towering.
//
// It stands at the horizon, behind everything, fixed to the window (it is as
// far as anything gets). Worked out every `step` seconds onto a sheet a pixel
// a cell; each frame shows the step behind with the step ahead laid over it
// at the share of the way between them, so a cell that changes fades across
// rather than flipping. On the dark page it is redrawn, not swapped: tops
// catch a grey light and bodies sink into the night (CLOUD_SKY_TONES).

import { P, GREY, AFTER_TONES, CLOUD_SKY as K, CLOUD_SKY_TONES } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';
import { onPixel } from '../frame.js';
import { darkPage } from '../../ink.js';
import { horizonY } from '../../after/sky.js';
import { now } from './kit.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k * k * (3 - 2 * k);
const hsh = (a, b = 0, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const rnd = (i, j, k) => hsh(i, j, k + K.seed * 7919);
// Value noise along x and time, so a shape can change in place.
function n2(x, y, k) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = ease(x - ix), fy = ease(y - iy);
  return lerp(lerp(rnd(ix, iy, k), rnd(ix + 1, iy, k), fx), lerp(rnd(ix, iy + 1, k), rnd(ix + 1, iy + 1, k), fx), fy);
}
const weather = T => clamp(K.weather + K.swing * Math.sin(T * 2 * Math.PI / K.period + K.seed), 0, 1);
const TONES = (darkPage ? CLOUD_SKY_TONES.dark : CLOUD_SKY_TONES.light).map(n => AFTER_TONES[n]);

// A range's ridge at u, cells tall, in a sky `sky` cells high: three octaves of noise over u and slow
// time, cut off at a floor so it dips into valleys and is gone in places.
function ridge(g, k, u, T, wf, sky) {
  const v = 0.6 * n2(u / 95, T / 600, k * 10 + 1) + 0.32 * n2(u / 38, T / 300, k * 10 + 2) + 0.08 * n2(u / 16, T / 140, k * 10 + 3);
  return g.A * sky * wf * Math.max(0, (v - 0.3) / 0.7);
}
// The top of a range, column by column, in cells under the sheet's top
// (fractional): the ridge, with billow heads along it. A head sits at a
// fixed place in u, so it drifts with the range; its radius runs down to
// nothing and back on its own clock, so heads swell, vanish and are reborn.
function rangeTops(g, k, T, cols, base, sky) {
  const W2 = weather(T), wf = lerp(0.6, 1.3, W2), rf = lerp(0.7, 1.2, W2), off = rnd(k, 0, 99) * 1000 + g.drift * T;
  const top = new Float32Array(cols + 8).fill(1e9), X = i => i - 4 + 0.5;
  for (let i = 0; i < cols + 8; i++) { const h = ridge(g, k, X(i) + off, T, wf, sky); if (h > 0.3) top[i] = base - h; }
  const j0 = Math.floor((off - 4 - g.R * 2) / g.S), j1 = Math.ceil((off + cols + 4 + g.R * 2) / g.S);
  for (let j = j0; j <= j1; j++) {
    const uj = (j + 0.5 + (rnd(j, k, 5) - 0.5) * 0.7) * g.S, x = uj - off;
    const h = ridge(g, k, uj, T, wf, sky);
    if (h <= 0.3) continue;
    const r = g.R * rf * clamp(n2(j * 1.37, T / 90, k * 10 + 7) * 1.6 - 0.25, 0, 1) * Math.min(1, h / (g.R * 0.8));
    if (r < 0.5) continue;
    const cy = base - h + r * 0.25;
    for (let i = Math.max(0, Math.floor(x - r + 4)); i <= Math.min(cols + 7, Math.ceil(x + r + 4)); i++) {
      const dx = X(i) - x;
      if (Math.abs(dx) < r) top[i] = Math.min(top[i], cy - Math.sqrt(r * r - dx * dx));
    }
  }
  return top;
}
// One step of sky as roles, a cell each (0 open sky, 1 lit, 2 shade, 3 near
// line, 4 far line, 5 a lit top's first cells by night), worked out as a
// job a few columns at a time. Each range is solid from its top down; white
// to a depth that grows on slopes facing the light (up and left) and thins on
// slopes facing away, cut under each head by a crescent where the point down
// and right of a cell is outside; shade below. The line runs along the top
// and down any steep side. Then the roles are painted onto a sheet of the
// step's own, a pixel a cell, in runs, a few rows at a time.
const stepJob = (q, cols, rows) => ({ q, cols, rows, buf: new Uint8Array(cols * rows), k: 0, x: 0, top: null, y: 0, c: null, g: null, done: false });
function column(j, x) {
  const { cols, rows, buf, top } = j, g = K.ranges[j.k], tp = i => top[i + 4];
  const t0 = tp(x);
  if (t0 >= rows) return;
  const l = tp(x - 1) > 1e8 ? rows : tp(x - 1), r = tp(x + 1) > 1e8 ? rows : tp(x + 1);
  const s = clamp((r - l) / 2, -1.5, 1.5), capD = g.cap * (1 - 0.45 * s), d = g.far ? 1 : 2;
  for (let y = Math.max(0, Math.floor(t0)); y < rows; y++) {
    const py = y + 0.5;
    if (py < t0) continue;
    const depth = py - t0, inside = py + d >= tp(Math.min(cols + 3, x + d));
    let role = depth < capD && inside ? 1 : 2;
    if (role === 1 && depth < 2 && darkPage) role = 5;
    if (depth < 1 || (depth < capD && (tp(x - 1) > py || tp(x + 1) > py))) role = g.far ? 4 : 3;
    buf[y * cols + x] = role;
  }
}
// Work `n` units of a job: a column of a range, or a row of the paint.
function work(j, n) {
  const { cols, rows, buf } = j;
  while (n > 0 && !j.done) {
    if (j.k < K.ranges.length) {
      j.top ||= rangeTops(K.ranges[j.k], j.k, j.q * K.step, cols, rows + 1, rows);
      const from = j.x, end = Math.min(cols, j.x + n);
      for (; j.x < end; j.x++) column(j, j.x);
      n -= end - from + 1;
      if (j.x >= cols) { j.k++; j.x = 0; j.top = null; }
      continue;
    }
    if (!j.c) { j.c = document.createElement('canvas'); j.c.width = cols; j.c.height = rows; j.g = j.c.getContext('2d'); }
    const g = j.g, end = Math.min(rows, j.y + Math.max(1, Math.ceil(n / 8)));
    for (; j.y < end; j.y++, n -= 8) {
      let run = -1, at = 0;
      for (let x = 0; x <= cols; x++) {
        const v = x < cols ? buf[j.y * cols + x] : -1;
        if (v !== run) { if (run >= 0) { g.fillStyle = GREY[TONES[run]]; g.fillRect(at, j.y, x - at, 1); } run = v; at = x; }
      }
    }
    if (j.y >= rows) { j.done = true; j.buf = null; }
  }
  return j.done;
}
// The steps worked out or being worked out, by step number, for this window.
const steps = new Map();
let stepsKey = '';
function stepAt(q, cols, rows, now) {
  const key = `${cols}|${rows}`;
  if (key !== stepsKey) { steps.clear(); stepsKey = key; }
  let j = steps.get(q);
  if (!j) { j = stepJob(q, cols, rows); steps.set(q, j); if (steps.size > 5) steps.delete(steps.keys().next().value); }
  if (now) work(j, Infinity);
  return j;
}
export function drawCloudSky() {
  if (!ctx) return;
  const hy = horizonY(), top = S.camY;
  const rows = Math.ceil((hy + 2 * P - top) / P), cols = Math.ceil(S.viewW / P) + 1;
  if (rows <= 0) return;
  const T = now(), q = Math.floor(T / K.step), a = T / K.step - q;
  const A = stepAt(q, cols, rows, true).c, B = stepAt(q + 1, cols, rows, true).c;
  // The step after next worked out a slice a frame, done in the first share
  // of the step it waits through.
  work(stepAt(q + 2, cols, rows, false), Math.ceil((K.ranges.length * cols + 8 * rows) / (K.step * 60 * K.slice)));
  // Set on the camera's own device pixels: at the bare camera x the image
  // would land a fraction of a pixel off it, rounded afresh as the camera
  // slides, and its edges would shimmer against the still window.
  const x0 = onPixel(S.camX), smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(A, x0, onPixel(top), cols * P, rows * P);
  if (a > 0.02) {
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * a;
    ctx.drawImage(B, x0, onPixel(top), cols * P, rows * P);
    ctx.globalAlpha = was;
  }
  ctx.imageSmoothingEnabled = smooth;
}
