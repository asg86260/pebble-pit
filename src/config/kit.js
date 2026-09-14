// --- the kit ------------------------------------------------------------------
// What a hat costs. Shards, all of it: the quarry starts giving them up long
// before anything else wants them, and a currency you cannot spend reads as
// scenery.
//
// A helmet was two shards, which is about four minutes of one body in the
// quarry: cheap enough that kitting the whole yard out was something you did on
// the way past rather than something you saved for. A hat doubles what a body
// does at the thing it does, for good and for free from then on, and nothing
// else in the game gives that much away -- so it is priced like the decision it
// is. Twenty is about ten minutes of a working cut for the first, and the rate
// below still doubles-and-a-bit it every time.
//
// It was a thousand for a while, priced against a cut that gave up shards far
// faster than this one does. Two bodies in the quarry bank about two shards a
// minute, so a thousand is seven hours of it -- a price nobody was ever going to
// pay, which made the shard a currency you cannot spend all over again.
//
// The rows are on the boards of the stations that wear the kit (the shack, the
// quarry, the plots, and the bench for the carts), and the shields open them --
// see upgrades/rows-kit.js.
export let TRADE_COST = 20;    // the first of any one hat
export const TRADE_RATE = 1.6;   // each one after that

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const KIT_KNOBS = [
  { key: 'TRADE_COST', label: 'a hat costs', min: 2, max: 4000, step: 2,
    get: () => TRADE_COST, set: v => { TRADE_COST = v; } }
];
