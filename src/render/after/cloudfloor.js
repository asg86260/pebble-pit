// The cloud floor under the whole afterlife (DESIGN.md, "God's camp stands in
// the clouds", take A2; docs/mocks/act3-clouds-2026-10-19, a3cloudfloor3):
// billows placed on a ground plane and seen through one camera, so they are
// big and few at the viewer's feet and shrink and crowd toward the horizon by
// the perspective itself. Near the feet they are pressed low; past a row too
// thin to draw the rows stop thinning and only narrow, so the billows run
// right to the horizon. Each billow is a white top, a shaded front and a line
// where a nearer one stands over a farther, ink near and paling with
// distance. It rolls slowly toward the viewer.
//
// The camera is after/sky.js's depth camera: the near layer at depth 1 is the
// floor AFTER_HORIZON cells under the horizon, and the camera sliding
// sideways slides each row 1/d as fast. In the floor's own units (the
// mock's) a depth d is z = d * ZN.
//
// The frame's cost: the floor is traced a cell at a time only once a tick
// (the roll held between, as every pose up here is), a slice of the trace a
// frame, onto a sheet a pixel a cell, a little wider than the window;
// between traces each row is drawn off the sheet slid by its own depth's
// share of the camera's move since. A pan further than the sheet's margin
// traces it again at once.

import { P, GREY, CLOUD_FLOOR as C, AFTER_HORIZON, SKY_TICK_S } from '../../config.js';
import { S } from '../../state.js';
import { ctx } from '../ctx.js';
import { horizonY, depthAtY } from '../../after/sky.js';
import { W, PALE, MID, K, now } from './kit.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, v) => { const k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
const hsh = (a, b = 0, c = 0) => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// --- the camera, in the floor's units -------------------------------------------------
// A point of height h at depth z stands F * (CAM - h) / z cells under the
// horizon; a floor unit across at depth z is F / z cells.
const F = C.f, CAM = C.cam, ZN = F * CAM / AFTER_HORIZON;
// World px a floor unit across at the near layer.
const UNIT = F / ZN * P;
// Past the depth where a row of billows is thinner than `rowmin` cells the
// far floor is laid out on a depth scale that slows (`uOf`), narrowing
// (`xsOf`), so the billows shrink into the horizon in thin rows.
const WC = F * CAM * C.lz / C.rowmin, Z1 = Math.sqrt(WC);
const uOf = z => (z <= Z1 ? z : 2 * Z1 - WC / z);
const xsOf = z => (z <= Z1 ? 1 : Math.sqrt(Z1 / z));
// How thick a row is at a depth: past Z1 the rows stop thinning.
const psOf = z => (z <= Z1 ? F * CAM * C.lz / (z * z) : C.rowmin);
// Pressed low near the feet, so the ground reads as walkable.
const ampAt = z => lerp(C.low, 1, sstep(C.rise[0], C.rise[1], z));

// --- the billows ---------------------------------------------------------------------------
// A billow at lattice spot (i, j): fixed by the hash, so the floor is the same
// floor every time it is traced.
function domeAt(i, j) {
  const off = C.row * (j & 1), sz = hsh(i, j, 6) < C.vary ? lerp(1.2, 1.4, hsh(i, j, 8)) : lerp(0.75, 1.05, hsh(i, j, 8));
  const r = lerp(C.r[0], C.r[1], hsh(i, j, 3)) * C.lx * sz;
  return { id: i * 7919 + j * 104729, cx: (i + 0.5 + off + (hsh(i, j, 1) - 0.5) * 2 * C.jit) * C.lx,
           cz: (j + 0.5 + (hsh(i, j, 2) - 0.5) * 2 * C.jit) * C.lz,
           rx: r, rz: r * C.ez, a: lerp(C.amp[0], C.amp[1], hsh(i, j, 4)) * sz, q: hsh(i, j, 5) };
}
const domes = new Map();
function dome(i, j) {
  const key = i * 100003 + j;
  let d = domes.get(key);
  if (!d) { d = domeAt(i, j); domes.set(key, d); }
  return d;
}
// The tallest billow over plane point (X, U), and where in it the point is.
// A billow is never wider than its lattice cell less its jitter, so only the
// three spots either way of the point's own can reach it.
const hit = { h: 0, own: null, dx: 0, dz: 0 };
function sample(X, U) {
  const j0 = Math.floor(U / C.lz);
  let best = 0, own = null, bx = 0, bz = 0;
  for (let j = j0 - 1; j <= j0 + 1; j++) {
    const i0 = Math.floor(X / C.lx - C.row * (j & 1));
    for (let i = i0 - 1; i <= i0 + 1; i++) {
      const d = dome(i, j), dx = (X - d.cx) / d.rx, dz = (U - d.cz) / d.rz, m = dx * dx + dz * dz;
      if (m >= 1) continue;
      const h = d.a * Math.pow(1 - m, C.puff);
      if (h > best) { best = h; own = d; bx = dx; bz = dz; }
    }
  }
  hit.h = best; hit.own = own; hit.dx = bx; hit.dz = bz;
  return hit;
}
const lit = s => {
  if (!s.own) return false;
  const [cx, cz, cr] = C.cap, u = (s.dx + cx) / cr, v = (s.dz - cz) / cr;
  return u * u + v * v < 1;
};

