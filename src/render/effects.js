// Effects you can look at on their own.
//
// Everything in here is a pure draw: it takes a context, a place, and the few
// numbers that describe it, and it reads nothing off `S`. That is the whole
// point of the file. An effect written inline inside `drawWorkers` can only be
// seen by making the entire game produce one -- to look at the tonic burning off
// a body you had to open a yard, hire a crew, build the apothecary, set a pot,
// wait for a batch and hope the body it dealt to walked into shot -- and an
// effect you tune by guesswork is an effect that stays wrong.
//
// These are drawn side by side on a blank page by preview.html, at whatever
// stage of whatever parameter you want to see, with no simulation behind them.
//
// The import list is the other half of it: config, and nothing else. A leaf
// module is what makes the preview cheap; the moment one of these reaches for
// the yard, the preview has to build a yard.
import { P, DOSE_MOTE_HUE, CRIT_RING_WIDE } from '../config.js';

// A tonic's colour as hue, saturation and lightness, so that a mote can be
// shifted round the wheel from it. Kept as a table rather than converted every
// frame: there are three tonics and a great many motes.
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
// through its life it is (0 just let go, 1 gone) and `v` is the mote's own
// variation, 0..1, fixed when it was let go.
//
// The hue is shifted off the tonic's by a few degrees each way, on `v`. A plume
// of one exact colour reads as a decal -- every cell the identical swatch, which
// nothing burning ever is -- and a few degrees is enough to make it a colour
// rather than a value, while staying plainly the tonic it came out of. Fixed at
// birth, not rolled per frame: a mote that changes hue while you watch it is a
// mote that is blinking.
//
// Paling is lightness rather than a mix toward white, now that the colour is in
// HSL anyway: it is the same journey to the page, said in the space the hue
// already lives in. No alpha -- a colour at low alpha over a dark body is a
// muddy colour, and this has to stay legible as *which tonic*.
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
// blow landed, 1 gone) and `r` is how far out it has got, in world pixels.
//
// An **outline** of cells, which nothing else in this yard is drawn as, and that
// is deliberate: everything else here is a filled shape because everything else
// here is a thing. A shockwave is not a thing -- it is the air after a thing --
// so it is the one drawing that is a line, and it cannot be mistaken for a grain
// of anything. It thins as it widens, the way anything spreading does.
//
// Not a *clean* circle, though, and that is deliberate too: a full outline read
// as a drawn shape -- an announcement -- where a blow's edge is ragged. So each
// spoke gets a hashed roll that drops about a third of the cells and shoves the
// rest a little in or out, and the roll is reseeded a couple of dozen times over
// the ring's life so the gaps crackle rather than sit still.
//
// Black, unless told otherwise: the one ring that is not is the dome's, and
// the dome is purple because magic is.
export function drawShockRing(g, x, y, r, k, color = '#000') {
  // One cell per cell of arc, and never the same cell twice: a ring drawn at an
  // even angle doubles up on the diagonals, and a cell painted twice at half
  // alpha is a cell at full alpha. An EVEN number of spokes, always, so every
  // cell has an exact opposite and the ring is symmetric about its middle -- the
  // core glow leaned for years on exactly this.
  const spokes = Math.max(8, Math.round((Math.PI * 2 * r) / P));
  const n = spokes + (spokes % 2);
  const seen = new Set();
  // Fading straight rather than off a square: a ring squared is nearly gone by
  // the time it is wide enough to read, which drew a grey smudge round the body
  // instead of a wave leaving it.
  g.globalAlpha = 1 - k;
  g.fillStyle = color;
  // The reseed clock for the crackle: a leaf module has no rng, so the "roll"
  // is a sine hash of the spoke and this tick.
  const tick = Math.floor(k * 24);
  for (let j = 0; j < n; j++) {
    const h = Math.sin(j * 127.1 + tick * 311.7) * 43758.5453;
    const f = h - Math.floor(h);
    if (f < 0.35) continue;
    const rj = r + (f - 0.675) * P * 2;
    const a = (j / n) * Math.PI * 2;
    // Rounded away from nought rather than always upwards: `Math.round` goes
    // half-up, so a cell wanted at plus a half lands on 1 and its mirror at
    // minus a half lands on 0, and the ring leans.
    const cx = x + Math.sign(Math.cos(a)) * Math.round(Math.abs(Math.cos(a) * rj / P)) * P;
    const cy = y + Math.sign(Math.sin(a)) * Math.round(Math.abs(Math.sin(a) * rj / P)) * P;
    const key = `${cx},${cy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // `cx, cy` is where the cell's MIDDLE goes; `fillRect` wants its top-left.
    g.fillRect(cx - CRIT_RING_WIDE / 2, cy - CRIT_RING_WIDE / 2, CRIT_RING_WIDE, CRIT_RING_WIDE);
  }
  g.globalAlpha = 1;
}

// And one speck of the burst: a cell that fades as it goes. Smaller than a grain
// of dust at every moment of its life, so nothing about it reads as something
// that could have been banked.
// A whole cell at full ink for most of its life, half a cell for the last
// part, gone: two sizes and no alpha, the way everything else here fades
// (critics 2026-09-10, C12).
export function drawShockMote(g, x, y, k, color = '#000') {
  const size = k < 0.6 ? P : Math.max(1, P / 2);
  g.fillStyle = color;
  g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
}
