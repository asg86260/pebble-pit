// A door opens with somebody already in it: every place that is worked -- the
// plots, the cut, the air filter, the janitor's closet, the apothecary --
// sends one spare body over the frame it lands, through the same `assign` the
// board's + button uses. Nobody idle, and the count stays where it was: the
// door asks the way the button asks, and the button says no.

import { group, ok, run, runUntil, buyBuilt, yard } from './helpers.mjs';
import { JOB, JOB_OF } from '../src/jobs.js';

const S = yard.S;

// Every gate a door waits on, thrown open at once. None of it is what these
// groups are about; the door being pressed is. The crew goes first, because
// `__crew` puts every machine back in its box.
const rich = (...crew) => {
  window.__reset();
  window.__crew(...crew);
  window.__grant({ cores: 9, dust: 90000, shards: 900, spores: 900, sparks: 500 });
  window.__answered('props', 'net', 'arch');
  // the air filter is sold after the first rain, with a machine running
  window.__machine('ram', { bought: true });
  window.__air({ rains: 1 });
  S.seenAir = true;
  S.seenMess = true;
  S.seenSpore = true;
};

const DOORS = [
  ['unlockfarm',       JOB.FARM],
  ['unlockquarry',     JOB.QUARRY],
  ['unlockfilter',      JOB.PURIFY],
  ['unlockouthouse',   JOB.JANITOR],
  ['unlockapothecary', JOB.STIR]
];

group('a door opens with one spare body sent over', async () => {
  rich(1, 6);                                   // one on the rock, six spare
  run(1);
  const out = [];
  for (const [key, job] of DOORS) {
    const before = S[job];
    const up = buyBuilt(key, 300);
    // and a body of that trade is in the yard: assigned is a count, and the
    // walk over is the whole point of going through `assign`.
    const walking = runUntil(() => S.workers.some(w => JOB_OF[w.type] === job), 5);
    out.push(ok(up, `${key} goes up`),
             ok(S[job] === before + 1, `and one body is put on ${job}`, `${before} -> ${S[job]}`),
             ok(walking, `and one of the ${job} is in the yard`));
  }
  return out;
});

group('a door opened with nobody idle stays empty', async () => {
  rich(1, 0);                                   // one on the rock, nobody spare
  run(1);
  const up = buyBuilt('unlockfarm', 300);
  return [
    ok(up, 'the farm goes up'),
    ok(S.farmhands === 0, 'and nobody is taken off the rock for it', `${S.farmhands}`),
    ok(S.rockhands === 1, 'the rockhand is still on the rock', `${S.rockhands}`)
  ];
});
