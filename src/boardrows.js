// What each station's board sells, handed in by the module that owns the rows
// (`registerBoard` at the foot of farm.js, quarry.js, deep/rows.js...), and
// read by the boards off the station's key. Everything else about a board --
// its title, its page, what it says when it is empty -- is the station's own
// row in stations.js. This file imports nothing: the modules that register
// are imported by the boards, so the boards cannot be imported back.
//
//   rows      () => the rows it sells (the rows that name the board as their
//             `board` lodge on it as well: `boardList` in shop.js)
//   sections  () => its planks, in order; a section may say `heads`, a count
//             of the bodies posted there, which its heading wears as a badge
//   count     () => the one number the title wears, for a board with one group
//   ledger    true for a board of readings rather than things to buy

const BOARD = {};
export const registerBoard = (key, board) => { BOARD[key] = board; };
export const boardOf = key => BOARD[key] || null;
