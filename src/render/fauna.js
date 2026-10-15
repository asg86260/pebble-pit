// The deep's zones and the creatures living in them (DESIGN.md, "The deep's
// zones"; the owner's layout A of docs/mocks/deep-full-height-2026-10-12.html).
// Two layers: the zones' water, behind the water's stars, and the creatures,
// behind the portal, the stations and the serpent. Picture only: where each
// creature is comes from deep/fauna.js, off its seed and the clock.
//
// Each creature's frame is painted once into an image of its own, its blinking
// lights the only cells drawn every frame. A click's reaction is a pose
// over the path (deep/fauna.js `faunaPose`): a frame or a drawing of its
// own, held, moved, lit, eased off its path and back at the frame rate.

import { now } from '../clock.js';
import { P, FAUNA_SPRITES, FAUNA_BASE, FAUNA_INK, FAUNA_BLINK, FAUNA_SIPHON, FAUNA_GULPER, FAUNA_SCARE, FAUNA_STARTLE, COIL_SEGS,
         FAUNA_POSES, FAUNA_REACT_INK, FAUNA_SMEAR, FAUNA_SILT } from '../config.js';
import { ctx } from './ctx.js';
import { TONE, greyAt, purpleAt } from './deeptones.js';
import { deepTop, deepX0 } from '../deep/place.js';
import { deepWindow } from './deep.js';
import { COLS, ROWS, faunaOut, unit, unit2, schoolAt, frameOf, reachOf, addScare, scareOffset,
         clearScares, SCARES, bolting, faunaPose, poseInset, heightOf, zoneHere, waterTop } from '../deep/fauna.js';
import { coilAt, bellyAt } from '../deep/place.js';
import { lashK, breaking } from '../deep/phases.js';

// Never under the faintest mark the water shows: a smear a few rungs down a
// dark creature is still a mark in the water, not a hole in it.
const grey = greyAt;
const purple = purpleAt;

// --- the zones' water -------------------------------------------------------------
// One flat water, top to floor (the owner's B4): the zones are who lives in
// them, not a tint. It covers whatever the window shows of the deep's water,
// not a margin guessed round it: the deep's zoom tops out at the yard's, so a
// tall window reaches as far over the ceiling as it is tall, and one wider
// than the deep past its far end.
export function drawDeepZones() {
  const win = deepWindow(), x0 = deepX0(), top = deepTop();
  const left = Math.min(x0, win.x0), right = Math.max(x0 + COLS * P, win.x1), from = Math.min(top, win.y0);
  ctx.fillStyle = TONE.water;
  ctx.fillRect(left, from, right - left, top + ROWS * P - from);
  ctx.fillStyle = '#000';
}

// --- a creature's tones ------------------------------------------------------------
// A grey body cell its character's flat rung; every tone `dim` rungs darker
// in a zone that is kept quiet.
function tone(ch, seed, r, c, dim) {
  if (ch in FAUNA_BASE) return grey(FAUNA_BASE[ch] - dim);
  if (ch === 'w') return grey(FAUNA_INK.w - dim);
  if (ch === 'e') return grey(FAUNA_INK.e - dim);
  if (ch === 'q') return purple(FAUNA_INK.q[unit2(seed + r, c) < FAUNA_INK.qDark ? 1 : 0] - dim);
  if (ch === 'r') return purple(FAUNA_INK.r - dim);
  if (ch === 'p') return purple(FAUNA_INK.p - dim);
  return null;
}
const lightTone = (seed, c, t, dim) =>
  purple((Math.floor(t * FAUNA_BLINK.rate + seed * 5 + c * 0.7) % 3 ? FAUNA_BLINK.lit : FAUNA_BLINK.dark) - dim);

// The rows a drawing is on: frame `f` of its own, or a reaction's pose
// (FAUNA_POSES) -- rows of its own, or a slice of the frame.
function rowsOf(key, f, pose) {
  const own = FAUNA_SPRITES[key].f[f], P0 = typeof pose === 'string' ? FAUNA_POSES[pose] : null;
  if (!P0) return own;
  return P0.rows || own.map(row => row.slice(P0.cols[0], P0.cols[1]));
}

