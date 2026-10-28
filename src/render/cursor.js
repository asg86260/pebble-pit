// What you are carrying, drifting round the pointer.

import { now } from '../clock.js';
import { P, MOTE_SPIN_FPS } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';
import { onPixel } from './frame.js';

// the carried dust drifts loosely around the cursor, and in the deep the
// scales off its floor, which the hand holds on a count of their own
export function drawCursor() {
  if (!S.held && !S.heldScales) return;
  const t = now() / 1000;
  for (const m of S.motes) {
    // turned on the clock, not a step a drawn frame
    const a = m.a + m.spin * MOTE_SPIN_FPS * t;
    const x = S.mouse.x + Math.cos(a) * m.d + Math.sin(t * 1.7 + m.bob) * 2;
    const y = S.mouse.y + Math.sin(a) * m.d + Math.cos(t * 1.3 + m.bob) * 2;
    // At its true position, on the nearest device pixel, the mark laid whole
    // off that origin: a held thing moves smoothly, never a cell at a time
    // (CLAUDE.md, "Art is drawn on the P = 6 cell grid; motion is smooth").
    const ox = onPixel(x), oy = onPixel(y);
    ctx.translate(ox, oy);
    drawMark(m.s, P / 2, P / 2);   // what it is, not a grain of dust
    ctx.translate(-ox, -oy);
  }
  ctx.fillStyle = '#000';
}
