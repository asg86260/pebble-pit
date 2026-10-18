// Act 3's two crowds and God, drawn (the round 3 crowd mock, the main
// option, docs/mocks/act3-crowd-2026-10-18; the owner, 2026-10-18: "lets
// build it. we can refine later"). God and the throne are placeholders.
//
// God's crowd stands right of the camp. Its front is the sim's first rank,
// bodies on the floor; behind them nine near rows of souls shrinking with
// distance, each its own parallax layer; and behind those the mass, three
// flat bands of grey cells, palest furthest, that stand for every soul too
// far back to be one. Every soul in the near rows is a slot of the sim
// (after/union.js): it inks a piece at a time, and a member walks out of it.
// The rows close up behind a member gone, a soul stepping forward out of the
// file into the hole, so a file's depth is the souls still standing in it:
// the mass thins from the back as the union wins, unevenly, in dips where
// the signs have worked. The mass's ink clumps are the inked rims of the
// souls it stands for and the share walked out.
//
// Our crowd, the members who have walked out, stands behind the camp on the
// left, in the same rows and bands, filling front to back from the end
// nearest God's yard (`drawCampCrowd`). Support reads as the two masses'
// balance: a sea and a handful at the start, the other way about at the
// strike. God's glare dims as support rises, gone at the strike's share.
//
// Every layer pans at its own rate about the window's middle: a thing at
// front-row x stands at `cx + (x - cx) * rate`, `cx` the window's middle,
// so the rows draw in toward it with distance. God stands far off on the
// slowest layer, at the end of the pan (view.js, `afterEnd`), so the dive
// arrives on the top of the throne.
//
// The frame's cost: the near rows are a few hundred souls, the files in
// view of each; the bands and God are bitmaps, each band's taken again only
// once a step (CROWD_MASS_STEP_S) and crossfaded into the last, so a crowd
// of any size costs the frame the same few blits. Nothing here is saved:
// every fact drawn is the sim's, and the easing between them is the
// drawing's own.

import { S } from '../state.js';
import { P, GREY, CROWD_FILES, CROWD_PITCH, CROWD_X0, CROWD_NEAR, CROWD_ROW, CROWD_FAR_ROW, RIM_PIECES,
         STRIKE_SHARE, CROWD_FRONT_BODY, CROWD_NEAR_SIZES, CROWD_NEAR_RANKS, CROWD_NEAR_RATE, CROWD_NEAR_LIFT,
         CROWD_RIM, CROWD_RIM_FROM, CROWD_PIECES_FROM, CROWD_NEAR_TONES, CROWD_FRONT_TONES, CROWD_INK_FADE,
         CROWD_STEP_UP, CROWD_BANDS, CROWD_MASS_ALT, CROWD_MASS_ALT_GRAIN, CROWD_MASS_HEADS, CROWD_MASS_TAPER, CROWD_MASS_STEP_S,
         CROWD_MASS_READ_S, CROWD_INK_LOCAL, CROWD_INK_WON, CROWD_CLUMP, CROWD_CLUMP_K, CROWD_CLUMP_R, CROWD_CLUMP_TALL, CROWD_CLUMP_LEAST, OURS_X0, OURS_INK,
         GOD_RATE, GOD_FAR, GOD_FAR_ALPHA, GOD_HORIZON_UP, GOD_THRONE, GOD_SEAT, GOD_FACE, GOD_CROWN, GOD_HAZE_TONE, GOD_GLARE,
         GOD_LEDGES, GOD_FLIGHTS, GOD_TITHE_PATH, GOD_CARRIERS, GOD_CARRIER_LAP_S } from '../config.js';
import { AFTER_JOB } from '../jobs.js';
import { ctx } from './ctx.js';
import { afterFloor, stationBox, slotX, overCrowd } from '../after/place.js';
import { drawFloorLip } from './after/floor.js';
import { souls, support, union, OUT_RIM } from '../after/union.js';
import { walkingOut } from '../after/bodies.js';
import { afterEnd, afterPan, godScaleAt } from '../view.js';
import { smoothstep } from '../motion.js';

const F = CROWD_FILES;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const now = () => (S.after ? S.after.t : 0);
// A fixed hash and a smooth noise on it: every tone and edge holds still
// frame to frame, and what drifts, drifts through the noise.
function hsh(a, b = 0, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = smoothstep(x - xi), yf = smoothstep(y - yi);
  const a = hsh(xi, yi, seed), b = hsh(xi + 1, yi, seed), c = hsh(xi, yi + 1, seed), d = hsh(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, xf), lerp(c, d, xf), yf);
}

// --- the frame's camera ---------------------------------------------------------------
// The device pixels a world pixel takes, and the window's middle, read once
// a frame. A rect's two edges are each put on a whole device pixel, so a
// 2 px stroke stays whole at any zoom (render/frame.js, `fillOnPixels`).
let K = 1, CX = 0;
const camFrame = () => { K = S.zoom * S.dpr; CX = S.camX + S.viewW / 2; };
const at = (x, rate) => CX + (x - CX) * rate;
function rect(x, y, w, h, tone) {
  if (tone != null) ctx.fillStyle = GREY[tone];
  const x0 = Math.round(x * K), y0 = Math.round(y * K);
  const ww = Math.round((x + w) * K) - x0, hh = Math.round((y + h) * K) - y0;
  if (ww > 0 && hh > 0) ctx.fillRect(x0 / K, y0 / K, ww / K, hh / K);
}
const onPx = v => Math.round(v * K) / K;

