import { P } from './yard.js';

// --- the lab ----------------------------------------------------------------
// Research is not bought, it is *worked*. Paying for it starts it; what finishes
// it is bodies standing in the lab, and nothing else -- an empty lab makes no
// progress at all, however much you have paid. So the lab competes for the crew
// with the rock, the quarry and the plots, which is the only real question this
// game asks.
export const LAB_EFFORT = 1;      // a worker does one second of work a second
// Its footprint. It had no numbers of its own once: two literals in world.js
// and a handful of fractions of them in the drawing. Sixteen across and twelve
// down, and it was fourteen by ten -- the smallest thing on the ground by both
// measures, reading as a shed beside the casino. It keeps the casino's height,
// which is what makes the two of them the same building at different jobs.
// Even across, so the way in centers on the lattice.
export const LAB_W = P * 16;
export const LAB_H = P * 12;
export const LAB_FLUE = 4;       // courses of it standing against the sky, above the body
export let LAB_WORK = 45;         // and this many worker-seconds finishes a piece
// The two spore-priced multipliers that were here -- the cut's and the plots' --
// are the last band of the two grounds' own ladders now, and are priced off
// those ladders' first rungs in config/quarry.js and config/farm.js. The crew's
// two keep their own firsts in upgrades/rows-mult.js.
// What a bench costs, and how much steeper each one gets. The lab's own ladder:
// it is the one building that never made itself quicker, so every piece of
// research took exactly as long as the first one did however far into a run you
// were -- and the lab is the thing standing between you and every other
// multiplier in the game.
export const BENCH_KIT_COST = 8;
export const BENCH_KIT_RATE = 1.8;
// And the second bench: a lab that can look into two things at once, with a body
// at each. It is a *place*, not a rung -- see `capOf` -- and it is the only
// thing in the game that widens a station that has always held one.
export const LAB_ROOM_COST = 14;
// The chimney's own numbers went with the chimney: SMOKE_LIFE and SMOKE_RISE
// are in config/machines.js now, beside the rest of what a puff is made of.

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const LAB_KNOBS = [
  { key: 'LAB_WORK', label: 'research effort', min: 5, max: 300, step: 5,
    get: () => LAB_WORK, set: v => { LAB_WORK = v; } }
];
