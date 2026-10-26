// The saw mill's cut coming out of its right side (the owner, 2026-10-26:
// "lets have the logs fall out of the saw on the right side and pile up"):
// each cut (after/mill.js, `sawDrops`) a plank sliding off the bed past the
// right post and falling onto the timber pile, fading off as it lands while
// the pile's own top plank fades on (render/after/piles.js), so it reads as
// one plank coming to rest. Read off the mill's box and its timber pile, so
// it follows the drawing wherever it stands and at whatever scale.
//
// A plank is one drawing, moved whole at its true position (its own frame
// placed at the fractional point), so its rim and face never shear.

import { AFTER_DROP, AFTER_ART_SCALE } from '../../config.js';
import { S } from '../../state.js';
import { stationBox, pileAt, groundOf, AP } from '../../after/place.js';
import { built } from '../../after/levels.js';
import { sawDrops } from '../../after/mill.js';
import { frame, clamp01 } from './kit.js';
import { plankAt } from './piles.js';

// The planks the pile draws before it stops growing (piles.js, `plankPile`).
const PILE_CAP = 6;

export function drawSawDrops() {
  const a = S.after;
  if (!a || !built('mill')) return;
  const b = stationBox('mill'), fl = groundOf('mill');
  const x0 = b.x + b.w - AFTER_DROP.back * AP, y0 = fl - AFTER_DROP.from * AP;
  const x1 = pileAt('mill', 'timber');
  // Its landing: the top of the pile as it stands, a plank a row.
  const y1 = fl - Math.min(PILE_CAP, Math.max(1, Math.floor(a.stock.timber))) * AP;  for (const t of sawDrops()) {
    const k = (a.t - t) / AFTER_DROP.s;
    if (k < 0 || k >= 1) continue;
    // Off the bed level for the first half, then falling, quickening.
    const slide = clamp01(k * 2), fall = clamp01(k * 2 - 1);
    const x = x0 + (x1 - x0) * slide, y = y0 + (y1 - y0) * fall * fall;
    const ink = Math.min(clamp01(k / 0.15), clamp01((1 - k) / 0.3));
    const d = frame(x, y, 0, null, AFTER_ART_SCALE);
    d.fade(ink, () => plankAt(d, 0, 0));
  }
}
