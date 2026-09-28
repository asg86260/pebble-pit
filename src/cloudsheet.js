// Cloud saves on the page (DESIGN.md, "Cloud saves: a sync code and a
// worker"; docs/wave-cloud.md, "The face"). Three faces of one mirror: the
// status line in the landing page's foot bar, the boxed section on the
// settings pages that holds every verb (option B of
// docs/mocks/cloud-menu-2026-09-28.html), and the rows that ask which of two
// yards a slot keeps. Nothing here talks to the worker. Every verb is
// cloud.js's; this file draws what `cloudStatus` says and hands the buttons
// to it, the way slots.js serves both the title column and the held sheet.

import { cloudWhy, cloudReady, startCloud, makePair, claimPair, useRecovery, rotate, stopCloud,
         conflicts, choose, takeCloud, keepHere, cloudStatus, recoveryCode } from './cloud.js';
import { since } from './slots.js';
import { openSlot } from './save.js';
import { copyOut } from './copyout.js';
import { CLOUD_PAIR_LEN, CLOUD_TICK_MS, CLOUD_IDLE_MS, CLOUD_ARM_MS } from './config.js';
import { typedPair } from './codes.js';
export { typedPair };

const TICK_MS = CLOUD_TICK_MS;
const IDLE_MS = CLOUD_IDLE_MS;
// And how often the held sheet's page asks whether the cloud has news for
// the player: the same slow beat.
export const CLOUD_LOOK_MS = IDLE_MS;

// Every line the cloud can be in, as the bar and the sheet both say it.
// `ok` carries its own time and is written below.
const LINES = {
  off: 'cloud · off',
  out: 'cloud · signed out',
  refused: 'cloud · a save was refused',
  offline: 'cloud · not saved: offline',
  behind: 'cloud · newer on another device',
  newer: 'cloud · update to take the newer save',
  big: 'cloud · too big for the cloud',
  full: 'cloud · the cloud is full',
  paused: 'cloud · paused',
  conflict: 'cloud · choose a yard'
};
export function cloudLine(st = cloudStatus(), now = Date.now()) {
  if (st.state === 'ok') return st.at ? `cloud · saved ${since(st.at, now)}` : 'cloud · on';
  return LINES[st.state] || LINES.off;
}
// Inside the block the heading already says whose line it is.
const blockLine = (st, now) => cloudLine(st, now).replace(/^cloud · /, '');

const clock = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// --- small builders ----------------------------------------------------------
function node(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}
function button(text, fn, cls = '') {
  const b = node('button', cls, text);
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}
// copyOut writes its word to an element; the pages hand this file a `say`.
const sayer = say => ({ set textContent(t) { say(t); } });

// Everything drawn from this file, redrawn together after any verb: a yard
// linked in the section changes the foot bar's line, and the other way
// round. A block taken out of the page is let go rather than drawn into
// nothing.
const drawers = new Map();
function redrawAll() {
  for (const [el, draw] of [...drawers]) {
    if (el.isConnected) draw();
    else drawers.delete(el);
  }
}
export const refreshCloud = redrawAll;

// A pairing code put away with *done* stays away though it still has
// minutes on it.
let doneWith = null;
function livePair(st, now) {
  const p = st.pair;
  return p && p.expires > now && p.pair !== doneWith ? p : null;
}

// --- the foot bar (title page) -----------------------------------------------
// The status alone: every verb is in the section. The one link it keeps is to
// the rows that ask which yard a slot keeps, since nothing syncs until the
// player has answered them.
let foot = null;
let footTimer = 0;

export function showFoot(el, say, opts = {}) {
  foot = { el, say, opts };
  drawers.set(el, drawFoot);
  drawFoot();
}

function drawFoot() {
  if (!foot) return;
  const { el } = foot;
  clearTimeout(footTimer);
  footTimer = setTimeout(drawFoot, IDLE_MS);
  // A build with no cloud has no line at all, and no gap where one would be.
  if (!cloudReady()) { el.replaceChildren(); el.hidden = true; return; }
  el.hidden = false;
  const st = cloudStatus();
  const tick = node('span', st.state === 'ok' ? 'tick' : 'tick off');
  if (st.state === 'conflict') {
    el.replaceChildren(tick, 'cloud · ', button('choose a yard', () => foot.opts.conflict?.(), 'go'));
  } else {
    el.replaceChildren(tick, cloudLine(st, Date.now()));
  }
}

