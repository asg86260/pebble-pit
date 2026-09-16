import { P } from './yard.js';

// --- the rift ----------------------------------------------------------------
// The hole in the air past the far wall of the pit: what the hole in the ground
// overflows into. See src/rift.js and `## The rift` in DESIGN.md.
//
// A black disc standing in the air over the near end of the hole, RIFT_AT of
// the hole's length in from the near lip and clear of the ground line by
// RIFT_UP cells, so the whole of it is against the white page (`seatRift`).
//
// **It grows with what it eats.** The disc tears small and swells toward
// RIFT_WMAX as `S.riftAte` climbs toward ABYSS_AT, at which point the hole
// gives way and the pit drowns ("The pit's arc" in DESIGN.md). Nothing is sold
// and nothing shrinks it. The square root front-loads the visible growth and
// slows toward the ceiling, the shape of a thing straining. Sizes are in
// cells; `riftCells` in rift.js is the one reader. What is through the tear
// is a sky with depth in it, and depth needs room: at a dozen cells across
// the parallax had nothing to read against.
export let RIFT_W0 = 7;              // cells across, the day it tears
export let RIFT_WMAX = 20;           // and the size it gives way at
export let ABYSS_AT = 1000000;       // grains eaten when the drowning comes
// A fraction of the hole rather than a count of cells: the disc belongs at the
// end of the hole that is on screen, whatever that end measures. Far enough in
// to clear the counter's card, which stands four cells from the lip.
export const RIFT_AT = 0.05;
// The pile has to be in view under it, since the disc eats by reach
// (RIFT_REACH0): at three cells of air a disc eating the top of a full pile
// sat on its own crater.
export let RIFT_UP = 8;          // cells of clear air between it and the ground line
// --- how far it reaches ----------------------------------------------------------
// The torn rift eats what is within its reach of its underside, and the reach
// grows with the disc: this many cells past the air under it the day it tears,
// and the whole hole by the time it is RIFT_WMAX across. Not a rate: the pile
// under a young rift stands, its top peeling up into the disc, at a level that
// sinks as the hole grows, and every grain tipped in lands on that top and
// goes. Taking everything on the frame it landed left the pit an empty white
// hole under a black disc for the hours between the tear and the drowning.
export let RIFT_REACH0 = 4;      // cells below the air, the day it tears
// --- the tearing ---------------------------------------------------------------
// The moment a hole that cannot take another grain gives way: it **empties the
// hole**, every grain in one long gulp, with the yard rocking under it. It is
// the first time anybody sees the thing work, so it has to be the clearest
// statement of what it is for. Nothing is lost: the counter does not move, the
// pile shows what is in the hole and the rift's reading shows the rest.
export const RIFT_GULP = 1.8;        // seconds the tear takes to empty the hole
export const RIFT_GULP_SHOW = 1400;  // grains of it in the air at once, while it goes
export const RIFT_SHAKE = 22;        // and how hard the yard is rocked: the biggest knock there is
// --- what it does to the air ---------------------------------------------------
// A hole that only moves the grain it is swallowing stands still, so it pulls
// on the sky's dust as well. Nothing is counted or lost: a mote drawn into the
// middle is put back somewhere else in the same breath (`place` in air.js).
// The reach is in disc radii, so it follows RIFT_W wherever that goes; the
// pull is an acceleration at one disc radius that goes into a mote's own
// speed (`intoTheRift` in air.js).
export const RIFT_PULL = 1.2;    // px a frame squared, at one radius out
export const RIFT_PULL_R = 4.5;  // how far the pull reaches, in radii
// What share of the dust it eats is put back at the edge of its own reach
// rather than anywhere in the yard. Without it the pull only *clears* the air
// around the disc, leaving a bald patch of sky with a black circle in it; with
// all of it the hole drags the entire sky into a ring around itself.
export const RIFT_FEED = 0.55;
// --- gravity ------------------------------------------------------------------
// **The rift pulls, and everything else follows from that.** A grain is given
// the pull, its own speed carries it, and whether it falls straight in or
// swings round on the way is a consequence of how fast it was going and which
// way when it arrived. A scripted spiral gave a grain dropped at rest the same
// orbit as one flung past at speed.
//
// The strength is quoted at ONE DISC RADIUS and falls off as the square, so it
// follows the disc as it grows without a second number to keep in step.
export const RIFT_G = 1.3;           // px a frame squared, at one radius out
// The least it ever pulls, however far off the grain is. A grain lifted off
// the far end of the hole sits at forty radii and a true square gives it
// nothing, so it hangs in the air where the pile had been forever. The rift
// INHALES the whole hole (`riftBite`), and a draw that reaches all of it is
// what "everything in it goes" means. Near the disc the square takes over and
// the floor never bites.
export const RIFT_G_MIN = 0.36;      // px a frame squared, anywhere in the hole
export const RIFT_DRAG = 0.985;      // speed kept per frame: orbits decay, so
                                     // nothing circles for ever
