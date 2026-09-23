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
export const DEEP_SPOTS = { altar: 0.16, well: 0.32, font: 0.48, circle: 0.64, spire: 0.82 };
export const DEEP_STAND_W = P * 16;  // a station's footprint on the floor
export const DEEP_STAND_H = P * 14;  // and how tall it stands

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

// --- the water ---------------------------------------------------------------------
// Buoyant and slowed: everything sinks at a fraction of a grain's fall and is
// pushed sideways by a current that turns on its own clock.
export let DEEP_GRAV = 0.05;         // px a frame a frame, against the yard's GRAV of 1
export let DEEP_DRAG = 0.95;         // velocity kept a frame
export let DEEP_CURRENT = 0.3;       // px a frame, the current's push at its strongest
export const DEEP_CURRENT_MS = 11000; // one turn of it

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
// The called star: a machine, in sparks, with a short spark ladder of its own
// (like MACHINE_TUNE_SPARKS). A star every STAR_EVERY_S[rung] seconds, doing
// STAR_DMG[rung] where it lands.
export const STAR_SPARKS = 400;                  // the machine
export const STAR_TUNE_SPARKS = [600, 1000, 1600]; // its three rungs
export const STAR_EVERY_S = [90, 70, 50, 35];
export const STAR_DMG = [3000, 4500, 7000, 10000];
export const STAR_FALL_S = 4;        // from the yard's sky to the surface

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
