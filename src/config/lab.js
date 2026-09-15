import { P } from './yard.js';

// --- the lab ----------------------------------------------------------------
// Research is not bought, it is *worked*. Paying for it starts it; what
// finishes it is bodies standing in the lab, and nothing else -- an empty lab
// makes no progress however much you have paid.
export const LAB_EFFORT = 1;      // a worker does one second of work a second
// Its footprint. It keeps the casino's height, which is what makes the two of
// them the same building at different jobs. Even across, so the way in centers
// on the lattice.
export const LAB_W = P * 16;
export const LAB_H = P * 12;
export const LAB_FLUE = 4;       // courses of it standing against the sky, above the body
// What a bench costs, and how much steeper each one gets: the lab's own
// ladder, since it is the thing standing between you and every other
// multiplier in the game.
export const BENCH_KIT_COST = 8;
export const BENCH_KIT_RATE = 1.8;
// The second bench: a lab that can look into two things at once, with a body
// at each. A *place*, not a rung -- see `capOf`.
export const LAB_ROOM_COST = 14;
// The chimney's numbers, SMOKE_LIFE and SMOKE_RISE, are in config/machines.js
// beside the rest of what a puff is made of.
