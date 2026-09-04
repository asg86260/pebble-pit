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
import { P, DOSE_MOTE_HUE } from '../config.js';

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