// How much sideways speed a grain has as it enters the drain, as a share of
// what it would take to hold a circular orbit where it entered. THE knob for
// how much the stuff swirls: nought is a stone dropped down a well, one would
// circle for ever, in between it swings round once or twice, losing to the
// drag, and comes in. A share of the circular speed rather than a flat number
// of pixels, so it means the same thing wherever the grain joined. An initial
// condition, not a path: nothing is steered after this.
export const RIFT_SWING = 0.55;
export const RIFT_EAT = 0.35;        // the horizon, in disc radii
// Where a grain begins to slow, as a multiple of the horizon. **A grain does
// not pop out of existence at the mouth; it slows, dims and is gone.** It is
// also the cure for the flicker: a grain at full speed near the disc steps two
// or three cells a frame, and a mark that jumps two cells blinks. The slowing
// is a local clock, so the pull, the speed and the step all ease off together
// and the fall stays a fall rather than a hover with a drift on top.
export const RIFT_SLOW_FROM = 2.6;   // in horizons: outside this, no slowing
export const RIFT_GONE = 0.05;       // dimmer than this and it is taken off the list
// The ceiling on a grain's speed. A backstop, and it must stay one: **a speed
// cap destroys angular momentum.** Clamping the whole velocity every frame
// while a central force keeps pushing turns the direction radial within a
// handful of frames, since what is scaled away is the sideways part nothing
// is replenishing. The natural orbital speed at the rim is `sqrt(g*r)`, about
// 6 px a frame at this pull, and a cap near that flattened every orbit into a
// plunge and made RIFT_SWING mean nothing. The flicker is dealt with at the
// horizon instead.
export const RIFT_VMAX = 16;         // px a frame: a backstop, not a governor

