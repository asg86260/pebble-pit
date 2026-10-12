// The held sheet as the settings sheet: what is on it, in what order, and
// whether each thing on it does what it says. The sheet is DOM, the switch
// is a button, the save goes through a textarea; the preference store itself
// is checked in test/settings.test.mjs.

import { sleep, raf, newRun, settle, state, ok, run, runUntil, board, haveRock,
         boulderWorld, onScreen, point } from './kit.js';
import { pref, setPref, reducedMotion, coarse, dark } from '../prefs.js';
import { setSlot, storeSettled, clear, slotRaw, writeSlot } from '../save.js';
import { S } from '../state.js';
import { version } from '../version.js';
import { persist, exportSave, claimSave } from '../persist.js';
import { earn, noticeFor } from '../notices.js';
import { toastUp, toastWaiting } from '../toast.js';
import { TOAST_MS, TOAST_GAP_MS, SHEET_FADE_MS } from '../config.js';

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
const lines = () => [...held().children]
  .filter(el => !el.hidden && !(el.classList.contains('said') && !el.textContent))
  .map(el => el.id === 'recordbtn' ? 'achievements'
           : el.id === 'slotsbtn' ? 'saves'
           : el.id === 'indexbtn' ? 'index'
           : el.textContent.replace(/\s+/g, ' ').trim());

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
        .filter(el => el.matches('button, input, .pair, .saves, .paste, .record') && el.getBoundingClientRect().width)
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

  ['the landing page opens the controls page and turns back to the settings', async () => {
    newRun();
    await settle();
    const wasStaged = S.staged;
    S.staged = true;
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;visibility:hidden';
    document.body.appendChild(f);
    let list = [], page = [], settingsGone = false, backOnSettings = false, fits = false;
    try {
      const loaded = new Promise(r => f.addEventListener('load', r, { once: true }));
      f.src = 'index.html';
      await loaded;
      const d = f.contentDocument;
      for (let i = 0; i < 40 && !d.getElementById('playlabel').textContent; i++) await sleep(50);
      d.getElementById('settingsbtn').click();
      d.getElementById('controlsbtn').click();
      page = [...d.querySelectorAll('.col > :not([hidden])')].map(el => el.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
      list = [...d.querySelectorAll('#controlslist span')].map(el => el.textContent);
      settingsGone = d.getElementById('motion').hidden;
      const col = d.querySelector('.col').getBoundingClientRect();
      const cl = d.getElementById('controlslist');
      fits = col.right <= 960 && cl.scrollWidth <= cl.clientWidth + 1;
      d.getElementById('controlsback').click();
      backOnSettings = !d.getElementById('motion').hidden && cl.hidden;
    } finally {
      f.remove();
      S.staged = wasStaged;
    }
    return [
      ok(page.includes('controls') && page[page.length - 1] === 'back', 'the page has its word and back', JSON.stringify(page)),
      ok(settingsGone, 'and the settings are not on it'),
      ok(list.length === 14 && list[0] === 'left click' && list[12] === '1 \u2013 9' && list[13] === 'jump to a place',
        'the same rows as the held sheet', JSON.stringify(list)),
      ok(fits, 'and the column grows to hold them'),
      ok(backOnSettings, 'back turns to the settings'),
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
      'return to title',
      'esc holds · ← → look about · hold space to skip a scene',
      version(),
    ];
    settingsPage();
    const page = lines();
    const wantPage = [
      'settings',
      'motion: ' + (reducedMotion() ? 'less' : 'full'),
      'touch: ' + (coarse() ? 'on' : 'off'),  // the thumb switch -- see prefs.js
      'dark: ' + (dark() ? 'on' : 'off'),     // the page turned over -- see ink.js
      // the whole screen, where the platform can give it -- see fullscreen.js
      ...(document.fullscreenEnabled || document.webkitFullscreenEnabled ? ['fullscreen: off'] : []),
      'sound: on',                            // the mute, which remembers -- see audio.js
      '',                                     // the volume: a slider has no words
      'controls',                             // the page of mouse buttons
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

  ['the controls page lists the mouse and turns back to the settings', async () => {
    newRun();
    await settle();
    await press();
    settingsPage();
    document.getElementById('controlsbtn').click();
    const page = lines();
    const list = [...document.querySelectorAll('#controlslist span')].map(el => el.textContent);
    const settingsGone = document.getElementById('motion').hidden;
    document.getElementById('controlsback').click();
    const backOnSettings = !document.getElementById('motion').hidden && document.getElementById('controlslist').hidden;
    return [
      ok(page[0] === 'controls' && page.length === 3 && page[2] === 'back', 'the page has its word and back', JSON.stringify(page)),
      ok(settingsGone, 'and the settings are not on it'),
      ok(list.join('|') === ['left click', 'interact', 'right click', 'focus workers',
        'right click + left click', 'pick up workers', 'middle click', 'move camera',
        'scroll wheel', 'move camera', '← → / a d', 'move camera', '1 – 9', 'jump to a place'].join('|'),
        'seven rows, input then action, in order', JSON.stringify(list)),
      ok(backOnSettings, 'back turns to the settings'),
    ];
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
    setPref('motion', null);
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
];
