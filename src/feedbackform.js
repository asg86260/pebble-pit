// The feedback form on a page (DESIGN.md, "Feedback form"): the box, the
// tick and send. The held sheet's settings (settings.js), the landing page's
// (title.js) and the crashed sheet (crash.js, fetched at the click) each hand
// it an element and say which page they are; the working is feedback.js's,
// and this draws it.
//
// Every stop the pad stands on is a plain button (padpage.js): the tick is a
// button that says it is a checkbox, not an input; the box is a text box,
// which the pad skips as it skips the paste box.

import { feedbackForm } from './feedback.js';
import { msg } from './lang.js';
import { FEEDBACK_TEXT_MAX } from './config/feedback.js';
import { TARGET } from './config/cloud.js';

function make(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

// Into `el`, a new form: the tick off and the words the draft. `ask` is the
// crashed sheet's line over the box, asking for the save. `back`, where the
// page has one, shares the last line with send: back on the left, send on the
// right, under the line that says how a send went.
export function mountFeedback(el, { page, raw, fatal = null, ask = false, back = null }) {
  el.textContent = '';
  const askEl = make('div', 'said fb-ask', ask ? msg('crashed-fb-ask') : '');
  const box = make('textarea', 'fb-box');
  box.rows = 5;
  box.maxLength = FEEDBACK_TEXT_MAX;
  box.spellcheck = true;
  box.placeholder = msg('fb-box.placeholder');
  const tick = make('button', 'tick');
  tick.type = 'button';
  tick.setAttribute('role', 'checkbox');
  tick.append(make('span', 'box'), make('span', 'label', msg('fb-tick')));
  const send = make('button', 'send');
  send.type = 'button';
  const said = make('div', 'said fb-said');
  const where = make('div', 'said fb-where small');
  const foot = back ? make('div', 'pair fb-foot') : null;
  if (foot) foot.append(back, send);
  el.append(askEl, box, tick, said, where, foot || send);

  const form = feedbackForm({ page, raw, fatal, onChange: paint });
  box.value = form.text;
  box.addEventListener('input', () => form.type(box.value));
  tick.addEventListener('click', () => form.tick());
  send.addEventListener('click', () => form.send());

  function paint() {
    const sent = form.phase === 'sent';
    for (const e of [box, tick, send]) e.hidden = sent;
    askEl.hidden = sent || !ask;
    box.readOnly = form.phase === 'sending';
    tick.disabled = !form.canTick();
    tick.classList.toggle('on', form.ticked);
    tick.setAttribute('aria-checked', String(form.ticked));
    send.disabled = !form.canSend();
    send.textContent = form.phase === 'sending' ? msg('fb-sending') : msg('fb-send');
    said.textContent = sent ? (form.sentSave && !form.savedKept ? msg('fb-sent-nosave') : msg('fb-sent'))
      : form.phase === 'failed' ? msg('fb-failed') : '';
    where.textContent = sent ? msg('fb-sent-where', { target: TARGET }) : '';
  }
  paint();
  return form;
}
