// Every word on every page, read off the page (the owner, 2026-10-16: "no
// text should be that size ... make sure things are AA compliant"): the held
// sheet's every page and settings tab, the picker, the boards and the cards
// the scenes below stand up, the notices, the hover line, and the landing
// page's every page -- at a desk's size and a phone's, on the light page and
// the dark. Each word is held to the floor (TEXT_FLOOR) and to WCAG 2's AA
// contrast against what it actually stands on: its own background and every
// one behind it, composited, its opacities taken off its ink first. A word
// over the yard (no box of its own) is read against the page's paper.
//
// Words drawn on a canvas (the yard's pixel numbers) are pictures, not text,
// and are not read here.
//
// Each page is a frame of its own at the size asked for (play.html?bench,
// staged; index.html), as sheetwidth.js stands them, and the dark page is the
// same frame with its root's `dark` turned: the palette is CSS tokens, so a
// class is the whole of the change for the words.

import { ok, sleep } from './kit.js';
import { S } from '../state.js';
import { TEXT_FLOOR, TEXT_AA, TEXT_AA_LARGE, TEXT_LARGE, TEXT_LARGE_BOLD } from '../config.js';
import { LANGS } from '../lang.js';

const SIZES = [['desk', 1280, 800], ['phone', 360, 740]];
// The scenes whose pages carry words: every board, the notices, a card said
// out loud, the queue, the crew's window, the books, the altar's board, the
// end of the story.
const SCENES = ['boards', 'bench', 'benchdeep', 'quarryboard', 'farmboard', 'houseboard', 'filterboard', 'looboard',
                'shackboard', 'towerboard', 'apothboard', 'liftboard', 'domeboard', 'notices2', 'toast', 'messtoast',
                'queue', 'crewlist', 'booksall', 'party-rails', 'storyquest', 'saved'];
// The dev panel and the scene bench never ship.
const NOT_SHIPPED = '#dev, #scenes, .devonly, script, style, noscript, canvas, svg, textarea, option';

const until = async (fn, ms = 20000) => {
  const t0 = performance.now();
  while (!fn() && performance.now() - t0 < ms) await sleep(50);
  return fn();
};
async function frame(src, w, h) {
  const f = document.createElement('iframe');
  f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;border:0;opacity:0;pointer-events:none;z-index:-1`;
  document.body.appendChild(f);
  const loaded = new Promise(r => f.addEventListener('load', r, { once: true }));
  f.src = src;
  await loaded;
  return f;
}
const mod = (f, name) => {
  const at = f.contentWindow.performance.getEntriesByType('resource')
    .map(e => e.name).filter(u => new URL(u).pathname === `/src/${name}.js`).pop() || `/src/${name}.js`;
  return f.contentWindow.eval(`import(${JSON.stringify(at)})`);
};
const paint = async (win, n = 3) => { for (let i = 0; i < n; i++) await new Promise(r => win.requestAnimationFrame(r)); };

// Any CSS color as [r, g, b, a] in 0..255 and 0..1: the canvas reads every
// form the page computes (rgb, color(srgb ...), color-mix's results).
const pen = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
pen.canvas.width = pen.canvas.height = 1;
const seen = new Map();
function rgba(css) {
  if (seen.has(css)) return seen.get(css);
  pen.clearRect(0, 0, 1, 1);
  pen.fillStyle = 'rgba(0, 0, 0, 0)';
  pen.fillStyle = css;
  pen.fillRect(0, 0, 1, 1);
  const d = pen.getImageData(0, 0, 1, 1).data;
  const out = [d[0], d[1], d[2], d[3] / 255];
  seen.set(css, out);
  return out;
}
const over = (top, a, under) => top.map((c, i) => (i < 3 ? c * a + under[i] * (1 - a) : 1));
const lum = ([r, g, b]) => {
  const ch = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const name = el => {
  const own = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') +
    [...el.classList].slice(0, 2).map(c => `.${c}`).join('');
  const at = el.parentElement?.closest('[id]');
  return at && !el.id ? `#${at.id} ${own}` : own;
};

