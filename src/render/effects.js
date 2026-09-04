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
import { P } from '../config.js';

// A tonic's colour, lifted toward white by `k`. The fire under the cauldron runs
// three hand-picked colours from hot yellow to a red tip; a tonic cannot, because
// its colour is the thing that says *which tonic*, and three hand-picked shades
// per tonic would be nine constants to keep in step with a menu that grows. So
// the one colour it already has is lifted, and the ramp comes out of it.
const lift = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, gg = (n >> 8) & 255, b = n & 255;
  const up = v => Math.round(v + (255 - v) * k);
  return `rgb(${up(r)},${up(gg)},${up(b)})`;
};

// One mote of a rising plume: a cell that swells and pales as it ages. `k` is
// how far through its life it is, 0 just let go and 1 gone.
//
// Colour and age are the whole of it. A mote is palest when it is oldest --
// lifted toward white, which on this page is the same as dissolving into it --
// so a plume fades out at the top instead of stopping. That is also why nothing
// here uses alpha for the colour: white paper and a lifted colour do the same
// job, and a lifted colour still prints as one flat cell rather than as a wash.
export function drawDoseMote(g, x, y, color, k) {
  const size = Math.max(1, Math.round(P * (1.05 - k * 0.35)));
  g.fillStyle = lift(color, Math.min(0.85, k * 0.9));
  g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
  g.fillStyle = '#000';
}
