// Every ladder, rung by rung, written down: what it is worth and what it costs.
//
// A ladder used to be two formulas -- a value curve (a unit a rung for a
// count, an ease from a base to a top for a rate) and a price curve (a first
// cost raised by a rate a rung) -- and the player asked to move each rung on
// its own: carry 1, 2, 4, 6, 10; the pick 1, 2, 4, 8; the swing a second
// faster a rung. At four rungs a curve cannot be told from a list and cannot
// be made to say the numbers in somebody's head, so a list it is, for the
// value and for the price both. See DESIGN.md, "A rung is a step up, not a
// step along" and its as-built note.
//
// One entry a ladder, by the row's key. `value` is what the row reads, in the
// row's own unit -- pixels, grains, spores, a share, px/s, trips a minute, a
// percent -- rung nought first, then one a rung: `LADDER + 1` long, the last
// the top. `dust` is what each rung costs in dust, `LADDER` long; the coins a
// band adds are that dust at the coins' rates (`DUST_PER`), which is the one
// rule the bills keep. test/ladders.test.mjs says every list is the length
// it must be and every value climbs, so a list a rung short is a red check
// rather than a ladder that stops early.
//
// The game reads its rates off these too: a swing's gap is a thousand over
// the px/s written here, a plot's tending sixty thousand over the plots a
// minute. What used to be MINE_BASE and MINE_FLOOR, TEND_BASE and TEND_FLOOR
// and their kin is the first and last entry of the row's list.
//
// Every entry is a dial in the ladder book (ladders.html) and on the dev
// panel: `RUNG_KNOBS` hands `TUNABLE` a knob a rung. The table was seeded with
// what the curves gave on 2026-09-14 and rounded by hand the same day: round
// figures a rung, the costs mostly doubling, the tops near where they were.

export const LADDERS = {
  // --- the bench: you --------------------------------------------------------
  carry:        { value: [1, 2, 4, 6, 10],           dust: [20, 100, 200, 600] },       // px you can carry
  speed:        { value: [1, 2, 4, 6, 8],            dust: [100, 200, 400, 800] },      // px/s, your swing
  pick:         { value: [1, 2, 4, 8, 12],           dust: [250, 500, 1000, 2000] },    // px your swing takes
  critchance:   { value: [5, 10, 15, 20, 25],        dust: [500, 1250, 3000, 8000] },   // % of swings
  critmult:     { value: [3, 4, 5, 6, 8],            dust: [1000, 2500, 6000, 16000] }, // x a crit is worth
  // --- the shack: the gang -----------------------------------------------------
  rockhandpick: { value: [1, 2, 3, 4, 5],            dust: [1000, 2000, 4000, 8000] },  // px a rockhand takes
  rockhandspeed:{ value: [1, 1.5, 2, 3, 4],          dust: [200, 400, 800, 1600] },     // px/s, its swing
  // --- the bench: the haulers ---------------------------------------------------
  haulcarry:    { value: [1, 3, 6, 10, 16],          dust: [150, 300, 500, 1000] },     // grains a load
  haulpace:     { value: [100, 200, 300, 400, 500],  dust: [200, 400, 600, 1200] },     // px/s, the walk
  // --- the scrubbing house -----------------------------------------------------
  fan:          { value: [30, 40, 50, 70, 90],       dust: [1000, 2000, 4000, 7000] },  // motes/s a fan pulls
  // --- the quarry ---------------------------------------------------------------
  seam:         { value: [1, 1.5, 2, 3, 4],          dust: [750, 1500, 2500, 5000] },   // a dig, as a share of the handful a bench
  quarrypace:   { value: [5, 10, 15, 25, 40],        dust: [750, 1500, 2500, 5000] },   // trips a minute
  // --- the farm -----------------------------------------------------------------
  crop:         { value: [1, 2, 4, 6, 10],           dust: [750, 1500, 2500, 5000] },   // spores a cut
  tend:         { value: [6, 10, 20, 30, 50],        dust: [750, 1500, 2500, 5000] },   // plots a minute
  // --- the apothecary -----------------------------------------------------------
  bufflength:   { value: [60, 90, 120, 150, 180],    dust: [1000, 2000, 3000, 6000] },  // seconds a dose lasts
  brewdoses:    { value: [1, 2, 3, 5, 8],            dust: [1000, 2000, 3000, 6000] },  // doses a brew
  'potency-stew':   { value: [25, 35, 45, 50, 60],   dust: [1000, 2000, 3000, 6000] },  // % quicker work
  'potency-brace':  { value: [8, 10, 12, 15, 20],    dust: [1000, 2000, 3000, 6000] },  // % more crits
  'potency-strong': { value: [50, 70, 85, 100, 120], dust: [1000, 2000, 3000, 6000] },  // % more carried
  'potency-swift':  { value: [25, 35, 45, 50, 60],   dust: [1000, 2000, 3000, 6000] },  // % quicker walk
  'potency-gleam':  { value: [20, 25, 30, 40, 50],   dust: [1000, 2000, 3000, 6000] }   // % more sparks
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
