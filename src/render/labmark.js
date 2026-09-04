// The tick that stands over the lab when it has finished something. Extracted
// verbatim from render.js; behavior unchanged. Owns drawLabMark, labMarkAt and
// overLabMark. ctx comes from ./ctx.js.

import { now } from '../clock.js';
import { P } from '../config.js';
import { S, lab } from '../state.js';
import { ctx } from './ctx.js';

// The lab finished something while you were looking somewhere else. The
// chimney says the place is *being* worked, and it goes out the moment the work
// is done -- which is a signal made of nothing happening, and no use at all if
// you were not watching. So finishing leaves a mark standing over the lab: a
// tick in a box, the opposite number to the bar that means a station stopped.
// It bobs, because it is asking to be come and looked at rather than reporting
// a state, and it stays there until somebody opens the lab.
const TICK = [[-2, 0], [-1, 1], [0, 0], [1, -1], [2, -2]];

export function drawLabMark() {
  if (!S.labOpen || !S.labDone) return;
  const at = labMarkAt();
  const y = at.y + Math.round(Math.sin(now() / 500)) * P;   // one cell, never half

  ctx.fillStyle = '#fff';
  ctx.fillRect(at.x - P * 3.5, y - P * 3.5, P * 7, P * 7);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(at.x - P * 3.5, y - P * 3.5, P * 7, P * 7);

  ctx.fillStyle = '#000';
  for (const [dx, dy] of TICK)
    ctx.fillRect(at.x + dx * P - P / 2, y + dy * P - P / 2, P, P);
}

// Over the lab, clear of the chimney: the plume comes off it and would read
// straight through the mark otherwise.
export function labMarkAt() {
  return { x: Math.round((lab.x + lab.w / 2) / P) * P,
           y: Math.round((lab.y - P * 8) / P) * P };
}

// where the cursor has to be to be asking what finished
export function overLabMark(mx, my) {
  const at = labMarkAt();
  return Math.abs(mx - at.x) < P * 5 && Math.abs(my - at.y) < P * 5;
}
