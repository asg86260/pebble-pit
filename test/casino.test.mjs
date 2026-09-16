// The pour: the casino has no board, and the stake is a share you hold.
//
// Hold the arm and pebbles pour out of the purse into the funnel, a slice of
// what you own a second; let go and the stake stays; tap the sign and the
// pile drains into the throat, a handful of pebbles comes out on to the pegs
// into the drop's fair bins, and the bins that hold one pay -- the middle
// five in pebbles by their multiple, the outer six in crops, ore or sparks by
// worth -- out of the foot on to the ground for the crew. See DESIGN.md,
// "The handful" and "The pour".
//
// These check the mechanism a hand at a time, done the way a player does it:
// the hold (`__holdArm`, the call a press on the arm makes) and the tap on
// the sign (`__tapSign`). The real mouse and finger are in selftest/casino.js.
// The spread the bet hangs on is measured thousands of hands at a time in
// handful.test.mjs.

import { yard, group, ok, state, run, runUntil, quickCrew } from './helpers.mjs';
import { CASINO_BINS, CASINO_HANDFUL, POUR_SHARE, POUR_MIN, PILE_LIMIT, shownFor } from '../src/config.js';
import { DUST_PER } from '../src/upgrades/price.js';

// The table, opened without the dust it costs, with dust in the hole to stake
// out of.
function atTheTable(dust = 6000) {
  window.__reset();
  window.__casino(true);
  window.__give(dust);
  window.__dig(23);
  window.__build();
  run(0.1);
}
const hold = on => window.__holdArm(on);
const tap = () => window.__tapSign();
// the pour landed and the bowl still
const settled = () => runUntil(() => !state().pouring && state().tableAir === 0, 30);
// the arm held for `s` seconds, let go, and the pour settled
function stake(s) {
  hold(true);
  run(s);
  hold(false);
  settled();
  return state().pot ? state().pot.stake : 0;
}

// A hand from the tap to the pay run out, watching the bins on the way: the
// counts the moment the last pebble is still, which feet came up to pay,
// and whether any grain ever faded while the hand was on the board, which
// none may -- sand leaves the hopper through the gate and nowhere else.
function playHand() {
  const stood = state().table;
  const dropped = tap();
  let bins = null, sent = 0, fell = 0, faded = 0;
  const paid = new Set();
  for (let f = 0; f < 60 * 60 && (state().letting || state().pouring); f++) {
    run(1 / 60);
    const d = state().drop;
    if (!d) continue;
    sent = Math.max(sent, d.sent);
    fell = Math.max(fell, d.falling);
    if (d.stage === 'drop') faded += yard.S.tableAir.filter(k => k.fade).length;
    if (d.stage === 'hold' && !bins) bins = d.bins.slice();
    if (d.stage === 'pay' && d.paying != null) paid.add(d.paying);
  }
  return { dropped, bins, sent, fell, faded, stood, paid, s: state() };
}

// What the bins owe on a stake, by worth: each bin's pebbles times their
// share, by the bin's pay, to the pour's own rounding.
const owed = (bins, stakeN) => {
  const grains = bins.reduce((a, b) => a + b, 0);
  const worth = stakeN / grains;
  return bins.reduce((sum, n, b) => {
    if (!n) return sum;
    const pay = CASINO_BINS[b];
    return sum + (typeof pay === 'number' ? Math.round(n * worth * pay) : Math.max(1, Math.round(n * worth / DUST_PER[pay])) * DUST_PER[pay]);
  }, 0);
};

group('the bin table is fair to the pebble', async () => {
  // Ten fair coins: the odds of each bin are a row of Pascal's triangle over
  // two to the ten, and weighted by them, every bin paying by worth, the
  // table pays 1,018 in 1,024.
  const rows = CASINO_BINS.length - 1;
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - i + 1) / i; return r; };
  const paid = CASINO_BINS.reduce((sum, m, b) => sum + (typeof m === 'number' ? m : 1) * choose(rows, b), 0);
  const kinds = CASINO_BINS.filter(m => typeof m !== 'number');
  return [
    ok(CASINO_BINS.length === 11, 'eleven bins', `${CASINO_BINS.length}`),
    ok(Math.abs(paid - 1018) < 1e-9, 'pay 1,018 in 1,024 off the config', `${paid} in 1,024`),
    ok(CASINO_BINS.join(',') === [...CASINO_BINS].reverse().join(','), 'and read the same from either end'),
    ok(kinds.length === 6 && kinds.every(k => DUST_PER[k] > 0), 'six of them convert to a coin the yard prices', kinds.join(','))
  ];
});

