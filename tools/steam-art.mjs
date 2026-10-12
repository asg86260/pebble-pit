// Steam store art, rendered to files: the capsules (direction A, "the rock on
// its line"), and one 256x256 icon per achievement, unlocked and locked.
//
//   node tools/steam-art.mjs [--capsules | --icons] [--sheet]
//
// Writes steam/store/capsules/*.png and steam/store/achievements/*.png. The
// drawing is tools/steam-art/capsule-draw.js and icon-draw.js, injected into a
// headless page (the shell playwright keeps, driven by tools/cdp.mjs) and read
// back as PNG data; nothing is installed. Glyphs and badges come from
// src/glyphs.js, so a drawing finished in the glyph editor flows through on the
// next run. `--sheet` also writes shots/steam-contact-sheet.png to look at.
// The five store screenshots in steam/store/screenshots/ are copies of
// docs/mocks/steam-capsules/ and are not drawn here.

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browser } from './cdp.mjs';
import { GLYPHS, BADGES } from '../src/glyphs.js';
import { SHELF_INK } from '../src/config.js';
import { steamRows } from './steam-achievements.mjs';
import { pickOf } from './steam-art/picks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = f => process.argv.includes(f);
const wantCaps = !arg('--icons'), wantIcons = !arg('--capsules');
const PORT = +(process.env.CDP_PORT || 9361);
const out = (...p) => { const f = join(root, ...p); mkdirSync(dirname(f), { recursive: true }); return f; };
const b64 = url => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

// Every key the catalog can say must wear a drawing that exists.
const rows = steamRows().map(a => {
  const pick = pickOf(a.key);
  if (!pick) throw new Error(`no glyph picked for ${a.key} (tools/steam-art/picks.mjs)`);
  const [gl, bd, coin] = pick;
  if (!GLYPHS[gl]) throw new Error(`${a.key}: glyph ${gl} is not in src/glyphs.js`);
  if (bd && !BADGES[bd]) throw new Error(`${a.key}: badge ${bd} is not in src/glyphs.js`);
  return { ...a, rows: GLYPHS[gl], badge: bd ? BADGES[bd] : null, coin: coin ? SHELF_INK[coin] : null };
});

const { own } = await browser({ port: PORT });
const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
const waiting = new Map(); let n = 0;
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
await new Promise(r => ws.addEventListener('open', r));
const send = (method, params = {}) => new Promise(res => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const run = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
  return r.result.result.value;
};

try {
  await run(readFileSync(join(root, 'tools/steam-art/capsule-draw.js'), 'utf8'));
  await run(readFileSync(join(root, 'tools/steam-art/icon-draw.js'), 'utf8'));
  await run(`globalThis.SteamArt.state.bars = false; globalThis.SteamArt.state.caps = true; globalThis.ROWS = ${JSON.stringify(rows)}; globalThis.GHOST = ${JSON.stringify(SHELF_INK.ghost)};
    globalThis.capsule = (kind, W, H) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; SteamArt.drawA(g, W, H, kind); return c; };
    globalThis.icon = (a, locked) => { const s = document.createElement('canvas'); s.width = 64; s.height = 64; SteamIcons.drawIcon(s.getContext('2d'), a.rows, a.badge, a.coin, GHOST, locked);
      const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(s, 0, 0, 256, 256); return c; };
    true`);

  const names = { header: 'header', small: 'small', main: 'main', vertical: 'vertical', capital: 'library-capital', hero: 'library-hero', logo: 'library-logo' };
  const sizes = await run('SteamArt.SIZES');
  if (wantCaps) for (const [kind, W, H] of sizes) {
    const f = out('steam/store/capsules', `${names[kind]}_${W}x${H}.png`);
    writeFileSync(f, b64(await run(`capsule(${JSON.stringify(kind)}, ${W}, ${H}).toDataURL('image/png')`)));
    console.log('wrote', f);
  }
  if (wantIcons) {
    for (let i = 0; i < rows.length; i++) for (const locked of [false, true]) {
      const f = out('steam/store/achievements', locked ? rows[i].iconLocked : rows[i].icon);
      writeFileSync(f, b64(await run(`icon(ROWS[${i}], ${locked}).toDataURL('image/png')`)));
    }
    console.log(`wrote ${rows.length * 2} icons to steam/store/achievements`);
  }
  if (arg('--sheet')) {
    const sizesJson = JSON.stringify(sizes);
    const png = await run(`(() => {
      const S = ${sizesJson}, pad = 24, colW = 1000, k = {};
      const sheet = document.createElement('canvas'); sheet.width = 2100; sheet.height = 2000; const g = sheet.getContext('2d');
      g.fillStyle = '#7d8a96'; g.fillRect(0, 0, sheet.width, sheet.height); g.imageSmoothingEnabled = false;
      let x = pad, y = pad, rowH = 0;
      for (const [kind, W, H] of S) {
        const sc = Math.min(1, (kind === 'hero' ? 2050 : 640) / W, 560 / H), w = Math.round(W * sc), h = Math.round(H * sc);
        if (x + w > sheet.width - pad) { x = pad; y += rowH + pad; rowH = 0; }
        if (kind === 'logo') { g.fillStyle = '#2b3946'; g.fillRect(x, y, w, h); }
        g.drawImage(capsule(kind, W, H), x, y, w, h);
        x += w + pad; rowH = Math.max(rowH, h);
      }
      y += rowH + pad * 2; x = pad;
      const pick = ROWS.filter((a, i) => i % 3 === 0);
      for (const a of pick) {
        if (x + 140 > sheet.width - pad) { x = pad; y += 300; }
        g.drawImage(icon(a, false), x, y, 128, 128); g.drawImage(icon(a, true), x, y + 140, 128, 128);
        x += 140;
      }
      return sheet.toDataURL('image/png');
    })()`);
    const f = out('shots', 'steam-contact-sheet.png');
    writeFileSync(f, b64(png));
    console.log('wrote', f);
  }
} finally {
  try { ws.close(); await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`); } catch {}
  if (own) own.kill();
}
process.exit(0);
