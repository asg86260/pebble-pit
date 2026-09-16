// The handful: a casino that drops dust down a peg board.
//
// The stake rains into the hopper on the roof and stands there as the pot. You
// let it go, and a handful of it -- thirty-two grains, each carrying a thirty-
// second of the stake -- comes out of the heap and down ten rows of pegs into
// eleven bins, every grain flipping its own coin at every peg. The bins pay into
// the tray at the foot, and what stands in the tray is the pot again: bank it,
// or hoist it back up and drop it again. See DESIGN.md, "The handful".
//
// These check the mechanism a hand at a time, bought the way a player buys it:
// the chip row, the let-go row, the two decisions. The spread the design hangs
// on is measured two thousand hands at a time in handful.test.mjs.

import { yard, group, ok, state, run, runUntil, quickCrew } from './helpers.mjs';
import { CASINO_BINS, CASINO_HANDFUL, CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM, PILE_LIMIT } from '../src/config.js';
import { shownFor } from '../src/casino.js';

// The table, opened without the dust it costs, with dust in the hole to stake
// out of and the chip wound to a hundred: a heap worth watching arrive, and a
// stake a whole handful comes out of.
function atTheTable(chip = 1) {
  window.__reset();
  window.__casino(true);
  window.__give(6000);
  yard.S.chip = chip;                  // a setting, like the dial the board draws
  window.__build();
  run(0.5);
}

// The stake into the hopper, the pour settled: the let-go is open.
function staked() {
  const put = window.__buy('stakedust');
  runUntil(() => !state().pouring, 30);
  return put;
}

// A hand from the let-go to the tray standing, watching the bins on the way:
// the counts the moment the last grain is still, so the pay can be checked to
// the grain against them -- and whether any grain ever left the field by
// fading rather than by falling, which none may.
function playHand() {
  const stood = state().table;
  const let_ = window.__buy('letgo');
  let bins = null, sent = 0, fell = 0, faded = 0;
  for (let f = 0; f < 60 * 30 && (state().letting || state().pouring); f++) {
    run(1 / 60);
    const d = state().drop;
    if (!d) continue;
    sent = Math.max(sent, d.sent);
    fell = Math.max(fell, d.falling);
    if (d.stage === 'drop') faded += yard.S.tableAir.filter(k => k.fade).length;
    if (d.stage === 'hold' && !bins) bins = d.bins.slice();
  }
  return { let_, bins, sent, fell, faded, stood, s: state() };
}

// What the bins owe on a stake: each grain its share of the stake times its
// bin's pay, summed and rounded once.
const owed = (bins, stakeN) => {
  const grains = bins.reduce((a, b) => a + b, 0);
  return Math.round(bins.reduce((sum, n, b) => sum + n * CASINO_BINS[b] * (stakeN / grains), 0));
};

group('the bin table is fair to the grain', async () => {
  // Ten fair coins: the odds of each bin are a row of Pascal's triangle over
  // two to the ten, and weighted by them the table pays exactly one.
  const rows = CASINO_BINS.length - 1;
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - i + 1) / i; return r; };
  const paid = CASINO_BINS.reduce((sum, m, b) => sum + m * choose(rows, b), 0);
  const total = Math.pow(2, rows);
  return [
    ok(CASINO_BINS.length === 11, 'eleven bins', `${CASINO_BINS.length}`),
    ok(Math.abs(paid - total) < 1e-9, 'pay 1,024 in 1,024 off the config',
       `${paid} in ${total}`),
    ok(CASINO_BINS.join(',') === [...CASINO_BINS].reverse().join(','), 'and read the same from either end')
  ];
});

