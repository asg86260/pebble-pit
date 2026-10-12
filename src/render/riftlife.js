// What is crossing behind the torn rift (riftlife.js), as cells: the deep's
// creatures in a shoal of silhouettes or one in its own tones, a length of
// the serpent's coil, his crest, or his eye at the window. drawRift
// (render/cores.js) lays each depth between the star skies it belongs among,
// inside the tear's clip, so a far thing has the nearer stars over it.
//
// Every crossing is the same size and pace whatever the disc measures, so the
// just-torn rift is a keyhole and the grown one a window. No lens bend: a
// sprite bent toward the rim breaks into gaps at the small size.

import { S } from '../state.js';
import { P, ABYSS_TONES, ABYSS_MAGIC_TONES, RIFT_DEEP_LAYERS, RIFT_DEEP_NEAR, RIFT_DEEP_FAR,
         RIFTLIFE_SCALE, RIFTLIFE_DIM, RIFTLIFE_SILHOUETTE, RIFTLIFE_COIL, RIFTLIFE_COIL_WAVE,
         RIFTLIFE_COIL_WAVE_SPEED, RIFTLIFE_COIL_WAVE_STEP, RIFTLIFE_COIL_TAPER_HEAD, RIFTLIFE_COIL_TAPER_TAIL,
         RIFTLIFE_EYE } from '../config.js';
import { GREYS, PURPLES } from './deeptones.js';
import { drawKind, bobOf } from './fish.js';
import { lead, lifeLen, heldS } from '../riftlife.js';
import { ctx } from './ctx.js';

// The creatures are drawn in the deep's tones as they are put down for its
// negative; behind the tear they are seen as they are, so each is read back
// to its rung on the ramp it came from.
const RUNG = new Map();
ABYSS_TONES.forEach((c, i) => RUNG.set(GREYS[i], [ABYSS_TONES, i]));
ABYSS_MAGIC_TONES.forEach((c, i) => { if (i) RUNG.set(PURPLES[i], [ABYSS_MAGIC_TONES, i]); });
// A thing further off is painted lower down its own ramp: there is no alpha.
// Never to black, which is the window itself.
const dimmed = (drawn, n) => {
  const r = RUNG.get(drawn);
  if (!r) return drawn;
  return r[1] ? r[0][Math.max(1, r[1] - n)] : r[0][0];
};
const BLACK = ABYSS_TONES[0];
const grey = k => ABYSS_TONES[k];
const purple = k => ABYSS_MAGIC_TONES[k];
const lum = h => { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };

// Cells by depth (0 far .. 2 near), each `col,row` once; a sprite folded onto
// fewer cells than it has units keeps the brightest unit a cell, so a lamp or
// an eye survives the shrinking. `blot` puts out the stars where something
// stands right up against the window.
const blank = () => ({ cells: [new Map(), new Map(), new Map()], blot: null });
function put(f, d, col, row, tone, brightest = true) {
  const k = col + ',' + row, was = f.cells[d].get(k);
  if (!was || !brightest || lum(tone) > lum(was.tone)) f.cells[d].set(k, { col, row, tone });
}

// The sky a depth sits among, nearest first as drawThrough counts them, and
// its share of the camera's pan: a crossing slides with its own stars from
// where the camera stood when it came in, in whole cells.
const layerOf = d => Math.round((1 - d / 2) * (RIFT_DEEP_LAYERS - 1));
const paceOf = d => {
  const L = layerOf(d), f = RIFT_DEEP_LAYERS === 1 ? 0 : L / (RIFT_DEEP_LAYERS - 1);
  return RIFT_DEEP_NEAR + (RIFT_DEEP_FAR - RIFT_DEEP_NEAR) * f;
};
const slide = (e, d) => ({ x: -Math.round((S.camX - e.camX) * paceOf(d) / P),
                           y: -Math.round((S.camY - e.camY) * paceOf(d) / P) });

// --- the creatures (1a, 1b) ---------------------------------------------------------
function drawCrossing(f, w, e, lt) {
  const head = lead(e, lt), tA = heldS(lt), s = RIFTLIFE_SCALE[e.d], o = slide(e, e.d);
  const ink = e.shoal ? () => purple(RIFTLIFE_SILHOUETTE[e.d]) : c => dimmed(c, RIFTLIFE_DIM[e.d]);
  for (const [kind, back, dy] of e.members) {
    const ta = tA + back, front = head - e.dir * back;
    const y = e.y * e.R + dy + Math.round(bobOf(kind, ta) * s);
    drawKind(kind, (x, yy, tone) => {
      put(f, e.d, Math.floor(w.cx + front - e.dir * x * s) + o.x,
          Math.floor(w.cy + y + yy * s) + o.y, ink(tone));
    }, ta);
  }
}

