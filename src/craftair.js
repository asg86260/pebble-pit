// The haze a balloon draws in: cells streaming into its filter box from all
// round it while it works, thicker the dirtier the sky (DESIGN.md, "The
// balloons draw the haze in").
//
// Picture only. How fast a craft pulls is the fan's pull out of the sky's one
// count (`pullCraft` in smog/craft.js); these cells are what that looks like.
// They are kept relative to the craft, not to the sky, so the view scrolling
// cannot move them: a stream tied to the clouds slid and jumped with every
// scroll, since the sheets move slower than the ground. Nothing here spends
// the yard's chance or is read by anything that changes the yard: the cells
// come off a stream of their own.
import { FILTER_PULL, DRAWIN_PER_S, DRAWIN_MURK, DRAWIN_FROM, DRAWIN_PACE } from './config.js';
import { stream } from './rng.js';
import { CRAFT, working } from './balloon.js';
import { fanPull, murk } from './smog.js';

// One list a craft, by its index. A cell is a direction and a distance out
// from the mouth, and how far in it has come (`t`, nought at the start).
export const DRAWN = [];
const roll = stream(0x7412ead);

export function stepCraftAir(dt) {
  const secs = dt / 1000;
  DRAWN.length = Math.min(DRAWN.length, CRAFT.length);
  for (let i = 0; i < CRAFT.length; i++) {
    const cells = DRAWN[i] || (DRAWN[i] = []);
    // A craft that has stopped makes no new cells; the ones on their way in
    // still arrive.
    if (working(i)) {
      let n = DRAWIN_PER_S * (1 + DRAWIN_MURK * murk()) * (fanPull() / FILTER_PULL) * secs;
      while (n > 0) {
        if (n < 1 && roll() > n) break;
        n -= 1;
        // From above and the sides: what a box slung under an envelope pulls
        // on is the air round it, and under it is the basket.
        const a = -Math.PI / 2 + (roll() - 0.5) * Math.PI * 1.1;
        cells.push({ a, d: DRAWIN_FROM * (0.5 + roll() * 0.5), t: 0 });
      }
    }
    // In at a pace in pixels, gathering as it comes, the way the house's own
    // draught does.
    for (let k = cells.length - 1; k >= 0; k--) {
      const c = cells[k];
      c.t += DRAWIN_PACE * secs * (1 + c.t) / c.d;
      if (c.t >= 1) cells.splice(k, 1);
    }
  }
}