group('the stake rains into the hopper and stands there as the pot', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  const held = state().stored;
  const put = window.__buy('stakedust');
  const down = state();
  let sawAir = 0, poured = 0;
  for (let i = 0; i < 600 && state().pouring; i++) {
    run(1 / 60);
    poured++;
    if (state().tableAir > 0) sawAir++;
  }
  const stood = state();
  const rows = window.__rows().filter(r => r.shown && r.key !== 'unlockcasino').map(r => r.key);
  return [
    ok(put, 'the chip goes down through the row that puts it down'),
    ok(down.stored === held - stake, 'and it comes out of your hands there and then',
       `${held} - ${stake} -> ${down.stored}`),
    ok(down.pot && down.pot.on === stake && down.pot.where === 'hopper',
       'the pot is on the roof the moment it is staked', JSON.stringify(down.pot)),
    ok(down.pouring, 'and it is still in the sky'),
    ok(sawAir > 0, 'the stake is really in the air on the way down',
       `${sawAir} of ${poured} frames with a grain flying`),
    ok(!stood.pouring && stood.table === Math.min(stake, CASINO_HANDFUL) && stood.tableAir === 0,
       'and then it is lying in the hopper as the handful that will fall',
       `${stood.table} for ${stake}, ${stood.tableAir} in the air`),
    ok(stood.tableWant === Math.min(stake, CASINO_HANDFUL),
       'the hopper wants the handful and nothing over it'),
    // the written ladder, which is the tray's: one for one to the first band,
    // then a tenfold pot for a band more, never past the brim
    ok(shownFor(CASINO_PILE_ONE * 10) === CASINO_PILE_ONE + CASINO_PILE_BAND &&
       shownFor(CASINO_PILE_ONE * 100) === Math.min(CASINO_PILE_BRIM, CASINO_PILE_ONE + 2 * CASINO_PILE_BAND) &&
       shownFor(1e9) === CASINO_PILE_BRIM,
       'and past it the heap reads off the band ladder',
       `${shownFor(1000)}, ${shownFor(10000)}, ${shownFor(1e9)}`),
    ok(rows.some(r => r === 'letgo'), 'with the let-go open', rows.join(','))
  ];
});

// A hand is longer than the reload harness's five seconds and is one particular
// handful on the pegs -- a save writes the pot down and a load pours it back
// into the hopper -- so these three follow it without the harness.
group('a handful goes down the pegs and the bins pay into the tray', async () => {
  atTheTable();
  const stake = state().stakes.dust;
  const put = staked();
  const hand = playHand();
  const s = hand.s;
  const expect = hand.bins ? owed(hand.bins, stake) : -1;
  return [
    ok(put && hand.let_, 'the chip goes down and the floor opens through their rows'),
    ok(hand.sent === Math.min(stake, CASINO_HANDFUL),
       'exactly a handful of grains goes down the pegs',
       `${hand.sent} of ${Math.min(stake, CASINO_HANDFUL)}`),
    ok(hand.fell > 1, 'as a stream, several on the board at once', `${hand.fell} at most`),
    ok(hand.bins && hand.bins.reduce((a, b) => a + b, 0) === hand.sent,
       'every grain lands in a bin', hand.bins && hand.bins.join(',')),
    ok(hand.bins && hand.bins.reduce((a, b) => a + b, 0) === hand.stood,
       'and the grains that reach the bins are the grains that stood in the hopper',
       `${hand.stood} stood, ${hand.bins && hand.bins.reduce((a, b) => a + b, 0)} landed`),
    ok(hand.faded === 0, 'and no grain fades in the field', `${hand.faded} fading frames`),
    ok(!s.letting && !s.pouring, 'and the hand settles on its own'),
    ok(s.pot && s.pot.where === 'tray' && s.pot.on === expect,
       'to the sum of each grain\'s bin, to the grain',
       `${s.pot && s.pot.on} on the row, ${expect} owed by ${hand.bins && hand.bins.join(',')}`),
    ok(s.table === 0, 'the hopper is empty again', `${s.table}`),
    ok(s.tray === shownFor(expect) && s.trayWant === shownFor(expect),
       'and the tray stands at the band of what was paid',
       `${s.tray} grains for ${expect}`),
    ok(s.hand && Math.abs(s.hand.mult - expect / stake) < 0.01,
       'and the box says the multiple', s.hand && `${s.hand.mult}`)
  ];
}, { reload: false });

