// The abyss's liquid: one field, drawn in two places. The drowned pit shows
// it from above the surface, and the deep's water is the same liquid seen
// from below it -- the same cells, carried on down under the pit's surface
// (`rowShift`), so a camera that has gone all the way into the pit and one
// that has gone all the way into the deep's water see one picture, and the
// glide between the halves hands over on it (view.js).
//
// The current and the stars breathing in it are both read off one flow
// field, so the sky and the smoke are plainly the same fluid. The fine hash
// seats a star; the coarse hash over eight-cell patches decides whether that
// stretch is nebula-thick, ordinary or empty. A star's breath walks up its
// family's ramp and back, lifted or lowered by the current; depth sets its
// ceiling, so looking down is looking further in. The veil is the crest of
// the same field, broken by the hash so it lights in ragged runs rather than
// a painted band.
//
// The row's sideways drag and the column's downward drag each depend on only
// one of the two, so both are worked out once, and so is each wave's phase
// a column's part plus a row's: a painted cell takes no sine at all unless
// it is a star.

import { P, ABYSS_STAR_EVERY, ABYSS_STAR_MS, ABYSS_STAR_FLOOR, ABYSS_STAR_VARY, ABYSS_BREATH_BEND,
         ABYSS_FLOW_MS, ABYSS_FLOW_COL, ABYSS_FLOW_ROW, ABYSS_FLOW_SHEAR,
         ABYSS_FLOW_ASPECT, ABYSS_FLOW_DRIFT, ABYSS_SHEAR_ROW, ABYSS_SHEAR_TURN,
         ABYSS_SHEAR_AMT2, ABYSS_SHEAR_COL, ABYSS_SHEAR_AMT_Y,
         ABYSS_FLOW_COL2, ABYSS_FLOW_ROW2, ABYSS_FLOW_DRIFT2, ABYSS_FLOW_MIX,
         ABYSS_VEIL_AT, ABYSS_VEIL_EVERY, ABYSS_VEIL_JITTER, ABYSS_VEIL_LIT, ABYSS_VEIL_DEEP,
         ABYSS_FLOW_LIFT } from '../config.js';
import { ctx } from './ctx.js';
import { inkOf, inkMode } from '../ink.js';

const HASH_C = 73856093, HASH_R = 19349663;
const seeth = (c, r) => Math.abs((c * HASH_C) ^ (r * HASH_R)) % 997;

// The field is worked out a cell at a time into an image one pixel a cell,
// and that image drawn once, scaled up with no smoothing: the same cells on
// the same grid, but one draw where a fillRect a lit cell was thousands a
// frame over a whole window of water -- the deep ran at a fraction of the
// yard's frame rate on a large screen. The tones go through the page's own
// palette (`inkOf`), as a fillStyle would.
// A cell is written as one 32-bit word through a view on the image's bytes,
// each ramp's rungs packed once (`packed`): the byte order is the machine's,
// and every machine a browser runs on is little-endian, so the word's low
// byte is red.
let img = null, octx = null, buf = null, words = null;
const packsIn = new Map();   // a WeakMap of ramps for each map (ink.js)
function packed(ramp) {
  let packs = packsIn.get(inkMode());
  if (!packs) packsIn.set(inkMode(), packs = new WeakMap());
  let v = packs.get(ramp);
  if (v) return v;
  v = new Uint32Array(ramp.length);
  for (let i = 0; i < ramp.length; i++) {
    if (ramp[i] == null) continue;         // a rung left unpainted: what is under it shows
    const h = inkOf(ramp[i]).replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(d => d + d).join('') : h, 16);
    v[i] = ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | ((n >> 16) & 255)) >>> 0;
  }
  packs.set(ramp, v);
  return v;
}
function surface(cols, rows) {
  if (!img) { img = document.createElement('canvas'); octx = img.getContext('2d'); }
  if (img.width < cols || img.height < rows) {
    img.width = Math.max(img.width, cols); img.height = Math.max(img.height, rows);
    buf = null;
  }
  if (!buf || buf.width !== cols || buf.height !== rows) {
    buf = octx.createImageData(cols, rows);
    words = new Uint32Array(buf.data.buffer);
  }
  words.fill(0);
  return words;
}
// A column's two waves' sines and cosines, and its halves of the cell's
// hash and its patch's (`seeth` is the xor of a column's part and a row's),
// and the column and lift its stars are carried to and their brightening
// (`shift`), kept between frames.
let cols4 = null;
function colScratch(n) {
  if (!cols4 || cols4.s.length < n)
    cols4 = { s: new Float64Array(n), c: new Float64Array(n), s2: new Float64Array(n), c2: new Float64Array(n),
              h: new Int32Array(n), p: new Int32Array(n),
              to: new Int32Array(n), up: new Int32Array(n), g: new Float64Array(n) };
  return cols4;
}
const SHIFT = new Float64Array(3);

