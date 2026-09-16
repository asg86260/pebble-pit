// The stake is a heap you carry, and the casino has no board.
//
// Heaps of each coin stand beside the building in the chip sizes; you lift
// one the way you lift a body, carry it to the hopper and let it go over the
// rim, and it pours in. The gate lever opens the floor: the whole pile drains
// into the machine and a handful of pebbles comes out of the throat and down
// the pegs, each carrying its share of the stake, into the drop's fair bins.
// The bins pay into the tray; the chute tips the tray out on to the ground
// for the haulers, or the crank winds it back up for another hand. See
// DESIGN.md, "The handful" and "The stake is a heap you carry".
//
// These check the mechanism a hand at a time, done the way a player does it:
// the lift, the carry, the drop, the three levers. The spread the bet hangs on
// is measured two thousand hands at a time in handful.test.mjs.

import { yard, group, ok, state, run, runUntil, quickCrew } from './helpers.mjs';
import { CASINO_BINS, CASINO_HANDFUL, CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM, PILE_LIMIT,
         shownFor } from '../src/config.js';

// The table, opened without the dust it costs, with dust in the hole to stake
// out of, and the heaps rained in and standing.
function atTheTable(dust = 6000) {
  window.__reset();
  window.__casino(true);
  window.__give(dust);
  window.__build();
  runUntil(() => heaps().every(h => !h.standing || h.grains >= h.want), 20);
}
const heaps = () => state().stakes;
const heap = (cur, chip) => heaps().find(h => h.cur === cur && h.chip === chip);

// A heap lifted, carried to the rim and let go there, and the pour settled:
// the pot standing in the hopper, the gate lever live.
function stakeHeap(cur, chip) {
  const up = window.__liftStake(cur, chip);
  const rim = window.__rim();
  window.__carryTo(rim.x, rim.y);
  const dropped = window.__dropAt(rim.x, rim.y);
  runUntil(() => !state().pouring, 30);
  return up && dropped;
}

// A hand from the gate lever to the tray standing, watching the bins on the
// way: the counts the moment the last pebble is still, so the pay can be
// checked against them; and whether any grain ever faded, anywhere, while
// the hand was on the board, which none may -- sand leaves the hopper through
// the gate and nowhere else.
function playHand() {
  const stood = state().table;
  const pulled = window.__clickLever('casino-gate');
  let bins = null, sent = 0, fell = 0, faded = 0;
  for (let f = 0; f < 60 * 40 && (state().letting || state().pouring); f++) {
    run(1 / 60);
    const d = state().drop;
    if (!d) continue;
    sent = Math.max(sent, d.sent);
    fell = Math.max(fell, d.falling);
    if (d.stage === 'drop') faded += yard.S.tableAir.filter(k => k.fade).length;
    if (d.stage === 'hold' && !bins) bins = d.bins.slice();
  }
  return { pulled, bins, sent, fell, faded, stood, s: state() };
}

// What the bins owe on a stake: each pebble its share of the stake times its
// bin's pay, summed and rounded once.
const owed = (bins, stakeN) => {
  const grains = bins.reduce((a, b) => a + b, 0);
  return Math.round(bins.reduce((sum, n, b) => sum + n * CASINO_BINS[b] * (stakeN / grains), 0));
};

group('the bin table is fair to the pebble', async () => {
  // Ten fair coins: the odds of each bin are a row of Pascal's triangle over
  // two to the ten, and weighted by them the table pays exactly one.
  const rows = CASINO_BINS.length - 1;
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - i + 1) / i; return r; };
  const paid = CASINO_BINS.reduce((sum, m, b) => sum + m * choose(rows, b), 0);
  const total = Math.pow(2, rows);
  return [
    ok(CASINO_BINS.length === 11, 'eleven bins', `${CASINO_BINS.length}`),
    ok(Math.abs(paid - total) < 1e-9, 'pay 1,024 in 1,024 off the config', `${paid} in ${total}`),
    ok(CASINO_BINS.join(',') === [...CASINO_BINS].reverse().join(','), 'and read the same from either end')
  ];
});