group('drop again hoists the tray back to the hopper and the next hand is off the new stake', async () => {
  atTheTable();
  staked();
  const first = playHand().s;
  const on = first.pot ? first.pot.on : 0;
  const rode = window.__buy('ride');
  let lifted = 0, arcs = 0;
  for (let f = 0; f < 60 * 30 && (state().hoisting || state().pouring); f++) {
    run(1 / 60);
    const t = state();
    if (t.hoisting) lifted++;
    if (t.tableAir > 0) arcs++;
  }
  const up = state();
  const second = playHand();
  const s = second.s;
  const expect = second.bins ? owed(second.bins, on) : -1;
  return [
    ok(on > 0, 'there is a pot in the tray to put back', `${on}`),
    ok(rode, 'and drop again goes through its row'),
    ok(lifted > 0 && arcs > 0, 'the tray goes up grain by grain rather than appearing',
       `${lifted} frames hoisting, ${arcs} with a grain in the air`),
    ok(up.pot && up.pot.where === 'hopper' && up.pot.on === on && up.pot.stake === on,
       'and stands in the hopper as the stake for the next hand', JSON.stringify(up.pot)),
    ok(up.table === Math.min(on, CASINO_HANDFUL) && up.tray === 0,
       'as the handful that will fall, with the tray bare', `${up.table} up, ${up.tray} left`),
    ok(second.let_ && !s.letting,
       'the second hand is let go and settles'),
    ok(second.sent === Math.min(on, CASINO_HANDFUL),
       'a handful of the new stake', `${second.sent} of ${on}`),
    ok(s.pot ? s.pot.on === expect : expect === 0,
       'and pays off the new stake, to the grain',
       `${s.pot && s.pot.on} on the row, ${expect} owed`)
  ];
}, { reload: false });

// Banking is a heap on the ground, and the crew carries it in. The chute
// tips the tray on to the casino's strip -- a tray grain lands as the grains
// it is worth -- and the counter moves as the haulers' loads land in the hole.
group('the chute tips the tray on to the strip and the haulers carry it to the hole', async () => {
  atTheTable();
  window.__dig(23);                                  // room for it
  staked();
  const s = playHand().s;
  const on = s.pot ? s.pot.on : 0;
  const held = state().stored;
  const strip = state().piles.find(p => p.key === 'casino');
  const took = window.__buy('bank');
  run(0.6);
  const flying = state();
  runUntil(() => state().tableAir === 0 && !state().paying, 30);
  const tipped = state();
  const onGround = tipped.pileCount.casino;
  window.__crew(0, 4);                               // and now somebody to carry it
  quickCrew();
  const carried = runUntil(() => state().stored >= held + on, 240);
  const landed = state();
  return [
    ok(on > 0 && took, 'there is a pot to take, and the chute opens through its row', `${on}`),
    ok(!!strip && strip.to <= s.casinoX, 'the casino has a strip on the ground at its left',
       strip && `${strip.from}..${strip.to}, building at ${s.casinoX}`),
    ok(flying.tableAir > 0 && flying.paying !== null,
       'opening it puts the tray in the air', `${flying.tableAir} flying, ${flying.paying} still to go`),
    ok(flying.stored === held, 'and the counter does not move for it',
       `${flying.stored} vs ${held}`),
    ok(onGround === on, 'the pot lies on the strip to the grain',
       `${onGround} on the ground for a pot of ${on}`),
    ok(tipped.tray === 0 && tipped.pot === null, 'and the tray is bare',
       `${tipped.tray} in the tray`),
    ok(carried && landed.stored === held + on,
       'and the haulers carry it to the hole, the counter moving as each load lands',
       `${held} + ${on} -> ${landed.stored}`)
  ];
}, { reload: false });

