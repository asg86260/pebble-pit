// The call to build the bench.
//
// The bench used to be the one thing in this yard that teleported. A step in
// game.js watched `canAfford()`, and the frame it first went true it set
// `S.seenBench` and a workbench stood on ground that had been bare -- no walk,
// no fence, nobody swinging anything. It was also the first structure a player
// ever saw, so the mechanic the whole middle of the game is made of was first
// met somewhere around the shack, in a yard busy enough to miss it against.
//
// So it is built, by the one body you have, and it is the first thing the game
// teaches. Nothing appears when the first row becomes affordable except a call
// to build; press it and an ordinary work opens on the yard, the lending rule
// in `rebalance` takes your only digger off the rock, and it walks over and
// hammers a bench up while the dust stops climbing. That is the bargain every
// later decision in this game is a version of, shown at the one moment there is
// exactly one body and exactly one other thing it could be doing.
//
// See DESIGN.md, "The bench is built, not delivered". The button itself is the
// page's business and lives in board.js with the rest of the page; this file is
// the yard's half -- what is being built, whether the call is out, and what
// pressing it does -- so the node tier can press it without a document.

import { WORK_BASE } from './config.js';
import { S, bench } from './state.js';
import { canAfford } from './upgrades.js';
import { registerRows, start, workOn } from './works.js';
import { lookAt } from './world.js';

// The bench's key is `raisebench`, and it is on no board.
//
// It needs a row at all because works.js finishes a work by calling
// `rowFor(w.key).buy()` -- that is how a work coming back out of a save knows
// what it was for, a function being not a thing you can write down. Every other
// row in the game is also something you press; this one is pressed by the call
// below instead, which is the only difference between it and the rest.
const RAISE_BENCH = {
  key: 'raisebench',
  name: 'the bench',
  // A building, which is what earns it the barriers, the tape and the clip that
  // shows only as much of it as has actually gone up -- see `risingPlaces` in
  // render/rise.js, which asks a row what it raises.
  kind: 'building',
  // ...but a bench's worth of work rather than a building's. `WORK_BASE.building`
  // is forty-five worker-seconds and was written for the lab and the school;
  // `place` is the figure for "a bench in the cut, a furrow, a hat off the
  // stand", and a work bench is that size of job. It is also the one number in
  // the table that runs while there is one body in the yard and nothing else to
  // watch, which is where a long number feels longest.
  work: () => WORK_BASE.place,
  // Where it stands, for the fence, the bar and the body: the bench's own rect,
  // read live because the layout moves with the window.
  box: () => ({ x: bench.x, w: bench.w, y: bench.y, h: bench.h }),
  // and which place is coming out of the ground, for the clip
  raises: 'bench',
  buy: () => { S.seenBench = true; S.dirty = true; }
};
registerRows([RAISE_BENCH]);

// Whether the bench is going up this second -- asked by the draw, which shows
// the part of it that is built, and by the call, which is not out while it is.
export const raising = () => !!workOn('raisebench');

// Whether the call is standing there.
//
// Derived from three facts the yard already holds, so nothing new is saved: the
// bench is not up, it is not going up, and there is something on it worth
// having. A save taken mid-build comes back mid-build, because the work itself
// rides in `S.works.yard` like every other.
export const callOut = () => !S.seenBench && !raising() && canAfford();

// Pressed. The one door in: the button on the page calls this and so does the
// check, so what a check proves is what a player does.
export function raiseBench() {
  if (!callOut()) return false;
  // And the view goes to it if it is not already there: on a window that
  // opens on the rock alone the bench is off to the left, and the first build
  // in the game -- the one the mechanic is taught by -- was happening
  // off-screen (docs/critics-2026-09-10.md, C2).
  const mid = bench.x + bench.w / 2;
  const sx = (mid - S.camX) * S.zoom;
  if (sx < 0 || sx > S.W) lookAt(mid);
  return start('yard', RAISE_BENCH, mid);
}
