// A grain dropped on heaped ground spreads along the ground it landed on and
// never out of it. Bare yard is ground of its own -- the stretch between two
// strips -- and not "no ground at all": a grain let go on a full stretch of it
// must not walk into the station's strip next door, which would be a heap
// growing where nobody carried anything.

import { group, ok } from './helpers.mjs';
import { floor } from '../src/state.js';
import { at, put, addGrain, roomFor, topRow } from '../src/grid.js';
import { P } from '../src/config.js';

// Every column of bare yard stood up to its own ceiling, the strips left as
// they are: the bare ground is as full as the bank lets it be.
function fillBare() {
  for (let c = 0; c < floor.cols; c++) {
    if (floor.region(c) !== null || (floor.blocked && floor.blocked(c))) continue;
    for (let r = topRow(floor, c) + 1; r < floor.rows && roomFor(floor, c, r); r++) put(floor, c, r, 1);
  }
}

const inStrips = () => {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (floor.region(c) === null) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
};

group('a grain on full bare ground never lands in the strip beside it', async () => {
  window.__clearFloor();
  fillBare();
  // The bare column hard against a strip's edge, on either side of every
  // strip there is: the shortest walk there is into somebody else's heap.
  const edges = [];
  for (let c = 1; c < floor.cols; c++) {
    const a = floor.region(c - 1), b = floor.region(c);
    if (a === b) continue;
    const bare = a === null ? c - 1 : b === null ? c : -1;
    if (bare < 0 || (floor.blocked && floor.blocked(bare)) || topRow(floor, bare) < 0) continue;
    edges.push(bare);
  }
  const before = inStrips();
  const landed = edges.map(c => addGrain(floor, floor.x + c * P + P / 2));
  const after = inStrips();
  return [
    ok(edges.length > 0, 'there is bare ground beside a strip to drop on', `${edges.length} edges`),
    ok(after === before, 'not one grain walked into a strip', `${after - before} of ${edges.length} did`),
    ok(landed.every(l => !l), 'with its own ground full, it had nowhere to go',
       `${landed.filter(Boolean).length} landed`),
  ];
});
