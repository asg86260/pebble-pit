// --- the deep: the serpent's half ---------------------------------------------
// The place under the drowned pit, the serpent in it, and the weapons made of
// it. See "The serpent: the second half of the game" in DESIGN.md and
// docs/wave-serpent.md. Every number here is a first guess: the heals and the
// depths are the second half's `ABYSS_AT`, and they are tuned against the
// first half's length once the whole half can be played.
import { P } from './yard.js';

// --- where it is ---------------------------------------------------------------
// The deep lies under the world, below the yard's bottom edge, so a body that
// goes down the shaft has somewhere real to arrive and every position in it is
// an ordinary world position. The view is a camera move to it (view.js).
export const DEEP_GAP = P * 20;      // world px of shaft between the yard's bottom and the deep's ceiling
export const DEEP_H = P * 130;       // the deep's ceiling to its floor
export const DEEP_LEFT = P * 140;    // how far it reaches left of the pit's near lip
export const DEEP_W = P * 520;       // and across
export const DEEP_MOUTH = P * 40;    // the shaft, in from the pit's near lip: where a body goes in and comes up
// The stations stand on the deep's floor, at these fractions of its width from
// its left edge. The altar is the deep's bench: punching, and the doors.
export const DEEP_SPOTS = { crusher: 0.055, altar: 0.16, well: 0.32, font: 0.48, circle: 0.64, spire: 0.82, pods: 0.935 };
// The pods: the deep's houses, a capsule a body, stacked POD_COLS abreast from
// the floor up at the deep's far right end (DESIGN.md, "One crew, two homes").
export const POD_W = P * 7;
export const POD_H = P * 5;
export const POD_GAP = P;
export const POD_COLS = 4;
// A station's footprint on the floor and how tall it stands: its dome, which
// is where the pointer opens its board (the sprite at STATION_SCALE, 16 cells
// across and at most 14 up, under DOME_PAD, DOME_WALL and the arch; see
// config/deepdraw.js).
export const DEEP_STAND_W = P * 30;
export const DEEP_STAND_H = P * 40;

// --- the crusher ------------------------------------------------------------------
// The purse's mouth, at the deep's left end (DESIGN.md, "The crusher"): a
// scale is money once it lands in the hopper, and not before. The hopper is
// the top of the machine, narrower than its body.
export const CRUSHER_W = P * 30;
export const CRUSHER_H = P * 30;
export const HOPPER_W = P * 20;      // the mouth across the top
export const HOPPER_LIP = P * 3;     // how far down into the hopper a scale has to fall to be taken
export const CRUSH_SHOW_MS = 600;    // the rollers turn this long after a scale goes in
// A gatherer's toss: from beside the crusher up and over into the hopper, on
// an arc drawn in the water rather than thrown on its gravity, so every scale
// a gatherer throws goes in.
export const GATHER_TOSS_FRAMES = 40;       // frames from the hand to the hopper
export const GATHER_TOSS_RISE = P * 14;     // how high over the lip the arc peaks
export const GATHER_TOSS_FROM = P * 8;      // how far out from the crusher's side a gatherer stands to toss
export const GATHER_TOSS_STAGGER = 3;       // frames between one scale of a load leaving and the next
// A hand's flick in the water: the yard's throw, damped, so a handful let go
// over the hopper drops in rather than sailing past it.
export const DEEP_THROW = 0.25;

// --- the serpent's body ------------------------------------------------------------
// A chain of segments across the deep, swaying on its own clock: nothing in the
// deep is still. `coilAt` in deep/place.js is the one reader.
export const COIL_SEGS = 56;         // segments, head to tail
export const COIL_X0 = 0.06;         // the head's end, a fraction of DEEP_W
export const COIL_X1 = 0.94;         // the tail's end
export const COIL_Y = 0.5;           // its centerline, a fraction of DEEP_H down from the ceiling
export const COIL_AMP = P * 9;       // how far it swings either side of that
export const COIL_WAVES = 3;         // waves along its length
export const COIL_SWAY_MS = 7000;    // one sway
export const COIL_THICK = P * 5;     // the body's width
export const BELLY_AT = 0.58;        // where he is held, a fraction of the way from head to tail
export const SPLIT_LENGTHS = 5;      // stage three: the coil divides into this many lengths

