import { P } from './yard.js';

// --- the farm ---------------------------------------------------------------
// Plots out past the quarry. Nothing grows in them on its own: a farmhand
// stands at a plot and tends it, and it grows while tended, so the crop is the
// crew's attention. A plot is a place for one body, broken one at a time. One
// comes with the ground, so breaking the ground buys a plot and not a farm.
export const FARM_PLOTS0 = 1;     // plots the ground comes with
export const FARM_PLOTS_MAX = 7;  // and the whole plot, once it is all broken
// The first plot costs a real stretch of the yard's early dust rather than
// change already in the pile, or "the farm just opened" and "the farm is
// already growing" are the same moment. See DESIGN.md, "What the two grounds
// sell".
export const PLOT_COST = 520;      // dust for the first plot after it
// And the farm's own crop beside the dust: a plot is broken by the hands that
// work the row, and the row pays for it. A minute or two of a staffed farm.
export const PLOT_SPORES = 60;     // spores for that same first plot
export const PLOT_RATE = 1.7;     // and how much steeper each one gets
export const FARM_GAP = 42;      // world pixels between one plot and the next
export const FARM_H = 54;        // how tall a ripe stalk stands
// Bare ground kept between the end plot and the post that brackets it: a fence
// right against the crop reads as a crop growing through a fence.
export const FARM_GATE = P * 6;
export const FARM_WALK = 1.1;
// How much of a hand's tending stays on the plot it is standing over; the rest
// goes over the other plots, evenly. A hand is worth one plot's worth of
// tending either way -- the farm's pace is its headcount -- and this only
// splits where the work *lands*, so one hand is not one stalk and six patches
// of bare dirt. A full complement, one hand a plot, lands a whole share on
// every plot.
export const TEND_HERE = 0.5;

// What each rung of the farm's two ladders is worth and costs is written a
// rung at a time in config/rungs.js.

// The dev panel's rows for the knobs above; config.js gathers every file's
// rows into one TUNABLE.
export const FARM_KNOBS = [];
