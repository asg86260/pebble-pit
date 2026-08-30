// Dust in the air: what comes off the rock, and how it gets to the ground.
//
// Nothing here knows what a worker is or what the shop sells. A chip is a shade,
// a place and a velocity, and it stops being one when it lands.

import { P, GRAV, WORKER } from './config.js';
import { rockEdge, pileOf } from './world.js';
import { S, floor, pit } from './state.js';
import { defineMachine } from './machines.js';
import { at, put, colOf, bottomY } from './grid.js';
import { scoopMs } from './upgrades.js';
import { pitFull } from './pit.js';
import { rand } from './rng.js';

// roughly normal, in about -1.5..1.5, most of it near nothing
export const bell = () => rand() + rand() + rand() - 1.5;

// `land` is where an aimed chip is meant to come down. A chip without one comes
// down wherever it meets the ground, which is what a swept or spilled grain does.
export function spawnChip(x, y, vx, vy, shade = 1, land = null) {
  S.chips.push({ x, y, vx, vy, s: shade, land });
}

// A miner tosses its spoil onto the heap. It is a person throwing, the same as a
// quarrier putting a seam up over the rim or a hauler tipping a load into the
// hole -- somebody with a shovel and somewhere to put what is on it.
//
// This was aimed once, then not, and now is again, and the difference matters.
// What was wrong before was that *the rock* posted its spoil: every grain picked
// a spot before it had left the face, so the heap was a destination rather than
// somewhere dust ended up, and nothing ever landed anywhere awkward because
// nothing was allowed to. What was wrong with letting it simply fall is that a
// rock has two sides and only one of them is the yard: half the spoil came off
// the back of the hill, where the crew, the bench and the hole are not, and lay
// there in a layer nobody had a reason to walk to.
//
// So the miner throws, and where it throws is the heap that belongs to the rock.
// The arc is the same one everything else in this yard is thrown on.
// `key` is whose heap it is going on. A farmhand tosses a spore onto the farm's
// heap, not across the yard onto the rock's -- each place has its own strip of
// ground and throws onto it.
export function spawnSpoil(px, py, shade, key = 'rock') {
  const p = pileOf(key);
  const near = p ? p.from : rockEdge(1);
  const far = p ? Math.max(near + P, p.to - P * 2) : near + P * 24;
  // most of it near the rock end of the heap, tailing away out along it, which
  // is the shape a heap somebody is throwing onto actually takes
  const land = Math.min(far, near + P * 2 + Math.abs(bell()) * (far - near) * 0.45);
  const v = aim(px, py, land, P);
  spawnChip(px, py, v.vx, v.vy, shade, land);
}

// The one arc from here to there: the pop is sized to the distance, and the
// sideways speed follows from how long that pop keeps it in the air.
//
// It also works from *below* where it is going, which is what the quarry needs:
// thrown off the floor of an open cut, the pop has to lift it over the rim
// before any of the rest applies. That is one number, not another throw.
export function aim(x, y, land, size) {
  const target = S.groundY - size;                     // the line it comes down to
  const climb = Math.max(0, y - target);               // how far up before any of that
  const pop = Math.max(2 + Math.min(4.5, Math.abs(land - x) / 90),
                       Math.sqrt(2 * GRAV * (climb + P * 8)));
  const t = (pop + Math.sqrt(Math.max(0, pop * pop + 2 * GRAV * (target - y)))) / GRAV;
  return { vx: (land - x) / t, vy: -pop };
}



// --- the belt -------------------------------------------------------------------
// From the rock to the hole, and the one machine that changes the yard's traffic
// rather than a station's rate.
//
// It does not work a face. What it works is the *ground between* the rock and
// the lip: it picks loose dust off the floor a grain at a time and puts it in
// the hole, which is the whole of what a hauler does, minus the walking. That is
// why it has no site of its own and stands along the run instead.
//
// Its tender stands at the lip, where the haulers already gather.
export const beltFrom = () => Math.round((S.cx + P * 6) / P) * P;
export const beltTo = () => Math.round((pit.x - P * 2) / P) * P;
export const beltY = () => S.groundY - P * 5;

defineMachine('belt', {
  job: 'haulers',
  type: 'hauler',
  at: beltFrom,
  y: beltY,
  tendAt: () => beltTo() - WORKER - P,
  // A grain moved takes the same time a hauler's scoop does, divided by what the
  // belt is worth. `scoopMs` carries the lip's own ladders, so everything bought
  // for carrying still applies to the machine that replaced it.
  ms: rate => scoopMs() / Math.max(0.01, rate),
  ready: () => !pitFull(),
  bite: tender => {
    // The nearest loose grain along the run. Never out of a station's strip:
    // those heaps belong to their stations and are carried by hand -- the belt
    // is for what is lying on the open ground between the rock and the hole,
    // which is where the rock's spoil lands and where a machine's output piles
    // up while it waits for somebody.
    const from = beltFrom(), to = beltTo();
    const c0 = colOf(floor, from), c1 = colOf(floor, to);
    for (let c = c0; c <= c1; c++) {
      // The rock's own spoil and the bare ground between here and the lip. Not
      // another station's heap: the cut's stone and the farm's crop are carried
      // by hand to their own piles and belong there, and a belt that swept them
      // into the hole would be stealing rather than hauling.
      //
      // The rock's *is* fair game, and is most of the point: it is what the ram
      // buries the yard in, and it is the pile the haulers were built to empty.
      const reg = floor.region ? floor.region(c) : null;
      if (reg !== null && reg !== 'rock') continue;
      for (let r = floor.rows - 1; r >= 0; r--) {
        const v = at(floor, c, r);
        if (!v) continue;
        put(floor, c, r, 0);
        // Thrown along the belt and into the hole, so it is seen to travel
        // rather than teleporting -- the same arc a hauler's tip uses.
        const x = floor.x + c * P;
        const y = bottomY(floor) - (r + 1) * P;
        const land = to + P * 4;
        const v2 = aim(x, y, land, P * 2);
        spawnChip(x, y, v2.vx, v2.vy, v, land);
        if (tender) tender.stored = (tender.stored || 0) + 1;
        S.dirty = true;
        return true;
      }
    }
    return false;
  }
});
