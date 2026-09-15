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

// The filter, over the finished frame and on the frame's own canvas: two
// cached fills rather than a trip through a second graphics context (press.js).
export function pressFrame() {
  press(canvas, ctx);
}
