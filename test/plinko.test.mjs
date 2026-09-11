// The drop: the plinko board on the casino's roof.
//
// One rock carries the whole pot down ten rows of pegs, and the bin it lands in
// is what the pot is multiplied by. The wheel is even money and nothing else;
// this is the second way a pot gets settled, and the one whose answer is a
// number. What these check is that the board is fair to the grain, that a drop
// bought the player's way settles the pot by the bin the rock reached, that the
// heap on the ground follows, and that everything is shut while the rock is out.
// See DESIGN.md, "The drop".

import { yard, group, ok, state, run, runUntil } from './helpers.mjs';
import { PLINKO_BINS, PLINKO_ROWS, PLINKO_DUST } from '../src/config.js';

// The table and the board, without the dust the tower costs, with something to
// stake out of and the chip wound up to a pot worth watching.
function atTheBoard(chip = 1) {
  window.__reset();
  window.__plinko(true);
  window.__give(6000);
  window.__chip(chip);
  window.__build();
  run(0.5);
}

const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; };

group('the bins pay exactly one', async () => {
  // Weighted by how often ten fair coins reach each bin, the table pays 1.000.
  // The drop is fair the way the wheel is: no bin can be tuned on its own.
  const ways = PLINKO_BINS.map((_, k) => choose(PLINKO_ROWS, k));
  const total = ways.reduce((a, b) => a + b, 0);
  const pays = PLINKO_BINS.reduce((a, m, k) => a + m * ways[k], 0);
  const mirrored = PLINKO_BINS.every((m, k) => m === PLINKO_BINS[PLINKO_BINS.length - 1 - k]);
  return [
    ok(PLINKO_BINS.length === PLINKO_ROWS + 1, 'one bin more than there are rows',
       `${PLINKO_BINS.length} bins, ${PLINKO_ROWS} rows`),
    ok(pays === total, 'and, weighted by the odds of reaching each, they pay exactly the stake',
       `${pays} in ${total}`),
    ok(mirrored, 'and the board is the same either way up')
  ];
});

group('the tower is bought on the bench and put up by the yard', async () => {
  window.__reset();
  window.__casino(true);
  window.__crew(2, 0, 0, 0);
  window.__give(PLINKO_DUST + 100);
  window.__build();
  run(0.5);
  const before = state();
  const shut = window.__buy('dropdust');            // no board yet: no row to put a chip on
  const bought = window.__buy('unlockplinko');
  const started = state();
  window.__finish();
  run(0.5);
  const up = state();
  return [
    ok(!before.plinkoOpen, 'it starts as a casino with a bare roof'),
    ok(!shut, 'and the board has no chip row until it stands'),
    ok(bought, 'the row on the bench takes the dust and starts the work'),
    ok(started.stored < before.stored, 'the price came out of the hole',
       `${before.stored} -> ${started.stored}`),
    ok(!started.plinkoOpen, 'and the board is not up until the yard has built it'),
    ok(up.plinkoOpen, 'and it is up when the work lands')
  ];
});

// A run of drops, each bought through its row, each settled by its bin. The
// seed is fixed, so which bins come up is the same every time -- but the check
// is written against whichever they are, because the claim is about the
// arithmetic and not about the luck.
group('a drop settles the pot by the bin the rock lands in', async () => {
  atTheBoard();
  const hands = [];
  let bad = [];
  for (let i = 0; i < 12; i++) {
    // a fresh chip, or the pot already on the table, down the board
    const on = state().pot;
    const put = on ? window.__buy('dropit') : window.__buy('dropdust');
    if (!put) { bad.push(`hand ${i}: the row would not take it`); break; }
    const before = state().pot.on;
    // the rock lets go once the sand is still, and not before -- and it is the
    // rock, not the wheel
    const off = runUntil(() => state().dropping || state().spinning, 30);
    const mid = state();
    const spunInstead = mid.spinning;
    runUntil(() => !state().dropping, 10);
    const after = state();
    const mult = PLINKO_BINS[mid.drop.bin];
    const want = Math.floor(before * mult);
    hands.push({ before, bin: mid.drop.bin, mult, after: after.pot ? after.pot.on : 0 });
    if (spunInstead) bad.push(`hand ${i}: the wheel went round for a drop`);
    if (!off) bad.push(`hand ${i}: the rock never let go`);
    if (mid.pouring || mid.tableAir) bad.push(`hand ${i}: it let go with sand still in the air`);
    if ((after.pot ? after.pot.on : 0) !== want)
      bad.push(`hand ${i}: ${before} x ${mult} should be ${want}, is ${after.pot ? after.pot.on : 0}`);
    if (!after.hand || after.hand.mult !== mult) bad.push(`hand ${i}: the mark does not say the bin`);
    // and the heap walks itself to the new number
    const settled = runUntil(() => state().table === state().tableWant && state().tableAir === 0, 20);
    if (!settled) bad.push(`hand ${i}: the heap never reached ${state().tableWant} (${state().table})`);
    runUntil(() => state().rockHome, 10);
  }
  const seen = new Set(hands.map(h => h.mult));
  return [
    ok(hands.length === 12, 'twelve drops went down', hands.map(h => `${h.before}x${h.mult}=${h.after}`).join(' ')),
    ok(bad.length === 0, 'and every one was settled by its bin', bad.join('; ')),
    ok(seen.size > 1, 'and they did not all land in the same bin', [...seen].join(','))
  ];
});

group('the board is shut while the rock is out', async () => {
  atTheBoard();
  window.__buy('dropdust');
  runUntil(() => state().dropping, 30);
  const mid = state();
  const again = window.__buy('dropdust');
  const banked = window.__buy('bank');
  const spun = window.__buy('ride');
  const dropped = window.__buy('dropit');
  const still = state();
  runUntil(() => !state().dropping, 10);
  const landed = state();
  const early = landed.pot ? window.__buy('dropit') : null;   // winching: not yet
  runUntil(() => state().rockHome, 10);
  const home = state();
  const late = home.pot ? window.__buy('dropit') : null;
  return [
    ok(mid.dropping && !mid.rockHome, 'the rock is on its way down'),
    ok(!again && !banked && !spun && !dropped, 'and nothing on the board answers'),
    ok(still.pot && still.pot.on === mid.pot.on, 'so the pot is exactly where it was'),
    ok(landed.drop && landed.drop.landed && !landed.rockHome, 'it lands and is winched back'),
    ok(early !== true, 'and a second drop waits for the rock to be home'),
    ok(home.rockHome, 'which it is, shortly'),
    ok(home.pot ? late === true : true, 'and then the board is open again')
  ];
});

// A stake put down for the board and caught mid-pour comes back owed a drop,
// not a spin: the bet is the bet that was made. The rock itself is not saved,
// the way a wheel mid-spin is not -- a drop caught in the air comes back a pot
// on the table with the decision open again.
group('a save mid-pour for the board comes back owed a drop', async () => {
  atTheBoard();
  const stake = state().stakes.dust;
  window.__buy('dropdust');
  run(0.3);
  window.__reload();
  const back = state();
  runUntil(() => state().spinning || state().dropping, 30);
  const spun = state().spinning, dropped = state().dropping;
  return [
    ok(back.plinkoOpen, 'the board is still up'),
    ok(back.pot && back.pot.on === stake && back.pouring, 'the pot is on the table and still owed',
       back.pot && `${back.pot.on}`),
    ok(!spun, 'the wheel does not go round for it'),
    ok(dropped, 'the rock does')
  ];
});
