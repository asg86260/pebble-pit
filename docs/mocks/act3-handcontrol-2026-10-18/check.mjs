// Drives the act 3 hand-plaque mock with real mouse and touch input over CDP,
// on the page's hand-turned clock, and asserts what the page claims: each
// mode opens and closes a plaque the way its panel says; every plaque's part
// worked faster gets the work done sooner (and fills its gauge further); the
// two crits (the stump's yank, the pedestal's big bubble) can be triggered;
// two plaques on the glass at once never overlap. Then shoots each mode with a
// plaque open on the saw mill and on the paper mill, the phone frame, and the
// two-at-once rule, light and dark, into snaps/.
//
//   node docs/mocks/act3-handcontrol-2026-10-18/check.mjs [all|drive|shots|look]
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
const MODE = process.argv[2] || 'all';
mkdirSync(OUT, { recursive: true });
const port = 9347;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.evaluate(e); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 1000, deviceScaleFactor: 1, mobile: false });
await ev('__mock.manual(true)');

const F = 1 / 60;
const results = {};
const note = (k, m) => { (results[k] ||= []).push(m); };
const ok = (k, cond, what) => note(k, (cond ? 'OK: ' : 'FAIL: ') + what);
const adv = (s, only = '') => ev(`__mock.advance(${s}${only ? `, '${only}'` : ''})`);
const ctl = (id, key, expr) => ev(`(() => { const s = __mock.stages['${id}'].ctl['${key}']; return ${expr}; })()`);
const shown = id => ev(`__mock.shown('${id}')`);

// --- input: mouse on the desk, touch on the phone ---------------------------
let BTN = 0;
const mouse = (type, x, y, buttons = BTN) => tab.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' && !buttons ? 'none' : 'left', buttons, clickCount: 1, pointerType: 'mouse' });
const touch = (type, x, y) => tab.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
const pointer = id => id === 'phone'
  ? { down: (x, y) => touch('touchStart', x, y), move: (x, y) => touch('touchMove', x, y), up: (x, y) => touch('touchEnd', x, y) }
  : { down: (x, y) => { BTN = 1; return mouse('mousePressed', x, y, 1); }, move: (x, y) => mouse('mouseMoved', x, y), up: (x, y) => { BTN = 0; return mouse('mouseReleased', x, y, 0); } };
async function tapAt(id, p) { const d = pointer(id); await d.down(p.x, p.y); await d.up(p.x, p.y); }
const scrollTo = sel => ev(`document.querySelector('${sel}').scrollIntoView({block:'center'}); 1`);
const site = (id, key) => ev(`__mock.site('${id}', '${key}')`);
const plaque = (id, key) => ev(`__mock.plaque('${id}', '${key}')`);
// a point on a plaque's inner grid, in client px, by cell
const at = (pq, c, r) => ({ x: pq.x + c * 6 * pq.s, y: pq.y + r * 6 * pq.s });

// Opens `key`'s plaque on stage `id` the way the current mode does, and returns its rect.
async function open(id, key, mode) {
  await centre(id, key);
  if (mode === 'a' && id === 'desk') { const p = await site(id, key); await mouse('mouseMoved', p.x, p.y, 0); }
  else if (mode === 'b' || mode === 'a') await tapAt(id, await site(id, key));
  await adv(0.4);
  return plaque(id, key);
}
const MID = { tree: 23, stump: 44, mill: 129.5, heap: 154, chipper: 170.5, papermill: 202, workshop: 231.5, press: 265.5 };
const centre = (id, key) => ev(`__mock.pan('${id}', ${MID[key]})`);

