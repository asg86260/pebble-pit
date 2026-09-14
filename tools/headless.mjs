// Run __test(), or any expression, against the game in a headless browser.
//
//   node tools/headless.mjs                       # the whole suite
//   node tools/headless.mjs --only casino         # just the groups matching that
//   node tools/headless.mjs --shard 2/6           # the second sixth of the groups
//   node tools/test.mjs                           # all of them, in parallel
//   node tools/headless.mjs "__state().gw"        # one expression
//   node tools/headless.mjs --shot yard.png "expr"  # set it up, then a look at it
//
// It drives Chrome's debugging protocol over node's own WebSocket (`cdp.mjs`
// is the driving), so there is nothing to install. It needs a dev server up
// (`bun run dev`) and the headless shell playwright keeps in
// %LOCALAPPDATA%/ms-playwright.
//
// It closes every other tab first, on purpose: tabs on one origin share the
// save, and a second live one writes over it every second, which fails the save
// checks for reasons that have nothing to do with the code.

import { writeFileSync } from 'node:fs';
import { browser, closeOtherTabs, openTab } from './cdp.mjs';

const shot = process.argv[2] === '--shot' ? process.argv[3] : null;
// `--only casino` runs just the groups whose name contains that, which is how
// you check one corner without paying for the whole suite
const only = process.argv[2] === '--only' ? process.argv[3] : null;

// `--shard 2/6` runs the second sixth of the groups. A sixth of the groups is
// about a sixth of the wall clock, and the suite is one long serial list pinned
// to one core -- which is the only reason it takes three minutes.
//
// A block of the file, in file order. Dealing the groups out round-robin balances
// the slow ones better and breaks the suite: the order is not decoration -- see
// `runTests`.
const shardArg = process.argv[2] === '--shard' ? process.argv[3] : null;
// `--serial` runs the groups one after another without the reset between them,
// which is how the suite used to run. It is here to look at, not to trust.
const serial = process.argv[2] === '--serial';
const profile = process.argv[2] === '--profile' ? process.argv[3] : null;
const shard = shardArg ? (([i, n]) => ({ i: +i - 1, n: +n }))(shardArg.split('/')) : null;

// A shard gets its own browser on its own port (and so, in `cdp.mjs`, its own
// profile). Sharing one would be worse than serial: this script closes every
// other tab before it starts -- tabs on one origin share the save, and a
// second live one writes over it every second -- so two shards on one browser
// would shut each other down.
const PORT = +(process.env.CDP_PORT || 9333) + (shard ? shard.i : 0);

const expr = serial ? `window.__test(${JSON.stringify(process.argv[3] || '')}, null, { solo: false })`
           : profile ? (process.argv[4] || 'window.__test()')
           : shot ? (process.argv[4] || 'true')
           : shard ? `window.__test('', ${JSON.stringify(shard)})`
           : only ? `window.__test(${JSON.stringify(only)})`
           : (process.argv[2] || 'window.__test()');

const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);

// `--profile out.cpuprofile` samples the page while the suite runs, so where the
// three minutes actually go is a measurement rather than a guess.
if (profile) { await tab.send('Profiler.enable'); await tab.send('Profiler.setSamplingInterval', { interval: 1000 }); await tab.send('Profiler.start'); }
const out = await tab.evaluate(expr);
if (profile) {
  const p = await tab.send('Profiler.stop');
  writeFileSync(profile, JSON.stringify(p.result.profile));
  console.log(`wrote ${profile}`);
}
if (shot) {
  await tab.shot(shot);
  console.log(`wrote ${shot}`);
} else {
  console.log(JSON.stringify(out.result?.result?.value ?? out.result, null, 1));
}
if (tab.logs.length) console.log(['--- console ---', ...tab.logs].join(String.fromCharCode(10)));
await tab.close();
own?.kill();
process.exit(0);