// --- the rows' shape ---------------------------------------------------------------------
// A visual rank is a soul's place in its file counted from the front, the
// holes closed up: 0 the front row, then the near rows, each one rank or
// two (the second half a file over). NEAR is how many there are; past it a
// soul is the mass's.
const ROWS = (() => {
  const rows = [{ s: CROWD_FRONT_BODY, rate: 1, foot: 0 }];
  let foot = CROWD_FRONT_BODY + CROWD_NEAR_LIFT;
  CROWD_NEAR_SIZES.forEach((s, k) => {
    rows.push({ s, rate: lerp(CROWD_NEAR_RATE[0], CROWD_NEAR_RATE[1], k / (CROWD_NEAR_SIZES.length - 1)), foot });
    foot += s + Math.max(1, Math.round(s * 0.25));
  });
  return rows;
})();
// Each visual rank's row, and how far across it stands off its file.
const VIS = [{ row: 0, off: 0 }];
CROWD_NEAR_RANKS.forEach((n, k) => { for (let j = 0; j < n; j++) VIS.push({ row: k + 1, off: j * CROWD_PITCH / 2 }); });
export const NEAR = VIS.length;
// Every band's foot, px off the floor: the top of the back near row, so the
// bands stand on the rows and no soul is drawn over a band.
const BAND_FOOT = (() => { const r = ROWS[ROWS.length - 1]; return r.foot + r.s; })();
// A visual depth's layout, any depth: rate, size, foot (px up off the
// floor) and offset across, eased between ranks so a soul stepping forward
// or a body walking through the rows moves smoothly. Past the near rows, the
// mass's bands, a body the size of a band's cell.
function layout(d, bandL) {
  if (d < NEAR - 1) {
    const v = Math.max(0, Math.floor(d)), u = Math.max(0, d - v);
    const a = ROWS[VIS[v].row], b = ROWS[VIS[v + 1].row];
    return { rate: lerp(a.rate, b.rate, u), s: lerp(a.s, b.s, u), foot: lerp(a.foot, b.foot, u),
             off: lerp(VIS[v].off, VIS[v + 1].off, u) };
  }
  const last = ROWS[VIS[NEAR - 1].row];
  const m = (d - (NEAR - 1)) / Math.max(1, bandL);
  if (m <= 1) {
    const bd = CROWD_BANDS[0];
    return { rate: lerp(last.rate, bd.rate, m), s: lerp(last.s, bd.cell, m), foot: lerp(last.foot, BAND_FOOT + bd.rows * bd.cell * 0.5, m), off: 0 };
  }
  const b = Math.min(CROWD_BANDS.length - 1, Math.floor(m - 1)), bd = CROWD_BANDS[b];
  const u = clamp(m - 1 - b, 0, 1);
  return { rate: bd.rate, s: bd.cell, foot: BAND_FOOT + bd.rows * bd.cell * u, off: 0 };
}
// A soul's file middle at the front row's scale.
const fileMid = f => CROWD_X0 + f * CROWD_PITCH + CROWD_FRONT_BODY / 2;

// --- what the crowd is, read off the sim --------------------------------------------------
// The near souls by file and visual rank (refreshed whenever the rims
// change, a short walk down each file), and, throttled, every file's
// standing souls band by band and its prefix counts (for where a body
// standing in the crowd is drawn).
const read = {
  after: null, str: null, n: 0, near: new Int32Array(F * NEAR).fill(-1),
  t: -1e9, bandStr: null, ranks: 0, bandL: 1,
  present: CROWD_BANDS.map(() => new Float32Array(F)), ink: CROWD_BANDS.map(() => new Float32Array(F)),
  prefix: new Uint16Array(0),
  shownVis: new Float32Array(0), shownInk: new Float32Array(0), primed: false, lastT: 0
};
function readNear(a) {
  const n = a.length, near = read.near;
  near.fill(-1);
  for (let f = 0; f < F; f++) {
    let v = 0;
    for (let i = f; i < n && v < NEAR; i += F) if (a[i] !== OUT_RIM) near[f * NEAR + v++] = i;
  }
}
function readBands(a) {
  const n = a.length, R = Math.ceil(n / F);
  read.ranks = R;
  read.bandL = Math.max(1, Math.ceil((R - NEAR) / CROWD_BANDS.length));
  if (read.prefix.length !== F * (R + 1)) read.prefix = new Uint16Array(F * (R + 1));
  for (const p of read.present) p.fill(0);
  for (const k of read.ink) k.fill(0);
  for (let f = 0; f < F; f++) {
    let v = 0;
    const base = f * (R + 1);
    for (let r = 0; r < R; r++) {
      read.prefix[base + r] = v;
      const i = r * F + f;
      if (i >= n || a[i] === OUT_RIM) continue;
      if (v >= NEAR) {
        const b = Math.min(CROWD_BANDS.length - 1, Math.floor((v - NEAR) / read.bandL));
        read.present[b][f]++;
        read.ink[b][f] += a[i];
      }
      v++;
    }
    read.prefix[base + R] = v;
  }
  read.bandStr = S.after.rims;
}
function readCrowd() {
  const A = S.after, a = souls();
  if (read.after !== A || read.n > a.length) {
    read.after = A; read.primed = false; read.bandStr = null; read.str = null; read.t = -1e9;
    read.shownVis.fill(NaN); read.shownInk.fill(NaN);
  }
  if (read.shownVis.length < a.length) {
    const grow = (old, fill) => { const b = new Float32Array(Math.max(a.length, old.length * 2)).fill(fill); b.set(old); return b; };
    read.shownVis = grow(read.shownVis, NaN); read.shownInk = grow(read.shownInk, NaN);
  }
  read.n = a.length;
  if (A.rims !== read.str) { readNear(a); read.str = A.rims; }
  if (read.bandStr !== A.rims && now() - read.t >= CROWD_MASS_READ_S) { readBands(a); read.t = now(); }
  return a;
}
// The members standing in our crowd: walked out and reached the camp, less
// those stepped out of it again to hold a post or raise a station (the
// pair building are not members, and a builder walking home is walking out).
const steppedOut = () => S.after.bodies.filter(w => w.pair == null && w.state !== 'out' && w.state !== 'join').length;
export const arrived = () => (S.after ? Math.max(0, union() - walkingOut() - steppedOut()) : 0);
// God's glare: full at the start, dimming as support rises, gone at the
// strike's share.
export const glareAlpha = () => clamp(1 - support() / STRIKE_SHARE, 0, 1);

