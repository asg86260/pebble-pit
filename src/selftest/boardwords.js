// The boards in every language: no two runs of words on a card meet, and
// none leaves its card. A translation is longer or shorter than the English
// it replaced by a ratio nobody chose, so the only layout that holds is one
// that cannot overlap for any length; this is the check that says so, asked
// of the real boards (their rows, their strips, the goal card) in every file
// in locales/.
//
// Each language is a frame of its own (play.html?bench, staged, so it never
// touches the save), told its language in its address (`&lang=`, lang.js),
// since the language is read once, as lang.js loads, and the preference is
// shared by every tab on the origin.

import { raf, ok } from './kit.js';
import { LANGS } from '../lang.js';
import { YARD_BOARDS as BOARDS } from '../stations.js';
import { UNFOLDING, overOf } from '../slotfit.js';

// The yards to read, and the boards in each: every board at its fullest, then
// the strips -- a row queued again on the bench and the house, the bench's
// line, and the goal card with its cancel.
const SCENES = [
  ['boards', BOARDS],
  ['queuerepeat', ['bench', 'house']],
  ['queue', ['bench']],
  ['shieldbuilding', ['bench']],
];

// The pips stand down a tile's right edge out of the flow, and the gain line
// is lent the tile's whole width so an amount is never cut short: it may pass
// under the foot of a tall ladder (shelf.css, `.tile .gain`). That one
// meeting is the design; every other is a defect.
const ALLOWED = new Set(['.gain|.ladder']);

// Every overlap and escape on the open board, as lines. `w` is the frame.
function faults(w) {
  const d = w.document;
  const vis = el => !!el && el.offsetParent !== null && w.getComputedStyle(el).visibility !== 'hidden';
  // The box an element's words can paint in: their ink, cut to every box
  // between them and the card that clips.
  const clipOf = el => {
    let r = null;
    for (let e = el; e && !e.classList.contains('tile') && e.tagName !== 'BUTTON'; e = e.parentElement) {
      const cs = w.getComputedStyle(e);
      if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') {
        const q = e.getBoundingClientRect();
        r = r ? { left: Math.max(r.left, q.left), right: Math.min(r.right, q.right), top: Math.max(r.top, q.top), bottom: Math.min(r.bottom, q.bottom) } : q;
      }
    }
    return r;
  };
  const inkOf = el => {
    let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
    const walk = d.createTreeWalker(el, w.NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      if (!n.nodeValue.trim()) continue;
      const rg = d.createRange();
      rg.selectNodeContents(n);
      for (const q of rg.getClientRects()) {
        if (!q.width) continue;
        l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
      }
    }
    if (r < l) return null;
    const c = clipOf(el);
    if (c) { l = Math.max(l, c.left); r = Math.min(r, c.right); t = Math.max(t, c.top); b = Math.min(b, c.bottom); }
    return r > l && b > t ? { left: l, top: t, right: r, bottom: b } : null;
  };
  const boxOf = el => { const q = el.getBoundingClientRect(); return q.width && q.height ? q : null; };
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 &&
                         Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5;
  const out = [];
  for (const rows of d.querySelectorAll('.rows')) {
    if (!vis(rows)) continue;
    for (const card of rows.children) {
      if (!vis(card)) continue;
      const items = [];
      if (card.classList.contains('sect')) {
        // a heading's words against the headcount it wears
        const words = [...card.childNodes].find(n => n.nodeType === 3 && n.nodeValue.trim());
        const badge = card.querySelector('.badge');
        if (words && vis(badge)) {
          const rg = d.createRange(); rg.selectNodeContents(words);
          items.push(['words', rg.getBoundingClientRect()], ['.badge', boxOf(badge)]);
        }
      } else {
        const tile = card.classList.contains('tile');
        for (const sel of ['.what', '.gain', '.note', '.chosen', '.count', ...(tile ? [] : ['.cost', '.time'])]) {
          const e = card.querySelector(sel);
          if (vis(e)) { const k = inkOf(e); if (k) items.push([sel, k]); }
        }
        for (const h of card.querySelectorAll('.strip > i')) if (vis(h)) { const k = inkOf(h); if (k) items.push([`.strip .${h.classList[0]}`, k]); }
        for (const sel of ['.ladder', '.tag']) {
          const e = card.querySelector(sel);
          if (vis(e) && e.children.length) { const k = boxOf(e); if (k) items.push([sel, k]); }
        }
      }
      const name = card.dataset.key || card.dataset.job || card.dataset.dial || card.dataset.sect || card.className;
      const cb = card.getBoundingClientRect();
      for (let i = 0; i < items.length; i++) {
        const [a, qa] = items[i];
        if (!qa) continue;
        for (let j = i + 1; j < items.length; j++) {
          const [b, qb] = items[j];
          if (qb && meet(qa, qb) && !ALLOWED.has(`${a}|${b}`) && !ALLOWED.has(`${b}|${a}`)) out.push(`${name}: ${a} on ${b}`);
        }
        if (!card.classList.contains('sect') &&
            (qa.left < cb.left - 0.5 || qa.right > cb.right + 0.5 || qa.top < cb.top - 0.5 || qa.bottom > cb.bottom + 0.5))
          out.push(`${name}: ${a} leaves the card`);
      }
    }
  }
  return out;
}

