// The cave: a mouth in the ground away to the left of the rock.
//
// Crew walk in, are gone a while, and come back out with a shard. The trip time
// is the whole of the mechanic -- it is what an upgrade shortens, and what makes
// sending somebody down there a decision rather than a free tap, because a
// spelunker underground is a worker not carrying dust.
//
// Nothing about the cave is shown until it is opened, the way nothing about
// cores is shown until one is banked.

import { P, WORKER, CAVE_BASE, CAVE_FLOOR, CAVE_WALK } from './config.js';
import { S, cave } from './state.js';
import { standOn } from './world.js';

// how long a trip takes, at this pace
export const caveMs = (lvl = S.cavePaceLevel) =>
  Math.max(CAVE_FLOOR, Math.round(CAVE_BASE * Math.pow(0.82, lvl)));

export const caveRate = (lvl = S.cavePaceLevel) => 60000 / caveMs(lvl);   // trips a minute

// where a spelunker stands to go in
export const caveMouth = () => cave.x + cave.w / 2 - WORKER / 2;

export function newSpelunker() {
  return {
    type: 'spelunker',
    goal: 'to',                            // to the mouth, then in, then out again
    until: 0,
    x: caveMouth() + (Math.random() - 0.5) * P * 20,
    y: 0,
    carry: 0                               // a shard on the way up
  };
}

// A shard rising over the mouth: the moment of finding it, which would otherwise
// be a number quietly going up somewhere else on the screen.
function found(x, y) {
  S.finds.push({ x, y, t: 0 });
  S.shards++;
  S.seenShard = true;
  S.dirty = true;
}

export function stepFinds() {
  for (let i = S.finds.length - 1; i >= 0; i--) {
    const f = S.finds[i];
    f.t += 0.016;
    f.y -= 0.6;
    if (f.t > 1.6) S.finds.splice(i, 1);
  }
}

// one spelunker, one frame
export function stepSpelunker(w, now) {
  const mouth = caveMouth();
  w.y = standOn(S.groundY);

  if (w.goal === 'to') {
    const d = mouth - w.x;
    w.x += Math.sign(d) * Math.min(CAVE_WALK, Math.abs(d));
    if (Math.abs(d) < 1) { w.goal = 'in'; w.until = now + caveMs(); }
    return;
  }

  if (w.goal === 'in') {                   // underground: not on the surface at all
    if (now < w.until) return;
    w.goal = 'out';
    w.carry = 1;
    w.x = mouth;
    return;
  }

  // out with a shard: a few paces clear of the mouth, then it is counted
  w.x += CAVE_WALK;
  if (w.x > mouth + P * 6) {
    found(w.x + WORKER / 2, S.groundY - WORKER - P);
    w.carry = 0;
    w.goal = 'to';
  }
}

// a spelunker underground is not drawn, and is not standing anywhere
export const underground = w => w.type === 'spelunker' && w.goal === 'in';
