// The quarry: a mouth in the ground away to the left of the rock.
//
// Crew climb down into it and work the face where you can see them. The pace
// is the whole of the mechanic -- it is what an upgrade shortens, and what makes
// sending somebody down there a decision rather than a free tap, because a
// quarrier underground is a worker not carrying dust.
//
// Nothing about the quarry is shown until it is opened, the way nothing about
// cores is shown until one is banked.

import { P, WORKER, QUARRY_BASE, QUARRY_FLOOR, QUARRY_WALK, QUARRY_SWING, QUARRY_SHUFFLE,
         SHARD_CELL, someFind } from './config.js';
import { S, quarry } from './state.js';
import { standOn } from './world.js';
import { mult } from './lab.js';
import { spawnSpoil } from './dust.js';

// how long a trip takes, at this pace
export const quarryMs = (lvl = S.quarryPaceLevel) =>
  Math.max(500, Math.round(Math.max(QUARRY_FLOOR, QUARRY_BASE * Math.pow(0.82, lvl)) / mult('quarry')));

export const quarryRate = (lvl = S.quarryPaceLevel) => 60000 / quarryMs(lvl);   // trips a minute

// where a quarrier stands to go in
export const quarryFace = () => quarry.x + quarry.w / 2 - WORKER / 2;

export function newQuarrier() {
  return {
    type: 'quarrier',
    goal: 'to',                            // to the rim, then down, then work
    next: 0,
    swingAt: 0,
    lunge: 0,
    dir: Math.random() < 0.5 ? -1 : 1,
    seat: 0,                               // where along the floor it stands
    x: quarryFace(),
    y: 0,
    carry: 0
  };
}

// The floor of the cut, and a spot on it to stand. They space themselves out
// along it rather than standing in each other, the way the crew on the rock do.
export const quarryFloor = () => S.groundY + quarry.h;

// somebody already working the stretch this one is about to walk into
function elbowRoom(w, x) {
  return S.workers.some(o => o !== w && o.type === 'quarrier' && o.goal === 'work' &&
                             (o.x - w.x) * w.dir > 0 && Math.abs(o.x - x) < WORKER * 1.3);
}

function seatX(w) {
  const n = Math.max(1, S.quarriers);
  const i = Math.max(0, S.workers.filter(o => o.type === 'quarrier').indexOf(w));
  return quarry.x + P + ((i + 0.5) / n) * (quarry.w - P * 2 - WORKER);
}

// A shard knocked off the face is thrown out of the cut and into the quarry's
// own pile -- by the same throw the rock's spoil uses, aimed the same way, over
// the rim because the arc knows how to climb.
function tossOut(x, y) {
  spawnSpoil(x, y, someFind(SHARD_CELL), 'quarry');
}

// one quarrier, one frame
export function stepQuarrier(w, now) {
  const rim = quarryFace();

  // walk to the rim along the ground
  if (w.goal === 'to') {
    w.y = standOn(S.groundY);
    const d = rim - w.x;
    w.x += Math.sign(d) * Math.min(QUARRY_WALK, Math.abs(d));
    if (Math.abs(d) < 1) { w.goal = 'down'; w.seat = seatX(w); }
    return;
  }

  // climb down the near wall, then take a spot along the floor
  if (w.goal === 'down') {
    w.y = Math.min(w.y + QUARRY_WALK * 2, quarryFloor() - WORKER);
    if (w.y >= quarryFloor() - WORKER) { w.y = quarryFloor() - WORKER; w.goal = 'work'; }
    return;
  }

  // At the face. It swings like a miner does, and every so often a shard comes
  // off and goes up over the rim. Nobody knocks another one loose while the
  // pile outside is full: there would be nowhere to put it.
  w.y = quarryFloor() - WORKER;
  w.lunge *= 0.82;
  if (S.pileFull.quarry) { w.next = now + quarryMs(); return; }

  // It works along the face rather than standing on one spot: back and forth
  // between the walls, turning at the ends and before walking into a mate.
  const lo = quarry.x + P, hi = quarry.x + quarry.w - P - WORKER;
  const step = w.x + w.dir * QUARRY_SHUFFLE;
  if (step < lo || step > hi || elbowRoom(w, step)) w.dir = -w.dir;
  else w.x = step;

  // and it swings on its own rhythm, which is nothing to do with how often the
  // face gives anything up: a quarry should look busy whether or not it is
  // being productive, the same as the crew on the rock do.
  if (now >= w.swingAt) {
    w.lunge = 1;
    w.swingAt = now + QUARRY_SWING * (0.7 + Math.random() * 0.6);
  }

  if (now >= w.next) {
    if (w.next) tossOut(w.x + WORKER / 2, w.y + WORKER);
    w.lunge = 1;
    w.swingAt = now + QUARRY_SWING;
    w.next = now + quarryMs() * (0.85 + Math.random() * 0.3);   // never quite in time
  }
}

// nobody is out of sight any more: the whole point of a cut rather than a shaft
export const underground = () => false;
