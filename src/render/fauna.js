// The deep's zones and the creatures living in them (DESIGN.md, "The deep's
// zones"; the owner's layout A of docs/mocks/deep-full-height-2026-10-12.html).
// Two layers: the zones' tint, behind the water's field, and the creatures,
// behind the portal, the stations and the serpent. Picture only: where each
// creature is comes from deep/fauna.js, off its seed and the clock.
//
// Both are kept cheap the way the deep's floor is: the tint never changes,
// so it is painted once, a pixel a cell, and drawn scaled up; and each
// creature's frame is painted once into an image of its own, its blinking
// lights the only cells drawn every frame.

import { now } from '../clock.js';
import { P, FAUNA_ZONES, FAUNA_TINT_FILL, FAUNA_TINT_EDGE, FAUNA_TINT_MIX, FAUNA_SPRITES, FAUNA_BASE,
         FAUNA_VARY, FAUNA_INK, FAUNA_BLINK, FAUNA_SIPHON, FAUNA_GULPER, FAUNA_SCARE, FAUNA_STARTLE, COIL_SEGS } from '../config.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES } from './deeptones.js';
import { deepTop, deepX0 } from '../deep/place.js';
import { deepWindow } from './deep.js';
import { COLS, ROWS, POPULATION, unit, unit2, zoneAtRow, faunaAt, schoolAt, frameOf, reachOf, addScare, scareOffset,
         clearScares, SCARES, floorRowAt, bolting } from '../deep/fauna.js';
import { coilAt, bellyAt } from '../deep/place.js';
import { lashK, breaking } from '../deep/phases.js';

const grey = i => GREYS[Math.max(0, Math.min(GREYS.length - 1, i))];
const purple = i => PURPLES[Math.max(0, Math.min(PURPLES.length - 1, i))];

// --- the zones' tint --------------------------------------------------------------
// Each zone's own two greys, dithered on a fixed hash; across a border the
// rows mix, the neighbor's cells thinning out a step a row. The field's lit
// cells are drawn over it and its dark ones leave it showing.
//
// It covers whatever the window shows of the deep's water, not a margin
// guessed round it: the deep's zoom tops out at the yard's, so a tall window
// reaches as far over the ceiling as it is tall, and one wider than the deep
// past its far end. Above the ceiling is the sunlit's water and past either
// end the row's own zone, on the same hash, so a regrown image is the old one
// with more round it. Painted once a pixel a cell, again only when a window
// shows past what is painted.
let tint = null;
function tintRung(x, y) {
  const step = FAUNA_TINT_MIX / FAUNA_TINT_EDGE;
  const z = zoneAtRow(y), here = FAUNA_ZONES[z], next = FAUNA_ZONES[z + 1], prev = FAUNA_ZONES[z - 1];
  const toNext = here.to - y, fromPrev = y - here.from + 1;
  let q = here;
  if (next && toNext <= FAUNA_TINT_EDGE && unit2(x, y) < FAUNA_TINT_MIX - (toNext - 1) * step) q = next;
  if (prev && fromPrev <= FAUNA_TINT_EDGE && unit2(y, x) < FAUNA_TINT_MIX - (fromPrev - 1) * step) q = prev;
  const k = unit2(x * 1.3, y * 0.7);
  return k < q.share ? q.tones[1] : k < FAUNA_TINT_FILL ? q.tones[0] : 0;
}
function tintImage(span) {
  if (tint && span.c0 >= tint.c0 && span.c1 <= tint.c1 && span.r0 >= tint.r0) return tint;
  const c0 = Math.min(span.c0, tint ? tint.c0 : 0), c1 = Math.max(span.c1, tint ? tint.c1 : COLS);
  const r0 = Math.min(span.r0, tint ? tint.r0 : 0);
  const img = document.createElement('canvas');
  img.width = c1 - c0; img.height = ROWS - r0;
  const g = img.getContext('2d');
  for (let y = r0; y < ROWS; y++) {
    for (let x = c0; x < c1; x++) {
      const rung = tintRung(x, y);
      if (rung <= 0) continue;
      g.fillStyle = GREYS[rung];
      g.fillRect(x - c0, y - r0, 1, 1);
    }
  }
  return (tint = { img, c0, c1, r0 });
}

// The cells, from the deep's top-left, the window shows of the deep's water
// and the deep's own: columns [c0, c1), rows from r0 down to the floor.
export function tintSpan(win = deepWindow()) {
  const x0 = deepX0(), top = deepTop();
  return {
    c0: Math.min(0, Math.floor((win.x0 - x0) / P)), c1: Math.max(COLS, Math.ceil((win.x1 - x0) / P)),
    r0: Math.min(0, Math.floor((win.y0 - top) / P)),
  };
}

export function drawDeepZones() {
  const t = tintImage(tintSpan());
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(t.img, deepX0() + t.c0 * P, deepTop() + t.r0 * P, (t.c1 - t.c0) * P, (ROWS - t.r0) * P);
  ctx.imageSmoothingEnabled = smooth;
}

