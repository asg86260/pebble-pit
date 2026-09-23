// The stream a balloon draws down out of the cloud it is working: one column
// of cells, gathered off the cloud's base and narrowing into the vent at the
// crown of the envelope, thicker the dirtier the sky (DESIGN.md, "The balloons
// ride the clouds").
//
// Picture only. How fast a craft pulls is its power's pull out of the sky's one
// count (`pullCraft` in smog/craft.js); the stream is what that looks like.
// The craft hangs in its cloud's own sheet, so the stream runs between two
// things at one depth and scrolls with both: nothing about the view can pull
// it apart. Nothing here spends the yard's chance or is read by anything that
// changes the yard: the cells come off a stream of their own.
import { BALLOON_PULL, DRAWIN_PER_S, DRAWIN_MURK, DRAWIN_WIDE, DRAWIN_PACE, BALLOON_HANG, P } from './config.js';
import { stream } from './rng.js';
import { CRAFT, atCloud } from './balloon.js';
import { balloonPull, murk } from './smog.js';

// One list a craft, by its index. A cell is how far down from the cloud it
// has come (`t`, nought at the cloud, one at the vent) and where across the
// line it started (`off`, in cells), which it gives up as it comes down.
export const DRAWN = [];
const roll = stream(0x7412ead);
const LEN = P * BALLOON_HANG;

export function stepCraftAir(dt) {
  const secs = dt / 1000;
  DRAWN.length = Math.min(DRAWN.length, CRAFT.length);
  for (let i = 0; i < CRAFT.length; i++) {
    const cells = DRAWN[i] || (DRAWN[i] = []);
    // Only while it hangs at its cloud: on the way between two it is drawing
    // on nothing it can be seen to draw on. The cells already coming down
    // still arrive.
    if (atCloud(i)) {
      let n = DRAWIN_PER_S * (1 + DRAWIN_MURK * murk()) * (balloonPull() / BALLOON_PULL) * secs;
      while (n > 0) {
        if (n < 1 && roll() > n) break;
        n -= 1;
        cells.push({ t: 0, off: Math.round((roll() * 2 - 1) * DRAWIN_WIDE) });
      }
    }
    // Down at a pace in pixels, gathering as it comes, the way the house's own
    // draught does.
    for (let k = cells.length - 1; k >= 0; k--) {
      const c = cells[k];
      c.t += DRAWIN_PACE * secs * (1 + c.t) / LEN;
      if (c.t >= 1) cells.splice(k, 1);
    }
  }
}
