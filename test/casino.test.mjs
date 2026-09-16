// The stake is dust you sweep, and the casino has no board.
//
// One pile a coin stands beside the building: the purse itself, at the
// table's band ladder, each grain worth its band. You sweep grains off it
// the way you sweep dust anywhere in the yard and let them go over the
// hopper's rim, and they are the stake. The arm opens the floor: the whole
// pile drains into the machine and a handful of pebbles comes out of the
// throat and down the pegs, each carrying its share of the stake, into the
// drop's fair bins. The bins pay into the tray; the button tips the tray out
// on to the ground for the haulers, or the crank winds it back up for
// another hand. See DESIGN.md, "The handful" and "The stake is a heap you
// carry".
//
// These check the mechanism a hand at a time, done the way a player does it:
// the sweep off the pile, the let-go at the rim, the three controls. The
// sweep here is the two calls the pointer makes (`__sweep`, `__let`); the
// real drag on a desk and on a phone is in selftest/casino.js. The spread
// the bet hangs on is measured two thousand hands at a time in
// handful.test.mjs.

import { yard, group, ok, state, run, runUntil, quickCrew } from './helpers.mjs';
import { CASINO_BINS, CASINO_HANDFUL, CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM, PILE_LIMIT,
         shownFor } from '../src/config.js';

// The table, opened without the dust it costs, with dust in the hole to stake
// out of, and the piles rained in and standing.
function atTheTable(dust = 6000) {
  window.__reset();
  window.__casino(true);
  window.__give(dust);
  window.__build();
  runUntil(() => piles().every(h => h.grains >= h.want), 20);
}
const piles = () => state().stakes;
const pile = cur => piles().find(h => h.cur === cur);

// One grain swept off a pile and let go over the rim, the way a drag does
// it, and the grain down: true when it went into the funnel.
function sweepOne(cur = 'dust') {
  const at = window.__stakeAt(cur);
  const rim = window.__rim();
  const held = window.__sweep(at.x, at.y);
  window.__let(rim.x, rim.y);
  runUntil(() => !state().inHand && state().chips === 0, 5);
  return held > 0;
}

// This many grains swept in, a drag a grain, and the pour settled: the pot
// standing in the hopper, the arm live.
function stakeGrains(n, cur = 'dust') {
  const got = window.__casinoStake(n, cur);
  runUntil(() => !state().pouring, 30);
  return got === n;
}

// A hand from the arm to the tray standing, watching the bins on the way:
// the counts the moment the last pebble is still, so the pay can be checked
// against them; and whether any grain ever faded, anywhere, while the hand
// was on the board, which none may -- sand leaves the hopper through the gate
// and nowhere else.
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
    // (a pile beside the building fading to a smaller purse is its own affair)
    if (d.stage === 'drop') faded += yard.S.tableAir.filter(k => k.fade && k.stake == null).length;
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

group('one pile a coin: the purse at its band, a grain worth its share', async () => {
  atTheTable(6000);
  const fresh = piles();
  const dust = pile('dust');
  const gone = ['chip', 'stakedust', 'stakeshard', 'stakespore', 'letgo', 'bank', 'ride'];
  const rows = window.__rows().filter(r => gone.includes(r.key)).map(r => r.key);
  const at = window.__stakeAt('dust');
  const underHand = window.__dustUnder(at.x, at.y);
  // the quarry stands and ore is a coin: a pile of it rains in
  window.__crew(0, 0, 1);
  window.__grant({ shards: 500 });
  runUntil(() => pile('shard').grains >= pile('shard').want && pile('shard').want > 0, 20);
  const ore = pile('shard');
  // the purse shrinks and the pile fades to the new band
  window.__grant({ shards: -450 });
  runUntil(() => pile('shard').grains <= pile('shard').want, 20);
  const less = pile('shard');
  return [
    ok(fresh.length === 3 && fresh.map(h => h.cur).join(',') === 'dust,shard,spore', 'three plots, one a coin',
       fresh.map(h => h.cur).join(',')),
    ok(dust.grains === dust.want && dust.want === shownFor(6000), 'the dust pile is the purse at the band',
       `${dust.grains} of ${dust.want}`),
    ok(dust.worth === Math.round(6000 / shownFor(6000)), 'and a grain of it is worth its share', `${dust.worth}`),
    ok(fresh.filter(h => h.cur !== 'dust').every(h => h.grains === 0 && h.want === 0),
       'no pile of a coin the yard has not handed out'),
    ok(underHand, 'a finger on the pile finds dust to sweep'),
    ok(ore.grains === shownFor(500) && ore.worth === Math.round(500 / shownFor(500)),
       'ore stands once the quarry does, at its band', `${ore.grains} worth ${ore.worth}`),
    ok(less.grains === shownFor(50) && less.want === shownFor(50), 'and shrinks with the purse', `${less.grains}`),
    ok(!rows.length, 'and the casino has no rows on any board', rows.join(','))
  ];
}, { reload: false });                                // sand is never saved: a reload re-rains the piles

