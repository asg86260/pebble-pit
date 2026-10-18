// Drives every panel of the act 3 gestures mock with real mouse/touch input
// over CDP, on the page's hand-turned clocks (each station its own), and
// asserts what the page claims: at the seven speed stations the same motion
// done faster gets the work done sooner (and fills the gauge further); at the
// pedestal and the stump the crit can be triggered. Then shoots the overview
// and the stations in pairs, light and dark, each frozen mid-motion.
//
//   node docs/mocks/act3-gestures-2026-10-18/check.mjs <out dir> [all|drive|shots]
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync } from 'node:fs';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = process.argv[2];
const MODE = process.argv[3] || 'all';
mkdirSync(OUT, { recursive: true });
const port = 9341;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.evaluate(e); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1120, height: 1180, deviceScaleFactor: 1, mobile: false });
await ev('__mock.manual(true)');

let rect;
async function focus(key) {
  rect = await ev(`(() => { const s = __mock.st['${key}']; s.el.scrollIntoView({block:'start'}); const r = s.el.querySelector('.big').getBoundingClientRect(); return {x:r.left,y:r.top,w:r.width,h:r.height}; })()`);
}
const cx = lx => rect.x + lx / 240 * rect.w, cy = ly => rect.y + ly / 156 * rect.h;
const mouse = (type, lx, ly) => tab.send('Input.dispatchMouseEvent', { type, x: cx(lx), y: cy(ly), button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
const down = (x, y) => mouse('mousePressed', x, y), move = (x, y) => mouse('mouseMoved', x, y), up = (x, y) => mouse('mouseReleased', x, y);
const adv = (s, key) => ev(`__mock.advance(${s}, '${key}')`);
const st = (key, expr) => ev(`(() => { const s = __mock.st['${key}']; return ${expr}; })()`);
const P = 6, F = 1 / 60;
const results = {};
const note = (k, m) => { (results[k] ||= []).push(m); };
const ok = (k, cond, what) => note(k, (cond ? 'OK: ' : 'FAIL: ') + what);
const made = k => st(k, 's.total');
const gauge = k => st(k, '+(s.gv || 0).toFixed(2)');

// ---- the motions, each a function of how fast it is done -------------------
const motion = {
  // back and forth, a full stroke every `per` seconds
  async chop(per, secs, k = 'chop') {
    const base = 7 * P - P + 3; let t = 0;
    await down(base, 16 * P);
    let g = 0;
    for (; t < secs; t += F) { await move(base + 30 * Math.sin(2 * Math.PI * t / (2 * per)), 16 * P); await adv(F, k); if (t > secs / 2) g = Math.max(g, await gauge(k)); }
    return { g, end: async () => up(base, 16 * P) };
  },
  async mill(rps, secs, k = 'mill') {
    const c = { x: 10 * P, y: 13 * P }, R = 5 * P; let a = 0, g = 0;
    await down(c.x + R, c.y);
    for (let i = 0; i < secs * 60; i++) { a += rps * 2 * Math.PI / 60; await move(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R); await adv(F, k); if (i > secs * 30) g = Math.max(g, await gauge(k)); }
    return { g, end: async () => up(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R) };
  },
  // presses of `hold` seconds with `gap` between
  async chipper(hold, gap, secs, k = 'chipper') {
    let t = 0, g = 0;
    while (t < secs) {
      await down(60, 80);
      for (let h = 0; h < hold && t < secs; h += F, t += F) { await adv(F, k); g = Math.max(g, await gauge(k)); }
      if (t >= secs) return { g, end: async () => up(60, 80) };
      await up(60, 80); await adv(gap, k); t += gap;
    }
    return { g, end: async () => {} };
  },
  async paper(rps, secs, k = 'paper') {
    let a = 0, g = 0; const cx0 = 20 * P, cy0 = 13 * P, rx = 9 * P, ry = 3 * P;
    await down(cx0 + rx, cy0);
    for (let i = 0; i < secs * 60; i++) { a += rps * 2 * Math.PI / 60; await move(cx0 + Math.cos(a) * rx, cy0 + Math.sin(a) * ry); await adv(F, k); if (i > 60) g = Math.max(g, await gauge(k)); }
    return { g, end: async () => up(cx0 + Math.cos(a) * rx, cy0 + Math.sin(a) * ry) };
  },
  async workshop(rate, secs, k = 'workshop') {
    let g = 0;
    for (let t = 0; t < secs; t += 1 / rate) { await down(120, 60); await up(120, 60); await adv(1 / rate, k); g = Math.max(g, await gauge(k)); }
    return { g, end: async () => {} };
  },
  // one pull to the stop, `step` radians of drag a frame; returns the pull time read off the readout
  async press(step, k = 'press') {
    const at = th => ({ x: (27 + Math.cos(th) * 10) * P, y: (8 + Math.sin(th) * 10) * P });
    let th = -0.45, p = at(th), g = 0; await down(p.x, p.y);
    for (; th <= 0.85; th += step) { p = at(th); await move(p.x, p.y); await adv(F, k); g = Math.max(g, await gauge(k)); }
    await adv(0.2, k);
    return { g, end: async () => { await up(p.x, p.y); await adv(1, k); } };
  },
  // a drag from the heap toward the edge at `pxPerFrame`, let go at `x1`
  async heap(pxPerFrame, x1, k = 'heap') {
    await down(7 * P, 17 * P); let g = 0;
    for (let x = 7 * P; x <= x1; x += pxPerFrame) { await move(x, 16 * P); await adv(F, k); g = Math.max(g, await gauge(k)); }
    return { g, end: async () => up(x1, 16 * P) };
  }
};
const freshen = k => ev(`(() => { const s = __mock.st['${k}']; s.init(); s.gv = 0; return 1; })()`);

async function compare(k, slowRun, fastRun, label) {
  await focus(k);
  await freshen(k); const s0 = await made(k); const a = await slowRun(); await a.end(); const slow = (await made(k)) - s0;
  await freshen(k); const f0 = await made(k); const b = await fastRun(); await b.end(); const fast = (await made(k)) - f0;
  note(k, `${label}: slow made ${slow}, gauge ${a.g}; fast made ${fast}, gauge ${b.g}`);
  ok(k, fast > slow && b.g > a.g, 'faster made more in the same time, and filled the gauge further');
  note(k, 'last: ' + await st(k, `s.el.querySelector('.last').textContent`));
}

const drive = {
  async pedestal() {
    const k = 'pedestal'; await focus(k);
    for (let i = 0; i < 400; i++) {
      await adv(0.05, k);
      const bs = await st(k, `s.bubbles.map(b => ({...s.box(b), w:b.w, h:b.h, big:b.big}))`);
      const crits = await st(k, 's.crits'), tot = await st(k, 's.total');
      const target = bs.find(b => b.big && b.r > 1) || (tot - crits < 2 ? bs.find(b => !b.big && b.r > 1) : null);
      if (target) { const x = (target.c + target.w / 2) * P, y = (target.r + target.h / 2) * P; await down(x, y); await up(x, y); if (target.big) break; }
    }
    const r = await st(k, '[s.crits, s.total]');
    ok(k, r[0] > 0 && r[1] > r[0], `normal pops and a 5× crit: ${JSON.stringify(r)}`);
  },
  async stump() {
    const k = 'stump'; await focus(k);
    await down(120, 108); await move(120, 68); await adv(1.0, k); await up(120, 68); await adv(1.5, k);
    await down(120, 108); await move(120, 100);
    for (let i = 0; i < 400; i++) { await adv(F, k); if (await st(k, 's.t - s.wob < 0.06 && s.out == null')) { await move(120, 58); await adv(0.1, k); break; } }
    await up(120, 50);
    const r = await st(k, '[s.crits, s.total]');
    ok(k, r[0] > 0 && r[1] > r[0], `a root by holding, then the yank crit: ${JSON.stringify(r)}`);
  },
  chop: () => compare('chop', () => motion.chop(1.0, 4), () => motion.chop(0.3, 4), 'strokes of 1.0 s against 0.3 s, 4 s each'),
  mill: () => compare('mill', () => motion.mill(0.5, 6), () => motion.mill(1.9, 6), '0.5 against 1.9 turns a second, 6 s each'),
  chipper: () => compare('chipper', () => motion.chipper(0.35, 0.2, 8), () => motion.chipper(9, 0, 8), 'short presses against one long hold, 8 s each'),
  paper: () => compare('paper', () => motion.paper(0.4, 10), () => motion.paper(1.2, 10), '0.4 against 1.2 turns a second, 10 s each'),
  workshop: () => compare('workshop', () => motion.workshop(2, 4), () => motion.workshop(7, 4), '2 against 7 taps a second, 4 s each'),
  async press() {
    const k = 'press'; await focus(k);
    await freshen(k); const a = await motion.press(0.012); const slow = await st(k, `s.el.querySelector('.last').textContent`); await a.end();
    await freshen(k); const b = await motion.press(0.1); const fast = await st(k, `s.el.querySelector('.last').textContent`); await b.end();
    const secs = t => +(/in ([\d.]+) s/.exec(t) || [0, 99])[1];
    note(k, `slow pull: "${slow}", gauge ${a.g}; quick pull: "${fast}", gauge ${b.g}`);
    ok(k, secs(fast) < secs(slow) && b.g > a.g, 'a quicker pull printed sooner and filled the gauge further');
  },
  async heap() {
    const k = 'heap'; await focus(k);
    const tipped = async () => +(/\+(\d) load/.exec(await st(k, `s.el.querySelector('.last').textContent`)) || [0, 0])[1];
    const one = async (px, x1) => { await freshen(k); await ev(`(() => { const s = __mock.st.heap; s.loads = 5; s.cells = s.cells.concat(Array(8).fill(-9)); return 1; })()`); const r = await motion.heap(px, x1); await r.end(); await adv(1.5, k); return [await tipped(), r.g]; };
    const slow = await one(1, 33 * P), mid = await one(3, 20 * P), fast = await one(6, 20 * P);
    note(k, `carried slowly past the edge: ${slow[0]} (gauge ${slow[1]}); flung at 180 px/s: ${mid[0]} (gauge ${mid[1]}); at 360 px/s: ${fast[0]} (gauge ${fast[1]})`);
    ok(k, slow[0] === 1 && mid[0] >= slow[0] && fast[0] > mid[0], 'a faster fling tipped more');
  }
};
const KEYS = ['pedestal', 'chop', 'stump', 'mill', 'chipper', 'paper', 'workshop', 'press', 'heap'];

if (MODE === 'all' || MODE === 'drive') {
  for (const k of KEYS) await drive[k]();
  // a touch tap reaches a panel too
  await focus('workshop'); await freshen('workshop');
  const before = await made('workshop');
  const tp = [{ x: cx(120), y: cy(60) }];
  await tab.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp });
  await tab.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  ok('touch', await made('workshop') === before + 1, 'a touch tap on the workshop struck one blow');
  note('cues', 'after the run: ' + await ev(`Object.values(__mock.st).map(s => s.key + ':' + s.cueA.toFixed(2)).join(' ')`));
  await ev(`document.getElementById('reset-all').click(); __mock.advance(1)`);
  note('cues', 'after reset + 1s: ' + await ev(`Object.values(__mock.st).map(s => s.key + ':' + s.cueA.toFixed(2)).join(' ')`));
  note('logs', tab.logs.filter(l => /EXCEPTION|error/i.test(l)).join(' | ') || 'no exceptions');
}

