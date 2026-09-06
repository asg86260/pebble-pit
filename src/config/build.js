import { P } from './yard.js';

// --- what a thing takes to build ---------------------------------------------
// Time is a price like the rest of them, and past the bench every row pays it.
// See works.js and DESIGN.md, "Time is a price".
//
// Worker-seconds, not seconds: read a figure here as "how long with one pair of
// hands on it", and three quarriers in the cut take a bench out in a third of
// it. One table off the kind of thing a row sells, rather than a number written
// on each of thirteen rows -- a constant a case is the bug and not the fix, and
// thirteen of them is thirteen things to keep in step with a ladder that grows a
// sixth rung tomorrow.
//
// Halved and then some, weighted at the end of the table the opening actually
// touches. The intro was a slog: with `BUILD_GANG` at one these are wall-clock
// seconds for your first hire standing alone at a site, and ninety of them
// before the lab exists is ninety seconds of watching one square hammer. What
// makes a number here feel long is not its size but what else is going on while
// it runs, and at the start of a game the answer is nothing.
export const WORK_BASE = {
  rung: 5,          // one step up a ladder
  place: 18,        // a bench in the cut, a furrow, a hat off the stand
  building: 45,     // the lab, the school, the outhouse, the tower
  machine: 90       // the ram, the belt, the jaw, the tiller
};
// and it climbs with the rung the way the price does, so the first bench in the
// cut is half a minute and the fifth is nearer two
export const WORK_STEP = 1.35;
// a body does one second of building a second -- the lab's own figure, because
// it is the same kind of work and a second rate for it would be two numbers
// meaning one thing
export const BUILD_EFFORT = 1;

// --- wave7b-build: the build yard ---------------------------------------------
// `BUILD_GANG` is gone. Its cap ("one spare body per build") was the temporary
// answer to who builds things; the answer is a builder now -- a post at the
// construction bench -- and the gang's pace meaning returns as the `buildpace`
// rung below. See DESIGN.md, "The build yard".
//
// The construction bench itself: a trestle beside the work bench, sized so the
// hammer lying on it reads at a glance and no wider -- it is furniture, not a
// station you look at.
export const BUILDBENCH_W = P * 8;
export const BUILDBENCH_H = P * 4;
// How much faster a builder works per `buildpace` rung -- the same step the
// work table climbs by, so a rung of pace pays back exactly one rung of climb.
export const BUILD_PACE_STEP = 1.35;
// How long the two ladders are. Posts: 0..2, so at the top three builds rise at
// once; pace: three rungs, the kit ladders' length, because it is gear.
export const BUILD_POST_RUNGS = 2;
export const BUILD_PACE_RUNGS = 3;
// What the first rung of each costs. Posts are plant, so they are priced in the
// machines' currency; pace is labor, priced in the yard's crop.
export const BUILDPOSTS_SPARKS0 = 40;
export const BUILDPACE_SPORES0 = 12;
// The bench itself: two cores -- a place, priced like the quarry -- and the
// dust every bill past tier one asks for, a shade under the quarry's.
export const BUILDBENCH_CORES = 2;
export const BUILDBENCH_DUST = 1500;

// --- the farm's and the quarry's own sheds -----------------------------------
// The two stations with a board and nothing to hold it -- see C5 in
// wave-feedback3.md. A small shed on the station's left edge, in the same black
// box and white door every other building here is drawn in. Small on purpose:
// it is there to give the board something to stand over, not to be the thing
// you look at.
export const FARM_SHED_W = P * 6;
export const FARM_SHED_H = P * 7;
export const QUARRY_SHED_W = P * 6;
export const QUARRY_SHED_H = P * 7;
// bare ground kept between a shed and the working ground it stands beside
export const SHED_GAP = P * 3;