group('the arm held pours a share of the purse a second, whole pebbles, and stops at zero', async () => {
  atTheTable(1000);
  const held = state().stored;
  const rate = state().pourRate;
  const rows = window.__rows().filter(r => ['chip', 'stakedust', 'letgo', 'bank', 'ride'].includes(r.key));
  const took = hold(true);
  run(1);
  const mid = state();
  hold(false);
  const let_ = state();
  settled();
  const stood = state();
  // and held on until there is nothing left: the purse is poured to zero
  // and not past it, at the rate the purse set when the arm was pressed,
  // flat for the whole hold -- a share of what is left would crawl
  hold(true);
  const left = stood.stored, again = state().pourRate;
  let least = held, frames = 0, later = 0;
  for (; frames < 60 * 60 && state().holding; frames++) {
    run(1 / 60); least = Math.min(least, state().stored);
    if (frames === 60 * 5) later = state().pourRate;
  }
  const dry = state();
  hold(false);
  settled();
  const end = state();
  return [
    ok(rows.length === 0, 'the casino has no rows on any board', rows.map(r => r.key).join(',')),
    ok(rate === Math.max(POUR_SHARE * held, POUR_MIN), 'the pour is a share of the purse a second, floored', `${rate}`),
    ok(took && mid.holding && mid.pot && mid.pot.stake >= rate * 0.85 && mid.pot.stake <= rate * 1.05,
       'a second held pours about that many pebbles', `${mid.pot && mid.pot.stake} of ${rate}`),
    ok(Number.isInteger(mid.pot.stake) && mid.pot.stake + mid.pot.owed === mid.pot.stake + mid.pot.owed && mid.pot.on <= mid.pot.stake,
       'in whole pebbles, the purse spent as each lands', JSON.stringify(mid.pot)),
    ok(!let_.holding && let_.pot.stake === mid.pot.stake, 'letting go keeps the stake', `${let_.pot.stake}`),
    ok(stood.stored === held - stood.pot.stake && stood.pot.owed === 0 && stood.pot.on === stood.pot.stake,
       'and once the pour has landed the purse is down by exactly the stake', `${stood.stored} vs ${held - stood.pot.stake}`),
    ok(stood.table === shownFor(stood.pot.stake), 'the pile in the funnel is the stake at the band', `${stood.table}`),
    ok(!dry.holding && dry.pot.stake + dry.pot.owed >= held - 1 && least >= 0 && end.stored === 0 && end.pot.stake === held,
       'held on, the arm lets go on its own at the last pebble and the purse is never below zero',
       `${end.stored} left, stake ${end.pot.stake} of ${held}, lowest ${least}`),
    ok(again === Math.max(POUR_SHARE * left, POUR_MIN) && later === again,
       'the second hold reads the purse again and holds that rate flat', `${again} at the press, ${later} five seconds in`),
    ok(Math.abs(frames / 60 - left / again) < 0.5,
       "so the purse empties in the share's time, not a crawl", `${(frames / 60).toFixed(1)} s for ${left} at ${again} a second`)
  ];
}, { reload: false });

group('holding again adds to the stake, and a release keeps it across a reload', async () => {
  atTheTable();
  const held = state().stored;
  const first = stake(0.5);
  const second = stake(0.5);
  const before = state();
  window.__reload();
  const back = state();
  settled();
  const stood = state();
  return [
    ok(first > 0 && second > first, 'a second hold pours on top of the first', `${first} then ${second}`),
    ok(before.canDrop, 'and the sign is live with the stake standing'),
    ok(back.pot && back.pot.stake === second && back.stored === held - second,
       'a reload keeps the stake in the funnel and the purse as it was', JSON.stringify(back.pot)),
    ok(back.pouring && back.table < shownFor(second) && stood.table === shownFor(second),
       'the sand rains back in to what it was', `${back.table} then ${stood.table}`),
    ok(stood.canDrop && !stood.holding, 'with the sign live again')
  ];
}, { reload: false });

