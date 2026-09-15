// The rockhands' shack: the gang's hut off the rock's left flank.

import { DOOR_H, DOOR_W, P } from '../config.js';
import { S, shack } from '../state.js';
import { ctx } from './ctx.js';
import { rising as risingAt, withRise } from './rise.js';

// A black box with a lid on it and a way in cut white out of the front, the
// grammar every building here is drawn in. Flat, not a lean-to: a roof falling
// three courses across eight columns is a staircase at this size. The mark
// over the door is the hill the gang works, cut white out of the front like
// the outhouse's moon, so it cannot be mistaken for a thing standing in the
// yard; the ground beside the wall is left to the helmets (`kitX` in world.js).
export function drawShack() {
  const rising = risingAt('shack') && 'shack';
  if (!S.shackOpen && !rising) return;
  const { x, y, w, h } = shack;
  withRise(rising, x, S.groundY, w, h, () => {
    const c = n => x + P * n;
    const r = n => y + P * n;
    const WIDE = Math.round(w / P);              // 8 across
    const TALL = Math.round(h / P);              // 11 down
    const MID = WIDE / 2;                        // the seam between the two middle columns

    ctx.fillStyle = '#000';
    // The lid, a cell proud each side, and the body under it.
    ctx.fillRect(c(-1), y, w + P * 2, P);
    ctx.fillRect(x, r(1), w, h - P);

    // The way in: four cells, like every other way in, with two of wall either
    // side on an eight-cell front (SHACK_W in config/buildings.js).
    ctx.fillStyle = '#fff';
    ctx.fillRect(c(MID - DOOR_W / 2), r(TALL - DOOR_H), P * DOOR_W, P * DOOR_H);

    // The hill over the door: three courses, two cells wider each course down.
    // EVEN courses: the front is eight cells, so its middle is a seam, and an
    // odd course centered on a seam starts half a cell off the lattice. (The
    // outhouse's front is seven, so its roof is odd courses.) A whole course
    // clear of the doorway, or the two are one white shape with a stalk on it.
    const py = r(2);
    for (let i = 0; i < 3; i++)
      ctx.fillRect(c(MID - (i + 1)), py + P * i, P * (i + 1) * 2, P);
  });
}
