// What a crit leaves in the air: the rings and the specks. The shapes are in
// `render/effects.js`; this walks the two lists `shock.js` keeps and hands
// each entry to the shape that draws it. Nothing is decided here.

import { S } from '../state.js';
import { shockAge, shockReach } from '../shock.js';
import { ctx } from './ctx.js';
import { shockMote, drawShockRing } from './effects.js';

export function drawShocks() {
  // The specks a color at a time, one path each: a driven ram throws
  // hundreds a blow.
  const runs = new Map();
  for (const m of S.shockMotes) {
    const color = m.color || '#000';
    let path = runs.get(color);
    if (!path) runs.set(color, path = new Path2D());
    shockMote(path, m.x, m.y, Math.min(1, m.t / m.life));
  }
  for (const [color, path] of runs) { ctx.fillStyle = color; ctx.fill(path); }
  // The rings over the specks: the leading edge of the same blow.
  for (const s of S.shocks) drawShockRing(ctx, s.x, s.y, shockReach(s), shockAge(s), s.color);
  ctx.fillStyle = '#000';
}
