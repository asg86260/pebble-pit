// The stake is a pile you tap, and the casino has no board.
//
// One pile a coin stands beside the building: the purse itself, at the
// table's band ladder, each grain worth its band. A tap on a pile sends a
// tenth of the purse streaming off it, over the rim and into the funnel,
// and taps stack. The arm opens the floor: the whole pile drains into the
// machine and a handful of pebbles comes out of the throat and down the
// pegs, each carrying its share of the stake, into the drop's fair bins. The
// bins pay into the tray; the button tips the tray out on to the ground for
// the haulers -- or for you to sweep -- and the crank winds it back up for
// another hand. See DESIGN.md, "The handful" and "The stake is a heap you
// carry".
//
// These check the mechanism a hand at a time, done the way a player does it:
// the tap on the pile, the tap on the bowl, the three controls. The tap here
// is the call the pointer makes (`__tap`); the real click and finger are in
// selftest/casino.js. The spread the bet hangs on is measured two thousand
// hands at a time in handful.test.mjs.

import { yard, group, ok, state, run, runUntil, quickCrew } from './helpers.mjs';
import { CASINO_BINS, CASINO_HANDFUL, CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM, PILE_LIMIT,
         STAKE_TAP_SHARE, STAKE_TAP_MIN, shownFor } from '../src/config.js';

// The table, opened without the dust it costs, with dust in the hole to stake
// out of, and the piles rained in and standing. A thousand by default: a tap
// of it is a hundred, which a hand's pay fits on the strip.
function atTheTable(dust = 1000) {
  window.__reset();
  window.__casino(true);
  window.__give(dust);
  window.__build();
  runUntil(() => piles().every(h => h.grains >= h.want), 20);
}
const piles = () => state().stakes;
const pile = cur => piles().find(h => h.cur === cur);

// A tap on a pile, the way a click does it: true when the pile took it.
const tap = (cur = 'dust') => { const at = window.__stakeAt(cur); return window.__tap(at.x, at.y); };
// What a tap is worth: a tenth of the purse, floored and capped.
const share = purse => Math.min(purse, Math.max(STAKE_TAP_MIN, Math.round(purse * STAKE_TAP_SHARE)));
// The stream landed and the pour settled.
const streamed = () => runUntil(() => !state().staking && !state().inFlight && !state().pouring, 30);

