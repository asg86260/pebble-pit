// Effects you can look at on their own: every draw here takes a context, a
// place and a few numbers, and reads nothing off `S`, so preview.html can draw
// them side by side on a blank page with no simulation behind them. The import
// list is the other half of it: config, and nothing else. The moment one of
// these reaches for the yard, the preview has to build a yard.
import { P, DOSE_MOTE_HUE, CRIT_RING_WIDE } from '../config.js';

// A tonic's color as HSL, so a mote can be shifted round the wheel from it.
// A table rather than converted every frame: three tonics, a great many motes.
const HSL = {};
function hsl(hex) {
  if (HSL[hex]) return HSL[hex];
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const hi = Math.max(r, g, b), lo = Math.min(r, g, b), d = hi - lo;
  const l = (hi + lo) / 2;
  let h = 0, sat = 0;
  if (d) {
    sat = d / (1 - Math.abs(2 * l - 1));
    h = hi === r ? ((g - b) / d + (g < b ? 6 : 0))
      : hi === g ? (b - r) / d + 2
      : (r - g) / d + 4;
    h *= 60;
  }
  return (HSL[hex] = { h, s: sat * 100, l: l * 100 });
}

// One mote of a rising plume: a cell that pales as it ages. `k` is how far
// through its life it is (0 just let go, 1 gone) and `v` the mote's own
// variation, fixed when it was let go: a mote that changes hue while you
// watch it is a mote that is blinking. A few degrees of hue on `v` keeps a
// plume from reading as a decal. Paling is lightness, no alpha: a color at
// low alpha over a dark body is mud, and this has to stay legible as *which
// tonic*.
export function drawDoseMote(g, x, y, color, k, v = 0.5) {
  const c = hsl(color);
  const h = c.h + (v - 0.5) * DOSE_MOTE_HUE;
  const l = c.l + (100 - c.l) * Math.min(1, k * 0.95);
  const size = Math.max(1, Math.round(P * (1.05 - k * 0.35)));
  g.fillStyle = `hsl(${h.toFixed(1)} ${c.s.toFixed(1)}% ${l.toFixed(1)}%)`;
  g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
  g.fillStyle = '#000';
}

// --- a crit landing -----------------------------------------------------------
// One ring, going out. `k` is how far through its run it is (0 the instant the
// blow landed, 1 gone) and `r` how far out it has got, in world pixels.
//
// An **outline** of cells, the one drawing in the yard that is a line: a
// shockwave is not a thing, it is the air after a thing. Not a clean circle
// either, since a full outline reads as an announcement: each spoke gets a
// hashed roll that drops about a third of the cells and shoves the rest a
// little in or out, reseeded a couple of dozen times over the ring's life so
// the gaps crackle. Black unless told otherwise; the dome's ring is purple.
export function drawShockRing(g, x, y, r, k, color = '#000') {
  // One cell per cell of arc, never the same cell twice (a cell painted twice
  // at half alpha is a cell at full alpha), and an EVEN number of spokes so
  // every cell has an exact opposite and the ring is symmetric.
  const spokes = Math.max(8, Math.round((Math.PI * 2 * r) / P));
  const n = spokes + (spokes % 2);
  const seen = new Set();
  // Fading straight rather than off a square: a ring squared is nearly gone by
  // the time it is wide enough to read.
  g.globalAlpha = 1 - k;
  g.fillStyle = color;
  // A leaf module has no rng, so the roll is a sine hash of the spoke and
  // this tick.
  const tick = Math.floor(k * 24);
  for (let j = 0; j < n; j++) {
    const h = Math.sin(j * 127.1 + tick * 311.7) * 43758.5453;
    const f = h - Math.floor(h);
    if (f < 0.35) continue;
    const rj = r + (f - 0.675) * P * 2;
    const a = (j / n) * Math.PI * 2;
    // Rounded away from nought rather than half-up, or a cell wanted at plus a
    // half lands on 1 and its mirror at minus a half on 0, and the ring leans.
    const cx = x + Math.sign(Math.cos(a)) * Math.round(Math.abs(Math.cos(a) * rj / P)) * P;
    const cy = y + Math.sign(Math.sin(a)) * Math.round(Math.abs(Math.sin(a) * rj / P)) * P;
    const key = `${cx},${cy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // `cx, cy` is the cell's MIDDLE; `fillRect` wants its top-left.
    g.fillRect(cx - CRIT_RING_WIDE / 2, cy - CRIT_RING_WIDE / 2, CRIT_RING_WIDE, CRIT_RING_WIDE);
  }
  g.globalAlpha = 1;
}

// One speck of the burst: a whole cell at full ink for most of its life, half
// a cell for the last part, gone. Two sizes and no alpha, and smaller than a
// grain of dust at every moment, so nothing about it reads as bankable.
export function drawShockMote(g, x, y, k, color = '#000') {
  const size = k < 0.6 ? P : Math.max(1, P / 2);
  g.fillStyle = color;
  g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
}
