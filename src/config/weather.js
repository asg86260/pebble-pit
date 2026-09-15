import { P } from './yard.js';

// --- the sky ----------------------------------------------------------------
// Clouds and birds, and nothing else up there: the far end of the parallax the
// dust does close up, deliberately faint. A cloud is two greys well lighter
// than the lightest rock shade, because the six shades mean depth of rock and
// nothing in the sky may borrow them. The clouds keep clear of the haze
// (`band` in `weather.js`), so the two are layered rather than mixed.
export const CLOUDS_ON = true;
export const CLOUDS_WANTED = 5;   // how many are kept in the strip of sky in view
// The muck the rain leaves: a third earth color beside the quarry's blue and
// the farm's green, and deliberately the drab one, since it is worth nothing.
// Not grey: a pile of dust is a block of grey cells, so grey muck lying on a
// pile read as more of the pile, the one thing it must never read as.
export const MUCK_TONE = '#7a6047';
export const MUCK_SKIN = '#57402c';     // and the top course, so the layer has a lid
// What a body left smells, and the yard says so: a couple of flies over it and
// a wisp coming off it. Only over what a body left -- what the weather drops is
// dirty and not rotten, and flies on both would take away the one thing that
// tells the two layers apart at a glance.
export const FLIES_PER = 2;          // over a column that gets them
// ...and one column in this many does. Flies belong to a HEAP, not to a cell:
// two over every column of a patch thirty wide is a black wall rather than a
// suggestion of a smell.
export const FLY_EVERY = 5;
export const FLY_ORBIT = P * 1.7;    // how far one strays from the column
export const FLY_BEAT = 3.1;         // radians a second it goes round at
export const STINK_RISE = 26;        // pixels a second a wisp climbs
export const STINK_LIFE = 2.4;       // seconds before it has gone
export const STINK_EVERY = 3;        // one column in this many gets one

export const CLOUD_TONE = '#efefef';
export const CLOUD_UNDER = '#e3e3e3';   // the bottom bar, so a cloud has an underside
export const CLOUD_DRIFT = 0.05;  // world pixels a frame, before its depth is taken off
export const BIRD_TONE = '#5f5f5f';
export const BIRD_GAP = 26000;    // milliseconds between one lot of birds and the next
export const BIRD_FLOCK = 4;      // at most this many in a lot
// A bird can be clicked, and shakes a few grains loose as it bolts. The amount
// is deliberately small: a thing to notice, not a thing to farm, and no
// upgrade has anything to say about them.
export const BIRD_REACH = P * 5;  // how near the click has to be, in world pixels
export const BIRD_DUST = 5;       // grains shaken loose
export const BIRD_BOLT = 1.5;     // and how much the rest of the lot quicken
export const BIRD_SPEED = 1.6;    // world pixels a frame: a lot crosses the view in about a quarter of a minute

export const TEND_STOOP = 780;
export let CUT_MS = 700;

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const WEATHER_KNOBS = [
  { key: 'CUT_MS', label: 'time to cut', min: 0, max: 3000, step: 50,
    get: () => CUT_MS, set: v => { CUT_MS = v; } }
];
