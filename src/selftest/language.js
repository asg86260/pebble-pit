// The language tab (DESIGN.md, "Localization phase two", section 1; the
// settings' tabs, settingstabs.js): a tab of each settings page lists the
// languages, each in its own name, the one in force inverted; a pick writes
// the choice and the page comes back in it. Both pages are walked in a frame of their own, so the
// reload a pick costs is a real one, watched as the frame's `load`, and the
// page that comes back is asked what language it is in. The choice is put
// back as it was afterward: the frames share this page's store.

import { ok, raf, sleep, newRun, settle } from './kit.js';
import { S } from '../state.js';
import { pref, setPref } from '../prefs.js';
import { offered } from '../langpage.js';
import { turnTab } from '../settingstabs.js';

// A frame of `src`, sized like a desk window and out of sight, and its load.
function frame(src) {
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:0;top:0;width:960px;height:600px;visibility:hidden';
  document.body.appendChild(f);
  const loaded = () => new Promise(r => f.addEventListener('load', r, { once: true }));
  const first = loaded();
  f.src = src;
  return { f, first, loaded };
}

// What the page offers, read as a player reads it: the names in order, the
// tags they carry, and which are inverted.
const listOf = d => [...d.querySelectorAll('#langlist button')].map(b => ({
  name: b.textContent, lang: b.getAttribute('lang'), on: b.classList.contains('on'), shown: b.getClientRects().length > 0 }));
const want = () => offered().map(r => r.name).join('|');
// Another language than the one in force, to pick.
const other = code => offered().find(r => r.code !== code)?.code;

// Whether a thing stands on the glass, its tab in force.
const seen = el => !!el && !el.hidden && el.getClientRects().length > 0 && el.ownerDocument.defaultView.getComputedStyle(el).visibility === 'visible';
const tab = (d, name) => d.querySelector(`.settabs button[data-tab="${name}"]`);

// The run, both pages: the language tab, clicked, shows the languages and
// no other tab's rows; it lists every language offered, each tagged, the one
// in force alone inverted; another tab hides them again; a pick of another
// reloads the page in it.
async function walk(d, f, loaded) {
  const out = {};
  const here = d.documentElement.lang;
  d.getElementById('settingsbtn').click();
  tab(d, 'language').click();
  out.page = seen(d.getElementById('langlist')) && !seen(d.getElementById('motion'));
  out.list = listOf(d);
  out.here = here;
  tab(d, 'graphics').click();
  out.back = seen(d.getElementById('motion')) && !seen(d.getElementById('langlist'));
  tab(d, 'language').click();
  const pick = other(here);
  out.pick = pick;
  const again = loaded();
  [...d.querySelectorAll('#langlist button')].find(b => b.getAttribute('lang') === pick)?.click();
  out.chosen = pref('language') === pick || JSON.parse(localStorage.getItem('boulder-clicker/prefs') || '{}').language === pick;
  out.reloaded = await Promise.race([again.then(() => true), sleep(6000).then(() => false)]);
  // The page's `load` does not wait for its modules' top-level awaits, and
  // lang.js awaits the language's file before it writes the page's tag.
  for (let i = 0; i < 60 && f.contentDocument?.documentElement.lang !== pick; i++) await sleep(50);
  out.after = f.contentDocument?.documentElement.lang;
  return out;
}

// The checks a walk answers, the same on both pages.
function said(o, where) {
  const ons = o.list.filter(r => r.on);
  return [
    ok(o.page, `${where}: the language tab shows the languages, the other tabs' rows gone`),
    ok(o.list.map(r => r.name).join('|') === want() && o.list.every(r => r.shown),
       `${where}: a button a language offered, each in its own name`, JSON.stringify(o.list.map(r => r.name))),
    ok(o.list.every((r, i) => r.lang === offered()[i].code), `${where}: each tagged with its language`, o.list.map(r => r.lang).join(' ')),
    ok(ons.length === 1 && ons[0].lang === o.here, `${where}: the one in force, alone, inverted`, `${o.here}: ${ons.map(r => r.lang)}`),
    ok(o.back, `${where}: another tab hides them again`),
    ok(!!o.pick && o.chosen, `${where}: a pick writes the choice`, o.pick),
    ok(o.reloaded && o.after === o.pick, `${where}: and the page comes back in it`, `${o.reloaded} ${o.after}`),
  ];
}

