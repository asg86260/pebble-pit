// Drives the hand-work cards mock with real mouse and touch input over CDP, on
// the page's hand-turned clock, and asserts what the page claims: every card,
// worked faster, makes more in the same time and fills its gauge further (the
// stump, a moment rather than a speed, comes out under a held pull); the
// stump's crit (a) fires on a yank in a root's give and never in (b); the
// stump never moves while nobody pulls it; a tab click eases the card to its
// upgrades shelves. Then shoots the saw takes, each direction's eight cards
// (and the recommended one on upgrades), the stump with its shovel, and now
// against the pick, light and dark, into snaps/.
//
//   node docs/mocks/act3-handwork-ui-2026-10-18/check.mjs [all|drive|shots]
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
const MODE = process.argv[2] || 'all';
mkdirSync(OUT, { recursive: true });
const port = 9351;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
const W = 1100;
await tab.send('Emulation.setDeviceMetricsOverride', { width: W, height: 1000, deviceScaleFactor: 1, mobile: false });
await ev('__mock.manual(true); __mock.theme("light"); 1');

const F = 1 / 60;
const lines = [];
const say = s => { lines.push(s); console.log(s); };
const ok = (cond, what) => say((cond ? 'OK   ' : 'FAIL ') + what);
const adv = s => ev(`__mock.advance(${s}); 1`);

// --- input: the mouse, or a finger --------------------------------------------
let BTN = 0, TOUCH = false;
const mouse = (type, x, y, buttons = BTN) => tab.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' && !buttons ? 'none' : 'left', buttons, clickCount: 1, pointerType: 'mouse' });
const touch = (type, x, y) => tab.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
const ptr = {
  down: (x, y) => TOUCH ? touch('touchStart', x, y) : (BTN = 1, mouse('mousePressed', x, y, 1)),
  move: (x, y) => TOUCH ? touch('touchMove', x, y) : mouse('mouseMoved', x, y),
  up: (x, y) => TOUCH ? touch('touchEnd', x, y) : (BTN = 0, mouse('mouseReleased', x, y, 0))
};
async function face(group, i) {
  await ev(`__mock.card('${group}', ${i}).cv.scrollIntoView({ block: 'center' }); 1`);
  return ev(`__mock.face('${group}', ${i})`);
}
const at = (f, x, y) => [f.x + x * f.s, f.y + y * f.s];
const read = (g, i) => ev(`__mock.read('${g}', ${i})`);
const fresh = (g, i) => ev(`__mock.fresh('${g}', ${i})`);
const score = r => r.made + r.prog;

