// The saves page: three yards, one open at a time, on the held sheet.
//
// A slot is a yard and not a snapshot (DESIGN.md, "Save slots and the title
// page"): the autosave writes to the one you are in and no other, and
// switching slots is switching which yard the page is running. Nothing is
// ever copied, so nothing can lie. This file is record.js's twin -- a page
// behind a button on the sheet's front, written as the page is turned -- and
// what it writes is read off the saves themselves: the rock number, the crew
// and how long ago, because nothing here is named by the player. The game has
// no text field but the paste box and does not want one on this sheet.

import { S } from './state.js';
import { SLOTS, openSlot, slotRaw } from './save.js';

// The coarse kind of time, since the page is read at a glance: how long ago
// is what matters, and the exact minute is not.
export function since(then, now = Date.now()) {
  const s = Math.max(0, (now - then) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'a day ago' : `${d} days ago`;
}

// What each slot holds, as the row will say it. A blob that will not parse
// is said to be unreadable rather than empty: stepping into it is not the new
// game, it is the fallback and the broken-save line, and the row should not
// promise otherwise. The open slot is `playing` whatever its blob says --
// the yard standing is the truth, and the store is a second behind it.
// `playing` is whether a yard is standing on the page: on the held sheet the
// open slot is the yard running behind it and says so; on the landing page
// nothing is running, and the open slot reads like the others.
export function slotLabels(now = Date.now(), playing = true) {
  const rows = [];
  for (let n = 1; n <= SLOTS; n++) {
    const raw = slotRaw(n);
    const open = n === openSlot();
    let s = null;
    if (raw) { try { s = JSON.parse(raw); } catch {} }
    const parts = [String(n)];
    if (open && playing) {
      parts.push(`rock ${S.boulderNo}`, `${S.crew} crew`, 'playing');
    } else if (!raw) {
      parts.push('empty');
    } else if (!s) {
      parts.push('unreadable');
    } else {
      parts.push(`rock ${s.boulderNo || 1}`, `${s.crew || 0} crew`);
      if (Number.isFinite(s.savedAt)) parts.push(since(s.savedAt, now));
    }
    rows.push({ slot: n, open, empty: !raw, text: parts.join(' · ') });
  }
  return rows;
}

// What the open slot holds, as the landing page says it under `play`: the
// row's words without the slot's number -- no yard is "yard 1" to the
// player, it is the yard -- or `a new yard` for an empty one.
export function playLabel(now = Date.now()) {
  const row = slotLabels(now, false).find(r => r.open);
  if (!row || row.empty) return 'a new yard';
  return row.text.replace(/^\d+ · /, '');
}

// The line on the fronts: how many of the three are yards.
export const slotsLabel = () => `saves · ${slotLabels(Date.now(), false).filter(r => !r.empty).length} of ${SLOTS}`;

// Written into the sheet's own element: one button a slot, the open one inert.
// Pressing another row switches the yard behind the sheet and says so. An
// empty row is armed first -- `start a new yard?` for four seconds, the way
// the reset is -- because it is the one press on the page that begins an
// intro, and a slip here would be a new game under a player who wanted the
// list. `say` is the sheet's own line, handed in so this file does not reach
// for settings.js's elements, and `pick` is what opening a slot means where
// the page is: `switchSlot` on the held sheet, where a yard is running and
// has to be swapped; the pointer alone on the landing page, where none is.
let armed = 0;
let armedRow = null;
function disarm() {
  clearTimeout(armed);
  armed = 0;
  if (armedRow) { armedRow.classList.remove('armed'); armedRow.textContent = armedRow.dataset.text; }
  armedRow = null;
}
export function showSlots(el, say, pick, playing = true) {
  disarm();
  el.replaceChildren();
  for (const row of slotLabels(Date.now(), playing)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot' + (row.open ? ' open' : '');
    b.textContent = row.text;
    b.dataset.text = row.text;
    b.dataset.slot = row.slot;
    b.disabled = row.open;
    b.addEventListener('click', () => {
      if (row.empty && armedRow !== b) {
        disarm();
        armed = setTimeout(disarm, 4000);
        armedRow = b;
        b.classList.add('armed');
        b.textContent = `${row.slot} · start a new yard?`;
        return;
      }
      disarm();
      pick(row.slot, row.empty);
      say(row.empty ? 'a new yard' : 'loaded');
      showSlots(el, say, pick, playing);
    });
    el.appendChild(b);
  }
}
