// Steam store art, rendered to files: the capsules ("the rock on its line"),
// one 256x256 icon per achievement, unlocked and locked, and the five store
// screenshots.
//
//   node tools/steam-art.mjs [--capsules] [--icons] [--shots] [--sheet] [--check]
//
// No part named (nor --sheet or --check) is the capsules and the icons. `--shots` takes the
// screenshots from the game and needs a dev server (GAME=http://localhost:<n>/).
// `--sheet` writes steam/store/sheets/ (every capsule, every icon) to look at;
// `--check` counts each file's colors and, for a screenshot, how many of its
// 2x2 blocks are one color across (a crisp doubled pixel is).
//
// The drawing is tools/steam-art/capsule-draw.js and icon-draw.js, injected
// into a headless page (the shell playwright keeps, driven by tools/cdp.mjs)
// and read back as PNG data; nothing is installed. Every color is the game's,
// read here from src/config and handed in; glyphs and badges come from
// src/glyphs.js, so a drawing finished in the glyph editor flows through on
// the next run. The run fails if two icons come out the same picture.

import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { browser } from './cdp.mjs';
import { GLYPHS, BADGES } from '../src/glyphs.js';
import * as C from '../src/config.js';
import { depthShade } from '../src/grid.js';
import { HATS } from '../src/sprites.js';
import { steamRows } from './steam-achievements.mjs';
import { pickOf, rungOf } from './steam-art/picks.mjs';
import { takeShots } from './steam-art/shots.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = f => process.argv.includes(f);
const named = ['--capsules', '--icons', '--shots', '--sheet', '--check'].some(arg);
const wantCaps = named ? arg('--capsules') : true, wantIcons = named ? arg('--icons') : true, wantShots = arg('--shots');
const PORT = +(process.env.CDP_PORT || 9361);
const out = (...p) => { const f = join(root, ...p); mkdirSync(dirname(f), { recursive: true }); return f; };
const b64 = url => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

// The game's palette, by name. A name the game drops is a loud failure here,
// not a tone quietly invented in its place.
const need = name => { if (C[name] === undefined) throw new Error(`src/config no longer exports ${name}; steam-art reads it`); return C[name]; };
const hex = n => n.toString(16).padStart(2, '0');
const rgb = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
const mix = (a, b, t) => '#' + rgb(a).map((v, i) => hex(Math.round(v + (rgb(b)[i] - v) * t))).join('');
if (need('GROUND_TEXTURE') !== 2) throw new Error('the capsules draw GROUND_TEXTURE 2 (the hatch); the yard has moved off it');
const paper = need('LIGHT_PAPER'), ink = need('LIGHT_INK');
const CAPS = {
  P: need('P'), paper, ink, shades: need('SHADES'), worker: need('WORKER'), hats: HATS,
  hatch: mix(paper, ink, need('GROUND_INK')), groundTile: need('GROUND_TILE'),
  // CLOUD_TONES steps from the lit crown to the underside, as weather.js mixes them
  cloud: Array.from({ length: need('CLOUD_TONES') }, (_, i) => mix(need('CLOUD_TONE'), need('CLOUD_UNDER'), i / (need('CLOUD_TONES') - 1))),
  cloudLit: need('CLOUD_LIT'), cloudMid: need('CLOUD_MID'), cloudReach: need('CLOUD_SHADE_REACH'),
  bird: need('BIRD_TONE'), depthShadeSrc: depthShade.toString()
};
const SHELF = need('SHELF_INK');
const ICONS = { paper, ink, ghost: SHELF.ghost, glyphCell: need('SHELF_GLYPH_CELL'), badgeCell: need('SHELF_BADGE_CELL'),
                glyphCells: need('SHELF_GLYPH_CELLS'), halo: need('SHELF_BADGE_HALO') };

