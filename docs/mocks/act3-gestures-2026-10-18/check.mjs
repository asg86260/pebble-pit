// Drives every panel of the act 3 gestures mock with real mouse/touch input
// over CDP, on the page's hand-turned clocks, and asserts each motion earns
// and each crit can trigger. Then shoots overview + pairs, light and dark.
// node docs/mocks/act3-gestures-2026-10-18/check.mjs <out dir> [all|drive|shots|idle]
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
const P = 6;
const results = {};
const note = (k, m) => { (results[k] ||= []).push(m); };

// ---- each station's motions --------------------------------------------------
const drive = {
  async pedestal({ critOnly } = {}) {
    const k = 'pedestal'; await focus(k);
    for (let i = 0; i < 400; i++) {
      await adv(0.05, k);
      const bs = await st(k, `s.bubbles.map(b => ({...s.box(b), w:b.w, h:b.h, big:b.big}))`);
      const big = bs.find(b => b.big && b.r > 1);
      const norm = bs.find(b => !b.big && b.r > 1);
      const crits = await st(k, 's.crits'), tot = await st(k, 's.total');
      const target = big || (!critOnly && tot - crits < 2 ? norm : null);
      if (target) { const x = (target.c + target.w / 2) * P, y = (target.r + target.h / 2) * P; await down(x, y); await up(x, y); if (target.big) return; }
    }
  },
  async chop({ critOnly } = {}) {
    const k = 'chop'; await focus(k);
    const base = 7 * P - P + 3; // left handle
    await down(base, 16 * P);
    // in rhythm: follow the partner
    for (let i = 0; i < (critOnly ? 260 : 150); i++) {
      const tgt = await st(k, 's.partner(s.t)');
      await move(base + tgt, 16 * P);
      await adv(1 / 60, k);
      if (critOnly && await st(k, 's.crits') > 0) { await adv(0.1, k); await up(base, 16 * P); return; }
    }
    if (!critOnly) {
      // against it: the saw should bind
      for (let i = 0; i < 200; i++) { const tgt = await st(k, 's.partner(s.t)'); await move(base - tgt, 16 * P); await adv(1 / 60, k); }
    }
    await up(base, 16 * P);
  },
  async stump({ critOnly } = {}) {
    const k = 'stump'; await focus(k);
    if (!critOnly) {
      // the slow way: hold it up until a root snaps
      await down(120, 108); await move(120, 108 - 40); await adv(1.0, k); await up(120, 68); await adv(1.5, k);
    }
    // the crit: hold at a small lift, wait for the wobble, then yank
    await down(120, 108); await move(120, 100);
    for (let i = 0; i < 400; i++) {
      await adv(1 / 60, k);
      const w = await st(k, 's.t - s.wob < 0.06 && s.out == null');
      if (w) { await move(120, 108 - 50); await adv(0.1, k); break; }
    }
    await up(120, 50);
  },
  async mill({ critOnly } = {}) {
    const k = 'mill'; await focus(k);
    const spin = async (rps, secs) => {
      const c = { x: 10 * P, y: 13 * P }, R = 5 * P;
      let a = 0; await down(c.x + R, c.y);
      for (let i = 0; i < secs * 60; i++) {
        a += rps * 2 * Math.PI / 60; await move(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R); await adv(1 / 60, k);
        if (critOnly && await st(k, 's.crits') > 0) break;
      }
      await up(c.x + Math.cos(a) * R, c.y + Math.sin(a) * R);
    };
    if (!critOnly) { await spin(0.5, 5); note(k, 'slow spin: ' + JSON.stringify(await st(k, '[s.crits, s.total]'))); }
    await spin(1.2, 6);
  },
  async chipper({ critOnly } = {}) {
    const k = 'chipper'; await focus(k);
    if (!critOnly) { await down(60, 80); await adv(5.6, k); await up(60, 80); await adv(1.2, k); }
    await down(60, 80);
    for (let i = 0; i < 400; i++) { await adv(1 / 60, k); const t = await st(k, 's.tail()'); if (t >= 21.0) break; }
    await up(60, 80); await adv(0.1, k);
  },
  async paper({ critOnly } = {}) {
    const k = 'paper'; await focus(k);
    const stir = async (rps, secs) => {
      let a = 0; const cx0 = 20 * P, cy0 = 13 * P, rx = 9 * P, ry = 3 * P;
      await down(cx0 + rx, cy0);
      for (let i = 0; i < secs * 60; i++) {
        a += rps * 2 * Math.PI / 60; await move(cx0 + Math.cos(a) * rx, cy0 + Math.sin(a) * ry); await adv(1 / 60, k);
        if (await st(k, 's.pull != null')) break;
      }
      await up(cx0, cy0); await adv(0.2, k);
    };
    if (!critOnly) { await stir(1.2, 9); await adv(1.2, k); }
    await stir(0.65, 14);
  },
  async workshop({ critOnly } = {}) {
    const k = 'workshop'; await focus(k);
    // off the beat, by touch
    if (!critOnly) {
      for (let n = 0; n < 2; n++) {
        const T = await st(k, 's.t'); const off = (Math.floor(T / 0.6) + 1) * 0.6 + 0.3 - T; await adv(off, k);
        const tp = [{ x: cx(120), y: cy(60) }];
        await tab.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp });
        await tab.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await adv(0.05, k);
      }
      note(k, 'touch taps: ' + JSON.stringify(await st(k, '[s.crits, s.total]')));
    }
    for (let n = 0; n < 4; n++) {
      const T = await st(k, 's.t'); const to = (Math.floor(T / 0.6) + 1) * 0.6 - T; await adv(to, k);
      await down(120, 60); await up(120, 60);
      if (critOnly) { await adv(0.08, k); return; }
    }
  },
  async press({ critOnly } = {}) {
    const k = 'press'; await focus(k);
    const at = th => ({ x: (27 + Math.cos(th) * 10) * P, y: (8 + Math.sin(th) * 10) * P });
    const stroke = async (to, brk) => {
      let th = -0.45; let p = at(th); await down(p.x, p.y);
      for (; th <= to; th += 0.05) {
        p = at(th); await move(p.x, p.y); await adv(1 / 60, k);
        if (brk && th > 0.2 && th < 0.26) { const q = at(th - 0.3); await move(q.x, q.y); await adv(1 / 60, k); }
      }
      if (critOnly) { await adv(0.12, k); await up(p.x, p.y); return; }
      await up(p.x, p.y); await adv(1, k);
    };
    if (!critOnly) { await stroke(0.5, false); await stroke(0.8, true); }
    await stroke(0.8, false);
  },
  async heap({ critOnly } = {}) {
    const k = 'heap'; await focus(k);
    if (!critOnly) {
      // slow drag past the edge
      await down(7 * P, 17 * P);
      for (let x = 7 * P; x <= 33 * P; x += 2) { await move(x, 16 * P); await adv(1 / 60, k); }
      await adv(0.3, k); await up(33 * P, 16 * P); await adv(1.2, k);
      // slow drag short of the edge: comes back
      await down(7 * P, 17 * P);
      for (let x = 7 * P; x <= 20 * P; x += 2) { await move(x, 16 * P); await adv(1 / 60, k); }
      await adv(0.3, k); await up(20 * P, 16 * P); await adv(2, k);
    }
    await adv(1, k);
    await down(7 * P, 17 * P);
    for (let x = 7 * P; x <= 20 * P; x += 5) { await move(x, 16 * P); await adv(1 / 60, k); }
    await up(20 * P, 16 * P);
    for (let i = 0; i < 120; i++) { await adv(1 / 60, k); if (await st(k, 's.crits') > 0) { await adv(0.08, k); break; } }
  }
};

