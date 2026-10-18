// Plays the chosen control, the arm, in a headless, muted shell with real CDP
// mouse input -- drag a log in, a partial pull, the pull to the bottom and the
// hold, the release, the resume -- then posts the feeder, and shoots each
// moment into snaps/arm-*.png, light and dark.
//
//   node docs/mocks/act3-chipper-2026-10-18/check-arm.mjs
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const port = 9373;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
const wait = ms => new Promise(r => setTimeout(r, ms));
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1260, height: 4600, deviceScaleFactor: 1, mobile: false });

const I = 3, SEL = '#take-arm canvas.three', SEL1 = '#take-arm canvas.one';
const mouse = (type, p, buttons = 0) => tab.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', buttons, clickCount: 1 });
const at = (p, one = false) => ev(`__mock.at(${I}, ${p.x}, ${p.y}, ${one})`);
const st = () => ev(`__mock.state(${I})`);
const say = async what => { const s = await st(); console.log(what, JSON.stringify({ pose: s.pose, target: s.target, armDrag: s.armDrag, running: s.running, bite: s.bite, drop: s.drop, cuts: s.log?.cuts, done: s.done, ride: s.ride, fHeld: s.fHeld })); return s; };
let fails = 0;
const expect = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails++; };
async function shotOf(sel, name) {
  const r = await ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
  const png = await tab.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.result.data, 'base64'));
  console.log(`  shot ${name}.png`);
}
// Both themes of one held moment, the sim paused while the pair is taken.
async function pair(name, keepPaused = false, sel = SEL) {
  await ev('__mock.pause(true); 1');
  for (const th of ['light', 'dark']) { await ev(`__mock.theme('${th}'); 1`); await wait(40); await shotOf(sel, `arm-${name}-${th}`); }
  await ev(`__mock.theme('light'); ${keepPaused ? '' : '__mock.pause(false);'} 1`);
}
// Step the paused sim until `cond` holds, a 60th at a time.
async function stepUntil(cond, limit = 600) {
  for (let k = 0; k < limit; k++) { if (await ev(`(() => { const s = __mock.state(${I}); return ${cond}; })()`)) return true; await ev('__mock.advance(1/60); 1'); }
  return false;
}

