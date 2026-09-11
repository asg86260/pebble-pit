// What share of a pour reaches each slot of the casino's board, gate by gate,
// and what that says the slots should pay.
//
//   node tools/node/board-rates.mjs [hands per gate]
//
// The rates in config/casino.js (`SLOT_RATES`) are measured, not chosen: sand
// through pegs is not a binomial, and the share that reaches each slot depends
// on the peg layout and on where the floor opened. This pours the built board
// -- the thousand chip, which is the brim's worth of sand -- from every gate in
// turn, several hands each, and prints the mean share per slot and the rate
// that would make calling that slot pay exactly one across the gates. Round to
// a half and write them down; `test/sandboard.test.mjs` holds them.

import { newYard } from './yard.mjs';
import { GATES, SLOTS, SLOT_RATES } from '../../src/config.js';

const yard = await newYard();
const HANDS = +(process.argv[2] || 6);

const shares = Array.from({ length: SLOTS }, () => 0);
let hands = 0;
for (const g of GATES) {
  for (let h = 0; h < HANDS; h++) {
    window.__seed(1000 + g * 100 + h);
    window.__reset(); window.__casino(true); window.__give(60000); window.__chip(2); window.__build();
    yard.fast(0.5);
    window.__buy('stakedust');
    yard.until(() => !yard.state().pouring, 40);
    // the gate is the one thing that is picked, so pick it
    yard.S.gate = { at: g, since: yard.clock.now() };
    yard.table.repose = false;
    yard.until(() => !yard.state().letting, 60);
    const s = yard.state();
    const counts = s.hand ? s.hand.counts : s.slots;
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    counts.forEach((n, k) => { shares[k] += n / total; });
    hands++;
    console.log(`gate ${String(g).padStart(2)} hand ${h}: ${counts.join(' ')}`);
  }
}
console.log('');
console.log('slot   share    fair rate   written   pays');
for (let k = 0; k < SLOTS; k++) {
  const share = shares[k] / hands;
  const fair = share > 0 ? 1 / share : Infinity;
  console.log(`${String(k + 1).padStart(4)}   ${share.toFixed(3)}    ${fair.toFixed(2).padStart(6)}      ${String(SLOT_RATES[k]).padStart(5)}    ${(share * SLOT_RATES[k]).toFixed(3)}`);
}