// Every word shown on the page as it stands: its size, tracking, ink, what
// it stands on, and the ratio between them.
export function readWords(win) {
  const d = win.document, out = [];
  const paper = rgba(win.getComputedStyle(d.documentElement).getPropertyValue('--c-paper').trim() || '#fff');
  const walk = d.createTreeWalker(d.body, win.NodeFilter.SHOW_TEXT);
  const done = new Set();
  for (let t = walk.nextNode(); t; t = walk.nextNode()) {
    const el = t.parentElement;
    if (!t.nodeValue.trim() || !el || done.has(el) || el.closest(NOT_SHIPPED)) continue;
    done.add(el);
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) || !el.getClientRects().length) continue;
    const cs = win.getComputedStyle(el);
    // the ink, faded by every opacity between it and the box it stands on
    let fade = 1, under = paper;
    const layers = [];
    for (let e = el; e && e !== d.documentElement; e = e.parentElement) {
      const es = win.getComputedStyle(e);
      const bg = rgba(es.backgroundColor);
      if (bg[3] > 0) { layers.push(bg); if (bg[3] >= 0.999) break; }
      else if (!layers.length) fade *= +es.opacity;
    }
    for (const l of layers.reverse()) under = over(l, l[3], under);
    const ink = rgba(cs.color);
    const fg = over(ink, ink[3] * fade, under);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
    const large = size >= TEXT_LARGE || (bold && size >= TEXT_LARGE_BOLD);
    const ratio = contrast(fg, under);
    out.push({ el: name(el), text: t.nodeValue.trim().slice(0, 24), size, track: cs.letterSpacing,
               ratio: Math.round(ratio * 100) / 100, need: large ? TEXT_AA_LARGE : TEXT_AA,
               fg: fg.slice(0, 3).map(Math.round).join(','), bg: under.slice(0, 3).map(Math.round).join(','),
               disabled: !!el.closest(':disabled') });
  }
  return out;
}

// The words on the page as it stands, on all three pages: the root's `dark`
// and `dim` turned for each reading and put back.
function both(win, view, into) {
  const root = win.document.documentElement, was = root.classList.contains('dark'), wasDim = root.classList.contains('dim');
  for (const mode of ['light', 'dim', 'dark']) {
    root.classList.toggle('dark', mode !== 'light');
    root.classList.toggle('dim', mode === 'dim');
    // a page turned fades in (style.css, `turn`): read it come to rest
    for (const a of win.document.getAnimations()) { try { a.finish(); } catch {} }
    for (const w of readWords(win)) into.push({ view, mode, ...w });
  }
  root.classList.toggle('dark', was);
  root.classList.toggle('dim', wasDim);
}

// The game's pages at one size: every scene above, the held sheet's every
// page and settings tab, the picker, and the hover line.
async function gamePages(size, w, h) {
  const f = await frame('./play.html?bench', w, h), all = [];
  try {
    const win = f.contentWindow, d = f.contentDocument;
    if (!await until(() => !!(win.__scene && win.__fast))) throw new Error(`${size}: the game never booted in a frame`);
    // a phone is a thumb: the boards and the held sheet seat as bottom sheets
    if (size === 'phone') (await mod(f, 'prefs')).forceCoarse(true);
    for (const sc of SCENES) {
      win.__scene(sc);
      win.__fast(1);
      await paint(win, 4);
      both(win, `scene ${sc}`, all);
    }
    // the hover line, with a line in it
    win.__scene('boards');
    win.__fast(1);
    await paint(win);
    const tip = d.getElementById('tip');
    tip.textContent = d.querySelector('#panel .title')?.textContent || 'tip';
    tip.hidden = false;
    tip.style.left = tip.style.top = '40px';
    both(win, 'tip', all);
    tip.hidden = true;
    // the held sheet, every page of it
    const settings = await mod(f, 'settings'), page = await mod(f, 'wardrobepage');
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    const sheet = d.getElementById('held');
    await until(() => !sheet.hidden, 3000);
    const panes = [...new Set([...sheet.querySelectorAll('[data-pane]')].flatMap(el => el.dataset.pane.split(' ')).filter(Boolean))];
    for (const p of panes) {
      if (p === 'wardrobe') continue;
      settings.showPane(p);
      await paint(win);
      if (p === 'settings') {
        for (const tab of sheet.querySelectorAll('.settabs button[data-tab]')) {
          tab.click();
          await paint(win);
          both(win, `sheet settings/${tab.dataset.tab}`, all);
        }
      } else both(win, `sheet ${p}`, all);
    }
    settings.showPane('main');
    page.openWardrobe();
    await paint(win);
    both(win, 'sheet wardrobe', all);
    // and with some items shut, so a locked tile's name is read too
    page.lockForCheck((s, k) => (k.length % 2 ? { name: 'ward-randomize' } : null));
    try {
      await paint(win);
      both(win, 'sheet wardrobe, locked', all);
    } finally { page.lockForCheck(null); }
  } finally { f.remove(); }
  return all;
}

// The landing page at one size, every page of its column.
async function titlePages(size, w, h) {
  const f = await frame('index.html', w, h), all = [];
  try {
    const d = f.contentDocument, win = f.contentWindow;
    await until(() => d.getElementById('playlabel')?.textContent);
    await paint(win);
    const col = d.querySelector('.col');
    const WAY = { main: [], slots: ['slotsbtn'], record: ['recordbtn'], settings: ['settingsbtn'] };
    const panes = [...new Set([...col.querySelectorAll('[data-pane]')].flatMap(el => el.dataset.pane.split(' ')).filter(Boolean))];
    for (const p of panes) {
      d.getElementById('slotsback').click();
      if (WAY[p]) for (const id of WAY[p]) d.getElementById(id).click();
      else for (const el of col.querySelectorAll('[data-pane]')) el.hidden = !el.dataset.pane.split(' ').includes(p);
      await paint(win);
      if (p === 'settings') {
        for (const tab of col.querySelectorAll('.settabs button[data-tab]')) {
          tab.click();
          await paint(win);
          both(win, `title settings/${tab.dataset.tab}`, all);
        }
      } else both(win, `title ${p}`, all);
    }
  } finally { f.remove(); }
  return all;
}

