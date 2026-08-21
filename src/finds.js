// A shard, a spore, a spark: the things the sites give up.
//
// These are not grains of dust and pretending they were is what made them look
// wrong. A grain is one cell and collides as one cell; a shard is drawn as a
// triangle two cells across, and a two-cell picture on a one-cell body means two
// of them side by side overlap and a heap of them reads as mush.
//
// So they have a body of their own: a square two cells on a side, with real
// falling and real stacking. They come to rest on whatever is under them --
// the ground, the dust, the pile in the pit, or another one of themselves --
// and never on top of each other by halves. Everything else about them is the
// same as before: somebody has to carry one to the pit for it to count.

import { P, GRAV, FIND_SIZE, SHARD_CELL, SPORE_CELL, SPARK_CELL } from './config.js';
import { S, floor, pit } from './state.js';
import { surfaceY, colOf, at } from './grid.js';
import { overPitMouth, pileAt } from './world.js';

const COUNT = { [SHARD_CELL]: 'shards', [SPORE_CELL]: 'spores', [SPARK_CELL]: 'sparks' };
const SEEN = { [SHARD_CELL]: 'seenShard', [SPORE_CELL]: 'seenSpore', [SPARK_CELL]: 'seenSpark' };

export const isFind = v => v >= SHARD_CELL && v <= SPARK_CELL;

// thrown loose from a site, or tipped over the lip by a worker
export function spawnFind(v, x, y, vx = 0, vy = 0) {
  S.finds.push({ v, x, y, vx, vy, rest: false, counted: false });
  S.dirty = true;
}

// counted the moment it is over the hole: from there it can only go in
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

// The top of whatever is under this one: the sand it is standing on, and any of
// its fellows whose ground it shares. Its own body is two cells wide, so both
// columns have to hold it up.
// what it would come to rest on if it were over there instead
function restAt(f, x) {
  return groundUnder({ x, y: f.y, v: f.v }, f) - FIND_SIZE;
}

function groundUnder(f, ignore) {
  const bed = overPitMouth(f.x + FIND_SIZE / 2) ? pit : floor;
  let top = Infinity;
  for (let x = f.x; x < f.x + FIND_SIZE; x += P) {
    const c = Math.max(0, Math.min(bed.cols - 1, colOf(bed, x)));
    top = Math.min(top, surfaceY(bed, c) + P);        // the top of it, not the air above
  }
  for (const o of S.finds) {
    if (o === f || o === ignore) continue;
    if (o.x + FIND_SIZE <= f.x || o.x >= f.x + FIND_SIZE) continue;   // not in its way
    if (o.y + FIND_SIZE <= f.y + 1) continue;                          // above it, not under
    top = Math.min(top, o.y);
  }
  return top;
}

// Where it may roll to. A find thrown into a station's pile belongs to that
// pile: it may tumble about inside it and it may not tumble out of it, which is
// what keeps a pile a pile and keeps it countable against its own limit.
function penned(f, x) {
  const p = pileAt(f.x + FIND_SIZE / 2);
  if (!p) return true;
  return x + FIND_SIZE > p.from && x < p.to;
}

// A thing at rest with a lower place beside it rolls into it. This is the same
// rule the sand keeps, at the size of a body rather than a grain: it is what
// turns a run of them dropped in one spot from a needle into a heap, and it is
// what makes a heap slump when somebody takes one out of the bottom of it.
function wantsToRoll(f) {
  // Down is *bigger*: a lower place beside it is one with a larger y. Getting
  // that backwards asked for a higher place instead, which never exists once
  // something is resting, so nothing ever rolled and they stacked into the sky.
  const l = penned(f, f.x - FIND_SIZE) ? restAt(f, f.x - FIND_SIZE) : -Infinity;
  const r = penned(f, f.x + FIND_SIZE) ? restAt(f, f.x + FIND_SIZE) : -Infinity;
  const lower = Math.max(l, r);
  if (lower <= f.y + FIND_SIZE / 2) return 0;      // nothing worth rolling into
  return l > r ? -1 : 1;
}

export function stepFinds() {
  for (const f of S.finds) {
    const floorY = groundUnder(f) - FIND_SIZE;

    if (f.rest) {
      if (f.y < floorY - 0.5) f.rest = false;        // what held it up has gone
      else {
        f.y = floorY;
        const way = wantsToRoll(f);
        if (!way) continue;
        f.rest = false;                             // tip over the edge of it
        f.vx = way * (0.35 + Math.random() * 0.35);
        f.vy = -0.3;
      }
    }

    f.vy += GRAV;
    f.x += f.vx;
    f.y += f.vy;
    f.vx *= 0.97;                                   // it is tumbling, not sliding
    if (!penned(f, f.x)) { f.x -= f.vx; f.vx = 0; } // and not out of its own pile
    // Over the hole is in the hole. There is no depth test: one landing on top
    // of the ones already in there rests above the ground line, and a test that
    // asked it to be below the line left it lying over the mouth uncounted --
    // where workers could see it, walk to the lip, and stand there for ever
    // reaching for something the lip would not let them reach.
    if (overPitMouth(f.x + FIND_SIZE / 2)) countIn(f);

    const rest = groundUnder(f) - FIND_SIZE;
    if (f.y >= rest && f.vy >= 0) {
      f.y = rest;
      f.vy = 0;
      f.vx *= 0.4;                                  // it lands and settles down
      if (Math.abs(f.vx) < 0.06) { f.vx = 0; f.rest = true; }
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
