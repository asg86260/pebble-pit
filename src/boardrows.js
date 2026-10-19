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
//
// A board with no row in stations.js -- an act's, opened by a click on its
// place rather than by walking up to it -- says the station row's parts
// itself, and is marked so:
//   offTable  true
//   name      () => its title
//   stand     () => the world rectangle it stands over, as a station's `stand`
//   empty     () => what it says with nothing on it
// and any board may say
//   slots     the most tiles a plank holds before they wrap (SHELF_SLOTS else)

const BOARD = {};
export const registerBoard = (key, board) => { BOARD[key] = board; };
export const boardOf = key => BOARD[key] || null;

// Opening one of those boards by its key, from a module the page's boards
// cannot be imported into (the sim's, loaded by the node checks too): the
// boards hand in the opener when the page loads (board.js). With no page
// there is nothing to open, and the ask answers false.
let opener = null;
export const setBoardOpener = fn => { opener = fn; };
export const openBoardByKey = key => (opener ? opener(key) : false);
