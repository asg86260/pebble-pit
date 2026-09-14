// What a crit leaves in the air: the rings and the specks.
//
// The shapes themselves are in `render/effects.js`, which reads nothing off the
// yard and can therefore be looked at on a blank page in preview.html. This file
// is the other half: it walks the two lists `shock.js` keeps and hands each
// entry to the shape that draws it. Nothing is decided here.

import { S } from '../state.js';
import { shockAge, shockReach } from '../shock.js';
import { ctx } from './ctx.js';
import { drawShockMote, drawShockRing } from './effects.js';

export function drawShocks() {
  for (const m of S.shockMotes) drawShockMote(ctx, m.x, m.y, Math.min(1, m.t / m.life), m.color);
  // The rings over the specks: a ring is the outline of the same blow the specks
  // came out of, and it should read as the leading edge of it.
  for (const s of S.shocks) drawShockRing(ctx, s.x, s.y, shockReach(s), shockAge(s), s.color);
  ctx.fillStyle = '#000';
}
