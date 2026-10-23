// The saves page: three yards, one open at a time, on the held sheet.
//
// A slot is a yard and not a snapshot (DESIGN.md, "Save slots and the title
// page"): the autosave writes to the one you are in and no other, and
// switching slots is switching which yard the page is running. What a row
// says is read off the save itself, because nothing here is named by the
// player.

import { S } from './state.js';
import { SLOTS, openSlot, slotRaw, writeSlot } from './save.js';
import { sayPlayed } from './words.js';
import { msg } from './lang.js';

// Coarse on purpose: the page is read at a glance.
export function since(then, now = Date.now()) {
  const s = Math.max(0, (now - then) / 1000);
  if (s < 60) return msg('slots-since-now');
  if (s < 3600) return msg('slots-since-min', { m: Math.floor(s / 60) });
  if (s < 86400) return msg('slots-since-h', { h: Math.floor(s / 3600) });
  const d = Math.floor(s / 86400);
  return msg('slots-since-days', { d });
}

// A blob that will not parse is `unreadable`, not `empty`: stepping into it is
// the fallback and the broken-save line, not a new game. The open slot reads
// from the standing yard while `playing` (the store is a second behind it); on
// the landing page nothing is running and it reads like the others.
export function slotLabels(now = Date.now(), playing = true) {
  const rows = [];
  for (let n = 1; n <= SLOTS; n++) {
    const raw = slotRaw(n);
    const open = n === openSlot();
    let s = null;
    if (raw) { try { s = JSON.parse(raw); } catch {} }
    const parts = [String(n)];
    // How long the yard has been played, said beside the row; nothing for a
    // slot with no yard in it to have played.
    let played = '';
    if (open && playing) {
      parts.push(msg('slots-row-rock', { n: S.boulderNo }), msg('slots-row-crew', { n: S.crew }), msg('slots-row-playing'));
      played = sayPlayed(S.playedS);
    } else if (!raw) {
      parts.push(msg('slots-row-empty'));
    } else if (!s) {
      parts.push(msg('slots-row-unreadable'));
    } else {
      parts.push(msg('slots-row-rock', { n: s.boulderNo || 1 }), msg('slots-row-crew', { n: s.crew || 0 }));
      if (Number.isFinite(s.savedAt)) parts.push(since(s.savedAt, now));
      played = sayPlayed(s.playedS);
    }
    rows.push({ slot: n, open, empty: !raw, parts, text: parts.join(' · '), played });
  }
  return rows;
}

// The open slot as the landing page says it under `play`: the row's words
// without the slot's number, or `a new yard` for an empty one.
export function playLabel(now = Date.now()) {
  const row = slotLabels(now, false).find(r => r.open);
  if (!row || row.empty) return msg('title-playlabel-new');
  return row.text.replace(/^\d+ · /, '');
}

// The line on the fronts: how many of the three are yards.
export const slotsLabel = () => msg('held-slotsbtn-label', { n: slotLabels(Date.now(), false).filter(r => !r.empty).length, total: SLOTS });

// One card a slot on a grid: the row's button (its words and its playtime,
// the open one inert) and a ✕ delete inside the same border, and under it the confirm
// that `delete` fades open. The columns are shared by every row (`.saves` in
// style.css) and the rows are the sheet's width; a row with nothing to
// delete keeps an unseen ✕, so the column does not come and go.
//
// An empty row is armed first (`start a new yard?` for four seconds) because
// it is the one press on the page that begins an intro. `say` is the sheet's
// own line, handed in so this file does not reach for settings.js's elements;
// `pick` is what opening a slot means where the page is (`switchSlot` on the
// held sheet, the pointer alone on the landing page); `wipeOpen` is what
// deleting the open slot means there (the reset on the held sheet, the blob
// cleared on the landing page). Any other slot is cleared here, through the
// same `writeSlot` the reset's clear goes through, so the cloud hears of it.
let armed = 0;                  // page: the empty row's arm timer
let armedRow = null;            // page: the row armed
function disarm() {
  clearTimeout(armed);
  armed = 0;
  if (armedRow) { armedRow.classList.remove('armed'); setItems(armedRow.querySelector('.what'), JSON.parse(armedRow.dataset.text)); }
  armedRow = null;
}

// The confirm under a row, open or shut. A shut one is inert, so its buttons
// are not reached by a key while it is folded away.
function asking(confirm, on) {
  confirm.classList.toggle('asking', on);
  confirm.inert = !on;
}