// The visual depth of a sim point standing in God's crowd: its rank off its
// height (place.js, `soulY`, inverted), the holes in front of it in its file
// closed up. A body on the floor is at 0.
function depthAt(x, y) {
  const d = afterFloor() - y;
  if (d <= 0) return 0;
  const nearH = CROWD_NEAR * CROWD_ROW;
  const rho = d < nearH ? d / CROWD_ROW : CROWD_NEAR + (d - nearH) / CROWD_FAR_ROW;
  const R = read.ranks;
  if (!R || !read.prefix.length) return rho;
  const ff = clamp((x - CROWD_X0 - CROWD_FRONT_BODY / 2) / CROWD_PITCH, 0, F - 1);
  const vis = f => {
    const r = Math.min(R - 1, Math.floor(rho)), u = Math.min(1, rho - r), p = read.prefix, b = f * (R + 1);
    return p[b + r] + u * (p[b + r + 1] - p[b + r]);
  };
  const f0 = Math.floor(ff), f1 = Math.min(F - 1, f0 + 1);
  return lerp(vis(f0), vis(f1), ff - f0);
}
// Where a sim point standing in the crowd is drawn, and how big a body is
// there (1 at the front row), for anything drawn over the crowd: the
// members walking out, the carriers going in, the wardens.
export function seenAt(x, y) {
  if (!S.after) return { x, y, k: 1 };
  camFrame();
  // Off the crowd's ends (the stair, the camp) a body is where it stands.
  if (y < afterFloor() && (x < CROWD_X0 - CROWD_PITCH || x > CROWD_X0 + (F + 1) * CROWD_PITCH)) return { x, y, k: 1 };
  const L = layout(depthAt(x, y), read.bandL);
  return { x: at(x, L.rate), y: afterFloor() - L.foot, k: L.s / CROWD_FRONT_BODY };
}

// --- a near soul ----------------------------------------------------------------------------
// A pale soul is a grey rim on paper, a member an ink one; in a row big
// enough each of its RIM_PIECES pieces inks on its own, clockwise from the
// top left, the last piece in fading; in a smaller row the rim darkens as a
// whole; the smallest rows are filled squares. `ink` is pieces (0..8),
// eased; `a` the soul's opacity.
function soul(x, y, s, ink, tone, a) {
  const was = ctx.globalAlpha;
  if (a < 1) ctx.globalAlpha = was * a;
  if (s < CROWD_RIM_FROM) {
    rect(x, y, s, s, tone);
    if (ink > 0) { ctx.globalAlpha = was * a * Math.min(1, ink / RIM_PIECES); rect(x, y, s, s, 10); }
    ctx.globalAlpha = was;
    return;
  }
  const R = CROWD_RIM;
  rect(x, y, s, s, tone);
  if (s < CROWD_PIECES_FROM) {
    if (ink > 0) { ctx.globalAlpha = was * a * Math.min(1, ink / RIM_PIECES); rect(x, y, s, s, 10); ctx.globalAlpha = was * a; }
    rect(x + R, y + R, s - 2 * R, s - 2 * R, 0);
    ctx.globalAlpha = was;
    return;
  }
  rect(x + R, y + R, s - 2 * R, s - 2 * R, 0);
  const h = Math.round(s / 2);
  const pieces = [[x, y, h, R], [x + h, y, s - h, R], [x + s - R, y, R, h], [x + s - R, y + h, R, s - h],
                  [x + h, y + s - R, s - h, R], [x, y + s - R, h, R], [x, y + h, R, s - h], [x, y, R, h]];
  ctx.fillStyle = GREY[10];
  for (let k = 0; k < RIM_PIECES && k < ink; k++) {
    const p = pieces[k], part = Math.min(1, ink - k);
    if (part < 1) ctx.globalAlpha = was * a * part;
    rect(p[0], p[1], p[2], p[3]);
  }
  ctx.globalAlpha = was;
}
const paleTone = (s, i) => {
  const tones = s >= CROWD_FRONT_BODY ? CROWD_FRONT_TONES : s >= 8 ? CROWD_NEAR_TONES[0] : CROWD_NEAR_TONES[1];
  return tones[Math.floor(hsh(i, 5) * tones.length)];
};

// --- a body over the crowd ------------------------------------------------------------------
// The place's body (render/after.js's placeholder, a square of `rim` with a
// pale middle, its load overhead, an arm out on the blow, the agitator's
// shout mark), drawn at `k` of its size where it stands in the crowd.
function body(w, rim, fill) {
  const v = seenAt(w.x, w.y), u = P * v.k;
  const x = onPx(v.x - u * 1.5), y = onPx(v.y - u * 3);
  rect(x, y, u * 3, u * 3, rim);
  rect(x + u, y + u, u, u, fill);
  if (w.load === 'log') for (let c = -1; c <= 3; c++) rect(x + c * u, y - u, u, u, c === 1 ? 2 : 8);
  else if (w.load === 'sign') { rect(x + u, y - u, u, u, 10); rect(x, y - u * 2, u * 3, u, 1); }
  else if (w.load === 'posters') { rect(x, y - u, u, u, 0); rect(x + u, y - u, u, u, 2); rect(x + u * 2, y - u, u, u, 0); }
  else if (w.load === 'tip') { rect(x, y - u, u * 2, u, 4); }
  if (w.swing != null) {
    if (w.job === AFTER_JOB.AGITATE) { rect(x + u, y - u * 5, u, u * 2, 10); rect(x + u, y - u * 2, u, u, 10); }
    else for (let k = 1; k <= 2; k++) rect(x + (w.face > 0 ? 2 + k : -k) * u, y - k * u, u, u, 10);
  }
  return v;
}

