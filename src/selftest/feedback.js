// The feedback form says what it sends (DESIGN.md, "Feedback form", "Dev and
// checks"): reached the way a player reaches it -- a press at each button's
// own spot on the page, hit-tested, through settings to the button and the
// form -- on the held sheet, the landing page's column, the crashed sheet,
// and a phone's held sheet. The page cannot reach the worker's `handle`, so a
// scripted `fetch` takes the report and keeps what it was sent; what the
// worker does with it is feedback/test's, and what the request carries is
// the node tier's (test/feedback.test.mjs).

import { sleep, raf, newRun, settle, ok, run } from './kit.js';
import { S } from '../state.js';
import { pref, setPref } from '../prefs.js';
import { msg } from '../lang.js';
import { fatal } from '../crash.js';
import * as here from '../feedback.js';

const WORKER = 'http://feedback.test';
const WORDS = 'the crew all stand still by the quarry';

const until = async (fn, tries = 60) => {
  for (let i = 0; i < tries; i++) { if (fn()) return true; await sleep(50); }
  return !!fn();
};

// The worker, scripted: every report taken, and kept.
function worker() {
  const sent = [];
  const fetch = async (url, init = {}) => {
    sent.push({ url: String(url), method: init.method, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ id: sent.length, save: true }), { status: 201, headers: { 'content-type': 'application/json' } });
  };
  return { sent, fetch };
}

// What the last press that missed found in the way, for the check's detail.
let missed = '';

// A press where a player's would land: the middle of the button, and only if
// the button is what is there. A row under another, or off the page, is not
// pressed and says so.
function press(d, el) {
  if (!el) return false;
  el.scrollIntoView({ block: 'nearest' });
  const r = el.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const top = d.elementFromPoint(x, y);
  if (!top || !(top === el || el.contains(top))) {
    missed ||= `${el.id || el.className} at ${Math.round(x)},${Math.round(y)} under ${top ? top.id || top.className || top.tagName : 'nothing'}`;
    return false;
  }
  const win = d.defaultView;
  const at = { bubbles: true, clientX: x, clientY: y, pointerType: 'mouse', isPrimary: true };
  top.dispatchEvent(new win.PointerEvent('pointerdown', at));
  top.dispatchEvent(new win.PointerEvent('pointerup', at));
  top.click();
  return true;
}
// The held sheet up, escape's way, on its front with settings there to press:
// escape is a toggle, and a page that has just booted may be holding already.
async function holdSheet() {
  const held = document.getElementById('held');
  if (held.hidden) dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
  await until(() => !held.hidden && held.classList.contains('on'));
  document.getElementById('settingsback')?.click();
  missed = '';
  return until(() => document.getElementById('settingsbtn').getClientRects().length > 0);
}

// A finger on a sheet's handle, pulled up a good way and lifted: the sheet
// goes to its tall stop. Whether it moved.
async function pullUp(d, handle) {
  const win = d.defaultView;
  const r = handle.getBoundingClientRect();
  const x = r.left + r.width / 2;
  let y = r.top + r.height / 2;
  const top0 = handle.parentElement.getBoundingClientRect().top;
  const ev = (type, buttons = 1) => handle.dispatchEvent(new win.PointerEvent(type, {
    clientX: x, clientY: y, pointerId: 12, isPrimary: true, pointerType: 'touch', button: 0, buttons, bubbles: true }));
  ev('pointerdown');
  for (let i = 0; i < 12; i++) { await sleep(60); y -= 30; ev('pointermove'); }
  await sleep(150);
  ev('pointerup', 0);
  await sleep(400);
  return handle.parentElement.getBoundingClientRect().top < top0 - 20;
}

// Words into the box, as a keyboard leaves them.
function type(d, box, text) {
  box.focus();
  box.value = text;
  box.dispatchEvent(new d.defaultView.Event('input', { bubbles: true }));
}

