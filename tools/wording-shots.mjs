// A shot of every surface the wording inventory's strings appear on
// (docs/wording-inventory.json), each string outlined in purple where it
// stands, and a map from every string's id to the shot that shows it.
//
//   GAME=http://localhost:5302/ CDP_PORT=9402 node tools/wording-shots.mjs [surface,surface]
//
// Writes shots/wording/*.png and shots/wording/map.json. The surfaces and how
// each is stood up are tools/wording/surfaces.mjs; the in-page finder is
// tools/wording/page.js. A capture tool only: nothing here changes the game.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { browser, closeOtherTabs, openTab } from './cdp.mjs';
import { SURFACES, REASONS } from './wording/surfaces.mjs';

const OUT = 'shots/wording';
const INV = JSON.parse(readFileSync('docs/wording-inventory.json', 'utf8'));
const BY_ID = new Map(INV.map(s => [s.id, s]));
const PAGE_JS = readFileSync('tools/wording/page.js', 'utf8');
const base = (process.env.GAME || 'http://localhost:5302/').replace(/play\.html$/, '');
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;

const PORT = +(process.env.CDP_PORT || 9402);
if (!only) try { rmSync(`${process.env.TEMP}/boulder-headless-${PORT}`, { recursive: true, force: true }); } catch {}
process.env.WINDOW = '1280,800';
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT, base + 'play.html');
const ev = async expr => {
  const r = await tab.evaluate(expr);
  if (r.result?.exceptionDetails) throw new Error((r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text || '').split('\n')[0]);
  return r.result?.result?.value;
};
const wait = ms => new Promise(r => setTimeout(r, ms));
await tab.send('Browser.grantPermissions', { permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'], origin: new URL(base).origin }).catch(() => {});

async function viewport(phone) {
  await tab.send('Emulation.setDeviceMetricsOverride', phone
    ? { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }
    : { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await tab.send('Emulation.setTouchEmulationEnabled', { enabled: !!phone, maxTouchPoints: phone ? 5 : 0 });
}

// A fresh page: the game, or the landing page. Ready when its own module has
// finished booting.
async function load(page, before = '') {
  const url = base + (page === 'title' ? 'index.html' : 'play.html') + (page === 'title' ? '' : '');
  await tab.send('Page.navigate', { url: 'about:blank' });
  await wait(100);
  // Before the page's own modules: the preferences cleared (a switch pressed
  // on one surface is not left on for the next), then whatever the surface
  // wants in place first (window.desk, a preference).
  const source = `try { localStorage.removeItem('boulder-clicker/prefs'); } catch {}
${before}`;
  load.added = (await tab.send('Page.addScriptToEvaluateOnNewDocument', { source })).result?.identifier;
  await tab.send('Page.navigate', { url });
  const ready = page === 'title' ? `!!document.getElementById('playlabel')?.textContent` : `typeof window.__scene === 'function' && typeof window.__fast === 'function'`;
  for (let i = 0; i < 200; i++) { if (await ev(ready).catch(() => false)) break; await wait(50); }
  if (load.added) { await tab.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: load.added }); load.added = null; }
  await ev(PAGE_JS);
  await wait(200);
}

async function settle(cap = 900) {
  await ev(`new Promise(ok => { const t0 = performance.now(); const look = () => {
    const still = document.getAnimations().every(a => a.playState !== 'running');
    if (still || performance.now() - t0 > ${cap}) ok(1); else requestAnimationFrame(look); };
    requestAnimationFrame(() => requestAnimationFrame(look)); })`);
}

const map = {};
const tried = {};
let shots = 0;
mkdirSync(OUT, { recursive: true });
if (only && existsSync(`${OUT}/map.json`)) Object.assign(map, JSON.parse(readFileSync(`${OUT}/map.json`, 'utf8')));

for (const surface of SURFACES) {
  if (only && !only.has(surface.name)) continue;
  await viewport(surface.phone);
  try { await load(surface.page || 'play', surface.before); }
  catch (e) { console.log(`${surface.name}: load failed ${e.message}`); continue; }
  for (const step of surface.steps) {
    const file = step.file + '.png';
    try {
      if (step.setup) await ev(`(async () => { const W = window.__wq; const M = n => import('/src/' + n + '.js'); ${step.setup}\n })()`);
      if (step.hover) {
        const at = await ev(`(async () => { const W = window.__wq; const M = n => import('/src/' + n + '.js'); ${step.hover}\n })()`);
        if (at) {
          await tab.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x - 30, y: at.y - 30 });
          await tab.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: at.x, y: at.y });
          await wait(150);
          if (step.after) await ev(`(async () => { const W = window.__wq; const M = n => import('/src/' + n + '.js'); ${step.after}\n })()`);
        }
      }
      await settle(step.settle);
      const specs = step.ids.map(id => ({ id, text: BY_ID.get(id)?.text ?? '', re: step.re?.[id], exact: step.exact }));
      const found = await ev(`window.__wq.mark(${JSON.stringify(specs)})`);
      if (step.boxes) await ev(`(async () => { const W = window.__wq; const M = n => import('/src/' + n + '.js'); ${step.boxes}\n })()`);
      // The clip: the surface's own box and every string found, padded.
      const rects = Object.values(found).filter(f => f.found).map(f => f.rect);
      if (step.clip && step.clip !== 'full') {
        const r = await ev(`window.__wq.rectOf(${JSON.stringify(step.clip)})`);
        if (r) rects.push(r);
      }
      const vw = surface.phone ? 390 : 1280, vh = surface.phone ? 844 : 800;
      let clip = null;
      if (step.clip !== 'full' && rects.length) {
        const pad = step.pad ?? 24;
        const x0 = Math.max(0, Math.min(...rects.map(r => r.x)) - pad), y0 = Math.max(0, Math.min(...rects.map(r => r.y)) - pad);
        const x1 = Math.min(vw, Math.max(...rects.map(r => r.x + r.w)) + pad), y1 = Math.min(vh, Math.max(...rects.map(r => r.y + r.h)) + pad);
        clip = { x: Math.floor(x0), y: Math.floor(y0), width: Math.ceil(x1 - x0), height: Math.ceil(y1 - y0), scale: 1 };
      }
      const png = await tab.send('Page.captureScreenshot', clip ? { format: 'png', clip } : { format: 'png' });
      writeFileSync(`${OUT}/${file}`, Buffer.from(png.result.data, 'base64'));
      shots++;
      await ev('window.__wq.clear()');
      const got = [], missed = [];
      for (const id of step.ids) {
        const f = found[id];
        tried[id] = (tried[id] || []).concat(file);
        if (f?.found) {
          got.push(id);
          if (map[id]?.status === 'captured' && !step.again) continue;
          const how = f.how === 'text' ? '' : f.how === 'text (part)' ? 'outlined element holds more text than the string' : `${f.how}, not drawn as text; the outlined control carries it`;
          const note = [step.note?.[id] || step.noteAll || '', how].filter(Boolean).join('; ');
          map[id] = { shot: file, status: 'captured', note };
        } else missed.push(id);
      }
      console.log(`${file}: ${got.length}/${step.ids.length}${missed.length ? '  missed ' + missed.join(' ') : ''}  ${(statSync(`${OUT}/${file}`).size / 1024) | 0}kb`);
    } catch (e) {
      console.log(`${file}: FAILED ${e.message}`);
      try { await ev('window.__wq && window.__wq.clear()'); } catch {}
    }
  }
}

