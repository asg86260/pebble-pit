import { P } from './yard.js';

// --- the farm ---------------------------------------------------------------
// Plots out past the quarry. Nothing grows in them on its own: a farmhand stands
// at a plot and tends it, and it grows while tended. So the crop is the crew's
// attention, which is the same trade the quarry asks for in a different shape.
// The plots are broken one at a time, and a plot is a place for one body: the
// same bargain the quarry makes, in the shape the farm makes it. One comes with
// the ground; the rest are broken with what the ground gives up.
//
// One rather than three, because breaking the ground should buy you a plot and
// not a farm: three plots standing there on the day you pay for it is most of the
// place handed over, and the row that breaks the next one is then an upgrade to
// something that already works rather than the way the place gets built.
export const FARM_PLOTS0 = 1;     // plots the ground comes with
export const FARM_PLOTS_MAX = 7;  // and the whole plot, once it is all broken
// Raised from 90: at the old price the first plot was affordable before the
// farmhand sent to break it had finished walking there, which made "the farm
// just opened" and "the farm is already growing" the same moment. A dig at the
// rock should still be ahead of it, so the first plot costs a real stretch of
// the yard's early dust rather than change already in the pile.
export const PLOT_COST = 260;      // dust for the first plot after it
export const PLOT_RATE = 1.7;     // and how much steeper each one gets
export const FARM_GAP = 42;      // world pixels between one plot and the next
export const FARM_H = 54;        // how tall a ripe stalk stands
// Bare ground kept between the end plot and the post that brackets it. A fence
// standing right against the crop reads as a crop growing through a fence: the
// plot wants a margin, the way a picture wants one.
export const FARM_GATE = P * 6;
export let TEND_BASE = 9000;   // to bring one plot on at tending 0
export const TEND_FLOOR = 1800;
export const FARM_WALK = 1.1;
// How much of a hand's tending stays on the plot it is standing over. The rest
// goes over the other plots, evenly.
//
// A hand is worth one plot's worth of tending in the time one plot takes, and
// that has not changed -- the farm's pace is its headcount and nothing else.
// What this splits is where the work *lands*. All of it used to land under the
// body, so a farm with one hand on it was one stalk and six patches of bare
// dirt: the row read as abandoned rather than as slow, and a single hand felt
// like a wasted assignment instead of a cheap one.
//
// Half and half. Enough in front of the body that the plot it is working is
// plainly the one coming on -- the crop is still the crew's attention, and you
// can see where the attention is -- and enough over the row that nothing in it
// is standing still. It is a share of the same one plot's worth either way, so
// a full complement, one hand to each plot, puts a whole share on every plot
// between them and lands exactly where the old one-hand-one-plot rule did.
export const TEND_HERE = 0.5;
// A ripe plot is not cut the instant it ripens. The spore forms at the tip of
// the stalk and sits there long enough to be seen, and the farmhand takes it
// off from exactly where it grew.
// How often a farmhand stoops over the plot it is working. Like the quarry, this
// is nothing to do with how fast the crop comes on: a farm should look tended
// whether or not anything is ripening this second.

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const FARM_KNOBS = [
  { key: 'TEND_BASE', label: 'tending', min: 200, max: 20000, step: 200,
    get: () => TEND_BASE, set: v => { TEND_BASE = v; } }
];
