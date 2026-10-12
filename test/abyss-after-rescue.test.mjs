// The rest of the pit's arc, owed to a yard that got the sqwife out before
// its hole had drowned (`owedArc` in rift.js): the hole tears through its
// own scene, the disc swells, and the pit drowns through its own scene, by
// the same lines the ordinary route takes.
//
// The rescue itself is bought and walked in shield.test.mjs; here the yard is
// given the rescue's own record and its sheet is put down with the button, as
// ending.test.mjs and snatch.test.mjs do.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { serpentOn } from '../src/snatch.js';
import { DANCE_MS } from '../src/config.js';

// The tearing waits for the crew to have danced the sheet down (`owedArc`).
const AFTER_DANCE_S = DANCE_MS / 1000 + 5;

const KEY = 'boulder-clicker/v4';
const rescued = () => { S.rescued = true; S.buried = false; };
const did = key => S.beatsDone.includes(key);

group('rescued with the pit solid: the hole tears, then drowns, each through its scene', async () => {
  window.__crew(2, 2);
  run(1);
  const solid = !S.riftOpen && !S.drowned;
  rescued();
  run(1 / 60);
  window.__skipBeat('sheet');                       // the button
  const tore = runUntil(() => S.beat.camera === 'tear', AFTER_DANCE_S);
  const tornFirst = S.riftOpen && !S.drowned;
  const drownedAt = runUntil(() => S.beat.camera === 'drown', 40);
  runUntil(() => did('drown') && !S.beat.camera, 30);
  const snatchOwed = serpentOn();
  if (snatchOwed) runUntil(() => S.beat.yard === 'snatch' || did('snatch'), 30);
  return [
    ok(solid, 'the pit has not torn before the rescue'),
    ok(tore && tornFirst, 'the tearing\'s scene plays first, the pit torn and not drowned',
       `camera ${S.beat.camera}, torn ${S.riftOpen}`),
    ok(drownedAt, 'then the drowning\'s scene'),
    ok(S.drowned && did('tear') && did('drown'), 'the pit is drowned and both beats are done',
       `drowned ${S.drowned}, done ${S.beatsDone}`),
    ok(!snatchOwed || S.beat.yard === 'snatch' || did('snatch'),
       'and the second half follows as it does from a drowned pit', `yard ${S.beat.yard}`)
  ];
});

group('a save rescued but not drowned is owed the same once it is loaded', async () => {
  window.__crew(2, 2);
  run(1);
  rescued();
  run(1 / 60);
  window.__skipBeat('sheet');
  yard.persist();
  const raw = localStorage.getItem(KEY);
  window.__seed(1);                                 // a different yard in between
  localStorage.setItem(KEY, raw);
  yard.restore();
  const back = { rescued: S.rescued, drowned: S.drowned, torn: S.riftOpen };
  const tore = runUntil(() => S.beat.camera === 'tear', AFTER_DANCE_S);
  runUntil(() => did('drown') && !S.beat.camera, 60);
  return [
    ok(back.rescued && !back.drowned && !back.torn, 'read back rescued, with the pit solid', JSON.stringify(back)),
    ok(tore, 'the tearing\'s scene plays after the load'),
    ok(S.drowned && did('tear') && did('drown'), 'and the pit drowns through its scene',
       `drowned ${S.drowned}, done ${S.beatsDone}`)
  ];
});

group('drowned before the rescue: nothing is replayed', async () => {
  window.__crew(2, 2);
  run(1);
  window.__rift();                                  // the hole ate its fill and gave way
  rescued();
  run(1 / 60);
  window.__skipBeat('sheet');
  run(15);
  return [
    ok(!did('tear') && !did('drown') && S.beat.camera !== 'tear' && S.beat.camera !== 'drown',
       'no tear or drowning scene plays after the rescue', `done ${S.beatsDone}, camera ${S.beat.camera}`),
    ok(!S.riftSwell, 'and the disc is given no swell', `swell ${S.riftSwell}`)
  ];
});