// Every reading, every page, both sizes: for the console and the report
// (`await __textAudit()`), and for the checks below.
export async function textAudit() {
  const wasStaged = S.staged;
  S.staged = true;                  // this page's autosave held while the frames stand
  const out = [];
  try {
    for (const [size, w, h] of SIZES) {
      for (const r of await gamePages(size, w, h)) out.push({ glass: size, page: 'play', ...r });
      for (const r of await titlePages(size, w, h)) out.push({ glass: size, page: 'title', ...r });
    }
  } finally { S.staged = wasStaged; }
  return out;
}
window.__textAudit = textAudit;

// the lines of a list, once each
const say = (list, fmt) => [...new Set(list.map(fmt))];

export const TESTS = [
  ['text: every word on every page is at least the floor and meets AA contrast, desk and phone, light and dark', async () => {
    const all = await textAudit();
    const small = all.filter(r => r.size < TEXT_FLOOR - 0.01);
    const faint = all.filter(r => r.ratio < r.need);
    const smallLines = say(small, r => `${r.page} ${r.view}: ${r.el} ${r.size}px`);
    const faintLines = say(faint, r => `${r.glass} ${r.page} ${r.mode} ${r.view}: ${r.el} "${r.text}" ${r.ratio}:1 (${r.fg} on ${r.bg})`);
    return [
      ok(all.length > 500 && new Set(all.map(r => r.view)).size > SCENES.length, 'the walk read the pages', `${all.length} words`),
      ok(small.length === 0, `no word under ${TEXT_FLOOR}px`, `${smallLines.length}: ${smallLines.slice(0, 12).join('; ')}`),
      ok(faint.length === 0, 'every word meets AA against what it stands on',
         `${faintLines.length}: ${faintLines.slice(0, 12).join('; ')}`),
    ];
  }],

  // At the floor a strip of tabs is wider than a phone in some languages:
  // it scrolls sideways (style.css, `.settabs`), never squeezed shorter by the
  // sheet's column, and no tab's word is ever
  // broken across two lines to fit.
  ['text: no tab\'s word is broken or cut, on a phone, in every language', async () => {
    const broken = [];
    for (const lang of LANGS) {
      const f = await frame(`./play.html?bench&lang=${encodeURIComponent(lang)}`, 360, 740);
      try {
        const win = f.contentWindow, d = f.contentDocument;
        if (!await until(() => !!(win.__scene && win.__fast))) { broken.push(`${lang}: no boot`); continue; }
        (await mod(f, 'prefs')).forceCoarse(true);   // a phone's thumb: the held sheet from the bottom
        const settings = await mod(f, 'settings'), page = await mod(f, 'wardrobepage');
        win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        await until(() => !d.getElementById('held').hidden, 3000);
        const read = () => {
          // a strip that scrolls is a box the sheet's column could squeeze
          for (const strip of d.querySelectorAll('#held [role="tablist"]')) {
            if (strip.getClientRects().length && strip.clientHeight < strip.scrollHeight - 1)
              broken.push(`${lang}: the ${strip.className} strip cut to ${strip.clientHeight} of ${strip.scrollHeight}px`);
          }
          for (const tab of d.querySelectorAll('#held [role="tablist"] button')) {
            if (!tab.getClientRects().length) continue;
            const walk = d.createTreeWalker(tab, win.NodeFilter.SHOW_TEXT);
            for (let t = walk.nextNode(); t; t = walk.nextNode()) {
              if (!t.nodeValue.trim()) continue;
              const r = d.createRange();
              r.selectNodeContents(t);
              const tops = new Set([...r.getClientRects()].filter(q => q.width > 0).map(q => Math.round(q.top)));
              if (tops.size > 1) broken.push(`${lang}: "${t.nodeValue.trim()}" on ${tops.size} lines`);
            }
          }
        };
        settings.showPane('settings');
        for (const tab of d.querySelectorAll('#held .settabs button[data-tab]')) {
          tab.click();
          await paint(win);
          read();
        }
        page.openWardrobe();
        await paint(win);
        read();
      } finally { f.remove(); }
    }
    return [ok(broken.length === 0, `every tab's word on one line, ${LANGS.length} languages at 360px`, broken.slice(0, 12).join('; '))];
  }],
];
