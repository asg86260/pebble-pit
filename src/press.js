// Two looks laid over the finished frame, in 2D, cheaply enough to ship.
//
// These used to be dials on a WebGL post-process pass, along with eight others,
// and that pass is gone. It handed the whole picture to a WebGL context every
// frame while the picture lived in a Canvas2D context, so the browser had to
// pull a screen of pixels off the card and push it back up again with a hard
// synchronisation in the middle. On a large window that was twenty milliseconds
// a frame -- thirty frames a second on a card that draws the yard itself in two
// -- and it was on by default, so every frame rate anybody ever read off the dev
// panel was the filter's number rather than the game's.
//
// The shader was never the cost. A fullscreen fragment program is nothing; the
// trip between the two contexts was everything. So the answer was not a cheaper
// shader, it was not leaving the context:
//
//   scanlines   every other row of device pixels is darker. A two-pixel pattern,
//               made once and filled over the frame.
//   vignette    the edge of a lit page falls away. One radial gradient, made
//               once per size, filled over the frame.
//
// Together they cost about three tenths of a millisecond on a window of three
// and a half million pixels, which is the whole point of doing them this way.
// The vignette goes on last because it is the light in the room rather than
// anything on the sheet.
//
// --- on the fringe that is not here -----------------------------------------
// Chromatic aberration was built here too and then taken out again, which is
// worth writing down so nobody builds it twice.
//
// It can be done in 2D, and elegantly: an offset proportional to the distance
// from the centre *is* a scale about the centre, so the fringe is the red
// channel drawn a hair small and the blue a hair large, which drawImage does for
// free. What it is not is cheap. Lifting a single colour channel off a 2D canvas
// means copying the whole frame and multiplying it by a primary, twice, and then
// compositing both back -- eight fullscreen operations and two more canvases the
// size of the window. Measured against the same scene as the numbers above it
// cost three milliseconds a frame on its own, ten times the two that are left,
// and it took a hundred and six frames a second down from a hundred and
// fifty-four.
//
// It also has to fight the game. This is black shapes on white paper, and the
// whole pixel discipline here exists to stop edges going grey or fringed, while
// colour is reserved for what the sites give up. Three milliseconds is a lot to
// pay for an effect the rest of the drawing is arranged to prevent.

import { PRESS_MIX } from './config.js';

// The three, at the amounts the game ships at. There is no dial: a look you can
// move at runtime is a look nobody has decided on, and these were decided. The
// numbers live in config.js with every other number.
const amount = {
  scanlines: PRESS_MIX.scanlines || 0,
  vignette: PRESS_MIX.vignette || 0
};

const anyOn = () => amount.scanlines > 0 || amount.vignette > 0;

// Every other row of the tube is darker. Black at an alpha over the top is the
// same arithmetic the shader did -- `col * (1 - k)` -- because the ink under it
// is being multiplied by what is left of the light.
let stripe = null, stripeInk = -1;
function scanlines(ctx, w, h, a) {
  const ink = a * 0.28;
  if (stripeInk !== ink) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 2;
    const cx = c.getContext('2d');
    cx.fillStyle = `rgba(0,0,0,${ink})`;
    cx.fillRect(0, 1, 1, 1);                   // the odd row, as the shader had it
    stripe = ctx.createPattern(c, 'repeat');
    stripeInk = ink;
  }
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, w, h);
}

// The edge of a lit page falls away. The shader measured the distance from the
// middle in units of the frame's *height* on both axes, which makes the falloff
// a circle in real pixels rather than an ellipse stretched to the window -- so
// this is one radial gradient, and the corners of a wide window sit outside its
// last stop and take the full amount.
let vig = null, vigKey = '';
function vignette(ctx, w, h, a) {
  const key = `${w}x${h}x${a}`;
  if (vigKey !== key) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0.35 * h, w / 2, h / 2, 0.95 * h);
    // smoothstep, in eight stops: a straight ramp has a visible corner where it
    // leaves the clear middle, and the corner is the one thing a vignette must
    // not have.
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      g.addColorStop(t, `rgba(0,0,0,${a * 0.5 * t * t * (3 - 2 * t)})`);
    }
    vig = g;
    vigKey = key;
  }
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// One pass over the finished frame, on the frame's own canvas.
export function press(src, ctx) {
  if (!anyOn()) return;
  const w = src.width, h = src.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);          // device pixels: these are all screen effects
  ctx.globalAlpha = 1;
  if (amount.scanlines > 0) scanlines(ctx, w, h, amount.scanlines);
  if (amount.vignette > 0) vignette(ctx, w, h, amount.vignette);
  ctx.restore();
}
