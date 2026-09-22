import { CLOD_FALL, CLOD_PULL, RECYCLE_PER, RECYCLE_TONE, FILTER_MUCK, FILTER_PER_MUCK, P } from '../config.js';
import { frames } from '../clock.js';
import { spawnChip } from '../dust.js';
import { shadeNear } from '../grid.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { CLODS, outlet } from './band.js';
import { countDrew } from './books.js';
import { colAt, dropMuckAt, muckCols, muckFloor } from './layer.js';

// --- what comes out of the spout -------------------------------------------------------
// A mote down the throat, and what the filter does with it: muck out of the
// spout a load at a time, or, with the recycler, dust a grain at a time.
export function swallow() {
  countDrew();                     // counted at the mouth -- see `sampleAir`
  const out = outlet();
  if (!S.recycler) {
    S.filterMuck = (S.filterMuck || 0) + 1;
    while (S.filterMuck >= FILTER_PER_MUCK) {
      S.filterMuck -= FILTER_PER_MUCK;
      // The load leaves from the clear cell under the lip, not from inside
      // it, or the first half of its fall is behind the black.
      CLODS.push({ x: out.x, y: out.y + P, vy: CLOD_FALL, n: FILTER_MUCK });
    }
    return;
  }
  S.filterBank += 1 / RECYCLE_PER;
  // Whole grains only, and real ones: dust is a grain on the ground that
  // somebody has to carry, not a number going up.
  while (S.filterBank >= 1) {
    S.filterBank -= 1;
    S.recycled++;
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
