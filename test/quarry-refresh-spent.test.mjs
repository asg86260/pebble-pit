// Reported 2026-09-14: quarriers going up and down the ladder for ever after a
// refresh caught them climbing out of a finished cut. `quarrySpent` is not
// saved, so the page came back with a dug-out cut and a flag saying it was
// not spent; every body went back down, found nothing, came up -- and with
// somebody always below, nobody was ever the last one out who fills the hole.
// The rim asks the ground now, and fills it itself when nobody is left below.

import { group, ok, run, runUntil } from './helpers.mjs';
import { yard } from './helpers.mjs';
import { persist } from '../src/persist.js';
import { S } from '../src/state.js';
import { WORKER } from '../src/config.js';
import { quarryDone, cellsLeft } from '../src/quarry.js';

const quarriers = () => S.workers.filter(w => w.type === 'quarrier');

group('a refresh that catches the gang climbing out of a finished cut does not send them up and down for ever', async () => {
  window.__crew(0, 0, 3, 0); window.__fullSites(); window.__tip(90000);
  runUntil(() => quarriers().some(w => w.goal === 'work'), 60);
  runUntil(quarryDone, 900);
  // Frame by frame until one of them is on the rungs on its way out.
  let caught = false;
  for (let f = 0; f < 60 * 40 && !caught; f++) {
    run(1 / 60);
    caught = quarriers().some(w => w.goal === 'up' && w.y + WORKER < S.groundY + 40 && w.y + WORKER > S.groundY + 4);
  }
  persist();
  yard.restore();
  // A page loaded fresh starts every ephemeral field blank; the node yard's
  // restore keeps the running one, so blank it the way the page would.
  S.quarrySpent = false;
  const dugOut = quarryDone();
  // Two minutes: a body's climb out is seconds, the fill is one frame after.
  let climbs = 0;
  for (let t = 0; t < 120 && !cellsLeft(); t++) { run(1); climbs += quarriers().filter(w => w.goal === 'up').length; }
  return [
    ok(caught, 'the save caught a body on the ladder, climbing out'),
    ok(dugOut, 'and the cut came back dug out'),
    ok(cellsLeft() > 0, 'the ground came back in behind the last one out', `left ${cellsLeft()}`),
    ok(climbs < 30, 'without minutes of climbing first', `${climbs} body-seconds going up`),
  ];
});
