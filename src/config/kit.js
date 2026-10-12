import { P } from './yard.js';
import { HOUSE_COLS, HOUSE_CUBE } from './house.js';
import { COUNTER_ROW_W, COUNTER_PAIR_GAP, COUNTER_GAP } from './crew.js';

// --- the kit ------------------------------------------------------------------
// What a hat costs. Shards, all of it: the quarry starts giving them up long
// before anything else wants them, and a currency you cannot spend reads as
// scenery. A hat doubles what a body does at the thing it does, for good, so
// it is priced like the decision it is: twenty is about ten minutes of a
// working cut for the first, and the rate doubles-and-a-bit it every time.
//
// The rows are on the boards of the stations that wear the kit (the shack, the
// quarry, the plots, and the bench for the carts), and the shields open them --
// see upgrades/rows-kit.js.
export let TRADE_COST = 20;    // the first of any one hat
export const TRADE_RATE = 1.6;   // each one after that

// The dev panel's rows for the knobs above, beside the binding because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const KIT_KNOBS = [
  { key: 'TRADE_COST', label: 'a hat costs', min: 2, max: 4000, step: 2,
    get: () => TRADE_COST, set: v => { TRADE_COST = v; } }
];

// --- the forklift --------------------------------------------------------------
// The second rung of the haulers' kit: a carter's cart with an engine under it
// (DESIGN.md, "The forklift"). Bought one at a time like a cart, in the
// machines' coin because it is machinery, and rising `TRADE_RATE` a lift the
// way every hat does. Nothing caps the row; the sky does.
export const LIFT_BILL = [['spark', 30], ['dust', 1800]];
// What goes up while it drives laden: soot a cell, put up a puff at a time so
// the sky answers to the road actually driven. Empty driving is clean. The
// foot is a machine's fouling spread over a rock-to-hole run, so one lift on
// the rock line smokes about what the belt would have.
export let LIFT_FOUL = 0.04;
export const LIFT_PUFF_CELLS = 6;
// The forklifts' garage, on the house's far side from the rock: a shed a
// forklift drives into when there is nothing to fetch. The house keeps the
// ground for it from the first hire (`hang` in sites.js), so buying the
// first forklift moves nothing, and its wall stands `GARAGE_CLEAR` off the
// house's, room for the house door's comings and goings and a hand's width.
export const GARAGE_W = P * 8;
export const GARAGE_H = P * 6;
// How far the truck lifts its driver: a wheel and the truck's box. The yard
// draws the driver this high and the roster leaves this much room for one.
export const LIFT_SEAT = P * 3;
// The cart and the forklift, drawn in the yard and on the counters both.
export const CART_W = P * 4, CART_H = P * 2;
export const LIFT_W = P * 5, LIFT_FORK = P * 4, LIFT_MAST = P * 5, LIFT_ANTENNA = P * 2;
// Derived: the house's counters (carters beside workers) and the garage's
// (forklifts), each at its widest and centered under its building, keep
// COUNTER_GAP between them. A counter is its widest row or its sprite.
const HOUSE_COUNTERS_W = COUNTER_ROW_W * 2 + COUNTER_PAIR_GAP;
const GARAGE_COUNTER_W = Math.max(COUNTER_ROW_W, LIFT_W + P + LIFT_FORK);
export const GARAGE_CLEAR = Math.max(P * 3,
  Math.ceil(((HOUSE_COUNTERS_W + GARAGE_COUNTER_W) / 2 + COUNTER_GAP
             - (HOUSE_COLS * HOUSE_CUBE + GARAGE_W) / 2) / P) * P);

export const LIFT_KNOBS = [
  { key: 'LIFT_FOUL', label: 'soot a cell a lift drives', min: 0, max: 1, step: 0.01,
    get: () => LIFT_FOUL, set: v => { LIFT_FOUL = v; } }
];
