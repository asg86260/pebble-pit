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
// one of the two, so both are worked out once; a cell costs one sine.

import { P, ABYSS_STAR_EVERY, ABYSS_STAR_MS, ABYSS_STAR_FLOOR, ABYSS_STAR_VARY, ABYSS_BREATH_BEND,
         ABYSS_FLOW_MS, ABYSS_FLOW_COL, ABYSS_FLOW_ROW, ABYSS_FLOW_SHEAR,
         ABYSS_FLOW_ASPECT, ABYSS_FLOW_DRIFT, ABYSS_SHEAR_ROW, ABYSS_SHEAR_TURN,
         ABYSS_SHEAR_AMT2, ABYSS_SHEAR_COL, ABYSS_SHEAR_AMT_Y,
         ABYSS_FLOW_COL2, ABYSS_FLOW_ROW2, ABYSS_FLOW_DRIFT2, ABYSS_FLOW_MIX,
         ABYSS_VEIL_AT, ABYSS_VEIL_EVERY, ABYSS_VEIL_JITTER, ABYSS_VEIL_LIT, ABYSS_VEIL_DEEP,
         ABYSS_FLOW_LIFT } from '../config.js';
import { ctx } from './ctx.js';
import { inkOf } from '../ink.js';

const seeth = (c, r) => Math.abs((c * 73856093) ^ (r * 19349663)) % 997;

// The field is worked out a cell at a time into an image one pixel a cell,
// and that image drawn once, scaled up with no smoothing: the same cells on
// the same grid, but one draw where a fillRect a lit cell was thousands a
// frame over a whole window of water -- the deep ran at a fraction of the
// yard's frame rate on a large screen. The tones go through the page's own
// palette (`inkOf`), as a fillStyle would.
let img = null, octx = null, buf = null;
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
function surface(cols, rows) {
  if (!img) { img = document.createElement('canvas'); octx = img.getContext('2d'); }
  if (img.width < cols || img.height < rows) {
    img.width = Math.max(img.width, cols); img.height = Math.max(img.height, rows);
    buf = null;
  }
  if (!buf || buf.width !== cols || buf.height !== rows) buf = octx.createImageData(cols, rows);
  buf.data.fill(0);
  return buf.data;
}

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
  const swell = 1 - ABYSS_FLOW_MIX + ABYSS_FLOW_MIX
              * (Math.sin(cx * ABYSS_FLOW_COL2 + ry * ABYSS_FLOW_ROW2
                          - a * ABYSS_FLOW_DRIFT2) + 1) / 2;
  const h = seeth(c, r);
  // the patch's own nature: 0..2 empty, 3..6 ordinary, 7+ nebula
  const patch = seeth(c >> 3, r >> 3) % 10;
  const keep = patch >= 7 ? 4 : 1;               // nebula patches keep four times the stars
  if (patch >= 3 && h % ABYSS_STAR_EVERY < keep) {
    // the breath, bent so a star spends most of its life dim, then lifted
    // or lowered by the current
    const swing = (Math.sin(t / ABYSS_STAR_MS * Math.PI * 2 * (0.6 + (h % 7) * 0.1) + h) + 1) / 2;
    const k = Math.pow(swing, ABYSS_BREATH_BEND)
            * (1 - ABYSS_FLOW_LIFT + ABYSS_FLOW_LIFT * (f + 1) / 2);
    const purple = h % 7 < magicShare;
    const len = purple ? magicLen : rampLen;
    // its ceiling: shallow stars never reach the bright end of their
    // family. At least two rungs, so even the dimmest star has a fade
    // rather than a switch.
    const allowed = ABYSS_STAR_FLOOR + Math.round(depth * (len - 1 - ABYSS_STAR_FLOOR));
    const ceiling = allowed - (h >> 3) % ABYSS_STAR_VARY;
    const rung = Math.min(len - 1, Math.round(k * ceiling));
    if (rung > 0) return purple ? -rung : rung;
  }
  const off = Math.abs(f), band = ABYSS_VEIL_AT * swell;
  if (off > band || h % ABYSS_VEIL_EVERY === 0) return 0;
  // how near the middle of the filament this cell sits; the deep carries
  // it a shade further up the ramp, and the hash nudges each cell so no
  // stretch is one flat tone
  const thick = (1 - off / band) * swell;
  const lit = thick * (ABYSS_VEIL_LIT + depth * ABYSS_VEIL_DEEP) + (h % 3 - 1) * ABYSS_VEIL_JITTER;
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
export function paintAbyssField({ from, to, top, bottom, line, rowShift = 0, deep = 0, tones, magic, t }) {
  const cols = Math.max(0, Math.round((to - from) / P)), rows = Math.max(0, Math.ceil((bottom - top) / P));
  if (!cols || !rows) return;
  const data = surface(cols, rows);
  const a = flow(t);
  const dragY = [];
  for (let x = from; x < to; x += P) dragY.push(dragCol(x / P, a));
  for (let y = top, j = 0; y < bottom; y += P, j++) {
    const py = y + rowShift;                     // where this row is in the pit's liquid
    const r = py / P, dragX = dragRow(r, a);
    const depth = Math.min(1, Math.max(0, (py - line) / (P * 32)) + deep);
    for (let x = from, i = 0; x < to; x += P, i++) {
      const rung = cellRung(x / P, r, dragX, dragY[i], depth, a, t, tones.length, magic.length, 1);
      if (!rung) continue;
      const [cr, cg, cb] = rgba(rung > 0 ? tones[rung] : magic[-rung]);
      const k = (j * cols + i) * 4;
      data[k] = cr; data[k + 1] = cg; data[k + 2] = cb; data[k + 3] = 255;
    }
  }
  octx.putImageData(buf, 0, 0);
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, cols, rows, from, top, cols * P, rows * P);
  ctx.imageSmoothingEnabled = smooth;
}
