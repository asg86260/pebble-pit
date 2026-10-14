// The small shapes everything else in the yard is drawn out of: the one mark a
// grain gets wherever it is, the coins' bitmaps and the ring cell.

import { FIND_COLOR, MARK_SIZE, P, SHARD_CELL, SPARK_CELL, SPORE_CELL, findKind } from '../config.js';
import { isDust, shadeOf } from '../grid.js';
import { ctx } from './ctx.js';
import { COIN_MARKS } from '../glyphs.js';

// One glyph, one size, everywhere a grain is drawn outside the sand painter.
// Every one is drawn inside the same cell-sized box, centered on `x, y`: a
// cell is what a grain occupies and collides as, so a bigger mark lies about
// where the thing is, and marks of different sizes read as different amounts.
// `glyph` draws the shape it stands for, for the counter and anything else
// with room; out in the yard a find is a solid cell of its own color, as the
// painter draws it, because that is the only thing that tiles.
//
// `g` is the canvas it goes on: the counter keeps its column of marks on a
// canvas of its own (`drawCount`), and a mark that could only be drawn on the
// frame would have to be read back off it.
// A batch of marks, a color at a time: most marks in the yard are squares
// -- a grain of dust, a find lying out -- and a thousand of them are a
// thousand fills and changes of color drawn one by one. `markInto` lays the
// square `drawMark` would have put down into the batch's path for its color,
// to the pixel, and draws anything that is not a square straight off;
// `fillMarks` puts the batch down and empties it.
export function markInto(runs, v, x, y, size = MARK_SIZE) {
  const tones = isDust(v) ? null : FIND_COLOR[findKind(v)];
  const tone = isDust(v) ? shadeOf(v) : tones ? tones[v - findKind(v)] : null;
  if (!tone) { drawMark(v, x, y, size); return; }
  let path = runs.get(tone);
  if (!path) runs.set(tone, path = new Path2D());
  path.rect(Math.round(x - size / 2), Math.round(y - size / 2), Math.round(size), Math.round(size));
}
export function fillMarks(runs) {
  for (const [tone, path] of runs) { ctx.fillStyle = tone; ctx.fill(path); }
  runs.clear();
  ctx.fillStyle = '#000';
}

export function drawMark(v, x, y, size = MARK_SIZE, glyph = false, g = ctx) {
  // `size` is a cell everywhere but on a crit's dust, which swells through the
  // top of its arc and shrinks back by the time it lands.
  if (isDust(v)) {                             // a grain of dust is a grain: one cell
    g.fillStyle = shadeOf(v);
    g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), Math.round(size), Math.round(size));
    return;
  }
  const tones = FIND_COLOR[findKind(v)];
  if (!glyph && tones) {
    g.fillStyle = tones[v - findKind(v)];
    g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), Math.round(size), Math.round(size));
    g.fillStyle = '#000';
    return;
  }
  // No backing square: a resting find stands in a slot of its own, and a white
  // box behind a triangle is a white box on the ground. The mark is the coin's
  // bitmap (COIN_MARKS), a fifth of `size` a cell, so it lands on whole pixels.
  const kind = findKind(v) || v;
  g.fillStyle = tones ? tones[Math.min(2, v - findKind(v))] : '#000';
  const px = Math.max(1, Math.round(size / 5));
  drawCoin(COIN_OF[kind] || 'dust', Math.round(x - px * 2.5), Math.round(y - px * 2.5), px, g);
  g.fillStyle = '#000';
}

// Which coin mark a find's cell is drawn as.
const COIN_OF = { [SHARD_CELL]: 'ore', [SPORE_CELL]: 'crop', [SPARK_CELL]: 'spark' };

// A coin's mark (COIN_MARKS in glyphs.js) with its top-left at `x, y`, `px`
// pixels a cell, in whatever fill is set: the counter, the casino's feet and a
// find drawn as a glyph all put down the one bitmap.
export function drawCoin(name, x, y, px, g = ctx) {
  const rows = COIN_MARKS[name];
  for (let r = 0; r < rows.length; r++)
    for (let c = 0; c < rows[r].length; c++)
      if (rows[r][c] === '#') g.fillRect(x + c * px, y + r * px, px, px);
}

// A box's rule: the world's thin line (P / 3) lying inside the box, as four
// filled strips, never a stroke centered on the edge -- half a centered rule
// falls outside the box and off the lattice.
export function rule(x, y, w, h, ink = '#000', g = ctx) {
  const t = P / 3;
  g.fillStyle = ink;
  g.fillRect(x, y, w, t);
  g.fillRect(x, y + h - t, w, t);
  g.fillRect(x, y + t, t, h - 2 * t);
  g.fillRect(x + w - t, y + t, t, h - 2 * t);
}

// A cell of a ring, put down *centered* on the point rather than hanging off
// it by its top-left corner: half a cell down and right is exactly enough to
// make a ring read as slipped off whatever it is coming out of.
export function cell(x, y) {
  ctx.rect(Math.round((x - P / 2) / P) * P, Math.round((y - P / 2) / P) * P, P, P);
}
