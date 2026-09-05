import { P } from './yard.js';

// --- the rift ----------------------------------------------------------------
// The hole in the air past the far wall of the pit: what the hole in the ground
// overflows into. See src/rift.js and `## The rift` in DESIGN.md.
//
// A black disc standing in the air over the near end of the hole: fifteen cells
// across, RIFT_AT of the hole's length in from the near lip and clear of the
// ground line by RIFT_UP cells, so the whole of it is against the white page.
// It used to be a lens on the ground past the far wall, which is two windows off
// screen, and then a disc buried to its middle in the pile, which is a blob
// painted on the grey -- see `seatRift`.
export const RIFT_W = P * 15;
export const RIFT_H = P * 15;
// A fraction of the hole rather than a count of cells: the hole is 3,600 across
// and the disc belongs at the end of it that is on screen, whatever that end
// happens to measure. Far enough in to clear the counter's card, which stands
// four cells from the lip.
export const RIFT_AT = 0.05;
export const RIFT_UP = 3;        // cells of clear air between it and the ground line
// --- the tearing ---------------------------------------------------------------
// What happens the moment a hole that cannot take another grain gives way.
//
// Not a rift that opens and then starts draining at twelve grains a second: the
// tearing is the one dramatic thing that ever happens to the pit, and what it
// does is **empty the hole**. Every grain in it goes, in one long gulp, with the
// yard rocking under it. It is also the first time anybody sees the thing work,
// so it has to be the clearest possible statement of what it is for -- after it,
// the rift's rate is what you live with, and the pressure of the ladder starts
// from a hole you watched being emptied rather than from a number on a card.
//
// Nothing is lost to it, exactly as nothing is lost to any other swallow: the
// counter does not move, the pile shows what is in the hole and the rift's
// reading shows the rest.
export const RIFT_GULP = 1.8;        // seconds the tear takes to empty the hole
export const RIFT_GULP_SHOW = 1400;  // grains of it in the air at once, while it goes
export const RIFT_SHAKE = 22;        // and how hard the yard is rocked: the biggest knock there is
// --- what it does to the air ---------------------------------------------------
// A hole that only moves something when it happens to be swallowing a grain is a
// hole that stands still, and a fresh rift swallows twelve a second -- seventeen
// specks in the air at any moment, which is not something you can see pulling. So
// it pulls on the dust as well. The dust is already everywhere, it is already
// moving, and dust going down a hole is the plainest picture of a hole there is.
//
// Nothing is counted or lost: a mote drawn into the middle is put back somewhere
// else in the same breath (see `place` in air.js), so the sky holds exactly as
// much as the yard has earned. This is weather, not stock.
//
// The reach is in disc radii, so it follows RIFT_W wherever that goes. The rest
// is screen pixels a frame, which is what a mote is measured in.
export const RIFT_PULL = 1.3;    // how hard it pulls, right at the rim
export const RIFT_PULL_R = 4.5;  // how far the pull reaches, in radii
export const RIFT_SPIN = 0.75;   // and how much of the pull goes round rather than in
// What share of the dust it eats is put back at the edge of its own reach rather
// than anywhere in the yard.
//
// Without this the pull only ever *clears* the air around the disc: the motes
// near it are drawn in, are put back over some pile across the yard, and what is
// left is a bald patch of sky with a black circle in it -- the picture of a hole
// that has finished rather than one that is working. Feeding a share of them
// back at the rim gives it a stream to pull on, which is the thing being drawn.
//
// Not all of them, because a hole that recycles everything it eats slowly drags
// the entire sky into a ring around itself and leaves the rest of the yard
// clear. At a bit over half, the ring holds what drifts into it and the sky
// stays the sky.
export const RIFT_FEED = 0.55;
// --- the abyss -----------------------------------------------------------------
// The rift's picture, since the pit liquefied (see "The abyss" in DESIGN.md):
// no disc, no orbit. The hole holds a black liquid standing a few cells below
// the brim, whose surface breathes with a slow swell, and everything that used
// to spiral into the disc dives to that surface and is eaten there. A plank is
// laid over the mouth, because the drowned pit stays a way through -- the two
// ladders were added exactly so the pit was not a dead end, and the liquid
// must not undo that.
export const ABYSS_DOWN = P * 4;      // how far below the brim the liquid stands
export const ABYSS_SWELL = P * 3;     // how much the surface breathes, either way
// The waterline is an interference pattern, not a shape being slid sideways.
// Two sines whose phases were both the clock plus the column carry one profile
// across the hole forever: the silhouette never changes, it only translates,
// and once the eye has caught that it cannot unsee it. So the three waves here
// travel at unrelated speeds and the middle one travels the other way. Their
// crests meet, pile into a peak and come apart again, which is what a surface
// with something under it does.
export const ABYSS_SWELL_MS = 4200;   // the long heave's period
export const ABYSS_SWELL_MS2 = 6700;  // the one running against it, deliberately unrelated
export const ABYSS_SWELL_MS3 = 2900;  // and the short chop over the top of both
export const ABYSS_SWELL_K1 = 0.11;   // each one's length, in radians per column
export const ABYSS_SWELL_K2 = 0.067;
export const ABYSS_SWELL_K3 = 0.23;
export const ABYSS_SWELL_W1 = 0.45;   // and its share of the swell
export const ABYSS_SWELL_W2 = 0.35;
export const ABYSS_SWELL_W3 = 0.2;
// And a much slower envelope over the whole line, so one stretch of it heaves
// while another lies nearly flat and the two trade places over half a minute.
// Without it every column is equally busy, which is the other half of why the
// old surface read as a printed waveform.
export const ABYSS_SWELL_ENV_MS = 21000;
export const ABYSS_SWELL_ENV_K = 0.031;
export const ABYSS_SWELL_CALM = 0.35;  // how much heave a stretch keeps at its calmest
export const ABYSS_DIVE_FRAMES = 30;  // frames a caught grain takes to reach the surface
export const ABYSS_RIPPLE_MS = 420;   // how long a swallow's ripple shows
// What is down there is not paint: the liquid is a window into somewhere else,
// and the somewhere else has stars in it. Sparse, faint, breathing on their
// own slow clocks -- and the deeper rows carry more of them, so the thing
// reads as depth rather than as speckle. A few wear the tower's own magic
// purples, because the abyss is the one other plainly unnatural thing in the
// yard, and it should rhyme with the magic rather than with the dirt.
export const ABYSS_STAR_EVERY = 34;   // cells of liquid per star, roughly
export const ABYSS_STAR_MS = 5200;    // one star's slow breath
// A star's top rung: how bright it is allowed to get at the height of its
// breath. It is a rung of the ramp rather than a share of it, because the ramp
// is mostly dark now -- half of it is within a hair of the liquid -- and a star
// whose ceiling is a fraction of twelve would spend its whole life invisible.
// The shallows are held to the floor and the depths are let all the way up, and
// the hash pulls a few of the deep ones back down so they are not uniform.
export const ABYSS_STAR_FLOOR = 5;
export const ABYSS_STAR_VARY = 3;
// A sky is not confetti: the stars cluster. A coarse second hash gates whole
// patches -- some stretches of the deep are nebula-thick and some are empty
// -- and each star keeps a tone for life, dimmer in the shallows and allowed
// up to full white only in the depths, so looking down is looking further in.
// Twelve steps, not four, and the bottom one is black. A four-step ramp means
// a star's first visible moment is already a plainly grey cell, which is a pop
// however smoothly the brightness underneath it moves -- the fade was in the
// arithmetic and not on the screen. With the bottom few steps within a hair of
// the liquid, "gone" and "darkest step" are the same picture, so a star arrives
// and leaves without an edge anywhere in it.
export const ABYSS_TONES = ['#000000', '#0a0a0c', '#121216', '#1c1c21', '#26262c',
                            '#333339', '#42424a', '#55555e', '#6e6e78', '#8b8b96',
                            '#b4b4c0', '#ffffff'];
