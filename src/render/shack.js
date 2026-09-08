// The rockhands' shack: the gang's hut off the rock's left flank. Owns
// drawShack. The shared primitives (ctx, withRise) come from ./ctx.js and
// ./rise.js, the same way the outhouse and the tower get them.

import { DOOR_H, DOOR_W, P } from '../config.js';
import { S, shack } from '../state.js';
import { ctx } from './ctx.js';
import { rising as risingAt, withRise } from './rise.js';

// A black box with a lid on it and a way in cut white out of the front, which
// is the grammar every building here is drawn in. What tells it from the
// outhouse is not the silhouette -- it is the door and the mark over it.
//
// **The first draft was a lean-to** and it was wrong on the shot: a roof falling
// three courses across eight columns is a step every two and a half cells, and
// what a stepped SILHOUETTE reads as at this size is a staircase, not a slope.
// A slope has to be drawn as a thin line over a straight wall or not at all,
// and there is no room here for the wall it would need. So: flat, with a course
// of eave standing a cell proud each side, which is the thing that says built
// rather than extruded.
//
// **The mark over the door is the hill itself.** Two drafts went before it. A
// pickaxe stood beside the wall read as a post with a hat on -- the same failure
// the outhouse's door had before it was cut on whole columns -- and cutting the
// same pick into the front instead made a head with two dipped ends over a
// haft, which at five cells across is a face. So the mark is what the gang
// works rather than what they work it with: a small white hill, three courses,
// which is the one shape in this game that cannot be read as anything else.
// Marks are cut white out of the front here (the outhouse's moon), so it cannot
// be mistaken for a thing standing in the yard, and the ground beside the wall
// is left to the helmets, which is what actually stands there (see `kitX` in
// world.js).
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

    // The way in: four cells, like every other way in in this yard, with two of
    // wall either side of it on an eight-cell front. That is what settled the
    // width -- see SHACK_W in config/buildings.js.
    ctx.fillStyle = '#fff';
    ctx.fillRect(c(MID - DOOR_W / 2), r(TALL - DOOR_H), P * DOOR_W, P * DOOR_H);

    // And the hill over the door: three courses, two cells wider each course
    // down, six across at the foot.
    //
    // EVEN courses, not odd. The front is eight cells, so its middle is the
    // seam between two columns rather than a column -- and an odd course
    // centred on a seam starts half a cell off the lattice, which is a fraction
    // of a device pixel and a grey hairline down one side of every row of it.
    // The outhouse builds its roof out of odd courses for exactly the same
    // reason in reverse: its front is seven, so its middle IS a column.
    //
    // A whole course clear of the doorway below it. Touching, the two were one
    // white shape with a stalk on it -- a doorway with something wrong rather
    // than a mark over a door.
    const py = r(2);
    for (let i = 0; i < 3; i++)
      ctx.fillRect(c(MID - (i + 1)), py + P * i, P * (i + 1) * 2, P);
  });
}
