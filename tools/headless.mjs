// Run __test(), or any expression, against the game in a headless browser.
//
//   node tools/headless.mjs                       # the whole suite
//   node tools/headless.mjs --only casino         # just the groups matching that
//   node tools/headless.mjs --shard 2/6           # the second sixth of the groups
//   node tools/test.mjs                           # all of them, in parallel
//   node tools/headless.mjs "__state().gw"        # one expression
//   node tools/headless.mjs --shot yard.png "expr"  # set it up, then a look at it
//
// It drives Chrome's debugging protocol over node's own WebSocket, so there is
// nothing to install. It needs a dev server up (`bun run dev`) and the headless
// shell playwright keeps in %LOCALAPPDATA%/ms-playwright.
//
// It closes every other tab first, on purpose: tabs on one origin share the
// save, and a second live one writes over it every second, which fails the save
// checks for reasons that have nothing to do with the code.

import { spawn } from 'node:child_process';
import { writeFileSync, readdirSync } from 'node:fs';

const URL_ = process.env.GAME || 'http://localhost:5184/';
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

// A shard gets its own browser on its own port with its own profile. Sharing one
// would be worse than serial: this script closes every other tab before it starts
// -- tabs on one origin share the save, and a second live one writes over it
// every second -- so two shards on one browser would shut each other down.
const PORT = +(process.env.CDP_PORT || 9333) + (shard ? shard.i : 0);
const PROFILE = `${process.env.TEMP}/boulder-headless${shard ? shard.i : ''}`;

const expr = serial ? `window.__test(${JSON.stringify(process.argv[3] || '')}, null, { solo: false })`
           : profile ? (process.argv[4] || 'window.__test()')
           : shot ? (process.argv[4] || 'true')
           : shard ? `window.__test('', ${JSON.stringify(shard)})`
           : only ? `window.__test(${JSON.stringify(only)})`
           : (process.argv[2] || 'window.__test()');

const root = `${process.env.LOCALAPPDATA}/ms-playwright`;
const dir = readdirSync(root).find(d => d.startsWith('chromium_headless_shell-'));
const exe = `${root}/${dir}/chrome-headless-shell-win64/chrome-headless-shell.exe`;

const alive = async () => { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); return true; }
                            catch { return false; } };

let own = null;
if (!await alive()) {
  // `WINDOW=1600,1000` for a shot you want to see the sky in: this game wants
  // eight hundred and thirty of height before the sky, the ground and the whole
  // depth of the pit all fit, and the shell's default is 800 by 600.
  //
  // It is not the default, and that is a measurement rather than a preference: a
  // window that size is two and a half times the pixels, which takes the frame
  // rate from sixty to twenty-six on this machine -- and the suite has checks in
  // it that count on frames arriving at the usual rate.
  const win = process.env.WINDOW ? [`--window-size=${process.env.WINDOW}`] : [];
  own = spawn(exe, [`--remote-debugging-port=${PORT}`, '--no-first-run',
                    ...win, `--user-data-dir=${PROFILE}`], { stdio: 'ignore' });
  for (let i = 0; i < 40 && !await alive(); i++) await new Promise(r => setTimeout(r, 250));
}

for (const t of await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json())
  await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);

const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_)}`,
                               { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
const waiting = new Map();
let n = 0;
const logs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  if (m.method === 'Runtime.consoleAPICalled') {
    const line = m.params.args.map(a => a.value ?? a.description ?? '').join(' ');
    logs.push(line);
    // Printed as it arrives when asked for, so a run that never finishes still
    // says how far it got. A suite that hangs is otherwise a silent one.
    if (process.env.LIVE) console.log(line);
  }
  if (m.method === 'Runtime.exceptionThrown')
    logs.push('EXCEPTION ' + (m.params.exceptionDetails.exception?.description ||
                              m.params.exceptionDetails.text || ''));
});
const send = (method, params = {}) =>
  new Promise(res => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });

await new Promise(r => ws.addEventListener('open', r));
await send('Runtime.enable');
await send('Page.enable');
// wait for the game to be there rather than guessing at how long it takes
for (let i = 0; i < 100; i++) {
  const probe = await send('Runtime.evaluate', { expression: 'typeof window.__test', returnByValue: true });
  if (probe.result?.result?.value === 'function') break;
  await new Promise(r => setTimeout(r, 100));
}

// `--profile out.cpuprofile` samples the page while the suite runs, so where the
// three minutes actually go is a measurement rather than a guess.
if (profile) { await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 1000 }); await send('Profiler.start'); }
const out = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
if (profile) {
  const p = await send('Profiler.stop');
  writeFileSync(profile, JSON.stringify(p.result.profile));
  console.log(`wrote ${profile}`);
}
if (shot) {
  const png = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(shot, Buffer.from(png.result.data, 'base64'));
  console.log(`wrote ${shot}`);
} else {
  console.log(JSON.stringify(out.result?.result?.value ?? out.result, null, 1));
}
// anything the page said for itself: a module that would not load says so here
// and nowhere else, and a silent page is the confusing kind of broken
if (logs.length) console.log(['--- console ---', ...logs].join(String.fromCharCode(10)));
// Shut the tab. A page left open goes on running the game for ever -- sixty
// frames a second of a yard nobody is looking at -- and a browser this script
// found already running is one it does not kill, so the tabs pile up and every
// one of them keeps a core busy. That is a runner that makes the next run of
// itself slower.
try { await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`); } catch {}
own?.kill();
process.exit(0);
