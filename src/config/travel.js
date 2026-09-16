import { QUARRY_WALK } from './quarry.js';


// --- a body walks to its work ----------------------------------------------

// Moving somebody between jobs is the same body walking over. The pace is the
// crew's own legs with a floor under them: whatever a body walks at with its
// hands free, or this, whichever is quicker. A pace upgrade has to apply to
// the one trip you are actually watching, and a walk must never get *longer*
// for having bought nothing yet.
export const COMMUTE_PACE = 4.6;
// How fast a body gets down into the quarry and back out of it again. The
// same number at both ends of the trip, or a quarrier climbs out faster than
// it climbed in.
export const CLIMB_PACE = QUARRY_WALK * 2;
