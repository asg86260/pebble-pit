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
// The house's mouth, in the sky (`eat`). Each craft has its own gullet for
// the reason the house has one: a rate below one a frame rounds away to
// nothing spent a frame at a time, and a craft over clear air must not bank
// a gulp to spend the moment it reaches something.
const gullets = [];

export function pullCraft(secs) {
  for (let i = 0; i < CRAFT.length; i++) {
    if (!working(i)) { gullets[i] = 0; continue; }
    // The fan is the station's, so a bigger fan is a bigger draught at every
    // mouth the station has.
    const rate = fanPull();
    gullets[i] = Math.min((gullets[i] || 0) + rate * secs, rate);
    eat(() => gullets[i], n => { gullets[i] = n; }, i);
    breatheAt(craftMouth(i), rate / SCRUB_PULL, secs, BALLOON_WISP_FROM);
  }
}

export function swallow(craft = null) {
  countDrew();                     // counted at the mouth -- see `sampleAir`
  // The house drops at its spout; a craft drops under its basket, wherever
  // that is at the time.
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
  // Whole grains only, and real ones: dust is a grain on the ground that
  // somebody has to carry, not a number going up.
  while (S.scrubBank >= 1) {
    S.scrubBank -= 1;
    S.recycled++;
    const out = craft == null ? outlet() : craftDrop(craft);
    // Dropped, not thrown: the arm points down. No two grains the same shade,
    // or the heap under the spout is a block of one gray beside mottled spoil.
    spawnChip(out.x, out.y, (rand() - 0.5) * 0.5, 0.15, shadeNear(RECYCLE_TONE));
  }
}