// --- the bands, as bitmaps ------------------------------------------------------------------
// A band's picture: its columns of cells, each column's depth its share of
// the band still standing, a head over most in runs, soft patches of cells
// a step off its grey (never on the top), and ink in clumps where a slow
// noise falls under the column's share won. Taken on a canvas of its own at
// the frame's device scale.
function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w); c.height = Math.max(1, h);
  return c;
}
// Keep a marked cell only where it is part of a whole 2 by 2 block of marks:
// no single cell, no one-cell spur or line, ever (`at(j, r)` the mark).
function opened(cols, rows, at) {
  const out = new Uint8Array(cols * rows);
  for (let j = 0; j + 1 < cols; j++) for (let r = 0; r + 1 < rows; r++) {
    if (at(j, r) && at(j + 1, r) && at(j, r + 1) && at(j + 1, r + 1))
      out[r * cols + j] = out[r * cols + j + 1] = out[(r + 1) * cols + j] = out[(r + 1) * cols + j + 1] = 1;
  }
  return out;
}
// Clear every patch of marks smaller than `least` cells, in place: what is
// left of a clump a column's top cut short is a fleck, not a blob.
function noFlecks(marks, cols, rows, least) {
  const seen = new Uint8Array(marks.length), stack = [], patch = [];
  for (let k0 = 0; k0 < marks.length; k0++) {
    if (!marks[k0] || seen[k0]) continue;
    stack.push(k0); seen[k0] = 1; patch.length = 0;
    while (stack.length) {
      const k = stack.pop(), j = k % cols, r = (k - j) / cols;
      patch.push(k);
      for (const [dj, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const jj = j + dj, rr = r + dr, kk = rr * cols + jj;
        if (jj >= 0 && jj < cols && rr >= 0 && rr < rows && marks[kk] && !seen[kk]) { seen[kk] = 1; stack.push(kk); }
      }
    }
    if (patch.length < least) for (const k of patch) marks[k] = 0;
  }
  return marks;
}
function paintBand(bd, seed, cols, column, drift) {
  const cw = Math.ceil(cols * bd.cell * K), chRows = bd.rows + 2, ch = Math.ceil(chRows * bd.cell * K);
  const c = canvas(cw, ch), g = c.getContext('2d');
  if (!g) return c;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = false;
  const cell = (j, r, h, tone) => {
    g.fillStyle = GREY[tone];
    const x0 = Math.round(j * bd.cell * K), y0 = Math.round((chRows - r - h) * bd.cell * K);
    g.fillRect(x0, y0, Math.round((j + 1) * bd.cell * K) - x0, Math.round((chRows - r) * bd.cell * K) - y0);
  };
  const cs = Array.from({ length: cols }, (_, j) => column(j));
  const tops = cs.map(q => (q.h > 0 ? q.h + (q.head ? 1 : 0) : 0));
  const inside = j => j >= 0 && j < cols;
  const share = j => (inside(j) ? cs[j].ink : 0), height = j => (inside(j) ? cs[j].h : 0);
  const ink = noFlecks(opened(cols, chRows, (j, r) => r < tops[j] && inClump(j + drift, r, share, height, drift, seed, clumpFloor(bd), bd.rows)), cols, chRows, CROWD_CLUMP_LEAST);
  const [ga, gb] = CROWD_MASS_ALT_GRAIN;
  const alt = opened(cols, chRows, (j, r) => r < cs[j].h - 1 && vnoise(j * ga, r * gb, seed + 7) > CROWD_MASS_ALT);
  for (let j = 0; j < cols; j++) {
    if (tops[j] <= 0) continue;
    cell(j, 0, tops[j], bd.tone);
    for (let r = 0; r < tops[j]; r++) {
      const k = r * cols + j;
      if (ink[k] || alt[k]) cell(j, r, 1, ink[k] ? 10 : bd.alt);
    }
  }
  return c;
}
// Whether a band's cell is in an ink clump: the band is cut in a coarse
// grid (CROWD_CLUMP), each square holding a clump or not by the share won
// there, a clump a soft oval of a few cells off the square's middle with a
// lumpy edge. Whole clumps, few or many, never a scatter of single cells.
// Whether a clump stands is asked once, at its middle (`share(col)` and
// `top(col)` the band's there, `drift` the clumps' slow walk across), so a
// clump is all there or not at all: placed whole inside the band's depth,
// never cut flat by its foot, and never on a column too short to hold it
// (the band's sloping ends).
// The row a band's clumps stand clear of: the top of the band in front of
// it, so a clump is never half hidden behind the nearer band.
const clumpFloor = bd => {
  const b = CROWD_BANDS.indexOf(bd), front = CROWD_BANDS[b - 1];
  return front ? Math.ceil((front.rows + 1) * front.cell / bd.cell) : 0;
};
function inClump(x, r, share, top, drift, seed, lo, hi) {
  const [gw, gh] = CROWD_CLUMP, cx = Math.floor(x / gw), cy = Math.floor(r / gh);
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const qx = cx + dx, qy = cy + dy;
    const r0 = CROWD_CLUMP_R[0] + (CROWD_CLUMP_R[1] - CROWD_CLUMP_R[0]) * hsh(qx, qy, seed + 14);
    const ry = Math.min(r0 * CROWD_CLUMP_TALL, (hi - lo) / 2), rx = ry / CROWD_CLUMP_TALL;
    if (ry < CROWD_CLUMP_R[0] * CROWD_CLUMP_TALL) continue;
    const mx = (qx + 0.2 + 0.6 * hsh(qx, qy, seed + 12)) * gw;
    const my = hi - lo > 2 * ry ? clamp((qy + 0.2 + 0.6 * hsh(qx, qy, seed + 13)) * gh, lo + ry, hi - ry) : (lo + hi) / 2;
    const col = Math.floor(mx - drift), w = Math.ceil(rx);
    if (hsh(qx, qy, seed + 11) >= Math.min(1, share(col) * CROWD_CLUMP_K)) continue;
    if (my + ry > Math.min(top(col - w), top(col), top(col + w))) continue;
    const ex = (x + 0.5 - mx) / rx, ey = (r + 0.5 - my) / ry;
    if (ex * ex + ey * ey < 0.75 + 0.35 * vnoise(x * 0.5, r * 0.5, seed + 15)) return true;
  }
  return false;
}
// A band's two pictures, this step's and the next's, and the next's fading
// in over the step: the crossfade summed exactly on a scratch sheet
// ('lighter' adds the two weighted pictures), so a cell leaving fades out
// as one arriving fades in, and nothing pops.
function makeCache(b, seed) {
  return { b, seed, K: 0, step: null, A: null, B: null, scratch: null, builds: 0 };
}
function drawBandCache(cache, cols, column, x, rate, phase) {
  const bd = CROWD_BANDS[cache.b];
  const t = (now() + phase) / CROWD_MASS_STEP_S, i = Math.floor(t), f = t - i;
  const take = k => { cache.builds++; return paintBand(bd, cache.seed, cols, column, k); };
  if (cache.K !== K || cache.cols !== cols || cache.step == null || Math.abs(i - cache.step) > 1) {
    cache.A = take(i); cache.B = take(i + 1); cache.K = K; cache.cols = cols; cache.step = i;
  } else if (i !== cache.step) {
    cache.A = cache.B; cache.B = take(i + 1); cache.step = i;
  }
  const w = cache.A.width / K, h = cache.A.height / K;
  const x0 = onPx(at(x, rate)), y0 = onPx(afterFloor() - BAND_FOOT - (bd.rows + 2) * bd.cell);
  if (x0 > S.camX + S.viewW || x0 + w < S.camX) return;
  let pic = cache.A;
  if (f > 0.002) {
    if (!cache.scratch || cache.scratch.width !== cache.A.width || cache.scratch.height !== cache.A.height)
      cache.scratch = canvas(cache.A.width, cache.A.height);
    const g = cache.scratch.getContext('2d');
    if (g) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, cache.scratch.width, cache.scratch.height);
      g.globalAlpha = 1 - f; g.drawImage(cache.A, 0, 0);
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = f; g.drawImage(cache.B, 0, 0);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      pic = cache.scratch;
    }
  }
  ctx.drawImage(pic, x0, y0, w, h);
}
// A column's height in cells off its share of the band: the band's slow rise
// and fall, and its ends eased down to its foot, a shoulder rather than a
// stair, so the bands' ends at their three rates read as one slope.
const bandH = (rows, fill, j, cols, seed) => {
  const end = Math.min(j, cols - 1 - j), ease = smoothstep(clamp((end + 0.5) / CROWD_MASS_TAPER, 0, 1));
  return Math.max(0, Math.round((rows * fill + 2 * vnoise(j * 0.13, 0, seed) - 1) * ease));
};
const hasHead = (j, seed) => vnoise(j * 0.45, 3, seed) < CROWD_MASS_HEADS;

