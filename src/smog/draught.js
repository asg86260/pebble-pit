import { PLUME_STIR, PLUME_STIR_CAP, PLUME_STIR_R, SMOKE_STIR, SMOKE_STIR_CAP, SMOKE_STIR_R } from '../config.js';
import { SKY } from './band.js';
import { moteX, moteY, wake } from './sky.js';

// --- the draught, in the smoke -------------------------------------------------
// The same hand that moves the dust moves this. A haze that took no notice of a
// pointer going through it was the one field in the yard you could put your hand
// into and have nothing happen -- and it is the field most obviously *air*.
//
// Both halves of it. What is still climbing gets a shove it carries; what has
// settled gets a displacement that eases back, because a settled mote is placed
// where its slot says every frame and the only way to move one is to bend where
// that is. Fainter than the dust, which is already faint: this weighs nothing.
export function stirSmoke(wx, wy, dx, dy) {
  const speed = Math.hypot(dx, dy);
  if (speed < 0.5) return 0;
  const push = Math.min(speed, 40) * SMOKE_STIR;
  const ux = dx / speed, uy = dy / speed;
  const cap = v => Math.max(-SMOKE_STIR_CAP, Math.min(SMOKE_STIR_CAP, v));
  let moved = 0;

  // The climbing ones, which take it harder: see PLUME_STIR. This is the smoke
  // your hand is actually near.
  const blow = Math.min(speed, 40) * PLUME_STIR;
  const capUp = v => Math.max(-PLUME_STIR_CAP, Math.min(PLUME_STIR_CAP, v));
  for (const m of SKY) {
    if (!m.up) continue;
    const d = Math.hypot(m.x - wx, m.y - wy);
    if (d > PLUME_STIR_R) continue;
    const k = blow * (1 - d / PLUME_STIR_R) ** 2;
    m.sx = capUp((m.sx || 0) + ux * k);
    m.sy = capUp((m.sy || 0) + uy * k);
    moved++;
  }

  for (const m of SKY) {
    if (m.up) continue;
    // Asked of the sky rather than read off the mote: one at rest is not written
    // to any more, so where it is is what `moteX` says it is.
    const d = Math.hypot(moteX(m) - wx, moteY(m) - wy);
    if (d > SMOKE_STIR_R) continue;
    // Bent out of place, so it has something to step again: back on the list,
    // from exactly the pixel it was being drawn at.
    wake(m);
    const k = push * (1 - d / SMOKE_STIR_R) ** 2;
    m.px = cap(m.px + ux * k);
    m.py = cap(m.py + uy * k);
    moved++;
  }
  return moved;
}