group('the heaps stand only when the purse covers them', async () => {
  atTheTable(6000);
  const before = heaps();
  const dust = h => h.cur === 'dust';
  const gone = ['chip', 'stakedust', 'stakeshard', 'stakespore', 'letgo', 'bank', 'ride'];
  const rows = window.__rows().filter(r => gone.includes(r.key)).map(r => r.key);
  // the pour spends a hundred; the heap stands again after, since the purse
  // still covers it, rained back in
  stakeHeap('dust', 100);
  runUntil(() => heap('dust', 100).grains >= heap('dust', 100).want, 20);
  const after = heap('dust', 100);
  return [
    ok(before.filter(dust).every(h => h.standing), 'every dust heap stands on six thousand',
       before.filter(dust).map(h => `${h.chip}:${h.standing}`).join(',')),
    ok(before.filter(dust).every(h => h.grains === h.want && h.want === shownFor(h.n)),
       'each at the band of what it is', before.filter(dust).map(h => `${h.chip}:${h.grains}/${h.want}`).join(',')),
    ok(heap('dust', 1000).grains > heap('dust', 100).grains && heap('dust', 'all').grains >= heap('dust', 1000).grains,
       'the thousand visibly bigger than the hundred, and the all-in the biggest'),
    ok(before.filter(h => !dust(h)).every(h => !h.standing && h.grains === 0),
       'and no heap of a coin the yard has not handed out'),
    ok(after.standing && after.grains === after.want, 'a heap staked stands again after the pour',
       `${after.grains} of ${after.want}`),
    ok(!rows.length, 'and the casino has no rows on any board', rows.join(','))
  ];
});

group('a heap let go over the rim pours the pot in, to the grain', async () => {
  atTheTable();
  const held = state().stored;
  const up = window.__liftStake('dust', 100);
  const lifted = state();
  const rim = window.__rim();
  window.__carryTo(rim.x, rim.y);
  const dropped = window.__dropAt(rim.x, rim.y);
  const down = state();
  let sawAir = 0;
  for (let i = 0; i < 600 && state().pouring; i++) { run(1 / 60); if (state().tableAir > 0) sawAir++; }
  const stood = state();
  return [
    ok(up && lifted.inHand && lifted.inHand.n === 100 && lifted.stakes.some(h => h.chip === 100 && h.cur === 'dust' && !h.standing && h.grains === 0),
       'the heap comes up into the hand and the ground where it stood goes bare',
       JSON.stringify(lifted.inHand)),
    ok(dropped && down.pot && down.pot.on === 100 && down.pot.where === 'hopper' && down.stored === held - 100,
       'let go over the rim it is the pot, and the purse is down by the same', JSON.stringify(down.pot)),
    ok(down.pouring && sawAir > 0, 'and it pours in, grain by grain', `${sawAir} frames with a grain flying`),
    ok(stood.table === shownFor(100) && stood.tableWant === shownFor(100),
       'until the pile in the funnel is the pot at the band', `${stood.table}`),
    // the written ladder: one for one to the first band, then a tenfold pot for
    // a band more, never past the brim
    ok(shownFor(CASINO_PILE_ONE * 10) === CASINO_PILE_ONE + CASINO_PILE_BAND && shownFor(1e9) === CASINO_PILE_BRIM,
       'which reads off the band ladder', `${shownFor(1000)}, ${shownFor(1e9)}`),
    ok(window.__clickLever('casino-gate') !== undefined && state().letting === true,
       'and the gate lever is live')
  ];
}, { reload: false });

