// Plays the workshop mock in a headless, muted shell with real CDP taps --
// clicks with the mouse and taps by touch on the nails -- and shoots it into
// snaps/, light and dark: the four roofs, the pick beside the press, nails
// mid-sign, a finished sign carried off, and the joiner on their own.
//
//   node docs/mocks/act3-workshop-2026-10-18/check.mjs
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const port = 9481;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
const wait = ms => new Promise(r => setTimeout(r, ms));
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1960, height: 1400, deviceScaleFactor: 1, mobile: false });
const st = () => ev('__mock.state()');
const say = async what => { const s = await st(); console.log(what, JSON.stringify({ t: +s.t.toFixed(1), nails: s.nails, q: s.q, phase: s.phase, car: s.car.st, signs: s.signs, made: s.made, taps: s.taps, cue: +s.cue.toFixed(2) })); return s; };
async function shot(name, clip) {
  const png = await tab.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 }, captureBeyondViewport: true });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.result.data, 'base64'));
  console.log(`shot ${name}.png`);
}
const rectOf = async sel => { const r = await ev(`__mock.rect('${sel}')`); return { x: r.x, y: r.y, width: r.w, height: r.h }; };
async function pair(name, sel) {
  await ev('__mock.pause(true); 1');
  for (const th of ['light', 'dark']) { await ev(`__mock.theme('${th}'); 1`); await wait(80); await shot(`${name}-${th}`, await rectOf(sel)); }
  await ev(`__mock.theme('light'); __mock.pause(false); 1`);
}
// Input lands in the viewport, so the playable picture is scrolled into it first.
const view = async () => { await ev(`document.getElementById('stage').scrollIntoView({ block: 'start' }); 1`); await wait(50); };
const click = async p => {
  await tab.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y });
  await tab.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1 });
  await tab.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1 });
};
const touch = async p => {
  await tab.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] });
  await tab.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
const tapNail = async (i, how = click) => { await how(await ev(`__mock.nail(${i})`)); await wait(40); };
async function waitFor(fn, ms = 20000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(); if (fn(s)) return s; await wait(25); } throw new Error('timed out'); }

try {
  await wait(400);
  console.log('one sign, seconds:', JSON.stringify(await ev('__mock.measure()')));
  await ev('__mock.set({ joiner: false }); 1');
  await pair('roofs', '#roofs3');
  await pair('roofs-1x', '#roofs1');
  await pair('pick', '#pick');
  await pair('states', '#states');
  await view();
  // misses: a tap on the shed's wall left of the bench, and one on the roof
  await click(await ev('__mock.client(6.5, -7)')); await click(await ev('__mock.client(15, -19)')); await wait(100);
  await say('after two misses:');
  await pair('cue', '#stage');
  await view();
  // mouse: nail 1 twice, nail 3 once
  await tapNail(0); await tapNail(0); await tapNail(2);
  await waitFor(s => !s.act && !s.q.length);
  await tapNail(2); await tapNail(2);           // the second of these is a third on nail 3: a miss
  await tapNail(1);
  await waitFor(s => !s.act && !s.q.length);
  await say('mid-sign (mouse):');
  await pair('nails-mid', '#stage');
  await view();
  // touch: finish it
  await tab.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await tapNail(1, touch); await tapNail(3, touch); await tapNail(3, touch);
  await tab.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await say('after touch taps:');
  await waitFor(s => s.car.st === 'out' && s.car.x >= 27);
  await say('carrying:'); await pair('carry', '#stage');
  await waitFor(s => s.car.st === 'lay' && s.board.row >= -2, 8000).catch(() => {});
  await say('laying:'); await pair('lay', '#stage');
  await waitFor(s => s.phase === 'work');
  await say('next blank in:');
  await view();
  for (let k = 0; k < 3; k++) {
    for (const i of [0, 1, 2, 3, 0, 1, 2, 3]) await tapNail(i);
    await waitFor(s => s.phase === 'work' && s.made === k + 2, 20000);
    await say(`sign ${k + 2} done:`);
  }
  await wait(1500); await say('after four signs (cue gone?):');
  // the joiner alone
  await ev('__mock.set({ joiner: true }); 1');
  const a = await st(); await wait(5000); const b = await st();
  console.log('joiner alone: blows in 5 s =', b.taps.his - a.taps.his, ' nails', JSON.stringify(b.nails));
  await waitFor(s => s.act && s.act.st === 'strike');
  await say('joiner striking:'); await pair('worker', '#stage');
  await pair('yard-1x', '#small');
} finally {
  const errs = tab.logs.filter(l => l.startsWith('EXCEPTION'));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await tab.close(); own?.kill();
}