// --- the fight ---------------------------------------------------------------------
// Four defenses, one a stage. The wound is held open against the heal and
// breaks the stage at its depth; the fourth depth is the belly.
export let SERPENT_HEAL = [1, 6, 20, 60];           // wound a second it closes, a stage
export let SERPENT_WOUND = [60, 900, 6000, 30000];  // the depth that breaks it, a stage
// How hard each defense is on each weapon: a multiplier, a stage. The answer
// to a stage is the big number in its column; a glancing weapon still lands a
// little, so no station goes dead when the stage turns.
export const SERPENT_DEFENSE = {
  punch:   [1, 0.15, 0.1, 0.05],
  lance:   [1, 1, 0.3, 0.1],
  grenade: [1, 0.5, 1, 0.1],
  beam:    [1, 1, 1, 1],
  star:    [1, 1, 1, 1]
};
export const FADE_UNLIT = 0.1;       // stage four: what a hit on a coil no wizard has lit is worth
export const SIGIL_HEAL_CUT = 0.12;  // the heal a drawn sigil takes off, each
export const SIGIL_CUT_MAX = 0.8;    // and all of them together, at most
export const CURSE_CUT_MAX = 0.6;    // the wizards' curse, at most, on top

// --- scales ------------------------------------------------------------------------
// A hit knocks scales loose in proportion to what it did. They fall through
// the water on the deep's own gravity and settle on its floor, which is the
// deep's purse: a scale is counted when it lands, like a grain in the pit.
export const SCALE_PER_DMG = 1;      // scales a unit of damage sheds
export const SCALE_HIT_MAX = 12;     // and at most this many off one hit, the rest counted as they land nearby
export const DUST_PER_SCALE = 10;    // what a scale is worth against dust (DUST_PER in upgrades/price.js)
export const DEEP_BED_ROWS = 40;     // the floor's plot of scales: this many cells deep at most
// A scale knocked loose leaves the hit with a little scatter of its own, so a
// hit sheds a cloud rather than a column. Its tone is dealt near the middle
// of the shades: a bed of one tone is printed paint.
export const SCALE_KICK = 1.2;       // px a frame, the most a loosed scale starts moving
export const SCALE_SHADE = 3;        // the shade a scale is dealt near (SHADES)
export const SCALE_SPREAD = 1;       // and how far either side
// Paying lifts scales off the bed to the station that took them. A payment of
// thousands is drawn as a stream of a few, each one standing for the rest.
export const LIFT_PACE = 3;          // px a frame a paid scale rises
export const LIFT_FLECKS = 40;       // the most flecks one payment sends up
export const LIFT_STAGGER = 2;       // frames between one fleck leaving and the next

// --- the water ---------------------------------------------------------------------
// Buoyant and slowed: everything sinks at a fraction of a grain's fall and is
// pushed sideways by a current that turns on its own clock.
export let DEEP_GRAV = 0.05;         // px a frame a frame, against the yard's GRAV of 1
export let DEEP_DRAG = 0.95;         // velocity kept a frame
export let DEEP_CURRENT = 0.3;       // px a frame, the current's push at its strongest
export const DEEP_CURRENT_MS = 11000; // one turn of it
// Bodies in the deep swim, at a share of their walk: the water is thick.
export const SWIM_PACE = 0.5;

