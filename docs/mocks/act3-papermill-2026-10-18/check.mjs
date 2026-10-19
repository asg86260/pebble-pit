// Plays the paper mill mock in a headless, muted shell with real CDP input --
// circles on the vat with the mouse, a few by touch -- and shoots it into
// snaps/, light and dark: the line mid-cycle, a sheet lifting out, the drying
// stages close up, a sheet carried to the stack, the pulper on its own, and
// the doubled output.
//
//   node docs/mocks/act3-papermill-2026-10-18/check.mjs
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const port = 9473;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
const wait = ms => new Promise(r => setTimeout(r, ms));
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 2600, deviceScaleFactor: 1, mobile: false });
const st = () => ev('__mock.state()');
const say = async what => { const s = await st(); console.log(what, JSON.stringify({ t: +s.t.toFixed(1), prog: +s.prog.toFixed(2), rev: +s.rev.toFixed(2), pul: s.pul.st, loft: s.loft.st, line: s.sheets.map(x => x.dry), pile: s.pile, stall: s.stall })); return s; };

async function shot(name, clip) {
  const png = await tab.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.result.data, 'base64'));
  console.log(`shot ${name}.png`);
}
const rectOf = async sel => { const r = await ev(`__mock.rect('${sel}')`); return { x: r.x, y: r.y, width: r.w, height: r.h }; };
// Both themes of one held moment.
async function pair(name, clipFn) {
  await ev('__mock.pause(true); 1');
  for (const th of ['light', 'dark']) { await ev(`__mock.theme('${th}'); 1`); await wait(60); await shot(`${name}-${th}`, await clipFn()); }
  await ev(`__mock.theme('light'); __mock.pause(false); 1`);
}
const bigClip = () => rectOf('#big');

// Circles on the vat with the mouse, `rev` turns a second, until `until` says so
// (checked every few moves) or `secs` run out. The button is held throughout.
const mouse = (type, p, buttons = 0) => tab.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons, clickCount: 1 });
async function stir({ rev = 1.1, secs = 6, until = null, touch = false } = {}) {
  const c = await ev(`__mock.client(__mock.vat.x, __mock.vat.y)`), e = await ev(`__mock.client(__mock.vat.x + 4.5, __mock.vat.y + 2)`);
  const rx = e.x - c.x, ry = e.y - c.y, pt = a => ({ x: c.x + rx * Math.cos(a), y: c.y + ry * Math.sin(a) });
  let a = 0; const t0 = Date.now(); let last = t0;
  if (touch) { await tab.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 }); await tab.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt(a)] }); }
  else { await mouse('mouseMoved', pt(a)); await mouse('mousePressed', pt(a), 1); }
  let n = 0, hit = null;
  while (Date.now() - t0 < secs * 1000) {
    await wait(16); const now = Date.now(); a += 2 * Math.PI * rev * (now - last) / 1000; last = now;
    if (touch) await tab.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [pt(a)] }); else await mouse('mouseMoved', pt(a), 1);
    if (until && ++n % 3 === 0) { const s = await st(); if (until(s)) { hit = s; break; } }
  }
  if (touch) { await tab.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await tab.send('Emulation.setTouchEmulationEnabled', { enabled: false }); }
  else await mouse('mouseReleased', pt(a));
  return hit;
}
async function waitFor(fn, ms = 30000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(); if (fn(s)) return s; await wait(30); } throw new Error('timed out'); }