// A pot has to have somewhere to land: a full strip holds the chute, the pot
// waits in the tray, and the mark over the strip says why.
group('a full strip holds the chute', async () => {
  atTheTable();
  window.__dig(23);
  staked();
  const s = playHand().s;
  const on = s.pot ? s.pot.on : 0;
  const strip = state().piles.find(p => p.key === 'casino');
  window.__pile((strip.from + strip.to) / 2, PILE_LIMIT.casino);
  run(0.5);
  const full = state();
  const took = window.__buy('bank');
  run(3);
  const held = state();
  window.__clearFloor();
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  const after = state();
  return [
    ok(on > 0 && took, 'the chute is pulled on a pot', `${on}`),
    ok(full.pileMarks.includes('casino'), 'the strip is full and its mark stands',
       full.pileMarks.join(',')),
    ok(held.paying === on && held.tray > 0, 'so the pot waits in the tray',
       `${held.paying} still to go, ${held.tray} in the tray`),
    ok(after.paying === null && after.pileCount.casino === on,
       'and runs out once there is room', `${after.pileCount.casino} on the ground`)
  ];
}, { reload: false });

group('every row is shut mid-hand', async () => {
  atTheTable();
  const shut = {};
  const tryAll = when => {
    shut[when] = ['stakedust', 'letgo', 'bank', 'ride'].filter(k => window.__buy(k));
  };
  window.__buy('stakedust');
  run(0.3);                                          // the stake still falling
  tryAll('pouring');
  runUntil(() => !state().pouring, 30);
  const before = state();
  window.__buy('letgo');
  run(0.8);                                          // grains on the pegs
  const mid = state();
  tryAll('cascading');
  runUntil(() => state().drop && state().drop.stage === 'pay', 20);
  tryAll('paying');
  runUntil(() => !state().letting && !state().pouring, 30);
  const after = state();
  return [
    ok(before.pot && before.pot.on === 100 && before.stored === after.stored,
       'the purse and the pot are where they were'),
    ok(mid.letting && mid.drop && mid.drop.falling > 0, 'the hand is on the board when asked',
       JSON.stringify(mid.drop)),
    ok(shut.pouring.length === 0, 'nothing fires while the stake is pouring', shut.pouring.join(',')),
    ok(shut.cascading.length === 0, 'nor while the handful is on the pegs', shut.cascading.join(',')),
    ok(shut.paying.length === 0, 'nor while the bins are paying', shut.paying.join(',')),
    ok(after.pot && after.pot.where === 'tray', 'and the hand plays itself out from there')
  ];
}, { reload: false });

// A save mid-cascade is a bet that was made: the pot is written down and the
// path in flight is not, so it comes back a pot in the hopper with the let-go
// open again -- the way a wheel mid-spin did.
group('a save mid-cascade comes back a pot in the hopper with the decision open', async () => {
  atTheTable();
  const held = state().stored;
  staked();
  window.__buy('letgo');
  run(0.8);
  const mid = state();
  window.__reload();
  const back = state();
  runUntil(() => !state().pouring, 30);
  const stood = state();
  const rows = window.__rows().filter(r => r.shown && r.key !== 'unlockcasino').map(r => r.key);
  const let_ = window.__buy('letgo');
  return [
    ok(mid.letting && mid.drop.falling > 0, 'the handful is on the pegs when the save is taken'),
    ok(!back.letting && back.pot && back.pot.where === 'hopper' && back.pot.on === 100,
       'it comes back a pot in the hopper, the path in flight forgotten', JSON.stringify(back.pot)),
    ok(back.pouring && back.table < CASINO_HANDFUL, 'pouring in again out of the sky', `${back.table} down`),
    ok(stood.table === CASINO_HANDFUL && !stood.pouring, 'until it stands as it did', `${stood.table}`),
    ok(back.stored === held - 100, 'and the purse is as it was', `${back.stored}`),
    ok(rows.includes('letgo') && let_, 'with the let-go open again', rows.join(','))
  ];
}, { reload: false });
