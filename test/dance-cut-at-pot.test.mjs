// A dance cut short in mid-hop (the meeting's beat ends it, a scene clears it)
// leaves a body wherever its jump had it. Anybody who walks comes back down
// on the next stride; a stirrer at its pot is behind the door and never
// walks, so it was left up in the air above its pot for good.

import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { now } from '../src/clock.js';
import { TYPE, JOB } from '../src/jobs.js';

const S = yard.S;

group('a stirrer whose dance is cut mid-hop comes back down to its pot', async () => {
  window.__reset();
  window.__crew(1, 6);
  window.__grant({ dust: 90000, shards: 900, spores: 900, sparks: 500 });
  window.__answered('props', 'net', 'arch');
  window.__machine('ram', { bought: true });
  window.__air({ rains: 1 });
  S.seenAir = true; S.seenMess = true; S.seenSpore = true;
  run(1);
  window.__buy('unlockapothecary'); window.__finish(); window.__assign(JOB.STIR, 1);

  const stir = () => S.workers.find(w => w.type === TYPE.STIR);
  const home = runUntil(() => stir() && stir().goal === 'in', 60);

  S.danceUntil = now() + 60000;
  const up = runUntil(() => stir() && stir().foot - stir().y > 3, 10);
  S.danceUntil = 0;
  run(2);
  const w = stir() || {};
  return [
    ok(home, 'the stirrer is at its pot'),
    ok(up, 'and the dance lifts it off the ground'),
    ok(Math.abs(w.y - (w.foot ?? w.y)) < 1, 'and when the dance is cut it is standing again',
       `y ${w.y}, foot ${w.foot}`)
  ];
});
