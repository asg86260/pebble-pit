// The second half's switch (config/deep.js, SERPENT_ON; snatch.js,
// `serpentOn`). A released build with it off ends the story where 0.4.1 did:
// the rescue's sheet put down, the crew's dance, a drowned pit, and nothing
// taken. Reached as snatch.test.mjs reaches the snatch: the pit drowned by the
// rift, the sqwife out, the sheet put down with its button.
import { group, ok, run } from './helpers.mjs';
import { S } from '../src/state.js';
import { now } from '../src/clock.js';

const rescued = () => { S.rescued = true; S.buried = false; };

group('with the serpent switched off, a drowned yard\'s story ends at the dance', async () => {
  window.__serpentOn(false);
  try {
    window.__crew(2, 2);
    run(1);
    window.__rift();
    rescued();
    run(1 / 60);
    const sheet = S.beat.sheet;
    const before = S.crew;
    window.__skipBeat('sheet');
    const danced = S.danceUntil > now();
    run(60);
    window.__reload();
    run(3);
    return [
      ok(sheet === 'ending', 'the rescue\'s sheet comes up', `sheet ${sheet}`),
      ok(danced, 'putting it down starts the dance, drowned pit or not'),
      ok(!S.snatched && !S.beatsDone.includes('snatch') && S.beat.yard === null,
         'and nothing comes up out of the water', `beat ${S.beat.yard}`),
      ok(S.crew === before, 'the crew is whole', `${before} -> ${S.crew}`),
    ];
  } finally { window.__serpentOn(null); }
});