// --- the abyss -----------------------------------------------------------------
// The rift's picture once the pit liquefies ("The abyss" in DESIGN.md): no
// disc, no orbit. The hole holds a black liquid standing a few cells below the
// brim, whose surface breathes with a slow swell, and everything dives to that
// surface and is eaten there. A plank is laid over the mouth, because the
// drowned pit stays a way through.
export const ABYSS_DOWN = P * 4;      // how far below the brim the liquid stands
export const ABYSS_SWELL = P * 3;     // how much the surface breathes, either way
// The waterline is an interference pattern, not a shape being slid sideways:
// two sines on the same phase carry one silhouette across the hole forever.
// The three waves travel at unrelated speeds and the middle one travels the
// other way, so their crests meet, pile into a peak and come apart again.
export const ABYSS_SWELL_MS = 4200;   // the long heave's period
export const ABYSS_SWELL_MS2 = 6700;  // the one running against it, deliberately unrelated
export const ABYSS_SWELL_MS3 = 2900;  // and the short chop over the top of both
export const ABYSS_SWELL_K1 = 0.11;   // each one's length, in radians per column
export const ABYSS_SWELL_K2 = 0.067;
export const ABYSS_SWELL_K3 = 0.23;
export const ABYSS_SWELL_W1 = 0.45;   // and its share of the swell
export const ABYSS_SWELL_W2 = 0.35;
export const ABYSS_SWELL_W3 = 0.2;
// A much slower envelope over the whole line, so one stretch heaves while
// another lies nearly flat and the two trade places over half a minute; every
// column equally busy reads as a printed waveform.
export const ABYSS_SWELL_ENV_MS = 21000;
export const ABYSS_SWELL_ENV_K = 0.031;
export const ABYSS_SWELL_CALM = 0.35;  // how much heave a stretch keeps at its calmest
export const ABYSS_DIVE_FRAMES = 30;  // frames a caught grain takes to reach the surface
export const ABYSS_RIPPLE_MS = 420;   // how long a swallow's ripple shows
// The liquid is a window into somewhere else with stars in it: sparse, faint,
// breathing on their own slow clocks, more of them in the deeper rows so the
// thing reads as depth rather than speckle. A few wear the tower's own magic
// purples, because the abyss should rhyme with the magic rather than with the
// dirt.
export const ABYSS_STAR_EVERY = 34;   // cells of liquid per star, roughly
export const ABYSS_STAR_MS = 5200;    // one star's slow breath
// A star's top rung: how bright it may get at the height of its breath. A rung
// of the ramp rather than a share of it, because half the ramp is within a
// hair of the liquid and a star whose ceiling is a fraction of twelve would
// spend its life invisible. The shallows are held to the floor, the depths let
// all the way up, and the hash pulls a few deep ones back down.
export const ABYSS_STAR_FLOOR = 5;
export const ABYSS_STAR_VARY = 3;
// Twelve steps, and the bottom one is black: with the bottom few within a hair
// of the liquid, "gone" and "darkest step" are the same picture, so a star
// arrives and leaves without an edge. A four-step ramp's first visible moment
// is already a plainly grey cell, which is a pop however smoothly the
// brightness underneath moves.
export const ABYSS_TONES = ['#000000', '#0a0a0c', '#121216', '#1c1c21', '#26262c',
                            '#333339', '#42424a', '#55555e', '#6e6e78', '#8b8b96',
                            '#b4b4c0', '#ffffff'];
// The purples run the same way, dark to bright. There is no alpha here: a
// thing fades by being painted in a darker tone of its own family, so every
// family needs its dark end written down.
export const ABYSS_MAGIC_TONES = ['#000000', '#0b0614', '#130b20', '#1b112c', '#241739',
                                  '#2d1d47', '#371f56', '#412465', '#4e2090', '#5c2ba6',
                                  '#6a2fbe', '#9b5de5'];