// --- the weapons -------------------------------------------------------------------
// What a rung buys is in LADDERS (config/rungs.js): punch, brawl, lance,
// lancehold, grenade, grenadepace, sigil, beam, curse. These are the fixed
// parts of each weapon.
export const LANCE_DRAW_S = 2;       // seconds at the well to draw a lance
export const LANCE_FLY = 0.6;        // seconds a thrown lance is in the water
export const GRENADE_DRAW_S = 3;     // seconds at the font to hold a grenade
export const GRENADE_R = P * 14;     // a burst's rings reach this far
export const GRENADE_RING_S = 0.8;   // and take this long to
export const SIGIL_DRAW_S = 20;      // seconds a scribe takes to draw one circle
export const BEAM_REACH = P * 140;   // how far a wizard's beam reaches from the spire
// The weapons that hurt for as long as they are held -- a stuck lance, a beam
// -- strike in ticks of this long, each tick a hit that sheds its own scales:
// a hit a frame would shed a scale a frame whatever the damage was.
export const DOT_TICK_S = 0.5;
export const PUNCH_REACH = P * 3;    // how close to a segment a brawler has to be to land one
export const LANCE_THROW_R = P * 24; // a lancer throws from this far off the coil
export const GRENADE_FLY_S = 1.6;    // a grenade's aimed time in the water, the font to the coil
export const SIGIL_GAP = P * 10;     // circles drawn this far apart, either side of the circle
export const BEAM_LIGHT = 4;         // segments either side of where a beam touches that it lights
// The called star: a machine, in sparks, with a short spark ladder of its own
// (like MACHINE_TUNE_SPARKS). A star every STAR_EVERY_S[rung] seconds, doing
// STAR_DMG[rung] where it lands.
export const STAR_SPARKS = 400;                  // the machine
export const STAR_TUNE_SPARKS = [600, 1000, 1600]; // its three rungs
export const STAR_EVERY_S = [90, 70, 50, 35];
export const STAR_DMG = [3000, 4500, 7000, 10000];
export const STAR_FALL_S = 4;        // from the yard's sky to the surface
export const STAR_SKY_H = P * 120;   // how high over the ground it is first seen
export const STAR_UNDER_S = 0.8;     // under the surface, down the shaft, unseen
export const STAR_DEEP_S = 1.5;      // from the deep's ceiling to the coil

export const DEEP_KNOBS = [
  { key: 'SERPENT_HEAL_1', label: 'serpent heal, bare', min: 0, max: 20, step: 0.5,
    get: () => SERPENT_HEAL[0], set: v => { SERPENT_HEAL = [v, ...SERPENT_HEAL.slice(1)]; } },
  { key: 'SERPENT_HEAL_2', label: 'serpent heal, warded', min: 0, max: 100, step: 1,
    get: () => SERPENT_HEAL[1], set: v => { SERPENT_HEAL = [SERPENT_HEAL[0], v, ...SERPENT_HEAL.slice(2)]; } },
  { key: 'SERPENT_HEAL_3', label: 'serpent heal, split', min: 0, max: 300, step: 5,
    get: () => SERPENT_HEAL[2], set: v => { SERPENT_HEAL = [...SERPENT_HEAL.slice(0, 2), v, SERPENT_HEAL[3]]; } },
  { key: 'SERPENT_HEAL_4', label: 'serpent heal, fading', min: 0, max: 1000, step: 10,
    get: () => SERPENT_HEAL[3], set: v => { SERPENT_HEAL = [...SERPENT_HEAL.slice(0, 3), v]; } },
  { key: 'SERPENT_WOUND_SCALE', label: 'serpent wound depths, x', min: 0.1, max: 5, step: 0.1,
    get: () => SERPENT_WOUND[0] / 60,
    set: v => { SERPENT_WOUND = [60, 900, 6000, 30000].map(d => Math.round(d * v)); } },
  { key: 'DEEP_GRAV', label: 'deep gravity', min: 0.01, max: 0.3, step: 0.01,
    get: () => DEEP_GRAV, set: v => { DEEP_GRAV = v; } },
  { key: 'DEEP_DRAG', label: 'deep drag', min: 0.8, max: 1, step: 0.005,
    get: () => DEEP_DRAG, set: v => { DEEP_DRAG = v; } },
  { key: 'DEEP_CURRENT', label: 'deep current', min: 0, max: 1.5, step: 0.05,
    get: () => DEEP_CURRENT, set: v => { DEEP_CURRENT = v; } }
];
