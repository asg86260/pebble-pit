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
// How many janitors the closet opens a place for at the outset -- and, because
// the caps hang on the stand outside it, how many caps there are to start with.
// One number for both: a post with no cap to go with it would be a body sent to
// a job with nothing to pick up.
//
// It used to be two from the first day the shed went up, on the argument that
// one pair of hands is not enough ground for a yard this long to keep up with --
// which is true, and was also the whole of the closet's story: build it once and
// it is already finished. One post now, and a second one is `loopost`'s to sell
// -- a shed that opens small and grows is a shed with something left to buy, the
// same shape as every other station in the yard. See `capOf` in upgrades.js and
// the janitors' row in kit.js, which both read `S.looPosts` and fall back to
// this for a save that has never set it.
export const LOO_POSTS = 1;

// The janitor's closet: the cupboard the brooms and the caps live in, and the
// only shop stand in the yard nobody buys.
//
// It is not the outhouse. The outhouse is the shed with the moon over the door
// that `unlockouthouse` puts up, and it is where a body *goes*; the closet is
// where the tools are kept, and it is where you go to decide about the job. The
// two were one thing for a while and the row that bought the outhouse was
// called "build the janitor's closet" because of it, which left the yard with a
// cupboard nobody could point at and a shop section on the bench for a place
// that was not there.
//
// Squat rather than tall: eight across and seven down, against the outhouse's
// seven by ten. Wider than it is high is what a cupboard is and what a shed
// never is, and the yard has enough sheds. The width is also what the front
// needs -- a seam down the middle with a handle either side of it wants eight
// columns to sit on, and at six the handles landed against the seam and drew a
// white cross.
export const CLOSET_W = P * 8;
export const CLOSET_H = P * 7;
// What the second post costs: `loopost`, on the bench's own outhouse section.
export const LOOPOST_SHARDS = 6;

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
