// The feedback form is a box, a tick and send (DESIGN.md, "Feedback form",
// "Dev and checks"): reached the way a player reaches it -- a press at each
// button's own spot on the page, hit-tested, to the button and the form --
// on the held sheet's pause page, the landing page's settings column, the
// crashed sheet, and a phone's held sheet. The page cannot reach the
// worker's `handle`, so a scripted `fetch` takes the report and keeps what it was sent; what the
// worker does with it is feedback/test's, and what the request carries is
// the node tier's (test/feedback.test.mjs).

import { sleep, raf, newRun, settle, ok, run } from './kit.js';
import { S } from '../state.js';
import { pref, setPref } from '../prefs.js';
import { msg } from '../lang.js';
import { fatal } from '../crash.js';
import * as here from '../feedback.js';
import { mountFeedback } from '../feedbackform.js';
import { persist, claimSave } from '../persist.js';
import { storeSettled } from '../save.js';

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

// Whether the feedback button stands directly under settings on the pause
// page: the next thing drawn after it, nothing between.
function underSettings(d) {
  const drawn = [...d.getElementById('held').children].filter(e => e.getClientRects().length > 0);
  return drawn.indexOf(d.getElementById('fbbtn')) === drawn.indexOf(d.getElementById('settingsbtn')) + 1
    && drawn.indexOf(d.getElementById('settingsbtn')) >= 0;
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

// The form's parts a player can see, by name, top to bottom: anything drawn
// with height or words, so an empty said line is not one.
const PART = { 'fb-ask': 'ask', 'fb-box': 'box', tick: 'tick', send: 'send', 'fb-said': 'said', 'fb-where': 'where' };
const partsOf = form => [...form.children]
  .filter(e => e.getClientRects().length > 0 && e.getBoundingClientRect().height > 0)
  .map(e => Object.entries(PART).find(([c]) => e.classList.contains(c))?.[1] || e.className || e.tagName);

// What the form shows, read as a player reads it.
function read(form) {
  return {
    box: form.querySelector('textarea'),
    tick: form.querySelector('.tick'),
    send: form.querySelector('.send'),
    said: form.querySelector('.fb-said')?.textContent || '',
    where: form.querySelector('.fb-where')?.textContent || '',
    parts: partsOf(form),
  };
}
// The request's keys, the facts by name.
const keysOf = body => Object.entries(body).flatMap(([k, v]) => (k === 'meta' ? Object.keys(v).map(m => `meta.${m}`) : [k]));
const FACTS = ['version', 'target', 'shell', 'os', 'lang', 'page'].map(m => `meta.${m}`);

// The walk through one form, from the box to the sent line: type, tick,
// send, and what was sent.
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

// The checks a walk answers, the same on every page. `ask` is whether the
// crashed sheet's line stands over the box.
function said(o, where, { ask = false } = {}) {
  const b = o.body || {};
  const form = [...(ask ? ['ask'] : []), 'box', 'tick', 'send'].join(',');
  const want = ['text', ...FACTS, ...(b.meta?.page === 'crashed' ? ['meta.fatal'] : []), 'save'].join(',');
  return [
    ok(o.tickOff && o.sendGrey, `${where}: the tick off as the form opens, send grey while the box is empty`),
    ok(o.before.parts.join(',') === form && o.after.parts.join(',') === form,
      `${where}: the box, the tick and send, and nothing under them`, `${o.before.parts.join(',')} / ${o.after.parts.join(',')}`),
    ok(o.sendLive, `${where}: words make send live`),
    ok(o.ticked && o.tickOn, `${where}: the tick, pressed, is on`),
    ok(o.sent && o.calls === 1, `${where}: send, pressed, sends once`, String(o.calls)),
    ok(b.text === WORDS && typeof b.save === 'string' && b.save.length > 0, `${where}: the words and the save went`),
    ok(keysOf(b).join(',') === want, `${where}: the words, the facts and the save, and nothing else`, `${keysOf(b).join(',')} vs ${want}`),
    ok(o.done.said === msg('fb-sent') && o.done.where && o.done.parts.join(',') === 'said,where',
      `${where}: the sent state, the box, the tick and send gone`, o.done.parts.join(',')),
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
  ['the feedback form is a box, a tick and send: the held sheet, the pause page to the form and back', async () => {
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
      // A window short enough seats the sheet from the bottom, as a phone's:
      // pulled up to its tall stop, the rows under the fold come into reach.
      if (document.getElementById('held').classList.contains('bottom')) reached.tall = await pullUp(document, document.getElementById('heldhandle'));
      const btn = document.getElementById('fbbtn');
      reached.under = underSettings(document);
      reached.button = press(document, btn);
      await raf();
      reached.page = !document.getElementById('fbform').hidden && document.getElementById('settingsbtn').hidden;
      o = await walkForm(document, document.getElementById('fbform'), stub, reached);
      back = press(document, document.getElementById('fbback'));
      await raf();
      back = back && !document.getElementById('settingsbtn').hidden && !document.getElementById('resume').hidden && document.getElementById('fbform').hidden;
    } finally {
      here.setFeedbackUrl('');
      here.setFeedbackFetch(null);
      setPref('feedbackDraft', draft);
      document.getElementById('resume')?.click();
      await raf();
    }
    return [
      ok(reached.held && reached.button && reached.under, 'the pause page, the button directly under settings', JSON.stringify(reached)),
      ok(reached.page, 'the button opens a page of its own'),
      ...said(o, 'held sheet'),
      ok(o.body.meta.page === 'game' && !('fatal' in o.body.meta), 'held sheet: the page is the game, and no crash line'),
      ok(back, 'back turns to the pause page'),
    ];
  }],

  ['the feedback form is a box, a tick and send: no button where the build has no worker', async () => {
    newRun();
    await settle();
    here.setFeedbackUrl('');
    await holdSheet();
    const shown = document.getElementById('fbbtn').getClientRects().length > 0;
    document.getElementById('resume')?.click();
    await raf();
    return [ok(!shown, 'the pause page has no feedback button')];
  }],

  // An empty slot is the setup, not what is checked: the form is mounted on
  // a blob of nothing, and the tick is pressed where a player would press it.
  ['the feedback form is a box, a tick and send: no save, the tick grey and nothing ticked goes', async () => {
    newRun();
    await settle();
    const draft = pref('feedbackDraft');
    setPref('feedbackDraft', '');
    const stub = worker();
    here.setFeedbackUrl(WORKER);
    here.setFeedbackFetch(stub.fetch);
    const el = document.createElement('div');
    el.className = 'paste feedback';
    el.style.cssText = 'position:fixed;left:0;top:0;width:420px;z-index:99;background:#fff';
    document.body.appendChild(el);
    let o = {};
    missed = '';
    try {
      const form = mountFeedback(el, { page: 'game', raw: () => '' });
      await form.ready;
      await raf();
      const f = read(el);
      o.grey = f.tick.disabled;
      type(document, f.box, WORDS);
      await raf();
      o.pressed = press(document, read(el).tick);
      await raf();
      o.off = read(el).tick.getAttribute('aria-checked') === 'false';
      o.parts = read(el).parts.join(',');
      o.sent = press(document, read(el).send);
      await until(() => stub.sent.length > 0);
      o.body = stub.sent[0]?.body || {};
    } finally {
      el.remove();
      here.setFeedbackUrl('');
      here.setFeedbackFetch(null);
      setPref('feedbackDraft', draft);
    }
    return [
      ok(o.grey, 'no save: the tick is grey'),
      ok(o.pressed && o.off, 'and pressed, it stays off', missed),
      ok(o.parts === 'box,tick,send', 'the box, the tick and send, and nothing saying why', o.parts),
      ok(o.sent && keysOf(o.body).join(',') === ['text', ...FACTS].join(','), 'send carries the words and the facts, no save', keysOf(o.body).join(',')),
    ];
  }],

  ['the feedback form is a box, a tick and send: the landing page\'s column', async () => {
    newRun();
    await settle();
    // The open slot holds this yard before the page reads it, whatever the
    // groups before this one left there (a frame that played the game holds
    // the save's claim; it is taken back first): the tick has a save to offer.
    claimSave();
    S.yielded = false;
    persist();
    await storeSettled();
    const draft = pref('feedbackDraft');
    setPref('feedbackDraft', '');
    const { d, stub, done } = await framed('index.html');
    let o = null, reached = {};
    try {
      await until(() => d.getElementById('playlabel').textContent);
      // the page comes up from under its veil; a player presses once it has
      const sb = d.getElementById('settingsbtn');
      await until(() => {
        const r = sb.getBoundingClientRect();
        return sb.contains(d.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2));
      });
      reached.settings = press(d, sb);
      reached.button = press(d, d.getElementById('fbbtn'));
      reached.page = !d.getElementById('fbform').hidden;
      o = await walkForm(d, d.getElementById('fbform'), stub, reached);
      reached.back = press(d, d.getElementById('fbback')) && !d.getElementById('motion').hidden;
    } finally {
      done();
      setPref('feedbackDraft', draft);
    }
    return [
      ok(reached.settings && reached.button && reached.page && reached.back, 'landing: settings, the button, the page, and back', JSON.stringify(reached)),
      ...said(o, 'landing'),
      ok(o.body.meta.page === 'title', 'landing: the page is the title'),
    ];
  }],

  ['the feedback form is a box, a tick and send: the crashed sheet, with the crash\'s line', async () => {
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
    let o = null, reached = {};
    try {
      fatal(new Error('the yard fell over'));
      reached.up = await until(() => !btn.hidden);
      reached.under = !!(btn.compareDocumentPosition(document.getElementById('copysave')) & Node.DOCUMENT_POSITION_PRECEDING);
      reached.button = press(document, btn);
      reached.open = await until(() => form.querySelector('.send'));
      reached.ask = form.querySelector('.fb-ask')?.textContent === msg('crashed-fb-ask');
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
      ...said(o, 'crashed sheet', { ask: true }),
      ok(/the yard fell over/.test(o.body.meta.fatal || '') && o.body.meta.page === 'crashed', 'crashed sheet: the crash\'s first line went', o.body.meta.fatal),
    ];
  }],

  ['the feedback form is a box, a tick and send: a phone\'s held sheet, nothing off its side', async () => {
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
      reached.held = !d.getElementById('held').hidden;
      // A thumb pulls the sheet up to its tall stop, and the rows under the
      // fold scroll into reach inside it.
      reached.tall = await pullUp(d, d.getElementById('heldhandle'));
      reached.under = underSettings(d);
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
      ok(reached.held && reached.under && reached.button, 'phone: the pause page, the button under settings, pressed where it stands', JSON.stringify(reached)),
      ok(wide.length === 0, 'phone: nothing on the sheet stands past the screen\'s sides', wide.join(', ')),
      ok(sw <= cw, 'phone: no sideways scroll', scroll),
      ...said(o, 'phone'),
    ];
  }],
];