// This many taps on the dust pile, the streams landed and the pour settled:
// the pot standing in the hopper, the arm live.
function stakeTaps(n, cur = 'dust') {
  const got = window.__casinoStake(n, cur);
  streamed();
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

group('a tap on the pile streams a tenth of the purse into the funnel, and taps stack', async () => {
  atTheTable();
  const held = state().stored;
  const first = share(held);
  const took = tap();
  const going = state();
  let lifted = 0, flying = 0;
  for (let f = 0; f < 60 * 10 && (state().staking || state().inFlight); f++) {
    run(1 / 60);
    if (state().inFlight) flying++;
    if (state().pot && state().pot.on > lifted) lifted = state().pot.on;
  }
  const landed = state();
  streamed();
  const one = state();
  const second = share(one.stored);
  const more = tap();
  streamed();
  const two = state();
  return [
    ok(took && going.staking > 0 && going.staking <= first, 'the tap sets a tenth of the purse going', `${going.staking} to lift of ${first}`),
    ok(flying > 0, 'and it streams: grains in the air for a while', `${flying} frames with a grain flying`),
    ok(landed.pot && landed.pot.on === first && landed.pot.cur === 'dust' && landed.pot.where === 'hopper',
       'landing in the bowl as the pot, to the grain', JSON.stringify(landed.pot)),
    ok(landed.stored === held - first, 'and the purse is down by the same', `${landed.stored} vs ${held - first}`),
    ok(one.table === shownFor(first) && one.tableWant === shownFor(first),
       'until the pile in the funnel is the pot at the band', `${one.table}`),
    ok(more && two.pot.on === first + second && two.pot.stake === first + second && two.stored === held - first - second,
       'a second tap adds a tenth of what is left', JSON.stringify(two.pot)),
    ok(two.table === shownFor(first + second), 'and the funnel grows to the band of the sum', `${two.table}`),
    ok(pile('dust').grains === pile('dust').want, 'the pile stands again, rained back to its band',
       `${pile('dust').grains} of ${pile('dust').want}`),
    ok(share(50) === STAKE_TAP_MIN && share(5) === 5 && share(50000) === 5000, 'a tap is a tenth, never less than the minimum nor more than the purse',
       `${share(50)}, ${share(5)}, ${share(50000)}`),
    // the written ladder: one for one to the first band, then a tenfold pot for
    // a band more, never past the brim
    ok(shownFor(CASINO_PILE_ONE * 10) === CASINO_PILE_ONE + CASINO_PILE_BAND && shownFor(1e9) === CASINO_PILE_BRIM,
       'which reads off the band ladder', `${shownFor(1000)}, ${shownFor(1e9)}`),
    ok(window.__clickLever('casino-gate') && state().letting === true, 'and the arm is live')
  ];
}, { reload: false });

group('a tap on another coin is a dud while a hand stands, and a tap on the bowl sends the pot home', async () => {
  atTheTable();
  window.__dig(23);
  window.__crew(0, 0, 1);                             // the quarry stands: ore is a coin
  window.__grant({ shards: 500 });
  runUntil(() => pile('shard').grains >= pile('shard').want && pile('shard').want > 0, 20);
  const held = state().stored, ore = state().shards;
  stakeTaps(1);
  const pot = state().pot.on;
  const refused = tap('shard');
  run(0.5);
  const still = state();
  // and the bowl tapped: the whole pot streams home
  const bowl = window.__bowlAt();
  const back = window.__tap(bowl.x, bowl.y);
  let home = 0;
  for (let f = 0; f < 60 * 10 && (state().unstaking || state().homing); f++) { run(1 / 60); if (state().homing) home++; }
  runUntil(() => pile('dust').grains >= pile('dust').want, 20);
  const after = state();
  return [
    ok(pot === share(held), 'a tap of dust is the pot', `${pot}`),
    ok(!refused && !still.staking && still.pot.on === pot && still.pot.cur === 'dust' && still.shards === ore,
       'a tap on the ore pile does nothing: the pot and the ore are as they were', JSON.stringify(still.pot)),
    ok(back && home > 0, 'a tap on the bowl sends the pot home, grain by grain', `${home} frames homing`),
    ok(after.pot === null && after.table === 0, 'until the bowl is bare and there is no pot', `${after.table} in the bowl`),
    ok(after.stored === held, 'and the purse is as it was, to the grain', `${after.stored} vs ${held}`),
    ok(window.__tap(bowl.x, bowl.y) === false, 'and a tap on the empty bowl is nothing')
  ];
}, { reload: false });

// A hand is longer than the reload harness's five seconds and is one
// particular handful on the pegs -- a save writes the pot down and a load
// pours it back into the hopper -- so these follow it without the harness.
group('the arm plays the hand: a handful of pebbles for every stake', async () => {
  atTheTable();
  stakeTaps(1);
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
  // on a purse of a hundred a tap is the minimum, ten
  atTheTable(100);
  stakeTaps(1);
  const ten = playHand();
  runUntil(() => !state().pouring, 20);
  window.__clickLever('casino-chute');
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  window.__clearFloor();
  // and on a rich one a tap is thousands
  window.__give(60000);
  runUntil(() => pile('dust').grains >= pile('dust').want && pile('dust').worth > 100, 20);
  stakeTaps(1);
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
  stakeTaps(1);
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
  stakeTaps(1);
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

// Banking ends the hand. The pile on the ground is the crew's business: the
// next stake goes in while they are still shifting it.
group('the next stake goes in while the banked pile still lies on the strip', async () => {
  atTheTable();
  window.__dig(23);
  stakeTaps(1);
  playHand();
  window.__clickLever('casino-chute');
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  run(0.5);
  const tipped = state();
  const purse = tipped.stored;
  const took = tap();
  streamed();
  const staked = state();
  const hand = playHand();
  return [
    ok(tipped.pot === null && tipped.pileCount.casino > 0 && tipped.tray === 0,
       'the tray is tipped out and the pile lies on the strip, nobody carrying it', `${tipped.pileCount.casino} on the ground`),
    ok(took && staked.pot && staked.pot.on === share(purse) && staked.pot.where === 'hopper',
       'a tap stakes again with the pile still there', JSON.stringify(staked.pot)),
    ok(state().pileCount.casino === tipped.pileCount.casino, 'and the pile on the ground is untouched',
       `${state().pileCount.casino}`),
    ok(hand.pulled && hand.s.pot && hand.s.pot.where === 'tray', 'and the arm plays the hand')
  ];
}, { reload: false });

// The banked pile is floor dust: yours to sweep into the hole like any
// dust, or the haulers' to carry.
group('the banked pile can be swept into the hole by hand', async () => {
  atTheTable();
  window.__dig(23);
  window.__levels({ carryLevel: 8 });
  stakeTaps(1);
  playHand();
  window.__clickLever('casino-chute');
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  run(0.5);
  const s = state();
  const held = s.stored;
  const strip = s.piles.find(p => p.key === 'casino');
  // a sweep along the strip, then let go over the mouth of the hole
  let up = 0;
  for (let x = strip.from + 6; x < strip.to - 6 && up < 12; x += 6) up = window.__sweep(x, s.groundY - 3);
  window.__let(s.pitX + 60, s.groundY - 40);
  runUntil(() => state().chips === 0, 10);
  run(0.5);
  const after = state();
  return [
    ok(s.pileCount.casino > 0, 'the pile lies on the strip', `${s.pileCount.casino}`),
    ok(up > 0, 'the sweep lifts it like any dust', `${up} held`),
    ok(after.stored === held + up, 'and let go over the hole it credits the counter, a grain a grain',
       `${held} + ${up} -> ${after.stored}`),
    ok(after.pileCount.casino === s.pileCount.casino - up, 'the pile is down by the same', `${after.pileCount.casino}`)
  ];
}, { reload: false });

// A pot has to have somewhere to land: a full strip holds the chute, the pot
// waits in the tray, and the mark over the strip says why.
group('every control is dead mid-hand, and the bowl cannot be tapped', async () => {
  atTheTable();
  const shut = {};
  const tryAll = when => {
    shut[when] = ['casino-gate', 'casino-chute', 'casino-crank'].filter(k => window.__clickLever(k));
    const bowl = window.__bowlAt();
    if (bowl && window.__tap(bowl.x, bowl.y)) shut[when].push('bowl');
  };
  const first = share(state().stored);
  stakeTaps(1);
  const purse = state().stored;
  tap();                                             // one more, still streaming in
  run(0.2);
  tryAll('pouring');
  streamed();
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
    ok(before.pot && before.pot.on === first + share(purse) && before.stored === after.stored,
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
  stakeTaps(1);
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
