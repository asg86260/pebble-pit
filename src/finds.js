// A shard, a spore, a spark: the things the sites give up.
//
// These are not grains of dust and pretending they were is what made them look
// wrong. A grain is one cell and collides as one cell; a shard is drawn two
// cells across, and a two-cell picture on a one-cell body means two of them side
// by side overlap and a heap of them reads as mush.
//
// So they have a body of their own, two cells on a side -- and, just as
// importantly, they stand on a **lattice** one body wide, the same way the sand
// stands on a lattice one grain wide. That is the whole difference between a
// pile and a mess. While one is in the air its x is whatever the throw made it;
// the moment it lands it takes the nearest slot, and from then on it is either
// in that slot or in the one next door. Whole steps, so a heap settles and then
// stops, rather than jittering between two places that are nearly the same.
//
// Everything else about them is the same as it was: somebody has to carry one to
// the pit for it to count.

import { P, GRAV, FIND_SIZE, SHARD_CELL, SPORE_CELL, SPARK_CELL } from './config.js';
import { S, floor, pit } from './state.js';
import { surfaceY, colOf, bottomY } from './grid.js';
import { overPitMouth, pileAt, bankCeiling } from './world.js';

const COUNT = { [SHARD_CELL]: 'shards', [SPORE_CELL]: 'spores', [SPARK_CELL]: 'sparks' };
const SEEN = { [SHARD_CELL]: 'seenShard', [SPORE_CELL]: 'seenSpore', [SPARK_CELL]: 'seenSpark' };

export const isFind = v => v >= SHARD_CELL && v <= SPARK_CELL;

// thrown loose from a site, or tipped over the lip by a worker
export function spawnFind(v, x, y, vx = 0, vy = 0) {
  S.finds.push({ v, x, y, vx, vy, rest: false, counted: false });
  S.dirty = true;
}

function countIn(f) {
  if (f.counted) return;
  f.counted = true;
  S[COUNT[f.v]]++;
  S[SEEN[f.v]] = true;
  S.dirty = true;
}

export function takeFind(v, n = 1) {
  for (let i = S.finds.length - 1; i >= 0 && n > 0; i--) {
    if (S.finds[i].v === v && S.finds[i].counted) { S.finds.splice(i, 1); n--; }
  }
}

// the slot a body lands in: the lattice is one body wide
const slotOf = x => Math.round(x / FIND_SIZE) * FIND_SIZE;

// Where a find that is thrown into a station's pile may go. It belongs to that
// pile: it may settle about inside it and it may not wander out of it, which is
// what keeps a pile a pile and keeps it countable against its own limit.
function penned(f, x) {
  const p = pileAt(f.x + FIND_SIZE / 2);
  if (!p) return true;
  return x + FIND_SIZE > p.from && x < p.to;
}

// The top a pile may reach in this slot -- the same rule, from the same place,
// that shapes the dust. Both ends of a strip are cliffs the sand may not lean
// on: the station behind it and the bare ground in front. So a pile rises only
// as it gets away from them, and it cannot stand up as a wall against either.
// Finds were not asking, which is why they went up against the station in a
// column while the dust beside them sloped away properly.
function ceilingY(x) {
  const c = colOf(floor, x + FIND_SIZE / 2);
  return bottomY(floor) - Math.floor(bankCeiling(c)) * P;
}

// Where a body standing in this slot would come to rest: on the sand under it,
// or on the topmost of its fellows already in the slot. `below` is the height to
// look down from, so a body only rests on what is genuinely beneath it.
function restY(x, ignore, below) {
  const bed = overPitMouth(x + FIND_SIZE / 2) ? pit : floor;
  let top = Infinity;
  for (let k = x; k < x + FIND_SIZE; k += P) {
    const c = Math.max(0, Math.min(bed.cols - 1, colOf(bed, k)));
    top = Math.min(top, surfaceY(bed, c) + P);
  }
  for (const o of S.finds) {
    if (o === ignore || !o.rest || o.x !== x) continue;    // a slot holds a column
    if (o.y < below) continue;                             // above it, not under it
    top = Math.min(top, o.y);
  }
  return top - FIND_SIZE;
}

export function stepFinds(bias = 0) {
  for (const f of S.finds) {
    if (f.rest) {
      const here = restY(f.x, f, f.y);
      if (f.y < here - 0.5) { f.rest = false; continue; }  // what held it up has gone
      f.y = here;

      // Then it slides, exactly as a grain of sand does: one slot along, if that
      // slot's floor is a whole body lower than where it is standing. Down is
      // bigger -- a lower place has a larger y.
      //
      // And if it is standing above what a pile may reach here, it moves along
      // whether or not the next slot is lower, towards whichever side has the
      // headroom. That is what turns a column against the station into a heap
      // that leans away from it.
      const above = f.y < ceilingY(f.x);
      const first = ((f.x / FIND_SIZE + bias) & 1) ? -1 : 1;   // alternate, so heaps stay even
      const ways = above
        ? [f.x - FIND_SIZE, f.x + FIND_SIZE].sort((a, b) => ceilingY(a) - ceilingY(b))
        : [f.x + first * FIND_SIZE, f.x - first * FIND_SIZE];
      for (const nx of ways) {
        if (!penned(f, nx)) continue;
        const there = restY(nx, f, f.y);
        if (there < ceilingY(nx)) continue;                    // no room there either
        if (!above && there < f.y + FIND_SIZE) continue;        // not a whole body lower
        f.x = nx;
        f.rest = false;                                        // and let it fall the step
        f.vx = 0;
        f.vy = 0;
        break;
      }
      continue;
    }

    f.vy += GRAV;
    f.x += f.vx;
    f.y += f.vy;
    if (!penned(f, f.x)) { f.x -= f.vx; f.vx = 0; }        // not out of its own pile

    // Over the hole is in the hole. There is no depth test: one landing on top
    // of those already in there rests above the ground line, and a test that
    // asked it to be below the line left it lying over the mouth uncounted --
    // where workers could see it, walk to the lip, and stand there for ever
    // reaching for something the lip would not let them reach.
    if (overPitMouth(f.x + FIND_SIZE / 2)) countIn(f);

    const slot = slotOf(f.x);
    const land = restY(slot, f, f.y);
    if (f.y >= land) {
      f.x = slot;                                          // it lands in a slot
      f.y = land;
      f.vx = 0;
      f.vy = 0;
      f.rest = true;
      S.dirty = true;
    }
  }
}

// the nearest one lying about that nobody else has set off for
export function nearestFind(w) {
  let best = null, bestD = Infinity;
  for (const f of S.finds) {
    if (!f.rest || f.counted) continue;                 // still falling, or already banked
    if (f.x + FIND_SIZE > pit.x) continue;              // past the lip: nobody can reach it
    if (S.workers.some(o => o !== w && o.findItem === f)) continue;
    const d = Math.abs(f.x - w.x);
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}

export function pickUp(f) {
  const i = S.finds.indexOf(f);
  if (i >= 0) S.finds.splice(i, 1);
  S.dirty = true;
}
