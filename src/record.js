// The record sheet: the notices you have earned, newest first.
//
// It is the noticeboard's second sheet. The first is the books -- what the yard
// is *earning*, a second at a time -- and the two are deliberately different
// questions asked at the same place: the books say what is coming in, the record
// says what has happened. A rate does not belong on this sheet and a lifetime
// total does not belong on that one.
//
// Nothing here is for sale. The rows are readouts in the shape every other board
// already uses, the same way the books' rows are, so the sheet lines up with the
// rest of the game and no second kind of row had to be invented.

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

export const RECORD_UPGRADES = [];

// Rebuilt from the record rather than held, because the list grows behind your
// back: a notice lands while you are looking at the rock. `buildBoard` asks for
// the rows every frame the sheet is open and only touches the DOM when the set
// has actually changed -- the same bargain the crew list strikes for the same
// reason.
export function recordRows() {
  const rows = newestFirst().map(n => ({
    key: 'notice' + n.key,
    name: n.name,
    // What you did to earn it, which is what a note on this sheet is for. Never
    // a remark about the notice: a record that comments on itself is a record
    // you read twice. See DESIGN.md.
    note: () => n.note,
    read: true,
    dead: () => false,
    cost: () => 0,
    buy: () => {},
    show: () => true
  }));

  // ...and the one line that says how much board is left. It is a row rather
  // than a heading so that it sits at the foot of the list where a total goes,
  // and it is the only thing on the sheet that mentions a notice you have not
  // earned -- as a number, never as a name.
  rows.push({
    key: 'noticecount',
    name: `${noticeCount()} of ${noticeTotal()}`,
    read: true,
    dead: () => false,
    cost: () => 0,
    buy: () => {},
    show: () => true
  });

  return rows;
}

export const recordSections = () => [
  { title: 'the record', keys: recordRows().map(r => r.key) }
];
