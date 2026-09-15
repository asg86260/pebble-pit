import { P } from './yard.js';

// --- the house ---------------------------------------------------------------
// Where the crew live: a shack per body, on the bare ground between the bench
// and the quarry. The block is sized to the room it has at the *biggest* rock,
// because the rock grows leftwards into this ground and the shacks may not be
// standing in it when it does. Its far edge is where the quarry's spoil has to
// stop.
export const HOUSE_TO = -504;      // rock center to the middle of the plot
// How often one window in the settlement opens or closes its curtain: one, and
// the whole place, not one each. A window is two cells wide, so anything
// animated *inside* one is a flicker, and twenty rooms on twenty cycles is a
// wall of small things changing at once. So a window is open or curtained, in
// one step, and one changes every this often.
export const HOUSE_FLIP_MS = 8000;
// How much of the settlement has its curtains across at any one time. A wall
// of grey is as uniform as a wall of white; a third keeps the front mixed.
export const HOUSE_SHUT = 0.3;
// A drawn curtain. Not black: a window that goes black vanishes into the wall.
// Grey says the window is still there and somebody has pulled something
// across it.
export const HOUSE_CURTAIN = '#8f8f8f';
// A hearth, not a furnace: the lab smokes steadily because work is being done
// in it; this says something quieter, that somebody is in.
export const HOUSE_PUFF_MS = 5200;
// --- knocking off -------------------------------------------------------------
// How long a body with nothing to carry hangs about before it goes home. Long,
// and staggered per body, so the yard empties over a minute or two rather than
// downing tools together. It has to be longer than a break's turn comes round,
// or the yard empties before anybody has stood in it long enough to light
// anything: knocking off and taking five are the same idle stretch, and this
// is the far end of it.
export const HOME_AFTER = 60000;  // idle before a body knocks off
// The trip to or from the shacks, as a multiple of the commute. It is the one
// trip with nothing to do at either end, so it is the one to hurry, and it
// rides the pace ladder with `commutePace`.
export const HOME_HURRY = 2;
// A room is twice the body that lives in it: at one body across, a door was
// half the width of the worker walking out of it.
export const HOUSE_CUBE = P * 6;
// How wide the settlement may stand, in rooms. Six is 216px, in a strip shared
// with the bench: twelve pixels of bare ground to the bench on one side and
// the quarry's spoil on the other.
export const HOUSE_COLS = 6;
