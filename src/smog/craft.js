import { CRAFT, craftAt, riderOf, working } from '../balloon.js';
import { speedBoost, strengthBoost } from '../apothecary.js';
import { GRAV, RECYCLE_PER, RECYCLE_TONE, FILTER_MUCK, FILTER_PER_MUCK, P } from '../config.js';
import { frames } from '../clock.js';
import { spawnChip } from '../dust.js';
import { shadeNear } from '../grid.js';
import { S } from '../state.js';
import { CLODS, fanPull } from './band.js';
import { countDrew } from './books.js';
import { eat } from './house.js';
import { colAt, dropMuckAt, muckCols, muckFloor } from './layer.js';

// --- what the craft take -------------------------------------------------------------
// A mouth on the sky (`eat`), one a craft. Each has its own gullet: a rate
// below one a frame rounds away to nothing spent a frame at a time, and a
// craft over clear air must not bank a gulp to spend the moment it reaches
// something.
const gullets = [];

// What a craft is rated to take, in motes a second: the fan is the shed's, so
// a bigger fan is a bigger draught at every mouth; and the apothecary reaches
// the rider, so a stew and a strong brew both quicken the craft it is working.
export function craftRate(i) {
  if (!working(i)) return 0;
  const w = riderOf(i);
  return fanPull() * (w ? speedBoost(w) * strengthBoost(w) : 1);
}
// And every craft together: what the sky is being taken down at.
export const airRate = () => CRAFT.reduce((n, c, i) => n + craftRate(i), 0);

export function pullCraft(secs) {
  for (let i = 0; i < CRAFT.length; i++) {
    const rate = craftRate(i);
    if (!rate) { gullets[i] = 0; continue; }
    gullets[i] = Math.min((gullets[i] || 0) + rate * secs, rate);
    // What you see of it is the haze it draws in (craftair.js).
    eat(() => gullets[i], n => { gullets[i] = n; }, i);
  }
}

// How a load or a grain leaves a balloon: let fall from under its basket,
// wherever the balloon is drawn. A balloon is among the clouds, and where it
// is drawn over the ground is a matter of the view, so where its loads land
// follows the view too; the player chose that over bringing the catch home
// (DESIGN.md, "The balloons ride the clouds"). How much falls does not follow
// the view.
function launch(craft) {
  const a = craftAt(craft);
  return { x: a.x, y: a.y, vx: 0, vy: 0, land: null };
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
