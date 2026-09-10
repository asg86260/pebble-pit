// The record: the notices you have earned, newest first, on the held sheet.
//
// It hung on the noticeboard as a second sheet under the books, in the shape
// of a board's rows. Two things were wrong with that. The books are about what
// the yard is *earning*, a second at a time, and the record is about what has
// happened -- different questions, and the board was answering both. And a
// board's rows answer to a cursor: they light up, they carry a note, they are
// the shape of something you might buy, and nothing here is for sale. So it is
// a plain list on the one sheet that is not the yard -- the held sheet, where
// the settings already are -- written when the game is held, and it is read
// there: holding the game is what brings the tick over the board down.

import { S } from './state.js';
import { NOTICES, noticeCount, noticeTotal } from './notices.js';

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

// Written into the sheet's own element: a heading with the count, then one
// line a notice -- the name, and what you did to earn it. Nothing here is a
// button and nothing has a hover; it is a page to read. See "Unearned notices
// are not named" above for why the count is the only word about the rest.
export function showRecord(el) {
  const rows = recordList();
  el.replaceChildren();
  const head = document.createElement('div');
  head.className = 'head';
  head.textContent = `the record \u00b7 ${noticeCount()} of ${noticeTotal()}`;
  el.appendChild(head);
  for (const r of rows) {
    const line = document.createElement('div');
    line.className = 'line';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = r.name;
    const note = document.createElement('span');
    note.className = 'note';
    note.textContent = r.note;
    line.append(name, note);
    el.appendChild(line);
  }
  el.hidden = rows.length === 0;
}