group('grains swept off the pile and let go over the rim are the stake, to the grain', async () => {
  atTheTable();
  const held = state().stored;
  const worth = pile('dust').worth;
  const at = window.__stakeAt('dust');
  const up = window.__sweep(at.x, at.y);
  const lifted = state();
  const rim = window.__rim();
  window.__let(rim.x, rim.y);
  runUntil(() => state().pot !== null, 5);
  const down = state();
  let sawAir = 0;
  for (let i = 0; i < 600 && state().pouring; i++) { run(1 / 60); if (state().tableAir > 0) sawAir++; }
  const one = state();
  const more = stakeGrains(4);
  const five = state();
  return [
    ok(up === 1 && lifted.inHand === 1 && lifted.stakes[0].grains === shownFor(6000) - 1,
       'the sweep lifts a grain off the pile on to the cursor', `${up} held, ${lifted.stakes[0].grains} left`),
    ok(down.pot && down.pot.on === worth && down.pot.where === 'hopper' && down.pot.cur === 'dust',
       'let go over the rim it is the pot, worth its band', JSON.stringify(down.pot)),
    ok(down.stored === held - worth, 'and the purse is down by the same', `${down.stored} vs ${held - worth}`),
    ok(down.pouring && sawAir > 0, 'and the hopper walks to it, grain by grain', `${sawAir} frames with a grain flying`),
    ok(one.table === shownFor(worth) && one.tableWant === shownFor(worth),
       'until the pile in the funnel is the pot at the band', `${one.table}`),
    ok(more && five.pot.on === worth * 5 && five.pot.stake === worth * 5 && five.stored === held - worth * 5,
       'each grain after adds its worth to the pot', JSON.stringify(five.pot)),
    ok(five.table === shownFor(worth * 5), 'and the funnel grows to the band of the sum', `${five.table}`),
    ok(pile('dust').grains === pile('dust').want, 'the pile stands again, rained back to its band',
       `${pile('dust').grains} of ${pile('dust').want}`),
    // the written ladder: one for one to the first band, then a tenfold pot for
    // a band more, never past the brim
    ok(shownFor(CASINO_PILE_ONE * 10) === CASINO_PILE_ONE + CASINO_PILE_BAND && shownFor(1e9) === CASINO_PILE_BRIM,
       'which reads off the band ladder', `${shownFor(1000)}, ${shownFor(1e9)}`),
    ok(window.__clickLever('casino-gate') && state().letting === true, 'and the arm is live')
  ];
}, { reload: false });

