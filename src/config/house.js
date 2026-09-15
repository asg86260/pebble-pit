import { P } from './yard.js';

// --- Track HOUSE -------------------------------------------------------------
// Where the crew live: a shack per body, on the bare ground out past the bench,
// between it and the quarry. The block is sized to the room it has at the
// *biggest* rock rather than at rock one, because the rock grows leftwards into
// this ground as the game goes on and the shacks may not be standing in it when
// it does. Its far edge is where the quarry's spoil has to stop.
export const HOUSE_TO = -504;      // rock centre to the middle of the plot
// How often one window in the settlement opens or closes its curtain. One, and
// the whole place, not one each.
//
// Every window used to run its own cycle: a curtain drawing across, a pause, a
// figure crossing the light. None of it read. A window is two cells wide, so
// anything animated *inside* one has two frames to do it in -- full, half, gone
// -- and two frames is not a curtain closing, it is a flicker. Worse, twenty
// rooms on twenty cycles meant several were always mid-something, and a wall of
// small things changing at once is the definition of busy.
//
// So nothing moves inside a window now: it is open or it is curtained, in one
// step, and one window in the settlement changes every this often. Something is
// always subtly different from the last time you looked, and you never catch two
// of them at it.
export const HOUSE_FLIP_MS = 8000;
// And how much of the settlement has its curtains across at any one time. Left
// to itself the walk only ever shut windows, so the place drifted towards every
// curtain drawn and sat there: a wall of grey is as uniform as a wall of white,
// and takes two minutes to get boring in. A third keeps the front mixed.
export const HOUSE_SHUT = 0.3;
// A drawn curtain. Not black: a window that goes black is a window that vanishes
// into the wall, and a wall full of holes that keep opening and shutting is the
// busiest thing on screen. Grey says the window is still there and somebody has
// pulled something across it.
export const HOUSE_CURTAIN = '#8f8f8f';
// How often the chimney puffs. It is a hearth, not a furnace: the lab smokes
// steadily because work is being done in it, and this says something quieter --
// that somebody is in.
export const HOUSE_PUFF_MS = 5200;
// --- knocking off -------------------------------------------------------------
// How long a body with nothing to carry will hang about the yard before it goes
// home. Long, and staggered per body: the point is a yard that empties over a
// minute or two while there is nothing to do, not a crew that downs tools
// together the instant the last grain is lifted. They come straight back out
// the moment there is dust on the ground.
// It has to be longer than a break's turn comes round, or the yard empties
// before anybody has stood in it long enough to light anything -- knocking off
// and taking five are the same idle stretch, and this is the far end of it.
export const HOME_AFTER = 60000;  // idle before a body knocks off
// And how quick the trip is, either way, as a multiple of the commute. The walk
// home was its own number -- 1.15 px a frame, a quarter of the slowest commute
// -- so a crew that crossed the yard to work in a few seconds took most of a
// minute to trudge back to the door, and read as dragging its feet the whole
// way; and a body hired out of the door walked to its station at the plain
// commute while every other trip in the yard had been made brisk. A trip that
// starts or ends at the shacks is the one trip with nothing to do at either end
// of it, so it is the one to hurry: this many times `commutePace`, and it rides
// the pace ladder with it.
export const HOME_HURRY = 2;
// A room is twice the body that lives in it. It was exactly one body across for
// a while, which meant a door -- a third of a room -- was half the width of the
// worker walking out of it, and the whole settlement read as a doll's house
// parked next to people it could not have held.
export const HOUSE_CUBE = P * 6;
// How wide the settlement may stand, in rooms. Six at the size a room is now is
// 216px, and it stands in a strip it shares with the bench: twelve pixels of
// bare ground to the bench on one side and the quarry's spoil on the other.
export const HOUSE_COLS = 6;
