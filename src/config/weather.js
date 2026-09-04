import { P } from './yard.js';

// --- the sky ----------------------------------------------------------------
// Clouds and birds, and nothing else up there. They are the far end of the
// parallax the dust already does close up, and they are deliberately faint: a
// cloud is two greys well lighter than the lightest rock shade, because the six
// shades mean depth of rock and nothing in the sky is allowed to borrow them.
// The pale drifting clouds, back on.
//
// They went off when the smog arrived, on the grounds that two kinds of cloud in
// one sky is one kind too many. What settled that argument was the smog turning
// into what it is now: a thin even haze along the very top of the window. That
// leaves the whole middle of the sky empty, and an empty sky with nothing
// crossing it is the still picture the clouds were put in to break up in the
// first place. They keep clear of the haze -- see `band` in `weather.js` -- so
// the two are layered rather than mixed: your smoke overhead, the weather below
// it, and neither one pretending to be the other.
export const CLOUDS_ON = true;
export const CLOUDS_WANTED = 5;   // how many are kept in the strip of sky in view
// The muck the rain leaves. A third earth colour beside the quarry's cold blue
// and the farm's green -- and deliberately the drab one: both of those are
// saturated because they are worth something, and this is worth nothing. It reads
// as spoil rather than as a resource you have not learned about yet.
//
// It was grey for a while, on the rule that the yard has no colour outside the
// resource marks. That rule was already not true -- there is blue in the quarry and
// green on the plots -- and grey cost more than it saved: a pile of dust here is a
// block of grey cells, so grey muck lying on a pile read as more of the pile,
// which is the one thing it must never read as.
export const MUCK_TONE = '#7a6047';
export const MUCK_SKIN = '#57402c';     // and the top course, so the layer has a lid
// What a body left smells, and the yard says so: a couple of flies over it and a
// wisp coming off it. Only over what a body left -- what the weather drops is
// dirty and not rotten, and giving both of them flies would take away the one
// thing that tells the two layers apart at a glance.
export const FLIES_PER = 2;          // over a column that gets them
// ...and one column in this many does. Flies belong to a HEAP, not to a cell:
// two over every column of a patch thirty wide is sixty flies, which is a black
// wall rather than a suggestion of a smell.
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
// A bird can be clicked, and shakes a few grains loose as it bolts. It is the
// one thing in the sky you can touch, and the amount is deliberately small: it
// is a thing to notice, not a thing to farm -- they cross when they cross, and
// no upgrade has anything to say about them.
export const BIRD_REACH = P * 5;  // how near the click has to be, in world pixels
export const BIRD_DUST = 5;       // grains shaken loose
export const BIRD_BOLT = 1.5;     // and how much the rest of the lot quicken
export const BIRD_SPEED = 1.6;    // world pixels a frame: a lot crosses the view in about a quarter of a minute

export const TEND_STOOP = 780;
export let CUT_MS = 700;

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const WEATHER_KNOBS = [
  { key: 'CUT_MS', label: 'time to cut', min: 0, max: 3000, step: 50,
    get: () => CUT_MS, set: v => { CUT_MS = v; } }
];
