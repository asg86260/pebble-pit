import { P } from './yard.js';

// --- what a thing takes to build ---------------------------------------------
// Time is a price like the rest of them, and past the bench every row pays it.
// See works.js and DESIGN.md, "Time is a price".
//
// Worker-seconds, not seconds: "how long with one pair of hands on it", so
// three quarriers take a bench out in a third of it. One rule off where a row
// sits in its own progression, never a number on each row (the owner,
// 2026-10-29: "30 seconds should be the absolute max... most things should
// just cost 10-20 seconds"): a row's `along` is 0 at the foot of its ladder
// and 1 at the top, and its time is a line across the band its kind sells in.
// Nothing is shorter than the floor, which is long enough to see hands on it
// and the walk that feeds it, and nothing is longer than the cap, one body.
export const BUILD_MIN_S = 10;     // the shortest any build runs
export const BUILD_MAX_S = 20;     // the top of an ordinary ladder: most builds sit between these
export const BUILD_CAP_S = 30;     // nothing takes longer, one body, anywhere
// The band each kind of thing runs along, [foot, top]. A rung is the ordinary
// 10-20; a place (a bench, a plot) may end a little higher; a building ends at
// the cap, and a machine starts where an ordinary ladder ends.
export const BUILD_BANDS = {
  rung: [BUILD_MIN_S, BUILD_MAX_S],
  place: [BUILD_MIN_S, 25],
  building: [BUILD_MIN_S, BUILD_CAP_S],
  machine: [BUILD_MAX_S, BUILD_CAP_S]
};
// Where a row with no ladder of its own sits: a bare rung is a foot, and the
// first of a place, a building or a machine is a big build, so the top.
export const BUILD_ALONE = { rung: 0, place: 1, building: 1, machine: 1 };
// Named spots on the band for the odd row that is one of a short list (the
// shield rows, the first bench): the foot, the middle, the top.
export const ALONG = { first: 0, middle: 0.5, last: 1 };
// A row sold again and again with no end (a house, a pod) climbs this many
// copies to the middle of its band, then eases toward the top and never
// passes it: n / (n + this).
export const BUILD_REPEAT_HALF = 12;
// a body does one second of building a second -- the lab's own figure, because
// it is the same kind of work
export const BUILD_EFFORT = 1;

// The cap of one spare body per build is written into `rebalance` in
// upgrades.js, the one place that decides who is building. See DESIGN.md,
// "The build yard".

// --- the farm's and the quarry's own sheds -----------------------------------
// The two stations with a board and nothing to hold it get a small shed on the
// station's left edge, in the same black box and white door as every other
// building. Small on purpose: it is there to give the board something to stand
// over.
export const FARM_SHED_W = P * 6;
export const FARM_SHED_H = P * 7;
export const QUARRY_SHED_W = P * 6;
export const QUARRY_SHED_H = P * 7;
// bare ground kept between a shed and the working ground it stands beside
export const SHED_GAP = P * 3;
// The quarry's shed keeps two cells more: its working ground is the mouth of a
// hole with the bridge's ramp climbing away from it, and at three cells the
// ramp cut under the shed's legs.
export const QUARRY_SHED_GAP = SHED_GAP + P * 2;

// --- the builders' work jig ---------------------------------------------------
// A builder at a busy site swings a hammer in bursts: `BUILD_HITS_MIN`..`MAX`
// fast swings in one place, a step sideways, another burst. A steady bounce on
// one spot is bouncing, not working. Each landing throws grit (grit.js), one
// puff per hit, tied to the blow rather than to a timer so the dust reads as
// coming *off* the hammer.
export const BUILD_HAMMER_MS = 300;   // one swing, up and down
// How high the body rides on the backswing. Low: this engine cannot draw an
// arm, so the body dips and the lunge (LOOK in render.js) throws it into the
// work; a whole body leaping two cells reads as a bounce however fast it goes.
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
// The throw has to clear the ground line or it is not a throw: a chip that
// tops out under half a cell lives and dies in the black row directly above
// the black ground line, drawn and never visible.
export const GRIT_SPREAD = 1.2;   // sideways throw, px per frame
export const GRIT_RISE = 3.2;     // and upward, enough to top out ~3 cells up
export const GRIT_GRAV = 26;      // px per second per second, pulling them back
export const GRIT_LIFE = 0.42;    // seconds -- gone before the next blow lands
// The same chips struck in the deep, where the water has them. The throw is
// cut short by the drag, the fall is slow enough to watch, and they lie on the
// floor a while: silt stirred up, not grit flung. The pull is small against the
// drag, so a chip sinks at about pull / -ln(drag) px a frame, two cells a
// second, rather than accelerating.
export const GRIT_SEA_SPREAD = 1.2;  // sideways throw, px per frame
export const GRIT_SEA_RISE = 1.3;    // and upward, topping out ~4 cells up
export const GRIT_SEA_DRAG = 0.1;    // what is left of a chip's speed after a second
export const GRIT_SEA_GRAV = 0.5;    // px per frame per second, the sink
export const GRIT_SEA_LIFE = 2.0;    // seconds -- several bursts hang at once

// --- a building rising out of the ground ---------------------------------------
// The frame a `kind: 'building'` work lands, the yard shakes half as hard as
// for a rock landing (`SHAKE_LAND` in rock.js, which this is half of).
export const BUILD_SHAKE = 7.5;

