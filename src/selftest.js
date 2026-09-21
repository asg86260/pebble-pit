// The checks that need a page: a pointer dragged across a canvas, a board
// seating itself against the edge of a window, a cursor changing shape, a
// cell landing on a whole device pixel. Everything about the yard lives in
// `test/*.test.mjs` and runs in node.
//
// Run it in the browser (`__test()` in the console) or headless with
// `npm run test:browser`. It resets the save first.
//
// The checks are in src/selftest/, one file to a subject. This file is the
// order they run in, and the order is a contract: `--shard 2/6` hands the
// second sixth of this list to a browser, so a subject moved here moves in
// every shard with it.

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
import { TESTS as settings } from './selftest/settings.js';
import { TESTS as scenes } from './selftest/scenes.js';
import { TESTS as queue } from './selftest/queue.js';
import { TESTS as touch } from './selftest/touch.js';
import { TESTS as sheet } from './selftest/sheet.js';
import { TESTS as times } from './selftest/times.js';

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
  ...settings,
  ...scenes,
  ...queue,
  ...touch,
  ...sheet,
  ...times,
];

// `__test()` runs the lot. `__test('casino')` runs the groups whose name says
// so. `__test('', {i, n})` runs every nth group starting at i, which is how
// `tools/test.mjs` splits the suite across browsers. Every group starts from
// a new game, so any one can run on its own and a failure belongs to the
// group that reports it; `{ solo: false }` is kept only to watch the old
// narrative order.
export async function runTests(filter = '', shard = null, opts = {}) {
  const solo = opts.solo !== false;
  const errs = [];
  const onErr = e => errs.push(String(e.message || e));
  addEventListener('error', onErr);

  newRun();                                            // known state
  await sleep(600);

  const results = [];
  const timing = [];
  // Cut into blocks in file order rather than dealt out round-robin: the
  // opening is the only group that can watch the game open, and a block
  // keeps every group next to the one it was written next to.
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