// --- the motions, each as a function of how fast it is done ---------------------
const motion = {
  async mill(id, pq, rps, secs) {
    const d = pointer(id), cx = 9.5, cy = 6.5, R = 4.5; let a = 0, g = 0;
    const pt = () => at(pq, cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    let p = pt(); await d.down(p.x, p.y);
    for (let i = 0; i < secs * 60; i++) { a += rps * 2 * Math.PI / 60; p = pt(); await d.move(p.x, p.y); await adv(F, id); if (i > secs * 30) g = Math.max(g, await ctl(id, 'mill', '+s.gv.toFixed(2)')); }
    await d.up(p.x, p.y); return g;
  },
  async papermill(id, pq, rps, secs) {
    const d = pointer(id); let a = 0, g = 0;
    const pt = () => at(pq, 14.5 + Math.cos(a) * 9, 8.5 + Math.sin(a) * 3.5);
    let p = pt(); await d.down(p.x, p.y);
    for (let i = 0; i < secs * 60; i++) { a += rps * 2 * Math.PI / 60; p = pt(); await d.move(p.x, p.y); await adv(F, id); if (i > 60) g = Math.max(g, await ctl(id, 'papermill', '+s.gv.toFixed(2)')); }
    await d.up(p.x, p.y); return g;
  },
  async tree(id, pq, per, secs) {
    const d = pointer(id), base = at(pq, 7, 7); let g = 0;
    await d.down(base.x, base.y);
    for (let t = 0; t < secs; t += F) { const x = base.x + 30 * pq.s * Math.sin(2 * Math.PI * t / (2 * per)); await d.move(x, base.y); await adv(F, id); if (t > secs / 2) g = Math.max(g, await ctl(id, 'tree', '+s.gv.toFixed(2)')); }
    await d.up(base.x, base.y); return g;
  },
  async chipper(id, pq, hold, gap, secs) {
    const d = pointer(id), b = at(pq, 7.5, 6.5); let t = 0, g = 0;
    while (t < secs) {
      await d.down(b.x, b.y);
      for (let h = 0; h < hold && t < secs; h += F, t += F) { await adv(F, id); g = Math.max(g, await ctl(id, 'chipper', '+s.gv.toFixed(2)')); }
      await d.up(b.x, b.y); if (t >= secs) break;
      await adv(gap, id); t += gap;
    }
    return g;
  },
  async workshop(id, pq, rate, secs) {
    const b = at(pq, 12, 6); let g = 0;
    for (let t = 0; t < secs; t += 1 / rate) { await tapAt(id, b); await adv(1 / rate, id); g = Math.max(g, await ctl(id, 'workshop', '+s.gv.toFixed(2)')); }
    return g;
  },
  // one pull of the bar to the stop at `step` px of drag a frame; the pull's time read off its line
  async press(id, pq, step) {
    const d = pointer(id), h = at(pq, 20, 2); let y = h.y, g = 0;
    await d.down(h.x, y);
    while (y < h.y + 60 * pq.s) { y += step; await d.move(h.x, y); await adv(F, id); g = Math.max(g, await ctl(id, 'press', '+s.gv.toFixed(2)')); }
    await adv(0.1, id); await d.up(h.x, y); await adv(1, id);
    return g;
  },
  // a drag off the heap toward the edge at px a frame, let go at cell c1
  async heap(id, pq, px, c1) {
    const d = pointer(id), a = at(pq, 5, 9); let x = a.x, g = 0;
    await d.down(x, a.y);
    while (x < pq.x + c1 * 6 * pq.s) { x += px; await d.move(x, a.y - 6); await adv(F, id); g = Math.max(g, await ctl(id, 'heap', '+s.gv.toFixed(2)')); }
    await d.up(x, a.y - 6); await adv(1.5, id); return g;
  }
};
const freshen = (id, k) => ev(`(() => { const s = __mock.stages['${id}'].ctl['${k}']; s.init(); s.gv = 0; return 1; })()`);
const made = (id, k) => ctl(id, k, 's.total');
async function compare(id, k, label, slowRun, fastRun) {
  const pq = await open(id, k, 'b');
  if (!pq) { ok(k, false, `no plaque opened for ${k}`); return; }
  await freshen(id, k); let m0 = await made(id, k); const gs = await slowRun(pq); const slow = (await made(id, k)) - m0;
  await freshen(id, k); m0 = await made(id, k); const gf = await fastRun(pq); const fast = (await made(id, k)) - m0;
  note(k, `${label}: slow made ${slow}, gauge ${gs}; fast made ${fast}, gauge ${gf}`);
  ok(k, fast > slow && gf > gs, 'faster made more in the same time and filled the gauge further');
  note(k, 'last: ' + await ctl(id, k, 's.last && s.last.words'));
}

const drive = {
  async modes() {
    const id = 'desk'; await scrollTo('#desk');
    // (a) hover: in over the saw mill, out to the sky, gone after the grace
    await ev(`__mock.mode('a')`); await centre(id, 'mill'); await adv(0.3);
    const m = await site(id, 'mill'); await mouse('mouseMoved', m.x, m.y, 0); await adv(0.3);
    const a1 = await shown(id);
    const pq = await plaque(id, 'mill'); await mouse('mouseMoved', pq.x + 40, pq.y + 30, 0); await adv(0.6);
    const a2 = await shown(id);
    const sky = await ev(`__mock.client('desk', 900, 20)`); await mouse('mouseMoved', sky.x, sky.y, 0); await adv(0.15);
    const a3 = await shown(id); await adv(0.6); const a4 = await shown(id);
    ok('mode a', a1.includes('mill') && a2.includes('mill') && a3.includes('mill') && !a4.length, `hover in ${a1}, on the plaque ${a2}, just off ${a3}, after the grace ${JSON.stringify(a4)}`);
    // (b) click: open the saw mill, the paper mill swaps it, the sky closes
    await ev(`__mock.mode('b')`); await centre(id, 'chipper'); await adv(0.3);
    await tapAt(id, await site(id, 'mill')); await adv(0.4); const b1 = await shown(id);
    await tapAt(id, await site(id, 'papermill')); await adv(0.06);
    const both = await ev(`(() => { const st = __mock.stages.desk, r = ['mill','papermill'].map(k => st.pl[k].a > 0.01 && st.pl[k].rect).filter(Boolean); return r.length === 2 ? (r[0].x + r[0].w <= r[1].x || r[1].x + r[1].w <= r[0].x) : 'one'; })()`);
    await adv(0.4); const b2 = await shown(id);
    const sky2 = await ev(`__mock.client('desk', 480, 280)`); await tapAt(id, sky2); await adv(0.4); const b3 = await shown(id);
    ok('mode b', b1.join() === 'mill' && b2.join() === 'papermill' && !b3.length, `click opens ${b1}, a click on the paper mill swaps to ${b2} (mid-swap apart: ${both}), a click on the floor leaves ${JSON.stringify(b3)}`);
    // (c) nearest the middle: pan by a real drag on the floor; a click slides a station to the middle
    await ev(`__mock.mode('c')`); await centre(id, 'mill'); await adv(0.4); const c1 = await shown(id);
    const f0 = await ev(`__mock.client('desk', 700, 285)`); await mouse('mousePressed', f0.x, f0.y, 1);
    for (let i = 1; i <= 20; i++) await mouse('mouseMoved', f0.x - i * 14, f0.y, 1);
    await mouse('mouseReleased', f0.x - 280, f0.y, 0); await adv(0.4); const c2 = await shown(id);
    await tapAt(id, await site(id, 'press')); await adv(1.2); const c3 = await shown(id);
    ok('mode c', c1.join() === 'mill' && c2.length === 1 && c2[0] !== 'mill' && c3.join() === 'press', `middle ${c1}, after a 280 px drag ${c2}, after a click on the press ${c3}`);
    // two at once: held together, they make room and keep their tails on their stations
    await ev(`__mock.mode('b'); __mock.two(true)`); await centre(id, 'papermill'); await adv(0.6);
    const two = await ev(`(() => { const st = __mock.stages.desk, a = st.pl.papermill.rect, b = st.pl.workshop.rect; return { gap: b.x - (a.x + a.w), a: a.x, b: b.x }; })()`);
    ok('two at once', two.gap >= 0, `paper mill's plaque at ${two.a}, workshop's at ${two.b}: ${two.gap} px apart`);
    await ev(`__mock.two(false)`); await adv(0.4);
  },
  async speeds() {
    const id = 'desk'; await ev(`__mock.mode('b')`); await scrollTo('#desk');
    await compare(id, 'mill', '0.5 against 1.9 turns a second, 6 s each', pq => motion.mill(id, pq, 0.5, 6), pq => motion.mill(id, pq, 1.9, 6));
    await compare(id, 'papermill', '0.4 against 1.2 turns a second, 10 s each', pq => motion.papermill(id, pq, 0.4, 10), pq => motion.papermill(id, pq, 1.2, 10));
    await compare(id, 'tree', 'strokes of 1.0 s against 0.3 s, 4 s each', pq => motion.tree(id, pq, 1.0, 4), pq => motion.tree(id, pq, 0.3, 4));
    await compare(id, 'chipper', 'short presses against one long hold, 8 s each', pq => motion.chipper(id, pq, 0.35, 0.2, 8), pq => motion.chipper(id, pq, 9, 0, 8));
    await compare(id, 'workshop', '2 against 7 taps a second, 4 s each', pq => motion.workshop(id, pq, 2, 4), pq => motion.workshop(id, pq, 7, 4));
    // the press: one pull each, the quicker printing sooner
    { const k = 'press', pq = await open(id, k, 'b');
      await freshen(id, k); const gs = await motion.press(id, pq, 1); const slow = await ctl(id, k, 's.last && s.last.words');
      await freshen(id, k); const gf = await motion.press(id, pq, 8); const fast = await ctl(id, k, 's.last && s.last.words');
      const secs = t => +(/in ([\d.]+) s/.exec(t || '') || [0, 99])[1];
      note(k, `slow pull "${slow}", gauge ${gs}; quick pull "${fast}", gauge ${gf}`);
      ok(k, secs(fast) < secs(slow) && gf > gs, 'a quicker pull printed sooner and filled the gauge further'); }
    // the heap: carried slowly to the edge tips one; flung faster tips more
    { const k = 'heap', pq = await open(id, k, 'b');
      const one = async (px, c1) => { await freshen(id, k); await ev(`(() => { const s = __mock.stages.desk.ctl.heap; s.loads = 5; s.cells = s.cells.concat(Array(8).fill(-9)); return 1; })()`); const g = await motion.heap(id, pq, px, c1); return [+(/\+(\d) load/.exec(await ctl(id, k, 's.last && s.last.words') || '') || [0, 0])[1], g]; };
      const slow = await one(1, 25), mid = await one(3, 15), fast = await one(6, 15);
      note(k, `carried slowly past the edge: ${slow[0]} (gauge ${slow[1]}); flung at 180 px/s: ${mid[0]} (gauge ${mid[1]}); at 360 px/s: ${fast[0]} (gauge ${fast[1]})`);
      ok(k, slow[0] === 1 && mid[0] >= slow[0] && fast[0] > mid[0], 'a faster fling tipped more'); }
  },
  async crits() {
    const id = 'desk'; await ev(`__mock.mode('b')`);
    // the stump: a root by holding, then the yank in the wobble's window
    const pq = await open(id, 'stump', 'b'); await freshen(id, 'stump');
    const d = pointer(id), g0 = at(pq, 11, 6);
    await d.down(g0.x, g0.y); await d.move(g0.x, g0.y - 30); await adv(1.0, id); await d.up(g0.x, g0.y - 30); await adv(1.5, id);
    await d.down(g0.x, g0.y); await d.move(g0.x, g0.y - 6);
    for (let i = 0; i < 400; i++) { await adv(F, id); if (await ctl(id, 'stump', `__mock.stages['${id}'].t - s.wob < 0.06 && s.out == null`)) { await d.move(g0.x, g0.y - 40); await adv(0.1, id); break; } }
    await d.up(g0.x, g0.y - 40);
    const r = await ctl(id, 'stump', '[s.crits, s.total]');
    ok('stump', r[0] > 0 && r[1] > r[0], `a root by holding, then the yank crit: ${JSON.stringify(r)}`);
    // the pedestal: its bubbles where they are, a big one popped by a click
    await ev(`__mock.pan('desk', ${396 - 0})`); await adv(0.2);
    for (let i = 0; i < 400; i++) {
      await adv(0.05, id);
      const [crits, total] = await ev(`[__mock.stages.desk.ped.crits, __mock.stages.desk.ped.total]`);
      if (crits > 0 && total > crits) break;
      const bs = await ev(`(() => { const st = __mock.stages.desk; return st.ped.bubbles.map(b => ({ x: (b.x + b.w * 3) * 2 / 3 - st.cam, y: 262 + (b.y + b.h * 3) * 2 / 3, big: b.big })); })()`);
      const b = (!crits && bs.find(b => b.big && b.y > 40)) || (total === crits && bs.find(b => !b.big && b.y > 60));
      if (b) await tapAt(id, await ev(`__mock.client('desk', ${b.x}, ${b.y})`));
    }
    await adv(0.1);
    const q = await ev(`[__mock.stages.desk.ped.crits, __mock.stages.desk.ped.total]`);
    ok('pedestal', q[0] > 0 && q[1] > q[0], `bubbles popped where they float, one a 5x crit: ${JSON.stringify(q)}`);
  },
  async phone() {
    const id = 'phone'; await ev(`__mock.mode('b')`); await scrollTo('#phone');
    const pq = await open(id, 'papermill', 'b');
    ok('phone', !!pq && (await shown(id)).join() === 'papermill', 'a touch tap on the paper mill opened its plaque');
    await freshen(id, 'papermill'); const m0 = await made(id, 'papermill');
    const g = await motion.papermill(id, pq, 1.2, 6);
    ok('phone', (await made(id, 'papermill')) > m0, `stirring by touch made a sheet (gauge ${g})`);
    const r = await ev(`(() => { const st = __mock.stages.phone, r = st.pl.papermill.rect; return [r.x, r.x + r.w, st.W]; })()`);
    ok('phone', r[0] >= 0 && r[1] <= r[2], `the plaque is on the glass: ${r[0]}..${r[1]} of ${r[2]}`);
    // a swipe on the floor pans; the station off the glass closes its plaque
    const f = await ev(`__mock.client('phone', 300, 285)`);
    await touch('touchStart', f.x, f.y); for (let i = 1; i <= 20; i++) await touch('touchMove', f.x - i * 15, f.y); await touch('touchEnd', 0, 0);
    await adv(0.5); const s2 = await shown(id);
    ok('phone', !s2.includes('papermill'), `after a 300 px swipe the paper mill's plaque ${s2.includes('papermill') ? 'stayed' : 'closed'}`);
  }
};

if (MODE === 'all' || MODE === 'drive') {
  for (const k of ['modes', 'speeds', 'crits', 'phone']) await drive[k]();
  note('logs', tab.logs.filter(l => /EXCEPTION|error/i.test(l)).join(' | ') || 'no exceptions');
}

// --- the snapshots ----------------------------------------------------------------
async function deskShot(name) {
  const r = await ev(`(() => { const r = document.getElementById('desk-shot').getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
  await tab.shot(`${OUT}/${name}.png`, { clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
}
async function phoneShot(name) {
  const r = await ev(`(() => { const r = document.querySelector('.phone').getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
  await tab.shot(`${OUT}/${name}.png`, { clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
}
// mid-motion: the wheel spun fast, the vat stirred, then held still with the hand back on
async function work(id, key, pq) {
  if (key === 'mill') await motion.mill(id, pq, 1.7, 1.2);
  if (key === 'papermill') await motion.papermill(id, pq, 1.0, 1.4);
}
if (MODE === 'all' || MODE === 'shots' || MODE === 'look') {
  for (const theme of MODE === 'look' ? ['light'] : ['light', 'dark']) {
    await ev(`location.reload()`); await new Promise(r => setTimeout(r, 800));
    await ev('__mock.manual(true)'); await ev(`__mock.theme('${theme}')`);
    await scrollTo('#desk');
    for (const mode of ['a', 'b', 'c']) for (const key of ['mill', 'papermill']) {
      await ev(`__mock.mode('${mode}')`);
      await ev(`Object.values(__mock.stages.desk.ctl).forEach(s => { s.cueN = 0; s.cueA = 1; })`);
      // (a) and (b) framed with the neighbors in view; (c) with the station in the middle
      await ev(`__mock.pan('desk', ${mode === 'c' ? MID[key] : MID[key] + (key === 'mill' ? 70 : -10)})`);
      await adv(0.3);
      let pq;
      if (mode === 'a') { const p = await site('desk', key); await mouse('mouseMoved', p.x, p.y, 0); await adv(0.4); pq = await plaque('desk', key); }
      else if (mode === 'b') { await tapAt('desk', await site('desk', key)); await adv(0.4); pq = await plaque('desk', key); }
      else { await adv(0.4); pq = await plaque('desk', key); }
      if (pq) await work('desk', key, pq);
      if (mode === 'a' && pq) { await mouse('mouseMoved', pq.x + 30, pq.y + 20, 0); }
      await adv(0.05);
      await deskShot(`${mode}-${key}-${theme}`);
      if (MODE === 'look') break;
    }
    // the two-at-once rule
    await ev(`__mock.mode('b'); __mock.two(true); __mock.pan('desk', 217)`); await adv(0.6);
    await deskShot(`two-at-once-${theme}`);
    await ev(`__mock.two(false)`);
    // the phone: the paper mill's plaque open, stirred by touch
    await scrollTo('#phone');
    const pq = await open('phone', 'papermill', 'b');
    if (pq) await motion.papermill('phone', pq, 1.0, 1.4);
    await adv(0.05);
    await phoneShot(`phone-b-papermill-${theme}`);
    if (MODE !== 'look') {
      await ev(`__mock.mode('c')`); await ev(`__mock.pan('phone', ${MID.chipper})`); await adv(0.5);
      await phoneShot(`phone-c-chipper-${theme}`);
    }
  }
}
console.log(JSON.stringify(results, null, 1));
await tab.close();
if (own) own.kill();