group('another coin is refused at the rim, and grains swept out of the bowl go home', async () => {
  atTheTable();
  window.__dig(23);
  window.__crew(0, 0, 1);                             // the quarry stands: ore is a coin
  window.__grant({ shards: 500 });
  runUntil(() => pile('shard').grains >= pile('shard').want && pile('shard').want > 0, 20);
  const held = state().stored, ore = state().shards;
  stakeGrains(5);
  const pot = state().pot.on;
  // a grain of ore over the rim
  const at = window.__stakeAt('shard');
  const rim = window.__rim();
  const up = window.__sweep(at.x, at.y);
  window.__let(rim.x, rim.y);
  let arcs = 0;
  for (let f = 0; f < 60 * 5 && (state().inHand || state().chips || state().homing); f++) { run(1 / 60); if (state().homing) arcs++; }
  const refused = state();
  // and a grain of the pot swept out of the bowl and dropped on the ground
  const bowl = window.__bowlAt();
  const out = window.__sweep(bowl.x, bowl.y);
  const lifted = state();
  window.__let(at.x - 60, at.y - 120);
  let home = 0;
  for (let f = 0; f < 60 * 5 && (state().inHand || state().chips || state().homing); f++) { run(1 / 60); if (state().homing) home++; }
  runUntil(() => !state().pouring, 30);
  const back = state();
  return [
    ok(pot === pile('dust').worth * 5, 'five grains of dust are the pot', `${pot}`),
    ok(up === 1 && arcs > 0, 'a grain of ore let go over the rim arcs home to its pile', `${up} held, ${arcs} frames homing`),
    ok(refused.pot.on === pot && refused.pot.cur === 'dust' && refused.shards === ore,
       'the pot and the ore are as they were', JSON.stringify(refused.pot)),
    ok(pile('shard').grains === pile('shard').want, 'and the ore pile stands as it did'),
    ok(out === 1 && lifted.pot.on === pot - 1 && lifted.table === shownFor(pot) - 1,
       'a grain swept out of the bowl takes its worth off the pot', `${lifted.pot.on} on, ${lifted.table} in the bowl`),
    ok(home > 0 && back.stored === held - pot + 1, 'dropped on the ground it goes home and the purse rises',
       `${home} frames homing, ${back.stored} vs ${held - pot + 1}`),
    ok(back.pot.on === pot - 1 && back.table === shownFor(pot - 1), 'and the pot is what stands in the bowl',
       `${back.pot.on}, ${back.table}`)
  ];
}, { reload: false });

// A hand is longer than the reload harness's five seconds and is one
// particular handful on the pegs -- a save writes the pot down and a load
// pours it back into the hopper -- so these follow it without the harness.
group('the arm plays the hand: a handful of pebbles for every stake', async () => {
  atTheTable();
  stakeGrains(5);
  const on = state().pot.on;
  const hand = playHand();
  const s = hand.s;
  const expect = hand.bins ? owed(hand.bins, on) : -1;
  return [
    ok(hand.pulled, 'the arm opens the floor'),
    ok(hand.stood === shownFor(on), 'on a pile at the band of the stake', `${hand.stood}`),
    ok(hand.sent === Math.min(on, CASINO_HANDFUL) && hand.bins && hand.bins.reduce((a, b) => a + b, 0) === CASINO_HANDFUL,
       'and exactly a handful of pebbles reaches the bins', `${hand.sent} sent, ${hand.bins && hand.bins.join(',')}`),
    ok(hand.fell > 1, 'as a cascade, several on the board at once', `${hand.fell} at most`),
    ok(hand.faded === 0, 'and nothing fades, in the field or over the hopper: the pile drains through the gate',
       `${hand.faded} fading frames`),
    ok(!s.letting && !s.pouring && s.table === 0, 'the hand settles on its own with the hopper drained'),
    ok(s.pot && s.pot.where === 'tray' && s.pot.on === expect,
       "to the sum of each pebble's bin, to the grain",
       `${s.pot && s.pot.on} on the row, ${expect} owed by ${hand.bins && hand.bins.join(',')}`),
    ok(s.tray === shownFor(expect), 'and the tray stands at the band of what was paid', `${s.tray} for ${expect}`),
    ok(s.hand && Math.abs(s.hand.mult - expect / on) < 0.01, 'and the box says the multiple', s.hand && `${s.hand.mult}`)
  ];
}, { reload: false });

