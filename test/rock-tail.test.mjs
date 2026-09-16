// The end of a rock. The last few cells are a swing each; what made them slow
// was the walk to them. A gang that has taken the hill down around itself is
// off the working layer, and a hand off the layer walks back to it -- at the
// pace the same body crosses the yard at, not a bench-shuffle and a half. The
// player sees a rock that is finished and a gang mozying the width of it.

import { group, ok, run, runUntil, haveRock, P } from './helpers.mjs';
import { S } from '../src/state.js';
import { refreshRockTops } from '../src/rock.js';
import { rockLeft } from '../src/world.js';
import { COMMUTE_PACE } from '../src/config.js';

// A rock down to its last handful, all of it in the far columns, with the gang
// stood at the near end -- exactly how a rock ends when the layer is worked
// from one side.
const lastHandful = () => {
  for (let y = 0; y < S.gh; y++) for (let x = 0; x < S.gw; x++) S.boulder[y][x] = 0;
  const foot = S.gh - 1;
  for (let x = S.gw - 3; x < S.gw; x++) S.boulder[foot][x] = 1;
  refreshRockTops();
  S.workers.filter(w => w.type === 'rockhand').forEach(w => {
    w.x = rockLeft() + P;                  // the near end
    w.foot = w.footAt = null;
  });
  S.dirty = true;
};

group('the last cells of a rock are reached at a walk', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__jump(3);
  haveRock();
  run(2);
  lastHandful();
  const gw = S.gw;
  const budget = Math.ceil((gw * P) / COMMUTE_PACE / 60) + 2;   // the walk, and a swing or two
  // The next rock is down within two seconds of the last (core.js), so
  // sampled a second at a time the count is the thing to watch, not the cells.
  const no = S.boulderNo;
  const gone = runUntil(() => S.boulderNo > no, budget);
  return [
    ok(gone, `three cells at the far end of a ${gw}-cell rock are gone within ${budget}s`,
       `rock left: ${S.boulder.flat().filter(v => v > 0).length} cells`)
  ];
});
