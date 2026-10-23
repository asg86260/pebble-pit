// Every page of the held sheet and of the landing page's column, at a desk's
// width and a phone's: each block on the page -- a row of saves, a list, a
// button, a table, a form -- is the sheet's whole inner width. The sheet is
// one width on every page (`--held-w`; the appearance page alone is wider,
// `--ward-sheet-w`, and is measured against its own), so a block that sizes itself to its
// own content stands narrower than the buttons under it; the saves' rows,
// stacked two lines a row, did exactly that.
//
// Each page is a frame of its own at the width asked for (play.html?bench,
// staged, and index.html), since the window this suite runs in is one width.
// The saves page is read with three yards in it, long enough to stack on a
// phone; the two slots written are put back as they were.

import { raf, ok } from './kit.js';
import { S } from '../state.js';
import { writeSlot, storeSettled } from '../save.js';

// Lines of words, measured as words rather than stretched: a page's word,
// the landing page's name and line, the small hand, the reply, a quotation,
// the rule under the word and the phone sheet's handle (which bleeds past
// the padding on purpose).
const WORDS = '.word, .gamename, .line, .sub, .said, .small, .why, .rule, .handle';
const SIZES = [['desk', 800, 600], ['phone', 390, 844]];

// A frame's own fact, a drawn frame at a time up to `ms` (the ceiling only
// when to give up): the frame boots on its own clock, so nothing is turned.
const until = async (fn, ms = 20000) => {
  const t0 = performance.now();
  while (!fn() && performance.now() - t0 < ms) await raf();
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

// A module of the frame's own, by the URL the frame loaded it under (an
// edited file is served with a stamp, and the bare path is a second copy).
const mod = (f, name) => {
  const at = f.contentWindow.performance.getEntriesByType('resource')
    .map(e => e.name).filter(u => new URL(u).pathname === `/src/${name}.js`).pop() || `/src/${name}.js`;
  return f.contentWindow.eval(`import(${JSON.stringify(at)})`);
};

// Three yards in the store, the open one standing and two saved, with long
// enough words that a phone's row takes two lines. Hands back the undo,
// which is this page's own store and not the frame's: a frame removed with a
// database write in flight aborts it, and the seeded yard would outlive the
// check.
async function seedSlots(f) {
  const save = await mod(f, 'save');
  const was = [2, 3].map(n => [n, save.slotRaw(n)]);
  const now = Date.now();
  save.writeSlot(2, JSON.stringify({ boulderNo: 7, crew: 23, savedAt: now - 3 * 86400e3, playedS: 3 * 3600 + 1260 }));
  save.writeSlot(3, JSON.stringify({ boulderNo: 112, crew: 140, savedAt: now - 40 * 60e3, playedS: 61 * 3600 + 300 }));
  return async () => {
    for (const [n, raw] of was) writeSlot(n, raw || '');
    try { await storeSettled(); } catch {}
  };
}

// Every block on the sheet as it stands, against the sheet's inner width.
function narrow(w, sheet, page) {
  const cs = w.getComputedStyle(sheet);
  const inner = sheet.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const out = [];
  for (const el of sheet.children) {
    if (el.hidden || el.matches(WORDS) || w.getComputedStyle(el).display === 'none') continue;
    const width = el.getBoundingClientRect().width;
    if (Math.abs(width - inner) > 1) out.push(`${page}: ${el.id || el.className || el.tagName} ${Math.round(width)} of ${Math.round(inner)}`);
    // every settings tab's rows, the ones not in force too: they keep their
    // place in the layout unseen (settingstabs.js), so each is measured
    for (const pane of el.querySelectorAll(':scope > .tabpane')) {
      for (const row of pane.children) {
        if (row.hidden || row.matches(WORDS) || w.getComputedStyle(row).display === 'none') continue;
        const rw = row.getBoundingClientRect().width;
        if (Math.abs(rw - inner) > 1) out.push(`${page} (${pane.dataset.tab}): ${row.id || row.className || row.tagName} ${Math.round(rw)} of ${Math.round(inner)}`);
      }
    }
    // a block's own rows stand as wide as it does: the saves' cards
    for (const row of el.querySelectorAll(':scope > .saverow')) {
      const rw = row.getBoundingClientRect().width;
      if (Math.abs(rw - inner) > 1) out.push(`${page}: a save row ${Math.round(rw)} of ${Math.round(inner)}`);
    }
  }
  return out;
}

const panes = sheet => [...new Set([...sheet.querySelectorAll('[data-pane]')]
  .flatMap(el => el.dataset.pane.split(' ')).filter(Boolean))];

export const TESTS = [
  ['every block on every page of the held sheet is the sheet\'s width, desk and phone', async () => {
    const checks = [];
    for (const [size, w, h] of SIZES) {
      const f = await frame('./play.html?bench', w, h);
      try {
        const booted = () => { const x = f.contentWindow; return !!(x?.__scene && x.__fast); };
        if (!await until(booted)) { checks.push(ok(false, `${size}: the game boots in a frame`)); continue; }
        const win = f.contentWindow, d = f.contentDocument;
        const undo = await seedSlots(f);
        try {
          const settings = await mod(f, 'settings');
          win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
          const sheet = d.getElementById('held');
          await until(() => !sheet.hidden, 3000);
          const found = [];
          const names = panes(sheet);
          for (const name of names) {
            settings.showPane(name);
            for (let i = 0; i < 3; i++) await new Promise(r => win.requestAnimationFrame(r));
            found.push(...narrow(win, sheet, name));
          }
          settings.showPane('main');
          checks.push(ok(!sheet.hidden && found.length === 0 && names.includes('slots'),
                         `${size}: every block on the held sheet's ${names.length} pages is the sheet's inner width`,
                         sheet.hidden ? 'the sheet never came up' : found.slice(0, 8).join('; ')));
        } finally { await undo(); }
      } finally { f.remove(); }
    }
    return checks;
  }],

  ['every block on every page of the landing page\'s column is the column\'s width, desk and phone', async () => {
    const checks = [];
    // this page's autosave held for the visit, so the slots are the frame's alone
    const wasStaged = S.staged;
    S.staged = true;
    try {
      for (const [size, w, h] of SIZES) {
        const f = await frame('index.html', w, h);
        const d = f.contentDocument, win = f.contentWindow;
        try {
          await until(() => d.getElementById('playlabel').textContent);
          const undo = await seedSlots(f);
          try {
            const col = d.querySelector('.col');
            const click = id => d.getElementById(id).click();
            // the way to each page from the front, as a player turns to it;
            // a page with no button here (the feedback form without a
            // worker, the cloud's clash) is shown as the page turn shows it
            const WAY = { main: [], slots: ['slotsbtn'], record: ['recordbtn'], settings: ['settingsbtn'] };
            const found = [];
            const names = panes(col);
            for (const name of names) {
              click('slotsback');                   // the front again, whichever page this was
              if (WAY[name]) for (const id of WAY[name]) click(id);
              else for (const el of col.querySelectorAll('[data-pane]')) el.hidden = !el.dataset.pane.split(' ').includes(name);
              for (let i = 0; i < 3; i++) await new Promise(r => win.requestAnimationFrame(r));
              found.push(...narrow(win, col, name));
            }
            checks.push(ok(found.length === 0 && names.includes('slots'),
                           `${size}: every block on the column's ${names.length} pages is the column's inner width`,
                           found.slice(0, 8).join('; ')));
          } finally { await undo(); }
        } finally { f.remove(); }
      }
    } finally { S.staged = wasStaged; }
    return checks;
  }],
];