group('two heaps make one pot of their sum, and another coin is refused', async () => {
  atTheTable();
  window.__crew(0, 0, 1);                             // the quarry stands: ore is a coin
  window.__grant({ shards: 500 });
  runUntil(() => heap('shard', 100).grains >= heap('shard', 100).want, 20);
  const held = state().stored, ore = state().shards;
  stakeHeap('dust', 100);
  stakeHeap('dust', 10);
  const two = state();
  const rim = window.__rim();
  const up = window.__liftStake('shard', 100);
  window.__carryTo(rim.x, rim.y);
  window.__dropAt(rim.x, rim.y);
  const refused = state();
  runUntil(() => !state().inHand, 10);
  runUntil(() => heap('shard', 100).grains >= heap('shard', 100).want, 20);
  const back = state();
  return [
    ok(two.pot && two.pot.on === 110 && two.pot.stake === 110 && two.stored === held - 110,
       'a second heap adds to the pot standing in the hopper', JSON.stringify(two.pot)),
    ok(two.table === shownFor(110), 'and the pile grows to the band of the sum', `${two.table}`),
    ok(up && refused.inHand && refused.inHand.returning,
       'a heap of another coin bounces off the rim', JSON.stringify(refused.inHand)),
    ok(refused.pot.on === 110 && refused.pot.cur === 'dust' && refused.shards === ore,
       'the pot and the ore are as they were'),
    ok(!back.inHand && heap('shard', 100).standing && heap('shard', 100).grains === heap('shard', 100).want,
       'and it goes back where it came from')
  ];
}, { reload: false });

group("the hopper's pot lifted out again returns the purse", async () => {
  atTheTable();
  window.__dig(23);
  const held = state().stored;
  stakeHeap('dust', 100);
  const up = window.__liftPot();
  const lifted = state();
  const spot = window.__stakeAt('dust', 1000);
  window.__carryTo(spot.x, spot.y - 60);
  window.__dropAt(spot.x, spot.y - 60);
  run(0.5);
  const flying = state();
  runUntil(() => state().refund == null && state().tableAir === 0, 30);
  const back = state();
  return [
    ok(up && lifted.inHand && lifted.inHand.kind === 'pot' && lifted.inHand.n === 100 && lifted.pot === null && lifted.table === 0,
       'the whole pot comes up out of the hopper and the bowl is bare', JSON.stringify(lifted.inHand)),
    ok(flying.tableAir > 0 && flying.refund > 0, 'let go on the ground it flies to the hole',
       `${flying.tableAir} in the air, ${flying.refund} to go`),
    ok(back.stored === held, 'and the purse is as it was, to the grain', `${back.stored} vs ${held}`),
    ok(back.pot === null && !back.inHand, 'with nothing on the table')
  ];
}, { reload: false });

// A hand is longer than the reload harness's five seconds and is one
// particular handful on the pegs -- a save writes the pot down and a load
// pours it back into the hopper -- so these follow it without the harness.
group('the gate lever plays the hand: a handful of pebbles for every stake', async () => {
  atTheTable();
  stakeHeap('dust', 100);
  const hand = playHand();
  const s = hand.s;
  const expect = hand.bins ? owed(hand.bins, 100) : -1;
  return [
    ok(hand.pulled, 'the gate lever opens the floor'),
    ok(hand.stood === shownFor(100), 'on a pile at the band of the stake', `${hand.stood}`),
    ok(hand.sent === Math.min(100, CASINO_HANDFUL) && hand.bins && hand.bins.reduce((a, b) => a + b, 0) === CASINO_HANDFUL,
       'and exactly a handful of pebbles reaches the bins', `${hand.sent} sent, ${hand.bins && hand.bins.join(',')}`),
    ok(hand.fell > 1, 'as a cascade, several on the board at once', `${hand.fell} at most`),
    ok(hand.faded === 0, 'and nothing fades, in the field or over the hopper: the pile drains through the gate',
       `${hand.faded} fading frames`),
    ok(!s.letting && !s.pouring && s.table === 0, 'the hand settles on its own with the hopper drained'),
    ok(s.pot && s.pot.where === 'tray' && s.pot.on === expect,
       "to the sum of each pebble's bin, to the grain",
       `${s.pot && s.pot.on} on the row, ${expect} owed by ${hand.bins && hand.bins.join(',')}`),
    ok(s.tray === shownFor(expect), 'and the tray stands at the band of what was paid', `${s.tray} for ${expect}`),
    ok(s.hand && Math.abs(s.hand.mult - expect / 100) < 0.01, 'and the box says the multiple', s.hand && `${s.hand.mult}`)
  ];
}, { reload: false });

