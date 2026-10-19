// The held sheet as the settings sheet: what is on it, in what order, and
// whether each thing on it does what it says. The sheet is DOM, the switch
// is a button, the save goes through a textarea; the preference store itself
// is checked in test/settings.test.mjs.

import { sleep, raf, newRun, settle, state, ok, run, runUntil, board, haveRock,
         boulderWorld, onScreen, point } from './kit.js';
import { pref, setPref, reducedMotion, coarse, dark, theme, readable } from '../prefs.js';
import { setSlot, storeSettled, clear, slotRaw, writeSlot } from '../save.js';
import { S } from '../state.js';
import { version } from '../version.js';
import { persist, exportSave, claimSave } from '../persist.js';
import { earn, noticeFor } from '../notices.js';
import { toastUp, toastWaiting } from '../toast.js';
import { TOAST_MS, TOAST_GAP_MS, SHEET_FADE_MS } from '../config.js';
import { msg } from '../lang.js';
import { feedbackReady } from '../feedback.js';
import { offered } from '../langpage.js';
import { controlGroups } from '../controls.js';
import { fullscreenAble } from '../fullscreen.js';
import { TABS, turnTab, tabNow } from '../settingstabs.js';

const held = () => document.getElementById('held');
// escape, and then a frame: the sheet puts itself in order when it sees itself
// come up, which is a microtask after the key, not the same tick
const press = async () => {
  dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  await raf();
};
const resume = () => document.getElementById('resume').click();
// the settings are a page behind the front: one press to turn to it
const settingsPage = () => document.getElementById('settingsbtn').click();
// and the saves, with the save out and in under the rows
const savesPage = () => document.getElementById('slotsbtn').click();
const onFront = () => !document.getElementById('resume').hidden && document.getElementById('slots').hidden;
const said = () => held().querySelector('.said').textContent;
const motion = () => document.getElementById('motion');

// A saves row as the player reads it (items joined by the dots it used to
// carry), and where its items sit: the rock, crew and when columns share a left
// edge down every row that has them, an empty row's one item starts at the
// rock column, and no two neighbors in a row are nearer than `gap` px.
const slotWords = b => [...b.querySelectorAll('.what .item')].map(e => e.textContent).join(' · ');
function slotColumns(btns) {
  const left = {}; let gap = Infinity;
  for (const b of btns) {
    const its = [...b.querySelectorAll('.what .item')];
    its.forEach((e, i) => {
      const kind = e.classList.contains('lone') ? 'rock' : e.classList[1];
      (left[kind] ||= new Set()).add(Math.round(e.getBoundingClientRect().left));
      if (i) gap = Math.min(gap, e.getBoundingClientRect().left - its[i - 1].getBoundingClientRect().right);
    });
  }
  return { aligned: Object.values(left).every(l => l.size === 1) && Object.keys(left).length >= 2, gap: Math.round(gap), left: Object.fromEntries(Object.entries(left).map(([k, v]) => [k, [...v]])) };
}

// What a player reads, top to bottom. The record's button carries a count
// that is the yard's doing, and the saves button which yard, so each is read
// as its name: what the check is about is that the line is there.
// The settings' tab strip reads as its tabs, the one in force in brackets;
// the tabs' rows are read a tab at a time (`tabRows`).
const lines = (root = held()) => [...root.children]
  .filter(el => !el.hidden && !(el.classList.contains('said') && !el.textContent))
  .filter(el => !el.classList.contains('tabbody'))
  .map(el => el.id === 'recordbtn' ? 'achievements'
           : el.id === 'slotsbtn' ? 'saves'
           : el.id === 'indexbtn' ? 'index'
           : el.classList.contains('settabs') ? stripWords(el)
           : el.textContent.replace(/\s+/g, ' ').trim());
const stripWords = el => [...el.querySelectorAll('button')].map(b => b.classList.contains('on') ? `[${b.textContent}]` : b.textContent).join(' ');

// What a player sees under the tab in force, read off the glass: every row
// that stands and is not hidden by its tab, as its words (the slider as its
// label, the controls table and the languages as what they are).
const seenEl = el => !!el && !el.hidden && el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible';
function tabRows(root) {
  const out = [];
  for (const pane of root.querySelectorAll('.tabpane')) for (const el of pane.children) {
    if (!seenEl(el)) continue;
    out.push(el.type === 'range' ? `slider ${el.getAttribute('aria-label')}`
           : el.classList.contains('controls') ? 'the controls table'
           : el.classList.contains('langs') ? 'the languages'
           : el.textContent.replace(/\s+/g, ' ').trim());
  }
  return out;
}
// The rows each tab should show, on the held sheet or the landing page (which
// has no touch or fullscreen row).
function wantRows(tab, landing) {
  if (tab === 'graphics') return ['motion: ' + (reducedMotion() ? 'less' : 'full'), 'dark: ' + ({ light: 'off', dim: 'dim', dark: 'on' })[theme()],
    'readable text: ' + (readable() ? 'on' : 'off'),
    ...(landing ? [] : [fullscreenAble() ? 'fullscreen: off' : msg('set-fullscreen-note')])];
  if (tab === 'audio') return ['sound: ' + (pref('muted') ? 'off' : 'on'), 'slider volume'];
  if (tab === 'controls') return [...(landing ? [] : ['touch: ' + (coarse() ? 'on' : 'off')]), 'the controls table'];
  return ['the languages'];
}
// Each tab clicked as a player clicks it, on `root` (the held sheet or the
// landing page's column): what it shows, whether its strip button alone is
// inverted, and the sheet's height and top with it up.
function walkTabs(root, landing) {
  const out = [];
  for (const t of TABS) {
    root.querySelector(`.settabs button[data-tab="${t}"]`).click();
    const box = root.getBoundingClientRect();
    out.push({ tab: t, rows: tabRows(root), want: wantRows(t, landing),
               on: [...root.querySelectorAll('.settabs button.on')].map(b => b.dataset.tab).join(),
               h: Math.round(box.height), top: Math.round(box.top),
               table: t === 'controls' ? [...root.querySelectorAll('#controlslist > .group, #controlslist > .do')].map(el => el.textContent) : null,
               langs: t === 'language' ? [...root.querySelectorAll('#langlist button')].map(b => b.textContent) : null });
  }
  return out;
}
// The checks a walk answers, the same on both pages.
function tabChecks(walk, where) {
  return [
    ok(walk.every(w => w.rows.join('|') === w.want.join('|')), `${where}: each tab, clicked, shows its rows and no other tab's`,
       JSON.stringify(walk.map(w => [w.tab, w.rows]))),
    ok(walk.every(w => w.on === w.tab), `${where}: the tab clicked, alone, inverted`, walk.map(w => w.on).join(' ')),
    ok(new Set(walk.map(w => w.h)).size === 1 && new Set(walk.map(w => w.top)).size === 1,
       `${where}: the sheet holds one height and place across the tabs`, walk.map(w => `${w.tab} ${w.h}@${w.top}`).join(', ')),
    ok(walk.find(w => w.tab === 'controls').table.join('|') === MOUSE_TABLE.join('|'),
       `${where}: the controls tab is the table, the mouse's actions under their groups`, JSON.stringify(walk.find(w => w.tab === 'controls').table)),
    ok(walk.find(w => w.tab === 'language').langs.join('|') === offered().map(r => r.name).join('|'),
       `${where}: the language tab lists every language offered`),
  ];
}

