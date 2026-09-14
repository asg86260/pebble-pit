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
import { switchSlot } from './persist.js';

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
export function slotLabels(now = Date.now()) {
  const rows = [];
  for (let n = 1; n <= SLOTS; n++) {
    const raw = slotRaw(n);
    const open = n === openSlot();
    let s = null;
    if (raw) { try { s = JSON.parse(raw); } catch {} }
    const parts = [String(n)];
    if (open) {
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

// The one line on the front: which yard this is, so the button that turns
// the page says the thing you came to check.
export const slotsLabel = () => `saves · yard ${openSlot()}`;

// Written into the sheet's own element: one button a slot, the open one inert.
// Pressing another row switches the yard behind the sheet and says so. An
// empty row is armed first -- `start a new yard?` for four seconds, the way
// the reset is -- because it is the one press on the page that begins an
// intro, and a slip here would be a new game under a player who wanted the
// list. `say` is the sheet's own line, handed in so this file does not reach
// for settings.js's elements.
let armed = 0;
let armedRow = null;
function disarm() {
  clearTimeout(armed);
  armed = 0;
  if (armedRow) { armedRow.classList.remove('armed'); armedRow.textContent = armedRow.dataset.text; }
  armedRow = null;
}
export function showSlots(el, say) {
  disarm();
  el.replaceChildren();
  for (const row of slotLabels()) {
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
      switchSlot(row.slot);
      say(row.empty ? 'a new yard' : `yard ${row.slot}`);
      showSlots(el, say);
    });
    el.appendChild(b);
  }
}