// --- the motions, each as a function of how fast it is done ----------------------
const motion = {
  async mill(f, fast) {
    const rps = fast ? 1.8 : 0.5; let a = 0, gmax = 0;
    let [x, y] = at(f, 81 + 30, 33); await ptr.down(x, y);
    for (let i = 0; i < 240; i++) { a += rps * 2 * Math.PI * F; [x, y] = at(f, 81 + Math.cos(a) * 30, 33 + Math.sin(a) * 30); await ptr.move(x, y); await adv(F); if (i > 120 && i % 10 === 0) gmax = Math.max(gmax, (await read(G, I)).gv); }
    await ptr.up(x, y); return gmax;
  },
  async papermill(f, fast) {
    const rps = fast ? 1.0 : 0.3; let a = 0, gmax = 0;
    let [x, y] = at(f, 81 + 42, 27); await ptr.down(x, y);
    for (let i = 0; i < 300; i++) { a += rps * 2 * Math.PI * F; [x, y] = at(f, 81 + Math.cos(a) * 42, 27 + Math.sin(a) * 9); await ptr.move(x, y); await adv(F); if (i > 120 && i % 10 === 0) gmax = Math.max(gmax, (await read(G, I)).gv); }
    await ptr.up(x, y); return gmax;
  },
  async press(f, fast) {
    const step = fast ? 4 : 0.8; let gmax = 0;
    for (let t = 0; t < 4;) {
      let [x, y] = at(f, 135, 9); await ptr.down(x, y); let dy = 0;
      while (dy < 60 && t < 4) { dy += step; await ptr.move(x, y + dy * f.s); await adv(F); t += F; gmax = Math.max(gmax, (await read(G, I)).gv); }
      await ptr.up(x, y + dy * f.s); await adv(0.5); t += 0.5;
    }
    return gmax;
  },
  async chipper(f, fast) {
    const [x, y] = at(f, 81, 33); let gmax = 0;
    if (fast) { await ptr.down(x, y); for (let i = 0; i < 180; i++) { await adv(F); if (i % 10 === 0) gmax = Math.max(gmax, (await read(G, I)).gv); } await ptr.up(x, y); }
    else for (let k = 0; k < 5; k++) { await ptr.down(x, y); for (let i = 0; i < 18; i++) { await adv(F); if (i % 6 === 0) gmax = Math.max(gmax, (await read(G, I)).gv); } await ptr.up(x, y); await adv(0.3); }
    return gmax;
  },
  async workshop(f, fast) {
    const rate = fast ? 6 : 2, [x, y] = at(f, 60, 40); let gmax = 0;
    for (let t = 0; t < 3; t += 1 / rate) { await ptr.down(x, y); await ptr.up(x, y); await adv(1 / rate); gmax = Math.max(gmax, (await read(G, I)).gv); }
    return gmax;
  },
  async tree(f, fast) {
    const half = fast ? 0.25 : 0.8, [bx, by] = at(f, 33, 45); let gmax = 0;
    await ptr.down(bx, by);
    for (let t = 0; t < 4; t += F) { const x = bx + 30 * f.s * Math.sin(Math.PI * t / half); await ptr.move(x, by); await adv(F); if (t > 1 && Math.round(t / F) % 10 === 0) gmax = Math.max(gmax, (await read(G, I)).gv); }
    await ptr.up(bx, by); return gmax;
  },
  async heap(f, fast) {
    let gmax = 0;
    for (let t = 0; t < (fast ? 4 : 4);) {
      let [x, y] = at(f, 30, 50); await ptr.down(x, y);
      const step = fast ? 9 : 1.5, stop = fast ? 100 : 150;
      let px = 30;
      while (px < stop) { px += step; [x, y] = at(f, px, 44); await ptr.move(x, y); await adv(F); t += F; gmax = Math.max(gmax, (await read(G, I)).gv); }
      await ptr.up(x, y); await adv(0.6); t += 0.6;
    }
    return gmax;
  }
};
let G = 'dir', I = 0;
const KEYS = ['mill', 'papermill', 'press', 'chipper', 'workshop', 'tree', 'stump', 'heap'];

