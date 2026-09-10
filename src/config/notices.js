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

export const NOTICE_KNOBS = [
  { key: 'CASINO_BIG', label: 'a big hand', min: 1000, max: 500000, step: 1000,
    get: () => CASINO_BIG, set: v => { CASINO_BIG = v; } },
  { key: 'NOTICE_FAST_ROCK_S', label: 'a quick rock', min: 10, max: 300, step: 5,
    get: () => NOTICE_FAST_ROCK_S, set: v => { NOTICE_FAST_ROCK_S = v; } }
];


// --- the board it all hangs on ------------------------------------------------
// A panel on two posts, standing between the work bench and the houses. It is
// furniture rather than a building: nobody works in it, and it wants to read
// as something you walk up to and peer at, not as another shed.
//
// Wide enough for the slips to be legible as slips at the yard's ordinary
// zoom, and no wider -- the strip it stands on is the busiest ground in the
// yard and the crew have to get past it.
export const BOARD_W = P * 11;
export const BOARD_H = P * 8;          // the panel
export const BOARD_LEG = P * 3;        // and how far it stands off the ground
// How many slips the panel can show at once. The board fills up as the record
// does, which is the whole of what it has to say from across the yard.
export const BOARD_SLIPS = 12;