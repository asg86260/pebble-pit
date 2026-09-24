// The frame's own furniture: the blank page it starts on, the two spaces
// everything is drawn in, and the press over the finished picture. Layers like
// any other, because which space a thing is painted in is part of the painting
// order: between `world` and `screen` is in the yard and zooms with it; after
// `screen` is in screen pixels.

import { press } from '../press.js';
import { S } from '../state.js';
import { canvas, ctx } from './ctx.js';

// The page is painted, not assumed.
export function clearPage() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// The shake goes in before the rounding, so the offset lands on a whole device
// pixel and a rock coming down does not put a hairline through every seam.
export function enterWorld() {
  const k = S.zoom * S.dpr;
  ctx.save();
  ctx.setTransform(k, 0, 0, k,
                   Math.round((-S.camX + S.shakeX) * k),
                   Math.round((-S.camY + S.shakeY) * k));
}

// The world, cut off at the ground line: the sky is drawn before the yard and
// nothing paints the earth over it, so on a window too short for the clouds'
// depth under its top they came through below the line.
export function enterSky() {
  enterWorld();
  const far = 1e6;
  ctx.beginPath();
  ctx.rect(-far, -far, 2 * far, far + S.groundY);
  ctx.clip();
}

export function leaveWorld() {
  ctx.restore();
}

// Screen pixels, so digits stay sharp; things drawn in this space still move
// with the yard, through `screenAt`.
export function enterScreen() {
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
}

export const screenAt = (wx, wy) => ({ x: (wx - S.camX + S.shakeX) * S.zoom,
                                      y: (wy - S.camY + S.shakeY) * S.zoom });

// A layer both halves draw is held to its own half's side of the shaft's
// middle. Everything such a layer puts up stands over something in one half
// or the other -- a body's say, a station's roster or bar -- and the deep's
// camera, on a window taller than the deep, looks up past its ceiling into
// the yard's lowest rows: without this the yard's marks hang over the deep's
// water with nobody under them. Set in device pixels, so it holds whichever
// space the layer then draws in; the caller restores.
export function clipToHalf(deep, line) {
  const y = Math.round((line - S.camY + S.shakeY) * S.zoom * S.dpr);
  const t = ctx.getTransform();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  if (deep) ctx.rect(0, y, canvas.width, Math.max(0, canvas.height - y));
  else ctx.rect(0, 0, canvas.width, Math.max(0, y));
  ctx.clip();
  ctx.setTransform(t);
}

// The filter, over the finished frame and on the frame's own canvas: two
// cached fills rather than a trip through a second graphics context (press.js).
export function pressFrame() {
  press(canvas, ctx);
}