// --- God's crowd -------------------------------------------------------------------------------
const godBands = CROWD_BANDS.map((_, b) => makeCache(b, 31 + b));
const godCols = b => Math.floor(F * CROWD_PITCH * CROWD_BANDS[b].rate / CROWD_BANDS[b].cell);
// A file's share of a band still standing, and its share won, eased across
// to the band's column, blurred a file each way so the edge is calm.
function godColumn(b) {
  const bd = CROWD_BANDS[b], cols = godCols(b), L = read.bandL, won = support();
  const pres = read.present[b], ink = read.ink[b];
  const fileAt = f => {
    let p = 0, k = 0, w = 0;
    for (let d = -1; d <= 1; d++) {
      const g = clamp(f + d, 0, F - 1), wt = d ? 0.25 : 0.5;
      p += wt * pres[g] / L; k += wt * (pres[g] ? ink[g] / (pres[g] * RIM_PIECES) : 0); w += wt;
    }
    return { fill: p / w, ink: k / w };
  };
  const files = Array.from({ length: F }, (_, f) => fileAt(f));
  return j => {
    const ff = clamp((j + 0.5) / cols * F - 0.5, 0, F - 1), f0 = Math.floor(ff), f1 = Math.min(F - 1, f0 + 1), u = ff - f0;
    const fill = clamp(lerp(files[f0].fill, files[f1].fill, u), 0, 1);
    const inked = lerp(files[f0].ink, files[f1].ink, u);
    const h = fill > 0.02 ? bandH(bd.rows, fill, j, cols, 31 + b) : 0;
    return { h, head: h > 0 && hasHead(j, 31 + b), ink: CROWD_INK_LOCAL * inked + CROWD_INK_WON * won };
  };
}

// The near souls of God's crowd, back rank first: each at the depth it is
// stepping toward, its rim's pieces eased toward the sim's; a soul newly in
// the near rows steps out of the mass. Then the signs among them, and the
// bodies, each after the rank it stands in.
const drawnNow = { files: 0, souls: 0, bandBuilds: 0, ours: 0, oursMass: 0 };
export const crowdDrawn = () => ({ ...drawnNow, bandBuilds: [...godBands, ...ourBands].reduce((n, c) => n + c.builds, 0) });
function nearSouls(a, dt) {
  const floor = afterFloor(), pad = CROWD_FRONT_BODY + CROWD_PITCH;
  const posters = S.after.posters.filter(p => p.torn == null).map(p => slotX(p.slot));
  const bodies = [...S.after.bodies.filter(w => overCrowd(w.x)).map(w => ({ w, rim: 10, fill: 1 })), ...S.after.wardens.map(w => ({ w, rim: 4, fill: 0, warden: true }))]
    .map(o => ({ ...o, d: depthAt(o.w.x, o.w.y) })).sort((p, q) => q.d - p.d);
  let next = 0;
  const bodiesTo = d => {
    for (; next < bodies.length && bodies[next].d >= d; next++) {
      const o = bodies[next], v = body(o.w, o.rim, o.fill);
      if (o.warden) { const u = P * v.k; for (let c = -1; c <= 1; c++) rect(onPx(v.x) + (c - 0.5) * u, v.y - u * 5, u, u, 3); }
    }
  };
  bodiesTo(NEAR);
  const step = CROWD_STEP_UP * dt, inkStep = CROWD_INK_FADE * dt;
  let files = 0, count = 0;
  for (let v = NEAR - 1; v >= 0; v--) {
    const row = ROWS[VIS[v].row];
    const lo = CX + (S.camX - pad - CX) / row.rate, hi = CX + (S.camX + S.viewW + pad - CX) / row.rate;
    const f0 = clamp(Math.floor((lo - CROWD_X0) / CROWD_PITCH) - 1, 0, F - 1);
    const f1 = clamp(Math.ceil((hi - CROWD_X0) / CROWD_PITCH) + 1, 0, F - 1);
    files = Math.max(files, f1 - f0 + 1);
    for (let f = f0; f <= f1; f++) {
      const i = read.near[f * NEAR + v];
      if (i < 0) continue;
      let sv = read.shownVis[i], si = read.shownInk[i];
      if (Number.isNaN(sv)) sv = read.primed ? NEAR : v;
      if (Number.isNaN(si)) si = a[i];
      sv = sv > v ? Math.max(v, sv - step) : v;
      si = si < a[i] ? Math.min(a[i], si + inkStep) : Math.max(a[i], si - inkStep);
      read.shownVis[i] = sv; read.shownInk[i] = si;
      const L = layout(sv, read.bandL), s = Math.round(L.s);
      const x = onPx(at(fileMid(f) + L.off, L.rate) - s / 2);
      if (x + s < S.camX || x > S.camX + S.viewW) continue;
      // A front soul standing at a poster is behind it.
      if (v === 0 && posters.some(px => Math.abs(px + P / 2 - fileMid(f)) < CROWD_PITCH / 2)) continue;
      const fade = sv > NEAR - 1 ? clamp(NEAR - sv, 0, 1) : 1;
      soul(x, onPx(floor - L.foot - s), s, si, paleTone(s, i), fade);
      count++;
    }
    bodiesTo(v);
  }
  bodiesTo(-1);
  // The cloud's puffs in front of the front row: its feet stand in them.
  drawFloorLip();
  read.primed = true;
  drawnNow.files = files; drawnNow.souls = count;
}
// The signs planted in the crowd, where their slot is drawn: a post and a
// board (wider when it reaches further), knocked a cell over when askew,
// faint while a warden pulls it up.
function signs() {
  const floor = afterFloor();
  for (const s of S.after.signs) {
    const x0 = CROWD_X0 + s.f * CROWD_PITCH + CROWD_FRONT_BODY / 2;
    const v = seenAt(x0, floor - (s.r < CROWD_NEAR ? s.r * CROWD_ROW : CROWD_NEAR * CROWD_ROW + (s.r - CROWD_NEAR) * CROWD_FAR_ROW));
    const u = P * v.k, x = onPx(v.x - u / 2), y = v.y;
    if (x + u * 3 < S.camX || x - u * 3 > S.camX + S.viewW) continue;
    const was = ctx.globalAlpha;
    if (s.pull != null) ctx.globalAlpha = was * 0.6;
    rect(x, y - u * 3, u, u * 3, 10);
    const off = s.askew ? u : 0, half = s.big ? 2 : 1;
    rect(x - u * half + off, y - u * 5, u * (half * 2 + 1), u * 2, 10);
    rect(x + off, y - u * 5 + Math.max(1, u / 3), u, Math.max(1, u / 3), 1);
    ctx.globalAlpha = was;
  }
}