// A hand is longer than the reload harness's five seconds and is one
// particular handful on the pegs -- a save writes the stake down and a load
// pours it back into the hopper -- so these follow it without the harness.
group('a tap on the sign drops exactly a handful, and only the bins with a pebble pay', async () => {
  atTheTable();
  const s0 = stake(1.5);
  const hand = playHand();
  const s = hand.s;
  const expect = hand.bins ? owed(hand.bins, s0) : -1;
  const empties = hand.bins ? hand.bins.map((n, b) => n ? -1 : b).filter(b => b >= 0) : [];
  return [
    ok(s0 >= CASINO_HANDFUL && hand.dropped, 'a stake is standing and the sign drops it', `${s0}`),
    ok(hand.stood === shownFor(s0), 'the stake stood at the band before the floor opened', `${hand.stood}`),
    ok(hand.sent === CASINO_HANDFUL && hand.bins && hand.bins.reduce((a, b) => a + b, 0) === CASINO_HANDFUL,
       'and exactly a handful of pebbles reaches the bins', `${hand.sent} sent, ${hand.bins && hand.bins.join(',')}`),
    ok(hand.fell > 1, 'as a cascade, several on the board at once', `${hand.fell} at most`),
    ok(hand.faded === 0, 'and nothing fades, in the field or over the hopper: the pile drains through the gate',
       `${hand.faded} fading frames`),
    ok(empties.length > 0 && empties.every(b => !hand.paid.has(b)), 'an empty bin never comes up to pay',
       `empty ${empties.join(',')}, paid ${[...hand.paid].join(',')}`),
    ok(hand.bins.every((n, b) => !n || hand.paid.has(b)), 'and every bin with a pebble does', `${[...hand.paid].join(',')}`),
    ok(!s.letting && !s.pouring && s.table === 0 && s.pot === null, 'the hand settles on its own with the hopper drained and no stake'),
    ok(s.hand && s.hand.n === expect, "paid to the sum of each pebble's bin, by worth, to the grain",
       `${s.hand && s.hand.n} paid, ${expect} owed by ${hand.bins && hand.bins.join(',')}`),
    ok(s.hand && Math.abs(s.hand.mult - expect / s0) < 0.01, 'and the box says the multiple', s.hand && `${s.hand.mult}`)
  ];
}, { reload: false });

group('a small stake drops as many pebbles as it has', async () => {
  atTheTable(30);
  hold(true);
  run(0.2);
  hold(false);
  settled();
  const s0 = state().pot.stake;
  const hand = playHand();
  return [
    ok(s0 > 0 && s0 < CASINO_HANDFUL, 'a flick stakes fewer than a handful', `${s0}`),
    ok(hand.stood === s0 && hand.sent === s0 && hand.bins.reduce((a, b) => a + b, 0) === s0,
       'and drops that many pebbles, each worth one', `${hand.sent} sent for ${s0}`),
    ok(hand.faded === 0, 'nothing fades')
  ];
}, { reload: false });

group('the arm and the sign are dead mid-hand', async () => {
  atTheTable();
  stake(1);
  const shut = {};
  const tryAll = when => { shut[when] = [hold(true) && 'arm', tap() && 'sign'].filter(Boolean); hold(false); };
  tap();
  run(0.8);
  const mid = state();
  tryAll('cascading');
  runUntil(() => state().drop && state().drop.stage === 'pay', 30);
  tryAll('paying');
  runUntil(() => !state().letting, 30);
  const after = state();
  return [
    ok(mid.letting && mid.drop && mid.drop.falling > 0, 'the hand is on the board when asked', JSON.stringify(mid.drop)),
    ok(shut.cascading.length === 0, 'nothing fires while the handful is on the pegs', shut.cascading.join(',')),
    ok(shut.paying.length === 0, 'nor while the bins are paying', shut.paying.join(',')),
    ok(!after.pot && !tap(), 'and after the hand there is nothing to drop'),
    ok(hold(true) && state().holding, 'but the arm pours again at once, while the pay runs out'),
  ];
}, { reload: false });