// --- the section (title column and held sheet) --------------------------------
// `fresh` is a recovery code just minted, shown with the words to write it
// down; `revealed` one asked for with *show recovery code*; `typing` which
// code a box is open for ('link' or 'recovery'). All last until the page is
// turned: the exported call is a page turned, a redraw after a verb is not.
let fresh = null;
let revealed = null;
let typing = null;
let armed = 0;
const tickers = new Map();   // el -> the countdown's timer, while a pairing code is up

export function showCloud(el, say, opts = {}) {
  fresh = null;
  revealed = null;
  typing = null;
  drawCloud(el, say, opts);
}

function drawCloud(el, say, opts) {
  drawers.set(el, () => drawCloud(el, say, opts));
  clearTimeout(tickers.get(el));
  // A box being typed in is never wiped by a redraw from elsewhere.
  if (typing && el.querySelector('input, textarea') === document.activeElement && el.dataset.typing === typing) return;
  el.replaceChildren();
  delete el.dataset.typing;
  // Hidden here, never shown here: the page decides whether the block's
  // page is up, and a redraw from the foot bar must not bring it up on
  // another page.
  if (!cloudReady()) { el.hidden = true; return; }
  // A section of its own, titled, so every button in it -- stop above all --
  // reads as being about the cloud and not about the slots over it.
  el.append(node('div', 'head', 'cloud saves'));
  const st = cloudStatus();
  const now = Date.now();
  const done = line => { if (line) say(line); redrawAll(); opts.changed?.(); };
  const redraw = () => drawCloud(el, say, opts);

  if (st.state === 'off' || st.state === 'out') {
    if (typing) { drawTyping(el, say, opts, done, redraw); return; }
    const open = kind => () => { typing = kind; say(''); redraw(); };
    // Signed out: this device still holds its old code, so the ways on are a
    // code from another device, the recovery code, or letting it go.
    if (st.state === 'out') {
      el.append(node('div', 'small', blockLine(st, now)),
        button('enter a link code', open('link')),
        button('use a recovery code', open('recovery')),
        button('stop cloud saves', async () => { await stopCloud(); done('the cloud is off on this device'); }));
      return;
    }
    el.append(
      button('enable cloud syncing', async e => {
        e.currentTarget.disabled = true;
        await startCloud();
        fresh = recoveryCode();
        done(fresh ? '' : cloudWhy('the cloud did not answer'));
      }),
      button('enter a link code', open('link')),
      button('use a recovery code', open('recovery')));
    return;
  }

  el.append(node('div', 'small', blockLine(st, now)));
  if (fresh || revealed) {
    const code = fresh || revealed;
    const pair = node('div', 'pair');
    pair.append(button('copy', () => copyOut(code, sayer(say))));
    el.append(node('div', 'code', code), pair,
      node('div', 'small', 'write this down: it brings your yards back on a new device'));
  }
  if (st.state === 'conflict') {
    const rows = node('div', 'slots clashes');
    el.append(rows);
    drawClashes(rows, say, opts);
  }
  // Another device is ahead on a yard, and this one has stopped pushing it
  // (docs/wave-cloud.md, "The sync"): take theirs, or push this one over it.
  // Any slot can be the one behind, not only the open one.
  if (st.state === 'behind') {
    const n = st.slot ?? openSlot();
    const pair = node('div', 'pair');
    pair.append(
      button('take it', async () => { await takeCloud(n); opts.took?.(n, 'cloud'); done('taken'); }),
      button('keep this one', async () => { await keepHere(n); done('kept'); }));
    el.append(pair);
  }
  // *link a device*: the code the other device types, counting down on its
  // own second so a slow redraw never skips a number, until *done* or zero.
  const pair = livePair(st, now);
  if (pair) {
    const left = Math.max(0, Math.ceil((pair.expires - now) / 1000));
    el.append(node('div', 'small', 'on the other device, enter'),
      node('div', 'code pair-code', typedPair(pair.pair)),
      node('div', 'small count', `${clock(left)} left`),
      button('done', () => { doneWith = pair.pair; redraw(); }));
    tickers.set(el, setTimeout(() => { if (el.isConnected) redraw(); }, (pair.expires - now) % TICK_MS + 1));
  } else {
    el.append(button('link a device', async e => {
      e.currentTarget.disabled = true;
      doneWith = null;
      await makePair();
      if (!livePair(cloudStatus(), Date.now())) say(cloudWhy('the cloud did not answer'));
      redraw();
    }));
  }
  if (!fresh) el.append(button(revealed ? 'hide recovery code' : 'show recovery code', () => {
    revealed = revealed ? null : recoveryCode();
    redraw();
  }));
  // Armed like the reset: a new code signs every other device out, so one
  // press asks and a second within four seconds does it.
  const again = button('new recovery code', async () => {
    if (!armed) {
      armed = setTimeout(() => { armed = 0; again.classList.remove('armed'); again.textContent = 'new recovery code'; }, CLOUD_ARM_MS);
      again.classList.add('armed');
      again.textContent = 'sign out other devices?';
      return;
    }
    clearTimeout(armed);
    armed = 0;
    await rotate();
    fresh = recoveryCode();
    revealed = null;
    done(fresh ? '' : cloudWhy('the cloud did not answer'));
  }, 'again');
  clearTimeout(armed);
  armed = 0;
  el.append(again, button('stop cloud saves', async () => {
    await stopCloud();
    fresh = revealed = null;
    done('the cloud is off on this device');
  }));
}

