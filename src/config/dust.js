import { P } from './yard.js';

export let GRAV = 1;
// How far the haze comes apart into color at the edge of the view: a hair of
// red one side and cyan the other says the sky is being looked *through*.
// Nothing at the middle of the window, most at the edges, like glass.
//
export let HAZE_CA = 1.7;        // pixels of separation, at the edge of the view
// --- throwing somebody --------------------------------------------------------
// A body let go of is thrown off the same flick the dust is thrown with, but
// gentler: a person is heavier than a grain, and a body flung the length of
// the yard has a very long walk back. Knobs, because how hard a throw feels
// has to be tried rather than reasoned about.
export let THROW = 13;           // cursor pixels a millisecond, in pixels a frame
export let THROW_MAX = 26;       // and the hardest a grain will ever leave your hand
export let HURL = 0.55;        // share of the cursor's flick a body takes
export const HURL_MAX = 9;       // and the fastest it will ever leave your hand
export const HURL_DRAG = 0.995;  // air against it on the way

// Shaking one about: back and forth over a short window. Eight changes of
// direction is a deliberate, sustained rattling; four is a waggle done by
// accident while carrying somebody, and everything the body owned came off for
// it. Nothing comes loose until the shaking is half established (`shedLoad`'s
// gate).
export let SHAKE_TURNS = 8;
export const SHAKE_WINDOW = 700;   // inside this long, in ms
export const SHAKE_SHED = 2;       // grains shaken loose at every change of direction
// How far a mess will slide looking for ground that holds it, in cells. Past
// this it stays where it is: a mess sliding a hundred cells to find a footing
// would be a mess crossing the works on its own.
export const MESS_SLIDE = 14;
// A shed grain is a chip like every other loose thing, on the same arc, so all
// it needs is a shove, and the shove is the shaking itself.
export const SHAKE_FLING = 0.06;   // share of the hand's travel a shed grain takes
export const SHAKE_SCATTER = 1.1;  // and the spread either side of it
export const SHAKE_LIFT = 1.4;     // it comes out upwards before it comes down
export const DIZZY_MS = 2000;      // and how long the stars last afterwards
// A shaken body drops what it was holding, hat and all, and stands there seeing
// stars before it gathers itself. How far it wobbles while it does.
export const WOBBLE = P / 2;       // pixels either side of where it landed
export const WOBBLE_BEAT = 11;     // radians a second -- unsteady, not a shiver

// --- off the belt's head ----------------------------------------------------------
// The load leaves the head as a conveyor's does: the top of it flies on at the
// band's speed, the bottom curls round the head and drops short, so a column
// comes off as a fan rather than a slab. Shares of the band's speed.
export let BELT_THROW_LOW = 0.3;   // what the grain on the band itself leaves with
export let BELT_SCATTER = 0.18;    // and each grain's own give either side of its row's

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const DUST_KNOBS = [
  { key: 'GRAV', label: 'gravity', min: 0.1, max: 1.5, step: 0.05,
    get: () => GRAV, set: v => { GRAV = v; } },
  { key: 'HAZE_CA', label: 'haze fringe', min: 0, max: 6, step: 0.1,
    get: () => HAZE_CA, set: v => { HAZE_CA = v; } },
  { key: 'HURL', label: 'throw a body', min: 0, max: 2, step: 0.05,
    get: () => HURL, set: v => { HURL = v; } },
  { key: 'THROW', label: 'throw dust', min: 2, max: 40, step: 1,
    get: () => THROW, set: v => { THROW = v; } },
  { key: 'THROW_MAX', label: 'hardest throw', min: 4, max: 80, step: 1,
    get: () => THROW_MAX, set: v => { THROW_MAX = v; } },
  { key: 'BELT_THROW_LOW', label: 'belt head, low throw', min: 0, max: 1, step: 0.05,
    get: () => BELT_THROW_LOW, set: v => { BELT_THROW_LOW = v; } },
  { key: 'BELT_SCATTER', label: 'belt head, scatter', min: 0, max: 0.6, step: 0.02,
    get: () => BELT_SCATTER, set: v => { BELT_SCATTER = v; } },
  { key: 'SHAKE_TURNS', label: 'a shaking is', min: 2, max: 16, step: 1,
    get: () => SHAKE_TURNS, set: v => { SHAKE_TURNS = v; } }
];
