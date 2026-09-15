import { QUARRY_WALK } from './quarry.js';
import { P } from './yard.js';

// --- a body walks to its work ----------------------------------------------

// Moving somebody between jobs is the same body walking over. The pace is the
// crew's own legs with a floor under them: whatever a body walks at with its
// hands free, or this, whichever is quicker. A pace upgrade has to apply to
// the one trip you are actually watching, and a walk must never get *longer*
// for having bought nothing yet.
export const COMMUTE_PACE = 4.6;
// Near enough to have arrived. A station is a place rather than a pixel, and a
// body made to land exactly on one would shuffle on the spot for ever.
export const COMMUTE_SLOP = P * 2;
// How fast a body gets down into the quarry and back out of it again. The
// same number at both ends of the trip, or a quarrier climbs out faster than
// it climbed in.
export const CLIMB_PACE = QUARRY_WALK * 2;
// How long a lab with nothing to research keeps somebody standing in it before
// they let themselves out. The walk over is twenty seconds by itself, so this
// is the grace to open the board and get the work started; shorter and a body
// sent to an empty lab turns round before anything can be paid for.
export const LAB_IDLE_MS = 20000;
