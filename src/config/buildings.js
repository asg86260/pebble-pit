import { P } from './yard.js';

export const TO_CASINO = -3078;
// Past the casino: the far end of the walk, and the last thing on the ground.
// Everything else out here was bought with what the yard digs; this one is
// bought with the thing the yard cannot make.
//
// It sits in the margin the world already keeps at its left-hand end, rather
// than pushing the whole yard right to make room. The rock is 2,880 from the
// left edge and the casino is the last building before it, so what is left is a
// narrow strip -- which suits the one building that is narrow and tall.
// The outhouse: a shed on the bare ground between the training grounds and the
// rooms the crew live in. It goes where the crew *are* rather than out at the
// quiet end with the lab and the table -- somewhere you would put one.
//
// Two cells by three and a bit: the smallest thing anybody builds in this yard,
// because that is how big it needs to be.
// Centred in that strip, with about a hundred pixels of bare ground either
// side. It was wedged into ninety-six between the two of them, eighteen clear
// on one side, which read as a thing squeezed in after the fact -- which it was.
export const TO_OUTHOUSE = -756;
export const OUTHOUSE_W = P * 7;
export const OUTHOUSE_H = P * 10;
// How many janitors the outhouse opens a place for at the outset -- and, because
// the caps hang on the stand outside it, how many caps there are to start with.
// One number for both: a post with no cap to go with it would be a body sent to
// a job with nothing to pick up.
//
// It used to be two from the first day the shed went up, on the argument that
// one pair of hands is not enough ground for a yard this long to keep up with --
// which is true, and was also the whole of the shed's story: build it once and
// it is already finished. One post now, and a second one is `loopost`'s to sell
// -- a shed that opens small and grows is a shed with something left to buy, the
// same shape as every other station in the yard. See `capOf` in upgrades.js and
// the janitors' row in kit.js, which both read `S.looPosts` and fall back to
// this for a save that has never set it.
export const LOO_POSTS = 1;

// What the second post costs: `loopost`, on the outhouse's own board. The
// outhouse is the janitor's whole trade in one building -- the seat, the stand
// with the caps, the brooms and the board. It kept a separate broom cupboard
// (the janitor's closet) for a while; one trade gets one building.
export const LOOPOST_SHARDS = 30;

// Far enough past the casino to read as its own place rather than the next unit
// along: the gaps between the buildings out here run about a hundred and fifty,
// and this one was eighteen.
export const TO_TOWER = -3324;
export const TOWER_W = P * 13;
// The main shaft, of those thirteen: the tall half with the pointed roof on it,
// with the little turret making up the rest off its right-hand side. It is here
// rather than inside the drawing because the bar that says how far along a hat
// is has to stand over the *spire* and not over the middle of the whole
// building -- the turret is two and a half cells of the width and pulls the
// middle off the point -- and two places working that out from the same number
// is the only way they agree.
export const TOWER_SHAFT = 8;
export const TOWER_H = P * 34;       // tall and thin: the one building that goes up
// Twenty-six across, and it was eighteen. The wheel is set by the height rather
// than the width -- it is as big as the block is short, and widening the block
// does not grow it -- so at eighteen the doorway at the far end of the front was
// cut straight through the rim, and a way in that runs into the works is the
// fault the scrubbing house's chute was moved off the door to avoid.
//
// Twenty-six is what the front actually has to hold, added up rather than tried:
// half a wheel and the white disc it is set in is thirteen cells from the middle
// of the block, then a clear cell, then the four of DOOR_W, then two of wall to
// the corner. Anything less and the two touch -- twenty-four looks like it works
// and does not, because the disc stands a cell proud of the rim all the way
// round and that cell is easy to leave out of the sum.
//
// It makes this the widest thing on the ground, ahead of the school's twenty,
// which suits the one building here that produces nothing.
export const CASINO_W = P * 26;
export const CASINO_H = P * 12;

// --- the shack at the rock ----------------------------------------------------
// The rockhands' hut, standing off the rock's left flank. The gang was the one
// trade in the yard with no building: the growers have the plots, the blasters
// have the cut, the janitor has the shed, and the crew who were here first
// worked out of thin air with their helmets on a stand in the middle of the
// rock they were trying to take down. See DESIGN.md, "The shack at the rock".
//
// Eight cells across, which is what the front has to hold rather than a size
// picked to look about right: `DOOR_W` is four everywhere in this yard, and a
// doorway needs two cells of wall either side of it or the wall reads as two
// posts. That makes it a cell wider than the outhouse and a course taller --
// the outhouse keeps its title as the smallest thing anybody builds, and this
// is the next one up, because a body carries a pickaxe through this door and
// nothing through that one.
export const SHACK_W = P * 8;
export const SHACK_H = P * 11;
// How far the hut stands off the rock that is here -- THIS rock, not the
// biggest there will ever be. Every other shed in the yard wears three cells
// off its wall; this one keeps a little more because the rock's own apron is
// where its spoil lands. With the ram bought the hut stands behind the ram's
// parking space instead (see `shackSpot`, world.js): the machine parks off
// the face and the hut may not be under it.
export const SHACK_CLEAR = P * 6;
// The hut scoots out toward its slot in the walk as each bigger rock comes
// down -- this is how far it slides in a second. A rock is three cells
// broader than the last, so a scoot is a cell and a half, and it has to be
// done before the rock lands: the number goes up as the rock is made in the
// sky and it is down in about seven tenths of a second (ROCK_DROP, DROP_GRAV).
// Thirty a second is a third of a second of a hut shuffling over while the
// rock is still in the air -- a thing you can watch, and finished in time.
export const SHACK_SCOOT = 30;
// What it costs. The cheapest bill in the game, and the only one paid in dust
// alone: this is a hut for the gang that digs the dust, put up before the yard
// has any other coin to its name, and a bill in a currency the rock does not
// give would gate the gang's own ladders behind somewhere else entirely.
export const SHACK_DUST = 150;
// And how long it takes to stand up, against `WORK_BASE.building`'s forty-five.
// A third, because it is a third of a building -- and because this is the first
// thing most players will ever put up, and the first build in a game should be
// over before you have started wondering whether it is stuck.
export const SHACK_WORK = 15;
