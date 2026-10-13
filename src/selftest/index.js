// The index on the held sheet (indexpage.js): opened by `i` and by the
// sheet's own word, the list only what has been met and grouped, a pick
// showing its words, and on a 390px phone the entry pushed over the list.
// What counts as met is test/index.test.mjs's.

import { sleep, raf, newRun, settle, ok, run } from './kit.js';
import { S } from '../state.js';
import { INDEX, GROUPS, GROUP_NAMES } from '../config/index.js';
import { metEntries } from '../met.js';
import { serpentOn } from '../snatch.js';

const held = () => document.getElementById('held');
const book = () => document.getElementById('index');
const key = async (k, code) => { dispatchEvent(new KeyboardEvent('keydown', { key: k, code, bubbles: true })); await raf(); };
const keyI = () => key('i', 'KeyI');
const esc = () => key('Escape', 'Escape');
const onIndex = () => !held().hidden && !book().hidden;
const listedKeys = () => [...book().querySelectorAll('.it')].map(b => b.dataset.key);
const heads = () => [...book().querySelectorAll('.list .grp')].map(g => g.textContent);

export const TESTS = [
  ['i opens the index: only what is met, grouped, and a pick shows its words', async () => {
    newRun();
    await settle();
    window.__crew(2, 2);                     // diggers met, and their house
    run(1);
    await keyI();
    const opened = onIndex() && S.paused;
    const want = metEntries(serpentOn()).map(e => e.key);
    const got = listedKeys();
    const wantHeads = GROUPS.filter(g => metEntries(serpentOn()).some(e => e.group === g)).map(g => GROUP_NAMES[g]);
    const unmet = INDEX.filter(e => !want.includes(e.key)).map(e => e.key);
    const pickBtn = book().querySelector('.it[data-key="rockhand"]');
    pickBtn?.click();
    await raf();
    const entry = book().querySelector('.entry');
    const text = entry?.querySelector('.text')?.textContent;
    const name = entry?.querySelector('.name')?.textContent;
    await esc();
    return [
      ok(opened, 'i holds the yard on the index page'),
      ok(got.join() === want.join(), 'the list is the met entries, in the book\'s order', got.join(',')),
      ok(!got.some(k => unmet.includes(k)) && !got.includes('muck'), 'nothing unmet is named'),
      ok(heads().join() === wantHeads.join(), 'grouped under the groups that have something',
         JSON.stringify(heads())),
      ok(!!pickBtn && name === 'diggers' && text === INDEX.find(e => e.key === 'rockhand').text,
         'picking diggers shows its name and words', `${name}: ${text}`),
      ok(held().hidden || !S.paused, 'escape closes it', `${S.paused}`),
    ];
  }],

  ['the held sheet\'s index word opens the same page, back turns back, and i again closes', async () => {
    newRun();
    await settle();
    await esc();
    const front = !document.getElementById('resume').hidden;
    const btn = document.getElementById('indexbtn');
    const onFront = !btn.hidden;
    btn.click();
    await raf();
    const turned = onIndex() && document.getElementById('resume').hidden && listedKeys().length > 0;
    document.getElementById('indexback').click();
    await raf();
    const backFront = !document.getElementById('resume').hidden && book().hidden;
    btn.click();
    await raf();
    await keyI();
    const closed = !S.paused;
    return [
      ok(front && onFront, 'the front carries the index word'),
      ok(turned, 'pressing it turns to the index'),
      ok(backFront, 'back turns to the front'),
      ok(closed, 'i on the index puts the sheet away'),
    ];
  }],

  // A real 390px glass (as touch.js does it): the game in a frame that wide,
  // staged so it never touches the save. The list is the page; a pick pushes
  // the entry over it, and the entry's back brings the list again.
  ['the index on a 390px phone: a pick pushes the entry over the list, and back returns', async () => {
    const f = document.createElement('iframe');
    f.src = './play.html?bench';
    f.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1';
    document.body.appendChild(f);
    try {
      const t0 = performance.now();
      const booted = () => { const x = f.contentWindow; return !!(x?.__reset && x.__fast && x.__crew); };
      while (!booted() && performance.now() - t0 < 20000) await sleep(50);
      const w = f.contentWindow, d = f.contentDocument;
      if (!booted()) return [ok(false, 'the game boots in a 390px frame')];
      w.__reset();
      w.__crew(2, 2);
      for (let i = 0; i < 60; i++) w.__fast(1 / 60);
      const frame = () => new Promise(r => w.requestAnimationFrame(() => r()));
      w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'i', code: 'KeyI', bubbles: true }));
      await frame();
      const ix = d.getElementById('index');
      const list = () => ix.querySelector('.list'), entry = () => ix.querySelector('.entry');
      const vis = el => !!el && el.getClientRects().length > 0 && w.getComputedStyle(el).display !== 'none';
      const listFirst = vis(list()) && !vis(entry());
      ix.querySelector('.it[data-key="rockhand"]')?.click();
      await frame();
      const pushed = !vis(list()) && vis(entry()) && entry().querySelector('.name')?.textContent === 'diggers';
      const pageBack = vis(d.getElementById('indexback'));
      ix.querySelector('.ixback')?.click();
      await frame();
      const back = vis(list()) && !vis(entry()) && !d.getElementById('held').hidden;
      return [
        ok(w.innerWidth === 390, 'a 390px glass', `${w.innerWidth}px`),
        ok(listFirst, 'the index opens on the list alone'),
        ok(pushed, 'a pick pushes its entry over the list'),
        ok(!pageBack, 'with one back on the page, the entry\'s own'),
        ok(back, 'and that back brings the list again, the sheet still up'),
      ];
    } finally { f.remove(); }
  }],

  ['the list is names only; the materials wear their coin marks on the entry, and an entry with no icon has no icon box', async () => {
    newRun();
    await settle();
    Object.assign(S, { seenShard: true, seenSpore: true, seenSpark: true });
    window.__crew(2, 2);
    run(1);
    await keyI();
    const out = [];
    const rows = [...book().querySelectorAll('.list .it')];
    out.push(ok(rows.length > 0 && rows.every(b => !b.querySelector('canvas, .mark, .pic')),
      'no list row carries a canvas, a coin mark or an icon box'));
    for (const k of ['dust', 'shard', 'spore', 'spark']) {
      book().querySelector(`.it[data-key="${k}"]`)?.click();
      await raf();
      const h = book().querySelector('.entry .head');
      out.push(ok(!!h?.querySelector(`.pic .mark i.${k}`) && !h.querySelector('canvas'),
        `${k} wears its coin mark on its entry`));
    }
    book().querySelector('.it[data-key="rockhand"]')?.click();
    await raf();
    const h = book().querySelector('.entry .head');
    out.push(ok(!!h && !h.querySelector('.pic, canvas, .mark') && !!h.firstElementChild?.querySelector('.name'),
      'an entry with no icon opens with no icon box, its name first'));
    await esc();
    return out;
  }],
];
