import { P } from './yard.js';

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
// The engines' trestle stands this far beyond the carts' (`liftX`): the
// truck on its slab is five cells, the mast one, the forks four, and a cell
// of ground before the carts' slab. The bench pads its left side by it
// (`hang` in sites.js), which is what keeps it off the noticeboard.
export const LIFT_STAND_OFF = P * 11;
// The forklifts' garage, on the old engine stand's ground left of the carts'
// stand: a shed a forklift drives into when there is nothing to fetch.
export const GARAGE_W = P * 8;
export const GARAGE_H = P * 6;
// How far the truck lifts its driver: a wheel and the truck's box. The yard
// draws the driver this high and the roster leaves this much room for one.
export const LIFT_SEAT = P * 3;

export const LIFT_KNOBS = [
  { key: 'LIFT_FOUL', label: 'soot a cell a lift drives', min: 0, max: 1, step: 0.01,
    get: () => LIFT_FOUL, set: v => { LIFT_FOUL = v; } }
];