// --- the builders' work jig ---------------------------------------------------
// B2 in wave-feedback3.md, rewritten: a builder at a busy site swings a hammer.
//
// It used to hop -- one slow bounce, up and down, for ever. Two things were
// wrong with that beyond the speed. A body going up and down on one spot at a
// steady rate is a body *bouncing*, and bouncing is not working; and the beat
// was 1400ms, which is a swing you can watch land, get bored of, and watch land
// again. Work is a burst: a few hits in one place, a shuffle along, a few more.
//
// So: a fast swing, `BUILD_HITS_MIN`..`MAX` of them in a row, then a step
// sideways and another burst. Each landing throws grit (see grit.js) -- one
// puff per hit, tied to the blow rather than to a timer of its own, which is
// what makes the dust read as coming *off* the hammer.
export const BUILD_HAMMER_MS = 300;   // one swing, up and down
// How high the body rides on the backswing. Low: a hammer swing is an arm, and
// this engine cannot draw an arm, so the body dips and the lunge (see LOOK in
// render.js) throws it into the work. A whole body leaping two cells was the
// old hop, and it read as a bounce however fast it went.
export const BUILD_HAMMER_H = 0.9;
// hits in one place before moving along, and how far along it then moves
export const BUILD_HITS_MIN = 3;
export const BUILD_HITS_MAX = 6;
export const BUILD_SHIFT = P * 4;
// how far either way of its mark a builder will work before turning back
export const BUILD_SHIFT_SPAN = P * 10;
// the beat it rests between bursts -- the pause is what makes a burst a burst
export const BUILD_REST_MS = 420;

// --- grit off a strike ---------------------------------------------------------
// What a hammer throws up. Not smoke: see the head of grit.js for why these are
// a separate set of numbers rather than an argument to `puff`.
export const GRIT_MOTES = 4;      // chips per blow
// The throw has to clear the ground line or it is not a throw.
//
// These were a third of what they are, and the arithmetic is worth keeping
// because the picture gave nothing away: at 1.5px a frame against this gravity
// a chip tops out under three pixels up, which is half a cell. Every chip
// therefore lived and died inside the one row of pixels directly above the
// ground line -- drawn, correctly, in black, against the black ground line.
// Twelve of them in the air and not one was visible. A thrown thing needs an
// arc taller than the thing it is thrown past.
export const GRIT_SPREAD = 1.2;   // sideways throw, px per frame
export const GRIT_RISE = 3.2;     // and upward, enough to top out ~3 cells up
export const GRIT_GRAV = 26;      // px per second per second, pulling them back
export const GRIT_LIFE = 0.42;    // seconds -- gone before the next blow lands

// --- lobbing a core ------------------------------------------------------------
// B3 in wave-feedback3.md: a core leaving a hauler's hands at the lip is
// thrown, not dropped -- the same arc every other load in this yard is thrown
// on (see `aim` in dust.js), sized so the peak clears the lip by about this
// much rather than by however far the throw happens to travel.
export const CORE_LOB_H = 90;

// --- a building rising out of the ground ---------------------------------------
// #3, "Wave 3.1" in wave-feedback3.md: the frame a `kind: 'building'` work
// lands, the yard feels it the way it feels a rock landing -- half as hard,
// because a building settling into its footprint is a smaller event than a
// boulder hitting the floor of the pit. See `SHAKE_LAND` in rock.js, which
// this is half of.
export const BUILD_SHAKE = 7.5;

// --- the house's own curve ------------------------------------------------------
// #8, "Wave 3.1" amendment: the house row has no rung, so `workFor` gave it a
// flat 90 worker-seconds forever -- a straight ninety-second stand for your
// very first hire, alone, now that BUILD_GANG is one. It has a rung in all but
// name: how many rooms already stand. See the `work` override on `HOUSE_ROW`
// in upgrades.js, and `workFor` in works.js, which reads it.
//
// Cut again, at the near end. Twenty seconds for the very first house is twenty
// seconds with one body, no second job to cut to and nothing else built -- the
// longest-feeling twenty seconds in the game. Eight gets the settlement moving
// while you are still reading the yard. The step is very slightly gentler and
// the cap a good deal lower, so the ladder still climbs and the top of it is no
// longer worse than putting up a machine.
export const HOUSE_WORK0 = 8;        // the first house, in worker-seconds
export const HOUSE_WORK_STEP = 1.15; // and each one after it
export const HOUSE_WORK_MAX = 120;   // never worse than the machines
