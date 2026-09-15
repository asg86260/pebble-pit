// The tick that stands over a station when it has finished something: a rung
// usually lands while you are looking somewhere else, and the bar coming down
// is a signal made of nothing happening.

import { now } from '../clock.js';
import { P } from '../config.js';
import { S } from '../state.js';
import { onTheGo } from '../works.js';
import { barSpot } from './bars.js';
import { ctx } from './ctx.js';

// A tick in a box, the opposite number to the bar that means a station
// stopped. It bobs, because it is asking to be come and looked at, and it
// stays until somebody opens that station's board.
export const TICK = [[-2, 0], [-1, 1], [0, 0], [1, -1], [2, -2]];

// The box and whichever glyph goes in it; the casino's mark uses it too.
// `y` rather than `at.y`: the bob is the caller's, a thing about the mark and
// not about the box.
export function drawMarkBox(at, y, glyph) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(at.x - P * 3.5, y - P * 3.5, P * 7, P * 7);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(at.x - P * 3.5, y - P * 3.5, P * 7, P * 7);

  ctx.fillStyle = '#000';
  for (const [dx, dy] of glyph)
    ctx.fillRect(at.x + dx * P - P / 2, y + dy * P - P / 2, P, P);
}

export function drawDoneMarks() {
  for (const site in S.siteDone) {
    if (!S.siteDone[site]) continue;
    const at = doneMarkAt(site);
    if (!at) continue;
    const y = at.y + Math.round(Math.sin(now() / 500)) * P;   // one cell, never half
    drawMarkBox(at, y, TICK);
  }
}

// Where a site's tick hangs: the same spot its bar does (`barSpot`), lifted
// over any bars still on the go there so the two never sit on each other.
export function doneMarkAt(site) {
  const at = barSpot(site);
  if (!at) return null;
  const lift = onTheGo(site).length * P * 5;
  return { x: Math.round(at.x / P) * P,
           y: Math.round(at.y / P) * P - lift - P * 4 };
}

// where the cursor has to be to be asking what finished; says which site
export function overDoneMark(mx, my) {
  for (const site in S.siteDone) {
    if (!S.siteDone[site]) continue;
    const at = doneMarkAt(site);
    if (at && Math.abs(mx - at.x) < P * 5 && Math.abs(my - at.y) < P * 5) return site;
  }
  return null;
}
