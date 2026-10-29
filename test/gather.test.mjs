// Where a gatherer goes for scales (DESIGN.md, "The deep is paced by its
// purse"): the stretch that banks the most for the swim, so a load lying
// near the crusher is taken before a taller heap across the deep.

import { source } from '../src/flow.js';
import { group, ok, yard, runUntil } from './helpers.mjs';
import { P, WORKER } from '../src/config.js';
import { deepBed } from '../src/state.js';
import { addGrain } from '../src/grid.js';
import { tossX } from '../src/deep/place.js';

const S = yard.S;
const gatherers = () => S.workers.filter(w => w.type === 'gatherer');
const lay = (x, n) => { for (let i = 0; i < n; i++) if (addGrain(deepBed, x, null, 3, true)) source('scale', 1, 'test setup'); };

group('a gatherer takes the load lying near the crusher before the tall heap across the deep', async () => {
  // The snatch's facts with no station: played, it stands the first one,
  // and the one hand down there would be its fighter.
  window.__crew(0, 4);
  window.__deepCrew({ spare: 1 });
  const near = tossX() + P * 20, far = deepBed.x + deepBed.cols * P - P * 20;
  lay(near, 12);
  lay(far, 200);
  // The first stretch it swims to and starts scooping. Under water a heap
  // lies down, so the tall one spreads well toward the near load; the check
  // is that it scoops at the load itself.
  const g = () => gatherers()[0];
  await runUntil(() => g() && g().goal === 'scoop', 60);
  const at = g() ? g().x + WORKER / 2 : NaN;
  return [
    ok(gatherers().length === 1, 'one gatherer down there', `${gatherers().length}`),
    ok(Math.abs(at - near) < P * 10, 'it scoops at the near load, not the tall heap',
       `at ${Math.round(at)}, near ${Math.round(near)}, far ${Math.round(far)}`)
  ];
}, { reload: false });
