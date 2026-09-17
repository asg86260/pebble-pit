import { P } from './yard.js';

// --- what a thing takes to build ---------------------------------------------
// Time is a price like the rest of them, and past the bench every row pays it.
// See works.js and DESIGN.md, "Time is a price".
//
// Worker-seconds, not seconds: "how long with one pair of hands on it", so
// three quarriers take a bench out in a third of it. One table off the kind of
// thing a row sells, rather than a number on each row. Weighted light at the
// end the opening touches: at the start of a game nothing else is going on
// while a build runs, which is what makes a number here feel long.
export const WORK_BASE = {
  rung: 5,          // one step up a ladder
  place: 18,        // a bench in the cut, a furrow, a hat off the stand
  building: 45,     // the lab, the casino, the outhouse, the tower
  machine: 90       // the ram, the belt, the jaw, the tiller
};
// and it climbs with the rung the way the price does, so the first bench in the
// cut is half a minute and the fifth is nearer two
export const WORK_STEP = 1.35;
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

// --- lobbing a core ------------------------------------------------------------
// A core leaving a hauler's hands at the lip is thrown on the same arc as every
// other load (`aim` in dust.js), sized so the peak clears the lip by about this
// much rather than by however far the throw happens to travel.
export const CORE_LOB_H = 90;

// --- a building rising out of the ground ---------------------------------------
// The frame a `kind: 'building'` work lands, the yard shakes half as hard as
// for a rock landing (`SHAKE_LAND` in rock.js, which this is half of).
export const BUILD_SHAKE = 7.5;

// --- the house's own curve ------------------------------------------------------
// The house row has no rung, so `workFor` would give it a flat figure forever;
// its rung in all but name is how many rooms already stand. See the `work`
// override on `HOUSE_ROW` in upgrades.js, and `workFor` in works.js. Short at
// the near end: the first house is built by one body with nothing else going
// on, and eight seconds gets the settlement moving while you are still reading
// the yard.
export const HOUSE_WORK0 = 8;        // the first house, in worker-seconds
export const HOUSE_WORK_STEP = 1.15; // and each one after it
export const HOUSE_WORK_MAX = 120;   // never worse than the machines
