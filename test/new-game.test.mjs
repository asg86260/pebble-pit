// A new game is a yard nobody has played: whatever the old crew had in their
// hands goes with them, and none of it lands on the new ground.

import { group, ok, run, quickCrew, haveRock, yard } from './helpers.mjs';
import { floor } from '../src/state.js';

const S = yard.S;

group('a reset leaves no dust behind: the old crew walk off with empty hands', async () => {
  quickCrew();
  haveRock();
  run(2);
  // A body with a load in hand (the setup this check is not about).
  const w = S.workers[0];
  w.carry = 5; w.load = [1, 1, 1, 1, 1];
  const carrying = true, held = S.workers.reduce((a, b) => a + (b.carry || 0), 0);
  // The dev panel's "reset the game" and a player's new yard both come here.
  window.__reset(true, true);
  run(3);
  return [
    ok(carrying && held > 0, 'the old crew had dust in hand', `${held}`),
    ok(floor.n === 0 && S.chips.length === 0, 'and none of it is on the new ground or in the air', `floor ${floor.n}, chips ${S.chips.length}`),
    ok(!S.coreItem, 'nor a core', JSON.stringify(S.coreItem))
  ];
});
