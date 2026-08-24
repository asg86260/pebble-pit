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
         QUARRY_NEAR_BENCH, QUARRY_FAR_BENCH, QUARRY_FLOOR_STEP, QUARRY_FLOOR_JAG,
         CLIMB_PACE, SHARD_CELL, someFind } from './config.js';
import { S, quarry } from './state.js';
import { walkY } from './world.js';
import { mult } from './lab.js';
import { spawnSpoil } from './dust.js';

// how long a trip takes, at this pace
export const quarryMs = (lvl = S.quarryPaceLevel) =>
  Math.max(500, Math.round(Math.max(QUARRY_FLOOR, QUARRY_BASE * Math.pow(0.82, lvl)) / mult('quarry')));

export const quarryRate = (lvl = S.quarryPaceLevel) => 60000 / quarryMs(lvl);   // trips a minute

// --- the ladder ---------------------------------------------------------------
// Bodies used to sink into the cut and rise out of it wherever they happened to
// be standing, straight down through the air in the middle of the mouth. That
// is the one thing in this yard that was plainly not a thing that could happen:
// everything else walks, climbs a wall or goes through a door.
//
// So there is a ladder, in the near corner where the wall's toe is -- one place,
// worked out from the cut, so the rungs you can see and the line a body climbs
// are the same line by construction. Going in is walking to the head of it and
// coming down it; coming out is walking back along the floor to its foot and
// going up.
export const LADDER_W = P * 3;         // stile to stile
// Its head stands a cell proud of the rim and no more: the bridge's deck runs
// over the mouth four cells up, and a ladder poking through the road is a
// ladder in the way of the thing that crosses it.
export const LADDER_OVER = P;

export function ladder() {
  const c = quarryCut();
  const x = Math.round(c.from / P) * P;
  return { x, w: LADDER_W, top: S.groundY - LADDER_OVER, foot: quarryFloor(c.from + P) };
}

// where a quarrier stands to get on it, going either way
export const quarryFace = () => ladder().x + LADDER_W / 2 - WORKER / 2;

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

// The shape of the cut: both walls stepping down in benches, and the uneven
// floor between them. It is worked out from the mouth once and kept, because
// nothing about it moves unless the world is laid out again -- and because
// `quarryFloor` is asked where the ground is once per quarrier per frame.
//
// The benches are scenery, but the floor is not: the crew stand on it, so the
// same numbers that draw it are the ones that put their feet down.
let cut = null, cutKey = '';

export function quarryCut() {
  const key = `${quarry.x}|${quarry.w}|${quarry.h}|${S.groundY}`;
  if (cut && cutKey === key) return cut;

  const snap = v => Math.round(v / P) * P;
  const deep = snap(S.groundY + quarry.h);

  // one wall, rim to floor. `dir` is which way it eats into the mouth, and the
  // drops are shares of the depth, so the last bench lands exactly on the floor
  // however the pattern is edited.
  const wall = (benches, x0, dir) => {
    const total = benches.reduce((a, b) => a + b[1], 0);
    const pts = [[x0, S.groundY]];
    let x = x0, y = S.groundY;
    benches.forEach(([inset, drop], i) => {
      x = snap(x + dir * inset * quarry.w);
      pts.push([x, y]);                                          // in along the bench
      y = i === benches.length - 1 ? deep : snap(y + (drop / total) * quarry.h);
      pts.push([x, y]);                                          // and down the face
    });
    return pts;
  };

  const near = wall(QUARRY_NEAR_BENCH, quarry.x, 1);
  const far = wall(QUARRY_FAR_BENCH, quarry.x + quarry.w, -1);
  const from = near[near.length - 1][0], to = far[far.length - 1][0];

  // and the floor, in stretches a few cells wide, each sitting a cell or two
  // above the deepest line
  const floor = [];
  for (let i = 0, x = from; x < to; i++) {
    const nx = Math.min(to, x + QUARRY_FLOOR_STEP * P);
    floor.push({ from: x, to: nx, y: deep - QUARRY_FLOOR_JAG[i % QUARRY_FLOOR_JAG.length] * P });
    x = nx;
  }

  // Each wall's toe meets the floor it actually runs into, rather than the
  // deepest line: a wall that dropped past its own floor left a slot at the
  // bottom that reads as a crack rather than a corner.
  near[near.length - 1][1] = floor[0].y;
  far[far.length - 1][1] = floor[floor.length - 1].y;

  // The whole outline, rim to rim, for whoever has to draw it -- with the
  // repeats dropped, because a bench of no width and a stretch of floor that
  // carries on at the same height both put the same point in twice.
  const outline = [];
  const add = ([x, y]) => {
    const last = outline[outline.length - 1];
    if (!last || last[0] !== x || last[1] !== y) outline.push([x, y]);
  };
  near.forEach(add);
  for (const f of floor) { add([f.from, f.y]); add([f.to, f.y]); }
  far.reverse().forEach(add);

  cutKey = key;
  return (cut = { outline, floor, from, to, deep });
}

