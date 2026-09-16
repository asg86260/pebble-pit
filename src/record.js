// The record: the notices you have earned, newest first, on the held sheet.
// A plain list, nothing for sale and nothing with a hover.

import { S } from './state.js';
// The catalog and not notices.js: this file is read on the landing page too,
// where there is no yard for notices.js to reach.
import { CATALOG as NOTICES } from './catalog.js';
const noticeCount = () => S.won.length;
const noticeTotal = () => NOTICES.length;

// Unearned notices are not named: the game names nothing you have not met,
// and a locked list would spoil the catalog. The count stands in for it.
const earned = () => NOTICES.filter(n => S.won.includes(n.key));

// `wonAt` is the stamp taken when each one landed.
const newestFirst = () =>
  earned().slice().sort((a, b) => (S.wonAt[b.key] || 0) - (S.wonAt[a.key] || 0));


// Rebuilt each time the sheet is shown, because the record grows behind your
// back.
export function recordList() {
  return newestFirst().map(n => ({ name: n.name, note: n.note }));
}

// The same list off a save that is not standing (the landing page), and its
// count.
export function recordListOf(won = [], wonAt = {}) {
  return NOTICES.filter(n => won.includes(n.key))
    .sort((a, b) => (wonAt[b.key] || 0) - (wonAt[a.key] || 0))
    .map(n => ({ name: n.name, note: n.note }));
}
export const recordLabelOf = (won = []) => `achievements \u00b7 ${won.length} of ${noticeTotal()}`;

// The line on the sheet's front, which is also the button that turns the page.
export const recordLabel = () => `achievements \u00b7 ${noticeCount()} of ${noticeTotal()}`;

// One card a notice: the name on top, what you did to earn it underneath.
export function showRecord(el, rows = recordList()) {
  el.replaceChildren();
  if (rows.length === 0) {
    const none = document.createElement('div');
    none.className = 'none';
    none.textContent = 'nothing yet';
    el.appendChild(none);
  }
  for (const r of rows) {
    const card = document.createElement('div');
    card.className = 'card';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = r.name;
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = r.note;
    card.append(name, note);
    el.appendChild(card);
  }
}
