// The mark that stands over a station when it has finished something: a rung
// usually lands while you are looking somewhere else, and the bar coming down
// is a signal made of nothing happening.

import { now } from '../clock.js';
import { P, DONE_MARK_FADE } from '../config.js';
import { glyphFor, inkSpan } from '../glyphs.js';
import { S } from '../state.js';
import { tintOf } from '../upgrades.js';
import { onTheGo, rowFor } from '../works.js';
import { barSpot } from './bars.js';
import { ctx } from './ctx.js';

// The thing that finished, in a box: the row's own glyph, the one its card
// wears, so the mark says what landed and not only that something did. The
// opposite number to the bar that means a station stopped. It bobs, because
// it is asking to be come and looked at, and it stays until somebody opens
// that station's board.

// The tick laid over the glyph, so the mark reads as done and not as the
// thing itself standing there.
const TICK = [[-2, 0], [-1, 1], [0, 0], [1, -1], [2, -2]];

// A glyph's rows as the cells `drawMarkBox` takes, centered on its ink: the
// drawing is often narrower than its square and off to one side. A cell at
// nought starts on the center, so a span of even width sits square and an
// odd one is half a cell right; `shift` is the pixels that put it true.
export function markCells(rows) {
  const [lo, hi] = inkSpan(rows);
  const rowsInked = rows.map((r, y) => r.includes('#') ? y : -1).filter(y => y >= 0);
  const top = rowsInked[0], bottom = rowsInked[rowsInked.length - 1] + 1;
  const cx = Math.floor((lo + hi) / 2), cy = Math.floor((top + bottom) / 2);
  const cells = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') cells.push([x - cx, y - cy]); }));
  return { cells, shift: [(lo + hi) % 2 ? -P / 2 : 0, (top + bottom) % 2 ? -P / 2 : 0] };
}

// The box and whichever cells go in it. Ten cells square: an eight-cell glyph
// and a cell of white either side of it. `y` rather than `at.y`: the bob is
// the caller's, a thing about the mark and not about the box.
//
// `tint` is the card's stroke (`tintOf`): a line round the outside of the
// shape, as thick as the box's own, found by flooding from the margin so a
// hole in the shape stays white. The glyph and its stroke go down faint, and the tick over them full, haloed
// in white so it is never lost in the drawing.
export const BOX = 10;
export function drawMarkBox(at, y, glyph, tint = null) {
  const half = P * BOX / 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(at.x - half, y - half, P * BOX, P * BOX);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(at.x - half, y - half, P * BOX, P * BOX);

  ctx.save();
  ctx.translate(at.x + glyph.shift[0], y + glyph.shift[1]);
  ctx.globalAlpha = DONE_MARK_FADE;
  if (tint) strokeCells(glyph.cells, tint);
  fillCells(glyph.cells, '#000');
  ctx.restore();

  ctx.save();
  ctx.translate(at.x - P / 2, y - P / 2);   // five wide: half a cell puts it true
  strokeCells(TICK, '#fff');
  fillCells(TICK, '#000');
  ctx.restore();
}

// cells on the grid about the origin, a cell at nought starting on it
function fillCells(cells, color) {
  ctx.fillStyle = color;
  for (const [dx, dy] of cells) ctx.fillRect(dx * P, dy * P, P, P);
}

// A line round the outside of a shape, as thick as the box's own: each ink
// cell grown by the stroke, cut to the outside cells that touch it.
function strokeCells(cells, color) {
  const t = Math.max(1, P / 3);
  ctx.fillStyle = color;
  for (const [ox, oy] of outsideEdge(cells))
    for (const [dx, dy] of cells) {
      if (Math.abs(dx - ox) > 1 || Math.abs(dy - oy) > 1) continue;
      const x0 = Math.max(ox * P, dx * P - t), x1 = Math.min(ox * P + P, dx * P + P + t);
      const y0 = Math.max(oy * P, dy * P - t), y1 = Math.min(oy * P + P, dy * P + P + t);
      if (x1 > x0 && y1 > y0) ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
}

// The empty cells round a shape that touch it from the outside, corners
// included: where its stroke goes. Flooded from a margin one cell past the
// shape's bounds, so an enclosed hole is never reached.
function outsideEdge(glyph) {
  const xs = glyph.map(([x]) => x), ys = glyph.map(([, y]) => y);
  const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
  const W = x1 - x0 + 1, H = y1 - y0 + 1;
  const ink = new Uint8Array(W * H), out = new Uint8Array(W * H);
  for (const [x, y] of glyph) ink[(y - y0) * W + x - x0] = 1;
  const q = [0]; out[0] = 1;
  while (q.length) {
    const k = q.pop(), x = k % W, y = (k - x) / W;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const n = ny * W + nx;
      if (out[n] || ink[n]) continue;
      out[n] = 1; q.push(n);
    }
  }
  const edge = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!out[y * W + x]) continue;
    let near = false;
    for (let dy = -1; dy <= 1 && !near; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && ink[ny * W + nx]) { near = true; break; }
    }
    if (near) edge.push([x + x0, y + y0]);
  }
  return edge;
}


export function drawDoneMarks() {
  for (const site in S.siteDone) {
    if (!S.siteDone[site]) continue;
    const at = doneMarkAt(site);
    if (!at) continue;
    const y = at.y + Math.round(Math.sin(now() / 500)) * P;   // one cell, never half
    const key = S.siteDone[site], u = rowFor(key);
    drawMarkBox(at, y, markCells(glyphFor(key)), u ? tintOf(u) : null);
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
