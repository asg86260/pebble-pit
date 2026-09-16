// Dust that lies off every strip is fetched, even while a heap is jammed.
//
// There are no piles in the pick (`firstPick` in crew/hauler.js): a body
// goes to the grain farthest from where the rest of the crew are headed, and
// a grain off every strip is as much a target as any. Before that, the
// pick was a find, the fullest jammed heap, then the nearest dust -- and once
// a machine kept the rock's heap over its line for the rest of the run,
// "then the nearest dust" never happened again: a grain out past the strips
// lay there for ever with six bodies at work.

import { group, ok, state, run, openSites, P } from './helpers.mjs';
import { PILE_LIMIT } from '../src/config.js';
import { floor } from '../src/state.js';
import { at, colOf } from '../src/grid.js';
import { rand } from '../src/rng.js';

const within = (key) => {
  const p = state().piles.find(p => p.key === key);
  return p.from + P * 2 + rand() * (p.to - p.from - P * 4);
};

// The rock's heap over its line and fed faster than the crew can clear it,
// the way a ram keeps it; and a few grains on the bare ground between the
// farm's strip and the quarry's, where no trip to any heap passes.
group('a grain on the open ground is fetched while the rock heap stays jammed', async () => {
  window.__seed(20250915);
  window.__reset();
  openSites();
  window.__crew(0, 6);
  window.__levels({ haulCarryLevel: 4, haulPaceLevel: 4 });
  window.__clearFloor();
  run(0.5);
  for (let i = 0; i < 400 && state().pileCount.rock < PILE_LIMIT.rock; i++) { window.__pile(within('rock'), 10); run(1 / 60); }
  const farm = state().piles.find(p => p.key === 'farm');
  const quarry = state().piles.find(p => p.key === 'quarry');
  const open = (farm.to + quarry.from) / 2;
  const strays = [];
  for (let i = 0; i < 5; i++) {
    const x = open - P * 20 + i * P * 10;
    window.__pile(x, 1);
    strays.push(colOf(floor, x));
  }
  run(1);
  const lying = () => strays.filter(c => at(floor, c, 0)).length;
  const before = lying();

  // kept jammed: a grain a frame onto the rock's strip is far more than six
  // bodies carry
  let full = 0, frames = 0, gone = false;
  for (let i = 0; i < 120 * 60 && !gone; i++) {
    window.__pile(within('rock'), 1);
    run(1 / 60);
    frames++;
    if (state().pileFull.rock) full++;
    gone = lying() === 0;
  }
  const left = lying();
  window.__reset();
  return [
    ok(before === 5, 'five grains lie on the open ground between the strips', `${before}`),
    ok(full / frames > 0.8, 'the rock heap is jammed for nearly the whole run', `${(100 * full / frames).toFixed(0)}%`),
    // never fetched before; two minutes is one walk out and back, with room
    ok(gone && left === 0, 'and every loose grain is fetched inside two minutes', `${left} still lying`)
  ];
});