// The controls table without a pad, top to bottom: each group's heading, then
// its actions.
const MOUSE_TABLE = ['interact', 'interact', 'crew', 'focus workers', 'pick up workers',
  'camera', 'move camera', 'travel', 'jump to a place'];

// Whether the controls table lines up, read off the boxes in frame `w`: every
// action, mouse and pad cell shares its column's left and right edge, the
// three cells of a row share its top and bottom, a heading spans the columns,
// a row's glyph is centered on its action's line, and nothing is wider than
// its cell or the table. Lines of what is off; none when it lines up.
function tableFaults(w) {
  const list = w.document.getElementById('controlslist');
  const box = el => el.getBoundingClientRect();
  const r1 = v => Math.round(v);
  const kids = [...list.children];
  const rows = [];
  kids.forEach((el, i) => { if (el.classList.contains('do')) rows.push(kids.slice(i, i + 3)); });
  const out = [];
  const cols = { do: 0, bymouse: 1, bypad: 2 };
  for (const [name, i] of Object.entries(cols)) {
    const lefts = new Set(rows.map(r => r1(box(r[i]).left))), rights = new Set(rows.map(r => r1(box(r[i]).right)));
    if (lefts.size !== 1 || rights.size !== 1) out.push(`${name} column edges ${[...lefts]} / ${[...rights]}`);
    if (rows.some(r => !r[i]?.classList.contains(name))) out.push(`a row without its ${name} cell`);
  }
  const heads = kids.filter(el => el.classList.contains('colhead'));
  if (heads.length !== 3 || r1(box(heads[2]).left) !== r1(box(rows[0][2]).left)) out.push('the pad\'s head is not over its column');
  for (const g of kids.filter(el => el.classList.contains('group')))
    if (r1(box(g).left) !== r1(box(rows[0][0]).left) || r1(box(g).right) !== r1(box(rows[0][2]).right)) out.push(`heading ${g.textContent} does not span the table`);
  for (const r of rows) {
    const [a, m, p] = r.map(box);
    if (Math.abs(a.top - m.top) > 0.5 || Math.abs(a.top - p.top) > 0.5 || Math.abs(a.bottom - m.bottom) > 0.5 || Math.abs(a.bottom - p.bottom) > 0.5)
      out.push(`${r[0].textContent}: cells not one row`);
    const g = r[2].querySelector('.padin');
    const rg = w.document.createRange();
    rg.selectNodeContents(r[0]);
    const t = rg.getBoundingClientRect();
    if (g && Math.abs((box(g).top + box(g).bottom) / 2 - (t.top + t.bottom) / 2) > 1.5) out.push(`${r[0].textContent}: glyph off its line`);
    for (const c of r) if (c.scrollWidth > c.clientWidth + 1) out.push(`${r[0].textContent}: a cell spills`);
  }
  if (list.scrollWidth > list.clientWidth + 1) out.push('the table is wider than the sheet');
  return { out, rows: rows.length, width: r1(box(list).width) };
}

