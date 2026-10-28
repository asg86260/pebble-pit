// What you are carrying, drifting round the pointer.

import { now } from '../clock.js';
import { P, MOTE_SPIN_FPS } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';
import { onPixel } from './frame.js';

// Where mote `m` drifts at clock `t` (seconds): turned on the clock, not a
// step a drawn frame, so a place that draws its own goods on the cursor
// (render/after.js) puts them where the dust would be.
// A heavy one (`sway`, hands.js) bobs as little as it swings.
export function motePos(m, t) {
  const a = m.a + m.spin * MOTE_SPIN_FPS * t, bob = 2 * (m.sway ?? 1);
  return { x: S.mouse.x + Math.cos(a) * m.d + Math.sin(t * 1.7 + m.bob) * bob,
           y: S.mouse.y + Math.sin(a) * m.d + Math.cos(t * 1.3 + m.bob) * bob };
}

// the carried dust drifts loosely around the cursor, and in the deep the
// scales off its floor, which the hand holds on a count of their own. A
// place's goods (a mote with a `kind`) are drawn by that place, in its own
// tones (render/after.js, `drawHandGoods`).
export function drawCursor() {
  if (!S.held && !S.heldScales) return;
  const t = now() / 1000;
  for (const m of S.motes) {
    if (m.kind) continue;
    // At its true position, on the nearest device pixel, the mark laid whole
    // off that origin: a held thing moves smoothly, never a cell at a time
    // (CLAUDE.md, "Art is drawn on the P = 6 cell grid; motion is smooth").
    const { x, y } = motePos(m, t), ox = onPixel(x), oy = onPixel(y);
    ctx.translate(ox, oy);
    drawMark(m.s, P / 2, P / 2);   // what it is, not a grain of dust
    ctx.translate(-ox, -oy);
  }
  ctx.fillStyle = '#000';
}
