// A row is built where it is sold. A rung bought standing at a station is
// fitted at that station, by a spare hand who walks there; the only other
// place a row may name is the yard, for a thing put up on the ground where it
// will stand (a building, a machine). The janitor's second cap was sold at
// the closet and fitted at the bench, across the yard from the stand it hangs on.

import { yard, group, ok, run, runUntil, WORKER } from './helpers.mjs';
import { rowFor, takesTime, SITE_JOB, workAt, UP_THERE, DOWN_THERE } from '../src/works.js';
import { outhouse } from '../src/state.js';
import { JOB, TYPE } from '../src/jobs.js';

const S = yard.S;

group('every row that takes building is built at its own board, by spare hands', async () => {
  window.__reset();
  const astray = [], ganged = [];
  for (const b of window.__boards()) for (const key of b.keys) {
    const u = rowFor(key);
    if (!u || !takesTime(u)) continue;
    // Work in the air is one exception, and it is a stated one: nobody on
    // the ground can reach it, so whoever is up there does it (`UP_THERE` in
    // works.js; the sphere's rungs, poured by its tender).
    // The deep is the other: nobody is lent down the shaft, so every deep
    // station's rungs are its own gang's and the doors the brawlers' at the
    // altar that sells them (`DOWN_THERE`).
    if (UP_THERE.has(u.site) || DOWN_THERE.has(u.site)) continue;
    if (u.site !== b.name && u.site !== 'yard') astray.push(`${key}@${u.site} sold at ${b.name}`);
    if (SITE_JOB[u.site] !== JOB.BUILD) ganged.push(`${key}@${u.site}`);
  }
  return [
    ok(!astray.length, 'no row is fitted somewhere other than where it is sold', astray.join(', ')),
    ok(!ganged.length, 'and every one is worked by the yard\'s spare hands, not a station\'s gang', ganged.join(', '))
  ];
});

// Bought the way a player buys it, off the closet's own board.
group("the janitor's second cap is fitted at the closet, by a spare hand", async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__loo(true);
  S.quarryOpen = true;                         // the cap is priced in ore
  window.__give(20000);
  window.__grant({ shards: 30 });
  const bought = window.__buy('loopost');
  const where = Object.keys(S.works || {}).find(site => S.works[site].some(w => w.key === 'loopost'));
  const inCloset = w => w.x + WORKER > outhouse.x && w.x < outhouse.x + outhouse.w;
  const arrived = runUntil(() => S.workers.some(w => w.type === TYPE.BUILD && w.site === 'outhouse'
                                                    && w.goal === 'at' && inCloset(w)), 60);
  const landed = runUntil(() => !workAt('outhouse'), 400);
  run(1);
  return [
    ok(bought, 'the cap is bought off the closet\'s board'),
    ok(where === 'outhouse', 'and its work is at the closet', where || 'nowhere'),
    ok(arrived, 'a builder walks over and stands in the closet'),
    ok(landed && S.looPosts === 2, 'and the cap lands on the stand', `posts ${S.looPosts}`)
  ];
});
