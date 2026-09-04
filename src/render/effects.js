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
// The import list is the other half of it: config and the noise, and nothing
// else. A leaf module is what makes the preview cheap; the moment one of these
// reaches for the yard, the preview has to build a yard.
import { P } from '../config.js';
import { vnoise } from './flicker.js';

// The tonic burning off a dosed body, in the tonic's own colour: the same fire
// the cauldron keeps, at a body's scale. Columns across the body, each rising to
// its own noise-driven height and flickering where it stands -- never swaying,
// because a mote that slides sideways reads as a fly and a flame does not
// travel. Same rule about large per-column offsets as the fire under the pot.
//
// It burns UPWARD off the head rather than up through the body: drawn from the
// feet it filled the three cells the body is and painted the worker out.
//
// `x`,`y` are the body's top-left; `frac` is how much of the dose is left (see
// `doseFrac`), and the flame is shorter the less there is.
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

export function drawDoseFlame(g, x, y, color, frac, t) {
  const cols = 3;                                    // the body is three cells wide
  const mid = (cols - 1) / 2;
  for (let c = 0; c < cols; c++) {
    // Hard centre hump: the middle column runs two or three cells taller than
    // its neighbours, which is what makes the shape come to a point instead of
    // standing up as a block. Three cells is a narrow bed for a fire, so the
    // difference between them has to carry most of the shape.
    const hump = (1 - Math.abs(c - mid) / (mid + 0.25)) * 2.2;
    const n = vnoise(c * 17.3 + t / 130) * 2.4       // this column's own flicker
            + vnoise(c * 11.9 + 40 + t / 260) * 1.2; // and a slower second stream
    const h = Math.max(0, Math.round((hump + n) * (0.35 + frac * 0.75)));
    const fx = x + c * P;
    // Solid tongues, and the flicker is the *height* -- exactly the fire under
    // the cauldron. Winking individual cells out on the way up was tried first
    // and it reads as static rather than as flame: what makes a pixel fire read
    // is a jagged top edge moving, not holes in the middle of it.
    for (let hy = 0; hy < h; hy++) {
      const up = hy / Math.max(1, h - 1);           // 0 at the root, 1 at the tip
      // Palest where it is hottest, at the root, deepening to the tonic's own
      // colour at the tip -- the same direction the cauldron's fire runs, and
      // the reason a one-colour flame read as a paper cut-out.
      g.fillStyle = lift(color, 0.55 * (1 - up) * (1 - up));
      // And the very tip of a tall tongue licks sideways. Only the topmost cell,
      // and only when there is a tongue under it to lean off: shifted any lower
      // the cell tore away from its own column and read as a speck floating
      // beside the flame rather than as a flame leaning. A cell either side or
      // not at all, on its own noise, so neighbouring tips lean independently --
      // shifting whole columns together would be the travelling-wave mistake.
      const lick = hy === h - 1 && h >= 3 && vnoise(c * 23.1 + t / 95) > 0.55
        ? (vnoise(c * 7.7 + t / 150) > 0.5 ? 1 : -1) : 0;
      g.fillRect(fx + lick * P, y - P - hy * P, P, P);
    }
  }
  g.fillStyle = '#000';
}
