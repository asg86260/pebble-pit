// A body with room in hand takes what is nearest, whatever ground it is on.
//
// A heap sheds onto the bare ground beside its strip, and a body working the
// heap used to stop at the strip's edge: the grains a cell past it were on
// no ground it was working and lay there for good, with bodies walking past
// them with room in hand. Now the next thing taken is the nearest thing
// (`nextNear` in crew/hauler.js), strip or no strip, until the hands are full.

import { group, ok, state, run, quickCrew, openSites, P } from './helpers.mjs';
import { floor } from '../src/state.js';
import { at, colOf } from '../src/grid.js';

const carrying = () => Number(state().crewDetail.find(d => d[0] === 'h').split('|')[3].slice(1));

group("a heap's grains past its strip come home with the heap's", async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0);
  quickCrew();
  window.__levels({ haulCarryLevel: 2 });     // four a load
  window.__clearFloor();
  run(0.3);
  const q = state().piles.find(p => p.key === 'quarry');
  // two grains on the strip's first columns, then two just off its end --
  // the strip's first, so the strip is the older ground and the trip's target
  window.__pile(q.from + P * 2, 1);
  window.__pile(q.from + P * 3, 1);
  run(1);
  window.__pile(q.from - P * 2, 1);
  window.__pile(q.from - P * 3, 1);
  run(1);
  const cap = state().haulCap;
  const on = c => at(floor, c, 0) ? 1 : 0;
  const cols = [q.from + P * 2, q.from + P * 3, q.from - P * 2, q.from - P * 3].map(x => colOf(floor, x));
  const lying = () => floor.n;
  const before = lying();
  window.__crew(0, 1);
  window.__place('hauler', state().pitX - 60);
  // until the first load is tipped
  let had = 0, took = 0, tossed = false;
  for (let i = 0; i < 90 * 60 && !tossed; i++) {
    run(1 / 60);
    const c = carrying();
    if (had > 0 && c === 0) { tossed = true; took = had; }
    had = c;
  }
  const left = lying();
  window.__crew(0, 0);
  return [
    ok(cap === 4 && before === 4, 'four grains on the ground and hands that hold four', `${before} lying, hands ${cap}`),
    ok(tossed && took === 4, 'all four come home on the one trip', `${took} tipped, ${left} left`),
    ok(left === 0, 'and none of them is left past the end of the strip', `${cols.map(on).join('')}`)
  ];
});
