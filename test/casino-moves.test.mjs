// The casino is pinned at the far end of the yard, so every site that grows
// on its rock side -- the apothecary's pots most of all -- walks it along.
// Its two plots of sand, the funnel on the roof and the tray in the foot,
// have to walk with it, or the stake pours into a funnel standing where the
// building used to be.

import { yard, group, ok, state, run, runUntil } from './helpers.mjs';
import { P } from '../src/config.js';
import { table, tray, casino } from '../src/state.js';

group('the funnel and the tray move with the casino', async () => {
  window.__reset();
  window.__casino(true);
  window.__give(6000);
  window.__dig(23);
  window.__build();
  run(0.1);
  const x0 = casino.x;
  // the apothecary opened and grown to four pots: the ground is laid again
  yard.S.apothecaryOpen = true;
  yard.S.apothPots = 4;
  run(0.1);
  // and a stake poured in the way a player does
  window.__holdArm(true, 1);
  run(0.6);
  window.__holdArm(false);
  runUntil(() => !state().pouring && state().tableAir === 0, 30);
  const stood = state();
  return [
    ok(casino.x !== x0, 'the casino has been walked along', `${x0} -> ${casino.x}`),
    ok(table.x === casino.x + P && table.y === casino.y, 'the funnel stands on its roof', `funnel at ${table.x}, building at ${casino.x}`),
    ok(tray.x === casino.x + P && tray.y === casino.y + casino.h - tray.rows * P, 'the tray stands in its foot', `tray at ${tray.x}`),
    ok(stood.pot && stood.pot.stake > 0 && stood.table > 0, 'and the stake heaps in it', `${stood.table} grains for ${stood.pot && stood.pot.stake}`)
  ];
}, { reload: false });
