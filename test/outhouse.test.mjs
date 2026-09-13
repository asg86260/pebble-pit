// One building for the janitor's trade. There used to be two -- the outhouse a
// body goes to, and a separate broom cupboard (the janitor's closet) that
// carried the board -- and the two are one thing now: the row that puts the
// shed up is on the bench with every other "open a place" row, and the shed's
// own board carries the rest of the ladder. This file replaces
// wave5-closet.test.mjs, which asserted the two-building arrangement.

import { group, ok, state, run, yard } from './helpers.mjs';
import { OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS } from '../src/outhouse.js';
import { UPGRADES, SECTIONS } from '../src/upgrades.js';
import { standRect, STATIONS } from '../src/board.js';
import { buildBoard } from '../src/shop.js';

const keysOn = id => [...document.getElementById(id).children]
  .map(c => c.dataset.key).filter(Boolean);

// --- whose board the rows are on ----------------------------------------------
group('the outhouse is sold at the bench, and its board sells the rest', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);            // so they go while we are watching
  window.__air({ haze: 0, muck: 0 });
  run(90);

  window.__give(20000);
  buildBoard('bench');
  const onBench = keysOn('shop');
  const benchNames = new Set(SECTIONS.flatMap(x => x.keys));
  const looNames = new Set(OUTHOUSE_SECTIONS.flatMap(x => x.keys));

  window.__reset();
  return [
    ok(onBench.includes('unlockouthouse'),
       'mess on the ground puts the outhouse row on the bench',
       onBench.join(',') || 'nothing'),
    ok(benchNames.has('unlockouthouse'),
       'and a bench section names it, so it does not land under "and"'),
    ok(UPGRADES.some(u => u.key === 'unlockouthouse'),
       'the row is one of the bench rows proper'),
    ok(!onBench.includes('loopost') && !benchNames.has('loopost'),
       "while the janitor's second cap is not the bench's to sell"),
    ok(OUTHOUSE_UPGRADES.every(u => looNames.has(u.key)),
       'and every row the outhouse board holds is named by its own section',
       OUTHOUSE_UPGRADES.map(u => u.key).join(','))
  ];
});

// Bought the way a player buys it: the mess appears, the row appears with it on
// the bench, the row is pressed, and the yard builds the shed. `__buy` goes
// through the row's own `buy` with its price and its rules -- there is no hook
// here that sets `outhouseOpen`.
group('the outhouse is bought at the bench, and its own board opens after', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);
  window.__air({ haze: 0, muck: 0 });
  run(90);
  const messy = state();

  window.__give(20000);
  buildBoard('bench');
  const offered = keysOn('shop');
  const pressed = window.__buy('unlockouthouse');
  window.__finish();                           // it is a building; the yard puts it up
  const built = state();

  // and now the second cap, which is the shed's own board's to sell
  // The second cap is priced in ore, so the quarry stands first: a row priced
  // in a coin the yard has no source for is off the board (coinsOpen).
  yard.S.quarryOpen = true;
  window.__grant({ shards: 30 });
  buildBoard('outhouse');
  const next = keysOn('looshop');
  const cap = window.__buy('loopost');
  window.__finish();                           // a rung past the bench is built too
  const posts = yard.S.looPosts;

  window.__reset();
  return [
    ok(messy.smog.poop > 0 && offered.includes('unlockouthouse'),
       'mess on the ground puts the row on the bench', `${messy.smog.poop} cells`),
    ok(pressed && built.outhouseOpen, 'pressing it puts the outhouse up'),
    ok(next.includes('loopost'), "and the second cap is on the shed's own board",
       next.join(',')),
    ok(cap && posts === 2, 'which buys a second place to stand', `${posts} posts`)
  ];
});

// --- one building, not two ------------------------------------------------------
group('there is one janitor building, and its board arrives with it', async () => {
  window.__reset();
  const before = standRect('outhouse');

  window.__crew(3, 2);
  window.__loo(true);                          // the shed up; buying it is the group above
  const after = standRect('outhouse');

  window.__reset();
  return [
    ok(!STATIONS.includes('closet'), 'no station in the yard is a closet',
       STATIONS.join(',')),
    ok(!before, 'an unbuilt outhouse is not a stand'),
    ok(!!after, 'a built one is', after ? `${after.x},${after.w}` : 'none')
  ];
});

// --- an old save ---------------------------------------------------------------
// The janitor ladder's fields are old ones -- `outhouseOpen`, `looPosts` -- and
// a save written under the two-building arrangement has to come back with the
// ladder exactly where it was.
group('a yard part way up the janitor ladder survives a reload', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__loo(true);                          // the outhouse already up
  window.__give(20000);                        // every row is priced in dust as well
  // The second cap is priced in ore, so the quarry stands first: a row priced
  // in a coin the yard has no source for is off the board (coinsOpen).
  yard.S.quarryOpen = true;
  window.__grant({ shards: 30 });
  window.__buy('loopost');
  window.__finish();
  window.__air({ janitors: 1 });
  run(5);
  const was = { open: yard.S.outhouseOpen, posts: yard.S.looPosts,
                janitors: yard.S.janitors, crew: yard.S.crew };

  // The two calls a page load makes, and nothing else -- `__reset` between them
  // would clear the save as well as the yard, which is a check that proves the
  // save is empty.
  window.__reload();
  const back = { open: yard.S.outhouseOpen, posts: yard.S.looPosts,
                 janitors: yard.S.janitors, crew: yard.S.crew };

  // and the board it is all read on is there for it
  const stand = standRect('outhouse');

  window.__reset();
  return [
    ok(was.open && was.posts === 2 && was.janitors === 1,
       'a yard with the shed up, both caps bought and somebody on the job',
       JSON.stringify(was)),
    ok(back.open === was.open && back.posts === was.posts &&
       back.janitors === was.janitors && back.crew === was.crew,
       'and the save brings every bit of it back', JSON.stringify(back)),
    ok(!!stand, 'with the outhouse standing to read it at')
  ];
});