// Every key the catalog can say must wear a drawing that exists.
const catalog = steamRows(), keys = catalog.map(a => a.key);
const rows = catalog.map(a => {
  const pick = pickOf(a.key);
  if (!pick) throw new Error(`no glyph picked for ${a.key} (tools/steam-art/picks.mjs)`);
  const [gl, bd, coin] = pick;
  if (!GLYPHS[gl]) throw new Error(`${a.key}: glyph ${gl} is not in src/glyphs.js`);
  if (bd && !BADGES[bd]) throw new Error(`${a.key}: badge ${bd} is not in src/glyphs.js`);
  return { ...a, rows: GLYPHS[gl], badge: bd ? BADGES[bd] : null, coin: coin ? SHELF[coin] : null, rung: rungOf(a.key, keys) };
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

let failed = false;
try {
  await run(readFileSync(join(root, 'tools/steam-art/capsule-draw.js'), 'utf8'));
  await run(readFileSync(join(root, 'tools/steam-art/icon-draw.js'), 'utf8'));
  await run(`SteamArt.use(${JSON.stringify(CAPS)}); SteamIcons.use(${JSON.stringify(ICONS)}); globalThis.ROWS = ${JSON.stringify(rows)};
    globalThis.icon = (a, locked) => { const s = document.createElement('canvas'); s.width = 64; s.height = 64; SteamIcons.drawIcon(s.getContext('2d'), a.rows, a.badge, a.coin, a.rung, locked);
      const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(s, 0, 0, 256, 256); return c; };
    true`);

  const names = { header: 'header', small: 'small', main: 'main', vertical: 'vertical', capital: 'library-capital', hero: 'library-hero', logo: 'library-logo' };
  const sizes = await run('SteamArt.SIZES');
  if (wantCaps) for (const [kind, W, H] of sizes) {
    const f = out('steam/store/capsules', `${names[kind]}_${W}x${H}.png`);
    writeFileSync(f, b64(await run(`SteamArt.capsule(${JSON.stringify(kind)}, ${W}, ${H}).toDataURL('image/png')`)));
    console.log('wrote', f);
    // The logo again in the page's white, for a library page whose hero is dark.
    if (kind === 'logo') {
      const w = out('steam/store/capsules', `${names[kind]}-white_${W}x${H}.png`);
      writeFileSync(w, b64(await run(`SteamArt.capsule('logo', ${W}, ${H}, ${JSON.stringify(paper)}).toDataURL('image/png')`)));
      console.log('wrote', w);
    }
  }
  if (wantIcons) {
    // Steam lists the icons side by side: two that are the same picture read
    // as the same achievement, so a repeat fails the run.
    const seen = new Map(), dupes = [];
    for (let i = 0; i < rows.length; i++) for (const locked of [false, true]) {
      const name = locked ? rows[i].iconLocked : rows[i].icon;
      const png = b64(await run(`icon(ROWS[${i}], ${locked}).toDataURL('image/png')`));
      const md5 = createHash('md5').update(png).digest('hex');
      if (seen.has(md5)) dupes.push(`${name} = ${seen.get(md5)}`); else seen.set(md5, name);
      writeFileSync(out('steam/store/achievements', name), png);
    }
    console.log(`wrote ${rows.length * 2} icons to steam/store/achievements; ${seen.size} distinct`);
    if (dupes.length) { console.error(`icons that repeat another:\n  ${dupes.join('\n  ')}`); failed = true; }
  }
  if (wantShots) await takeShots(PORT, name => out('steam/store/screenshots', `${name}.png`));
  if (arg('--sheet')) {
    const caps = await run(`(() => {
      const S = SteamArt.SIZES, pad = 24, sheet = document.createElement('canvas'); sheet.width = 2100; sheet.height = 1500;
      const g = sheet.getContext('2d'); g.fillStyle = '#7d8a96'; g.fillRect(0, 0, sheet.width, sheet.height); g.imageSmoothingEnabled = false;
      let x = pad, y = pad, rowH = 0;
      for (const [kind, W, H] of S) {
        // whole-number shrinks only, so the sheet shows the cells as they are
        const k = Math.max(1, Math.ceil(Math.max(W / (kind === 'hero' ? 2050 : 700), H / 600))), w = W / k, h = H / k;
        if (x + w > sheet.width - pad) { x = pad; y += rowH + pad; rowH = 0; }
        if (kind === 'logo') { g.fillStyle = '#2b3946'; g.fillRect(x, y, w, h); }
        g.drawImage(SteamArt.capsule(kind, W, H), x, y, w, h);
        x += w + pad; rowH = Math.max(rowH, h);
      }
      const c = document.createElement('canvas'); c.width = sheet.width; c.height = y + rowH + pad;
      c.getContext('2d').drawImage(sheet, 0, 0); return c.toDataURL('image/png');
    })()`);
    const icons = await run(`(() => {
      const per = 12, cell = 140, pad = 16, rowsN = Math.ceil(ROWS.length / per);
      const sheet = document.createElement('canvas'); sheet.width = per * cell + pad; sheet.height = rowsN * (cell * 2 + 24) + pad;
      const g = sheet.getContext('2d'); g.fillStyle = '#7d8a96'; g.fillRect(0, 0, sheet.width, sheet.height); g.imageSmoothingEnabled = false;
      g.font = '11px monospace'; g.fillStyle = '#fff';
      ROWS.forEach((a, i) => {
        const x = pad + (i % per) * cell, y = pad + Math.floor(i / per) * (cell * 2 + 24);
        g.drawImage(icon(a, false), x, y, 128, 128); g.drawImage(icon(a, true), x, y + 132, 128, 128);
        g.fillStyle = '#fff'; g.fillText(a.key, x, y + 274);
      });
      return sheet.toDataURL('image/png');
    })()`);
    for (const [name, png] of [['capsules', caps], ['achievements', icons]]) {
      const f = out('steam/store/sheets', `${name}.png`); writeFileSync(f, b64(png)); console.log('wrote', f);
    }
  }
  if (arg('--check')) {
    const files = ['capsules', 'screenshots', 'achievements'].flatMap(d =>
      readdirSync(join(root, 'steam/store', d)).filter(f => f.endsWith('.png') && !f.includes('_locked')).map(f => `${d}/${f}`));
    const rowsOut = [];
    for (const f of files) {
      const data = readFileSync(join(root, 'steam/store', f)).toString('base64');
      const r = await run(`(async () => {
        const im = new Image(); im.src = 'data:image/png;base64,${data}'; await im.decode();
        const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data, count = new Map(), W = c.width, H = c.height;
        for (let i = 0; i < d.length; i += 4) { const k = (d[i] << 24 | d[i + 1] << 16 | d[i + 2] << 8 | d[i + 3]) >>> 0; count.set(k, (count.get(k) || 0) + 1); }
        // how few colors paint 99.9% of the picture: a smear is a long tail of
        // rare in-between tones, a crisp picture has none
        const by = [...count.values()].sort((p, q) => q - p);
        let cover = 0, sum = 0; while (sum < W * H * .999) sum += by[cover++];
        // a soft edge is a pixel unlike both its neighbors across; a picture
        // doubled with no smoothing has none, whatever the camera's offset
        const px = i => d[i] << 16 | d[i + 1] << 8 | d[i + 2];
        let lone = 0;
        for (let y = 0; y < H; y++) for (let x = 1; x + 1 < W; x++) { const i = (y * W + x) * 4; if (px(i) !== px(i - 4) && px(i) !== px(i + 4)) lone++; }
        return [W, H, count.size, cover, lone / (W * H)];
      })()`);
      rowsOut.push(`${f.padEnd(44)} ${String(r[0] + 'x' + r[1]).padEnd(10)} ${String(r[2]).padStart(5)} colors, ${String(r[3]).padStart(4)} paint 99.9%, ${(r[4] * 100).toFixed(3)}% lone pixels`);
    }
    console.log(rowsOut.join('\n'));
  }
} finally {
  try { ws.close(); await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`); } catch {}
  if (own) own.kill();
}
process.exit(failed ? 1 : 0);
