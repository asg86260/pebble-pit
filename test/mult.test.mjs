// The yard's multipliers, now that the lab has gone.
//
// This file replaces lab.test.mjs, which tested the lab's own two ladders -- a
// bench that worked faster and a second bench -- both of which folded into the
// construction bench's `a better hammer` and `another post`. What is worth
// checking is not the room the work happened in but the bargain it carried, and
// DESIGN.md is blunt about what that was: "a multiplier you can simply buy is a
// number; a multiplier that costs you four bodies off the rock for a minute is a
// decision." So: buying one still starts a piece of work, that work still needs
// somebody standing on it, and the rate does not move until it lands.
//
// Bought the way a player buys it -- through the row on the board -- and never
// by setting `S.mult` with a hook, which would assert nothing about the gate,
// the price or the wait.

import { yard, group, ok, state, run, runUntil, openSites } from './helpers.mjs';

// The swing multiplier is the one on the bench, under `the rock`, beside the
// rung it multiplies.
group('a multiplier is bought at the thing it multiplies, and takes work', async () => {
  window.__reset();
  // `__fullSites` rather than `openSites`, which takes the ladders to their top:
  // a multiplier already at `RUNGS` is clamped where it is read, so the level
  // would go up and the rate would not, and the check would be measuring the
  // ceiling rather than the purchase.
  window.__fullSites();
  window.__invest();                 // the trestle is what they wait on
  window.__grant({ shards: 900, dust: 90000, spores: 900, cores: 9 });
  window.__crew(0, 3);
  // Somebody has to build it. With the trestle standing, a builder is a post you
  // hire like any other and a work with nobody on it waits, fenced -- which is
  // the whole bargain the lab used to carry and the reason this is a build.
  window.__assign('builders', 1);
  run(2);

  const before = state();
  const rate0 = before.pxPerSec;
  // through the row, prices and gates and all
  const pressed = window.__buy('labswing');
  const started = state();

  // It is a build at the yard's own site, so it does not land on the press.
  const landed = runUntil(() => state().mult?.swing > (before.mult?.swing ?? 0), 400);
  const after = state();

  window.__crew(0, 0);
  return [
    ok(pressed, 'the row can be pressed'),
    ok(started.shards < before.shards, 'and it takes the stone',
       `${before.shards} -> ${started.shards}`),
    // The whole point: paying starts it, bodies finish it.
    ok(!!started.research, 'paying starts a piece of work rather than finishing it',
       started.research ? started.research.key : 'nothing on the go'),
    ok(landed, 'and somebody working on it finishes it'),
    ok(after.pxPerSec > rate0, 'and only then does the swing get quicker',
       `${rate0} -> ${after.pxPerSec}`)
  ];
});

// The gate. Before the trestle stands there is nowhere to research from, and a
// row that asked for stone with nothing to spend it on would be the board
// offering something the yard cannot do.
group('no multiplier is for sale before there is a bench to work at', async () => {
  window.__reset();
  openSites();
  window.__grant({ shards: 900, dust: 90000, spores: 900, cores: 9 });
  const shut = window.__rows().filter(r => r.key === 'labswing')[0];
  window.__invest();
  const open = window.__rows().filter(r => r.key === 'labswing')[0];
  return [
    ok(shut && !shut.shown, 'with no work bench the row is not on the board',
       shut ? String(shut.shown) : 'no such row'),
    ok(open && open.shown, 'and once it stands it is', open ? String(open.shown) : 'no such row')
  ];
});

// Each of the four is sold at the board of the thing it multiplies, which is the
// change the lab's deletion was for: the shack, the houses, the quarry and the
// farm, rather than four rows on one sheet across the yard from all of them.
//
// The swing's used to be on the bench, which was the nearest thing the rock had
// to a board of its own. The gang has a hut now, so it is on that -- see
// "The shack at the rock" in DESIGN.md.
group('each multiplier sits on the board of the thing it multiplies', async () => {
  window.__reset();
  openSites();
  window.__invest();
  const boards = window.__boards();
  const at = key => boards.filter(b => b.sections.flat().includes(key)).map(b => b.name);
  return [
    ok(at('labswing').join() === 'shack', "the swing multiplier is at the shack, with the rock's own ladder",
       at('labswing').join() || 'nowhere'),
    ok(at('labhaul').join() === 'house', "the crew's is where the crew live",
       at('labhaul').join() || 'nowhere'),
    ok(at('labcave').join() === 'quarry', "the cut's is at the cut",
       at('labcave').join() || 'nowhere'),
    ok(at('labtend').join() === 'farm', "the plots' is at the plots",
       at('labtend').join() || 'nowhere')
  ];
});