// Every id the shots did not show: the reason written for it, or the shot it
// was tried on. A string found nowhere in the source is stale.
const SOURCES = ['play.html', 'index.html'].map(f => readFileSync(f, 'utf8'));
import { readdirSync } from 'node:fs';
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.endsWith('.js') ? [`${d}/${e.name}`] : []);
for (const f of walk('src')) SOURCES.push(readFileSync(f, 'utf8'));
const inSource = text => {
  const frags = text.split(/\$\{[^}]*\}|<[^>]*>/).map(s => s.trim()).filter(s => s.length >= 2);
  if (!frags.length) return true;
  const longest = frags.sort((a, b) => b.length - a.length)[0];
  return SOURCES.some(s => s.includes(longest));
};
for (const s of INV) {
  if (map[s.id]?.status === 'captured') continue;
  if (REASONS[s.id]?.stale) {
    map[s.id] = { shot: REASONS[s.id].shot ?? null, status: 'stale', note: REASONS[s.id].note };
    continue;
  }
  const r = REASONS[s.id];
  map[s.id] = { shot: r?.shot ?? null, status: 'not captured', note: r?.note || `${inSource(s.text) ? '' : '(not verbatim in source) '}not found on screen; tried ${(tried[s.id] || []).join(', ') || 'no surface'}` };
}
const ordered = Object.fromEntries(INV.map(s => [s.id, map[s.id]]));
writeFileSync(`${OUT}/map.json`, JSON.stringify(ordered, null, 1));
const count = k => Object.values(ordered).filter(v => v.status === k).length;
console.log(`${shots} shots; captured ${count('captured')}, not captured ${count('not captured')}, stale ${count('stale')}`);
await tab.close();
own?.kill();
process.exit(0);