try {
  await wait(700);
  await pair('idle');

  // 1. drag a log off the pile into the jaws
  const from = await at(await ev(`__mock.pileTop(${I})`)), dest = await at(await ev('__mock.slot()'));
  await mouse('mouseMoved', from); await mouse('mousePressed', from, 1);
  for (let k = 1; k <= 12; k++) { await mouse('mouseMoved', { x: from.x + (dest.x - from.x) * k / 12, y: from.y + (dest.y - from.y) * k / 12 - Math.sin(Math.PI * k / 12) * 60 }, 1); await wait(16); if (k === 8) await pair('carried'); }
  await mouse('mouseReleased', dest);
  await wait(600);
  let s = await say('dropped:');
  expect(s.log && s.log.settled, 'the log is in the jaws');
  await wait(500); await pair('cue-pull');

  // 2. a partial pull: the arm shows 45 degrees and nothing bites
  const knob = await at(await ev(`__mock.knob(${I})`));
  const drop = await ev('(() => { const a = __mock.at(3, 0, 0), b = __mock.at(3, 0, 36); return b.y - a.y; })()');   // the knob's whole fall on the 3x canvas
  await mouse('mouseMoved', knob); await mouse('mousePressed', knob, 1);
  for (let k = 1; k <= 5; k++) { await mouse('mouseMoved', { x: knob.x, y: knob.y + drop * 0.5 * k / 5 }, 1); await wait(16); }
  await wait(800);
  s = await say('half pulled:');
  expect(s.pose === 1 && !s.running && s.log.cuts === 0 && s.drop === 0, 'a half pull holds the arm at 45 degrees and the jaws do not bite');
  await pair('partial');

  // 3. on down to the bottom, along the arc, and hold
  for (let k = 1; k <= 6; k++) { await mouse('mouseMoved', { x: knob.x - drop * 0.6 * k / 6, y: knob.y + drop * (0.5 + 0.6 * k / 6) }, 1); await wait(16); }
  await wait(150);
  await ev('__mock.pause(true); 1');
  s = await say('at the bottom:');
  expect(s.pose === 2 && s.running, 'held at the bottom, the jaws bite');
  await stepUntil('s.bite === 1'); await pair('held', true);
  await stepUntil('s.bite === 3'); await pair('held-kerf', true);
  const cutsKerf = (await st()).log.cuts;
  await stepUntil('s.bite === 5'); await pair('held-bite', true);
  await shotOf(SEL1, 'arm-held-bite-1x-light');
  await stepUntil('s.bite === 7'); await pair('held-lift', true);
  s = await say('one bite on:');
  expect(s.log.cuts === cutsKerf + 1, 'the bite cut one cell, on the lift');
  await ev('__mock.pause(false); 1');
  await wait(1200);

  // 4. release: it springs up a pose at a time; the jaw finishes its bite and lifts
  await wait(300);
  await ev('__mock.pause(true); 1');
  await stepUntil('s.bite === 4');
  const cutsAt = (await st()).log.cuts;
  await mouse('mouseReleased', { x: knob.x - drop * 0.6, y: knob.y + drop * 1.1 });
  const seen = [];
  for (let k = 0; k < 30; k++) { await ev('__mock.advance(1/60); 1'); const q = await st(); if (seen[seen.length - 1] !== q.pose) seen.push(q.pose); if (q.pose === 1 && !seen.shot) { seen.shot = 1; await pair('spring', true); } }
  console.log('poses after the release:', seen.join(' -> '));
  expect(seen.join(',') === '2,1,0', 'the arm springs back 2 -> 1 -> 0, a pose at a time');
  await stepUntil('s.bite === -1');
  s = await say('bite finished:');
  expect(s.drop === 0 && s.log.cuts === cutsAt + 1, 'the jaw finished the bite it was in (one cut) and lifted open');
  await pair('stopped');
  await wait(1000);
  const s2 = await say('a second later:');
  expect(s2.log.cuts === s.log.cuts && !s2.running && s2.drop === 0, 'let go, the log stays mid-cut and the jaws stay open');

  // 5. resume: pull to the bottom again and hold to the end of the log
  const k2 = await at(await ev(`__mock.knob(${I})`));
  await mouse('mouseMoved', k2); await mouse('mousePressed', k2, 1);
  for (let k = 1; k <= 8; k++) { await mouse('mouseMoved', { x: k2.x, y: k2.y + drop * 1.05 * k / 8 }, 1); await wait(16); }
  await wait(250);
  s = await say('pulled again:');
  expect(s.running, 'pulled again straight down, the jaws go on');
  await ev('__mock.pause(true); 1');
  await stepUntil('s.log === null', 2000);
  s = await say('held to the end:');
  expect(s.done === 1, 'the log is chipped through');
  await mouse('mouseReleased', k2);
  await stepUntil('s.pose === 0 && s.bite === -1');
  await pair('done');

  // 6. the feeder: it hops up, rides the arm down and holds it there
  await ev(`__mock.feeder(${I}, true); 1`);
  const rode = await stepUntil('s.ride && s.pose === 1', 4000);
  expect(rode, 'the feeder rides the arm down');
  await pair('feeder-ride', true);
  await stepUntil('s.fHeld && s.running', 600);
  await stepUntil('s.bite === 5', 120);
  s = await say('feeder holding:');
  expect(s.fHeld && s.running, 'the feeder holds the arm at the bottom and the jaws bite');
  await pair('feeder-hold', true);
  await shotOf(SEL1, 'arm-feeder-hold-1x-light');
  await stepUntil('!s.ride && s.log && s.log.cuts >= 3 && s.pose === 0', 1200);
  s = await say('feeder resting:');
  expect(!s.ride && s.pose === 0 && s.log.cuts >= 3 && s.log.cuts < 6, 'half way it lets go and rests; the arm is up');
  await pair('feeder-rest', true);
  await stepUntil('s.hop > 0 && s.hop < 0.14', 600); await pair('feeder-crouch', true);
  await stepUntil('s.done === 2', 3000);
  s = await say('feeder done a log:');
  expect(s.done === 2, 'the feeder chips a log through');
  await ev('__mock.pause(false); 1');
} finally {
  const errs = tab.logs.filter(l => l.startsWith('EXCEPTION'));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all ok');
  await tab.close(); own?.kill();
}