// A drawing's frame, painted once a pixel a cell, facing its way, and where
// its lights are. Kept by creature (its seed), frame, pose and way.
const frames = new Map();
function frameImage(key, f, dir, seed, dim, pose = null, vflip = false) {
  const id = `${key}|${f}|${dir}|${seed}|${dim}|${pose}|${vflip}`;
  let got = frames.get(id);
  if (got) return got;
  const rows = rowsOf(key, f, pose), w = rows[0].length, h = rows.length;
  const img = document.createElement('canvas');
  img.width = w; img.height = h;
  const g = img.getContext('2d'), lights = [];
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const ch = rows[r][c], at = dir > 0 ? c : w - 1 - c, row = vflip ? h - 1 - r : r;
    if (ch === 'L') { lights.push([at, row, c]); continue; }
    const col = tone(ch, seed, r, c, dim);
    if (!col) continue;
    g.fillStyle = col;
    g.fillRect(at, row, 1, 1);
  }
  got = { img, lights, w, h };
  frames.set(id, got);
  return got;
}

// One drawing at cell (x, y) of the deep, on its frame clock `t`, in a
// reaction's pose `r` (or its own swim when that is null): the frame or pose
// it holds, upside down, its lights put out or held lit, a halo round them.
function sprite(key, x, y, dir, seed, t, dim, r = null) {
  const pose = r ? r.pose : undefined, f = typeof pose === 'number' ? pose : frameOf(key, seed, t);
  const named = typeof pose === 'string' ? pose : null, extra = named ? FAUNA_POSES[named].dim || 0 : 0;
  const fr = frameImage(key, f, dir, seed, dim + extra, named, !!(r && r.vflip));
  const inset = poseInset(key, named, dir);
  const wx = deepX0() + (x + inset.x) * P, wy = deepTop() + (y + inset.y) * P;
  ctx.drawImage(fr.img, wx, wy, fr.w * P, fr.h * P);
  const lights = r ? r.lights : undefined, I = FAUNA_REACT_INK;
  fr.lights.forEach(([at, row, c], k) => {
    ctx.fillStyle = lights === 'off' || (typeof lights === 'number' && k >= lights) ? purple(I.out)
      : lights === 'lit' ? purple(I.lit) : lightTone(seed, c, t, dim);
    ctx.fillRect(wx + at * P, wy + row * P, P, P);
  });
  if (r && r.halo) {
    ctx.fillStyle = purple(I.halo);
    for (const [at, row] of fr.lights) for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]])
      ctx.fillRect(wx + (at + a) * P, wy + (row + b) * P, P, P);
  }
}

// A cell of the deep, for the two creatures that move along their length.
function put(x, y, tone) {
  ctx.fillStyle = tone;
  ctx.fillRect(deepX0() + x * P, deepTop() + y * P, P, P);
}

// A siphonophore: its float, then the chain of bells swaying behind it, a
// glint running down it; drawn up short (`spacing`) and stiller (`amp`) in
// its reaction.
function siphon(x, y, dir, seed, t, dim, r = null) {
  const K = FAUNA_SIPHON, run = Math.floor(t * K.glint + seed * 40) % (K.bells + 8);
  const sp = r ? r.spacing : 1, amp = r && r.amp != null ? r.amp : K.amp;
  put(x, y - 1, grey(K.float[0] - dim)); put(x - dir, y - 1, grey(K.float[1] - dim));
  for (let i = 0; i < K.bells; i++) {
    const cx = x - dir * Math.round(i * sp), cy = y + Math.round(Math.sin(i * K.wave - t * K.sway + seed * 6) * amp);
    put(cx, cy, Math.abs(i - run) < 1 ? purple(K.glintTone - dim) : grey(K.bell[i % 2 ? 0 : 1] - dim));
    if (i % 3 === 0) put(cx, cy + 1, i % 6 ? grey(K.frond - dim) : purple(K.frondLit - dim));
  }
}

// A gulper eel: the great head, then the whip of its tail, the tip lit.
function gulper(x, y, dir, seed, t, dim) {
  const K = FAUNA_GULPER, head = FAUNA_SPRITES.gulperHead.f[0][0].length;
  sprite('gulperHead', x, y, dir, seed, t, dim);
  for (let i = 1; i <= K.tail; i++) {
    const cx = dir > 0 ? x - i : x + head - 1 + i;
    const cy = y + 2 + Math.round(Math.sin(i * K.wave - t * K.beat + seed * 6) * (i / K.tail) * K.amp);
    put(cx, cy, i === K.tail ? purple(K.tip - dim) : grey((i > K.tail - K.dark ? K.under : K.body) - dim));
    if (i < K.thick) put(cx, cy + 1, grey(K.under - dim));
  }
}

