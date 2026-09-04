import { P } from './yard.js';

export let GRAV = 1;
// What a knocked-loose grain does on its way off. It is a blow, not a delivery:
// a pop off the face and a little sideways from the hit, and where it comes down
// is wherever the ground is under it when it gets there.
// How far the haze comes apart into colour at the edge of the view. A lens does
// this and a flat black rectangle does not, which is the point: the sky is the
// one thing in this yard drawn as a field rather than as objects, and a hair of
// red one side and cyan the other is enough to say it is being looked *through*.
// Nothing at the middle of the window, most at the edges, like the glass it is
// pretending to be.
//
export let HAZE_CA = 1.7;        // pixels of separation, at the edge of the view
// --- throwing somebody --------------------------------------------------------
// A body let go of used to drop straight down, however you were moving when you
// let go: the one thing in the yard that fell out of the air with no regard for
// the hand that had hold of it. It is thrown now, off the same flick the dust
// is thrown with.
//
// Gentler than dust, because a person is heavier than a grain and because a
// body flung the length of the yard is a body with a very long walk back.
// A flick of the cursor, in the grain it lets go of. These were in hands.js and
// are here so they can be turned while the game is running: how hard a throw
// feels is the sort of thing that has to be tried rather than reasoned about.
//
// They were tuned when a throw was pixels a *frame*, so on a screen drawing a
// hundred and sixty-five of them a throw went nearly three times as far as it
// was written to. Now that the yard moves on the clock (see `frames`), the same
// numbers are the same throw everywhere -- which is correct, and reads as weak
// to a hand used to the old one. So they are raised: half again on the flick,
// and half again on the cap.
export let THROW = 13;           // cursor pixels a millisecond, in pixels a frame
export let THROW_MAX = 26;       // and the hardest a grain will ever leave your hand
export let HURL = 0.55;        // share of the cursor's flick a body takes
export const HURL_MAX = 9;       // and the fastest it will ever leave your hand
export const HURL_DRAG = 0.995;  // air against it on the way

// Shaking one about. Back and forth over a short window is a shake rather than a
// throw, and what it earns is a moment of not knowing which way is up.
// Changes of direction that count as a shaking. Four was a quick waggle --
// easy to do by accident while just carrying somebody about -- and everything
// the body owned came off for it. Eight is a deliberate, sustained rattling:
// you have to mean it. Nothing at all comes loose until the shaking is half
// established (see `shedLoad`'s gate), so the first few turns cost nothing.
// A knob, because how hard "shaken" should be is a matter of feel.
export let SHAKE_TURNS = 8;
export const SHAKE_WINDOW = 700;   // inside this long, in ms
export const SHAKE_SHED = 2;       // grains shaken loose at every change of direction
// What a shaken-loose grain leaves the hands with. It falls -- it is a chip like
// every other loose thing in this yard, on the same arc and under the same
// gravity -- so all it needs is a shove, and the shove is the shaking itself.
// `SHAKE_FLING` is the share of the hand's own travel each grain takes, so
// waving somebody about hard throws their load further than jiggling them does;
// `SHAKE_SCATTER` is the spread on top of that, which is what makes it a
// spray rather than a line; and it comes out upward first, the way anything
// flung out of a moving pair of hands does.
// How far a mess will slide looking for ground that holds it, in cells. Past
// this it stays where it is: a slope that long is not a bank beside something,
// it is the yard, and a mess sliding a hundred cells to find a footing would be
// a mess crossing the works on its own.
export const MESS_SLIDE = 14;
export const SHAKE_FLING = 0.06;   // share of the hand's travel a shed grain takes
export const SHAKE_SCATTER = 1.1;  // and the spread either side of it
export const SHAKE_LIFT = 1.4;     // it comes out upwards before it comes down
export const DIZZY_MS = 2000;      // and how long the stars last afterwards
// A shaken body drops what it was holding, hat and all, and stands there seeing
// stars before it gathers itself. How far it wobbles while it does.
export const WOBBLE = P / 2;       // pixels either side of where it landed
export const WOBBLE_BEAT = 11;     // radians a second -- unsteady, not a shiver

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
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
  { key: 'SHAKE_TURNS', label: 'a shaking is', min: 2, max: 16, step: 1,
    get: () => SHAKE_TURNS, set: v => { SHAKE_TURNS = v; } }
];
