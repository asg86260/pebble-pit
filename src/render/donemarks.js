// The mark that stands over a station when it has finished something: a rung
// usually lands while you are looking somewhere else, and the bar coming down
// is a signal made of nothing happening.

import { now } from '../clock.js';
import { P } from '../config.js';
import { glyphFor, inkSpan } from '../glyphs.js';
import { S } from '../state.js';
import { onTheGo } from '../works.js';
import { barSpot } from './bars.js';
import { ctx } from './ctx.js';

// The thing that finished, in a box: the row's own glyph, the one its card
// wears, so the mark says what landed and not only that something did. The
// opposite number to the bar that means a station stopped. It bobs, because
// it is asking to be come and looked at, and it stays until somebody opens
// that station's board.

// A glyph's rows as the cells `drawMarkBox` takes, centered on its ink: the
// drawing is often narrower than its square and off to one side.
export function markCells(rows) {
  const [lo, hi] = inkSpan(rows);
  const rowsInked = rows.map((r, y) => r.includes('#') ? y : -1).filter(y => y >= 0);
  const cx = Math.floor((lo + hi) / 2), cy = Math.floor((rowsInked[0] + rowsInked[rowsInked.length - 1] + 1) / 2);
  const cells = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') cells.push([x - cx, y - cy]); }));
  return cells;
}

// The box and whichever cells go in it. Ten cells square: an eight-cell glyph
// and a cell of white either side of it. `y` rather than `at.y`: the bob is
// the caller's, a thing about the mark and not about the box.
export const BOX = 10;
export function drawMarkBox(at, y, glyph) {
  const half = P * BOX / 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(at.x - half, y - half, P * BOX, P * BOX);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(at.x - half, y - half, P * BOX, P * BOX);

  // a cell at nought starts on the center, so an even-width drawing (cells
  // -4 to 3) sits square in the box
  ctx.fillStyle = '#000';
  for (const [dx, dy] of glyph)
    ctx.fillRect(at.x + dx * P, y + dy * P, P, P);
}

export function drawDoneMarks() {
  for (const site in S.siteDone) {
    if (!S.siteDone[site]) continue;
    const at = doneMarkAt(site);
    if (!at) continue;
    const y = at.y + Math.round(Math.sin(now() / 500)) * P;   // one cell, never half
    drawMarkBox(at, y, markCells(glyphFor(S.siteDone[site])));
  }
}

// Where a site's mark hangs: the same spot its bar does (`barSpot`), lifted
// over any bars still on the go there so the two never sit on each other.
export function doneMarkAt(site) {
  const at = barSpot(site);
  if (!at) return null;
  const lift = onTheGo(site).length * P * 5;
  return { x: Math.round(at.x / P) * P,
           y: Math.round(at.y / P) * P - lift - P * 6 };
}

// where the cursor has to be to be asking what finished; says which site
export function overDoneMark(mx, my) {
  for (const site in S.siteDone) {
    if (!S.siteDone[site]) continue;
    const at = doneMarkAt(site);
    if (at && Math.abs(mx - at.x) < P * 6 && Math.abs(my - at.y) < P * 6) return site;
  }
  return null;
}