if (MODE === 'all' || MODE === 'shots') {
  // each panel frozen in the middle of its motion done fast (the two crit
  // stations on their crit), the hand put back on
  const freeze = {
    async pedestal() {
      const k = 'pedestal'; await focus(k);
      for (let i = 0; i < 400; i++) {
        await adv(0.05, k);
        const big = (await st(k, `s.bubbles.map(b => ({...s.box(b), w:b.w, h:b.h, big:b.big}))`)).find(b => b.big && b.r > 1);
        if (big) { const x = (big.c + big.w / 2) * P, y = (big.r + big.h / 2) * P; await down(x, y); await up(x, y); await adv(0.08, k); return; }
      }
    },
    async stump() {
      const k = 'stump'; await focus(k);
      await down(120, 108); await move(120, 100);
      for (let i = 0; i < 400; i++) { await adv(F, k); if (await st(k, 's.t - s.wob < 0.06 && s.out == null')) { await move(120, 58); await adv(0.12, k); break; } }
      await up(120, 50);
    },
    async chop() { await focus('chop'); const r = await motion.chop(0.3, 2.6); await r.end(); },
    async mill() { await focus('mill'); const r = await motion.mill(1.9, 3); await r.end(); },
    async chipper() { await focus('chipper'); const r = await motion.chipper(9, 0, 2.4); await r.end(); },
    async paper() { await focus('paper'); const r = await motion.paper(1.1, 3); await r.end(); },
    async workshop() { await focus('workshop'); const r = await motion.workshop(7, 0.8); await r.end(); await down(120, 60); await up(120, 60); await adv(0.03, 'workshop'); },
    async press() {
      await focus('press'); const k = 'press';
      const at = th => ({ x: (27 + Math.cos(th) * 10) * P, y: (8 + Math.sin(th) * 10) * P });
      let th = -0.45, p = at(th); await down(p.x, p.y);
      for (; th <= 0.3; th += 0.1) { p = at(th); await move(p.x, p.y); await adv(F, k); }
      await up(p.x, p.y);
    },
    async heap() { await focus('heap'); await adv(4, 'heap'); const r = await motion.heap(6, 20 * P); await r.end(); await adv(0.18, 'heap'); }
  };
  for (const theme of ['light', 'dark']) {
    await ev(`location.reload()`);
    await new Promise(r => setTimeout(r, 800));
    await ev('__mock.manual(true)');
    await ev(`__mock.theme('${theme}')`);
    for (const k of KEYS) await freeze[k]();
    await ev(`Object.values(__mock.st).forEach(s => { s.cueN = 0; s.cueA = 1; }); __mock.advance(0, 'none')`);
    await ev(`window.scrollTo(0,0)`);
    await tab.shot(`${OUT}/snapshot-overview-${theme}.png`);
    for (const ks of [['pedestal', 'chop'], ['stump', 'mill'], ['chipper', 'paper'], ['workshop', 'press'], ['heap']]) {
      const box = await ev(`(() => { const a = __mock.st['${ks[0]}'].el, b = __mock.st['${ks[ks.length - 1]}'].el; a.scrollIntoView({block:'start'}); const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return {x: 0, y: ra.top + scrollY, w: innerWidth, h: rb.bottom - ra.top}; })()`);
      await tab.shot(`${OUT}/snapshot-${ks.join('-')}-${theme}.png`, { clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 } });
    }
  }
}
console.log(JSON.stringify(results, null, 1));
await tab.close();
if (own) own.kill();