// Columns `from`..`to` and rows `top`..`bottom` of the screen's world, the
// liquid's surface at `line` in the pit's own rows, and this place's rows
// `rowShift` under the pit's (nought in the pit itself). `tones` and `magic`
// are the ramps as drawn: the yard's as they are, the deep's turned over for
// its inversion.
// One cell of the field as a rung: positive on the grey ramp, negative on the
// purple one, nought for the liquid's own dark. `dragX` is the row's sideways
// drag and `dragY` the column's downward one (worked out once a row and once
// a column by the painter); `deep` lifts the cell further in and
// `magicShare` is how many stars in seven are purple -- the portal's mouth
// asks for both (render/portal.js). There is no alpha, so a ramp is the
// fade, and every ramp's bottom rung is black: rung nought means "do not
// draw".
function cellRung(c, r, dragX, dragY, depth, a, t, rampLen, magicLen, magicShare) {
  const cx = c + dragX, ry = r + dragY;
  const f = Math.sin(cx * ABYSS_FLOW_COL + ry * ABYSS_FLOW_ROW * ABYSS_FLOW_ASPECT
                     - a * ABYSS_FLOW_DRIFT);
  // the second, far slower wave rides over the first as a strength,
  // thinning the filament to nothing along one stretch and swelling it
  // along another
  const wave2 = Math.sin(cx * ABYSS_FLOW_COL2 + ry * ABYSS_FLOW_ROW2 - a * ABYSS_FLOW_DRIFT2);
  CELL[F] = f; CELL[WAVE2] = wave2; CELL[DEPTH] = depth; CELL[T] = t;
  return rungOf(seeth(c, r), PATCH_OF[seeth(c >> 3, r >> 3)], rampLen, magicLen, magicShare);
}

// What a cell reads off its hash, a table a reading over the hash's 997
// values rather than a division a reading.
const byHash = k => Int8Array.from({ length: 997 }, (_, h) => k(h));
const STAR_OF = byHash(h => h % ABYSS_STAR_EVERY);
const SEVEN_OF = byHash(h => h % 7);
const VARY_OF = byHash(h => (h >> 3) % ABYSS_STAR_VARY);
const THIN_OF = byHash(h => (h >> 5) % 16);
// `globalThis.__pinInk` is the palette check's read frame: the stars are
// stepped up their ramp, not breathed, so the cap is asked of what is drawn.
// Set by `paintAbyssField` for one paint, and by `rungOf` for one star.
let FADE = false, STAR_A = 1;
const VEIL_OF = byHash(h => h % ABYSS_VEIL_EVERY);
const JITTER_OF = byHash(h => h % 3 - 1);
const PATCH_OF = byHash(h => h % 10);
const STAR_KEEP_MOST = 4;

// A cell's two waves, its row's depth and the clock reach `rungOf` through
// this array rather than as arguments: a fractional number handed to a call
// is a fresh object on the heap, and a call a cell of the water is a few
// megabytes a frame for the collector.
const CELL = new Float64Array(4);
const F = 0, WAVE2 = 1, DEPTH = 2, T = 3;