// A code being typed, in the section: a pairing code from another device's
// *link a device*, or the recovery code from paper. The box reads a pairing
// code as it is typed; a short one is wrong without asking, since every
// wrong claim the worker hears counts against this ip's tries.
function drawTyping(el, say, opts, done, redraw) {
  const link = typing === 'link';
  el.dataset.typing = typing;
  const box = node(link ? 'input' : 'textarea');
  box.spellcheck = false;
  box.autocomplete = 'off';
  if (link) {
    box.maxLength = CLOUD_PAIR_LEN + 1;
    box.placeholder = '···-···';
    box.addEventListener('input', () => { box.value = typedPair(box.value); });
  } else {
    box.rows = 1;
    box.placeholder = '····-····-····';
  }
  box.setAttribute('aria-label', link ? 'link code' : 'recovery code');
  const wrong = "that code didn't work";
  const go = async () => {
    let ok;
    if (link) {
      const code = typedPair(box.value);
      if (code.replace('-', '').length < CLOUD_PAIR_LEN) { say(wrong); box.focus(); return; }
      ok = await claimPair(code);
    } else {
      ok = await useRecovery(box.value);
    }
    if (!ok) { say(cloudWhy(wrong)); box.focus(); return; }
    typing = null;
    done('linked');
    if (conflicts().length) opts.conflict?.();
  };
  box.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); go(); }
    if (e.key === 'Escape') { e.preventDefault(); typing = null; say(''); redraw(); }
  });
  const pair = node('div', 'pair');
  pair.append(button('link', go), button('never mind', () => { typing = null; say(''); redraw(); }));
  el.append(node('div', 'small', link ? 'the code on the other device' : 'your recovery code'), box, pair);
  box.focus();
}

// --- the conflict rows --------------------------------------------------------
// A slot where this device and the cloud hold two different yards: nothing is
// overwritten until the player keeps one (the other goes to the slot's
// `.prev`, cloud.js's doing). One row a slot, both sides as the saves page
// says a yard. `done` is told when the last is answered.
export function showConflicts(el, say, opts = {}) {
  drawers.set(el, () => drawClashes(el, say, opts));
  drawClashes(el, say, opts);
}
// The rows alone, for the settings block to draw inside itself: the block's
// own redraw makes them again, so they are not a drawer of their own.
function drawClashes(el, say, opts) {
  el.replaceChildren();
  const pick = async (n, side) => {
    await choose(n, side);
    opts.took?.(n, side);
    say('kept');
    if (!conflicts().length) opts.done?.();
    redrawAll();
    opts.changed?.();
  };
  for (const c of conflicts()) {
    const row = node('div', 'pair clash');
    row.dataset.slot = c.n;
    row.append(button(`this device · ${c.n} · ${c.here}`, () => pick(c.n, 'here'), 'here'),
               button(`cloud · ${c.n} · ${c.cloud}`, () => pick(c.n, 'cloud'), 'cloud'));
    el.append(row);
  }
}
