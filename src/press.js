// Two looks laid over the finished frame, in 2D, without leaving the context.
//
//   scanlines   every other row of device pixels is darker. A two-pixel pattern,
//               made once and filled over the frame.
//   vignette    the edge of a lit page falls away. One radial gradient, made
//               once per size, filled over the frame.
//
// Never a WebGL pass: handing a Canvas2D picture to a second context costs a
// hard sync and a screen of pixels each way, which is twenty milliseconds a
// frame on a large window. The vignette goes on last because it is the light
// in the room rather than anything on the sheet.
//
// Chromatic aberration is deliberately not here: lifting one color channel off
// a 2D canvas is eight fullscreen operations and two more window-sized
// canvases, three milliseconds a frame, ten times the two looks that are left,
// for a fringe the whole pixel discipline exists to prevent.

import { PRESS_MIX } from './config.js';

// No dial: a look you can move at runtime is a look nobody has decided on.
const amount = {
  scanlines: PRESS_MIX.scanlines || 0,
  vignette: PRESS_MIX.vignette || 0
};

const anyOn = () => amount.scanlines > 0 || amount.vignette > 0;

// Black at an alpha over the top is `col * (1 - k)`: the ink under it is
// multiplied by what is left of the light.
let stripe = null, stripeInk = -1;
function scanlines(ctx, w, h, a) {
  const ink = a * 0.28;
  if (stripeInk !== ink) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 2;
    const cx = c.getContext('2d');
    cx.fillStyle = `rgba(0,0,0,${ink})`;
    cx.fillRect(0, 1, 1, 1);                   // the odd row
    stripe = ctx.createPattern(c, 'repeat');
    stripeInk = ink;
  }
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, w, h);
}

// The falloff is measured in units of the frame's *height* on both axes, so it
// is a circle in real pixels rather than an ellipse stretched to the window;
// the corners of a wide window sit outside the last stop and take the full
// amount.
let vig = null, vigKey = '';
function vignette(ctx, w, h, a) {
  const key = `${w}x${h}x${a}`;
  if (vigKey !== key) {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0.35 * h, w / 2, h / 2, 0.95 * h);
    // smoothstep, in eight stops: a straight ramp has a visible corner where it
    // leaves the clear middle.
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
// Both looks are static, so they are laid down once onto a sheet the size of
// the canvas (rebuilt only when the window changes size) and dropped over the
// picture as one image. This is the one line in the draw that is pure fill
// rate: it touches every device pixel whatever the game is doing, and blitting
// a sheet is several times cheaper than shading a gradient and tiling a
// pattern over the whole canvas every frame. `DEVICE_PIXELS` in config.js caps
// the canvas, so that cap is the worst this ever has to do.
//
// Not bit-identical to blending the two layers separately: two eight-bit
// roundings against one. A tenth of the pixels land one step of 255 away,
// inside the rounding of a filter whose whole amplitude is fourteen steps.
let sheet = null, sheetKey = '';

export function press(src, ctx) {
  if (!anyOn()) return;
  const w = src.width, h = src.height;
  const key = `${w}x${h}`;
  if (sheetKey !== key) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');
    if (amount.scanlines > 0) scanlines(cx, w, h, amount.scanlines);
    if (amount.vignette > 0) vignette(cx, w, h, amount.vignette);
    sheet = c;
    sheetKey = key;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);          // device pixels: these are all screen effects
  ctx.globalAlpha = 1;
  ctx.drawImage(sheet, 0, 0);
  ctx.restore();
}
