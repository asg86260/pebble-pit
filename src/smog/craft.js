import { CRAFT, craftDrop, craftMouth, working } from '../balloon.js';
import { BALLOON_WISP_FROM, CLOD_FALL, CLOD_PULL, RECYCLE_PER, RECYCLE_TONE, FILTER_MUCK, FILTER_PER_MUCK, FILTER_PULL, P } from '../config.js';
import { frames } from '../clock.js';
import { spawnChip } from '../dust.js';
import { shadeNear } from '../grid.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { CLODS, fanPull, outlet } from './band.js';
import { countDrew } from './books.js';
import { breatheAt, eat } from './house.js';
import { colAt, dropMuckAt, muckCols, muckFloor } from './layer.js';

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
    breatheAt(craftMouth(i), rate / FILTER_PULL, secs, BALLOON_WISP_FROM);
  }
}

export function swallow(craft = null) {
  countDrew();                     // counted at the mouth -- see `sampleAir`
  // The house drops at its spout; a craft drops under its basket, wherever
  // that is at the time.
  if (!S.recycler) {
    S.filterMuck = (S.filterMuck || 0) + 1;
    while (S.filterMuck >= FILTER_PER_MUCK) {
      S.filterMuck -= FILTER_PER_MUCK;
      // The house's load leaves from the clear cell under the lip, not from
      // inside it, or the first half of its fall is behind the black.
      const out = craft == null ? outlet() : craftDrop(craft);
      CLODS.push({ x: out.x, y: craft == null ? out.y + P : out.y, vy: CLOD_FALL, n: FILTER_MUCK });
    }
    return;
  }
  S.filterBank += 1 / RECYCLE_PER;
  // Whole grains only, and real ones: dust is a grain on the ground that
  // somebody has to carry, not a number going up.
  while (S.filterBank >= 1) {
    S.filterBank -= 1;
    S.recycled++;
    const out = craft == null ? outlet() : craftDrop(craft);
    // Dropped, not thrown: the arm points down. No two grains the same shade,
    // or the heap under the spout is a block of one gray beside mottled spoil.
    spawnChip(out.x, out.y, (rand() - 0.5) * 0.5, 0.15, shadeNear(RECYCLE_TONE));
  }
}

// The loads on their way down. Each lands on the heap under it, as the load
// it is, through the same `dropMuckAt` a load always went through: the fall
// is the only thing added, so the heap is where it always was.
export function stepClods() {
  if (!CLODS.length) return;
  const m = muckCols(), f = frames();
  for (let i = CLODS.length - 1; i >= 0; i--) {
    const k = CLODS[i];
    k.vy += CLOD_PULL * f;
    k.y += k.vy * f;
    const c = colAt(k.x);
    if (c >= 0 && c < m.length && k.y < muckFloor(c) - (m[c] || 0) * P - P) continue;
    dropMuckAt(k.x, k.n);
    CLODS.splice(i, 1);
  }
}
