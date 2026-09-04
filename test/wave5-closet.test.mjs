// The janitor's closet: a stand nobody buys, with the janitor's own rows on it.
//
// The rows were on the bench, under a heading naming a shed on the other side
// of the yard -- a decision about a place, made somewhere else, which is what
// the lab's and the school's rows were moved off the bench to stop being. The
// awkward part is that the closet cannot be bought: what it sells is the
// janitor's job, and a row that opens a job cannot sit on the board of the
// place the job opens. So it arrives with the crew, and these are the checks
// that say so.
//
// What the closet looks like is not in here and cannot be -- no check in either
// tier can see a broom. That is `node tools/look.mjs closet,closetboard`.

import { group, ok, state, run, yard } from './helpers.mjs';
import { CLOSET_UPGRADES, CLOSET_SECTIONS } from '../src/closet.js';
import { UPGRADES, SECTIONS } from '../src/upgrades.js';
import { standRect } from '../src/board.js';
import { buildBoard } from '../src/shop.js';
import { closet, outhouse, SAVED, SAVED_BY_HAND } from '../src/state.js';

const keysOn = id => [...document.getElementById(id).children]
  .map(c => c.dataset.key).filter(Boolean);

// --- where it stands ----------------------------------------------------------
group('the closet is standing from the first frame, and nobody buys it', async () => {
  window.__reset();
  const fresh = standRect('closet');
  const bare = { x: closet.x, w: closet.w };
  const crew = yard.S.crew;

  // and it does not move when places are bought, because it is pinned with the
  // rooms rather than sliding into the order the buying makes
  window.__fullSites();
  const after = { x: closet.x, w: closet.w };

  // nothing on the save says whether it is there, because there is nothing to
  // say: it is not a purchase and it has no state of its own
  const named = [...SAVED, ...SAVED_BY_HAND].filter(k => /closet/i.test(k));

  return [
    ok(crew > 0, 'a new yard already has somebody living in it', `${crew}`),
    ok(!!fresh, 'so the cupboard is there from the first frame',
       fresh ? `${Math.round(fresh.x)},${Math.round(fresh.w)}` : 'none'),
    ok(bare.x === after.x && bare.w === after.w,
       'and its ground is reserved from the start, so opening places never moves it',
       `${bare.x} -> ${after.x}`),
    ok(named.length === 0, 'and no saved field decides whether it stands',
       named.join(',') || 'none'),
    // Out past the outhouse, among the rooms: the settlement's own cluster.
    // Asserted against its neighbor rather than against a number, because the
    // yard is laid out as offsets and a coordinate here is a check that goes red
    // when somebody widens something.
    ok(closet.x > outhouse.x,
       'it stands out past the outhouse, among the rooms',
       `outhouse ${outhouse.x}, closet ${closet.x}`)
  ];
});

// --- whose board the rows are on ----------------------------------------------
group('the janitor rows are on the closet and nowhere else', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);            // so they go while we are watching
  window.__air({ haze: 0, muck: 0 });
  run(90);

  window.__give(20000);
  buildBoard('closet');
  buildBoard('bench');
  const onCloset = keysOn('closetshop');
  const onBench = keysOn('shop');

  const named = new Set(CLOSET_SECTIONS.flatMap(x => x.keys));
  const benchNames = new Set(SECTIONS.flatMap(x => x.keys));

  window.__reset();
  return [
    ok(onCloset.includes('unlockouthouse'),
       'the outhouse is sold at the closet', onCloset.join(',') || 'nothing'),
    ok(!onBench.includes('unlockouthouse') && !onBench.includes('loopost'),
       'and the bench sells neither of the janitor rows', onBench.join(',')),
    ok(!benchNames.has('unlockouthouse') && !benchNames.has('loopost'),
       'nor names them in a section, so neither lands under "and"'),
    ok(CLOSET_UPGRADES.every(u => named.has(u.key)),
       'and every row the closet holds is named by its own section',
       CLOSET_UPGRADES.map(u => u.key).join(','))
  ];
});

// Bought the way a player buys it: the mess appears, the row appears with it on
// the closet's board, the row is pressed, and the yard builds the shed. `__buy`
// goes through the row's own `buy` with its price and its rules -- there is no
// hook here that sets `outhouseOpen`.
group('the outhouse is bought through the closet, and the job opens', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);
  window.__air({ haze: 0, muck: 0 });
  run(90);
  const messy = state();

  window.__give(20000);
  buildBoard('closet');
  const offered = keysOn('closetshop');
  const pressed = window.__buy('unlockouthouse');
  window.__finish();                           // it is a building; the yard puts it up
  const built = state();

  // and now the second cap, which is the closet's own second rung
  window.__grant({ shards: 30 });
  buildBoard('closet');
  const next = keysOn('closetshop');
  const cap = window.__buy('loopost');
  window.__finish();                           // a rung past the bench is built too
  const posts = yard.S.looPosts;

  window.__reset();
  return [
    ok(messy.smog.poop > 0 && offered.includes('unlockouthouse'),
       'mess on the ground puts the row on the closet', `${messy.smog.poop} cells`),
    ok(pressed && built.outhouseOpen, 'pressing it puts the outhouse up'),
    ok(next.includes('loopost'), 'and the second cap comes on to the same board',
       next.join(',')),
    ok(cap && posts === 2, 'which buys a second place to stand', `${posts} posts`)
  ];
});

// --- an old save ---------------------------------------------------------------
// The rows moved boards and the closet is new furniture, so a save written
// before any of that has to come back with the janitor ladder exactly where it
// was. None of it is a new field -- the closet is a module rect and the board's
// open/shut is this session's -- which is the thing this asserts by asserting
// the old fields still make the round trip.
group('a yard part way up the janitor ladder survives a reload', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__loo(true);                          // the outhouse already up
  window.__give(20000);                        // every row is priced in dust as well
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
  const stand = standRect('closet');

  window.__reset();
  return [
    ok(was.open && was.posts === 2 && was.janitors === 1,
       'a yard with the shed up, both caps bought and somebody on the job',
       JSON.stringify(was)),
    ok(back.open === was.open && back.posts === was.posts &&
       back.janitors === was.janitors && back.crew === was.crew,
       'and the save brings every bit of it back', JSON.stringify(back)),
    ok(!!stand, 'with the closet standing to read it at')
  ];
});
