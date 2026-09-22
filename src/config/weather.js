import { P } from './yard.js';

// --- the sky ----------------------------------------------------------------
// Clouds and birds, and nothing else up there: the far end of the parallax the
// dust does close up, deliberately faint. A cloud is two greys well lighter
// than the lightest rock shade, because the six shades mean depth of rock and
// nothing in the sky may borrow them. The clouds keep clear of the haze
// (`band` in `weather.js`), so the two are layered rather than mixed.
export const CLOUDS_ON = true;
// The sky is deep: three sheets of cloud, one behind the other, and a cloud is
// born into one of them and stays there. `far` is the sheet's parallax (how
// much of the camera's scroll it takes, so the far sheet barely moves and the
// near one nearly keeps up with the ground), and its drift comes off it too,
// so the sheets slide past each other. `scale` is a cloud's width in the
// sheet, in its own cells, and `flat` how much of its height it keeps: the far
// ones are more, smaller and squashed toward horizontal slips, the near ones
// fewer, tall and in their true shape (John Muir Laws, "How to draw clouds in
// perspective"). `cell` is the size of the sheet's cell against the yard's --
// the near sheet is drawn in cells half again the yard's and the far one in
// half-cells, so a far cloud is finer-grained as well as smaller, the way a
// thing close up is coarse and a thing far off is fine. The air between is in
// CLOUD_FADE_FAR, read off a cloud's own `far`. `n` is how many of the sheet
// are kept in the strip of sky in view.
export const CLOUD_LAYERS = [
  { name: 'far',  far: 0.06, scale: 1.2,  flat: 0.7, cell: 0.5, n: 5 },
  { name: 'mid',  far: 0.18, scale: 0.95, flat: 0.9, cell: 1,   n: 3 },
  { name: 'near', far: 0.40, scale: 0.6,  flat: 1.0, cell: 1.5, n: 2 }
];
// Where a sheet's bases sit, in cells below the top of the band: the near
// sheet highest and each one behind it a little lower, so the sky reads as one
// level of cumulus seen in perspective rather than as three. A cell or two of
// give within a sheet -- bases exactly level read as a shelf. In cells, not a
// share of the sky, so the height a cloud sits at does not move when the
// window is resized, and all of it near the top: the sky over the works is
// mostly empty and the clouds belong up in it.
export const CLOUD_LANES = { near: [5, 9], mid: [11, 15], far: [17, 21] };
export const CLOUDS_WANTED = CLOUD_LAYERS.reduce((n, l) => n + l.n, 0);
// a sheet's clouds are not all at one exact depth: each is this far either
// side of its sheet's `far`, so two in a sheet still slide past each other
// and the one in front is the one drawn last
export const CLOUD_FAR_JITTER = 0.03;
// The air between you and a cloud: its tones are mixed this far toward the
// page's white at the farthest depth, nothing at the nearest, straight off its
// `far` -- so the far sheet is a pale slip with its shades pressed together,
// and the near sheet has the whole range. The only depth of field a flat
// picture can have, and it takes the same share off dirt and weather, so a far
// cloud on a dirty day is a paler brown, not a cleaner one.
export const CLOUD_FADE_FAR = 0.45;
// Nothing in the sky blinks. How many steps a cell has between the page and
// its own tone, for the part of it the cloud actually fills: a cell arriving
// as the sky swells comes up through them and one going as the front lets go
// goes back down. Few, deliberately -- this is a cloud's edge softening, not
// a gradient, and the sky is still a handful of flat tones.
export const CLOUD_EDGE_STEPS = 3;
// How long a front's own cloud takes to come up out of nothing where it is
// born, in seconds of its own age rather than of the sky's swell: the front
// adds its clouds as the swell climbs, so a late one drawn at the swell it was
// born into is a cloud appearing whole in the middle of the sky. Slower than
// the eye looks for the next thing, quicker than the brew.
export const CLOUD_BLOOM_S = 9;
// A front's own clouds go further: as the front lets go of them they thin from
// the bottom a cell at a time and climb as they thin, paling toward the page,
// on the swell's own fall -- so they are gone exactly when the sky has settled
// (CLOUD_SETTLE_S), which is slow enough that a melt is never caught happening.
// The ordinary sky has no such life: it wraps around the strip, well outside
// the window where nobody sees it.
// A cloud is shaded like the boulder, in steps between CLOUD_TONE and
// CLOUD_UNDER: lit, body, shade, and the underside. It is lit from above: a
// cell's depth is how far below the nearest bit of the top outline it sits
// (its own column or up to CLOUD_SHADE_REACH either side), as a share of the
// cloud's height -- lit down to CLOUD_LIT, body down to CLOUD_MID, shade
// below that -- so the shade pools under the heaps and thins under the dips.
export const CLOUD_TONES = 4;
export const CLOUD_LIT = 0.35;
export const CLOUD_MID = 0.7;
export const CLOUD_SHADE_REACH = 4;
// The kinds of cloud, and how often each is born (`share`, relative): how
// many big circles its spine has along the base and how many puffs ride on
// them, how tall it is as a share of its width, and how wide it is against
// its sheet's size. One recipe for every cloud made a sky of the same cloud
// over and over; the kinds are what make two clouds two clouds.
export const CLOUD_KINDS = [
  { name: 'puff',  share: 3, spine: [1, 2], puffs: [1, 3], tall: [0.55, 0.8], wide: [0.5, 0.75] },
  { name: 'heap',  share: 4, spine: [2, 4], puffs: [2, 5], tall: [0.45, 0.7], wide: [0.9, 1.2] },
  { name: 'tower', share: 2, spine: [2, 3], puffs: [3, 5], tall: [0.6, 0.85], wide: [0.8, 1.0] },
  { name: 'bank',  share: 3, spine: [4, 6], puffs: [2, 4], tall: [0.25, 0.4], wide: [1.2, 1.5] }
];
// A spine circle's radius as a share of the cloud's height, how far two
// neighbors overlap (a share of their radii summed), and how low its center
// sits (a share of its radius above the base: low, so the bottom is one long
// rounded shape). A puff's radius, likewise, and how far it sinks into the
// spine's surface (a share of its radius) -- mostly above it.
export const CLOUD_SPINE_R = [0.42, 0.6];
export const CLOUD_SPINE_LAP = [0.55, 0.75];
export const CLOUD_SPINE_LOW = [0.35, 0.7];
export const CLOUD_PUFF_R = [0.25, 0.45];
export const CLOUD_PUFF_SINK = [0.0, 0.4];
// The clouds are the front. Through a storm's brew they swell -- each one
// wider, taller, with a heavier underside -- and more come in off the sides,
// up to CLOUDS_STORM at a full heft; through the taper and for CLOUD_SETTLE_S
// after it they shed it all again. The swell is derived off the storm's clock
// every frame and never saved (`swell` in weather.js).
export const CLOUDS_STORM = 22;
export let CLOUD_SETTLE_S = 30;
// How far a bump's radius grows at a full swell, as a share of itself: the
// front is a bigger cloud, not a new shape.
export const CLOUD_GROW_R = 0.5;
// The murk: the clouds are the sky's dirt readout (DESIGN.md, "The sky is the
// clouds"). One number, `S.haze / SMOG_CAP`, grows and browns every cloud
// together. Murk grows a cloud less than a storm swells it -- a dirty sky is a
// heavier ceiling, a storm is a bigger one -- so this is a share of the swell's
// grow, not its own.
export const CLOUD_MURK_GROW = 0.5;
// The brown a dirty cloud slides toward, and how far it gets at the brim: a
// heavy brown and no further. Not black -- a black sky over the works read as
// night, and hid the storm that was the thing worth seeing.
export const CLOUD_MURK_TONE = '#6b4d28';
export const CLOUD_MURK_UNDER = '#3a2812';
export const CLOUD_MURK_TINT = 0.6;
// How the murk answers the haze: the share of the cap raised to this power.
// SMOG_CAP is a slow-fill ceiling (tens of minutes of machines), so a linear
// share sits near nothing for most of a run and the clouds never darken enough
// to read a working machine. Bent below one, a little haze shows at once and
// the darkening eases toward the brim.
export let CLOUD_MURK_POW = 0.45;
// A cloud a balloon's thread is on pales (DESIGN.md, "The balloons pull from
// the clouds"): it is drawn at the sky's murk less this share at the most, so a
// pulled cloud on a filthy day is a paler brown and never a clean white.
export const CLOUD_DRAWN_MAX = 0.6;
export const CLOUD_DRAWN_EASE = 0.5;   // share of the way it goes a second, paling and filling back
// The storm's own color: a cool grey, laid over whatever brown the murk has
// put there, so weather and dirt are told apart -- brown is the yard being
// dirty, grey is rain on the way. The underside takes it harder, which is what
// makes a front read as a heavy sky. Bluish rather than a rock grey, so the
// sky borrows none of the six shades even where it dips as dark.
export const CLOUD_STORM_TONE = '#a6a6b0';
export const CLOUD_STORM_UNDER = '#62626e';
export const CLOUD_STORM_TINT = 0.7;
export const CLOUD_STORM_UNDER_TINT = 0.85;
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

// The two ends of a dry cloud's shading, its lit crown and its base; the
// steps between are mixed. The base stays lighter than the lightest rock
// shade, since the six shades are the rock's and nothing in the sky borrows
// them.
export const CLOUD_TONE = '#dadada';
export const CLOUD_UNDER = '#909090';
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
    get: () => CLOUD_SETTLE_S, set: v => { CLOUD_SETTLE_S = v; } },
  { key: 'CLOUD_MURK_POW', label: 'murk bend', min: 0.2, max: 1, step: 0.05,
    get: () => CLOUD_MURK_POW, set: v => { CLOUD_MURK_POW = v; } }
];