// A row's words as items, one span each: the grid gives each its own column
// and the gap between them is the separator, so no dot is drawn. A row that
// says one thing after its number (empty, unreadable, the arm) lets it span.
const ITEMS = ['n', 'rock', 'crew', 'when'];
function setItems(what, parts) {
  what.replaceChildren(...parts.map((t, i) => {
    const e = document.createElement('span');
    e.className = parts.length === 2 ? (i ? 'item lone' : 'item n') : 'item ' + ITEMS[i];
    e.textContent = t;
    return e;
  }));
}

// Each row's words read again off the store, into the lines already standing:
// a delete changes what a row says, not where anything is.
function paint(el, playing) {
  for (const row of slotLabels(Date.now(), playing)) {
    const b = el.querySelector(`.slot[data-slot="${row.slot}"]`);
    const del = el.querySelector(`.del[data-slot="${row.slot}"]`);
    if (!b || !del) continue;
    b.parentElement.classList.toggle('open', row.open);
    b.className = 'slot' + (row.open ? ' open' : '');
    setItems(b.querySelector('.what'), row.parts);
    b.querySelector('.played').textContent = row.played;
    b.dataset.text = JSON.stringify(row.parts);
    b.dataset.empty = row.empty ? '1' : '';
    b.disabled = row.open;
    del.classList.toggle('none', row.empty);
    del.inert = row.empty;
  }
}

export function showSlots(el, say, pick, playing = true, wipeOpen = () => {}) {
  disarm();
  el.replaceChildren();
  for (const { slot } of slotLabels(Date.now(), playing)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot';
    b.dataset.slot = slot;
    b.innerHTML = '<span class="what"></span><span class="played"></span>';
    b.addEventListener('click', () => {
      const empty = !!b.dataset.empty;
      if (empty && armedRow !== b) {
        disarm();
        armed = setTimeout(disarm, 4000);
        armedRow = b;
        b.classList.add('armed');
        setItems(b.querySelector('.what'), [String(slot), msg('slots-arm')]);
        return;
      }
      disarm();
      pick(slot, empty);
      say(empty ? msg('slots-said-new') : msg('slots-said-loaded'));
      showSlots(el, say, pick, playing, wipeOpen);
    });

    // The delete sits inside the row's border, set off by a dashed rule: one
    // card a yard, so a phone never wraps it onto a line of its own. A pixel
    // cross (five cells), named by the word the confirm uses.
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'del';
    del.dataset.slot = slot;
    del.setAttribute('aria-label', msg('slots-del-aria'));
    del.innerHTML = '<svg class="x" viewBox="0 0 5 5" aria-hidden="true">' +
      [[0, 0], [4, 0], [1, 1], [3, 1], [2, 2], [1, 3], [3, 3], [0, 4], [4, 4]]
        .map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1"/>`).join('') + '</svg>';

    const card = document.createElement('div');
    card.className = 'saverow';
    card.dataset.slot = slot;
    card.append(b, del);

    const confirm = document.createElement('div');
    confirm.className = 'confirm';
    confirm.dataset.slot = slot;
    confirm.innerHTML = '<div class="fold"><div class="pair"><button type="button" class="yes"></button>' +
                        '<button type="button" class="no"></button></div></div>';
    confirm.querySelector('.yes').textContent = msg('slots-confirm-yes');
    confirm.querySelector('.no').textContent = msg('slots-confirm-no');
    asking(confirm, false);

    // One question at a time: asking about this row puts any other away.
    del.addEventListener('click', () => {
      disarm();
      for (const c of el.querySelectorAll('.confirm.asking')) if (c !== confirm) asking(c, false);
      asking(confirm, true);
    });
    confirm.querySelector('.no').addEventListener('click', () => asking(confirm, false));
    confirm.querySelector('.yes').addEventListener('click', () => {
      asking(confirm, false);
      if (slot === openSlot()) wipeOpen();
      else writeSlot(slot, '');
      paint(el, playing);
    });
    el.append(card, confirm);
  }
  paint(el, playing);
  fit(el);
  shown = el;
}

// A row that will not fit the window across stacks: its words over its
// when and playtime, the ✕ staying inside the card. Read off the rows as laid out, not a width guessed
// for them, so a longer row (a three-figure rock, a long playtime) stacks at
// the width it actually needs.
let shown = null;               // page: the slot list last laid out, refit on resize
function fit(el) {
  if (el.hidden || !el.isConnected) return;
  el.classList.remove('stacked');
  const r = el.getBoundingClientRect();
  const over = el.scrollWidth > el.clientWidth + 1 || r.left < 0 || r.right > document.documentElement.clientWidth;
  el.classList.toggle('stacked', over);
}
if (typeof addEventListener === 'function') addEventListener('resize', () => { if (shown) fit(shown); });