// What the form shows, read as a player reads it.
function read(form) {
  const goes = form.querySelector('.goes');
  return {
    box: form.querySelector('textarea'),
    tick: form.querySelector('.tick'),
    send: form.querySelector('.send'),
    said: form.querySelector('.fb-said')?.textContent || '',
    where: form.querySelector('.fb-where')?.textContent || '',
    keys: [...(goes?.querySelectorAll('.v') || [])].map(v => v.dataset.key),
    values: [...(goes?.querySelectorAll('.v') || [])].map(v => v.textContent),
    save: goes?.querySelector('.v.save')?.textContent || '',
    shown: !!goes && goes.getClientRects().length > 0,
  };
}
// The request's keys, as the line names them.
const keysOf = body => Object.entries(body).flatMap(([k, v]) => (k === 'meta' ? Object.keys(v).map(m => `meta.${m}`) : [k]));

// The walk through one form, from the box to the sent line: type, the line
// without the save; tick, the line with it; send, what was sent.
async function walkForm(d, form, stub, reached = {}) {
  const out = {};
  if (!form.querySelector('.send')) throw new Error(`no form to walk: ${JSON.stringify(reached)} ${missed}`);
  let f = read(form);
  out.sendGrey = f.send.disabled;
  out.tickOff = f.tick.getAttribute('aria-checked') === 'false';
  type(d, f.box, WORDS);
  await until(() => !read(form).tick.disabled);
  f = read(form);
  out.before = f;
  out.sendLive = !f.send.disabled;
  out.ticked = press(d, f.tick);
  await raf();
  f = read(form);
  out.after = f;
  out.tickOn = f.tick.getAttribute('aria-checked') === 'true';
  out.sent = press(d, f.send);
  await until(() => read(form).said === msg('fb-sent'));
  out.done = read(form);
  out.body = stub.sent[0]?.body;
  out.calls = stub.sent.length;
  return out;
}

// The checks a walk answers, the same on every page.
function said(o, where) {
  const b = o.body || {};
  return [
    ok(o.tickOff && o.sendGrey, `${where}: the tick off as the form opens, send grey while the box is empty`),
    ok(o.sendLive, `${where}: words make send live`),
    ok(o.before.shown && !o.before.keys.includes('save') && o.before.keys[0] === 'text', `${where}: the line lists the words and the facts, no save before the tick`, o.before.keys.join(',')),
    ok(o.ticked && o.tickOn, `${where}: the tick, pressed, is on`),
    ok(o.after.keys.at(-1) === 'save' && /\d+ KB$/.test(o.after.save), `${where}: the line gains the save and its size`, o.after.save),
    ok(o.sent && o.calls === 1, `${where}: send, pressed, sends once`, String(o.calls)),
    ok(b.text === WORDS && typeof b.save === 'string' && b.save.length > 0, `${where}: the words and the save went`),
    ok(keysOf(b).join(',') === o.after.keys.join(','), `${where}: the line listed exactly what went`, `${keysOf(b).join(',')} vs ${o.after.keys.join(',')}`),
    ok(o.after.values.includes(b.meta?.version) && o.after.values.includes(b.meta?.lang), `${where}: in the real values`, o.after.values.join(' | ')),
    ok(o.done.said === msg('fb-sent') && o.done.where && !o.done.shown, `${where}: the sent state, the box and the line gone`, o.done.said),
  ];
}