group('a chip of ten is ten pebbles, and a big stake the same handful', async () => {
  atTheTable(60000);
  stakeHeap('dust', 10);
  const ten = playHand();
  runUntil(() => !state().pouring, 20);
  window.__clickLever('casino-chute');
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  window.__clearFloor();
  stakeHeap('dust', 1000);
  const big = playHand();
  return [
    ok(ten.stood === 10 && ten.bins && ten.bins.reduce((a, b) => a + b, 0) === 10, 'ten pebbles for the ten chip',
       `${ten.stood} stood, ${ten.bins && ten.bins.join(',')}`),
    ok(big.stood === shownFor(1000) && big.bins && big.bins.reduce((a, b) => a + b, 0) === CASINO_HANDFUL,
       'a thousand stands as its band and drops the handful', `${big.stood} stood, ${big.bins && big.bins.join(',')}`),
    ok(ten.faded === 0 && big.faded === 0, 'nothing fades either time')
  ];
}, { reload: false });

group('the crank hoists the tray back to the hopper and the next hand is off the new stake', async () => {
  atTheTable();
  stakeHeap('dust', 100);
  const first = playHand().s;
  const on = first.pot ? first.pot.on : 0;
  const wound = window.__clickLever('casino-crank');
  let lifted = 0, arcs = 0;
  for (let f = 0; f < 60 * 30 && (state().hoisting || state().pouring); f++) {
    run(1 / 60);
    if (state().hoisting) lifted++;
    if (state().tableAir > 0) arcs++;
  }
  const up = state();
  const second = playHand();
  const s = second.s;
  const expect = second.bins ? owed(second.bins, on) : -1;
  return [
    ok(on > 0 && wound, 'there is a pot in the tray, and the crank winds it', `${on}`),
    ok(lifted > 0 && arcs > 0, 'the tray goes up grain by grain rather than appearing', `${lifted} frames, ${arcs} with a grain in the air`),
    ok(up.pot && up.pot.where === 'hopper' && up.pot.on === on && up.pot.stake === on,
       'and stands in the hopper as the stake for the next hand', JSON.stringify(up.pot)),
    ok(up.table === shownFor(on) && up.tray === 0, "the tray's picture, with the tray bare", `${up.table} up, ${up.tray} left`),
    ok(second.pulled && !s.letting && second.sent === Math.min(on, CASINO_HANDFUL),
       'the second hand plays a handful'),
    ok(s.pot ? s.pot.on === expect : expect === 0, 'and pays off the new stake, to the grain',
       `${s.pot && s.pot.on} on the row, ${expect} owed`)
  ];
}, { reload: false });

// Banking is a heap on the ground, and the crew carries it in. The chute
// tips the tray on to the casino's strip -- a tray grain lands as the grains
// it is worth -- and the counter moves as the haulers' loads land in the hole.
group('the chute tips the tray on to the strip and the haulers carry it to the hole', async () => {
  atTheTable();
  window.__dig(23);
  stakeHeap('dust', 100);
  const s = playHand().s;
  const on = s.pot ? s.pot.on : 0;
  const held = state().stored;
  const strip = state().piles.find(p => p.key === 'casino');
  const took = window.__clickLever('casino-chute');
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
    ok(on > 0 && took, 'there is a pot to take, and the chute lever opens it', `${on}`),
    ok(!!strip && strip.to <= s.casinoX, 'the casino has a strip on the ground at its left',
       strip && `${strip.from}..${strip.to}, building at ${s.casinoX}`),
    ok(flying.tableAir > 0 && flying.paying !== null, 'opening it puts the tray in the air',
       `${flying.tableAir} flying, ${flying.paying} still to go`),
    ok(flying.stored === held, 'and the counter does not move for it', `${flying.stored} vs ${held}`),
    ok(onGround === on, 'the pot lies on the strip to the grain', `${onGround} on the ground for a pot of ${on}`),
    ok(tipped.tray === 0 && tipped.pot === null, 'and the tray is bare', `${tipped.tray} in the tray`),
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
  stakeHeap('dust', 100);
  const s = playHand().s;
  const on = s.pot ? s.pot.on : 0;
  const strip = state().piles.find(p => p.key === 'casino');
  window.__pile((strip.from + strip.to) / 2, PILE_LIMIT.casino);
  run(0.5);
  const full = state();
  const took = window.__clickLever('casino-chute');
  run(3);
  const held = state();
  window.__clearFloor();
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  const after = state();
  return [
    ok(on > 0 && took, 'the chute is pulled on a pot', `${on}`),
    ok(full.pileMarks.includes('casino'), 'the strip is full and its mark stands', full.pileMarks.join(',')),
    ok(held.paying === on && held.tray > 0, 'so the pot waits in the tray', `${held.paying} still to go, ${held.tray} in the tray`),
    ok(after.paying === null && after.pileCount.casino === on, 'and runs out once there is room', `${after.pileCount.casino} on the ground`)
  ];
}, { reload: false });

