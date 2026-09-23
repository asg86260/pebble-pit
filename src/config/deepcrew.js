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
// The gatherers: the deep's crew on no weapon (`S.deepCrew`, set at the
// shaft). They keep a hauler's load and pace (`haulCap`, `haulSpeed`), scoop
// at GATHER_SCOOP, and wait by the crusher on a bare floor.
export const GATHER_SCOOP = 8;       // scales a second, into a hauler's arms

// A body thrown in the deep (crew/falls.js): the water takes the throw off it
// and it sinks, slowly, to the floor it is over.
export const SINK_PULL = 0.06;       // px a frame a frame, down
export const SINK_DRAG = 0.93;       // what is left of its speed after a frame


// --- the snatch ----------------------------------------------------------------------
// The pair walk to the plank and stand at its edge, something comes up out of
// the surface a cell a frame, takes one of them and goes back down, and the
// surface closes over it.
export const SNATCH_RISE = P * 16;     // how far over the surface the head comes up
export const SNATCH_EDGE = P * 4;      // how far apart the two stand at the edge, one nearer the water
export const SNATCH_LOOK_MS = 1400;    // stood at the edge before anything comes up
export const SNATCH_TAKE_MS = 900;     // the head held over them, him in its jaws, before it goes
export const SNATCH_CLOSE_MS = 3600;   // the portal closing; the one left standing leaps in before it shuts
// The snatch goes through a portal in the abyss's own surface (DESIGN.md,
// "Two crews and a portal"): a whirlpool opening on the liquid before the
// head comes up out of it, and her leap into it as it closes.
export const SNATCH_PORTAL_MS = 1100;  // the whirlpool opening on the surface
export const SNATCH_LEAP_AT = 0.35;    // how far into the closing she runs and jumps
export const SNATCH_LEAP_MS = 750;     // her leap, edge to whirlpool
export const SNATCH_LEAP_H = P * 7;    // and how high it arcs
// The portal itself: a ring turning on the surface over the shaft, this wide
// and this deep, and how long the conjured one takes to open.
export const PORTAL_RX = P * 11;
export const PORTAL_RY = P * 3;
export const PORTAL_OPEN_MS = 1500;
export const PORTAL_TURN_MS = 2400;    // one turn of its rim
// The wizards' portal is summoned, not bought outright: a wizard flies out
// over the pit and pours it for this many wizard-seconds, from this high
// over the surface.
export const PORTAL_POUR_S = 18;
export const PORTAL_HOVER = P * 18;
// What the wizards ask to hold one open: the dome's shape, smaller -- a
// first guess, like every price of the second half.
export const PORTAL_BILL = [['dust', 120000], ['shard', 2500], ['spore', 5000], ['spark', 2500]];
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
