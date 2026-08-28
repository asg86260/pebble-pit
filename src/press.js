// Three looks laid over the finished frame, in 2D, cheaply enough to ship.
//
// These used to be three dials on a WebGL post-process pass, along with seven
// others, and that pass is gone. It handed the whole picture to a WebGL context
// every frame while the picture lived in a Canvas2D context, so the browser had
// to pull a screen of pixels off the card and push it back up again with a hard
// synchronisation in the middle. Measured on a large window that was twenty
// milliseconds a frame -- thirty frames a second on a card that draws the yard
// itself in two, and it was on by default, so every frame rate anybody read off
// the dev panel was the filter's number rather than the game's.
//
// The shader was never the cost. A three-tap fullscreen fragment program is
// nothing; the trip between the two contexts was everything. So the answer is
// not a cheaper shader, it is not leaving the context: these three are the ones
// that can be said in 2D, and said here they are a handful of blits on the
// canvas the game is already drawing into.
//
// The other seven went with it. Curvature, bloom, bleed, halftone, plates and
// the phosphor mask all need to look at neighbouring pixels or bend the sampling
// grid, and 2D has no way to say that without reading the frame back itself,
// which is the thing this file exists to avoid. These three are the ones worth
// keeping and the ones that can be kept honestly.
//
// What each one is, and why it can be said here:
//
//   aberration  the three colours arrive at slightly different places, further
//               out from the middle. An offset proportional to the distance
//               from the centre is a *scale* about the centre -- so this is not
//               a per-pixel sample at all, it is the red channel drawn a hair
//               large and the blue a hair small, which drawImage does for free.
//   scanlines   every other row of device pixels is darker. A two-pixel pattern,
//               made once and filled over the frame.
//   vignette    the edge of a lit page falls away. One radial gradient, made
//               once per size, filled over the frame.
//
// Applied in that order, which is the order they were in when they were dials on
// the shader: the glass fringes what is on it before the tube's own lines cross
// it, and the light in the room falls off last of all because it is the room
// rather than anything on the sheet.

import { PRESS_MIX } from './config.js';

// The three, at the amounts the game ships at. There is no dial: a look you can
// move at runtime is a look nobody has decided on, and these were decided. The
// numbers live in config.js with every other number.
const amount = {
  aberration: PRESS_MIX.aberration || 0,
  scanlines: PRESS_MIX.scanlines || 0,
  vignette: PRESS_MIX.vignette || 0
};

const anyOn = () => amount.aberration > 0 || amount.scanlines > 0 || amount.vignette > 0;

// The scratch canvases the fringe needs, kept rather than made: two of them, and
// only ever allocated if somebody actually turns the fringe on.
const scratch = [];
function buf(i, w, h) {
  let c = scratch[i];
  if (!c) c = scratch[i] = document.createElement('canvas');
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
}

// One colour channel of the frame, on its own, moved by `d` device pixels across
// the whole width. `multiply` by a pure primary keeps that channel and zeroes the
// other two, which is what a channel is.
//
// A positive `d` draws the frame into a slightly smaller rectangle, which is the
// channel sampled outward from the middle; a negative one draws it into a
// slightly larger rectangle and is sampled inward. The frame goes down flat
// first whenever it is being shrunk, so the ring of border the smaller
// rectangle does not reach keeps its own colour rather than losing it. That
// ring is the whole reason for the extra blit: without it the red channel is
// missing all the way round the window and the frame wears a cyan rim.
function channel(i, src, w, h, tone, d) {
  const c = buf(i, w, h);
  const cx = c.getContext('2d');
  cx.globalCompositeOperation = 'copy';        // replace, rather than pile up frames
  cx.drawImage(src, 0, 0);                     // and this is the edge, clamped
  if (d > 0) {
    cx.globalCompositeOperation = 'source-over';
    cx.drawImage(src, 0, 0, w, h, d / 2, d / 2, w - d, h - d);
  } else if (d < 0) {
    cx.globalCompositeOperation = 'copy';
    cx.drawImage(src, 0, 0, w, h, d / 2, d / 2, w - d, h - d);
  }
  cx.globalCompositeOperation = 'multiply';
  cx.fillStyle = tone;
  cx.fillRect(0, 0, w, h);
  return c;
}

// The fringe. The shader sampled red at `uv + (uv - 0.5) * k` and blue at
// `uv - (uv - 0.5) * k`; an offset that grows with the distance from the middle
// is a scale about the middle, so the same thing here is the red channel drawn
// from a source rectangle a little larger than the frame and the blue from one a
// little smaller. The spread is in device pixels and does not grow with the
// window -- a fringe is a fixed width of fringe, not a fraction of the glass.
function aberration(src, ctx, w, h, cell, a) {
  const sp = a * 2.4 * cell;                   // the whole spread, corner to corner
  if (sp < 0.25) return;                       // under a quarter pixel is not a fringe

  const red = channel(0, src, w, h, '#f00', sp);     // sampled outward
  const blue = channel(1, src, w, h, '#00f', -sp);   // and inward

  // Green stays exactly where it is: it is the channel the eye reads detail in,
  // and moving all three would be a blur rather than a fringe.
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#0f0';
  ctx.fillRect(0, 0, w, h);

  // and the other two go back on either side of it, square on: the moving was
  // done when each channel was lifted off, so these are straight blits.
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(red, 0, 0);
  ctx.drawImage(blue, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

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
//
// `cell` is device pixels per cell, the unit this game is built in: the fringe
// is measured in it so that the look holds together at any zoom, exactly as it
// did when this was a uniform on the shader.
export function press(src, ctx, cell) {
  if (!anyOn()) return;
  const w = src.width, h = src.height;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);          // device pixels: these are all screen effects
  ctx.globalAlpha = 1;
  if (amount.aberration > 0) aberration(src, ctx, w, h, cell, amount.aberration);
  if (amount.scanlines > 0) scanlines(ctx, w, h, amount.scanlines);
  if (amount.vignette > 0) vignette(ctx, w, h, amount.vignette);
  ctx.restore();
}
