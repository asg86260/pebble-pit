// One look laid over the finished frame, in 2D, without leaving the context:
// every other row of device pixels is darker, a two-pixel pattern made once and
// filled over the frame.
//
// There is no vignette: a radial falloff is a gradient, and the game draws none
// (docs/design-language/canvas.md). The scanlines are the one screen-wide look,
// and store shots are taken with them on.
//
// Never a WebGL pass: handing a Canvas2D picture to a second context costs a
// hard sync and a screen of pixels each way, which is twenty milliseconds a
// frame on a large window.
//
// Chromatic aberration is deliberately not here: lifting one color channel off
// a 2D canvas is eight fullscreen operations and two more window-sized
// canvases, three milliseconds a frame, ten times the two looks that are left,
// for a fringe the whole pixel discipline exists to prevent.

import { PRESS_MIX } from './config.js';
import { raw } from './ink.js';

// No dial: a look you can move at runtime is a look nobody has decided on.
const amount = PRESS_MIX.scanlines || 0;

// Black at an alpha over the top is `col * (1 - k)`: the ink under it is
// multiplied by what is left of the light.
let stripe = null, stripeInk = -1; // cache: the scanline pattern, keyed by its ink
function scanlines(ctx, w, h, a) {
  const ink = a * 0.28;
  if (stripeInk !== ink) {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 2;
    const cx = c.getContext('2d');
    cx.fillStyle = raw(`rgba(0,0,0,${ink})`);   // a shade, not an ink: it dims on either page
    cx.fillRect(0, 1, 1, 1);                   // the odd row
    stripe = ctx.createPattern(c, 'repeat');
    stripeInk = ink;
  }
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, w, h);
}

// One pass over the finished frame, on the frame's own canvas.
//
// The look is static, so it is laid down once onto a sheet the size of
// the canvas (rebuilt only when the window changes size) and dropped over the
// picture as one image. This is the one line in the draw that is pure fill
// rate: it touches every device pixel whatever the game is doing, and blitting
// a sheet is several times cheaper than shading a gradient and tiling a
// pattern over the whole canvas every frame. `DEVICE_PIXELS` in config.js caps
// the canvas, so that cap is the worst this ever has to do.
//
let sheet = null, sheetKey = ''; // cache: the finished look, keyed by the canvas size

export function press(src, ctx) {
  if (!(amount > 0)) return;
  const w = src.width, h = src.height;
  const key = `${w}x${h}`;
  if (sheetKey !== key) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d');
    scanlines(cx, w, h, amount);
    sheet = c;
    sheetKey = key;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);          // device pixels: these are all screen effects
  ctx.globalAlpha = 1;
  ctx.drawImage(sheet, 0, 0);
  ctx.restore();
}
