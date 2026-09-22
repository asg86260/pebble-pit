// The casino at the other end of the purse: a stake in the millions, and where
// the pay comes down.
//
// A handful is sixteen pebbles whatever the stake, so a big stake is sixteen
// squares each worth a quarter of a million, and every one of them lands in
// the hole as that many grains. Banked a grain a call, a full hole refused
// each of them after searching the whole pile, and a 4M hand ran at under a
// frame a second. See `bankDust` in pit.js.

import { yard, group, ok, state, run, runUntil } from './helpers.mjs';
import { CASINO_PILE_BRIM } from '../src/config.js';

function atTheTable(dust = 6000) {
  window.__reset();
  window.__casino(true);
  window.__give(dust);
  window.__dig(23);
  window.__build();
  run(0.1);
}
// the arm held until the stake stands at `n`, let go, and the pour settled
function stakeTo(n) {
  window.__holdArm(true, 1);
  runUntil(() => (state().pot?.stake || 0) >= n, 60);
  window.__holdArm(false);
  runUntil(() => !state().pouring && state().tableAir === 0, 60);
  return state().pot ? state().pot.stake : 0;
}

group('a stake in the millions pays out without stalling a frame', async () => {
  atTheTable();
  // the purse, set rather than poured into the hole: millions of grains
  // handed over one at a time is its own minute, and not what this is about
  yard.S.stored = 5e6;
  const s0 = stakeTo(4e6);
  const cap = state().pitCapacity;
  window.__tapSign();
  const t0 = performance.now();                // the bug this is about never finished
  const perf = globalThis.__perf;
  let worstCalls = 0, worstCols = 0, frames = 0, hand = null, peakAir = 0;
  const busy = () => state().letting || state().toTray || state().toHole || state().tray || state().paying;
  for (; frames < 60 * 90 && busy(); frames++) {
    perf.grains = 0; perf.grainCols = 0;
    run(1 / 60);
    worstCalls = Math.max(worstCalls, perf.grains);
    worstCols = Math.max(worstCols, perf.grainCols);
    hand = state().hand || hand;
    peakAir = Math.max(peakAir, yard.S.tableAir.length);
    if (performance.now() - t0 > 20000) break;
  }
  return [
    ok(s0 >= 4e6, 'four million staked', `${s0}`),
    ok(!busy(), 'the hand plays out and the pay runs out into the hole', `${frames} frames`),
    // a frame may fill the hole once -- that is what a pay this size does --
    // and never ask it again for every grain it has no room for
    ok(worstCalls <= 2 * cap, 'no frame drops more grains than the hole holds, twice over', `${worstCalls} for a hole of ${cap}`),
    ok(worstCols <= 40 * cap, 'nor asks more columns than a few for each', `${worstCols} columns`),
    // the pay is sent down as the heap it reads as, never a grain a coin: a
    // crop bin on this stake is some ninety thousand crops
    ok(peakAir <= 16 * CASINO_PILE_BRIM, 'and the pay goes down as a reading of itself, not a grain a coin', `${peakAir} in the air at most`),
    ok(hand && hand.n > 0, 'and the hand was paid', hand ? `${hand.n} for ${hand.stake}` : 'no hand')
  ];
}, { reload: false });

group('the pay comes down on the pile, not at the mouth', async () => {
  atTheTable();
  stakeTo(800);
  window.__tapSign();
  // every square on its way over from the hatch: where its arc ends
  const ends = [];
  for (let f = 0; f < 60 * 60 && (state().letting || state().tray || state().toHole || state().toTray); f++) {
    run(1 / 60);
    for (const k of yard.S.tableAir) if (k.lands === 'hole' && k.arc && !k.then && k.arc.x1 !== k.arc.x0) ends.push(k.arc.y1);
  }
  const high = ends.filter(y => y < yard.S.groundY);
  return [
    ok(ends.length > 0, 'the pay flew to the hole', `${ends.length} arcs seen`),
    ok(!yard.S.riftOpen && high.length === 0, 'every arc ends down in the hole, on the pile under it',
       `${high.length} ended above the ground line at ${high[0]}; ground at ${yard.S.groundY}`)
  ];
}, { reload: false });
