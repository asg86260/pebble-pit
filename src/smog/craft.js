import { CRAFT, craftDrop, craftMouth, working } from '../balloon.js';
import { BALLOON_WISP_FROM, RECYCLE_PER, RECYCLE_TONE, SCRUB_MUCK, SCRUB_PER_MUCK, SCRUB_PULL } from '../config.js';
import { spawnChip } from '../dust.js';
import { shadeNear } from '../grid.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { fanPull, outlet } from './band.js';
import { countDrew } from './books.js';
import { breatheAt, eat } from './house.js';
import { dropMuckAt } from './layer.js';

// --- what the craft take -------------------------------------------------------------
// The same mouth, in the sky rather than on the ground, and it drags the air
// about no more than the house does -- see `eat` and the note above it. A craft
// takes the specks it is rated to take out of the air it is flying through, and
// what you see is a few cells drawn into its filter.
//
// Each craft has its own gullet, for the reason the house has one: a rate below
// one a frame is rounded away to nothing if it is spent a frame at a time, and a
// craft that has drifted over clear air must not bank a gulp to spend the moment
// it reaches something.
const gullets = [];

export function pullCraft(secs) {
  for (let i = 0; i < CRAFT.length; i++) {
    if (!working(i)) { gullets[i] = 0; continue; }
    // What one crewed mouth is worth. The fan is a number the *station* owns, so
    // a bigger fan is a bigger draught at every mouth the station has -- the
    // house's throat and every filter alike. It says "a bigger fan" on the row,
    // not "a bigger fan on the house".
    const rate = fanPull();
    gullets[i] = Math.min((gullets[i] || 0) + rate * secs, rate);
    eat(() => gullets[i], n => { gullets[i] = n; }, i);
    breatheAt(craftMouth(i), rate / SCRUB_PULL, secs, BALLOON_WISP_FROM);
  }
}

export function swallow(craft = null) {
  countDrew();                     // counted at the mouth -- see `sampleAir`
  // Where it comes down. The house has a spout on its wall; a craft has the air
  // under its basket, wherever that is at the time -- which is the whole idea.
  // The sink stops being one heap on one strip and becomes the ground the crew
  // are walking anyway.
  const at = craft == null ? outlet().x : craftDrop(craft).x;
  if (!S.recycler) {
    S.scrubMuck = (S.scrubMuck || 0) + 1;
    while (S.scrubMuck >= SCRUB_PER_MUCK) {
      S.scrubMuck -= SCRUB_PER_MUCK;
      dropMuckAt(at, SCRUB_MUCK);
    }
    return;
  }
  S.scrubBank += 1 / RECYCLE_PER;
  // Whole grains only, and real ones: dust in this game is a grain on the ground
  // that somebody has to carry, not a number going up.
  while (S.scrubBank >= 1) {
    S.scrubBank -= 1;
    S.recycled++;
    // ...and from under the basket when a craft caught it, which is a place in
    // the air rather than a lip on a wall: the grain falls from where the craft
    // is, and the ordinary chip physics does the rest.
    const out = craft == null ? outlet() : craftDrop(craft);
    // and it drops out of the spout rather than being thrown out of it: the arm
    // points down, so the grain goes down
    // and no two grains quite the same shade. It paid out on RECYCLE_TONE flat,
    // so the heap under the spout was a block of one grey sitting next to the
    // rock's spoil, which is mottled because it comes from different depths.
    // Nothing about a machine handing back what it caught says every grain is
    // identical -- see `shadeNear`.
    spawnChip(out.x, out.y, (rand() - 0.5) * 0.5, 0.15, shadeNear(RECYCLE_TONE));
  }
}

// Nothing lets go of the sky any more, because nothing takes hold of it. The
// draught used to bend every speck within reach of the throat and `unpull` was
// what handed them back when the fan stopped -- carefully, folding the sideways
// part into the mote's own creep so the stream over the roof loosened rather
// than flying home. All of that went with the dragging; see `eat`.
