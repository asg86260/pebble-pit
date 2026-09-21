import { P } from './yard.js';

// --- the sky ----------------------------------------------------------------
// Clouds and birds, and nothing else up there: the far end of the parallax the
// dust does close up, deliberately faint. A cloud is two greys well lighter
// than the lightest rock shade, because the six shades mean depth of rock and
// nothing in the sky may borrow them. The clouds keep clear of the haze
// (`band` in `weather.js`), so the two are layered rather than mixed.
export const CLOUDS_ON = true;
export const CLOUDS_WANTED = 5;   // how many are kept in the strip of sky in view
// The clouds are the front. Through a storm's brew they swell -- each one
// wider, taller, with a heavier underside -- and more come in off the sides,
// up to CLOUDS_STORM at a full heft; through the taper and for CLOUD_SETTLE_S
// after it they shed it all again. The swell is derived off the storm's clock
// every frame and never saved (`swell` in weather.js).
export const CLOUDS_STORM = 12;
export let CLOUD_SETTLE_S = 30;
export const CLOUD_GROW_W = 10;      // cells a cloud widens by at a full swell
export const CLOUD_GROW_ROWS = 3;    // rows it gains on top
export const CLOUD_GROW_UNDER = 2;   // and rows its underside deepens by
// The murk: the clouds are the sky's dirt readout (DESIGN.md, "The sky is the
// clouds"). One number, `S.haze / SMOG_CAP`, grows and darkens every cloud
// together. Murk grows a cloud less than a storm swells it -- a dirty sky is a
// heavier ceiling, a storm is a bigger one -- so this is a share of the swell's
// grow, not its own set of cells.
export const CLOUD_MURK_GROW = 0.5;  // a brim sky grows a cloud this share of a full swell
// How dark a cloud cell goes: at a brim sky a cell slides this far from the
// cloud's pale toward its smoke tint, and past MURK_INK_AT it carries on toward
// black, so the brim is a near-black ceiling rather than a flat brown.
export const CLOUD_MURK_TINT = 0.9;
export const CLOUD_MURK_INK_AT = 0.6;   // murk past this starts pulling the cell toward ink
export const CLOUD_MURK_INK = 0.55;     // and this far toward it at the brim
export const CLOUD_MURK_GIVE = 0.3;     // how much one cell's murk may differ from the next
// World pixels a frame a full gust carries a fully swelled cloud, on top of
// its own drift: the front leans with the sheet under it.
export const CLOUD_LEAN = 0.12;
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

export const CLOUD_TONE = '#e4e4e4';
export const CLOUD_UNDER = '#d6d6d6';   // the bottom bar, so a cloud has an underside
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
    get: () => CUT_MS, set: v => { CUT_MS = v; } },
  { key: 'CLOUD_SETTLE_S', label: 'cloud settle', min: 0, max: 120, step: 1,
    get: () => CLOUD_SETTLE_S, set: v => { CLOUD_SETTLE_S = v; } }
];