// --- the serpent passing (2a, 2b) ---------------------------------------------------
// The coil as the deep draws it, seen: hide, a darker spine and belly, the
// edge a few rungs down, a scale every third cell, the crest's spikes down
// his back. The far one is the same hide lower down the ramp.
function drawCoil(f, w, e, lt) {
  const c = RIFTLIFE_COIL[e.kind], dir = e.dir, o = slide(e, c.d);
  const tw = heldS(lt, RIFTLIFE_COIL_WAVE_STEP);
  const head = -dir * (e.R + c.enter) + dir * Math.floor(lt * c.v);
  const y0 = c.chord != null ? e.R - c.chord + c.r : e.y * c.lane * e.R;
  const line = a => y0 + c.amp * Math.sin(a / RIFTLIFE_COIL_WAVE - tw * RIFTLIFE_COIL_WAVE_SPEED);
  const H = RIFTLIFE_COIL_TAPER_HEAD, T = RIFTLIFE_COIL_TAPER_TAIL;
  const radius = a => a < 0 ? c.r * (1 - 0.6 * Math.min(1, -a / H))
                    : a > c.len - T ? c.r * Math.max(0.3, (c.len - a) / T) : c.r;
  const R = w.R + 1, cx = w.cx + o.x, cy = w.cy + o.y;
  for (let col = Math.floor(w.cx - R); col <= Math.ceil(w.cx + R); col++) {
    const a = dir * (head - (col + 0.5 - cx));
    if (a < -H || a > c.len) continue;
    const r = radius(a), mid = line(a);
    for (let row = Math.floor(w.cy - R); row <= Math.ceil(w.cy + R); row++) {
      const across = row + 0.5 - cy - mid;
      if (Math.abs(across) > r) continue;
      let tone = Math.abs(across) > r - 1 ? grey(c.edge)
               : Math.abs(across) < 0.5 ? grey(c.spine)
               : across > 0.9 ? grey(c.belly)
               : ((Math.floor(a) + Math.floor(across + 10)) % 3 === 0 ? grey(c.lattice) : grey(c.hide));
      if (a < 1 && Math.abs(across) < 0.5) tone = BLACK;                              // the mouth's line
      if (a >= 1.5 && a < 2.5 && across > -r + 0.6 && across < -r + 1.6) tone = BLACK;  // the eye
      put(f, c.d, col, row, tone, false);
    }
  }
  // The crest: down the back from the head, tallest every fourth cell and
  // tapering, a spike every other cell so the black shows between them.
  for (let a = 1; a <= c.crest; a += 2) {
    const col = Math.floor(cx + head - dir * a), top = line(a) - radius(a);
    const tall = Math.max(1, Math.round((a % 4 === 1 ? c.crestH : c.crestH - 1) * Math.min(1, (1 - a / c.crest) * 1.6)));
    for (let k = 1; k <= tall; k++)
      put(f, c.d, col, Math.floor(cy + top - k + 0.5),
          k === tall && tall === c.crestH ? (c.tipGrey ? grey(c.tip) : purple(c.tip)) : purple(c.crestTones[k % 2]), false);
  }
}

// --- the eye at the window (2c) -------------------------------------------------------
// Right up against the other side, so it is near and keeps no parallax: it is
// at the window, not in the sky.
function drawEye(f, w, e, lt) {
  const E = RIFTLIFE_EYE;
  const [ex, ey] = e.R > E.big ? E.off : [0, 0];
  const rp = lt < E.outFor ? Math.min(E.reach, Math.floor(lt / E.outStep))
           : lt < E.backAt ? E.reach : Math.max(0, E.reach - Math.floor((lt - E.backAt) / E.backStep));
  if (rp <= 0) return;
  const textured = lt >= E.outFor && lt < E.hideTill;
  const step = E.open.find(([until]) => lt < until);
  const open = step ? step[1] : -1;
  const look = E.looks.find(([a, b]) => lt >= a && lt < b);
  const px = look ? look[2] : 0;
  const hh = E.halfH[Math.max(0, open)];
  f.blot = (col, row) => Math.hypot(col + 0.5 - w.cx - ex, row + 0.5 - w.cy - ey) <= rp;
  const R = w.R + 1;
  for (let col = Math.floor(w.cx - R); col <= Math.ceil(w.cx + R); col++)
    for (let row = Math.floor(w.cy - R); row <= Math.ceil(w.cy + R); row++) {
      const dx = col + 0.5 - w.cx - ex, dy = row + 0.5 - w.cy - ey, dist = Math.hypot(dx, dy);
      if (dist > rp) continue;
      let tone = !textured ? grey(E.dark) : dist > rp - 1 ? grey(E.rim) : grey(E.hide[(col + row * 2) % 3 === 0 ? 1 : 0]);
      if (open === 0 && Math.abs(dx) <= E.lidW && Math.abs(dy) < 0.5) tone = grey(E.lid);   // the lid, shut
      if (open > 0) {
        const el = (dx / E.halfW) ** 2 + (dy / hh) ** 2;
        if (el <= 1) {
          const ix = dx - px;
          tone = Math.abs(ix) < 0.5 && Math.abs(dy) < E.slit ? BLACK
               : ix * ix + dy * dy <= E.iris ? purple(E.irisTones[ix < 0 && dy < 0 ? 1 : 0])
               : el > 0.7 ? grey(E.whiteEdge) : grey(E.white);
        } else if (dy < 0 && (dx / E.brow) ** 2 + (dy / (hh + 1)) ** 2 <= 1) tone = grey(E.lid);   // the brow over it
      }
      put(f, 2, col, row, tone, false);
    }
}

const SHAPES = { cross: drawCrossing, coil: drawCoil, crest: drawCoil, eye: drawEye };

// What is behind the tear at the clock `t`, for a disc of radius `rad` round
// (`cx`, `cy`) in world pixels, or null.
export function riftLifeFrame(t, cx, cy, rad) {
  const e = S.riftLife;
  if (!e) return null;
  const lt = heldS((t - e.at) / 1000);
  if (lt < 0 || lt >= lifeLen(e)) return null;
  const f = blank();
  SHAPES[e.kind](f, { cx: cx / P, cy: cy / P, R: rad / P }, e, lt);
  return f;
}

// The depth that sits just in front of sky `L` (0 the nearest), painted.
export function drawRiftLife(f, L) {
  if (!f) return;
  for (let d = 0; d < 3; d++) {
    if (layerOf(d) !== L) continue;
    for (const { col, row, tone } of f.cells[d].values()) {
      ctx.fillStyle = tone;
      ctx.fillRect(col * P, row * P, P, P);
    }
  }
}