async function drive() {
  for (const dir of ['A', 'B', 'C']) {
    await ev(`__mock.dir('${dir}'); 1`); await adv(0.2);
    for (const [i, key] of KEYS.entries()) {
      if (key === 'stump') continue;
      G = 'dir'; I = i; TOUCH = dir === 'B';   // direction B is driven by a finger, A and C by the mouse
      if (TOUCH) await tab.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      const f = await face('dir', i);
      await fresh('dir', i); const gs = await motion[key](f, false); const slow = await read('dir', i);
      await adv(2.5); await fresh('dir', i); const gf = await motion[key](f, true); const fast = await read('dir', i);
      await adv(4.5);
      ok(score(fast) > score(slow) && gf > gs, `${dir} ${key} (${TOUCH ? 'touch' : 'mouse'}): slow made ${score(slow).toFixed(2)} gauge ${gs.toFixed(2)}; fast made ${score(fast).toFixed(2)} gauge ${gf.toFixed(2)}`);
      if (TOUCH) await tab.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
  }
  TOUCH = false;
  // the stump: never moves on its own; (b) out under a held pull, no crit; (a) a yank in a root's give
  for (const crit of ['b', 'a']) {
    await ev(`__mock.crit('${crit}'); 1`); await adv(0.2);
    const f = await face('stump', 0);
    const before = await read('stump', 0); await adv(5); const idle = await read('stump', 0);
    ok(idle.st.lift === 0 && before.st.lift === 0, `stump (${crit}): unpulled for five seconds, it stays put (lift ${idle.st.lift})`);
    const [x, y] = at(f, 81, 21);
    if (crit === 'b') {
      await ptr.down(x, y); for (let i = 0; i < 20; i++) { await ptr.move(x, y - i * 2 * f.s); await adv(F); }
      await adv(2.6); const r = await read('stump', 0); await ptr.up(x, y - 40 * f.s);
      ok(r.st.out != null && r.marks === 0, `stump (b): held up, out in ${r.st.dug} roots with no crit (marks ${r.marks})`);
    } else {
      await ptr.down(x, y); for (let i = 0; i <= 13; i++) { await ptr.move(x, y - i * 2 * f.s); await adv(F); }
      let r; for (let k = 0; k < 120; k++) { await adv(F); r = await read('stump', 0); if (r.st.dug >= 1) break; }
      ok(r.st.dug === 1 && r.st.out == null, `stump (a): held past the line, a root snaps (dug ${r.st.dug})`);
      for (let i = 14; i <= 34; i += 4) { await ptr.move(x, y - i * 2 * f.s); await adv(F); }
      await adv(0.1); r = await read('stump', 0);
      await ptr.up(x, y - 68 * f.s);
      ok(r.st.out != null && r.marks === 1, `stump (a): yanked in the give, out at once with the crit's mark (marks ${r.marks}, dug ${r.st.dug})`);
    }
    await adv(4);
  }
  // the tabs: upgrades eases the card taller and wider, shelving posts then upgrades
  await ev(`__mock.dir('A'); 1`);
  const w0 = await ev(`(() => { const k = __mock.card('dir', 0); const b = k.el.querySelector('.body'); return [b.offsetWidth, b.offsetHeight]; })()`);
  await ev(`__mock.card('dir', 0).el.scrollIntoView({ block: 'center' }); 1`);
  const t = await ev(`(() => { const r = __mock.card('dir', 0).el.querySelector('[data-tab=upgrades]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await ptr.down(t.x, t.y); await ptr.up(t.x, t.y);
  await new Promise(r => setTimeout(r, 500));
  const w1 = await ev(`(() => { const k = __mock.card('dir', 0); const b = k.el.querySelector('.body'); return [b.offsetWidth, b.offsetHeight, [...k.el.querySelectorAll('.face.on .sect')].map(s => s.textContent)]; })()`);
  ok(w1[0] > w0[0] && w1[1] > w0[1] && w1[2].join(',') === 'posts,upgrades', `upgrades tab: the card eased from ${w0[0]}x${w0[1]} to ${w1[0]}x${w1[1]}, shelves ${w1[2].join(', ')}`);
}

// --- shots -------------------------------------------------------------------------
async function shotOf(sel, name, scale = 1) {
  await ev(`document.querySelector('${sel}').scrollIntoView({ block: 'start' }); 1`);
  const r = await ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
  await tab.send('Emulation.setDeviceMetricsOverride', { width: W, height: Math.ceil(r.h + 40), deviceScaleFactor: 1, mobile: false });
  await ev(`document.querySelector('${sel}').scrollIntoView({ block: 'start' }); 1`);
  await adv(F); await new Promise(res => setTimeout(res, 350));
  const png = await tab.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.result.data, 'base64'));
  say(`shot ${name}.png`);
  await tab.send('Emulation.setDeviceMetricsOverride', { width: W, height: 1000, deviceScaleFactor: 1, mobile: false });
}
async function shots() {
  for (const theme of ['light', 'dark']) {
    await ev(`__mock.theme('${theme}'); document.getElementById('hands-again').click(); 1`);
    await adv(0.5);
    await shotOf('#saw-takes', `saw-takes-${theme}`);
    for (const d of ['A', 'B', 'C']) {
      await ev(`__mock.dir('${d}'); 1`); await adv(0.6);
      await shotOf('#dir-sheet', `dir-${d}-sheet-${theme}`);
    }
    await ev(`__mock.dir('A'); 1`); await adv(0.3);
    await ev(`document.getElementById('crit-all').click(); 1`); await adv(0.15);
    await shotOf('#dir-sheet', `dir-A-crit-${theme}`);
    await ev(`document.querySelector('[data-alltab=upgrades]').click(); 1`); await new Promise(r => setTimeout(r, 450));
    await shotOf('#dir-sheet', `dir-A-upgrades-${theme}`);
    await ev(`document.querySelector('[data-alltab=work]').click(); 1`); await new Promise(r => setTimeout(r, 600));
    await ev(`__mock.crit('a'); 1`); await adv(1.2);
    await shotOf('#sec-stump', `stump-shovel-${theme}`);
    await shotOf('#vs', `now-vs-A-${theme}`);
    await shotOf('#sec-coins', `coin-marks-${theme}`, 2);
  }
}
try {
  if (MODE === 'all' || MODE === 'drive') await drive();
  await ev('location.reload(); 1').catch(() => {});
  await new Promise(r => setTimeout(r, 1500));
  for (let i = 0; i < 50 && !(await ev('!!window.__mock').catch(() => false)); i++) await new Promise(r => setTimeout(r, 100));
  await ev('__mock.manual(true); 1');
  if (MODE === 'all' || MODE === 'shots') await shots();
} finally {
  const errs = tab.logs.filter(l => l.startsWith('EXCEPTION'));
  say(errs.length ? errs.join('\n') : 'no page errors');
  writeFileSync(`${OUT}/check-output.txt`, lines.join('\n') + '\n');
  await tab.close(); own?.kill();
}
