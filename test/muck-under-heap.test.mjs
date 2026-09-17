// Muck rained onto a wide heap is shifted like muck anywhere else.
//
// Rain lays muck on every column, heaps included. Muck on loose ground slides
// to the nearest solid ground (`slideOffLoose`), but only MESS_SLIDE cells, and
// a heap can be wider than twice that: the rock's bank, a station's strip at
// its limit. A column in the middle stays put, and the shovel refuses any
// patch whose footing is further off than a body's width, so every body with
// a mind to clean claimed it and dropped it, a frame at a time, for ever.

import { group, ok, state, run, openSites, P } from './helpers.mjs';
import { floor } from '../src/state.js';
import { colOf } from '../src/grid.js';

group('muck under a wide heap is cleared', async () => {
  window.__seed(20260917);
  window.__reset();
  openSites();
  window.__crew(0, 4);
  window.__air({ janitors: 1 });
  window.__clearFloor();
  run(0.5);
  // A bank sixty cells wide, well past twice MESS_SLIDE, on the open ground
  // between the farm's strip and the quarry's.
  const farm = state().piles.find(p => p.key === 'farm');
  const quarry = state().piles.find(p => p.key === 'quarry');
  const mid = (farm.to + quarry.from) / 2;
  const from = colOf(floor, mid - P * 30), to = colOf(floor, mid + P * 30);
  for (let c = from; c <= to; c++) window.__pile(c * P + P / 2, 4);
  run(0.5);
  // and a rain's worth of muck over the middle of it only
  const laid = window.__muckSet(c => (c >= from + 20 && c <= to - 20 ? 3 : 0));
  const left = () => window.__state().muckAt.reduce((n, [, v]) => n + v, 0);
  const before = left();
  run(90);
  const after = left();
  window.__reset();
  return [
    ok(laid > 0 && before === laid, 'muck lies on the middle of a wide heap', `${laid}`),
    ok(after < before / 2, 'and most of it is gone within ninety seconds', `${before} -> ${after}`)
  ];
});
