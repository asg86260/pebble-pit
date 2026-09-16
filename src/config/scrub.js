import { P } from './yard.js';

export const SCRUB_CHUTE = 5;        // cells the recycler arm reaches out from the wall
export const SCRUB_ARM = 3;          // courses of daylight kept under it: a body is three

// Set against SMOG_PER_DUST: the house takes specks out of a sky that is
// filled at the same pace, and what it is worth against the yard is the only
// number here that decides anything.
export let SCRUB_PULL = 29.25;       // motes a second, per body in it -- per mote
// The draught you can see even when there is nothing in the air to be pulled:
// a few faint specks a second falling in from all round the hood, which are
// not pollution, are worth nothing, and are counted nowhere. A machine you
// cannot tell is running is a machine you stop believing in. Very faint on
// purpose, so it is never mistaken for the haze it is pulling. No reach: a
// mouth takes its share of the whole sky, not the yard of it over its own
// roof (`eat` in smog.js).
export const DRAUGHT_PER_S = 18;     // specks a second, per body inside
export const DRAUGHT_FROM = 190;     // how far out they come in from
export const DRAUGHT_PACE = 96;      // and pixels a second they close at
export const DRAUGHT_INK = 0.55;     // against the haze's own weight
// How far either side of the fan a climbing puff is close enough to be taken.
// Generous, because a plume goes up in a column and the house wants the whole
// of it, not the one mote that happened to line up with the throat.
export const SCRUB_CATCH = 260;
// What the house puts out of the back before the recycler is fitted: the
// filters have to be emptied somewhere, and the crew shovel it like any other
// mess.
export const SCRUB_PER_MUCK = 135;  // motes caught per load out of the back -- per mote
export const SCRUB_MUCK = 1;        // and how much a load is, in cells deep
// The house's own ladder: a machine dirties the sky far harder than hands and
// never stops for a cigarette, so a house that could only pull at the rate it
// was built with stops being an answer the moment the yard is worth having
// one. What a fan pulls at each rung, and what each rung costs, is a list in
// config/rungs.js: if the sky comes under control too early on a real yard,
// that is the dial.
export const RECYCLE_SHARDS = 120;    // and what turns catching into keeping
export const RECYCLE_TONE = 4;      // the shade it comes back around: ordinary dust, give or take one
export const RECYCLE_PER = 42;      // motes caught per grain of dust it gives back -- per mote

export const TO_SCRUB = -2586;       // past the lab, at the quiet end of the walk
// Nineteen cells across: the tower is the eleven cells the hood has flared
// down to, and the four either side at the top are wall with sky behind them.
// Odd across on purpose, so the taper closes to one cell dead on the middle
// column and the shaft and the door have a middle column to stand on.
//
// Twenty down is the front read off in order: five courses of hood, the course
// the throat closes in, a solid course under it, eight of shaft for the
// bellows, a solid course under that, and DOOR_H of foot for the door to stand
// in. Change any of those in render.js and this has to move with it. It grows
// upward (scrub.y is the ground less the height), and the chute and the outlet
// are measured off the foot, so neither moves with the height.
export const SCRUB_W = P * 19;
export const SCRUB_H = P * 20;
// The bellows on its front: how many folds it has, and how fast they go. One
// bellows whoever is in there, beating faster with every body up to four;
// nothing caps this roster the way a bench caps the cut, so one fold to a body
// would lie from five on, and the roster under the building already carries
// the number.
export const SCRUB_FOLDS = 3;
export const SCRUB_PUMP = 3.2;       // folds a second, at one body in the house

// The dev panel's row for the pull: the house's whole ladder scales off it,
// so it is the one dial that moves the sky bargain.
export const SCRUB_KNOBS = [
  { key: 'SCRUB_PULL', label: 'house pull', min: 2, max: 60, step: 0.25,
    get: () => SCRUB_PULL, set: v => { SCRUB_PULL = v; } }
];
