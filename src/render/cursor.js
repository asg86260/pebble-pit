// What you are carrying, drifting round the pointer. Extracted verbatim from
// render.js; behavior unchanged. Owns drawCursor. ctx comes from ./ctx.js and
// the mark from ./marks.js.

import { now } from '../clock.js';
import { P } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

// the carried dust drifts loosely around the cursor
export function drawCursor() {
  if (!S.held) return;
  const t = now() / 1000;
  for (const m of S.motes) {
    m.a += m.spin;
    const x = S.mouse.x + Math.cos(m.a) * m.d + Math.sin(t * 1.7 + m.bob) * 2;
    const y = S.mouse.y + Math.sin(m.a) * m.d + Math.cos(t * 1.3 + m.bob) * 2;
    drawMark(m.s, Math.round(x) + P / 2, Math.round(y) + P / 2);   // what it is, not a grain of dust
  }
  ctx.fillStyle = '#000';
}