export const TESTS = [
  ['the language tab on the held sheet: opened, read, left and picked from', async () => {
    newRun();
    await settle();
    const was = pref('language');
    const wasStaged = S.staged;
    S.staged = true;                               // this page's own save held, as the landing checks hold it
    const { f, first, loaded } = frame('play.html');
    let o;
    try {
      await first;
      const w = f.contentWindow, d = f.contentDocument;
      for (let i = 0; i < 80 && !w.__state; i++) await sleep(50);
      w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      await sleep(100);
      o = await walk(d, f, loaded);
    } finally {
      f.remove();
      S.staged = wasStaged;
      setPref('language', was);
    }
    return said(o, 'held sheet');
  }],

  ['the language tab on the landing page, and the foot names the language in force', async () => {
    newRun();
    await settle();
    const was = pref('language');
    const wasStaged = S.staged;
    S.staged = true;
    const { f, first, loaded } = frame('index.html');
    let o, foot = '', footOpens = false;
    try {
      await first;
      const d = f.contentDocument;
      for (let i = 0; i < 40 && !d.getElementById('playlabel').textContent; i++) await sleep(50);
      const here = d.documentElement.lang;
      const link = d.getElementById('langfoot');
      foot = `${link.textContent} ${link.getAttribute('lang')}`;
      tab(d, 'graphics').click();               // another tab in force, so the foot has to turn it
      d.getElementById('settingsback').click();
      footOpens = (link.click(), seen(d.getElementById('langlist')) && !!d.querySelector('#langlist button.on')
        && tab(d, 'language').classList.contains('on'));
      d.getElementById('settingsback').click();
      o = await walk(d, f, loaded);
      foot = { foot, want: `${offered().find(r => r.code === here)?.name} ${here}` };
    } finally {
      f.remove();
      S.staged = wasStaged;
      setPref('language', was);
    }
    return [
      ok(foot.foot === foot.want, 'landing page: the foot names the language in force, in its own name', JSON.stringify(foot)),
      ok(footOpens, 'landing page: and pressing it opens the settings on the language tab'),
      ...said(o, 'landing page'),
    ];
  }],

  // The pad, on the held sheet: A opens settings, RB turns to the language
  // tab, the d-pad walks the names, B turns back to the front, and A on the
  // one in force writes it and stays, without a reload.
  ['the language tab with a pad: reached, walked, backed out of', async () => {
    const BUTTONS = { a: 0, b: 1, lb: 4, rb: 5, menu: 9, up: 12, down: 13 };
    const fake = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', connected: true, mapping: 'standard',
                   buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })), axes: [0, 0, 0, 0] };
    const own = Object.getOwnPropertyDescriptor(navigator, 'getGamepads');
    const frames = async n => { for (let i = 0; i < n; i++) await raf(); };
    const press = async name => {
      const b = fake.buttons[BUTTONS[name]];
      b.pressed = true; b.value = 1; await frames(2);
      b.pressed = false; b.value = 0; await frames(2);
    };
    const page = () => window.__pad.page();
    const steps = [];
    const walkTo = async (test, dir = 'down') => {
      for (let i = 0; i < 16 && !test(page()); i++) { await press(dir); steps.push(page()?.id || page()?.dataset?.lang || page()?.tagName); }
      return test(page());
    };
    const was = pref('language');
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [fake] });
    window.__motion(true);
    const out = {};
    try {
      await press('b');
      await press('menu');
      await frames(3);
      out.toSettings = await walkTo(el => el?.id === 'settingsbtn');
      await press('a');
      // RB until the language tab is in force, the focus on its first name
      for (let i = 0; i < 4 && !page()?.closest('#langlist'); i++) await press('rb');
      out.toRow = !!page()?.closest('#langlist');
      out.opened = seen(document.getElementById('langlist')) && !seen(document.getElementById('motion'));
      out.onList = out.toRow;
      const from = page();
      await press('down');
      out.walked = page() !== from && !!page()?.closest('#langlist');
      await press('b');
      out.backed = !document.getElementById('settingsbtn').hidden && document.querySelector('#held .settabs').hidden;
      out.toRowAgain = await walkTo(el => el?.id === 'settingsbtn', 'up') || await walkTo(el => el?.id === 'settingsbtn');
      await press('a');
      await frames(2);
      const inForceRow = el => el?.classList.contains('on') && !!el.closest('#langlist');
      out.toForce = await walkTo(inForceRow) || await walkTo(inForceRow, 'up');
      await press('a');
      out.stayed = seen(document.getElementById('langlist')) && pref('language') === document.documentElement.lang;
      await press('b');
      await press('b');
    } finally {
      window.__pad.off();
      if (own) Object.defineProperty(navigator, 'getGamepads', own); else delete navigator.getGamepads;
      window.__motion(null);
      setPref('language', was);
      turnTab('graphics');
    }
    return [
      ok(out.toSettings && out.toRow, 'RB reaches the language tab, the focus on a name', JSON.stringify(out) + ' ' + steps.join(',')),
      ok(out.opened && out.onList, 'its names shown, the other tabs\' rows gone'),
      ok(out.walked, 'the d-pad walks the names'),
      ok(out.backed, 'B turns back to the front'),
      ok(out.toForce && out.stayed, 'A on the one in force keeps it and stays on the tab, no reload'),
    ];
  }],
];
