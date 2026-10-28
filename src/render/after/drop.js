// The saw mill's cut coming out of its right side (the owner, 2026-10-26:
// "lets have the logs fall out of the saw on the right side and pile up"):
// each cut (after/mill.js, `sawDrops`) a timber block sliding off the bed
// past the right post and falling onto the timber pile's middle column, where
// the cut's blocks were set down (after/piles.js), fading off as it lands.
// Read off the mill's box and the timber pile's plot, so it follows the
// drawing wherever it stands and at whatever scale.
//
// A block is one drawing, moved whole at its true position, so it never shears.

import { AFTER_DROP, AFTER_BLOCK } from '../../config.js';
import { S } from '../../state.js';
import { stationBox, groundOf, AP } from '../../after/place.js';
import { built } from '../../after/levels.js';
import { sawDrops } from '../../after/mill.js';
import { plotOf } from '../../after/piles.js';
import { topRow, bottomY } from '../../grid.js';
import { clamp01 } from './kit.js';
import { ctx } from '../ctx.js';
import { goodBlock } from './piles.js';
import { seedOf } from './piles.js'; // MOCK after-goods

export function drawSawDrops() {
  const a = S.after;
  if (!a || !built('mill')) return;
  const b = stationBox('mill'), fl = groundOf('mill'), pl = plotOf('timber'), z = AFTER_BLOCK.plank * AP;
  const x0 = b.x + b.w - AFTER_DROP.back * AP, y0 = fl - AFTER_DROP.from * AP;
  // Its landing: the top of the pile's middle column as it stands.
  const mid = Math.floor(pl.cols / 2), x1 = pl.x + mid * pl.p, y1 = bottomY(pl) - (topRow(pl, mid) + 1) * pl.p;
  for (const t of sawDrops()) {
    const k = (a.t - t) / AFTER_DROP.s;
    if (k < 0 || k >= 1) continue;
    // Off the bed level for the first half, then falling, quickening.
    const slide = clamp01(k * 2), fall = clamp01(k * 2 - 1);
    const x = x0 + (x1 - x0) * slide, y = y0 + (y1 - z - y0) * fall * fall;
    const was = ctx.globalAlpha;
    ctx.globalAlpha = was * Math.min(clamp01(k / 0.15), clamp01((1 - k) / 0.3));
    goodBlock(x, y, 'plank', seedOf(Math.round(t * 60))); // MOCK after-goods -- seed
    ctx.globalAlpha = was;
  }
}
