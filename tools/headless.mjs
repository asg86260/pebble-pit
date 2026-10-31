// Run __test(), or any expression, against the game in a headless browser.
//
//   node tools/headless.mjs                       # the whole suite
//   node tools/headless.mjs --only casino         # just the groups matching that
//   node tools/headless.mjs --file boards,sheet   # every group in those selftest files
//   node tools/headless.mjs --shard 2/6           # the second sixth of the groups
//   node tools/test.mjs                           # all of them, in parallel
//   node tools/headless.mjs "__state().gw"        # one expression
//   node tools/headless.mjs --shot yard.png "expr"  # set it up, then a look at it
//
// It drives Chrome's debugging protocol over node's own WebSocket (`cdp.mjs`
// is the driving), so there is nothing to install. It needs a dev server up
// (`bun run dev:test`) and the headless shell playwright keeps, found on any
// platform (cdp.mjs, `shellExe`).
//
// It closes every other tab first, on purpose: tabs on one origin share the
// save, and a second live one writes over it every second, which fails the save
// checks for reasons that have nothing to do with the code.

import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { browser, closeOtherTabs, openTab } from './cdp.mjs';

const shot = process.argv[2] === '--shot' ? process.argv[3] : null;
// `--only casino` runs just the groups whose name contains that, which is how
// you check one corner without paying for the whole suite
const only = process.argv[2] === '--only' ? process.argv[3] : null;
// `--file boards,sheet` runs every group written in src/selftest/boards.js and
// sheet.js, read off the files' own group names: what a change to one file is
// checked by. (A name built at run time, `${...}`, is --only's.)
const groupsIn = f => [...readFileSync(`src/selftest/${f}.js`, 'utf8')
  .matchAll(/^(?:  \[|TESTS\.push\(\[)(['"`])((?:\\.|(?!\1).)*)\1,/gm)].map(m => m[2].replace(/\\'/g, "'"));
const fileGroups = process.argv[2] === '--file' ? process.argv[3].split(',').flatMap(groupsIn) : null;

// `--shard 2/6` runs the second sixth of the groups. A sixth of the groups is
// about a sixth of the wall clock, and the suite is one long serial list pinned
// to one core -- which is the only reason it takes three minutes.
//
// A block of the file, in file order, cut at equal measured time off
// test/times.json (`cuts` in selftest.js). Dealing the groups out round-robin
// would balance better and breaks the suite: the order is not decoration.
const shardArg = process.argv[2] === '--shard' ? process.argv[3] : null;
// `--serial` runs the groups one after another without the reset between them,
// which is how the suite used to run. It is here to look at, not to trust.
const serial = process.argv[2] === '--serial';
const profile = process.argv[2] === '--profile' ? process.argv[3] : null;
const TIMES = 'test/times.json';
const times = existsSync(TIMES) ? JSON.parse(readFileSync(TIMES, 'utf8')).browser : null;
const shard = shardArg ? (([i, n]) => ({ i: +i - 1, n: +n, times }))(shardArg.split('/')) : null;

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
           : fileGroups ? `window.__test(${JSON.stringify(fileGroups)})`
           : (process.argv[2] || 'window.__test()');

const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);

// `--profile out.cpuprofile` samples the page while the suite runs, so where the
// three minutes actually go is a measurement rather than a guess.
if (profile) { await tab.send('Profiler.enable'); await tab.send('Profiler.setSamplingInterval', { interval: 1000 }); await tab.send('Profiler.start'); }
// A shard takes minutes; one that has not answered in STALL_MIN (12 by
// default) has a page that stopped answering at all -- a whole tab hung,
// seen on CI as a job that ran into its hour. Rather than wait it out, the
// page is paused where it stands and its stack printed, so the red says
// what was running (TODO.md, "A game in a frame sometimes never boots").
const STALL_MS = (+process.env.STALL_MIN || 12) * 60000;
const stalled = new Promise(r => { const t = setTimeout(() => r('stalled'), STALL_MS); t.unref?.(); });
const out = shard ? await Promise.race([tab.evaluate(expr), stalled]) : await tab.evaluate(expr);
if (out === 'stalled') {
  console.log(`the page has not answered in ${STALL_MS / 60000} minutes`);
  await stackOf(PORT);
  if (tab.logs.length) console.log(['--- console (last 40) ---', ...tab.logs.slice(-40)].join(String.fromCharCode(10)));
  own?.kill();
  process.exit(1);
}
if (profile) {
  const p = await tab.send('Profiler.stop');
  writeFileSync(profile, JSON.stringify(p.result.profile));
  console.log(`wrote ${profile}`);
}
if (shot) {
  await tab.shot(shot);
  console.log(`wrote ${shot}`);
} else {
  // Every group's time on one line, for test/times.json (`tools/times.mjs`),
  // rather than two hundred in the summary.
  const v = out.result?.result?.value;
  if (v?.times) { console.log(`TIMES browser ${JSON.stringify(v.times)}`); delete v.times; }
  console.log(JSON.stringify(v ?? out.result, null, 1));
}
if (tab.logs.length) console.log(['--- console ---', ...tab.logs].join(String.fromCharCode(10)));
await tab.close();
own?.kill();
// A suite's answer fails the run when a check failed or the page threw, so a
// shard in CI goes red; a plain expression, or a shot, only fails if it threw.
const v = out.result?.result?.value;
const red = out.result?.exceptionDetails || (v && typeof v === 'object' && 'total' in v
  && (v.passed < v.total || v.errors?.length));
process.exit(red ? 1 : 0);

// Where a page that stopped answering is: a second debugger session on its
// target pauses it and prints the top of the stack, frames included.
async function stackOf(port) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const t = list.find(x => x.type === 'page');
    if (!t) { console.log('no page to pause'); return; }
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    await new Promise(r => ws.addEventListener('open', r));
    const paused = new Promise(r => ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.method === 'Debugger.paused') r(m.params);
    }));
    ws.send(JSON.stringify({ id: 1, method: 'Debugger.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Debugger.pause' }));
    const p = await Promise.race([paused, new Promise(r => setTimeout(() => r(null), 20000))]);
    if (!p) { console.log('the page would not pause: its renderer is gone or wedged below the script'); return; }
    console.log(`paused (${p.reason}), the stack:`);
    for (const f of p.callFrames.slice(0, 30))
      console.log(`  at ${f.functionName || '(anonymous)'} ${f.url.replace(/^https?:\/\/[^/]+/, '')}:${f.location.lineNumber + 1}:${f.location.columnNumber + 1}`);
    ws.close();
  } catch (e) { console.log(`no stack: ${e?.message || e}`); }
}
