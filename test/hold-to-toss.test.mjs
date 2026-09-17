// Hold to toss: a button held down near a pile grabs handfuls off it and
// throws them at the hole by itself, as far as the reach ladder lets it,
// leaving whatever is in the hand alone (`holdToToss` in game.js,
// `tossFromPile` in hands.js).

import { group, ok, state, run, P } from './helpers.mjs';
import { S, floor, pit } from '../src/state.js';
import { at } from '../src/grid.js';
import { LADDER, TOSS_NEAR } from '../src/config.js';

// Grains standing between two x's, read straight off the ground.
const grainsBetween = (x0, x1) => {
  let n = 0;
  const c0 = Math.max(0, Math.round((x0 - floor.x) / P)), c1 = Math.min(floor.cols - 1, Math.round((x1 - floor.x) / P));
  for (let c = c0; c <= c1; c++) for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  return n;
};

// A hand held still over a heap `n` grains big at `x`, for `seconds`.
function holdOver(x, n, seconds) {
  window.__clearFloor();
  window.__pile(x, n);
  run(0.5);
  S.mouse.x = x; S.mouse.y = S.groundY - P * 2;
  S.dragging = true;
  S.nextToss = 0;
  run(seconds);
  S.dragging = false;
  S.held = 0; S.motes = [];
}

group('a held hand throws the heap under it into the hole once hold to toss is bought', async () => {
  window.__reset();
  window.__crew(0, 0);                       // nobody to carry what the hand throws short
  run(1);
  S.carryLevel = 3;                          // a few grains a handful, so it takes several throws
  const near = pit.x - P * 12;               // the end of the rock's strip, a stride from the lip
  const before = state().stored;
  holdOver(near, 40, 4);
  const unbought = state();
  S.autoToss = true;
  S.tossReachLevel = LADDER;
  holdOver(near, 40, 9);
  run(3);                                    // the last handful is still in the air
  const bought = state();
  return [
    ok(unbought.stored === before, 'nothing is thrown while it is not bought', `${before} -> ${unbought.stored}`),
    ok(bought.stored >= unbought.stored + 18, 'and a few handfuls of it are in the hole once it is',
       `${unbought.stored} -> ${bought.stored}`),
    ok(grainsBetween(near - P * 12, near + P * 12) <= 40 - 18, 'and the heap is smaller by what went',
       `${grainsBetween(near - P * 12, near + P * 12)} left`)
  ];
});

group('the handful comes off the pile, not out of the hand', async () => {
  window.__reset();
  window.__crew(0, 0);
  run(1);
  S.autoToss = true;
  S.carryLevel = 3;
  S.tossReachLevel = LADDER;
  const near = pit.x - P * 12;
  // A hand already holding something, held just off the heap's near end: the
  // heap still goes, and what was in the hand is still in it.
  window.__clearFloor();
  window.__pile(near, 40);
  run(0.5);
  S.held = 2; S.motes = [{ s: 1 }, { s: 1 }];
  const stored = state().stored;
  const heap = grainsBetween(near - P * 6, near + P * 6);
  S.mouse.x = near - P * 6 - TOSS_NEAR / 2; S.mouse.y = S.groundY - P * 2;
  S.dragging = true;
  S.nextToss = 0;
  run(9);
  S.dragging = false;
  const held = S.held;
  S.held = 0; S.motes = [];
  run(3);
  const after = state();
  const left = grainsBetween(near - P * 6, near + P * 6);
  return [
    ok(held === 2, 'the hand still holds what it held', `${held} in hand`),
    ok(left < heap, 'and the heap it was near is smaller', `${heap} -> ${left}`),
    ok(after.stored > stored, 'and that is what went into the hole', `${stored} -> ${after.stored}`)
  ];
});

group('a hand at the foot of the reach ladder throws its handful short, onto the ground toward the hole', async () => {
  window.__reset();
  window.__crew(0, 0);                       // nobody to carry what the hand throws short
  run(1);
  S.autoToss = true;
  S.carryLevel = 3;
  S.tossReachLevel = 0;
  const far = pit.x - P * 140;               // well past a first-rung throw of the lip, on bare ground left of the rock
  const stored = state().stored;
  holdOver(far, 30, 9);
  run(3);
  const after = state();
  const short = grainsBetween(far + P * 8, pit.x - P);
  return [
    ok(after.stored === stored, 'nothing reaches the hole', `${stored} -> ${after.stored}`),
    ok(short >= 12, 'and the handfuls lie on the ground between the hand and the lip', `${short} grains`)
  ];
});
