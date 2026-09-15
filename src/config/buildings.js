import { P } from './yard.js';

// The casino sits in the margin the world keeps at its left-hand end, the last
// building before the rock: a narrow strip, which suits the one building that
// is narrow and tall.
export const TO_CASINO = -3078;
// The outhouse: a shed on the bare ground where the crew *are*, centered in the
// strip with about a hundred pixels of bare ground either side. The smallest
// thing anybody builds in this yard.
export const TO_OUTHOUSE = -756;
export const OUTHOUSE_W = P * 7;
export const OUTHOUSE_H = P * 10;
// How many janitors the outhouse opens a place for at the outset and, because
// the caps hang on the stand outside it, how many caps there are to start
// with: a post with no cap is a body sent to a job with nothing to pick up.
// One, so the shed has something left to buy (`loopost`). `capOf` in
// upgrades.js and the janitors' row in kit.js read `S.looPosts` and fall back
// to this for a save that has never set it.
export const LOO_POSTS = 1;

// What the second post costs: `loopost`, on the outhouse's own board.
export const LOOPOST_SHARDS = 30;

// Far enough past the casino to read as its own place rather than the next
// unit along: the gaps between the buildings out here run about a hundred and
// fifty.
export const TO_TOWER = -3324;
export const TOWER_W = P * 13;
// The main shaft, of those thirteen: the tall half with the pointed roof, the
// turret making up the rest off its right-hand side. Here rather than inside
// the drawing because the bar that says how far along a hat is has to stand
// over the *spire*, not the middle of the whole building.
export const TOWER_SHAFT = 8;
export const TOWER_H = P * 34;       // tall and thin: the one building that goes up
// What the front has to hold, added up: half a wheel and the white disc it is
// set in is thirteen cells from the middle of the block, a clear cell, the four
// of DOOR_W, and two of wall to the corner. The wheel is set by the height, so
// widening the block does not grow it; narrower and the doorway cuts through
// the rim. The disc stands a cell proud of the rim all the way round, and that
// cell is easy to leave out of the sum.
export const CASINO_W = P * 26;
export const CASINO_H = P * 12;

// --- the shack at the rock ----------------------------------------------------
// The rockhands' hut, standing off the rock's left flank. See DESIGN.md, "The
// shack at the rock".
//
// Eight cells across is what the front has to hold: `DOOR_W` is four
// everywhere, and a doorway needs two cells of wall either side or the wall
// reads as two posts.
export const SHACK_W = P * 8;
export const SHACK_H = P * 11;
// How far the hut stands off the rock that is here -- THIS rock, not the
// biggest there will ever be. More than the three cells every other shed
// wears, because the rock's own apron is where its spoil lands. With the ram
// bought the hut stands behind the ram's parking space instead (`shackSpot`,
// world.js).
export const SHACK_CLEAR = P * 6;
// Pixels a second the hut scoots out toward its slot as each bigger rock comes
// down. A rock is three cells broader than the last, so a scoot is a cell and
// a half, and it has to finish inside the seven tenths of a second the rock is
// in the air (ROCK_DROP, DROP_GRAV).
export const SHACK_SCOOT = 30;
// The cheapest bill in the game and the only one paid in dust alone: it goes
// up before the yard has any other coin, and a bill in a currency the rock
// does not give would gate the gang's own ladders behind somewhere else.
export const SHACK_DUST = 150;
// A third of `WORK_BASE.building`, because it is a third of a building, and
// because the first build in a game should be over before you wonder whether
// it is stuck.
export const SHACK_WORK = 15;
