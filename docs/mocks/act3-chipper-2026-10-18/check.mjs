// Plays the chipper mock in a headless, muted shell with real CDP input --
// the drag with the mouse, the hold with the mouse, one drag by touch -- and
// shoots it into snaps/, light and dark: each take idle, a log carried, the
// jaws running, and the feeder working each take.
//
//   node docs/mocks/act3-chipper-2026-10-18/check.mjs
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const port = 9371;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
const wait = ms => new Promise(r => setTimeout(r, ms));
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1260, height: 3400, deviceScaleFactor: 1, mobile: false });

const mouse = (type, p, buttons = 0) => tab.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons, clickCount: 1 });
async function view() { await wait(30); }   // the viewport holds the whole page: no scrolling, so a point is a point
const at = (i, p, one = false) => ev(`__mock.at(${i}, ${p.x}, ${p.y}, ${one})`);
async function shotOf(sel, name) {
  const r = await ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
  const png = await tab.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.result.data, 'base64'));
  console.log(`shot ${name}.png`);
}
// Both themes of one held moment: the sim paused while the pair is taken.
async function pair(sel, name) {
  await ev('__mock.pause(true); 1');
  for (const th of ['light', 'dark']) { await ev(`__mock.theme('${th}'); 1`); await wait(40); await shotOf(sel, `${name}-${th}`); }
  await ev(`__mock.theme('light'); __mock.pause(false); 1`);
}
const say = async (what, i) => console.log(what, JSON.stringify(await ev(`__mock.state(${i})`)));

// A drag with the mouse, pile to `to`, in steps; `mid` is called with the log in the air.
async function drag(i, to, mid) {
  await view(i);
  const from = await at(i, await ev(`__mock.pileTop(${i})`));
  const dest = await at(i, to);
  await mouse('mouseMoved', from); await mouse('mousePressed', from, 1);
  for (let k = 1; k <= 12; k++) { await mouse('mouseMoved', { x: from.x + (dest.x - from.x) * k / 12, y: from.y + (dest.y - from.y) * k / 12 - Math.sin(Math.PI * k / 12) * 60 }, 1); await wait(16); if (k === 7 && mid) await mid(); }
  await mouse('mouseReleased', dest);
}
try {
  await wait(600);
  // each take idle, its drag cue up
  for (let i = 0; i < 3; i++) { await view(i); await wait(700); await pair(`#take-${'abc'[i]} canvas.three`, `idle-${'abc'[i]}`); }

  // a miss: dropped on open ground, the log slides home
  await drag(0, { x: 15 * 6, y: -14 * 6 });
  await say('after a missed drop:', 0); await wait(700); await say('slid home:', 0);
  // a hit, shot while carried
  await drag(0, await ev('__mock.slot()'), () => pair('#take-a canvas.three', 'carried-a'));
  await wait(500); await say('dropped in the jaws:', 0);
  // the hold cue now; then hold the button
  await wait(600); await pair('#take-a canvas.three', 'hold-cue-a');
  const btn = await at(0, await ev('__mock.press(0)'));
  await mouse('mouseMoved', btn); await mouse('mousePressed', btn, 1);
  await wait(1500); await say('held 1.5 s:', 0); await pair('#take-a canvas.three', 'running-a');
  await mouse('mouseReleased', btn); await wait(500); const s1 = await ev('__mock.state(0)'); await wait(500); const s2 = await ev('__mock.state(0)');
  console.log('released: prog', s1.log?.prog?.toFixed(3), 'then', s2.log?.prog?.toFixed(3), '(should hold still)');
  await mouse('mousePressed', btn, 1); await wait(3500); await mouse('mouseReleased', btn);
  await wait(100); await say('held again to the end, then let go:', 0);

  // the lever and the treadle, by the player: drop and hold, shot running
  for (const i of [1, 2]) {
    await drag(i, await ev('__mock.slot()'));
    await wait(500);
    const b = await at(i, await ev(`__mock.press(${i})`));
    await mouse('mouseMoved', b); await mouse('mousePressed', b, 1); await wait(1300);
    await say(`take ${'abc'[i]} held:`, i); await pair(`#take-${'abc'[i]} canvas.three`, `running-${'abc'[i]}`);
    await mouse('mouseReleased', b);
  }

  // touch: one drag on the 1x picture of take b, after its log is done
  await ev(`__mock.takes[1].st = (() => { const s = __mock.takes[1].st; s.log = null; return s; })(); 1`);
  await view(1);
  const tf = await at(1, await ev('__mock.pileTop(1)'), true), tt = await at(1, await ev('__mock.slot()'), true);
  await tab.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await tab.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: tf.x, y: tf.y }] });
  for (let k = 1; k <= 8; k++) { await tab.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: tf.x + (tt.x - tf.x) * k / 8, y: tf.y + (tt.y - tf.y) * k / 8 }] }); await wait(16); }
  await tab.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await tab.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await wait(500); await say('touch drag on the 1x:', 1);

  // the feeder on each take, shot while it runs the jaws
  for (let i = 0; i < 3; i++) {
    await ev(`__mock.takes[${i}].st.log = null; __mock.feeder(${i}, true); 1`);
    await view(i);
    let ok = false;
    for (let k = 0; k < 120 && !ok; k++) { await wait(100); ok = (await ev(`__mock.state(${i})`)).running; }
    await wait(700);
    await say(`feeder ${'abc'[i]}:`, i); await pair(`#take-${'abc'[i]} canvas.three`, `worker-${'abc'[i]}`);
  }
  // the whole page, light, at a glance
  await ev('scrollTo(0, 0); 1');
} finally {
  const errs = tab.logs.filter(l => l.startsWith('EXCEPTION'));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await tab.close(); own?.kill();
}