// --- a creature's tones ------------------------------------------------------------
// A grey body cell nudged a rung either way on its own hash, fixed per
// creature; every tone `dim` rungs darker in a zone that is kept quiet.
function tone(ch, seed, r, c, dim) {
  if (ch in FAUNA_BASE) {
    const j = unit2(seed + r * 7.1, c * 3.3);
    const rung = Math.max(FAUNA_VARY.floor, FAUNA_BASE[ch] + (j < FAUNA_VARY.lo ? -1 : j > FAUNA_VARY.hi ? 1 : 0));
    return grey(rung - dim);
  }
  if (ch === 'w') return grey(FAUNA_INK.w - dim);
  if (ch === 'e') return grey(FAUNA_INK.e - dim);
  if (ch === 'q') return purple(FAUNA_INK.q[unit2(seed + r, c) < FAUNA_INK.qDark ? 1 : 0] - dim);
  if (ch === 'r') return purple(FAUNA_INK.r - dim);
  if (ch === 'p') return purple(FAUNA_INK.p - dim);
  return null;
}
const lightTone = (seed, c, t, dim) =>
  purple((Math.floor(t * FAUNA_BLINK.rate + seed * 5 + c * 0.7) % 3 ? FAUNA_BLINK.lit : FAUNA_BLINK.dark) - dim);

// A drawing's frame, painted once a pixel a cell, facing its way, and where
// its lights are. Kept by creature (its seed), frame and way.
const frames = new Map();
function frameImage(key, f, dir, seed, dim) {
  const id = `${key}|${f}|${dir}|${seed}|${dim}`;
  let got = frames.get(id);
  if (got) return got;
  const rows = FAUNA_SPRITES[key].f[f], w = rows[0].length;
  const img = document.createElement('canvas');
  img.width = w; img.height = rows.length;
  const g = img.getContext('2d'), lights = [];
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < w; c++) {
    const ch = rows[r][c], at = dir > 0 ? c : w - 1 - c;
    if (ch === 'L') { lights.push([at, r, c]); continue; }
    const col = tone(ch, seed, r, c, dim);
    if (!col) continue;
    g.fillStyle = col;
    g.fillRect(at, r, 1, 1);
  }
  got = { img, lights, w, h: rows.length };
  frames.set(id, got);
  return got;
}

// One drawing at cell (x, y) of the deep.
function sprite(key, x, y, dir, seed, t, dim) {
  const fr = frameImage(key, frameOf(key, seed, t), dir, seed, dim);
  const wx = deepX0() + x * P, wy = deepTop() + y * P;
  ctx.drawImage(fr.img, wx, wy, fr.w * P, fr.h * P);
  for (const [at, r, c] of fr.lights) {
    ctx.fillStyle = lightTone(seed, c, t, dim);
    ctx.fillRect(wx + at * P, wy + r * P, P, P);
  }
}

// A cell of the deep, for the two creatures that move along their length.
function put(x, y, tone) {
  ctx.fillStyle = tone;
  ctx.fillRect(deepX0() + x * P, deepTop() + y * P, P, P);
}

// A siphonophore: its float, then the chain of bells swaying behind it, a
// glint running down it.
function siphon(x, y, dir, seed, t, dim) {
  const K = FAUNA_SIPHON, run = Math.floor(t * K.glint + seed * 40) % (K.bells + 8);
  put(x, y - 1, grey(K.float[0] - dim)); put(x - dir, y - 1, grey(K.float[1] - dim));
  for (let i = 0; i < K.bells; i++) {
    const cx = x - dir * i, cy = y + Math.round(Math.sin(i * K.wave - t * K.sway + seed * 6) * K.amp);
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

// --- the creatures ----------------------------------------------------------------
// Each zone's own dim, looked up once.
const DIM = new Map(FAUNA_ZONES.map(z => [z.key, z.dim]));

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

const STILL = { x: 0, y: 0 };
export function drawDeepFauna() {
  const t = now() / 1000, { x0, x1 } = deepWindow();
  watchFight(t);
  const left = (x0 - deepX0()) / P, right = (x1 - deepX0()) / P;
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  for (const c of POPULATION) {
    const { x, y, dir } = faunaAt(c, t, floorRowAt), reach = reachOf(c) + FAUNA_SCARE.break.push;
    if (x + reach < left || x - reach > right) continue;
    // A startled one beats its fins and turns its frames faster while it bolts.
    const bolt = bolting(c, t), ft = bolt ? c.t0 + (t - c.t0) * FAUNA_STARTLE.quick : t;
    const col = Math.round(x), dim = DIM.get(c.zone) || 0;
    if (c.kind === 'school') {
      for (let m = 0; m < c.n; m++) {
        const s = schoolAt(c, m, ft), px = col + s.dx, py = y + s.dy;
        const o = SCARES.length && !bolt ? scareOffset(px, py, t, false, 1 + (unit(m * 2.3 + c.seed * 40) - 0.5) * 2 * FAUNA_SCARE.shoal) : STILL;
        sprite('sardine', px + o.x, Math.max(0, py + o.y), dir, s.seed, ft, dim);
      }
    } else if (c.kind === 'siphon') siphon(col, y, dir, c.seed, ft, dim);
    else if (c.kind === 'gulper') gulper(col, y, dir, c.seed, ft, dim);
    else sprite(c.kind, col, y, dir, c.seed, ft, dim);
  }
  ctx.imageSmoothingEnabled = smooth;
  ctx.fillStyle = '#000';
}
