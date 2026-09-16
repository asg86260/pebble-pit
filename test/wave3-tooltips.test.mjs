// Track D: tooltips & menu target.
//
// D1 -- a hover label for whatever the cursor is over, in one word:
// `whatIsAt` in input.js. It is a pure question about a spot in the yard, so
// these checks ask it directly rather than moving a mouse.
//
// D2 -- the house board's hit target is the whole structure, `houseRect()`
// and all of it, not a band at the door.

import { group, ok, state, run, openSites, P, yard } from './helpers.mjs';
import { whatIsAt } from '../src/input.js';
import { colOf, topRow, bottomY } from '../src/grid.js';
import { nearHouse } from '../src/board.js';
import { houseRect } from '../src/house.js';

// D1 -- a placed grain reads as what the boards call it.
group('a placed grain on the ground reads as a pebble', async () => {
  window.__reset();
  const x = yard.floor.x + P * 10;
  window.__pile(x, 3);
  const c = colOf(yard.floor, x);
  const r = topRow(yard.floor, c);
  const label = r >= 0 ? whatIsAt(x + P / 2, bottomY(yard.floor) - (r + 0.5) * P) : null;

  return [
    ok(r >= 0, 'the grain actually landed', `row ${r}`),
    ok(label === 'pebble', 'and the cursor over it reads "pebble"', `got ${label}`)
  ];
});

// D1 -- a body reads as its job.
group('a body reads as the job it does', async () => {
  window.__reset();
  window.__crew(1);              // one rockhand, straight off
  run(0.1);
  const w = yard.S.workers.find(o => o.type === 'rockhand');
  const label = w ? whatIsAt(w.x + 4, w.y + 4) : null;

  return [
    ok(!!w, 'a rockhand is standing in the yard'),
    ok(label === 'rockhand', 'and the cursor over it reads its job', `got ${label}`)
  ];
});

// D1 -- a building reads by the name its own board uses.
group('a building reads by the name its own board calls it', async () => {
  window.__reset();
  yard.S.seenBench = true;
  run(0.1);
  const b = yard.bench;
  const label = whatIsAt(b.x + b.w / 2, b.y + b.h / 2);

  return [
    ok(label === 'the bench', 'the bench reads as "the bench"', `got ${label}`)
  ];
});

// D1/C5 -- the farm and the quarry read off the shed C5 gave them, not off
// the plots or the mouth of the hole.
group('the farm and the quarry read off their own shed', async () => {
  openSites();
  run(0.5);
  const s = state();
  const fs = s.farmShed, qs = s.quarryShed;
  const farmLabel = whatIsAt(fs.x + fs.w / 2, fs.y + fs.h / 2);
  const quarryLabel = whatIsAt(qs.x + qs.w / 2, qs.y + qs.h / 2);

  return [
    ok(farmLabel === 'the farm', 'the farm reads off its shed', `got ${farmLabel}`),
    ok(quarryLabel === 'the quarry', 'the quarry reads off its shed', `got ${quarryLabel}`)
  ];
});

// D1 -- empty sky has nothing to say. Not on the table, so no label rather
// than a guess.
group('empty sky has no label at all', async () => {
  window.__reset();
  run(0.1);
  const label = whatIsAt(yard.S.cx, -5000);

  return [
    ok(label === null, 'a spot in the empty sky reads as nothing', `got ${label}`)
  ];
});

// D2 -- the whole house, roof included, is the hit target now, not a band at
// the door. Ten bodies stack the settlement two courses high (see `cubes` in
// house.js), well past the old band's ten-cell reach up from the ground.
group('the whole house is the hit target, roof included', async () => {
  window.__reset();
  window.__crew(10);
  run(1);
  const r = houseRect();

  return [
    ok(r.h > P * 10, 'the settlement stands taller than the old door-band did',
       `${r.h}`),
    ok(nearHouse(r.x + r.w / 2, r.y + 2),
       'the roof answers to a hover the same as the door', JSON.stringify(r)),
    ok(whatIsAt(r.x + r.w / 2, r.y + r.h / 2) === 'house',
       'and the hover label there is "house"')
  ];
});
