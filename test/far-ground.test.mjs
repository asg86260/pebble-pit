// A grain anywhere on the ground is fetched: there is no ground the crew do
// not fetch from. It used to stop at the first heap -- what lay out past the
// tower was the player's to sweep up -- and a resource thrown out there lay
// for the rest of the game while the crew worked with room in hand.
//
// The pick has no piles in it (`firstPick` in crew/hauler.js): empty hands go
// to the resource farthest from where the rest of the crew are headed, so a
// grain out where nobody is going is exactly where the next body goes.

import { group, ok, state, run, quickCrew, openSites, P } from './helpers.mjs';
import { PILE_LIMIT } from '../src/config.js';
import { floor } from '../src/state.js';
import { at, colOf } from '../src/grid.js';
import { rand } from '../src/rng.js';

const within = (key) => {
  const p = state().piles.find(p => p.key === key);
  return p.from + P * 2 + rand() * (p.to - p.from - P * 4);
};

group('a grain thrown out past the tower is fetched while the rock heap is fed', async () => {
  window.__seed(20250915);
  window.__reset();
  openSites();
  window.__meteor();                          // the star stands, so there is a tower pile to be left of
  window.__crew(0, 6);
  window.__levels({ haulCarryLevel: 4, haulPaceLevel: 4 });
  window.__clearFloor();
  run(0.5);
  for (let i = 0; i < 400 && state().pileCount.rock < PILE_LIMIT.rock; i++) { window.__pile(within('rock'), 10); run(1 / 60); }
  const leftmost = Math.min(...state().piles.map(p => p.from));
  // three grains well out past the leftmost pile, on ground no trip to any
  // heap passes
  const strays = [];
  for (let i = 0; i < 3; i++) {
    const x = Math.max(P * 4, leftmost - P * 40 - i * P * 10);
    window.__pile(x, 1);
    strays.push(colOf(floor, x));
  }
  run(1);
  const lying = () => strays.filter(c => at(floor, c, 0)).length;
  const before = lying();
  let gone = false;
  for (let i = 0; i < 120 * 60 && !gone; i++) {
    window.__pile(within('rock'), 1);         // kept fed: a grain a frame
    run(1 / 60);
    gone = lying() === 0;
  }
  const left = lying();
  window.__reset();
  return [
    ok(before === 3, 'three grains lie out past the leftmost pile', `${before}`),
    ok(gone && left === 0, 'and every one is fetched inside two minutes', `${left} still lying`)
  ];
});
