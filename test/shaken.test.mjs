// What being shaken about costs somebody.
//
// A body waggled in your hand lets go of everything -- its load and the hat off
// its head -- lands seeing stars, rocks where it landed while they clear, and
// then walks over and picks its hat up before going back to work.
//
// The point of the check is the *sequence*, because every part of it used to be
// missing in a different way: the load stayed in its hands through being turned
// upside down, the hat was a property of the body rather than a thing on its
// head, and the stars were decoration drawn over somebody who had already been
// handed its job back the instant its feet touched.

import { group, ok, state, run } from './helpers.mjs';
import { DIZZY_MS } from '../src/config.js';

group('a shaken body sheds its load while you shake it', async () => {
  window.__reset();
  window.__crew(2, 2);

  // Wait for somebody to actually have something in its hands, or there is no
  // load to shake out and the check passes by testing nothing.
  let carried = 0, j = -1;
  for (let n = 0; n < 60 && carried === 0; n++) {
    run(0.5);
    const d = state().crewDetail;
    j = d.findIndex(r => Number(r.split('|')[3].slice(1)) > 0);
    if (j >= 0) carried = Number(d[j].split('|')[3].slice(1));
  }
  const shook = window.__shake(j);
  window.__crew(0, 0);

  return [
    ok(carried > 0, 'it had something in its hands to lose', `${carried}`),
    // Shaking something out of somebody is the point of shaking them: it should
    // come out while you do it, not appear in a heap underneath afterwards.
    ok(shook.shed > 0 && shook.spill === 0,
       'and the load comes out as it is shaken, not when it lands',
       `shed ${shook.shed} while shaken, ${shook.spill} left to fall`)
  ];
});

group('a shaken body drops its hat, and goes back for it', async () => {
  window.__reset();
  window.__crew(2, 2);
  window.__kit({ breakers: 2 });         // so somebody has a hat to lose
  run(6);                                    // and has gone and put it on

  const wore = state().trained.length;
  const j = state().crewDetail.findIndex(d => d[0] === 'r');
  const shook = window.__shake(j);
  run(0.2);                                  // land

  const justAfter = state();
  run(DIZZY_MS / 1000 * 0.5);
  const wobbling = state().saying > 0;

  run(DIZZY_MS / 1000 + 6);                  // stars clear, and it fetches the hat
  const after = state();
  window.__crew(0, 0);

  return [
    ok(wore > 0, 'somebody was wearing a hat to begin with', `${wore}`),
    ok(shook && shook.hatOff, 'shaking it takes the hat off', JSON.stringify(shook)),
    ok(justAfter.trained.length === wore - 1,
       'and it is not wearing one while it lies about',
       `${justAfter.trained.length} against ${wore}`),
    ok(wobbling, 'it stands there seeing stars'),
    ok(after.saying === 0, 'and comes round', `${after.saying} still at it`),
    ok(after.trained.length === wore,
       'and puts the hat back on, having walked over to it',
       `${after.trained.length} against ${wore}`)
  ];
});
