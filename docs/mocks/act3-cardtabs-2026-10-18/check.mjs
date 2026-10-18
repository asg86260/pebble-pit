// Drives the act 3 card-tabs mock with real mouse and touch input over CDP
// (a muted headless shell, never on screen): opens the saw mill's card by a
// click on the station, switches its tabs by a click on each, buys a row the
// purse can pay and tries one it cannot, opens the shack's card, and does the
// same on the phone frame by touch. Asserts what the page claims, then shoots
// each option -- mill work, mill upgrades, shack build, the pedestal, and the
// phone's mill and shack -- light and dark, into snaps/.
//
//   node docs/mocks/act3-cardtabs-2026-10-18/check.mjs
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const port = 9363;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.evaluate(e); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1040, height: 1500, deviceScaleFactor: 1, mobile: false });
const wait = ms => new Promise(r => setTimeout(r, ms));

const lines = [];
const ok = (cond, what) => { lines.push((cond ? 'OK   ' : 'FAIL ') + what); };

// --- real input -------------------------------------------------------------
const mouse = (type, x, y, buttons) => tab.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1, pointerType: 'mouse' });
async function click(p) { await mouse('mouseMoved', p.x, p.y, 0); await mouse('mousePressed', p.x, p.y, 1); await mouse('mouseReleased', p.x, p.y, 0); }
const touch = (type, x, y) => tab.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
async function tap(p) { await touch('touchStart', p.x, p.y); await touch('touchEnd', p.x, p.y); }
const press = (id, p) => (id === 'phone' ? tap(p) : click(p));
// Points come back in client px: scroll the stage into view first, so they are on the glass.
const into = id => ev(`document.getElementById('${id}').scrollIntoView({ block: 'start' }); window.scrollBy(0, -8); 1`);
const shot = async (id, name) => {
  const r = await ev(`(() => { const r = document.getElementById('${id}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
  await tab.shot(`${OUT}/${name}.png`, { clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
};
const state = id => ev(`__mock.state('${id}')`);

async function openMill(id) {
  await into(id); await wait(50);
  await press(id, await ev(`__mock.site('${id}', 'mill')`)); await wait(450);
}

for (const theme of ['light', 'dark']) {
  await ev(`__mock.theme('${theme}')`);
  for (const opt of ['a', 'b', 'c']) {
    await ev(`__mock.reset(); __mock.option('${opt}')`); await wait(300);
    const tag = `${opt}`;
    // --- desk: the saw mill, work then upgrades ---
    await openMill('desk');
    let s = await state('desk');
    ok(s.open === 'mill' && s.tab === 'work' && s.cardOn, `${theme} ${tag}: a click on the saw mill opens its card on work (${JSON.stringify(s)})`);
    await shot('desk', `${opt}-mill-work-${theme}`);
    const t = await ev(`__mock.tab('desk', 'upgrades')`);
    await click(t); await wait(120);
    const mid = await state('desk');
    await wait(500);
    s = await state('desk');
    ok(s.tab === 'upgrades' && (opt === 'b' ? s.panel : s.faceOpacity === 1), `${theme} ${tag}: a click on the upgrades tab switches to it (${opt === 'b' ? 'the sheet stands' : 'face opacity ' + s.faceOpacity}; mid-fade it read ${mid.faceOpacity ?? (mid.panel ? 'sheet' : '-')})`);
    await shot('desk', `${opt}-mill-upgrades-${theme}`);
    if (theme === 'light') {
      // buy the heap (paid), try the blade (short)
      const p0 = await ev('__mock.purse()');
      const post = opt === 'c' ? 'up-heap' : 'up-heap';
      await click(await ev(`__mock.tile('desk', '${post}')`)); await wait(250);
      const p1 = await ev('__mock.purse()');
      ok(p1.rebel === p0.rebel - 60 && p1.timber === p0.timber - 10 && p1.dust === p0.dust - 800, `${tag}: a click on "bigger heap" spends rebel 60, timber 10, dust 800 (${JSON.stringify(p0)} -> ${JSON.stringify(p1)})`);
      const done = await ev(`document.querySelector('${opt === 'b' ? '#desk .panel' : '#desk .card'} .tile[data-key="up-heap"]').className`);
      ok(/done/.test(done), `${tag}: the row reads bought (${done})`);
      await click(await ev(`__mock.tile('desk', 'up-blade')`)); await wait(200);
      const p2 = await ev('__mock.purse()');
      ok(JSON.stringify(p2) === JSON.stringify(p1), `${tag}: a click on "second blade", short of timber and crops, spends nothing`);
      // and a post, on whichever tab carries it
      if (opt === 'c') { await click(await ev(`__mock.tab('desk', 'work')`)); await wait(500); }
      const rebel0 = (await ev('__mock.purse()')).rebel;
      await click(await ev(`__mock.tile('desk', 'post-sawyer')`)); await wait(250);
      const p3 = await ev('__mock.purse()');
      ok(p3.rebel === rebel0 - 18 && (await ev('__mock.bought()')).includes('post-sawyer'), `${tag}: a click on the sawyer post (on ${opt === 'c' ? 'work' : 'upgrades'}) spends rebel 18, dust 250`);
      await ev('__mock.reset()'); await wait(300);
      await openMill('desk');
    }
    // --- desk: the shack's build tab ---
    await press('desk', await ev(`__mock.site('desk', 'shack')`)); await wait(650);
    s = await state('desk');
    ok(s.open === 'shack' && s.tab === 'build' && (opt === 'b' ? s.panel : s.cardOn), `${theme} ${tag}: a click on the shack opens its one tab, build`);
    await shot('desk', `${opt}-shack-build-${theme}`);
    if (theme === 'light') {
      const locked = await ev(`(() => { const t = document.querySelector('${opt === 'b' ? '#desk .panel' : '#desk .card'} .tile[data-key="build-press"]'); return t.className + ' | ' + t.querySelector('.gain').textContent; })()`);
      ok(/off/.test(locked) && /paper/.test(locked), `${tag}: the press row is locked with its reason (${locked})`);
    }
    // --- desk: the pedestal (an upgrades tab, no work tab) ---
    await press('desk', await ev(`__mock.site('desk', 'pedestal')`)); await wait(650);
    s = await state('desk');
    ok(s.open === 'pedestal' && s.tab === 'upgrades', `${theme} ${tag}: the pedestal's card opens on upgrades, no work tab`);
    await shot('desk', `${opt}-pedestal-${theme}`);
    // --- phone: the saw mill's upgrades, by touch ---
    await openMill('phone');
    await tap(await ev(`__mock.tab('phone', 'upgrades')`)); await wait(650);
    s = await state('phone');
    ok(s.open === 'mill' && s.tab === 'upgrades', `${theme} ${tag}: on the phone, taps open the saw mill and switch to upgrades`);
    await shot('phone', `${opt}-phone-mill-upgrades-${theme}`);
    if (opt === 'c') {
      await tap(await ev(`__mock.tab('phone', 'work')`)); await wait(650);
      await shot('phone', `${opt}-phone-mill-work-${theme}`);
    }
    // the shack on the phone: five stations on a narrow glass
    // (B)'s bottom sheet covers the floor, so the shack is out of reach until a tap on the sky closes it
    if (opt === 'b') { const r = await ev(`__mock.rect('phone')`); await tap({ x: r.x, y: r.top + 160 }); await wait(400); }
    await tap(await ev(`__mock.site('phone', 'shack')`)); await wait(650);
    s = await state('phone');
    ok(s.open === 'shack' && s.tab === 'build', `${theme} ${tag}: on the phone, a tap on the shack opens build`);
    await shot('phone', `${opt}-phone-shack-build-${theme}`);
    await ev(`__mock.reset()`);
  }
}
const errs = tab.logs.filter(l => /EXCEPTION|error/i.test(l));
lines.push(errs.length ? 'page errors: ' + errs.join(' | ') : 'page errors: none');
console.log(lines.join('\n'));
writeFileSync(`${OUT}/check-output.txt`, lines.join('\n') + '\n');
await tab.close();
if (own) own.kill();
