// Cloud saves on the page (DESIGN.md, "Cloud saves: a sync code and a
// worker"; docs/wave-cloud.md, "The face"). Three faces of one mirror: the
// line in the landing page's foot bar, the block on the settings pages, and
// the rows that ask which of two yards a slot keeps. Nothing here talks to
// the worker. Every verb is cloud.js's; this file draws what `cloudStatus`
// says and hands the buttons to it, the way slots.js serves both the title
// column and the held sheet.

import { cloudReady, startCloud, makePair, claimPair, useRecovery, rotate, stopCloud,
         conflicts, choose, takeCloud, keepHere, cloudStatus, recoveryCode } from './cloud.js';
import { since } from './slots.js';
import { openSlot } from './save.js';
import { copyOut } from './copyout.js';
import { CLOUD_PAIR_LEN, CLOUD_ALPHABET, CLOUD_TICK_MS, CLOUD_IDLE_MS, CLOUD_ARM_MS } from './config.js';

const TICK_MS = CLOUD_TICK_MS;
const IDLE_MS = CLOUD_IDLE_MS;
// And how often the held sheet's page asks whether the cloud has news for
// the player: the same slow beat.
export const CLOUD_LOOK_MS = IDLE_MS;

// Every line the cloud can be in, as the bar and the sheet both say it.
// `ok` carries its own time and is written below.
const LINES = {
  off: 'cloud · off',
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

// A pairing code as it is typed: the same forgiveness the worker's reading
// has (docs/wave-cloud.md, "Codes"), applied as the player types so the box
// never holds a character that could not be in a code, and the dash put in
// where it is shown. Letters that read as digits become them.
const HALF = CLOUD_PAIR_LEN / 2;
export function typedPair(text) {
  const bare = [...String(text).toUpperCase().replace(/O/g, '0').replace(/[IL]/g, '1')]
    .filter(c => CLOUD_ALPHABET.includes(c)).join('').slice(0, CLOUD_PAIR_LEN);
  return bare.length > HALF ? bare.slice(0, HALF) + '-' + bare.slice(HALF) : bare;
}
// The worker hands a pairing code back with its dash; one without is shown
// the same way.
const shownPair = code => typedPair(code);
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
// linked from the foot bar changes the sheet's block under it, and the other
// way round. A block taken out of the page is let go rather than drawn into
// nothing.
const drawers = new Map();
function redrawAll() {
  for (const [el, draw] of [...drawers]) {
    if (el.isConnected) draw();
    else drawers.delete(el);
  }
}
export const refreshCloud = redrawAll;

// --- the foot bar (title page) -----------------------------------------------
// Two modes of its own beside what the status says: `entering`, a code being
// typed, which no redraw may wipe; and a pairing code put away with `done`,
// which stays away though it still has minutes on it.
let foot = null;
let entering = false;
let doneWith = null;
let footTimer = 0;

export function showFoot(el, say, opts = {}) {
  foot = { el, say, opts };
  drawers.set(el, drawFoot);
  drawFoot();
}

function livePair(st, now) {
  const p = st.pair;
  return p && p.expires > now && p.pair !== doneWith ? p : null;
}

function drawFoot() {
  if (!foot) return;
  const { el } = foot;
  clearTimeout(footTimer);
  const ready = cloudReady();
  const now = Date.now();
  const st = ready ? cloudStatus() : null;
  const pair = ready ? livePair(st, now) : null;
  // On the countdown's own second, so a slow tick never skips a number.
  footTimer = setTimeout(drawFoot, pair ? (pair.expires - now) % TICK_MS + 1 : IDLE_MS);
  // A build with no cloud has no line at all, and no gap where one would be.
  if (!ready) { el.replaceChildren(); el.hidden = true; entering = false; return; }
  el.hidden = false;
  if (entering && st.state === 'off') {
    if (!el.querySelector('input')) drawEntering(el);
    return;
  }
  entering = false;
  el.classList.toggle('row', !!pair);
  if (pair) {
    const left = Math.max(0, Math.ceil((pair.expires - now) / 1000));
    el.replaceChildren(node('span', '', 'link code'), node('span', 'code', shownPair(pair.pair)),
      node('span', 'count', clock(left)), node('span', '', '·'),
      button('done', () => { doneWith = pair.pair; drawFoot(); }, 'go'));
    return;
  }
  const tick = node('span', st.state === 'ok' ? 'tick' : 'tick off');
  if (st.state === 'off') {
    el.replaceChildren(tick, `${LINES.off} · `, button('enter a code', () => { entering = true; drawFoot(); }, 'go'));
  } else if (st.state === 'ok') {
    el.replaceChildren(tick, `${cloudLine(st, now)} · `, button('link a device', linkDevice, 'go'));
  } else if (st.state === 'conflict') {
    el.replaceChildren(tick, 'cloud · ', button('choose a yard', () => foot.opts.conflict?.(), 'go'));
  } else {
    el.replaceChildren(tick, cloudLine(st, now));
  }
}

async function linkDevice() {
  doneWith = null;
  await makePair();
  if (!livePair(cloudStatus(), Date.now())) foot.say('the cloud did not answer');
  drawFoot();
}

function drawEntering(el) {
  el.classList.add('row');
  const box = node('input');
  box.maxLength = CLOUD_PAIR_LEN + 1;
  box.placeholder = '···-···';
  box.spellcheck = false;
  box.autocomplete = 'off';
  box.setAttribute('aria-label', 'link code');
  box.addEventListener('input', () => { box.value = typedPair(box.value); });
  const cancel = () => { entering = false; foot.say(''); drawFoot(); };
  // A short code is wrong without asking: every wrong claim the worker hears
  // counts against this ip's tries.
  const link = async () => {
    const code = typedPair(box.value);
    if (code.replace('-', '').length < CLOUD_PAIR_LEN || !(await claimPair(code))) {
      foot.say("that code didn't work");
      box.focus();
      return;
    }
    entering = false;
    foot.say('linked');
    redrawAll();
    foot.opts.changed?.();
    if (conflicts().length) foot.opts.conflict?.();
  };
  box.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); link(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  el.replaceChildren(node('span', '', 'code'), box, button('link', link, 'go'), button('cancel', cancel, 'go'));
  box.focus();
}

// --- the settings block (title column and held sheet) -----------------------
// `fresh` is a recovery code just minted, shown with the words to write it
// down; `revealed` one asked for with *show recovery code*. Both last until
// the page is turned: the exported call is a page turned, a redraw after a
// verb is not.
let fresh = null;
let revealed = null;
let recovering = false;
let armed = 0;

export function showCloud(el, say, opts = {}) {
  fresh = null;
  revealed = null;
  recovering = false;
  drawCloud(el, say, opts);
}

function drawCloud(el, say, opts) {
  drawers.set(el, () => drawCloud(el, say, opts));
  el.replaceChildren();
  // Hidden here, never shown here: the page decides whether the block's
  // page is up, and a redraw from the foot bar must not bring it up on
  // another page.
  if (!cloudReady()) { el.hidden = true; return; }
  const st = cloudStatus();
  const done = line => { if (line) say(line); redrawAll(); opts.changed?.(); };

  if (st.state === 'off') {
    if (recovering) {
      const box = node('textarea');
      box.rows = 1;
      box.spellcheck = false;
      box.placeholder = 'PEBBLE-····-····-····-····-····';
      box.setAttribute('aria-label', 'recovery code');
      const use = async () => {
        if (!(await useRecovery(box.value))) { say("that code didn't work"); return; }
        recovering = false;
        done('linked');
      };
      box.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); use(); } });
      const pair = node('div', 'pair');
      pair.append(button('use it', use), button('never mind', () => { recovering = false; drawCloud(el, say, opts); }));
      el.append(box, pair);
      box.focus();
      return;
    }
    el.append(
      button('keep my yards in the cloud', async e => {
        e.currentTarget.disabled = true;
        await startCloud();
        fresh = recoveryCode();
        done(fresh ? '' : 'the cloud did not answer');
      }),
      button('use a recovery code', () => { recovering = true; say(''); drawCloud(el, say, opts); }));
    return;
  }

  el.append(node('div', 'small', cloudLine(st)));
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
  if (!fresh) el.append(button(revealed ? 'hide recovery code' : 'show recovery code', () => {
    revealed = revealed ? null : recoveryCode();
    drawCloud(el, say, opts);
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
    done(fresh ? '' : 'the cloud did not answer');
  }, 'again');
  clearTimeout(armed);
  armed = 0;
  el.append(again, button('stop', async () => {
    await stopCloud();
    fresh = revealed = null;
    done('the cloud is off on this device');
  }));
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
