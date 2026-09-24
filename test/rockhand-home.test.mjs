// A rockhand sent past the hole walks home round it.
//
// A full heap sends the gang to the whole yard's mess, and the far side of the
// hole is part of the yard: down the wall, across the floor and up the other
// side is a route like any other. What brought them back was the layer walk's
// own "climb back to the layer", a straight line at the ground's height that
// knows nothing of what lies between, and it marched the body out over the
// hole on nothing.

import { group, ok, state, run, yard, P } from './helpers.mjs';
import { PILE_LIMIT, WORKER } from '../src/config.js';
import { pit } from '../src/state.js';
import { rockLeft } from '../src/world.js';
import { TYPE } from '../src/jobs.js';

const rockStrip = () => state().piles.find(p => p.key === 'rock');
const jam = () => { const p = rockStrip(); window.__pile((p.from + p.to) / 2, 10); };
const onRock = w => {
  const mid = w.x + WORKER / 2;
  return mid >= rockLeft() - WORKER && mid <= rockLeft() + yard.S.gw * P + WORKER;
};

group('a rockhand that shoveled past the hole walks home round it', async () => {
  window.__reset();
  window.__crew(2, 0);
  window.__clearFloor();
  run(1);
  // The rock's heap over its line, and nobody to carry it off: the gang have
  // nothing to do but the yard's mess.
  for (let i = 0; i < 400 && state().pileCount.rock < PILE_LIMIT.rock; i++) { jam(); run(1 / 60); }
  // And the only mess there is lies just past the far lip of the hole.
  const far = Math.ceil((pit.x + pit.cols * P) / P);
  const laid = window.__muckSet(c => (c >= far + 2 && c < far + 6 ? 2 : 0));

  const gang = () => yard.S.workers.filter(w => w.type === TYPE.ROCK);
  let crossed = false;
  for (let s = 0; s < 240 && !(crossed && gang().every(onRock)); s++) {
    if (!yard.S.pileFull.rock) jam();
    run(0.5);
    if (gang().some(w => w.x + WORKER / 2 > pit.x + pit.cols * P)) crossed = true;
  }
  return [
    ok(laid > 0, 'there is mess past the hole', `${laid}`),
    ok(yard.S.pileFull.rock, 'and the rock heap is still full'),
    ok(crossed, 'a rockhand goes over to shovel it'),
    // The walk over the hole on nothing is verify.js's rule 9, watched every
    // frame of the run; this is that they get back at all.
    ok(gang().every(onRock), 'and every rockhand is back on the rock',
       gang().map(w => Math.round(w.x)).join(', '))
  ];
});