// The rest of a cell, given its hash `h`, its eight-cell patch's nature
// `patch` (0..2 empty, 3..6 ordinary, 7+ nebula) and, in `CELL`, its two
// waves: `f` the current's own and `wave2` the slow one riding over it as a
// strength.
function rungOf(h, patch, rampLen, magicLen, magicShare, thin = 16, dim = 0) {
  const f = CELL[F], wave2 = CELL[WAVE2], depth = CELL[DEPTH], t = CELL[T];
  const keep = patch >= 7 ? STAR_KEEP_MOST : 1;  // nebula patches keep four times the stars
  if (patch >= 3 && STAR_OF[h] < keep && THIN_OF[h] < thin) {
    // the breath, bent so a star spends most of its life dim, then lifted
    // or lowered by the current
    const swing = (Math.sin(t / ABYSS_STAR_MS * Math.PI * 2 * (0.6 + SEVEN_OF[h] * 0.1) + h) + 1) / 2;
    const k = Math.pow(swing, ABYSS_BREATH_BEND)
            * (1 - ABYSS_FLOW_LIFT + ABYSS_FLOW_LIFT * (f + 1) / 2);
    const purple = SEVEN_OF[h] < magicShare;
    const len = purple ? magicLen : rampLen;
    // its ceiling: shallow stars never reach the bright end of their
    // family. At least two rungs, so even the dimmest star has a fade
    // rather than a switch.
    const allowed = ABYSS_STAR_FLOOR + Math.round(depth * (len - 1 - ABYSS_STAR_FLOOR));
    const ceiling = allowed - VARY_OF[h] - dim;
    // Where the field fades its stars (`fade`), a star is drawn at its top
    // rung and breathes by opacity (`STAR_A`), so it never blinks on or off;
    // otherwise it steps up its ramp a rung at a time.
    if (FADE) {
      const top = Math.min(len - 1, ceiling);
      STAR_A = k;
      if (top > 0 && k > 0.02) return purple ? -top : top;
    } else {
      const rung = Math.min(len - 1, Math.round(k * ceiling));
      if (rung > 0) return purple ? -rung : rung;
    }
  }
  const swell = 1 - ABYSS_FLOW_MIX + ABYSS_FLOW_MIX * (wave2 + 1) / 2;
  const off = Math.abs(f), band = ABYSS_VEIL_AT * swell;
  if (off > band || VEIL_OF[h] === 0) return 0;
  // how near the middle of the filament this cell sits; the deep carries
  // it a shade further up the ramp, and the hash nudges each cell so no
  // stretch is one flat tone
  const thick = (1 - off / band) * swell;
  const lit = thick * (ABYSS_VEIL_LIT + depth * ABYSS_VEIL_DEEP) + JITTER_OF[h] * ABYSS_VEIL_JITTER;
  return Math.max(0, Math.min(rampLen - 1, Math.round(lit * (rampLen - 1))));  // its edges reach black and stop
}

const flow = t => t / ABYSS_FLOW_MS * Math.PI * 2;
const dragRow = (r, a) => Math.sin(r * ABYSS_FLOW_ROW + a) * ABYSS_FLOW_SHEAR
                        + Math.sin(r * ABYSS_FLOW_ROW * ABYSS_SHEAR_ROW - a * ABYSS_SHEAR_TURN)
                          * ABYSS_FLOW_SHEAR * ABYSS_SHEAR_AMT2;
const dragCol = (c, a) => Math.sin(c * ABYSS_FLOW_COL * ABYSS_SHEAR_COL - a * ABYSS_SHEAR_COL)
                        * ABYSS_FLOW_SHEAR * ABYSS_SHEAR_AMT_Y;

// The field's rung at one cell of the pit's liquid (x, y on the grid), for a
// thing painted a cell at a time over it that wants the liquid under it.
export function abyssRung(x, y, { line, t, rampLen, magicLen, deep = 0, magicShare = 1 }) {
  const a = flow(t), c = x / P, r = y / P;
  const depth = Math.min(1, Math.max(0, (y - line) / (P * 32)) + deep);
  return cellRung(c, r, dragRow(r, a), dragCol(c, a), depth, a, t, rampLen, magicLen, magicShare);
}

