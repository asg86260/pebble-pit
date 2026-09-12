// The checks that need a page.
//
// Run it in the browser -- open the game and call `__test()` in the console --
// or headless with `npm run test:browser`. It resets the save first, so run it
// on a game you do not mind losing.
//
// This used to be the whole suite: five hundred and eighty checks, most of them
// about the yard rather than about the page, all of them going through a browser
// to find out. The ones about the yard live in `test/*.test.mjs` now and run in
// node against `step` directly -- see tools/node/yard.mjs. What is left here is
// what a browser is actually for: a pointer being dragged across a canvas, a
// board seating itself against the edge of a window, a cursor changing shape, a
// cell landing on a whole device pixel.
//
// Every group starts from a new game (see `runTests`), so any one of them can be
// run on its own with `__test('some words from the name')`, and the suite can be
// split across as many browsers as you like.
//
// The checks themselves are in src/selftest/, one file to a subject. This file
// is the order they run in, and the order is not decoration: `--shard 2/6`
// hands the second sixth of this list to a browser, so the list below is the
// contract both the sharding and `--only` are cut from. A subject moved up or
// down here moves in every shard with it.

import { newRun, settle, sleep, cost } from './selftest/kit.js';
import { TESTS as opening } from './selftest/opening.js';
import { TESTS as boards } from './selftest/boards.js';
import { TESTS as wind } from './selftest/wind.js';
import { TESTS as crew } from './selftest/crew.js';
import { TESTS as stations } from './selftest/stations.js';
import { TESTS as view } from './selftest/view.js';
import { TESTS as dust } from './selftest/dust.js';
import { TESTS as work } from './selftest/work.js';
import { TESTS as places } from './selftest/places.js';
import { TESTS as casino } from './selftest/casino.js';
import { TESTS as carry } from './selftest/carry.js';
import { TESTS as house } from './selftest/house.js';
import { TESTS as sky } from './selftest/sky.js';
import { TESTS as input } from './selftest/input.js';
import { TESTS as settings } from './selftest/settings.js';   // wave-release: track A
import { TESTS as scenes } from './selftest/scenes.js';
import { TESTS as queue } from './selftest/queue.js';

// Every group there is, in file order.
const TESTS = [
  ...opening,
  ...boards,
  ...wind,
  ...crew,
  ...stations,
  ...view,
  ...dust,
  ...work,
  ...places,
  ...casino,
  ...carry,
  ...house,
  ...sky,
  ...input,
  // wave-release: track A
  ...settings,
  ...scenes,
  ...queue,
];

// `__test('quarry')` runs only the groups whose name says quarry. The whole suite is
// two minutes; one group is seconds, which is the difference between checking a
// change and putting off checking it.
// `__test()` runs the lot. `__test('casino')` runs one corner of it. `__test('',
// {i, n})` runs every nth group starting at i, which is how `tools/test.mjs`
// splits the suite across as many browsers as the machine has room for.
// Every group starts from a new game.
//
// It did not use to. The suite was one long narrative -- the opening first, and
// a dozen groups afterwards leaning on the yard a neighbour had left behind --
// which meant a group could only be run where it sat, a failure could belong to
// any of the groups above it, and the whole thing could not be split across more
// than a handful of browsers without breaking.
//
// A reset is half a second of game and costs nothing, and with it every group is
// a check you can run on its own. `{ solo: false }` is kept for one purpose: to
// watch what the suite used to do.
export async function runTests(filter = '', shard = null, opts = {}) {
  const solo = opts.solo !== false;
  const errs = [];
  const onErr = e => errs.push(String(e.message || e));
  addEventListener('error', onErr);

  newRun();                                            // known state
  await sleep(600);

  const results = [];
  const timing = [];
  // Cut into blocks, in file order, rather than dealt out round-robin.
  //
  // Round-robin balances the slow groups better and was tried first. It also
  // shuffles the order, and the order is not decoration here: the opening runs
  // first because it is the only group that can watch the game open, and a dozen
  // others lean on the yard a neighbour left behind. Dealt out, sixteen checks
  // failed that pass in sequence. A block keeps everybody next to the group they
  // were written next to.
  const all = TESTS.filter(([name]) =>
    !filter || name.toLowerCase().includes(filter.toLowerCase()));
  const per = shard ? Math.ceil(all.length / shard.n) : all.length;
  const wanted = shard ? all.slice(shard.i * per, (shard.i + 1) * per) : all;
  for (const [name, fn] of wanted) {
    let checks;
    if (solo) { newRun(); await settle(0.5); }
    const t0 = performance.now();
    try {
      checks = await fn();
    } catch (e) {
      checks = [{ pass: false, what: 'threw', detail: String(e && e.stack || e) }];
    }
    timing.push([name, Math.round(performance.now() - t0)]);
    for (const c of checks) results.push({ ...c, group: name });
  }
  timing.sort((a, b) => b[1] - a[1]);
  removeEventListener('error', onErr);

  const failed = results.filter(r => !r.pass);
  console.log(`%c${results.length - failed.length}/${results.length} checks passed`,
              `font-weight:bold;color:${failed.length ? '#b00' : '#070'}`);
  for (const f of failed) console.warn(`FAIL  ${f.group}: ${f.what}${f.detail ? ` — ${f.detail}` : ''}`);
  if (errs.length) console.warn('errors during run:', errs);

  return {
    passed: results.length - failed.length,
    total: results.length,
    seconds: Math.round(timing.reduce((n, t) => n + t[1], 0) / 1000),
    cost: cost(),                                      // kept by kit.js, which does the sleeping
    slowest: timing.slice(0, 8).map(([n, ms]) => `${(ms / 1000).toFixed(1)}s ${n}`),
    failures: failed.map(f => `${f.group}: ${f.what}${f.detail ? ` — ${f.detail}` : ''}`),
    errors: errs
  };
}

window.__test = runTests;
window.__groups = () => TESTS.map(([name]) => name);