// --- God -----------------------------------------------------------------------------------------
// Taken once a zoom: the far scenery (the switchback's ledges and flights),
// the throne hazed and the throne in ink, and the glare. Drawn each frame
// at God's place on the slowest layer: the ink over the haze as the camera
// arrives, the glare pulsing at the share of support still to win.
const god = { K: 0, box: null, haze: null, ink: null, glare: null, scenery: null, horizon: null };
function billow(cols, seed) {
  const el = new Array(cols).fill(0);
  let c = 0, i = 0;
  while (c < cols) {
    const n = 5 + Math.floor(hsh(seed, i, 1) * 4);
    for (let j = 0; j < n && c + j < cols; j++) el[c + j] = Math.max(el[c + j], Math.round(Math.pow(Math.sin(Math.PI * (j + 0.5) / n), 0.6)));
    c += n - 1; i++;
  }
  return el;
}
// A sprite painted in God's own px about (0, floor 0), drawn at `s` of its
// size about the horizon (God far off is God smaller on the horizon). Every
// rect keeps a device pixel at least, so a far stroke thins and never drops
// out. Its box, scaled, rides on the canvas for `blit`.
const sx = (x, s) => x * s, sy = (y, s) => -GOD_HORIZON_UP + (y + GOD_HORIZON_UP) * s;
function sprite(box, paint, s = 1) {
  const sb = { x: sx(box.x, s), y: sy(box.y, s), w: box.w * s, h: box.h * s };
  const c = canvas(Math.ceil(sb.w * K) + 1, Math.ceil(sb.h * K) + 1), g = c.getContext('2d');
  c.box = sb;
  if (!g) return c;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const r = (x, y, w, h, tone) => {
    g.fillStyle = GREY[tone];
    const x0 = Math.round((sx(x, s) - sb.x) * K), y0 = Math.round((sy(y, s) - sb.y) * K);
    const ww = Math.max(1, Math.round((sx(x + w, s) - sb.x) * K) - x0), hh = Math.max(1, Math.round((sy(y + h, s) - sb.y) * K) - y0);
    if (w > 0 && h > 0) g.fillRect(x0, y0, ww, hh);
  };
  paint(r);
  return c;
}
// A billow edge: the cloud's top line, its steps, and the paper under it.
function edge(r, el, x0, yTop, tone, fill, yBot) {
  for (let j = 0; j < el.length; j++) {
    const x = x0 + j * P, y = yTop - el[j] * P;
    const cutL = j > 0 && el[j - 1] < el[j], cutR = j < el.length - 1 && el[j + 1] < el[j];
    if (fill != null) r(x, y + (cutL || cutR ? 2 : 0), P, yBot - y, fill);
    r(x + (cutL ? 2 : 0), y, P - (cutL ? 2 : 0) - (cutR ? 2 : 0), 2, tone);
    if (j > 0 && el[j] !== el[j - 1]) {
      const a = yTop - Math.max(el[j], el[j - 1]) * P, b = yTop - Math.min(el[j], el[j - 1]) * P;
      r(el[j] > el[j - 1] ? x : x - 2, a + 2, 2, b - a, tone);
    }
  }
}
// God's figure, about (0, floor 0): the throne's back, the seat and its
// legs, God the big square, two eyes and a crown. `fill` paints the paper
// inside; the ink pass leaves it out, so the crossfade never greys it.
function throne(r, tone, fill) {
  const box = (x, y, w, h) => {
    if (fill) r(x, y, w, h, 0);
    r(x, y, w, 2, tone); r(x, y + h - 2, w, 2, tone); r(x, y + 2, 2, h - 4, tone); r(x + w - 2, y + 2, 2, h - 4, tone);
  };
  box(-GOD_THRONE.w / 2, -GOD_THRONE.top, GOD_THRONE.w, GOD_THRONE.h);
  box(-GOD_SEAT.w / 2, -GOD_SEAT.up, GOD_SEAT.w, GOD_SEAT.h);
  const legY = -GOD_SEAT.up + GOD_SEAT.h, legH = GOD_SEAT.h + 4;
  r(-GOD_SEAT.w / 2 + 10, legY, 2, legH, tone); r(GOD_SEAT.w / 2 - 12, legY, 2, legH, tone);
  box(-GOD_FACE.w / 2, -GOD_FACE.up, GOD_FACE.w, GOD_FACE.w);
  for (const ex of GOD_FACE.eyeAt) r(ex, -GOD_FACE.eyeUp, GOD_FACE.eye, GOD_FACE.eye, tone);
  const [pw, ph] = GOD_CROWN.prong, [bw, bh] = GOD_CROWN.band;
  const gap = (bw - 8 - pw) / (GOD_CROWN.prongs - 1);
  for (let k = 0; k < GOD_CROWN.prongs; k++) r(-bw / 2 + 4 + k * gap, -GOD_CROWN.up, pw, ph, tone);
  r(-bw / 2, -GOD_CROWN.up + ph - 2, bw, bh, tone);
}
function takeGod(s) {
  god.K = K; god.s = s;
  const reach = GOD_GLARE.r1[1] + 4;
  const glareBox = { x: -reach, y: -GOD_GLARE.up - reach, w: reach * 2, h: reach * 2 };
  god.glare = sprite(glareBox, r => {
    for (let k = 0; k < GOD_GLARE.rays; k++) {
      const an = k / GOD_GLARE.rays * Math.PI * 2, r1 = GOD_GLARE.r1[k % 2 ? 0 : 1];
      for (let d = GOD_GLARE.r0; d < r1; d += 2)
        r(Math.round(Math.cos(an) * d) - 1, Math.round(-GOD_GLARE.up + Math.sin(an) * d) - 1, 2, 2, GOD_GLARE.tone);
    }
  }, s);
  god.glareBox = glareBox;
  const tw = Math.max(GOD_SEAT.w, GOD_THRONE.w) + 4;
  const tbox = { x: -tw / 2, y: -GOD_THRONE.top - 2, w: tw, h: GOD_THRONE.top - GOD_SEAT.up + GOD_SEAT.h * 3 };
  god.haze = sprite(tbox, r => throne(r, GOD_HAZE_TONE, true), s);
  god.ink = sprite(tbox, r => throne(r, 10, false), s);
  god.box = tbox;
  const xs = [...GOD_LEDGES.flatMap(l => [l[0], l[1]]), ...GOD_FLIGHTS.flatMap(l => [l[0], l[2]])];
  const sbox = { x: Math.min(...xs) - P, y: -Math.max(...GOD_LEDGES.map(l => l[2])) - P * 2, w: Math.max(...xs) - Math.min(...xs) + P * 2,
                 h: GOD_HORIZON_UP + P * 2 };
  sbox.h = -sbox.y - GOD_HORIZON_UP + P * 4;
  god.scenery = sprite(sbox, r => {
    GOD_LEDGES.forEach(([a, b, up], k) => {
      const cols = Math.round((b - a) / P);
      const el = billow(cols, 61 + k); el[0] = 0; el[cols - 1] = 0;
      edge(r, el, a, -up, 3, 0, -up + 24);
      edge(r, billow(cols, 66 + k).map(v => -v), a, -up + 18, 2, null, 0);
    });
    for (const [x0, u0, x1, u1] of GOD_FLIGHTS) {
      const n = Math.max(2, Math.round((u1 - u0) / 8)), dx = (x1 - x0) / n, dy = (u1 - u0) / n;
      for (let s = 0; s < n; s++) {
        const x = x0 + dx * s, y = -u0 - dy * (s + 1);
        r(Math.min(x, x + dx), y, Math.abs(dx) + 2, 2, 3);
        r(dx > 0 ? x : x + dx + Math.abs(dx), y, 2, dy + 2, 3);
      }
    }
  }, s);
  god.sceneryBox = sbox;
  // The far horizon: a billow line a tile long, laid end to end across the window.
  const tile = P * 40;
  god.horizonBox = { x: 0, y: -GOD_HORIZON_UP - P * 2, w: tile, h: P * 3 };
  god.horizon = sprite(god.horizonBox, r => edge(r, billow(tile / P, 41), 0, -GOD_HORIZON_UP, 2, null, 0));
}
const blit = (pic, box, x, y) => { const b = pic.box || box; ctx.drawImage(pic, onPx(x + b.x), onPx(y + b.y), pic.width / K, pic.height / K); };
// God's size this frame (view.js, `godScaleAt`), held to a device pixel of
// the throne's height so the sprites are taken again only when he has grown
// by one; and how strongly he shows, fainter the further off.
const godSize = () => {
  const s = godScaleAt(CX), unit = GOD_THRONE.top * K;
  return Math.max(1 / unit, Math.round(s * unit) / unit);
};
function drawGod() {
  const s = godSize();
  if (god.K !== K || god.s !== s) takeGod(s);
  const floor = afterFloor(), G = at(afterEnd(), GOD_RATE), t = now();
  const far = clamp((s - GOD_FAR) / (1 - GOD_FAR), 0, 1), show = lerp(GOD_FAR_ALPHA, 1, far);
  // The horizon, its tiles at God's rate.
  const tile = god.horizonBox.w, x0 = at(0, GOD_RATE);
  const first = Math.floor((S.camX - x0) / tile);
  for (let k = first; x0 + k * tile < S.camX + S.viewW; k++) blit(god.horizon, god.horizonBox, x0 + k * tile, floor);
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * show;
  const glare = glareAlpha() * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * GOD_GLARE.pulse)));
  if (glare > 0) { ctx.globalAlpha = was * show * glare; blit(god.glare, god.glareBox, G, floor); ctx.globalAlpha = was * show; }
  blit(god.scenery, god.sceneryBox, G, floor);
  blit(god.haze, god.box, G, floor);
  const near = smoothstep(afterPan(CX)) ** 1.5;
  if (near > 0) { ctx.globalAlpha = was * show * near; blit(god.ink, god.box, G, floor); ctx.globalAlpha = was * show; }
  // The tithe carriers on the switchback, tiny, fading in at its foot and
  // out into the glare at the seat.
  const pts = GOD_TITHE_PATH, lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const tot = lens.reduce((s, l) => s + l, 0);
  for (let k = 0; k < GOD_CARRIERS; k++) {
    const q = (((t / GOD_CARRIER_LAP_S + k / GOD_CARRIERS) % 1) + 1) % 1;
    let d = q * tot, i = 0;
    while (i < lens.length - 1 && d > lens[i]) d -= lens[i++];
    const u = d / lens[i], px = G + sx(lerp(pts[i][0], pts[i + 1][0], u), s), py = floor + sy(-lerp(pts[i][1], pts[i + 1][1], u), s);
    const c = Math.max(1 / K, s);
    ctx.globalAlpha = was * show * Math.min(1, q * 20, (1 - q) * 12);
    const x = onPx(px - 3 * c), y = onPx(py - 6 * c);
    rect(x, y, 6 * c, 6 * c, 5); rect(x + 2 * c, y + 2 * c, 2 * c, 2 * c, 0); rect(x + c, y - 2 * c, 4 * c, 2 * c, 4);
  }
  ctx.globalAlpha = was;
}

