// Run __test(), or any expression, against the game in a headless browser.
//
//   node tools/headless.mjs                       # the whole suite
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
const PORT = +(process.env.CDP_PORT || 9333);
const shot = process.argv[2] === '--shot' ? process.argv[3] : null;
const expr = shot ? (process.argv[4] || 'true') : (process.argv[2] || 'window.__test()');

const root = `${process.env.LOCALAPPDATA}/ms-playwright`;
const dir = readdirSync(root).find(d => d.startsWith('chromium_headless_shell-'));
const exe = `${root}/${dir}/chrome-headless-shell-win64/chrome-headless-shell.exe`;

const alive = async () => { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); return true; }
                            catch { return false; } };

let own = null;
if (!await alive()) {
  own = spawn(exe, [`--remote-debugging-port=${PORT}`, '--no-first-run',
                    `--user-data-dir=${process.env.TEMP}/boulder-headless`], { stdio: 'ignore' });
  for (let i = 0; i < 40 && !await alive(); i++) await new Promise(r => setTimeout(r, 250));
}

for (const t of await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json())
  await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`);

const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(URL_)}`,
                               { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
const waiting = new Map();
let n = 0;
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
});
const send = (method, params = {}) =>
  new Promise(res => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });

await new Promise(r => ws.addEventListener('open', r));
await send('Runtime.enable');
await send('Page.enable');
await new Promise(r => setTimeout(r, 3500));       // the game lays itself out

const out = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
if (shot) {
  const png = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(shot, Buffer.from(png.result.data, 'base64'));
  console.log(`wrote ${shot}`);
} else {
  console.log(JSON.stringify(out.result?.result?.value ?? out.result, null, 1));
}
own?.kill();
process.exit(0);
