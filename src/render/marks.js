// The small shapes everything else in the yard is drawn out of: the one mark a
// grain gets wherever it is, the triangle, the diamond, the ring cell and the
// disc.

import { CORE_CELL, FIND_COLOR, MARK_SIZE, P, SHARD_CELL, SPARK_CELL, SPORE_CELL, findKind } from '../config.js';
import { isDust, shadeOf } from '../grid.js';
import { ctx } from './ctx.js';

// a shard: a triangle, filled or hollow, the mark that means the quarry
export function drawTriangle(x, y, r, hollow) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y + r * 0.8);
  ctx.lineTo(x - r, y + r * 0.8);
  ctx.closePath();
  if (hollow) {
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.lineWidth = Math.max(1, r / 6);
    ctx.strokeStyle = '#000';
    ctx.stroke();
  } else {
    ctx.fillStyle = '#000';
    ctx.fill();
  }
  ctx.fillStyle = '#000';
}

// a diamond: not a currency mark, kept because it is a shape worth having
export function drawDiamond(x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fillStyle = '#000';
  ctx.fill();
}


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
  // box behind a triangle is a white box on the ground.
  const h = size / 2;
  g.fillStyle = tones ? tones[Math.min(2, v - findKind(v))] : '#000';
  const kind = findKind(v) || v;
  if (v === CORE_CELL) {
    const lw = Math.max(1, size / 4);
    g.beginPath();
    g.arc(x, y, Math.max(0.5, h - lw / 2), 0, Math.PI * 2);
    g.fillStyle = '#fff';
    g.fill();
    g.lineWidth = lw;
    g.strokeStyle = '#000';
    g.stroke();
  } else if (kind === SHARD_CELL) {
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + h, y + h);
    g.lineTo(x - h, y + h);
    g.closePath();
    g.fill();
  } else if (kind === SPORE_CELL) {
    const k = h * 0.866;                       // flat-topped, so it fills the width
    g.beginPath();
    g.moveTo(x - h, y);
    g.lineTo(x - h / 2, y - k);
    g.lineTo(x + h / 2, y - k);
    g.lineTo(x + h, y);
    g.lineTo(x + h / 2, y + k);
    g.lineTo(x - h / 2, y + k);
    g.closePath();
    g.fill();
  } else if (kind === SPARK_CELL) {
    // A spark: four points, a thing with no sides, where the quarry's triangle
    // and the plots' hexagon both have sides.
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + h / 3, y - h / 3);
    g.lineTo(x + h, y);
    g.lineTo(x + h / 3, y + h / 3);
    g.lineTo(x, y + h);
    g.lineTo(x - h / 3, y + h / 3);
    g.lineTo(x - h, y);
    g.lineTo(x - h / 3, y - h / 3);
    g.closePath();
    g.fill();
  } else {
    const t = size / 3;
    g.fillRect(x - t / 2, y - h, t, size);
    g.fillRect(x - h, y - t / 2, size, t);
  }
  g.fillStyle = '#000';
}

// A cell of a ring, put down *centered* on the point rather than hanging off
// it by its top-left corner: half a cell down and right is exactly enough to
// make a ring read as slipped off whatever it is coming out of.
export function cell(x, y) {
  ctx.rect(Math.round((x - P / 2) / P) * P, Math.round((y - P / 2) / P) * P, P, P);
}

// A core: a solid disc, not a ring. Hollow reads as an outline of a thing
// rather than the thing.
export function drawCircle(cxp, cyp, r) {
  ctx.beginPath();
  ctx.arc(cxp, cyp, r, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
}
