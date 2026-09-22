// Every ladder, rung by rung, written down: what it is worth and what it costs.
// At a handful of rungs a curve cannot be told from a list and cannot be made
// to say the numbers in somebody's head, so a list it is, for the value and
// for the price both. See DESIGN.md, "A rung is a step up, not a step along".
//
// One entry a ladder, by the row's key. `value` is what the row reads, in the
// row's own unit, rung nought first, then one a rung: `LADDER + 1` long, the
// last the top. `dust` is what each rung costs in dust, `LADDER` long; the
// coins a band adds are that dust at the coins' rates (`DUST_PER`), which is
// the one rule the bills keep. test/ladders.test.mjs says every list is the
// length it must be and every value climbs, so a list a rung short is a red
// check rather than a ladder that stops early.
//
// The game reads its rates off these too: a swing's gap is a thousand over the
// hits a second written here, a plot's tending sixty thousand over the plots a
// minute.
//
// Every entry is a dial in the ladder book (ladders.html) and on the dev
// panel: `RUNG_KNOBS` hands `TUNABLE` a knob a rung. The quarry's pace tops
// out at forty trips a minute because the walk is already the floor there
// (test/cut-pockets.test.mjs measures the cut at the top rung), so a higher
// figure would be a rung that changes nothing.

export const LADDERS = {
  // --- the bench: you --------------------------------------------------------
  carry:        { value: [1, 2, 3, 4, 6, 8, 10, 15, 20], dust: [20, 50, 100, 150, 200, 400, 600, 1000] },       // px you can carry
  speed:        { value: [1, 1.5, 2, 2.5, 3, 4, 6, 8, 12], dust: [100, 150, 200, 300, 400, 600, 800, 1200] },      // hits/s, your swing
  pick:         { value: [1, 2, 3, 4, 5, 6, 7, 10, 12], dust: [250, 400, 500, 750, 1000, 1500, 2000, 3000] },    // px your swing takes
  toss:         { value: [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4], dust: [80, 120, 160, 240, 320, 480, 640, 960] },   // throws/s, a held hand
  reach:        { value: [500, 640, 800, 1000, 1200, 1600, 2000, 2500, 3000], dust: [60, 100, 150, 200, 300, 450, 700, 1000] }, // px a held hand throws; the foot covers the rock's own pile to the hole
  critchance:   { value: [5, 8, 10, 12, 15, 18, 20, 25, 30], dust: [500, 800, 1250, 2000, 3000, 5000, 8000, 12000] },   // % of swings
  critmult:     { value: [2, 3, 4, 5, 6, 7, 8, 9, 10], dust: [1000, 1500, 2500, 4000, 6000, 10000, 16000, 25000] }, // x a crit is worth
  // --- the shack: the gang -----------------------------------------------------
  // The gang and the haulers are fitted to each other, against a measured
  // trip: at the foot a digger needs about one and a half haulers, and the
  // gap opens slowly up the ladders, because the belt is what carries a late
  // yard. A foot of one px a second and a one-grain load needed five.
  rockhandpick: { value: [1, 2, 3, 4, 5, 6, 7, 8, 9], dust: [1000, 1500, 2000, 3000, 4000, 6000, 8000, 12000] },  // px a rockhand takes
  rockhandspeed:{ value: [0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4], dust: [200, 300, 400, 600, 800, 1200, 1600, 2400] },     // hits/s, its swing
  // --- the bench: the haulers ---------------------------------------------------
  haulcarry:    { value: [2, 4, 6, 8, 10, 12, 14, 15, 16], dust: [150, 200, 300, 400, 500, 750, 1000, 1500] },     // grains a load
  haulpace:     { value: [160, 200, 240, 280, 330, 390, 460, 530, 600], dust: [200, 300, 400, 500, 600, 900, 1200, 1800] },     // px/s, the walk
  // --- the air filter -----------------------------------------------------
  fan:          { value: [30, 35, 40, 45, 50, 60, 70, 90, 110], dust: [1000, 1500, 2000, 3000, 4000, 5000, 7000, 10000] },  // motes/s a fan pulls
  // --- the quarry ---------------------------------------------------------------
  seam:         { value: [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4, 5], dust: [750, 1000, 1500, 2000, 2500, 3500, 5000, 7500] },   // a dig, as a share of the handful a bench
  quarrypace:   { value: [5, 8, 10, 12, 15, 20, 25, 32, 40], dust: [750, 1000, 1500, 2000, 2500, 3500, 5000, 7500] },   // trips a minute
  // --- the farm -----------------------------------------------------------------
  crop:         { value: [1, 2, 3, 4, 5, 6, 8, 10, 12], dust: [750, 1000, 1500, 2000, 2500, 3500, 5000, 7500] },   // spores a cut
  tend:         { value: [6, 8, 10, 15, 20, 25, 30, 50, 60], dust: [750, 1000, 1500, 2000, 2500, 3500, 5000, 7500] },   // plots a minute
  // --- the apothecary -----------------------------------------------------------
  bufflength:   { value: [60, 75, 90, 105, 120, 135, 150, 180, 210], dust: [1000, 1500, 2000, 2500, 3000, 4500, 6000, 9000] },  // seconds a dose lasts
  brewdoses:    { value: [1, 2, 3, 4, 5, 6, 7, 8, 10], dust: [1000, 1500, 2000, 2500, 3000, 4500, 6000, 9000] },  // doses a brew
  // The three brews' potency, one a brew, in the percent the row shows; every
  // trade reads it in its own terms (DESIGN.md, "Three brews, one a coin").
  'potency-stew':   { value: [25, 30, 35, 40, 45, 50, 55, 60, 70], dust: [1000, 1500, 2000, 2500, 3000, 4500, 6000, 9000] },  // % quicker
  'potency-strong': { value: [25, 30, 35, 40, 45, 50, 55, 60, 70], dust: [1000, 1500, 2000, 2500, 3000, 4500, 6000, 9000] },  // % stronger
  'potency-brace':  { value: [8, 9, 10, 11, 12, 14, 15, 20, 25], dust: [1000, 1500, 2000, 2500, 3000, 4500, 6000, 9000] }   // points of crit
};

// A ladder's value at a rung: the foot below nought, the top past the end. A
// save from a longer ladder reads as the top rather than as a rung nothing
// agrees with, the same clamp every ladder makes on read.
const clamp = (list, i) => list[Math.max(0, Math.min(list.length - 1, i | 0))];
export const rungValue = (key, lvl) => clamp(LADDERS[key].value, lvl);
// ...and what the next rung costs in dust, from the rung you stand on.
export const rungDust = (key, lvl) => clamp(LADDERS[key].dust, lvl);

// A knob a rung, for the ladder book and the dev panel. The key names the
// ladder, the list and the rung -- `LADDERS.carry.value[2]` -- so what the
// book copies out reads as the line to change.
export const RUNG_KNOBS = Object.entries(LADDERS).flatMap(([key, { value, dust }]) => [
  ...value.map((_, i) => ({
    key: `LADDERS.${key}.value[${i}]`, label: `${key}, rung ${i}`,
    min: 0, max: 100000, step: Number.isInteger(value[i]) ? 1 : 0.01,
    get: () => value[i], set: v => { value[i] = v; }
  })),
  ...dust.map((_, i) => ({
    key: `LADDERS.${key}.dust[${i}]`, label: `${key}, rung ${i + 1} cost`,
    min: 0, max: 1000000, step: 1,
    get: () => dust[i], set: v => { dust[i] = v; }
  }))
]);
