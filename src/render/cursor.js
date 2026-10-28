// What you are carrying, drifting round the pointer.

import { now } from '../clock.js';
import { P, MOTE_SPIN_FPS } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

// Where mote `m` drifts at clock `t` (seconds): turned on the clock, not a
// step a drawn frame, so a place that draws its own goods on the cursor
// (render/after.js) puts them where the dust would be.
export function motePos(m, t) {
  const a = m.a + m.spin * MOTE_SPIN_FPS * t;
  return { x: S.mouse.x + Math.cos(a) * m.d + Math.sin(t * 1.7 + m.bob) * 2,
           y: S.mouse.y + Math.sin(a) * m.d + Math.cos(t * 1.3 + m.bob) * 2 };
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
    const { x, y } = motePos(m, t);
    drawMark(m.s, Math.round(x / P) * P + P / 2, Math.round(y / P) * P + P / 2);   // what it is, not a grain of dust, laid on the lattice
  }
  ctx.fillStyle = '#000';
}
