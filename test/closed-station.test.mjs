// A station that is not open holds nobody. The quarry's and the farm's floor
// plans count the benches and plots they would have, so a place still shut
// used to report room, and a body sent there walked to where the cut will be
// and stood a body-height under the ground line with no working under it.
// The board cannot send anybody to a shut place (it has no board), so the two
// ways in are the roster's own move and a save that says so.

import { group, ok, run, WORKER } from './helpers.mjs';
import { yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { persist } from '../src/persist.js';
import { assign } from '../src/staffing.js';
import { TYPE } from '../src/jobs.js';

const at = type => S.workers.filter(w => w.type === type);
// Feet below the ground line: under the ground, not standing on it.
const under = () => S.workers.filter(w => w.y + WORKER > S.groundY + 1);

group('a body moved to a shut quarry or farm stays on the ground', async () => {
  run(0.4);
  window.__crew(0, 4);
  S.quarryOpen = false;
  S.farmOpen = false;
  assign('quarriers', 1);
  assign('farmhands', 1);
  run(4);
  return [
    ok(S.quarriers === 0 && S.farmhands === 0, 'a shut place takes nobody',
       `${S.quarriers} quarriers, ${S.farmhands} farmhands`),
    ok(at(TYPE.QUARRY).length === 0 && at(TYPE.FARM).length === 0,
       'so no body stands in either',
       `${at(TYPE.QUARRY).length} quarriers, ${at(TYPE.FARM).length} farmhands`),
    ok(under().length === 0, 'and nobody is under the ground',
       JSON.stringify(under().map(w => [w.type, Math.round(w.y)])))
  ];
});

group('a save with a gang at a shut quarry and farm comes back carrying', async () => {
  run(0.4);
  window.__crew(0, 4);
  persist();
  const save = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  save.quarriers = 2;
  save.farmhands = 1;
  save.quarryOpen = false;
  save.farmOpen = false;
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
  yard.restore();
  run(4);
  return [
    ok(S.quarriers === 0 && S.farmhands === 0, 'the counts go back to carrying',
       `${S.quarriers} quarriers, ${S.farmhands} farmhands`),
    ok(at(TYPE.QUARRY).length === 0 && at(TYPE.FARM).length === 0,
       'no body stands at either place',
       `${at(TYPE.QUARRY).length} quarriers, ${at(TYPE.FARM).length} farmhands`),
    ok(under().length === 0, 'and nobody is under the ground',
       JSON.stringify(under().map(w => [w.type, Math.round(w.y)]))),
    ok(S.workers.length === 4, 'all four are still hired', `${S.workers.length}`)
  ];
});
