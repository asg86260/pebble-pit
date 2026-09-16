// A body stood at a cluster takes the whole cluster, claims or no claims.
//
// A claim is a target for empty hands setting off across the yard. Honored
// by the body already stood beside the column, a body ran out to three
// grains, took one, and turned for home because another body a yard away had
// set off for the one beside it -- and that body then walked the length of
// the yard for it. Whoever is nearer keeps it (`keptBy` in crew/hauler.js):
// the body on the spot fills its hands, and the far one sees its column bare
// and picks again.

import { yard, group, ok, state, run, quickCrew, P } from './helpers.mjs';
import { floor } from '../src/state.js';
import { at, colOf } from '../src/grid.js';

group('the body at a cluster takes all of it, not one grain each', async () => {
  window.__reset();
  window.__crew(0, 0);                        // nobody about while the grains go down
  quickCrew();
  window.__levels({ haulCarryLevel: 2 });     // four a load
  window.__clearFloor();
  run(0.2);
  const s0 = state();
  const far = s0.pitX - 1200;
  const xs = [far, far + P * 3, far + P * 6];
  for (const x of xs) window.__pile(x, 1);
  run(1);
  const cols = xs.map(x => colOf(floor, x)).filter(c => at(floor, c, 0));
  // hired only now, so nothing is in hand before the grains have settled
  window.__crew(0, 2);
  const [a, b] = yard.S.workers.filter(w => w.type === 'hauler');
  // one stood at the cluster, the other at the lip end with a claim on the
  // cluster's middle grain
  a.x = far; a.claim = -1; a.goal = 'seek';
  b.x = s0.pitX - 100; b.claim = cols[1]; b.goal = 'seek';
  let aTook = 0, bTook = 0;
  for (let i = 0; i < 30 * 60; i++) {
    run(1 / 60);
    aTook = Math.max(aTook, a.carry || 0);
    bTook = Math.max(bTook, b.carry || 0);
    if (cols.every(c => !at(floor, c, 0))) break;
  }
  window.__crew(0, 0);
  return [
    ok(cols.length === 3, 'three grains lie in a cluster', `${cols.length}`),
    ok(aTook === 3, 'the body stood at it brings all three home', `${aTook} in hand at most`),
    ok(bTook === 0, 'and the one that set off from the lip never carries one of them', `${bTook}`)
  ];
});