try {
  await wait(500);
  // 0. the throughput table: sheets a minute, and how long the full batch waits on the line
  for (const [m, n] of [[1, 4], [2, 4], [1, 8], [2, 8]]) for (const r of ['worker', 0.6, 1.2])
    console.log(`moulds ${m} slots ${n} ${r === 'worker' ? 'pulper ' : 'hand ' + r}:`, JSON.stringify(await ev(`__mock.measure(${m}, ${n}, ${JSON.stringify(r)}, 240)`)));
  if (process.env.ONLY_TABLE) process.exit(0);
  // 1. the first batch by the mouse: shot as the mould comes out
  await say('start:');
  const lifted = await stir({ rev: 1.1, secs: 12, until: s => s.pul.st === 'lift' && s.pul.k >= 6 });
  console.log('lift reached by stirring:', !!lifted);
  await say('lifting:'); await pair('lift', bigClip);
  // and the 3x crop of the vat
  await ev('__mock.pause(true); 1');
  for (const th of ['light', 'dark']) { await ev(`__mock.theme('${th}'); 1`); await wait(60); const a = await ev('__mock.client(4, -19)'), b = await ev('__mock.client(30, 1)'); await shot(`lift-close-${th}`, { x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y }); }
  await ev(`__mock.theme('light'); __mock.pause(false); 1`);
  await waitFor(s => s.pul.st === 'stir');
  // 2. keep stirring: a slower hand, then the fastest, a few batches
  for (const rev of [0.6, 1.3, 1.3, 1.3, 1.3]) { await stir({ rev, secs: 7 }); await say(`after 7 s at ${rev} turns/s:`); }
  // a few circles by touch
  const before = (await st()).prog;
  await stir({ rev: 1, secs: 2, touch: true });
  console.log('touch stir moved the batch from', before.toFixed(2), 'to', (await st()).prog.toFixed(2));
  await stir({ rev: 1.3, secs: 6 });
  await say('line mid-cycle:'); await pair('line-mid', bigClip);
  // 3. the drying stages, close up at 3x on the line, and the held strip
  await ev('__mock.pause(true); 1');
  for (const th of ['light', 'dark']) {
    await ev(`__mock.theme('${th}'); 1`); await wait(60);
    const a = await ev('__mock.client(8, -20)'), b = await ev('__mock.client(40, -8)');
    await shot(`stages-line-${th}`, { x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y });
    await shot(`stages-held-${th}`, await rectOf('#stages'));
  }
  await ev(`__mock.theme('light'); __mock.pause(false); 1`);
  // 4. carried to the stack
  await stir({ rev: 1.2, secs: 30, until: s => s.loft.st === 'down' && s.loft.y >= -60 });
  await say('carrying:'); await pair('carry', bigClip);
  await waitFor(s => s.loft.st === 'land'); await wait(150); await say('landing:'); await pair('land', bigClip);
  // 5. the pulper on its own, slower: the hand off
  await ev('__mock.set({ worker: true }); 1');
  const p0 = await st(); await wait(4000); const p1 = await st();
  console.log('pulper alone: batch', p0.prog.toFixed(2), '->', p1.prog.toFixed(2), 'in 4 s (', ((p1.prog - p0.prog) / 4).toFixed(2), 'turns/s)');
  await ev('__mock.warp(40); 1'); await wait(300);
  await say('pulper, 40 s on:'); await pair('worker', bigClip);
  // the 1x row beside the yard tower
  await pair('row-1x', () => rectOf('#row'));
  // 6. double output: the two-sheet mould on the short line stalls; on the long line it keeps up
  await ev('__mock.reset(); __mock.set({ worker: false, moulds: 2, slots: 4 }); 1');
  await stir({ rev: 1.3, secs: 32 });
  const sh = await say('two-sheet mould, short line, fastest hand:');
  await stir({ rev: 1.3, secs: 15, until: s => s.stall && s.loft.st === 'rest' });
  await say('stalled?:'); await pair('upgrade-short-stall', bigClip);
  await ev('__mock.reset(); __mock.set({ moulds: 2, slots: 8 }); 1');
  await wait(200);
  await stir({ rev: 1.3, secs: 40 });
  await stir({ rev: 1.3, secs: 12, until: s => s.pul.st === 'lift' && s.pul.k >= 7 });
  await say('two-sheet mould, long line:'); await pair('upgrade', bigClip);
  await stir({ rev: 1.3, secs: 20 });
  await say('long line, 20 s more:'); await pair('upgrade-run', bigClip);
  await pair('upgrade-row-1x', () => rectOf('#row'));
} finally {
  const errs = tab.logs.filter(l => l.startsWith('EXCEPTION'));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await tab.close(); own?.kill();
}