// A page in a frame, its own copy of the form's module pointed at the
// scripted worker. Out of sight but hit-testable. This page's own autosave is
// held for the visit, as the landing page's check holds it.
async function framed(src, { width = 960, height = 600 } = {}) {
  const wasStaged = S.staged;
  S.staged = true;
  const f = document.createElement('iframe');
  f.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;opacity:0;z-index:99;border:0`;
  document.body.appendChild(f);
  const loaded = new Promise(r => f.addEventListener('load', r, { once: true }));
  f.src = src;
  await loaded;
  const d = f.contentDocument, w = f.contentWindow;
  // By the URL the page loaded it under: once a file has been edited the dev
  // server stamps it, and the bare path would be a second instance.
  const loadedAs = name => w.performance.getEntriesByType('resource')
    .map(e => e.name).filter(u => new URL(u).pathname === `/src/${name}.js`).pop() || `/src/${name}.js`;
  await until(() => w.performance.getEntriesByType('resource').some(e => new URL(e.name).pathname === '/src/feedback.js'), 80);
  const mod = await w.eval(`import(${JSON.stringify(loadedAs('feedback'))})`);
  const stub = worker();
  mod.setFeedbackUrl(WORKER);
  mod.setFeedbackFetch(stub.fetch);
  const done = () => { f.remove(); S.staged = wasStaged; };
  return { f, d, w, stub, done };
}

export const TESTS = [
  ['the feedback form says what it sends: the held sheet, settings to the form and back', async () => {
    newRun();
    await settle();
    const draft = pref('feedbackDraft');
    setPref('feedbackDraft', '');
    const stub = worker();
    here.setFeedbackUrl(WORKER);
    here.setFeedbackFetch(stub.fetch);
    let o = null, reached = {}, back = false;
    try {
      reached.held = await holdSheet();
      reached.settings = press(document, document.getElementById('settingsbtn'));
      await raf();
      // A window short enough seats the sheet from the bottom, as a phone's:
      // pulled up to its tall stop, the rows under the fold come into reach.
      if (document.getElementById('held').classList.contains('bottom')) reached.tall = await pullUp(document, document.getElementById('heldhandle'));
      const btn = document.getElementById('fbbtn');
      reached.under = btn.compareDocumentPosition(document.getElementById('controlsbtn')) & Node.DOCUMENT_POSITION_PRECEDING;
      reached.button = press(document, btn);
      await raf();
      reached.page = !document.getElementById('fbform').hidden && document.getElementById('motion').hidden;
      o = await walkForm(document, document.getElementById('fbform'), stub, reached);
      back = press(document, document.getElementById('fbback'));
      await raf();
      back = back && !document.getElementById('motion').hidden && document.getElementById('fbform').hidden;
    } finally {
      here.setFeedbackUrl('');
      here.setFeedbackFetch(null);
      setPref('feedbackDraft', draft);
      document.getElementById('resume')?.click();
      await raf();
    }
    return [
      ok(reached.settings && reached.button && reached.under, 'settings, then the button under controls', JSON.stringify(reached)),
      ok(reached.page, 'the button opens a page of its own'),
      ...said(o, 'held sheet'),
      ok(o.body.meta.page === 'game' && !('fatal' in o.body.meta), 'held sheet: the page is the game, and no crash line'),
      ok(back, 'back turns to the settings'),
    ];
  }],

  ['the feedback form says what it sends: no button where the build has no worker', async () => {
    newRun();
    await settle();
    here.setFeedbackUrl('');
    await holdSheet();
    document.getElementById('settingsbtn').click();
    await raf();
    const shown = document.getElementById('fbbtn').getClientRects().length > 0;
    document.getElementById('settingsback').click();
    document.getElementById('resume')?.click();
    await raf();
    return [ok(!shown, 'settings has no feedback button')];
  }],

  ['the feedback form says what it sends: the landing page\'s column, and the yard named', async () => {
    newRun();
    await settle();
    const draft = pref('feedbackDraft');
    setPref('feedbackDraft', '');
    const { d, stub, done } = await framed('index.html');
    let o = null, reached = {}, yard = '';
    try {
      await until(() => d.getElementById('playlabel').textContent);
      reached.settings = press(d, d.getElementById('settingsbtn'));
      reached.button = press(d, d.getElementById('fbbtn'));
      reached.page = !d.getElementById('fbform').hidden;
      o = await walkForm(d, d.getElementById('fbform'), stub, reached);
      yard = o.after.save;
      reached.back = press(d, d.getElementById('fbback')) && !d.getElementById('motion').hidden;
    } finally {
      done();
      setPref('feedbackDraft', draft);
    }
    return [
      ok(reached.settings && reached.button && reached.page && reached.back, 'landing: settings, the button, the page, and back', JSON.stringify(reached)),
      ...said(o, 'landing'),
      ok(/rock \d+ · \d+ crew · \d+ KB/.test(yard), 'landing: the save is named as the saves rows name a yard', yard),
      ok(o.body.meta.page === 'title', 'landing: the page is the title'),
    ];
  }],

  ['the feedback form says what it sends: the crashed sheet, with the crash\'s line', async () => {
    newRun();
    await settle();
    window.__crew(1, 1);
    run(5);
    const draft = pref('feedbackDraft');
    setPref('feedbackDraft', '');
    const stub = worker();
    here.setFeedbackUrl(WORKER);
    here.setFeedbackFetch(stub.fetch);
    const sheet = document.getElementById('crashed');
    const btn = document.getElementById('crashfb');
    const form = document.getElementById('crashform');
    let o = null, reached = {}, line = [];
    try {
      fatal(new Error('the yard fell over'));
      reached.up = await until(() => !btn.hidden);
      reached.under = !!(btn.compareDocumentPosition(document.getElementById('copysave')) & Node.DOCUMENT_POSITION_PRECEDING);
      reached.button = press(document, btn);
      reached.open = await until(() => form.querySelector('.goes'));
      reached.ask = form.querySelector('.fb-ask')?.textContent === msg('crashed-fb-ask');
      line = read(form).values;
      o = await walkForm(document, form, stub);
    } finally {
      here.setFeedbackUrl('');
      here.setFeedbackFetch(null);
      setPref('feedbackDraft', draft);
      // put back, so the groups after this one have a live page
      S.fatal = '';
      sheet.hidden = true;
      btn.hidden = true;
      form.hidden = true;
      form.textContent = '';
      window.__crew(0, 0);
    }
    return [
      ok(reached.up && reached.under && reached.button && reached.open, 'the crashed sheet: a button under copy save opens the form in place', JSON.stringify(reached)),
      ok(reached.ask, 'with the sheet\'s line asking for the save'),
      ok(line.some(v => /the yard fell over/.test(v)), 'the crash\'s first line is on the line', line.join(' | ')),
      ...said(o, 'crashed sheet'),
      ok(/the yard fell over/.test(o.body.meta.fatal || '') && o.body.meta.page === 'crashed', 'crashed sheet: and it went', o.body.meta.fatal),
    ];
  }],

  ['the feedback form says what it sends: a phone\'s held sheet, nothing off its side', async () => {
    newRun();
    await settle();
    const draft = pref('feedbackDraft');
    setPref('feedbackDraft', '');
    const { d, w, stub, done } = await framed('play.html', { width: 375, height: 740 });
    let o = null, reached = {}, wide = [], scroll = '';
    try {
      await until(() => w.__state);
      // A thumb, as a phone reports one: the frame's own say, never written
      // to the preferences the pages share.
      w.__coarse(true);
      w.dispatchEvent(new w.Event('resize'));
      await sleep(50);
      w.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
      await sleep(150);
      reached.settings = press(d, d.getElementById('settingsbtn'));
      await sleep(50);
      // A thumb pulls the sheet up to its tall stop, and the rows under the
      // fold scroll into reach inside it.
      reached.tall = await pullUp(d, d.getElementById('heldhandle'));
      const btn = d.getElementById('fbbtn');
      reached.button = press(d, btn);
      if (!reached.button) {
        const r = btn.getBoundingClientRect();
        reached.at = `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} under ${d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.id || d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.className}`;
        return [ok(false, 'phone: the button can be pressed', JSON.stringify(reached))];
      }
      await sleep(50);
      const form = d.getElementById('fbform');
      // send is under the box; the sheet scrolls to it as a thumb would
      form.querySelector('.send').scrollIntoView({ block: 'nearest' });
      wide = [...d.getElementById('held').querySelectorAll('*')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width && (r.right > 375.5 || r.left < -0.5);
      }).map(e => e.className || e.tagName);
      const sc = d.scrollingElement;
      scroll = `${sc.scrollWidth}/${sc.clientWidth}`;
      o = await walkForm(d, form, stub);
    } finally {
      done();
      setPref('feedbackDraft', draft);
    }
    const [sw, cw] = scroll.split('/').map(Number);
    return [
      ok(reached.settings && reached.button, 'phone: settings and the button, pressed where they stand', JSON.stringify(reached)),
      ok(wide.length === 0, 'phone: nothing on the sheet stands past the screen\'s sides', wide.join(', ')),
      ok(sw <= cw, 'phone: no sideways scroll', scroll),
      ...said(o, 'phone'),
    ];
  }],
];