// --- the trace -------------------------------------------------------------------------------
// A trace of the floor is a job: a sheet a pixel a cell, its columns from
// world x `x0`, its rows from the one under the horizon down, with the
// camera's middle at `cx` and the roll at `roll`. Its columns are marched a
// share a frame (C.slice), so a new tick's floor is worked out over the
// frames of the tick before it shows, and the frame never pays for a whole
// trace -- unless there is nothing to show yet, or the camera has slid past
// what the shown sheet covers.
const TONE = [W, PALE, MID, K];
// A trace's buffers, kept for the next: a trace a tick would otherwise be a
// megabyte of garbage a quarter second.
const bufs = [];
function job(x0, cols, rows, cx, roll, y0, key, sheet) {
  const n = cols * rows;
  let b = bufs.pop();
  if (!b || b.ZB.length < n) b = { ZB: new Float32Array(n), CZ: new Float32Array(n), OW: new Int32Array(n), TN: new Uint8Array(n), RA: new Float32Array(n) };
  const j = { x0, cols, rows, cx, roll, y0, key, x: 0, sheet, ...b, bufs: b };
  j.OW.fill(-2, 0, n); j.TN.fill(0, 0, n);
  if (domes.size > 60000) domes.clear();
  return j;
}
// March columns of the job, at most `n` of them.
function march(j, n) {
  const { cols, rows, ZB, CZ, OW, TN, RA, roll } = j, zMin = F * CAM / (rows + 1) * 0.55, c = j.cx / UNIT;
  for (const end = Math.min(cols, j.x + n); j.x < end; j.x++) {
    const x = j.x;
    // The column's middle as a floor x at the near layer, off the camera.
    const sx = (j.x0 + (x + 0.5) * P - j.cx) / UNIT;
    let top = rows;
    for (let z = zMin; z < C.far && top > 0;) {
      const s = sample((sx * z / ZN + c) * xsOf(z), uOf(z) + roll), h = s.h * ampAt(z);
      const y0 = Math.max(0, Math.ceil(F * (CAM - h) / z - 0.5) - 1);
      if (y0 < top) {
        const t = lit(s) ? 1 : 2, id = s.own ? s.own.id : -1, cz = s.own ? s.own.cz : uOf(z) + roll + 9, q = s.own ? s.own.q : 0.5;
        for (let y = y0; y < top; y++) { const k = y * cols + x; ZB[k] = z; CZ[k] = cz; OW[k] = id; TN[k] = t; RA[k] = q; }
        top = y0;
      }
      // A step a fifth of a billow's depth, and no more than a cell down the screen.
      const dU = z <= Z1 ? 1 : WC / (z * z);
      z += Math.max(0.004, Math.min(C.lz / 5 / dU, z * z / (F * CAM)));
    }
    for (let y = 0; y < top; y++) { const k = y * cols + x; ZB[k] = 1e9; CZ[k] = 1e9; OW[k] = -3; TN[k] = 1; }
  }
  return j.x >= cols;
}
// Paint a marched job onto its sheet: white tops, shaded fronts, and the line
// where a nearer billow stands in front of a farther one, its tone by how
// thick the rows are there. Rows thinner than `shade` cells have no shaded
// fronts, and a line under `faint` cells is left out, so the floor runs calm
// into the horizon rather than hatched.
function paint(j) {
  const { cols, rows, ZB, CZ, OW, TN, RA } = j, g = j.sheet.g, gap = 0.25 * C.lz;
  g.clearRect(0, 0, j.sheet.c.width, j.sheet.c.height);
  for (let y = 0; y < rows; y++) {
    const ps = psOf(F * CAM / (y + 1.5));
    let run = -1, at = 0;
    const flush = end => { if (run >= 0) { g.fillStyle = GREY[TONE[run]]; g.fillRect(at, y, end - at, 1); } };
    for (let x = 0; x < cols; x++) {
      const k = y * cols + x, o = OW[k], me = CZ[k];
      let tone = TN[k] === 2 && ps > C.shade ? 1 : 0;
      const edge = (y > 0 && OW[k - cols] !== o && CZ[k - cols] > me + gap)
        || (x > 0 && OW[k - 1] !== o && CZ[k - 1] > me + gap && ZB[k - 1] > ZB[k] * 1.3)
        || (x < cols - 1 && OW[k + 1] !== o && CZ[k + 1] > me + gap && ZB[k + 1] > ZB[k] * 1.3);
      if (edge) { const pz = ps * lerp(0.8, 1.25, RA[k]); tone = pz > 6 ? 3 : pz > 3 ? 2 : pz > C.faint ? 1 : tone; }
      if (tone !== run) { flush(x); run = tone; at = x; }
    }
    flush(cols);
  }
  bufs.push(j.bufs);
}
// Two sheets, the one shown and the one being worked out.
function sheetFor(cols, rows, not) {
  let sh = sheets.find(q => q !== not);
  if (!sh || sh.c.width < cols || sh.c.height < rows) {
    const c = document.createElement('canvas');
    c.width = Math.max(cols, sh?.c.width || 0); c.height = Math.max(rows, sh?.c.height || 0);
    const i = sh ? sheets.indexOf(sh) : sheets.length;
    sh = { c, g: c.getContext('2d') };
    sheets[i] = sh;
  }
  return sh;
}
const sheets = [];
let shown = null, next = null;
export const floorTraces = { n: 0 };
// The floor in view: worked out afresh a tick at a time (a slice of it a
// frame), at once for a new window or a pan past the shown sheet's margin,
// and drawn row by row off the shown sheet, each row slid by its depth's
// share of the camera's move since that sheet was traced.
export function drawCloudFloor() {
  const cx = S.camX + S.viewW / 2, hy = horizonY(), y0 = hy + P;
  const rows = Math.ceil((S.camY + S.viewH - y0) / P) + 1;
  if (rows <= 0 || !ctx) return;
  const m = Math.ceil(S.viewW * C.margin / P) * P;
  const tick = Math.floor(now() / SKY_TICK_S), shape = `${rows}|${S.viewW}|${y0}`, key = `${tick}|${shape}`;
  const start = () => {
    const x0 = Math.floor((S.camX - m) / P) * P, cols = Math.ceil((S.viewW + 2 * m) / P) + 1;
    return job(x0, cols, rows, cx, tick * SKY_TICK_S * C.roll, y0, key, sheetFor(cols, rows, shown?.sheet));
  };
  if (!shown || !shown.key.endsWith(shape) || Math.abs(cx - shown.cx) > m * 0.8) {
    // Nothing fit to show: the whole trace now.
    const j = start();
    march(j, j.cols); paint(j);
    shown = j; next = null; floorTraces.n++;
  } else if (shown.key !== key) {
    if (!next || next.key !== key) next = start();
    if (march(next, Math.ceil(next.cols * C.slice))) { paint(next); shown = next; next = null; floorTraces.n++; }
  }
  // The sheet blown up to the window's pixels once a trace, so a frame is a
  // copy: one, with the camera where it was traced, or a row at a time slid.
  const T = shown, k = (S.zoomShow || S.zoom) * S.dpr, big = bigOf(T, k), smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  if (Math.abs(cx - T.cx) < 0.5) ctx.drawImage(big.c, T.x0, T.y0, big.c.width / k, big.c.height / k);
  else for (let y = 0; y < T.rows; y++) {
    const wy = T.y0 + y * P, d = depthAtY(wy + P / 2), shift = Math.round((cx - T.cx) * (1 - 1 / d));
    const sy = Math.round(y * P * k), sh = Math.round((y + 1) * P * k) - sy;
    ctx.drawImage(big.c, 0, sy, big.c.width, sh, T.x0 + shift, wy, big.c.width / k, sh / k);
  }
  ctx.imageSmoothingEnabled = smooth;
}
// The shown sheet at the window's scale, made once a trace.
const blown = { of: null, k: 0, c: null };
function bigOf(T, k) {
  if (blown.of === T && blown.k === k) return blown;
  const w = Math.max(1, Math.round(T.cols * P * k)), h = Math.max(1, Math.round(T.rows * P * k));
  if (!blown.c || blown.c.width !== w || blown.c.height !== h) { blown.c = document.createElement('canvas'); blown.c.width = w; blown.c.height = h; }
  const g = blown.c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, w, h);
  g.drawImage(T.sheet.c, 0, 0, T.cols, T.rows, 0, 0, w, h);
  blown.of = T; blown.k = k;
  return blown;
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
    ctx.fillStyle = GREY[W];
    ctx.fillRect(x * P, (base - t) * P, P, t * P);
    // the line over the top, joined down the steps between columns (not down
    // the outer ends: the lip melts into the floor at its sides)
    const lo = l < 1 || r < 1 ? 1 : Math.max(1, Math.min(t, t - Math.min(l, r) + 1));
    if (line != null) { ctx.fillStyle = GREY[line]; ctx.fillRect(x * P, (base - t - 1) * P, P, Math.min(lo, t) * P); }
  }
}
