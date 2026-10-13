// The feedback form on a page (DESIGN.md, "Feedback form"; option A of
// docs/mocks/feedback-form-2026-10-13.html): the box, the tick, the line of
// what goes, and send. The held sheet's settings (settings.js), the landing
// page's (title.js) and the crashed sheet (crash.js, fetched at the click)
// each hand it an element and say which page they are; the working is
// feedback.js's, and this draws it.
//
// Every stop the pad stands on is a plain button (padpage.js): the tick is a
// button that says it is a checkbox, not an input; the box is a text box,
// which the pad skips as it skips the paste box.

import { feedbackForm } from './feedback.js';
import { msg } from './lang.js';
import { FEEDBACK_TEXT_MAX, FEEDBACK_COUNT_FROM, FEEDBACK_SAVE_KEEP_D, FEEDBACK_REPORT_KEEP_D } from './config/feedback.js';
import { TARGET } from './config/cloud.js';

function make(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

// Into `el`, a new form: the tick off and the words the draft. `ask` is the
// crashed sheet's line over the box, asking for the save.
export function mountFeedback(el, { page, raw, fatal = null, yard = false, ask = false }) {
  el.textContent = '';
  const askEl = make('div', 'said fb-ask', ask ? msg('crashed-fb-ask') : '');
  const box = make('textarea', 'fb-box');
  box.rows = 5;
  box.maxLength = FEEDBACK_TEXT_MAX;
  box.spellcheck = true;
  box.placeholder = msg('fb-box.placeholder');
  const left = make('div', 'small fb-left');
  const tick = make('button', 'tick');
  tick.type = 'button';
  tick.setAttribute('role', 'checkbox');
  tick.append(make('span', 'box'), make('span', 'label', msg('fb-tick')));
  const goes = make('div', 'goes');
  const pub = make('div', 'small fb-public', msg('fb-public'));
  const send = make('button', 'send');
  send.type = 'button';
  const said = make('div', 'said fb-said');
  const where = make('div', 'said fb-where small');
  el.append(askEl, box, left, tick, goes, pub, send, said, where);

  const form = feedbackForm({ page, raw, fatal, yard, onChange: paint });
  box.value = form.text;
  box.addEventListener('input', () => form.type(box.value));
  tick.addEventListener('click', () => form.tick());
  send.addEventListener('click', () => form.send());

  // The line: its lead, a value a key of the request, then why the tick is
  // grey when it is, and how long what goes is kept.
  function line() {
    const items = form.goes().map(({ key, text }) => {
      const v = make('span', key === 'save' ? 'v save' : 'v', text);
      v.dataset.key = key;
      return v;
    });
    const why = form.why();
    goes.replaceChildren(make('span', 'lead', msg('fb-goes')), ...items,
      ...(why ? [make('span', 'why', why)] : []),
      make('span', 'keep', msg('fb-goes-keep', { reportDays: FEEDBACK_REPORT_KEEP_D, saveDays: FEEDBACK_SAVE_KEEP_D })));
  }

  function paint() {
    const sent = form.phase === 'sent';
    for (const e of [box, tick, goes, send]) e.hidden = sent;
    askEl.hidden = sent || !ask;
    box.readOnly = form.phase === 'sending';
    const n = form.left();
    left.hidden = sent || n > FEEDBACK_COUNT_FROM;
    left.textContent = msg('fb-left', { n });
    tick.disabled = !form.canTick();
    tick.classList.toggle('on', form.ticked);
    tick.setAttribute('aria-checked', String(form.ticked));
    pub.hidden = sent || !form.ticked;
    send.disabled = !form.canSend();
    send.textContent = form.phase === 'sending' ? msg('fb-sending') : msg('fb-send');
    if (!sent) line();
    said.textContent = sent ? (form.sentSave && !form.savedKept ? msg('fb-sent-nosave') : msg('fb-sent'))
      : form.phase === 'failed' ? msg('fb-failed') : '';
    where.textContent = sent ? msg('fb-sent-where', { target: TARGET }) : '';
  }
  paint();
  return form;
}
