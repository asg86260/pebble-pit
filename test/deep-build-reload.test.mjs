// A build in the deep read back from a save half done: the deep's own
// builders go back down to it and finish it, the pods and a station of the
// party alike.
//
// `reload: false` because each group follows one build across its own
// refresh, made by hand at a chosen point; the harness's refreshes on top
// would only move that point.

import { group, ok, yard } from './helpers.mjs';
import { WORKER } from '../src/config.js';
import { TYPE } from '../src/jobs.js';
import { workAt, worksAt, progressOf, siteBox } from '../src/works.js';
import { deepTop } from '../src/deep/place.js';
import { pressBuild } from './party-press.mjs';

const S = yard.S;

// Past the snatch, with the deep's own hands spare.
function deepYard() {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__deepCrew({ spare: 2 });
  window.__scales(99999);
  window.__grant({ dust: 900000 });
}

// The build at `site` bought, run until it is partway up, read back cold,
// and then followed: whether a delver gets to its ground, and whether it
// lands.
function acrossARefresh(site, done) {
  const work = () => worksAt(site)[0] || null;
  let f = 0;
  for (; f < 60 * 60 && !(work() && progressOf(work()) > 0.2); f++) yard.fast(1 / 60);
  const half = work() ? progressOf(work()) : null;
  // Cold, as a page refresh is: nothing of the build left in memory.
  window.__cold();
  const back = work() ? progressOf(work()) : null;
  const box = () => work() && siteBox(site, work());
  let there = false, landed = false, g = 0;
  for (; g < 60 * 60 && !landed; g++) {
    yard.fast(1 / 60);
    const b = box();
    if (b && S.workers.some(w => w.type === TYPE.DELVE && w.y + WORKER > deepTop()
                              && w.x + WORKER > b.x && w.x < b.x + b.w)) there = true;
    landed = done();
  }
  return { half, back, there, landed, secs: (g / 60).toFixed(1) };
}

group('a pod half built across a refresh is finished by the deep\'s builders', async () => {
  deepYard();
  const pods = S.pods;
  const bought = window.__buy('pod');
  const r = acrossARefresh('pods', () => S.pods === pods + 1);
  return [
    ok(bought, 'a pod is sold on the pods\' board'),
    ok(r.half != null && r.half > 0.2 && r.half < 1, 'the pod was partway up at the refresh', String(r.half)),
    ok(r.back != null && Math.abs(r.back - r.half) < 0.01, 'and is the same way up after it', `${r.half} -> ${r.back}`),
    ok(r.there, 'a deep builder goes back to it'),
    ok(r.landed, 'and the pod stands', `${pods} -> ${S.pods} in ${r.secs}s`)
  ];
}, { reload: false });

group('a station of the party half built across a refresh is finished', async () => {
  deepYard();
  // The first station stands from the snatch, so the build followed is the
  // second, bought with a fang.
  window.__party({ fangs: 1 });
  const before = (S.stations || []).filter(s => s.built !== false).length;
  const pressed = pressBuild();
  const id = S.stations?.at(-1)?.id;
  const r = acrossARefresh(id, () => !worksAt(id).length);
  return [
    ok(pressed && id, 'the build button lays a station'),
    ok(r.half != null && r.half > 0.2 && r.half < 1, 'the station was partway up at the refresh', String(r.half)),
    ok(r.back != null && Math.abs(r.back - r.half) < 0.01, 'and is the same way up after it', `${r.half} -> ${r.back}`),
    ok(r.there, 'a deep builder goes back to it'),
    ok(r.landed, 'and the station stands', `${before} built before, in ${r.secs}s`)
  ];
}, { reload: false });