// The floor of the cut underfoot at x, or its deepest line if nobody is asking
// about a particular spot. They space themselves out along it rather than
// standing in each other, the way the crew on the rock do.
export function quarryFloor(x = null) {
  const c = quarryCut();
  if (x === null) return c.deep;
  for (const s of c.floor) if (x >= s.from && x < s.to) return s.y;
  return c.deep;
}

// the stretch of floor a quarrier may work: between the toes of the two walls
export const quarryBand = () => {
  const c = quarryCut();
  return { lo: c.from, hi: Math.max(c.from, c.to - WORKER) };
};

// somebody already working the stretch this one is about to walk into
function elbowRoom(w, x) {
  return S.workers.some(o => o !== w && o.type === 'quarrier' && o.goal === 'work' &&
                             (o.x - w.x) * w.dir > 0 && Math.abs(o.x - x) < WORKER * 1.3);
}

function seatX(w) {
  const n = Math.max(1, S.quarriers);
  const i = Math.max(0, S.workers.filter(o => o.type === 'quarrier').indexOf(w));
  const { lo, hi } = quarryBand();
  return lo + ((i + 0.5) / n) * (hi - lo);
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

  // walk along the ground to the head of the ladder
  if (w.goal === 'to') {
    w.y = walkY(w.x + WORKER / 2);
    const d = rim - w.x;
    w.x += Math.sign(d) * Math.min(QUARRY_WALK, Math.abs(d));
    if (Math.abs(d) < 1) { w.x = rim; w.goal = 'down'; w.seat = seatX(w); }
    return;
  }

  // down the ladder, hand over hand, and off it at the bottom
  if (w.goal === 'down') {
    w.x = rim;                                   // it holds on: nothing drifts
    const foot = ladder().foot - WORKER;
    w.y = Math.min(w.y + CLIMB_PACE, foot);
    if (w.y >= foot) { w.y = foot; w.goal = 'work'; }
    return;
  }

  // At the face. It swings like a miner does, and every so often a shard comes
  // off and goes up over the rim. Nobody knocks another one loose while the
  // pile outside is full: there would be nowhere to put it.
  w.y = quarryFloor(w.x + WORKER / 2) - WORKER;   // the floor is uneven, so they walk it
  w.lunge *= 0.82;
  // The pile outside is full, so there is nowhere to put another shard and
  // nothing to do but stand about on the floor of the cut. See break.js.
  if (S.pileFull.quarry) { w.resting = true; w.next = now + quarryMs(); return; }
  w.resting = false;

  // It works along the face rather than standing on one spot: back and forth
  // between the walls, turning at the ends and before walking into a mate.
  const { lo, hi } = quarryBand();
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
    // a blaster brings one up twice as often: the face comes down in one go
    w.next = now + quarryMs() / (w.trained ? 2 : 1) * (0.85 + Math.random() * 0.3);
  }
}

// nobody is out of sight any more: the whole point of a cut rather than a shaft
export const underground = () => false;
