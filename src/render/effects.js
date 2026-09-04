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
import { P, DOSE_MOTE_HUE, CRIT_RING_WIDE, DOSE_HAZE_MOTES, DOSE_HAZE_MS,
         DOSE_HAZE_RISE, DOSE_HAZE_SPREAD } from '../config.js';

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

// --- the tonic on a body ------------------------------------------------------
// The haze a dosed body gives off: a short plume of its tonic's motes, rising
// off the head and winking out, thinning as the dose wears off.
//
// **It is anchored to the body's box and to nothing else.** Not to the facing,
// not to the stride, not to how fast the body is going. That is the whole point
// of this drawing, and the bug it replaces: the plume used to be let go into the
// yard as world-space motes, which stayed where they were dropped -- so a body
// standing still wore a neat column and a body walking left trailed a comet's
// tail out to its right, longer the faster it went. Same buff, four different
// pictures depending on which way somebody happened to be walking. A mark that
// says "this body is under a tonic" has to look the same wherever the body is
// and whatever it is doing, or it is not a mark, it is weather.
//
// Every mote's place is derived from the clock and its own slot -- there is no
// list, nothing is stepped and nothing is saved, because there is nothing about
// one of these anybody could act on. `x`, `y` is the middle of the head; `k0`
// spaces one tonic's column against another's, so a body under two of them gives
// off both at once, side by side and each its own colour, rather than a blend
// that is neither.
export function drawDoseHaze(g, x, y, color, frac, k0 = 0, t = 0) {
  // Thinner as it wears off: a fresh dose fizzes, a nearly-spent one gives off a
  // wisp. Never nought while the dose is live -- the mark has to be there right
  // up until the moment it is not.
  const n = Math.max(1, Math.round(DOSE_HAZE_MOTES * (0.35 + frac * 0.65)));
  for (let i = 0; i < n; i++) {
    const k = ((t / DOSE_HAZE_MS) + (i + k0) / n) % 1;
    // Out and up, leaning a little to one side and back: a plume comes apart as
    // it climbs, and a column of cells straight up is a chimney.
    const off = Math.sin(k * Math.PI * 2 + i * 1.7 + k0 * 4) * DOSE_HAZE_SPREAD * P;
    drawDoseMote(g, x + off, y - P - k * DOSE_HAZE_RISE * P, color, k,
                 (i + k0) % 1 || (i % 5) / 5);
  }
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
export function drawShockRing(g, x, y, r, k) {
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
  g.fillStyle = '#000';
  for (let j = 0; j < n; j++) {
    const a = (j / n) * Math.PI * 2;
    // Rounded away from nought rather than always upwards: `Math.round` goes
    // half-up, so a cell wanted at plus a half lands on 1 and its mirror at
    // minus a half lands on 0, and the ring leans.
    const cx = x + Math.sign(Math.cos(a)) * Math.round(Math.abs(Math.cos(a) * r / P)) * P;
    const cy = y + Math.sign(Math.sin(a)) * Math.round(Math.abs(Math.sin(a) * r / P)) * P;
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
export function drawShockMote(g, x, y, k) {
  const size = Math.max(1, Math.round(P * (0.8 - k * 0.4)));
  g.globalAlpha = 1 - k * k;
  g.fillStyle = '#000';
  g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
  g.globalAlpha = 1;
}
