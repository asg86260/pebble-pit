// A rockhand up on a rock when the serpent falls is still a rockhand on the
// ground afterward: the freed beat does not walk him off into the hill.
import { group, ok, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';
import { SERPENT_PHASES, SERPENT_WOUND } from '../src/config.js';
import { TYPE } from '../src/jobs.js';
import { wayAt } from '../src/route.js';

const LAST = SERPENT_PHASES - 1;

group('a rockhand on the rock when the serpent falls stays out of the ground', async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(3, 6, 3, 3, 0, 0);
  window.__party({ stations: [{ kind: 'altar', cls: 'sword', rung: 8 }, { kind: 'armory', cls: 'ranger', rung: 6 }] });
  window.__deepCrew({ spare: 2 });
  window.__serpent({ stage: LAST, wound: 0 });
  run(8);
  runUntil(() => S.workers.some(w => w.type === TYPE.ROCK && wayAt(w.x, w.y).key === 'rock'), 90);
  window.__serpent({ stage: LAST, wound: SERPENT_WOUND[LAST] * 0.95 });
  const died = runUntil(() => S.serpentFreed, 60);
  // verify.js asks its rules after every frame: a body in the ground is red
  run(40);
  return [ok(died, 'the party breaks the last defense'), ok(true, 'and no rule went red through the freed beat')];
});