// Columns `from`..`to` and rows `top`..`bottom` of the screen's world, the
// liquid's surface at `line` in the pit's own rows, and this place's rows
// `rowShift` under the pit's (nought in the pit itself). `tones` and `magic`
// are the ramps as drawn: the yard's as they are, the deep's turned over for
// its inversion. `deep` lifts every cell further in, as `abyssRung`'s does:
// the pit's field darkens toward the surface it is seen through, and a place
// with no surface on screen asks for the whole of its depth everywhere.
// `veil` false paints the stars alone, and `magicShare` is how many stars in
// seven are purple (the deep asks for its stars only, all purple: B4).
// `thin` is how many stars in sixteen are shown at all and `dim` how many
// rungs each one's brightest is held under, for a place that wants a quieter
// sky than the pit's; `fade` breathes each star by opacity at its top rung
// instead of stepping it up the ramp. A rung a ramp holds as null is left
// unpainted.
// `shift(c, out)` carries the stars: for world column `c`, how many cells
// right and up a star seated there is drawn, and how much brighter
// (render/deepwave.js); `reach` is how far, in cells, left of, right of and
// under the window a star may be carried in from. The field is read where
// each star is seated and the star written where it is carried to, so every
// star moves whole cells and none is lost or doubled on the way.
export function paintAbyssField({ from, to, top, bottom, line, rowShift = 0, deep = 0, tones, magic, t,
                                  veil = true, magicShare = 1, thin = 16, dim = 0, fade = false,
                                  shift = null, reach = null }) {
  const cols = Math.max(0, Math.round((to - from) / P)), rows = Math.max(0, Math.ceil((bottom - top) / P));
  if (!cols || !rows) return;
  const data = surface(cols, rows);
  FADE = fade && !globalThis.__pinInk;
  const a = flow(t);
  const grey = packed(tones), purple = packed(magic);
  const L = shift ? reach.left : 0, R = shift ? reach.right : 0, D = shift ? reach.down : 0;
  // Both waves' phases are a column's part plus a row's part (the drags
  // each ride on one of the two), so each wave's sine and cosine are taken
  // once a column and once a row, and a cell puts its two waves together
  // from those: sin(u + v) = sin u cos v + cos u sin v.
  const n = Math.ceil((to - from) / P) + L + R;
  const col = colScratch(n);
  for (let x = from - L * P, i = 0; i < n; x += P, i++) {
    const c = x / P, dragY = dragCol(c, a);
    const u = c * ABYSS_FLOW_COL + dragY * ABYSS_FLOW_ROW * ABYSS_FLOW_ASPECT;
    const u2 = c * ABYSS_FLOW_COL2 + dragY * ABYSS_FLOW_ROW2;
    col.s[i] = Math.sin(u); col.c[i] = Math.cos(u);
    col.s2[i] = Math.sin(u2); col.c2[i] = Math.cos(u2);
    col.h[i] = c * HASH_C; col.p[i] = (c >> 3) * HASH_C;
    if (shift) {
      shift(c, SHIFT);
      col.to[i] = i - L + Math.round(SHIFT[0]); col.up[i] = Math.round(SHIFT[1]); col.g[i] = 1 + SHIFT[2];
    } else { col.to[i] = i; col.up[i] = 0; col.g[i] = 1; }
  }
  const { s: sU, c: cU, s2: sU2, c2: cU2, h: hU, p: pU, to: toCol, up: lift, g: glow } = col;
  for (let y = top, j = 0; j < rows + D; y += P, j++) {
    const py = y + rowShift;                     // where this row is in the pit's liquid
    const r = py / P, dragX = dragRow(r, a);
    const depth = Math.min(1, Math.max(0, (py - line) / (P * 32)) + deep);
    const v = dragX * ABYSS_FLOW_COL + r * ABYSS_FLOW_ROW * ABYSS_FLOW_ASPECT - a * ABYSS_FLOW_DRIFT;
    const v2 = dragX * ABYSS_FLOW_COL2 + r * ABYSS_FLOW_ROW2 - a * ABYSS_FLOW_DRIFT2;
    const sV = Math.sin(v), cV = Math.cos(v), sV2 = Math.sin(v2), cV2 = Math.cos(v2);
    const hV = (r * HASH_R) | 0, pV = ((r >> 3) * HASH_R) | 0;
    CELL[DEPTH] = depth; CELL[T] = t;
    for (let i = 0; i < n; i++) {
      // Most of the water is dark, and most of that is known dark from the
      // current alone: outside the veil's widest band, and on a hash no
      // patch seats a star on.
      const f = sU[i] * cV + cU[i] * sV, h = Math.abs(hU[i] ^ hV) % 997;
      if (STAR_OF[h] >= STAR_KEEP_MOST && (!veil || Math.abs(f) > ABYSS_VEIL_AT)) continue;
      CELL[F] = f; CELL[WAVE2] = sU2[i] * cV2 + cU2[i] * sV2;
      STAR_A = 1;
      const rung = rungOf(h, PATCH_OF[Math.abs(pU[i] ^ pV) % 997], tones.length, magic.length, magicShare, thin, dim);
      const px = rung > 0 ? (veil ? grey[rung] : 0) : rung < 0 ? purple[-rung] : 0;
      if (!px) continue;
      const ti = toCol[i], tj = j - lift[i];
      if (ti < 0 || ti >= cols || tj < 0 || tj >= rows) continue;
      const k = FADE ? Math.min(1, STAR_A * glow[i]) : STAR_A;
      data[tj * cols + ti] = k >= 1 ? px : ((px & 0x00ffffff) | (Math.round(k * ((px >>> 24) & 255)) << 24)) >>> 0;
    }
  }
  octx.putImageData(buf, 0, 0);
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, cols, rows, from, top, cols * P, rows * P);
  ctx.imageSmoothingEnabled = smooth;
}