group('every lever is dead mid-hand, and no heap can be lifted', async () => {
  atTheTable();
  const shut = {};
  const tryAll = when => {
    shut[when] = ['casino-gate', 'casino-chute', 'casino-crank'].filter(k => window.__clickLever(k));
    if (window.__liftStake('dust', 10)) shut[when].push('lift');
  };
  const rim = window.__rim();
  window.__liftStake('dust', 100);
  window.__carryTo(rim.x, rim.y);
  window.__dropAt(rim.x, rim.y);
  run(0.3);                                          // the stake still pouring
  tryAll('pouring');
  runUntil(() => !state().pouring, 30);
  const before = state();
  window.__clickLever('casino-gate');
  run(0.8);
  const mid = state();
  tryAll('cascading');
  runUntil(() => state().drop && state().drop.stage === 'pay', 30);
  tryAll('paying');
  runUntil(() => !state().letting && !state().pouring, 30);
  const after = state();
  return [
    ok(before.pot && before.pot.on === 100 && before.stored === after.stored, 'the purse and the pot are where they were'),
    ok(mid.letting && mid.drop && mid.drop.falling > 0, 'the hand is on the board when asked', JSON.stringify(mid.drop)),
    ok(shut.pouring.length === 0, 'nothing fires while the stake is pouring', shut.pouring.join(',')),
    ok(shut.cascading.length === 0, 'nor while the handful is on the pegs', shut.cascading.join(',')),
    ok(shut.paying.length === 0, 'nor while the bins are paying', shut.paying.join(',')),
    ok(after.pot && after.pot.where === 'tray', 'and the hand plays itself out from there')
  ];
}, { reload: false });

// A save mid-cascade is a bet that was made: the pot is written down and the
// path in flight is not, so it comes back a pot in the hopper with the gate
// lever live again -- the way a wheel mid-spin did.
group('a save mid-cascade comes back a pot in the hopper with the decision open', async () => {
  atTheTable();
  const held = state().stored;
  stakeHeap('dust', 100);
  window.__clickLever('casino-gate');
  run(0.8);
  const mid = state();
  window.__reload();
  const back = state();
  runUntil(() => !state().pouring, 30);
  const stood = state();
  const pulled = window.__clickLever('casino-gate');
  return [
    ok(mid.letting && mid.drop.falling > 0, 'the handful is on the pegs when the save is taken'),
    ok(!back.letting && back.pot && back.pot.where === 'hopper' && back.pot.on === 100,
       'it comes back a pot in the hopper, the path in flight forgotten', JSON.stringify(back.pot)),
    ok(back.pouring && back.table < shownFor(100), 'pouring in again out of the sky', `${back.table} down`),
    ok(stood.table === shownFor(100) && !stood.pouring, 'until it stands as it did', `${stood.table}`),
    ok(back.stored === held - 100, 'and the purse is as it was', `${back.stored}`),
    ok(pulled, 'with the gate lever live again')
  ];
}, { reload: false });