const KEYS = Object.keys(drive);
const readout = k => st(k, `({crits: s.crits, total: s.total, last: s.el.querySelector('.last').textContent, cueA: +s.cueA.toFixed(2)})`);

if (MODE === 'all' || MODE === 'drive') {
  for (const k of KEYS) {
    await drive[k]();
    await adv(1.2, k);
    const r = await readout(k);
    note(k, JSON.stringify(r));
    note(k, r.crits > 0 && r.total > r.crits ? 'OK: normal and crit both earned' : 'FAIL');
  }
  // the hand fades after three motions; the reset brings it back
  const fades = await ev(`Object.values(__mock.st).map(s => s.key + ':' + s.cueA.toFixed(2)).join(' ')`);
  note('cues', 'after the run: ' + fades);
  await ev(`document.getElementById('reset-all').click(); __mock.advance(1)`);
  note('cues', 'after reset + 1s: ' + await ev(`Object.values(__mock.st).map(s => s.key + ':' + s.cueA.toFixed(2)).join(' ')`));
  note('logs', tab.logs.filter(l => /EXCEPTION|error/i.test(l)).join(' | ') || 'no exceptions');
}

if (MODE === 'all' || MODE === 'shots') {
  for (const theme of ['light', 'dark']) {
    await ev(`location.reload()`);
    await new Promise(r => setTimeout(r, 800));
    await ev('__mock.manual(true)');
    await ev(`__mock.theme('${theme}')`);
    // each station: the crit, frozen at its held pose, the hand put back
    for (const k of KEYS) { await drive[k]({ critOnly: true }); }
    await ev(`Object.values(__mock.st).forEach(s => { s.cueN = 0; s.cueA = 1; }); __mock.advance(0, 'none')`);
    await ev(`window.scrollTo(0,0)`);
    await tab.send('Emulation.setDeviceMetricsOverride', { width: 1120, height: 1180, deviceScaleFactor: 1, mobile: false });
    await tab.shot(`${OUT}/overview-${theme}.png`);
    for (let i = 0; i < KEYS.length; i += 2) {
      const ks = KEYS.slice(i, i + 2);
      const box = await ev(`(() => { const a = __mock.st['${ks[0]}'].el, b = __mock.st['${ks[ks.length - 1]}'].el; a.scrollIntoView({block:'start'}); const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return {x: 0, y: ra.top + scrollY, w: innerWidth, h: rb.bottom - ra.top}; })()`);
      await tab.shot(`${OUT}/${ks.join('-')}-${theme}.png`, { clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 1 } });
    }
  }
}
if (MODE === 'idle') {
  await ev('__mock.advance(2.3)');
  for (let i = 0; i < KEYS.length; i += 2) {
    const ks = KEYS.slice(i, i + 2);
    const box = await ev(`(() => { const a = __mock.st['${ks[0]}'].el, b = __mock.st['${ks[ks.length - 1]}'].el; a.scrollIntoView({block:'start'}); const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return {x: 0, y: ra.top + scrollY, w: 760, h: rb.bottom - ra.top}; })()`);
    await tab.shot(`${OUT}/idle-${ks.join('-')}.png`, { clip: { x: box.x, y: box.y, width: box.w, height: box.h, scale: 0.7 } });
  }
}
console.log(JSON.stringify(results, null, 1));
await tab.close();
if (own) own.kill();
