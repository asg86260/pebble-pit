// The mark that stands over a station when it has finished something: a rung
// usually lands while you are looking somewhere else, and the bar coming down
// is a signal made of nothing happening.

import { P } from '../config.js';
import { glyphFor } from '../glyphs.js';
import { S } from '../state.js';
import { tintOf } from '../upgrades.js';
import { doneAt, rowFor } from '../works.js';
import { buildingGlyph, stackSlot } from './bars.js';
import { ctx } from './ctx.js';

// The thing that finished stays where it stood in the stack over the station
// (`drawWorkBars`), drawn whole with a tick laid over it, and the next thing
// going up lifts above it: a station that has landed three rungs since its
// board was read shows three ticked glyphs, foot to top in the order they
// landed, until somebody opens that board. The tick is what says done; the
// glyph, the one its card wears, says what.

// The tick laid over the glyph, five wide, full black haloed in white so it
// is never lost in the drawing.
const TICK = [[-2, 0], [-1, 1], [0, 0], [1, -1], [2, -2]];

// cells on the grid about the origin, a cell at nought starting on it
function fillCells(cells, color) {
  ctx.fillStyle = color;
  for (const [dx, dy] of cells) ctx.fillRect(dx * P, dy * P, P, P);
}

// A line round the outside of a shape, a third of a cell thick: each ink
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
    doneAt(site).forEach((key, i) => {
      const at = stackSlot(site, i);
      if (!at) return;
      const u = rowFor(key);
      buildingGlyph(at.x, at.cy, glyphFor(key), 1, u ? tintOf(u) : null);
      ctx.save();
      ctx.translate(at.x - P / 2, at.cy - P / 2);   // five wide: half a cell puts it true
      strokeCells(TICK, '#fff');
      fillCells(TICK, '#000');
      ctx.restore();
    });
  }
}

// Where a site's marks stand: the last one done, at the top of them, for the
// tip to hang off.
export function doneMarkAt(site) {
  const n = doneAt(site).length;
  if (!n) return null;
  const top = stackSlot(site, n - 1);
  return top && { x: top.x, y: top.cy };
}

// where the cursor has to be to be asking what finished; says which site
export function overDoneMark(mx, my) {
  for (const site in S.siteDone) {
    const n = doneAt(site).length;
    if (!n) continue;
    const foot = stackSlot(site, 0), top = stackSlot(site, n - 1);
    if (!foot) continue;
    if (Math.abs(mx - foot.x) < P * 6 && my > top.cy - P * 6 && my < foot.cy + P * 6) return site;
  }
  return null;
}