export const TESTS = [
  // --- the landing page (DESIGN.md, "The landing page") ----------------------
  // index.html in a frame, the player's way. The demo yard the page shows
  // boots too, staged, and must write nothing.
  ['the landing page reads the store and play opens the game', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(5);
    persist();
    await storeSettled();
    const blob = exportSave();
    // This page's own save runs on a wall clock and stamps every write
    // (`savedAt`), so left running it rewrites the slot under the check a
    // second at a time. Held for the visit, the way a staged scene holds it,
    // so the only page that could write the slot is the one under test.
    const wasStaged = S.staged;
    S.staged = true;
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;visibility:hidden';
    const loaded = () => new Promise(r => f.addEventListener('load', r, { once: true }));
    document.body.appendChild(f);
    let cols = null, landed = false, label = '', rows = [], played = [], noReset = false, record = '', arrived = false, crewThere = 0, untouched = false, edges = [];
    try {
      f.src = 'index.html';
      await loaded();
      const d = f.contentDocument;
      // the page's own boot is a prime of the store, awaited at its top level
      for (let i = 0; i < 40 && !d.getElementById('playlabel').textContent; i++) await sleep(50);
      landed = !!d.getElementById('play');
      label = d.getElementById('playlabel').textContent;
      record = d.getElementById('recordbtn').textContent;
      d.getElementById('slotsbtn').click();
      rows = [...d.querySelectorAll('.slot')].map(slotWords);
      cols = slotColumns([...d.querySelectorAll('.slot')]);
      played = [...d.querySelectorAll('.slot .played')].map(p => p.textContent);
      noReset = !d.getElementById('reset');
      // every control down a page of the column, the saves page's pair and
      // the settings page's slider among them, ends at one right edge (the
      // saves page is as wide as its rows, so the two pages may differ)
      const rights = () => [...d.querySelectorAll('.col > :not([hidden])')]
        .filter(el => el.matches('button, input, .pair, .saves, .paste, .record, .settabs, .tabbody') && el.getBoundingClientRect().width)
        .map(el => `${el.id || el.className} ${Math.round(el.getBoundingClientRect().right)}`);
      edges.push(rights());
      d.getElementById('slotsback').click();
      d.getElementById('settingsbtn').click();
      edges.push(rights());
      d.getElementById('settingsback').click();
      untouched = slotRaw(1) === blob;          // before play: the game itself writes the slot
      d.getElementById('play').click();
      await loaded();
      arrived = /play\.html$/.test(f.contentWindow.location.pathname);
      for (let i = 0; i < 60 && !f.contentWindow.__state; i++) await sleep(50);
      crewThere = f.contentWindow.__state ? f.contentWindow.__state().crew : -1;
    } finally {
      f.remove();
      S.staged = wasStaged;
    }
    return [
      ok(landed, 'index.html is the landing page'),
      ok(/^rock \d+ · 4 crew · just now$/.test(label), 'play says what it opens, without a yard number', label),
      ok(rows.length === 3 && /^1 · rock \d+ · 4 crew/.test(rows[0]) && rows[1] === '2 · empty',
         'the saves rows read the slots', JSON.stringify(rows)),
      ok(cols.aligned && cols.gap >= 12, 'the rows keep their items in columns with a gap between', JSON.stringify(cols)),
      ok(/^(\d+h )?\d+m$/.test(played[0]) && played[1] === '' && noReset,
         'with the playtime beside a filled row, and no reset button', `${JSON.stringify(played)}, ${noReset}`),
      ok(/^achievements · \d+ of \d+$/.test(record), 'and the record has its count', record),
      ok(edges.length === 2 && edges.every(p => p.length >= 3 && new Set(p.map(e => e.split(' ').pop())).size === 1),
         'every control on a page of the column is one width', edges.map(p => p.join(', ')).join(' / ')),
      ok(arrived && crewThere === 4, 'play opens play.html with the yard', `${arrived}, ${crewThere} crew`),
      ok(untouched, 'and nothing the landing page did wrote the slot'),
    ];
  }],

  ['the landing page\'s settings are four tabs, each with its rows', async () => {
    newRun();
    await settle();
    const wasStaged = S.staged;
    S.staged = true;
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;visibility:hidden';
    document.body.appendChild(f);
    let walk = [], page = [], fits = false, back = false, foot = [];
    try {
      const loaded = new Promise(r => f.addEventListener('load', r, { once: true }));
      f.src = 'index.html';
      await loaded;
      const d = f.contentDocument;
      for (let i = 0; i < 40 && !d.getElementById('playlabel').textContent; i++) await sleep(50);
      d.getElementById('settingsbtn').click();
      const col = d.querySelector('.col');
      walk = walkTabs(col, true);
      // the word, the strip, the tabs' cell, and the foot: back, with
      // feedback beside it where there is a worker
      page = [...col.children].filter(el => !el.hidden && !el.matches('.gamename, .line, .said:empty')).map(el => el.className || el.id);
      foot = [...col.querySelector('.pair[data-pane="settings"]').children].filter(el => !el.hidden).map(el => el.id);
      const cl = d.getElementById('controlslist');
      fits = col.getBoundingClientRect().right <= 960 && cl.scrollWidth <= cl.clientWidth + 1;
      d.getElementById('settingsback').click();
      back = !d.getElementById('play').hidden && d.querySelector('.settabs').hidden;
    } finally {
      f.remove();
      S.staged = wasStaged;
    }
    return [
      ...tabChecks(walk, 'landing page'),
      ok(page.join('|') === 'word|settabs|tabbody|pair', 'the word, the strip, the tabs, and the foot', JSON.stringify(page)),
      ok(foot.join() === [...(feedbackReady() ? ['fbbtn'] : []), 'settingsback'].join(), 'feedback beside back at the foot', foot.join()),
      ok(fits, 'and the column grows to hold the table'),
      ok(back, 'back turns to the front'),
    ];
  }],

  ['the saves page switches yards', async () => {
    // Slot 2 empty before and after, through the store: the save is in
    // IndexedDB, and a key removed from localStorage by hand leaves a run's
    // yard standing for the next run to find. Setting the slot by hand skips
    // the claim `switchSlot` makes, so the claim is made here too, and the
    // database is waited for so the pointer lands before the harness closes
    // the page.
    const emptySlot2 = async () => { setSlot(2); clear(); setSlot(1); claimSave(); S.yielded = false; await storeSettled(); };
    newRun();
    await settle();
    await emptySlot2();
    window.__crew(2, 2);
    run(5);
    persist();
    const crew = state().crew;
    await press();
    document.getElementById('slotsbtn').click();
    const rows = () => [...document.getElementById('slots').querySelectorAll('.slot')];
    const listed = rows().map(slotWords);
    const row2 = rows()[1];
    row2.click();
    const asked = slotWords(row2);
    row2.click();
    const fresh = state();
    const saidNew = said();
    const frontAfterNew = onFront();
    savesPage();
    const rows2 = rows().map(slotWords);
    const cols = slotColumns(rows());
    const cs = el => getComputedStyle(el);
    const opens = rows().filter(r => r.classList.contains('open'));
    const probe = document.createElement('i');
    probe.style.cssText = 'color:var(--ink);background:var(--paper)';
    document.body.appendChild(probe);
    const ink = cs(probe).color, paper = cs(probe).backgroundColor;
    probe.remove();
    const inverted = opens.length === 1 && cs(opens[0]).backgroundColor === ink && cs(opens[0]).color === paper
      && cs(opens[0]).opacity === '1' && opens[0].disabled;
    rows()[0].click();
    const backAgain = state();
    const saidBack = said();
    const frontAfterLoad = onFront();
    resume();
    await emptySlot2();
    localStorage.removeItem('boulder-clicker/v4/2.tab');
    return [
      ok(listed[0].endsWith('playing') && listed[1] === '2 · empty' && listed[2] === '3 · empty',
         'three rows, the open one playing', JSON.stringify(listed)),
      ok(asked === '2 · start a new yard?', 'an empty row asks first', asked),
      ok(fresh.crew === 0 && fresh.beat.yard && saidNew === 'a new yard', 'and the second press is the new game',
         `${fresh.crew} crew, ${saidNew}`),
      ok(rows2[1].endsWith('playing') && /^1 · rock \d+ · \d+ crew · just now$/.test(rows2[0]),
         'the page reads the swap', JSON.stringify(rows2)),
      ok(cols.aligned && cols.gap >= 12, 'the filled rows keep rock, crew and when in columns with a gap between items', JSON.stringify(cols)),
      ok(inverted, 'the open row is inverted (ink fill, paper text), not faded, and inert', `${opens.length} open`),
      ok(backAgain.crew === crew && saidBack === 'loaded', 'and the first yard comes back',
         `${backAgain.crew} vs ${crew}, ${saidBack}`),
      ok(frontAfterNew && frontAfterLoad, 'and each pick turns back to the front',
         `${frontAfterNew}, ${frontAfterLoad}`),
    ];
  }],

  // --- the save in IndexedDB (DESIGN.md, "The save is in IndexedDB") --------
  // The one check that runs against the real database.
  ['the save is in the database, and a full localStorage does not cost it', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(5);
    persist();
    const blob = exportSave();
    await storeSettled();
    const fromDb = await new Promise((ok, no) => {
      const req = indexedDB.open('boulder-clicker', 1);
      req.onsuccess = () => {
        const g = req.result.transaction('kv', 'readonly').objectStore('kv').get('boulder-clicker/v4');
        g.onsuccess = () => { req.result.close(); ok(g.result); };
        g.onerror = () => no(g.error);
      };
      req.onerror = () => no(req.error);
    });
    // fill localStorage until it refuses, as a shared origin does
    const junk = 'x'.repeat(1 << 18);
    let n = 0, threw = null;
    try { for (; n < 200; n++) localStorage.setItem('junk/' + n, junk); } catch (e) { threw = e.name; }
    run(3);
    persist();
    const after = exportSave();
    await storeSettled();
    persist();                                  // one write behind: this one reports the last
    const unsaved = S.unsaved;
    for (let i = 0; i < n; i++) localStorage.removeItem('junk/' + i);
    return [
      ok(fromDb === blob, 'the autosave is in IndexedDB', `${(fromDb || '').length} vs ${blob.length} chars`),
      ok(threw != null, 'localStorage was filled until it refused', `${n} x 512kb, ${threw}`),
      ok(!unsaved && after !== blob, 'and the yard kept saving through it', `unsaved ${unsaved}`),
    ];
  }],

  ['the held sheet is the settings sheet', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(10);
    await press();
    const up = !held().hidden;
    const got = lines();
    const want = [
      'paused',
      'resume',
      '',                                     // the rule
      'saves',                                // the three yards -- see slots.js
      'achievements',                         // the button to the page behind -- see record.js
      'index',                                // every thing met -- see indexpage.js
      'settings',                             // and the settings, behind one word
      // the feedback page, only in a build pointed at the worker -- see feedback.js
      ...(feedbackReady() ? [msg('held-fbbtn')] : []),
      'return to title',
      'esc holds · ← → look about · hold space to skip a scene',
      version(),
    ];
    turnTab('graphics');
    settingsPage();
    const page = lines();
    const wantPage = [
      'settings',
      '[graphics] audio controls language',  // the tabs -- see settingstabs.js
      'back',
      version(),
    ];
    document.getElementById('settingsback').click();
    const before = state();
    resume();
    await sleep(SHEET_FADE_MS + 60);            // it goes down as a fade (fade.js)
    const down = held().hidden;
    run(2);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(up, 'escape puts the sheet up'),
      ok(got.join('|') === want.join('|'), 'and every line is on it, in order',
         `got ${JSON.stringify(got)}`),
      ok(page.join('|') === wantPage.join('|'), 'and the settings page has the rest',
         `got ${JSON.stringify(page)}`),
      ok(down && !after.paused, 'resume takes it down', `${down}, ${after.paused}`),
      ok(after.workerPos.join() !== before.workerPos.join(), 'and the game runs on'),
    ];
  }],

  // The tabs on the held sheet, clicked as a player clicks them: each shows
  // its own rows (the touch switch over the controls table, the languages
  // inline), the sheet holds still across them, and the tab is remembered
  // when the sheet comes up again.
  ['the held sheet\'s settings are four tabs, each with its rows', async () => {
    newRun();
    await settle();
    await press();
    settingsPage();
    const walk = walkTabs(held(), false);
    held().querySelector('.settabs button[data-tab="audio"]').click();
    document.getElementById('settingsback').click();
    const front = onFront();
    resume();
    await sleep(SHEET_FADE_MS + 60);
    await press();
    settingsPage();
    const kept = held().querySelector('.settabs button.on')?.dataset.tab;
    const keptRows = tabRows(held());
    document.getElementById('settingsback').click();
    resume();
    await sleep(SHEET_FADE_MS + 60);
    turnTab('graphics');
    return [
      ...tabChecks(walk, 'held sheet'),
      ok(front, 'back turns to the front'),
      ok(kept === 'audio' && keptRows.join('|') === wantRows('audio').join('|'),
         'the sheet comes up again on the tab it left', `${kept} ${keptRows}`),
    ];
  }],

  // The pad on the tabs: A on settings lands on the first row of the tab in
  // force, LB and RB turn the tab and land on its first row, up off the
  // first row is the strip, left and right there turn it, down goes back
  // into the rows, and B is the front.
  ['the settings tabs with a pad: LB, RB and the strip', async () => {
    const BUTTONS = { a: 0, b: 1, lb: 4, rb: 5, menu: 9, up: 12, down: 13, left: 14, right: 15 };
    const fake = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', connected: true, mapping: 'standard',
                   buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
    const own = Object.getOwnPropertyDescriptor(navigator, 'getGamepads');
    const frames = async n => { for (let i = 0; i < n; i++) await raf(); };
    const pad = async name => {
      const b = fake.buttons[BUTTONS[name]];
      b.pressed = true; b.value = 1; await frames(2);
      b.pressed = false; b.value = 0; await frames(2);
    };
    const page = () => window.__pad.page();
    const at = () => { const el = page(); return el?.closest?.('.settabs') ? `tab:${el.dataset.tab}` : el?.id || el?.tagName || 'none'; };
    newRun();
    await settle();
    turnTab('graphics');
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [fake] });
    window.__motion(true);
    const seen = [];
    const log = async name => { await pad(name); seen.push(`${name}>${tabNow()}:${at()}`); };
    let front = false;
    try {
      await pad('b');
      await pad('menu');
      await frames(3);
      for (let i = 0; i < 16 && page()?.id !== 'settingsbtn'; i++) await pad('down');
      for (const name of ['a', 'rb', 'rb', 'lb', 'lb', 'up', 'right', 'right', 'left', 'down', 'b']) await log(name);
      front = onFront() && held().querySelector('.settabs').hidden;
      await pad('b');
    } finally {
      window.__pad.off();
      if (own) Object.defineProperty(navigator, 'getGamepads', own); else delete navigator.getGamepads;
      window.__motion(null);
      turnTab('graphics');
    }
    const want = ['a>graphics:motion', 'rb>audio:sound', 'rb>controls:touch', 'lb>audio:sound', 'lb>graphics:motion',
                  'up>graphics:tab:graphics', 'right>audio:tab:audio', 'right>controls:tab:controls', 'left>audio:tab:audio',
                  'down>audio:sound'];
    const got = seen.slice(0, want.length);
    return [
      ok(got[0] === want[0], 'A on settings lands on the first row of the tab in force', seen.join(' ')),
      ok(got.slice(1, 5).join() === want.slice(1, 5).join(), 'LB and RB turn the tab, the focus on its first row', seen.join(' ')),
      ok(got[5] === want[5], 'up off the first row lands on the strip, on the tab in force', seen.join(' ')),
      ok(got.slice(6, 9).join() === want.slice(6, 9).join(), 'left and right on the strip turn the tab', seen.join(' ')),
      ok(got[9] === want[9], 'down from the strip goes into the rows', seen.join(' ')),
      ok(front, 'B turns back to the front', seen.join(' ')),
    ];
  }],

  // The keyboard reaches the strip the same way: up off the first row, left
  // and right there turn the tab (and do not pan the yard), down goes back.
  ['the settings tabs by keyboard: the arrows and the strip', async () => {
    newRun();
    await settle();
    turnTab('graphics');
    await press();
    settingsPage();
    const key = k => document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    const at = () => { const el = document.activeElement; return el?.closest?.('.settabs') ? `tab:${el.dataset.tab}` : el?.id || 'none'; };
    const camX = S.camX;
    const seen = [];
    document.getElementById('motion').focus();
    for (const k of ['ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowRight', 'ArrowRight', 'ArrowLeft', 'ArrowDown']) {
      key(k);
      await raf();
      seen.push(`${k.slice(5)}>${tabNow()}:${at()}`);
    }
    await raf();
    const still = S.camX === camX;
    document.getElementById('settingsback').click();
    resume();
    await sleep(SHEET_FADE_MS + 60);
    turnTab('graphics');
    const want = ['Down>graphics:dark', 'Up>graphics:motion', 'Up>graphics:tab:graphics', 'Right>audio:tab:audio',
                  'Right>controls:tab:controls', 'Left>audio:tab:audio', 'Down>audio:sound'];
    return [
      ok(seen.slice(0, 3).join() === want.slice(0, 3).join(), 'up and down step the rows, and up off the first is the strip', seen.join(' ')),
      ok(seen.slice(3, 6).join() === want.slice(3, 6).join(), 'left and right on the strip turn the tab', seen.join(' ')),
      ok(seen[6] === want[6], 'down from the strip is the first row', seen.join(' ')),
      ok(still, 'and the arrows on the strip do not pan the yard'),
    ];
  }],

  // The table with a pad seen, in real frames: a desktop and a 360px phone in
  // English, and the two longest languages on a phone and the desk. Every
  // row's cells share the column tracks (one grid), so they line up whatever
  // the words; and each action is there once.
  ['the controls table lines up at the desk and on a phone, in every long language', async () => {
    const want = controlGroups(true).reduce((n, [, rows]) => n + rows.length, 0);
    const out = [];
    for (const [width, lang] of [[960, 'en'], [360, 'en'], [360, 'de'], [960, 'fr']]) {
      const f = document.createElement('iframe');
      f.src = `./play.html?bench&lang=${lang}`;
      f.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:800px;border:0;opacity:0;pointer-events:none;z-index:-1`;
      document.body.appendChild(f);
      try {
        const t0 = performance.now();
        const booted = () => { const x = f.contentWindow; return !!(x?.__scene && x.__reset && x.__fast); };
        while (!booted() && performance.now() - t0 < 20000) await sleep(50);
        if (!booted()) { out.push(ok(false, `the game boots in a ${width}px frame (${lang})`)); continue; }
        f.contentWindow.__scene('controlspad');
        await sleep(400);
        const d = f.contentDocument;
        const words = [...d.querySelectorAll('#controlslist > .do')].map(el => el.textContent);
        const { out: bad, rows, width: w } = tableFaults(f.contentWindow);
        out.push(ok(rows === want && new Set(words).size === rows, `${lang} at ${width}px: every action once`, `${rows} rows of ${want}`),
                 ok(bad.length === 0, `${lang} at ${width}px: every row's cells share the columns`, `${w}px wide; ${bad.join('; ')}`));
      } finally { f.remove(); }
    }
    return out;
  }],

  ['motion is a switch that remembers', async () => {
    newRun();
    await settle();
    setPref('motion', null);
    await press();
    settingsPage();
    const was = reducedMotion();
    const readBefore = motion().textContent;
    motion().click();
    const flipped = pref('motion');
    const readAfter = motion().textContent;
    resume();
    // a new run is the game starting over; the preference is not the game's
    newRun();
    await settle();
    await press();
    settingsPage();
    const kept = pref('motion');
    const readKept = motion().textContent;
    resume();
    // Put back as the switch would: the preference and the page's `still`
    // with it, or every sheet after this slides in with no transition to
    // watch (the settings sheet's way in, sheet.js).
    setPref('motion', null);
    document.body.classList.toggle('still', reducedMotion());
    return [
      ok(readBefore === (was ? 'motion: less' : 'motion: full'),
         'the switch reads what is in force', readBefore),
      ok(flipped === !was, 'pressing it flips the preference', String(flipped)),
      ok(readAfter === (was ? 'motion: full' : 'motion: less'),
         'and the button says so', readAfter),
      ok(kept === !was && readKept === readAfter, 'and a new run does not unflip it',
         `${kept}, ${readKept}`),
    ];
  }],

  ['a save comes out and goes back in through the sheet', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(5);
    persist();                                  // so there is a save to copy
    await press();
    savesPage();
    document.getElementById('savecopy').click();
    await sleep(100);
    const copied = said();
    // the blob itself, off the seam the button used: what the clipboard holds
    // is the browser's business, and headless pages do not always have one
    const blob = exportSave();

    document.getElementById('loadsave').click();
    const paste = document.getElementById('paste');
    const box = document.getElementById('pastebox');
    const opened = !paste.hidden;
    const stored = state().stored;
    box.value = 'nothing here';
    document.getElementById('loadit').click();
    const refused = said();
    if (/not built/.test(refused)) {
      resume();
      window.__crew(0, 0);
      return [ok(false, 'importSave is not built (track C)', refused)];
    }
    const stillOpen = !paste.hidden;
    const untouched = state().stored === stored;

    box.value = blob;
    document.getElementById('loadit').click();
    const loaded = said();
    const folded = paste.hidden && onFront();
    resume();
    window.__crew(0, 0);
    return [
      ok(/copied \d+kb|in window\.__save/.test(copied), 'the save comes out of the sheet', copied),
      ok(opened, 'load a save opens the paste'),
      ok(refused === 'that is not a save' && stillOpen && untouched,
         'a paste that is not a save is refused, and costs nothing',
         `${refused}, open ${stillOpen}, stored ${state().stored} vs ${stored}`),
      ok(blob.length > 0 && loaded === 'loaded' && folded,
         'and the exported blob goes back in, and the sheet turns to the front', `${loaded}, ${blob.length} chars`),
    ];
  }],

  // Each save's playtime and its delete, pressed the player's way: the delete
  // fades a confirm open under its row, `back` fades it shut, and `delete`
  // clears the slot. The open slot's delete is the reset it replaced.
  ['each save says its playtime, and its delete asks before it clears', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(5);
    persist();
    await storeSettled();
    // Slot 2 holds a yard of its own, three hours and twelve minutes in: the
    // setup this check is not about.
    const other = JSON.parse(exportSave());
    other.playedS = 3 * 3600 + 12 * 60 + 5;
    const otherRaw = JSON.stringify(other);
    writeSlot(2, otherRaw);
    await storeSettled();
    await press();
    savesPage();
    const list = document.getElementById('slots');
    const row = n => list.querySelector(`.slot[data-slot="${n}"]`);
    const del = n => list.querySelector(`.del[data-slot="${n}"]`);
    const ask = n => list.querySelector(`.confirm[data-slot="${n}"]`);
    const open = n => { const c = ask(n); return getComputedStyle(c).opacity === '1' && c.getBoundingClientRect().height > 0; };
    const shut = n => { const c = ask(n); return getComputedStyle(c).opacity === '0' && c.getBoundingClientRect().height === 0; };
    const fade = () => sleep(reducedMotion() ? 50 : 450);
    const played = [1, 2, 3].map(n => row(n).querySelector('.played').textContent);
    const rights = [1, 2].map(n => Math.round(row(n).querySelector('.played').getBoundingClientRect().right));
    const deletes = [1, 2, 3].map(n => getComputedStyle(del(n)).visibility);
    // The ✕ is inside the row's border box, at least 36px across, and the open
    // card is inverted whole (ink fill, paper text and paper dashed rule).
    const card = n => row(n).parentElement;
    const within = n => { const c = card(n).getBoundingClientRect(), d = del(n).getBoundingClientRect();
      return d.left >= c.left && d.right <= c.right && d.top >= c.top - 1 && d.bottom <= c.bottom + 1 && d.width >= 36; };
    const inside = within(1) && within(2);
    const cs = getComputedStyle(card(1)), plain = getComputedStyle(card(2));
    const inverted = cs.backgroundColor !== plain.backgroundColor && cs.backgroundColor === plain.color && cs.color !== plain.color;
    const ruleOpen = getComputedStyle(del(1)).borderLeftColor === cs.color;
    const labelled = del(2).getAttribute('aria-label') === 'delete';
    const shutFirst = shut(2);
    del(2).click();
    await fade();
    const opened = open(2);
    const words = [...ask(2).querySelectorAll('button')].map(b => b.textContent);
    ask(2).querySelector('.no').click();
    await fade();
    const backShut = shut(2);
    const kept = slotRaw(2) === otherRaw && row(2).querySelector('.played').textContent === '3h 12m';
    del(2).click();
    await fade();
    ask(2).querySelector('.yes').click();
    await fade();
    const gone = slotRaw(2) == null;
    const emptyRow = slotWords(row(2));
    const emptyPlayed = row(2).querySelector('.played').textContent;
    const noDelete = getComputedStyle(del(2)).visibility === 'hidden';
    const yesShut = shut(2);
    const crewBefore = state().crew;
    del(1).click();
    await fade();
    ask(1).querySelector('.yes').click();
    const fresh = state();
    const openRow = slotWords(row(1));
    resume();
    return [
      ok(/^\d+m$/.test(played[0]) && played[1] === '3h 12m' && played[2] === '',
         'each filled row says its playtime, short', JSON.stringify(played)),
      ok(rights[0] === rights[1], 'and the playtimes share a right edge', rights.join(', ')),
      ok(deletes[0] === 'visible' && deletes[1] === 'visible' && deletes[2] === 'hidden',
         'a filled row has a delete and an empty one does not', deletes.join(', ')),
      ok(inside && labelled, 'the ✕ sits inside the row\'s border, 36px wide, and is called delete', `${inside}, ${labelled}`),
      ok(inverted && ruleOpen && card(1).classList.contains('open'), 'the open row stays inverted, rule and all', `${cs.backgroundColor}, ${ruleOpen}`),
      ok(shutFirst && opened, 'delete fades a confirm open under its row', `${shutFirst}, ${opened}`),
      ok(words.join(',') === 'delete,back', 'which answers delete or back', words.join(',')),
      ok(backShut && kept, 'back fades it shut and the save is untouched', `${backShut}, ${kept}`),
      ok(gone && emptyRow === '2 · empty' && emptyPlayed === '' && noDelete && yesShut,
         'delete clears the slot, and its row reads empty', `${gone}, ${emptyRow}, '${emptyPlayed}', ${noDelete}, ${yesShut}`),
      ok(crewBefore > 0 && fresh.crew === 0 && fresh.beat.yard && /^1 · rock 1 · 0 crew · playing$/.test(openRow),
         'deleting the open slot is a new yard, as the reset was', `${crewBefore} -> ${fresh.crew}, ${openRow}`),
      ok(!document.getElementById('reset'), 'and there is no reset button'),
    ];
  }],

  // A real 390px glass: the saves page in a frame that wide. Whatever the
  // rows hold, the ✕ stays inside its card -- it never wraps to a line of its own.
  ['on a 390px phone no save row wraps its delete onto a line of its own', async () => {
    const f = document.createElement('iframe');
    f.src = './play.html?bench';
    f.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1';
    document.body.appendChild(f);
    try {
      const t0 = performance.now();
      const booted = () => { const x = f.contentWindow; return !!(x?.__scene && x.__reset && x.__fast && x.__crew); };
      while (!booted() && performance.now() - t0 < 20000) await sleep(50);
      if (!booted()) return [ok(false, 'the game boots in a 390px frame')];
      const w = f.contentWindow, d = f.contentDocument;
      w.__scene('savespage');
      await sleep(600);
      const list = d.getElementById('slots');
      const cards = [...list.querySelectorAll('.saverow')];
      const bad = cards.filter(c => {
        const cr = c.getBoundingClientRect(), dr = c.querySelector('.del').getBoundingClientRect();
        return !(dr.top >= cr.top - 1 && dr.bottom <= cr.bottom + 1 && dr.right <= cr.right + 1 && cr.right <= 390);
      });
      return [
        ok(w.innerWidth === 390 && cards.length > 0, 'the saves page is up on a 390px glass', `${w.innerWidth}px, ${cards.length} rows`),
        ok(bad.length === 0, 'and every ✕ is inside its card, none on a line of its own', `${bad.length} outside`),
      ];
    } finally { f.remove(); }
  }],

  // --- the toast (DESIGN.md, "a toast when one lands") -------------------------
  // The card is DOM and is stepped by the frame, not the sim: `run` turns the
  // game's clock and one `raf` is the frame that reads it.

  // The first notice, the way a player gets it: the crew and their pace are
  // setup; the earning is the click and the walk.
  ['a notice landing is said out loud, in the record\'s words', async () => {
    newRun();
    await settle();
    haveRock();
    window.__levels({ haulPaceLevel: 20, haulCarryLevel: 4 });
    window.__crew(0, 3);
    const b = boulderWorld();
    const [x, y] = onScreen(b.x, b.y);
    for (let i = 0; i < 12; i++) { point('pointerdown', x, y); point('pointerup', x, y); run(0.05); }
    runUntil(() => state().chips === 0, 20);
    const chipped = state().floor;
    const banked = runUntil(() => S.banked > 0, 120);
    run(1);                                     // the sampler asks twice a second
    await raf();
    const card = toastUp();
    // The opening lands a notice or two of its own before the grain (the
    // first hire), so what is up is whichever landed first, and the grain's
    // turn comes in the line.
    const first = Object.entries(S.wonAt).sort((a, b) => a[1] - b[1])[0]?.[0];
    const said = first && noticeFor(first);
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    const gone = toastUp();
    let grain = null;
    for (let i = 0; i < 6 && !grain; i++) {
      run(TOAST_GAP_MS / 1000 + 0.1);           // the next goes up
      await raf();
      if (toastUp()?.key === 'firstgrain') grain = toastUp();
      run(TOAST_MS / 1000 + 0.1);               // and comes down
      await raf();
    }
    const want = noticeFor('firstgrain');
    window.__crew(0, 0);
    return [
      ok(banked, 'a pebble reaches the hole', `floor ${chipped}, stored ${state().stored}, won ${S.won}`),
      ok(!!card && !!said && card.key === first && card.name === said.name && card.note === said.note,
         'and the card says the first to land, name and note', `${JSON.stringify(card)} vs ${first}`),
      ok(!gone, 'and it is gone after its time', JSON.stringify(gone)),
      ok(!!grain && grain.name === want.name && grain.note === want.note,
         'and the grain gets its turn, in the record\'s words', JSON.stringify(grain)),
    ];
  }],

  ['several landing at once are said one at a time', async () => {
    newRun();
    await settle();
    // three in one frame, the way a rock coming off lands three
    earn('rock0'); earn('ownhand'); earn('underminute');
    run(TOAST_GAP_MS / 1000 + 0.1);             // a new run starts the clock over; no gap is owed
    await raf();
    const one = toastUp();
    const waiting = toastWaiting();
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    const between = toastUp();
    run(TOAST_GAP_MS / 1000 + 0.1);
    await raf();
    const two = toastUp();
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    run(TOAST_GAP_MS / 1000 + 0.1);
    await raf();
    const three = toastUp();
    run(TOAST_MS / 1000 + 0.1);                 // and off, so the next group starts clean
    await raf();
    return [
      ok(!!one && one.name === noticeFor('rock0').name, 'the first goes up first', JSON.stringify(one)),
      ok(waiting === 2, 'and the other two wait', String(waiting)),
      ok(!between, 'there is a gap between two', JSON.stringify(between)),
      ok(!!two && two.name === noticeFor('ownhand').name, 'then the second', JSON.stringify(two)),
      ok(!!three && three.name === noticeFor('underminute').name, 'then the third', JSON.stringify(three)),
    ];
  }],

  ['pressing the card holds the game on the achievements page', async () => {
    newRun();
    await settle();
    earn('rock0');
    await raf();
    document.getElementById('toast').click();
    await raf();
    const up = !held().hidden && S.paused;
    const page = !document.getElementById('record').hidden
      && document.getElementById('recordbtn').hidden;
    const named = [...document.getElementById('record').querySelectorAll('.name')]
      .some(n => n.textContent === noticeFor('rock0').name);
    document.getElementById('recordback').click();
    resume();
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    return [
      ok(up, 'the sheet comes up and the game is held'),
      ok(page, 'turned to the achievements page', String(page)),
      ok(named, 'with the notice on it'),
    ];
  }],

  // What was earned before this sitting is on the sheet, not in the air: a
  // veteran save's catch-up and a save coming back both say nothing.
  ['a record that was already written is not said again', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);
    run(5);
    persist();
    earn('rock0', true);                       // the catch-up's quiet pass
    await raf();
    const quiet = toastUp();
    // the save out and back in, through the sheet, with a notice on it
    await press();
    const blob = exportSave();
    resume();
    run(TOAST_MS / 1000 + 0.1);
    await raf();
    newRun();
    await settle();
    await press();
    document.getElementById('loadsave').click();
    document.getElementById('pastebox').value = blob;
    document.getElementById('loadit').click();
    await sleep(100);
    const loaded = said();
    resume();
    run(1);
    await raf();
    const back = toastUp();
    const kept = S.won.includes('rock0');
    window.__crew(0, 0);
    return [
      ok(!quiet, 'a quiet earn puts no card up', JSON.stringify(quiet)),
      ok(kept, 'the save comes back with the notice on it', `${loaded}; ${S.won.join(',')}`),
      ok(!back, 'and says nothing about it', JSON.stringify(back)),
    ];
  }],

  // Readable text (readable.js), pressed on the graphics tab: the page turns
  // to the face in place and the face arrives, and pressed again it turns back.
  ['readable text turns the page to its face and back', async () => {
    newRun();
    await settle();
    await press();
    document.getElementById('settingsbtn').click();
    document.querySelector('#held .settabs button[data-tab="graphics"]').click();
    const btn = document.getElementById('readable');
    const face = () => getComputedStyle(document.body).fontFamily;
    try {
      btn.click();
      await document.fonts.ready;
      await raf();
      const on = { cls: document.documentElement.classList.contains('readable'), face: face(), said: btn.textContent,
                   kept: pref('readable'), loaded: document.fonts.check('14px "DM Mono"') };
      btn.click();
      await raf();
      const off = { cls: document.documentElement.classList.contains('readable'), face: face(), said: btn.textContent };
      return [
        ok(on.cls && on.kept && /DM Mono/.test(on.face) && on.said === msg('set-readable-on'),
           'pressed, the page is in the readable face and the switch says so', JSON.stringify(on)),
        ok(on.loaded, 'and the face itself arrived', JSON.stringify(on)),
        ok(!off.cls && !/DM Mono/.test(off.face) && off.said === msg('set-readable-off'),
           'pressed again, the house type is back', JSON.stringify(off)),
      ];
    } finally {
      setPref('readable', false);
      document.documentElement.classList.remove('readable');
      resume();
    }
  }],
];
