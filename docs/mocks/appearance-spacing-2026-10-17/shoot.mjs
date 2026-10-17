// The appearance sheet's spacing mock: the real page (scene `wardrobe`), each
// variant's CSS override (a-*.css, b-*.css, c-*.css beside this file)
// injected into the page for the shot only, at two windows and two themes.
// `--measure` prints every gap on today's page instead.
//
//   GAME=http://localhost:<port>/ node docs/mocks/appearance-spacing-2026-10-17/shoot.mjs [--measure] [--only a,b]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { browser, openTab, standScene } from '../../../tools/cdp.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const origin = (process.env.GAME || 'http://localhost:8537/').replace(/\/?$/, '/');
const port = Number(process.env.CDP_PORT || 9637);
const args = process.argv.slice(2);
const measureOnly = args.includes('--measure');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const VARIANTS = [
  { id: 'today', css: '' },
  { id: 'a', css: readFileSync(join(here, 'a-rhythm.css'), 'utf8') },
  { id: 'b', css: readFileSync(join(here, 'b-grouped.css'), 'utf8') },
  { id: 'c', css: readFileSync(join(here, 'c-airy.css'), 'utf8') },
].filter(v => !only || only.includes(v.id));
const SIZES = [[1280, 800], [1920, 1080]];
const THEMES = measureOnly ? ['light'] : ['light', 'dark'];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const paint = 'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1))))';

// Every edge of every part, in px relative to the sheet's content box.
const MEASURE = `(() => {
  const q = s => document.querySelector(s), R = e => e && e.getBoundingClientRect();
  const sheet = q('.held'), cs = getComputedStyle(sheet), sr = R(sheet);
  const pick = {
    title: q('#wardhead'), switch: q('.wardwho'), name: q('.wardname'), title_row: q('.wardrole'),
    stage: q('.wardstage'), slotHead: q('.wardslot[data-slot=head]'), slotFace: q('.wardslot[data-slot=face]'),
    slotBack: q('.wardslot[data-slot=back]'), big: q('.wardbig'), gridhead: q('.wardgridhead'), gridtab: q('.wardgridtab'),
    grids: q('.wardgrids'), tiles: q('.wardtiles.on'), foot: q('.wardfoot'), roll: q('#wardroll'), clear: q('#wardclear'),
    back: q('#wardrobeback'), nameLabel: q('.wardname .wardlabel'), nameInput: q('#wardnamein'), roleLabel: q('.wardrole .wardlabel'),
  };
  const out = { sheet: { w: sr.width, h: sr.height, pad: cs.padding, gap: cs.rowGap, scrollH: sheet.scrollHeight, clientH: sheet.clientHeight } };
  for (const [k, e] of Object.entries(pick)) { if (!e) continue; const r = R(e); out[k] = { l: Math.round(r.left - sr.left), t: Math.round(r.top - sr.top), r: Math.round(sr.right - r.right), b: Math.round(r.bottom - sr.top), w: Math.round(r.width), h: Math.round(r.height) }; }
  const t = [...q('.wardtiles.on').children].slice(0, 6).map(R);
  out.tileGapX = Math.round(t[1].left - t[0].right); out.tileW = Math.round(t[0].width); out.tileH = Math.round(t[0].height);
  const row2 = t.find(x => x.top > t[0].top); out.tileGapY = row2 ? Math.round(row2.top - t[0].bottom) : null;
  out.gridsPad = getComputedStyle(pick.grids).padding;
  out.rowsShown = (R(pick.grids).height - 4) / (row2 ? row2.top - t[0].top : t[0].height);
  return out;
})()`;

const { own } = await browser({ port });
try {
  for (const v of VARIANTS) for (const [w, h] of SIZES) for (const theme of THEMES) {
    const tab = await openTab(port, 'about:blank', { ready: null });
    try {
      await tab.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await tab.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
      await tab.send('Page.navigate', { url: origin + 'play.html' + (theme === 'dark' ? '?dark' : '') });
      let up = false;
      for (let i = 0; i < 150 && !up; i++) { up = (await tab.evaluate("['__scene','__fast','__still'].every(k => typeof window[k] === 'function')")).result?.result?.value === true; if (!up) await sleep(100); }
      await tab.evaluate('document.fonts.ready.then(() => 1)');
      await standScene(tab, 'wardrobe', 1);
      await tab.evaluate(`(() => { const s = document.createElement('style'); s.id = 'mock'; s.textContent = '.toast{display:none!important}' + ${JSON.stringify(v.css)}; document.head.append(s); return 1; })()`);
      // the page measures itself on a ResizeObserver frame; let it settle
      for (let i = 0; i < 4; i++) await tab.evaluate(paint);
      await sleep(300);
      const m = (await tab.evaluate(MEASURE)).result?.result?.value;
      if (measureOnly || theme === 'light') console.log(`${v.id} ${w}x${h}`, JSON.stringify(m));
      if (!measureOnly) {
        await tab.shot(join(here, `${v.id}-${w}x${h}-${theme}.png`));
        // and the sheet alone, at the same scale, 16px of the yard round it
        const r = (await tab.evaluate(`(() => { const r = document.querySelector('.held').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()`)).result.result.value;
        await tab.shot(join(here, `${v.id}-${w}x${h}-${theme}-sheet.png`), { clip: { x: r[0] - 16, y: r[1] - 16, width: r[2] + 32, height: r[3] + 32, scale: 1 } });
      }
    } finally { await tab.close(); }
  }
} finally { if (own) own.kill(); }