group('a stake of ten is ten pebbles, and a big stake the same handful', async () => {
  // on a purse of a hundred a grain is one, so ten grains are a stake of ten
  atTheTable(100);
  stakeGrains(10);
  const ten = playHand();
  runUntil(() => !state().pouring, 20);
  window.__clickLever('casino-chute');
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  window.__clearFloor();
  // and on a rich one a grain is worth two hundred
  window.__give(60000);
  runUntil(() => pile('dust').grains >= pile('dust').want && pile('dust').worth > 100, 20);
  stakeGrains(5);
  const on = state().pot.on;
  const big = playHand();
  return [
    ok(ten.stood === 10 && ten.bins && ten.bins.reduce((a, b) => a + b, 0) === 10, 'ten pebbles for a stake of ten',
       `${ten.stood} stood, ${ten.bins && ten.bins.join(',')}`),
    ok(on >= 900 && big.stood === shownFor(on) && big.bins && big.bins.reduce((a, b) => a + b, 0) === CASINO_HANDFUL,
       'a thousand stands as its band and drops the handful', `${on} staked, ${big.stood} stood, ${big.bins && big.bins.join(',')}`),
    ok(ten.faded === 0 && big.faded === 0, 'nothing fades either time')
  ];
}, { reload: false });

group('the crank hoists the tray back to the hopper and the next hand is off the new stake', async () => {
  atTheTable();
  stakeGrains(5);
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

// Banking is a heap on the ground, and the crew carries it in. The button
// tips the tray on to the casino's strip -- a tray grain lands as the grains
// it is worth -- and the counter moves as the haulers' loads land in the hole.
group('the button tips the tray on to the strip and the haulers carry it to the hole', async () => {
  atTheTable();
  window.__dig(23);
  stakeGrains(5);
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
    ok(on > 0 && took, 'there is a pot to take, and the button opens the chute', `${on}`),
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
  stakeGrains(5);
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
  run(0.5);                                          // the ground is counted four times a second
  const after = state();
  return [
    ok(on > 0 && took, 'the button is pressed on a pot', `${on}`),
    ok(full.pileMarks.includes('casino'), 'the strip is full and its mark stands', full.pileMarks.join(',')),
    ok(held.paying === on && held.tray > 0, 'so the pot waits in the tray', `${held.paying} still to go, ${held.tray} in the tray`),
    ok(after.paying === null && after.pileCount.casino === on, 'and runs out once there is room', `${after.pileCount.casino} on the ground`)
  ];
}, { reload: false });

group('every control is dead mid-hand, and the bowl cannot be swept', async () => {
  atTheTable();
  const shut = {};
  const tryAll = when => {
    shut[when] = ['casino-gate', 'casino-chute', 'casino-crank'].filter(k => window.__clickLever(k));
    const bowl = window.__bowlAt();
    if (bowl && window.__sweep(bowl.x, bowl.y)) shut[when].push('sweep');
  };
  stakeGrains(5);
  sweepOne();                                        // one more, still pouring in
  run(0.2);
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
    ok(before.pot && before.pot.on === pile('dust').worth * 6 && before.stored === after.stored,
       'the purse and the pot are where they were', `${before.pot && before.pot.on}`),
    ok(mid.letting && mid.drop && mid.drop.falling > 0, 'the hand is on the board when asked', JSON.stringify(mid.drop)),
    ok(shut.pouring.length === 0, 'nothing fires while the stake is pouring', shut.pouring.join(',')),
    ok(shut.cascading.length === 0, 'nor while the handful is on the pegs', shut.cascading.join(',')),
    ok(shut.paying.length === 0, 'nor while the bins are paying', shut.paying.join(',')),
    ok(after.pot && after.pot.where === 'tray', 'and the hand plays itself out from there')
  ];
}, { reload: false });

// A save mid-cascade is a bet that was made: the pot is written down and the
// path in flight is not, so it comes back a pot in the hopper with the arm
// live again -- the way a wheel mid-spin did.
group('a save mid-cascade comes back a pot in the hopper with the decision open', async () => {
  atTheTable();
  const held = state().stored;
  stakeGrains(5);
  const on = state().pot.on;
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
    ok(!back.letting && back.pot && back.pot.where === 'hopper' && back.pot.on === on,
       'it comes back a pot in the hopper, the path in flight forgotten', JSON.stringify(back.pot)),
    ok(back.pouring && back.table < shownFor(on), 'pouring in again out of the sky', `${back.table} down`),
    ok(stood.table === shownFor(on) && !stood.pouring, 'until it stands as it did', `${stood.table}`),
    ok(back.stored === held - on, 'and the purse is as it was', `${back.stored}`),
    ok(pulled, 'with the arm live again')
  ];
}, { reload: false });
