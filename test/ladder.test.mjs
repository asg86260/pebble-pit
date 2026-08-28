// Every upgrade is a ladder with an end, and the row says where it is on it.
//
// What this is checking is the shape rather than the numbers: that a ladder
// stops, that it stops where the game's own floor is rather than at some level
// nobody wrote down, that nothing can be bought past the top, and that the rungs
// above the first tier are priced in their own coin *and* in dust -- which is
// what keeps the rock worth digging for the whole run. See "The ladder" in
// DESIGN.md.

import { group, ok, state, yard } from './helpers.mjs';

import { RUNGS, MINE_FLOOR } from '../src/config.js';
import { maxed } from '../src/upgrades.js';

const row = key => window.__upgrades().find(u => u.key === key);

group('a ladder has an end, and says where you are on it', async () => {
  window.__reset();
  window.__crew(1, 0);
  window.__give(2000000);
  window.__grant({ shards: 40000, spores: 40000 });

  const strength = row('carry');
  const start = strength.rung();
  // buy it all the way up, one rung at a time
  const seen = [];
  for (let i = 0; i < 12; i++) {
    seen.push(strength.rung());
    window.__buy('carry');
  }
  const top = strength.rung();
  const cost0 = window.__upgrades().find(u => u.key === 'carry');

  return [
    ok(start === 0, 'a new yard starts at the bottom of it', `${start}`),
    ok(top === RUNGS, 'and twelve purchases get five rungs',
       `${top} of ${RUNGS}`),
    ok(seen.filter((v, i) => i && v === seen[i - 1]).length > 0,
       'because the last few did nothing at all', JSON.stringify(seen)),
    ok(maxed(cost0), 'and the row knows it is finished')
  ];
});

group('a rate ladder ends exactly on the floor it always had', async () => {
  window.__reset();
  window.__crew(1, 0);
  window.__give(2000000);
  window.__grant({ shards: 40000, spores: 40000 });
  // the swing row is not offered until the swinging is automatic, which is the
  // row above it on the same board
  window.__buy('auto');
  const before = state().mineMs;
  for (let i = 0; i < 10; i++) window.__buy('speed');
  const after = state();
  return [
    ok(before > after.mineMs, 'the swing gets faster', `${before}ms -> ${after.mineMs}ms`),
    // The floor was always there. What is new is that the ladder lands on it
    // rather than approaching it for ever and then vanishing off the board.
    ok(after.mineMs === MINE_FLOOR,
       'and the last rung is the fastest a pick has ever gone',
       `${after.mineMs}ms against a floor of ${MINE_FLOOR}ms`)
  ];
});

group('above the first tier a rung costs its own coin and dust', async () => {
  window.__reset();
  window.__crew(1, 0);
  window.__grant({ shards: 500, spores: 500 });   // no dust at all
  const poor = state();
  const gotNothing = window.__buy('pick');
  const stillPoor = state();

  window.__give(50000);
  const gotIt = window.__buy('pick');
  const rich = state();
  return [
    ok(poor.shards >= 100, 'there is blue to spend', `${poor.shards}`),
    ok(stillPoor.pickLevel === poor.pickLevel,
       'and blue on its own does not buy a rung',
       `${poor.pickLevel} -> ${stillPoor.pickLevel}`),
    ok(rich.pickLevel === poor.pickLevel + 1,
       'blue and dust together do', `${stillPoor.pickLevel} -> ${rich.pickLevel}`),
    ok(rich.shards < stillPoor.shards && rich.stored < 50000,
       'and both were taken', `${stillPoor.shards}->${rich.shards} blue, ${rich.stored} dust`)
  ];
});
