import { P } from './yard.js';
import { GREY } from './palette.js';

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
// How long a front's own cloud takes to come up out of nothing where it is
// born, in seconds of its own age rather than of the sky's swell: the front
// adds its clouds as the swell climbs, so a late one drawn at the swell it was
// born into is a cloud appearing whole in the middle of the sky. Slower than
// the eye looks for the next thing, quicker than the brew.
export const CLOUD_BLOOM_S = 9;
// A front's own clouds go further: as the front lets go of them they shrink
// and pale toward the page, on the swell's own fall -- so they are gone
// exactly when the sky has settled (CLOUD_SETTLE_S), which is slow enough that
// a melt is never caught happening. The ordinary sky has no such life: it
// wraps around the strip, well outside the window where nobody sees it.
// A cloud is drawn by the one cloud renderer (render/clouds.js, on the card
// in render/cloudgl.js; DESIGN.md, "The yard's sky on the cloud renderer"),
// its roles -- lit face, body, shade, core -- colored CLOUD_TONES steps from
// CLOUD_TONE to CLOUD_UNDER (render/yardsky.js).
export const CLOUD_TONES = 4;
// The shapes of cloud, and how often each is born (relative): the
// renderer's own (config/clouds.js, CLOUDS_SHAPES), a cumulus, a heap, a
// tower. A front's own clouds are its towers and anvils.
export const CLOUD_SHAPES = { cumulus: 5, heap: 4, tower: 1 };
export const CLOUD_STORM_SHAPES = { tower: 2, anvil: 1 };
// A cloud's size (the renderer's R, about a third of a cumulus's width) in
// its sheet's cells, before the sheet's `scale`.
export const CLOUD_R = [5, 8.5];
// How many of the renderer's cells a sheet's cell is drawn in, across and
// down: the renderer models a lobe in the round -- lit cap, shadowed side,
// the shadow where lobes meet -- only on lobes several cells across
// (CLOUDS_LOBE_LIGHT, CLOUDS_CORE_MIN), and at a sheet's own cell the
// yard's clouds are lobes of two and three. The sheets' sizes, and the rain
// and the balloons that read their `cell`, are unchanged.
export const CLOUD_GRAIN = 2;
// The clouds are the front. Through a storm's brew they swell -- each one
// wider, taller, with a heavier underside -- and more come in off the sides,
// up to CLOUDS_STORM at a full heft; through the taper and for CLOUD_SETTLE_S
// after it they shed it all again. The swell is derived off the storm's clock
// every frame and never saved (`swell` in weather.js).
export const CLOUDS_STORM = 22;
export let CLOUD_SETTLE_S = 30;
// How far a cloud's puffs' radii grow at a full swell, as a share of
// themselves: the front is a bigger cloud, not a new shape.
export const CLOUD_GROW_R = 0.5;
// REVIEW yardsky2
// How the sky grows toward a front, one of CLOUD_GROWTHS by its place (a
// number, so the dev panel can turn it): the front's own clouds blooming in
// among the swelled ones, or the sky's clouds alone doing all of it -- each
// swelling where it is, the near ones drawn together over the window's
// middle, or new puffs budding out of each one's edge. `r` is the radii's
// grow at a full swell, `storm` whether the front brings clouds of its own,
// `pull` the share of the way a cloud is drawn toward the middle, `bud` the
// buds it puts out (CLOUD_BUDS), and `tint` how far the storm's grey goes,
// as a share of CLOUD_STORM_TINT. `sink` is how many of the yard's cells its
// base comes down by at a full swell, so a growing cloud is a lowering one
// and its growth is seen under it rather than lost off the top of the
// window; `dark` the crown and base it greys toward, when not the front's
// (CLOUD_STORM_TONE, _UNDER): with no storm clouds of their own, the sky's
// clouds are the darkest thing in it, so they go darker.
export let CLOUD_GROWTH = 0;
const DARK = ['#8a8a94', '#4a4a56'];
export const CLOUD_GROWTHS = [
  { name: 'front', storm: true, r: CLOUD_GROW_R, pull: 0, bud: 0, tint: 1, sink: 0, dark: null },
  { name: 'swell', storm: false, r: 1.4, pull: 0, bud: 0, tint: 1.2, sink: 4, dark: DARK },
  { name: 'gather', storm: false, r: 0.5, pull: 0.5, bud: 0, tint: 1.2, sink: 3, dark: DARK },
  { name: 'bud', storm: false, r: 0.25, pull: 0, bud: 1, tint: 1.2, sink: 3, dark: DARK }
];
// A cloud's buds (CLOUD_GROWTHS' `bud`): how many it is made with, each the
// size of the lobe it grows from by `r`, its middle `out` of that lobe's
// radius from the lobe's, somewhere round the top half; each opens over
// `span` of the swell, one after another, so a cloud grows a bud at a time.
export const CLOUD_BUDS = { n: [6, 10], r: [0.7, 1.1], out: 0.9, span: 0.3 };
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
// A cloud a balloon is drawing in pales (DESIGN.md, "The balloons ride the
// clouds"): drawn at the sky's murk less this share at the most, so a worked
// cloud on a filthy day is a paler brown and never a clean white.
export const CLOUD_DRAWN_MAX = 0.6;
export const CLOUD_DRAWN_EASE = 0.4;   // share of the way it goes a second, paling and filling back
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
// a tone between the two, for the roombas' grains in the air (ROOMBA_TONES)
export const MUCK_GRAIN = '#68503a';
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
export const STINK_INK = 0.28;       // how dark a wisp starts, as alpha
export const STINK_EVERY = 3;        // one column in this many gets one

// The two ends of a dry cloud's shading, its lit crown and its base; the
// steps between are mixed. The base stays lighter than the lightest rock
// shade, since the six shades are the rock's and nothing in the sky borrows
// them.
export const CLOUD_TONE = GREY[2];
export const CLOUD_UNDER = GREY[5];
export const CLOUD_DRIFT = 0.05;  // world pixels a frame, before its depth is taken off
export const BIRD_TONE = GREY[7];
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
  { key: 'CLOUD_GROWTH', label: 'cloud growth', min: 0, max: 3, step: 1,
    get: () => CLOUD_GROWTH, set: v => { CLOUD_GROWTH = v; } },
  { key: 'CLOUD_MURK_POW', label: 'murk bend', min: 0.2, max: 1, step: 0.05,
    get: () => CLOUD_MURK_POW, set: v => { CLOUD_MURK_POW = v; } }
];