// Everything pours out of the foot in its own kind on to the strip, and the
// crew carries it in: a pebble grain lands as the pebbles it is worth, a
// coin as a grain of that coin, and the counters move as the loads land.
group('the pay pours out of the foot on to the strip in its own kinds, and the haulers carry it to the hole', async () => {
  atTheTable();
  const s0 = stake(1);
  const hand = playHand();
  const paid = hand.s.hand.n, pays = hand.s.hand.pays;
  const held = state().stored, ore = state().shards, crops = state().spores, sparks = state().sparks;
  const strip = state().piles.find(p => p.key === 'casino');
  run(0.6);
  const flying = state();
  runUntil(() => state().tableAir === 0 && !state().paying, 30);
  run(0.5);
  const tipped = state();
  window.__crew(0, 4);                               // and now somebody to carry it
  quickCrew();
  const want = held + pays.dust;
  const carried = runUntil(() => state().stored >= want && state().shards >= ore + pays.shard && state().spores >= crops + pays.spore && state().sparks >= sparks + pays.spark, 300);
  const landed = state();
  return [
    ok(s0 > 0 && paid > 0, 'a hand was paid', `${paid} for ${s0}`),
    ok(!!strip && strip.to <= hand.s.casinoX, 'the casino has a strip on the ground at its left',
       strip && `${strip.from}..${strip.to}, building at ${hand.s.casinoX}`),
    ok(flying.tableAir > 0 || flying.pileCount.casino > 0, 'the pay is in the air out of the foot, or landed', `${flying.tableAir} flying`),
    ok(flying.stored === held, 'and no counter moves for it until it is carried', `${flying.stored} vs ${held}`),
    ok(paid <= PILE_LIMIT.casino ? tipped.pileCount.casino === pays.dust + pays.shard + pays.spore + pays.spark : tipped.pileCount.casino > 0,
       'the pay lies on the strip, a grain a coin', `${tipped.pileCount.casino} on the ground for ${JSON.stringify(pays)}`),
    ok(carried, 'and the haulers carry it to the hole, every counter moving as its kind lands',
       `${held} + ${pays.dust} -> ${landed.stored}; ore ${ore} -> ${landed.shards}, crops ${crops} -> ${landed.spores}, sparks ${sparks} -> ${landed.sparks}`)
  ];
}, { reload: false });

// A pay has to have somewhere to land: a full strip holds the chute, the pay
// waits in the tray, and the mark over the strip says why.
group('a full strip holds the pour', async () => {
  atTheTable();
  stake(0.4);
  const hand = playHand();
  const paid = hand.s.hand.n;
  const strip = state().piles.find(p => p.key === 'casino');
  window.__pile((strip.from + strip.to) / 2, PILE_LIMIT.casino);
  run(3);
  const full = state();
  window.__clearFloor();
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  run(0.5);
  const after = state();
  return [
    ok(paid > 0, 'there is a pay to pour', `${paid}`),
    ok(full.pileMarks.includes('casino'), 'the strip is full and its mark stands', full.pileMarks.join(',')),
    ok(full.payLeft > 0, 'so the pay waits in the building', `${full.payLeft} still to go`),
    ok(after.paying === null && after.pileCount.casino > 0, 'and runs out once there is room', `${after.pileCount.casino} on the ground`)
  ];
}, { reload: false });

// A save mid-cascade is a bet that was made: the stake is written down and
// the path in flight is not, so it comes back a pile in the hopper with the
// sign live again.
group('a save mid-cascade comes back a stake in the hopper with the sign live', async () => {
  atTheTable();
  const held = state().stored;
  const s0 = stake(1);
  tap();
  run(0.8);
  const mid = state();
  window.__reload();
  const back = state();
  settled();
  const stood = state();
  const dropped = tap();
  return [
    ok(mid.letting && mid.drop.falling > 0, 'the handful is on the pegs when the save is taken'),
    ok(!back.letting && back.pot && back.pot.stake === s0, 'it comes back a stake in the hopper, the path in flight forgotten', JSON.stringify(back.pot)),
    ok(back.pouring && back.table < shownFor(s0), 'pouring in again out of the sky', `${back.table} down`),
    ok(stood.table === shownFor(s0) && stood.canDrop, 'until it stands as it did, with the sign live', `${stood.table}`),
    ok(back.stored === held - s0 && stood.stored === held - s0, 'and the purse is as it was: nothing is spent twice', `${stood.stored}`),
    ok(dropped && state().letting, 'and a tap opens the floor')
  ];
}, { reload: false });
