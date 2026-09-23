// --- the deep's crew: the swim, the shaft, the caps, the snatch and the freeing ---
// Owned by track CREW of docs/wave-serpent.md. Every number the track needs
// lives here; a magic number in a module is a bug.
import { P } from './yard.js';

// --- the shaft -------------------------------------------------------------------
// The way down from the plank over the drowned pit to the deep's floor is a
// link like a ladder (route.js), but it is a swim through the liquid rather
// than a climb, and it is long: this, times the body's own pace, is how fast it
// goes. A share of the walking pace rather than a speed of its own, so the
// commute ladder hurries the shaft with everything else.
export let SHAFT_PACE = 0.6;

// --- how many each station of the deep holds ---------------------------------------
// `capOfBare` in levels.js; each is nought until its door is open.
export const BRAWL_CAP = 12;         // at the altar, from the snatch
export const LANCE_CAP = 12;         // at the well
export const GRENADE_CAP = 8;        // at the font
export const SCRIBE_CAP = 4;         // at the circle
export const WARLOCK_CAP = 6;        // at the spire

// A deep station's roster stands on the deep's floor in front of it, this far
// up off the floor, where the camera locked to the deep can see it (the deep
// view's bottom edge is the floor).
export const DEEP_POST_UP = P * 4;

// --- the snatch ----------------------------------------------------------------------
// The pair walk to the plank and stand at its edge, something comes up out of
// the surface a cell a frame, takes one of them and goes back down, and the
// surface closes over it.
export const SNATCH_RISE = P * 16;     // how far over the surface the head comes up
export const SNATCH_EDGE = P * 4;      // how far apart the two stand at the edge, one nearer the water
export const SNATCH_LOOK_MS = 1400;    // stood at the edge before anything comes up
export const SNATCH_TAKE_MS = 900;     // the head held over them, him in its jaws, before it goes
export const SNATCH_CLOSE_MS = 2600;   // the surface closing, and the one left standing at the edge
// The skip (space, held) does not cut to the end -- nothing teleports -- it
// plays what is left of the beat this many times faster.
export const SNATCH_HURRY = 4;

// --- the freeing -----------------------------------------------------------------------
// The fourth defense broken: the belly opens and he comes out of it.
export const FREED_OPEN_MS = 2400;     // the belly opening before he is out

export const DEEP_CREW_KNOBS = [
  { key: 'SHAFT_PACE', label: 'shaft pace, x', min: 0.1, max: 3, step: 0.1,
    get: () => SHAFT_PACE, set: v => { SHAFT_PACE = v; } }
];
