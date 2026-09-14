// The record: the notices you have earned, newest first, on the held sheet.
//
// It hung on the noticeboard as a second sheet under the books, in the shape
// of a board's rows. Two things were wrong with that. The books are about what
// the yard is *earning*, a second at a time, and the record is about what has
// happened -- different questions, and the board was answering both. And a
// board's rows answer to a cursor: they light up, they carry a note, they are
// the shape of something you might buy, and nothing here is for sale. So it is
// a plain list on the one sheet that is not the yard -- the held sheet, where
// the settings already are -- on a page of its own behind a button on the
// front. Holding the game is what reads it: the tick over the board comes down
// when the sheet comes up, whether or not the page is turned.

import { S } from './state.js';
// The catalog and not notices.js: the names are data, and this file is read
// on the landing page too, where there is no yard for notices.js to reach.
import { CATALOG as NOTICES } from './catalog.js';
const noticeCount = () => S.won.length;
const noticeTotal = () => NOTICES.length;

// **Unearned notices are not named.** This is the rule the whole game already
// follows -- the books show only currencies you have seen, the counter names
// nothing you have not met -- and it is the call the sheet was signed off on. A
// locked list would be that rule broken forty times over in the one place a new
// player reads a board end to end, and it would spoil half the catalog, which is
// a thing you are meant to find out is in here.
//
// What stands in for it is the count, which is the honest half of what a locked
// list gives you: how much board there is left.
const earned = () => NOTICES.filter(n => S.won.includes(n.key));

// Newest first. `wonAt` is the stamp taken when each one landed, and the order
// they are read in is the order they happened in, backwards -- which is what
// makes the top of the sheet the thing you came over to see.
const newestFirst = () =>
  earned().slice().sort((a, b) => (S.wonAt[b.key] || 0) - (S.wonAt[a.key] || 0));


// The list, as it stands. Rebuilt each time the sheet is shown rather than
// held, because the record grows behind your back.
export function recordList() {
  return newestFirst().map(n => ({ name: n.name, note: n.note }));
}

// The same list off a save that is not standing -- the landing page reads
// the open slot's blob, with no yard booted -- and its count.
export function recordListOf(won = [], wonAt = {}) {
  return NOTICES.filter(n => won.includes(n.key))
    .sort((a, b) => (wonAt[b.key] || 0) - (wonAt[a.key] || 0))
    .map(n => ({ name: n.name, note: n.note }));
}
export const recordLabelOf = (won = []) => `achievements \u00b7 ${won.length} of ${noticeTotal()}`;

// The one line about the achievements on the sheet's front: the count, which
// is the honest half of a locked list (see above). It is the button that turns
// the page, so what you press to read them is the number of them. "The record"
// was their name for a while; "achievements" is the word every other game
// uses, and a player looking for them looks for that word.
export const recordLabel = () => `achievements \u00b7 ${noticeCount()} of ${noticeTotal()}`;

// Written into the sheet's own element: one card a notice -- the name on top,
// what you did to earn it underneath -- in the shape the boards' cards take,
// two across, because an achievement is a thing you hold rather than a line
// in a ledger. Nothing here is a button and nothing has a hover; it is a page
// to read, behind the button that carries the count. An empty page says so.
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
