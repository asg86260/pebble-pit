import { CRAFT, craftAt, working } from '../balloon.js';
import { GRAV, RECYCLE_PER, RECYCLE_TONE, FILTER_MUCK, FILTER_PER_MUCK, P } from '../config.js';
import { frames } from '../clock.js';
import { aim, bell, spawnChip } from '../dust.js';
import { shadeNear } from '../grid.js';
import { pileOf } from '../world.js';
import { S } from '../state.js';
import { CLODS, fanPull, outlet } from './band.js';
import { countDrew } from './books.js';
import { eat } from './house.js';
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
    // What you see of it is the haze it draws in (craftair.js).
    eat(() => gullets[i], n => { gullets[i] = n; }, i);
  }
}

// Where a throw off the filter's spout comes down: on its heap, most of it
// near the building and tailing away out along the heap, which is the shape a
// heap somebody is throwing onto takes (`spawnSpoil` in dust.js). Off the
// yard's chance, since where the muck lands is what the crew then shovel.
function landing(out) {
  const heap = pileOf('filter');
  if (!heap) return out.x - P * 6;
  const near = heap.to - P, far = heap.from + P;
  return Math.max(far, near - P - Math.abs(bell()) * (near - far) * 0.45);
}

// How a load or a grain leaves: thrown off the filter's spout onto its heap,
// or let fall from under a balloon's basket, wherever the balloon is drawn.
// A balloon is among the clouds, and where it is drawn over the ground is a
// matter of the view, so where its loads land follows the view too; the
// player chose that over bringing the catch home (DESIGN.md, "The balloons
// ride the clouds"). How much falls does not follow the view.
function launch(craft) {
  if (craft != null) { const a = craftAt(craft); return { x: a.x, y: a.y, vx: 0, vy: 0, land: null }; }
  const out = outlet(), land = landing(out), v = aim(out.x, out.y, land, P);
  return { ...out, vx: v.vx, vy: v.vy, land };
}

// A mote down a mouth, and what comes out for it.
export function swallow(craft = null) {
  countDrew();                     // counted at the mouth -- see `sampleAir`
  spill(craft);
}

// One mote's worth out onto the heap: muck a load at a time, or with the
// recycler dust a grain at a time, off whichever mouth it came in by.
function spill(craft) {
  if (!S.recycler) {
    S.filterMuck = (S.filterMuck || 0) + 1;
    while (S.filterMuck >= FILTER_PER_MUCK) {
      S.filterMuck -= FILTER_PER_MUCK;
      const go = launch(craft);
      CLODS.push({ x: go.x, y: go.y, vx: go.vx, vy: go.vy, n: FILTER_MUCK });
    }
    return;
  }
  S.filterBank += 1 / RECYCLE_PER;
  // Whole grains only, and real ones: dust is a grain on the ground that
  // somebody has to carry, not a number going up.
  while (S.filterBank >= 1) {
    S.filterBank -= 1;
    S.recycled++;
    // On the same throw as the muck. No two grains the same shade, or the
    // heap is a block of one gray beside mottled spoil.
    const go = launch(craft);
    spawnChip(go.x, go.y, go.vx, go.vy, shadeNear(RECYCLE_TONE), go.land);
  }
}

// The loads in the air, on the yard's own gravity. Each lands where it comes
// down, as the load it is, through the same `dropMuckAt` every load goes
// through.
export function stepClods() {
  if (!CLODS.length) return;
  const m = muckCols(), f = frames();
  for (let i = CLODS.length - 1; i >= 0; i--) {
    const k = CLODS[i];
    k.vy += GRAV * f;
    k.x += (k.vx || 0) * f;
    k.y += k.vy * f;
    const c = colAt(k.x);
    if (c >= 0 && c < m.length && k.y < muckFloor(c) - (m[c] || 0) * P - P) continue;
    dropMuckAt(k.x, k.n);
    CLODS.splice(i, 1);
  }
}
