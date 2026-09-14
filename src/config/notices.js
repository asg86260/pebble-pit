import { P } from './yard.js';

// The noticeboard's numbers: how often the rules are asked, and every threshold
// a notice is earned at. See DESIGN.md, "The noticeboard, and the record on it".

// How often the standing-fact rules are asked, in seconds. Forty-odd
// comparisons twice a second is nothing; the same forty at sixty hertz is a
// thing somebody would have to measure, and there is no reason to find out.
export const NOTICE_TICK_S = 0.5;

// --- the thresholds -----------------------------------------------------------
// Placeholders, every one of them, and they want a played yard rather than an
// argument. They are tables rather than fifteen named constants because that is
// what they are: one ladder of rocks, one of pebbles, one of bodies. A new rung
// is a number in a list, and the notice for it is built from the list -- so the
// count on the board and the thresholds cannot drift apart, which is what
// fifteen hand-written constants and fifteen hand-written rules would do.
//
// They are not `TUNABLE` rows: a slider edits one number, and one number here is
// a rung of a ladder whose shape is the point. The dev panel gets the two below
// that really are single numbers.
export const NOTICE_ROCKS   = [10, 25, 50, 100];
export const NOTICE_PEBBLES = [1e4, 1e5, 1e6, 1e7, 1e8];
export const NOTICE_CREW    = [5, 10, 25, 50];
export const NOTICE_ORE     = [1e3, 1e4];
export const NOTICE_RIFT    = 1e6;
export const NOTICE_BREWS   = 100;
export const NOTICE_LIVED_MS = 60 * 60 * 1000;   // an hour on one body's clock

// What counts as a big hand at the table, either way. One number, argued about
// on a played yard, so it gets a slider.
export let CASINO_BIG = 50000;

// And what counts as a rock off in a hurry, in seconds.
export let NOTICE_FAST_ROCK_S = 60;

// --- the toast ----------------------------------------------------------------
// How long a notice's card stays at the top of the window, in game
// milliseconds, and the gap between two when several land at once. Long
// enough to catch out of the corner of the eye and then read the name and the
// note without hurrying -- four seconds came and went unnoticed under a busy
// yard; short enough that a rock landing three of them is over before the
// next rock. See DESIGN.md, "a toast when one lands".
export let TOAST_MS = 6500;
export let TOAST_GAP_MS = 400;

export const NOTICE_KNOBS = [
  { key: 'CASINO_BIG', label: 'a big hand', min: 1000, max: 500000, step: 1000,
    get: () => CASINO_BIG, set: v => { CASINO_BIG = v; } },
  { key: 'NOTICE_FAST_ROCK_S', label: 'a quick rock', min: 10, max: 300, step: 5,
    get: () => NOTICE_FAST_ROCK_S, set: v => { NOTICE_FAST_ROCK_S = v; } },
  { key: 'TOAST_MS', label: 'toast stays', min: 1000, max: 10000, step: 250,
    get: () => TOAST_MS, set: v => { TOAST_MS = v; } },
  { key: 'TOAST_GAP_MS', label: 'toast gap', min: 0, max: 2000, step: 50,
    get: () => TOAST_GAP_MS, set: v => { TOAST_GAP_MS = v; } }
];


// --- the board it all hangs on ------------------------------------------------
// A panel on two posts, standing between the work bench and the houses. It is
// furniture rather than a building: nobody works in it, and it wants to read
// as something you walk up to and peer at, not as another shed.
//
// Wide enough for the sheets on it to be legible as sheets at the yard's
// ordinary zoom, and no wider -- the strip it stands on is the busiest ground
// in the yard and the crew have to get past it. Thirteen is what three
// three-cell sheets with a cell of board between and around them come to
// (see SHEETS in render/noticeboard.js); the panel is sized off its contents
// rather than the contents squeezed to fit a panel, which is what left the
// old slips off the lattice.
export const BOARD_W = P * 13;
export const BOARD_H = P * 8;          // the panel
export const BOARD_LEG = P * 3;        // and how far it stands off the ground
// What the sheets pinned to it are drawn in: paper, not dust. The heap shades
// top out at a mid grey and read as dirt against the black panel; these are
// the clouds' whites and a step under, so a sheet is a sheet from across the
// yard. Each sheet takes one off its own index, because paper on a board is
// not one white (see render/noticeboard.js).
export const PAPER = ['#f2f2f2', '#e3e3e3', '#d4d4d4', '#ebebeb'];