export const TESTS = [
  ['board words never overlap, in every language', async () => {
    const checks = [];
    for (const lang of LANGS) {
      const f = document.createElement('iframe');
      f.src = `./play.html?bench&lang=${encodeURIComponent(lang)}`;
      f.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:600px;border:0;opacity:0;pointer-events:none;z-index:-1';
      document.body.appendChild(f);
      try {
        const t0 = performance.now();
        // the dev handles come in by dynamic import, a moment after the page
        const booted = () => { const x = f.contentWindow; return !!(x?.__scene && x.__board && x.__fast); };
        while (!booted() && performance.now() - t0 < 20000) await raf();   // the frame's boot, not the yard's: no turning
        const w = f.contentWindow;
        if (!booted()) { checks.push(ok(false, `${lang}: the game boots in a frame`)); continue; }
        const said = w.document.documentElement.lang;
        const step = () => new Promise(r => { w.__fast(1 / 60); w.requestAnimationFrame(() => r()); });
        const found = [];
        for (const [scene, boards] of SCENES) {
          w.__scene(scene);
          w.__fast(1);
          for (const b of boards) {
            // a board whose station this yard has not stood cannot open
            try { w.__board(b); } catch { continue; }
            // the board pins its width once its words are in, a frame or two on
            for (let i = 0; i < 4; i++) await step();
            for (const line of faults(w)) found.push(`${scene}/${b} ${line}`);
          }
          w.__board(null);
        }
        const uniq = [...new Set(found)];
        checks.push(ok(said === lang && uniq.length === 0,
                       `${lang}: no words on a board meet, and none leaves its card`,
                       said !== lang ? `the frame read ${said}` : uniq.slice(0, 6).join('; ') + (uniq.length > 6 ? ` (+${uniq.length - 6})` : '')));
      } finally { f.remove(); }
    }
    return checks;
  }],

  // A tile's words that cannot fold -- a name's longest word, a gain glued to
  // its unit, the strip's two halves -- are never cut at the tile's edge: the
  // board's slot is as wide as they need (slotfit.js). The check above reads
  // ink inside its clip, so a word cut short passes it; this one asks each
  // box whether its words are wider than it, to the fraction of a pixel, in the house type and in the
  // readable face a size up, on every board at its fullest and on the strips
  // a row bought three times puts up.
  ['no word on a tile is cut at its edge, in the house type and readable text', async () => {
    const checks = [];
    for (const [mode, q] of [['house type', ''], ['readable text', '&readable']]) {
      const f = document.createElement('iframe');
      f.src = `./play.html?bench&lang=en${q}`;
      f.style.cssText = 'position:fixed;left:0;top:0;width:800px;height:600px;border:0;opacity:0;pointer-events:none;z-index:-1';
      document.body.appendChild(f);
      try {
        const t0 = performance.now();
        const booted = () => { const x = f.contentWindow; return !!(x?.__scene && x.__board && x.__fast); };
        while (!booted() && performance.now() - t0 < 20000) await raf();   // the frame's boot, not the yard's: no turning
        const w = f.contentWindow;
        if (!booted()) { checks.push(ok(false, `${mode}: the game boots in a frame`)); continue; }
        await w.document.fonts.ready;
        const face = w.getComputedStyle(w.document.body).fontFamily;
        const step = () => new Promise(r => { w.__fast(1 / 60); w.requestAnimationFrame(() => r()); });
        const cut = [];
        for (const [scene, boards] of SCENES) {
          w.__scene(scene);
          w.__fast(1);
          for (const b of boards) {
            try { w.__board(b); } catch { continue; }
            for (let i = 0; i < 4; i++) await step();
            for (const el of w.document.querySelectorAll('.rows.shelves .tile :is(' + UNFOLDING + ')'))
              if (el.offsetParent !== null && overOf(el) > 0.01)
                cut.push(`${scene}/${b} "${el.textContent.trim()}" over by ${overOf(el).toFixed(2)}px`);
          }
          w.__board(null);
        }
        const uniq = [...new Set(cut)];
        checks.push(ok(uniq.length === 0 && /DM Mono/.test(face) === !!q,
                       `${mode}: no word on a tile is cut at its edge`,
                       `${face}; ` + uniq.slice(0, 6).join('; ') + (uniq.length > 6 ? ` (+${uniq.length - 6})` : '')));
      } finally { f.remove(); }
    }
    return checks;
  }],
];
