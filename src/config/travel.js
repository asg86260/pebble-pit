import { QUARRY_WALK } from './quarry.js';
import { P } from './yard.js';

// --- Track TRAVEL: a body walks to its work ---------------------------------

// Moving somebody between jobs is not sacking one and hiring another: the same
// body walks over, and this is the pace it goes at.
//
// It was 0.9 first, which was a tax nobody had costed: the yard is 3600px
// across, so the lab to the pit was a sixty-five second walk and moving one body
// was a minute of watching it.
//
// It is the crew's own legs now, and this is the floor under them: whatever a
// body walks at with its hands free, or this, whichever is quicker. A pace
// upgrade is a pace upgrade -- a crew you have paid to make quick that still
// ambles across the yard when you move it is the upgrade not applying to the
// one trip you are actually watching. The floor is what stops the other end of
// it: at level nothing the crew's own pace is slower than this, and a walk that
// got *longer* because nothing had been bought yet is a walk nobody would read
// as a body going somewhere.
// Raised with it, and by the same proportion, so the two keep the relationship
// the comment above describes: an empty body still walks at this floor rather
// than at its carrying speed, and a walk still never gets longer for having
// bought nothing.
export const COMMUTE_PACE = 4.6;
// Near enough to have arrived. A station is a place rather than a pixel, and a
// body made to land exactly on one would shuffle on the spot for ever.
export const COMMUTE_SLOP = P * 2;
// How fast a body gets down into the quarry and back out of it again. Going to work
// somewhere else starts with getting up to the level of the ground, and it has
// to be the same number at both ends of that trip or a quarrier climbs out
// faster than it climbed in.
export const CLIMB_PACE = QUARRY_WALK * 2;
// How long a lab with nothing to research keeps somebody standing in it before
// they let themselves out and go back to carrying dust.
//
// Twenty seconds, not four. Four was long enough to prove the rule and far too
// short to play with: staffing the lab and then starting the work is the
// obvious order to do it in, and the walk over is twenty seconds by itself, so
// a body sent to an empty lab turned round and left before the player could open
// the board and pay for anything. This is the grace to get the work started.
export const LAB_IDLE_MS = 20000;