// Silt kicked off the bed `age` seconds ago, either side of column `x` on
// row `y`: out a cell a held pose, darkening as it goes.
function silt(x, y, age) {
  const K = FAUNA_SILT, k = Math.floor(age * FAUNA_STARTLE.rate) + 1;
  for (const side of [-1, 1]) for (let j = 0; j < 2; j++)
    put(x + side * (k + j), y - (j === 0 && k < K.lift ? 1 : 0), grey(K.tone - Math.floor(k / 2)));
}

// --- the creatures ----------------------------------------------------------------

// The frights the fight raises, seen from the drawing: the tip of a lash as
// it sweeps the coil, and the belly as a defense breaks. Read off the
// phases, so the sim never hears of them.
let wasBreaking = false, lastLash = -1;
function watchFight(t) {
  if (t < lastLash) { lastLash = -1; clearScares(); }          // the clock went back (a scene stood again)
  const cell = p => [(p.x - deepX0()) / P, (p.y - deepTop()) / P];
  const k = lashK();
  if (k != null && t - lastLash >= FAUNA_SCARE.lash.every) {
    lastLash = t;
    const [x, y] = cell(coilAt(Math.round(k * (COIL_SEGS - 1)), now()));
    addScare(x, y, t, 1);
  }
  const b = breaking();
  if (b && !wasBreaking) { const [x, y] = cell(bellyAt(now())); addScare(x, y, t, 2); }
  wasBreaking = b;
}

// One creature at pose `p` (deep/fauna.js `faunaPose`), `dim` rungs dark.
const STILL = { x: 0, y: 0 };
function drawOne(c, p, t, dim) {
  const col = Math.round(p.x), { y, dir, ft, r } = p;
  if (c.kind === 'school') {
    const bolt = bolting(c, t);
    for (let m = 0; m < c.n; m++) {
      const s = schoolAt(c, m, ft), px = col + s.dx, py = y + s.dy;
      const o = SCARES.length && !bolt ? scareOffset(px, py, t, false, 1 + (unit(m * 2.3 + c.seed * 40) - 0.5) * 2 * FAUNA_SCARE.shoal) : STILL;
      sprite('sardine', px + o.x, Math.max(waterTop(), py + o.y), dir, s.seed, ft, dim);
    }
  } else if (c.kind === 'siphon') siphon(col, y, dir, c.seed, ft, dim, r);
  else if (c.kind === 'gulper') gulper(col, y, dir, c.seed, ft, dim);
  else sprite(c.kind, col, y, dir, c.seed, ft, dim, r);
}

export function drawDeepFauna() {
  const t = now() / 1000, { x0, x1 } = deepWindow();
  watchFight(t);
  const left = (x0 - deepX0()) / P, right = (x1 - deepX0()) / P, K = FAUNA_SMEAR;
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  for (const c of faunaOut(t)) {
    const p = faunaPose(c, t), reach = reachOf(c) + FAUNA_SCARE.break.push + K.far;
    if (p.x + reach < left || p.x - reach > right) continue;
    // the dim of the zone it is crossing, not the one it set out from
    const dim = zoneHere(c.kind, p.y).dim;
    // The smear: on the frame a table marks for it, where it was a moment
    // ago drawn under it, darker, if it has come far enough since.
    if (p.r && p.r.smear) {
      const was = faunaPose(c, t - K.lag), moved = Math.abs(Math.round(p.x) - Math.round(was.x)) + Math.abs(p.y - was.y);
      if (moved >= K.moved && moved < K.far && was.r) drawOne(c, { ...was, r: { ...was.r, halo: false } }, t, dim + K.rungs);
    }
    drawOne(c, p, t, dim);
    // silt kicked off the bed either side of its middle, on the row its path stands on
    if (p.r && p.r.silt.length) {
      const mid = Math.round(p.x + (FAUNA_SPRITES[c.kind].f[0][0].length - 1) / 2), bed = p.by + heightOf(c.kind) - 1;
      for (const age of p.r.silt) silt(mid, bed, age);
    }
  }
  ctx.imageSmoothingEnabled = smooth;
  ctx.fillStyle = '#000';
}