let lastT = null;
const frameDt = () => { const t = now(), d = lastT == null ? 0 : clamp(t - lastT, 0, 0.25); lastT = t; return d; };

// God's side: God on the horizon, the mass's bands far to near, the near
// rows and the front row, the signs and the bodies among them.
export function drawAfterCrowd(c) {
  if (!S.after) return;
  camFrame();
  const a = readCrowd();
  const dt = frameDt();
  drawGod();
  for (let b = CROWD_BANDS.length - 1; b >= 0; b--) {
    if (read.ranks <= NEAR) continue;
    drawBandCache(godBands[b], godCols(b), godColumn(b), CROWD_X0, CROWD_BANDS[b].rate, b * 1.3);
  }
  nearSouls(a, dt);
  signs();
}

// --- our crowd ---------------------------------------------------------------------------------
// The members arrived, eased in a soul at a time, so a member reaching the
// camp fades into our crowd's front. Our near rows hold the files across
// from the grove's edge to the pedestal, rank by rank from the end nearest
// God's yard; past them our mass fills band by band, near first, each
// spreading out from that end and rising as it fills, full when the strike's
// share of the crowd has arrived.
const ourBands = CROWD_BANDS.map((_, b) => makeCache(b, 51 + b));
const ours = { shown: 0, after: null };
const oursX1 = () => stationBox('pedestal').x;
const ourFiles = () => Math.max(1, Math.floor((oursX1() - OURS_X0) / CROWD_PITCH));
const ourCols = b => Math.floor((oursX1() - OURS_X0) * CROWD_BANDS[b].rate / CROWD_BANDS[b].cell);
// How full our mass is, 0..1, off the members past the near rows.
export function oursMass(n = ours.shown) {
  const cap = ourFiles() * (NEAR - 1);
  const full = STRIKE_SHARE * Math.max(1, souls().length) - cap;
  return n <= cap ? 0 : full <= 0 ? 1 : clamp((n - cap) / full, 0, 1);
}
function ourColumn(b, mass) {
  const bd = CROWD_BANDS[b], cols = ourCols(b), u = clamp(mass * CROWD_BANDS.length - b, 0, 1);
  const reach = Math.sqrt(u), depth = 0.45 + 0.55 * u;
  return j => {
    const q = (cols - 1 - j) / cols;
    const edgeK = u >= 1 ? 1 : clamp((reach - q) / 0.12, 0, 1);
    const fill = depth * smoothstep(edgeK) * (u > 0 ? 1 : 0);
    const h = fill > 0.02 ? bandH(bd.rows, fill, j, cols, 51 + b) : 0;
    return { h, head: h > 0 && hasHead(j, 51 + b), ink: OURS_INK };
  };
}
export function drawCampCrowd(c) {
  if (!S.after) return;
  camFrame();
  souls();
  if (ours.after !== S.after) { ours.after = S.after; ours.shown = arrived(); }
  const want = arrived();
  // A soul a beat at least, faster when far behind, either way: a member
  // stepping out to a post fades out of our crowd as it fades in at its spot.
  const gap = want - ours.shown, step = Math.max(2, Math.abs(gap)) * oursDt();
  ours.shown = gap >= 0 ? Math.min(want, ours.shown + step) : Math.max(want, ours.shown - step);
  const mass = oursMass();
  drawnNow.oursMass = mass;
  for (let b = CROWD_BANDS.length - 1; b >= 0; b--) {
    if (mass * CROWD_BANDS.length - b <= 0) continue;
    drawBandCache(ourBands[b], ourCols(b), ourColumn(b, mass), OURS_X0, CROWD_BANDS[b].rate, b * 1.7 + 0.6);
  }
  const files = ourFiles(), floor = afterFloor(), whole = Math.floor(ours.shown), part = ours.shown - whole;
  const nearCap = files * (NEAR - 1);
  let count = 0;
  for (let k = Math.min(whole, nearCap - 1); k >= 0; k--) {
    const v = 1 + Math.floor(k / files), f = files - 1 - (k % files);
    const L = layout(v, 1), s = Math.round(L.s);
    const x = onPx(at(OURS_X0 + f * CROWD_PITCH + CROWD_FRONT_BODY / 2 + L.off, L.rate) - s / 2);
    if (x + s < S.camX || x > S.camX + S.viewW || (k === whole && part <= 0)) continue;
    const ink = RIM_PIECES * lerp(1, OURS_INK, (v - 1) / (NEAR - 2));
    soul(x, onPx(floor - L.foot - s), s, ink, paleTone(s, k), k === whole ? part : 1);
    count++;
  }
  drawnNow.ours = count;
}
let oursLast = null;
function oursDt() { const t = now(), d = oursLast == null ? 0 : clamp(t - oursLast, 0, 0.25); oursLast = t; return d; }
