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