// The purples run the same way, dark to bright, because a magic star has to be
// able to come up out of the black by the same ramp the grey ones use. There is
// no alpha here and there never has been: a thing fades by being painted in a
// darker tone of its own family, so every family needs its dark end written
// down.
export const ABYSS_MAGIC_TONES = ['#000000', '#0b0614', '#130b20', '#1b112c', '#241739',
                                  '#2d1d47', '#371f56', '#412465', '#4e2090', '#5c2ba6',
                                  '#6a2fbe', '#9b5de5'];
// A star's breath is its brightness, not a switch, and the curve it follows is
// bent the other way from the obvious one. The bottom rungs of the ramp are
// within a hair of the liquid, so time spent down there is time spent invisible:
// an exponent under one runs the breath through those rungs quickly and lets it
// dwell up where the star can actually be seen. The ends still fade -- every
// rung is crossed, one at a time, several a second at most -- but they fade
// through tones nobody can tell from black, which is what makes the arrival and
// the departure edgeless.
export const ABYSS_BREATH_BEND = 0.7;
// The deep is a fluid, and what is lit in it moves like smoke in a light ray:
// slow veils that curl and shear rather than particles that travel. It is all
// one flow field sampled per cell -- two sideways shears at different rates
// drag a plain wave into curls, and the veil is drawn along that wave's zero
// line. There was a single galaxy adrift down here before this; one object
// crossing an otherwise still field read as a sprite floating over a
// background, which is the opposite of what the deep is supposed to be. The
// field is a function of the column, the row and the clock, so nothing is
// stored and a cell costs two sines.
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
// One wave alone lays down parallel stripes, however hard it is sheared -- the
// eye finds the repeat immediately. A second wave running across the first at a
// far longer period, drifting the other way, cancels and reinforces it along
// its length, so a veil thins to nothing in one stretch and thickens in
// another. That interference is the difference between banding and smoke.
export const ABYSS_FLOW_COL2 = 0.018;
export const ABYSS_FLOW_ROW2 = -0.035;
export const ABYSS_FLOW_DRIFT2 = -0.35;
export const ABYSS_FLOW_MIX = 0.8;    // the second wave's weight against the first
// The veil is not the crest of the field: it is the line where the field
// crosses nought. A crest is a broad lobe, and a broad lobe painted in is a
// blob -- it took several rounds of looking to be sure of that. The zero line
// is a thin contour that snakes right across the picture, splits and rejoins as
// the two waves shift against each other, and curls wherever the shear drags
// it, which is exactly what a filament of smoke in a light ray does.
//
// So the band is a half-width measured on the field, brightness falls off from
// the middle of the filament to its edges, and the whole thing stays near the
// dark end of the ramp: this is smoke lit from somewhere else, not a light
// source. The hash does the per-cell variation every surface here gets -- a
// nudge along the ramp, and a scatter of cells dropped so the filament frays.
export const ABYSS_VEIL_AT = 0.22;    // half-width of the band, measured on the field
export const ABYSS_VEIL_EVERY = 3;    // one cell in this many is punched out of it
export const ABYSS_VEIL_JITTER = 0.04;
export const ABYSS_VEIL_LIT = 0.34;   // how far up the grey ramp the shallow smoke gets
export const ABYSS_VEIL_DEEP = 0.34;   // and what the depths add to that
// And the field lifts and lowers the stars as it passes, so brightening travels
// through the sky in slow waves instead of each star keeping its own counsel.
export const ABYSS_FLOW_LIFT = 0.45;
// And the weird energy off the top: wisps that rise a few cells off the
// surface and are gone, the abyss exhaling. Derived from the clock and the
// column, so there is no list and nothing to save.
export const ABYSS_WISP_EVERY = 14;   // columns between wisps, roughly
export const ABYSS_WISP_RISE = P * 7; // how high one climbs before it is gone
export const ABYSS_WISP_MS = 2400;    // and how long the climb takes
// What tearing one costs. Red, because it is the one plainly magic thing acting
// on the one plainly dirt thing, and dust like every other row in the game.
export const RIFT_BILL = [['spark', 120], ['dust', 20000]];
// Grains a second a fresh rift swallows, and what each widening multiplies that
// by. Twelve a second is under a well-run yard's income on purpose: the rift
// arrives behind the works and you buy it forward, so the row means something
// the day you build it.
export const RIFT_RATE0 = 12;
export const RIFT_RATE = 1.6;
// And what a widening costs, in red, growing the same way. The dust half is the
// sixty-to-the-spark line every other price in the game sits on -- see DUST_PER
// in upgrades.js.
export const RIFT_RATE_COST = 25;
export const RIFT_RATE_UP = 1.5;
export const FLOOR_MARGIN = 12;  // gap under the pit floor, at the bottom of the window
// how many device pixels we are willing to fill a frame, before backing the
// resolution off. A phone at three to one is about three million.
// A `let`, because it is one of the dials -- it sat in TUNABLE as a `const` with
// no way in or out of the switches, so its slider read nothing and wrote nothing.
// One row with its own pair of accessors is what caught it.