// The breath's curve is bent the other way from the obvious one: the bottom
// rungs are invisible, so an exponent under one runs through them quickly and
// dwells up where the star can be seen. Every rung is still crossed, one at a
// time, so the ends fade through tones nobody can tell from black.
export const ABYSS_BREATH_BEND = 0.7;
// The deep is a fluid, and what is lit in it moves like smoke in a light ray:
// one flow field sampled per cell, two sideways shears at different rates
// dragging a plain wave into curls, the veil drawn along that wave's zero
// line. A function of the column, the row and the clock, so nothing is stored
// and a cell costs two sines.
export const ABYSS_FLOW_MS = 52000;   // the field's own slow turn
export const ABYSS_FLOW_COL = 0.16;  // waves across, in radians per cell
export const ABYSS_FLOW_ROW = 0.09;  // and down
export const ABYSS_FLOW_ASPECT = 0.7; // rows count for less than columns, so veils lie flat
export const ABYSS_FLOW_DRIFT = 0.6;  // how much of the turn the crest itself travels
export const ABYSS_FLOW_SHEAR = 9;  // cells of sideways drag, which is what curls it
export const ABYSS_SHEAR_ROW = 0.43;  // the second shear's row period, against the first
export const ABYSS_SHEAR_TURN = 1.7;  // and how much faster it turns
export const ABYSS_SHEAR_AMT2 = 0.6;  // its share of the drag
export const ABYSS_SHEAR_COL = 1.3;   // the downward drag's column period, against the first
export const ABYSS_SHEAR_AMT_Y = 0.5; // and its share
// One wave alone lays down parallel stripes however hard it is sheared. A
// second wave at a far longer period, drifting the other way, cancels and
// reinforces it along its length: that interference is the difference between
// banding and smoke.
export const ABYSS_FLOW_COL2 = 0.018;
export const ABYSS_FLOW_ROW2 = -0.035;
export const ABYSS_FLOW_DRIFT2 = -0.35;
export const ABYSS_FLOW_MIX = 0.8;    // the second wave's weight against the first
// The veil is the line where the field crosses nought, not its crest: a crest
// is a broad lobe, and a broad lobe painted in is a blob. The zero line is a
// thin contour that snakes across the picture, splits and rejoins as the two
// waves shift, and curls wherever the shear drags it. The band is a half-width
// measured on the field, brightness falls off from the middle of the filament,
// and the whole thing stays near the dark end of the ramp: smoke lit from
// somewhere else, not a light source. The hash nudges each cell along the
// ramp and drops a scatter of them so the filament frays.
export const ABYSS_VEIL_AT = 0.22;    // half-width of the band, measured on the field
export const ABYSS_VEIL_EVERY = 3;    // one cell in this many is punched out of it
export const ABYSS_VEIL_JITTER = 0.04;
export const ABYSS_VEIL_LIT = 0.34;   // how far up the grey ramp the shallow smoke gets
export const ABYSS_VEIL_DEEP = 0.34;   // and what the depths add to that
// The field lifts and lowers the stars as it passes, so brightening travels
// through the sky in slow waves instead of each star keeping its own counsel.
export const ABYSS_FLOW_LIFT = 0.45;
// Wisps that rise a few cells off the surface and are gone, the abyss
// exhaling. Derived from the clock and the column, so there is no list and
// nothing to save.
export const ABYSS_WISP_EVERY = 14;   // columns between wisps, roughly
export const ABYSS_WISP_RISE = P * 7; // how high one climbs before it is gone
export const ABYSS_WISP_MS = 2400;    // and how long the climb takes
// The bridge over the mouth is made of the same light: a wave of brightness
// runs along it, quick enough to catch the eye on a thing you cross in a
// second, slow enough not to strobe. Wavelength is in cells.
export const ABYSS_BRIDGE_MS = 1300;   // one wave's travel
export const ABYSS_BRIDGE_WAVE = 0.48; // radians a cell, about thirteen cells a crest
export const FLOOR_MARGIN = 12;  // gap under the pit floor, at the bottom of the window

// The dev panel's rows for the growth dials above; a row lives beside the
// binding it moves, the same as EFFECT_KNOBS.
export const RIFT_KNOBS = [
  { key: 'RIFT_W0', label: 'rift born', min: 2, max: 10, step: 1,
    get: () => RIFT_W0, set: v => { RIFT_W0 = v; } },
  { key: 'RIFT_WMAX', label: 'rift grown', min: 6, max: 24, step: 1,
    get: () => RIFT_WMAX, set: v => { RIFT_WMAX = v; } },
  { key: 'RIFT_UP', label: 'rift air', min: 1, max: 16, step: 1,
    get: () => RIFT_UP, set: v => { RIFT_UP = v; } },
  { key: 'RIFT_REACH0', label: 'rift reach at birth', min: 1, max: 30, step: 1,
    get: () => RIFT_REACH0, set: v => { RIFT_REACH0 = v; } },
  { key: 'ABYSS_AT', label: 'drowns at', min: 50000, max: 4000000, step: 50000,
    get: () => ABYSS_AT, set: v => { ABYSS_AT = v; } }
];
