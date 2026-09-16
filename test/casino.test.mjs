// The machine: the casino has no board, and the bet is set on its face.
//
// A panel of buttons under the bins' feet -- a coin, a chip, a window that
// says the stake, same bet, the sack -- and the arm does the whole hand: the
// stake rains out of the sky into the funnel, the purse spent as it lands,
// the floor opens on its own, and a handful of pebbles comes out of the
// throat and down the pegs, each carrying its share of the stake, into the
// drop's fair bins. The bins that hold a pebble pay into the tray; the sack
// flies the tray to the hole, or the next pull hoists it into the funnel and
// rides it. See DESIGN.md, "The handful" and "The machine".
//
// These check the mechanism a hand at a time, done the way a player does it:
// the buttons (`__pressButton`) and the arm (`__clickLever`), the same calls
// the pointer makes. The real click and finger are in selftest/casino.js.
// The spread the bet hangs on is measured two thousand hands at a time in
// handful.test.mjs.

import { yard, group, ok, state, run, runUntil } from './helpers.mjs';
import { CASINO_BINS, CASINO_HANDFUL, CASINO_PILE_ONE, CASINO_PILE_BAND, CASINO_PILE_BRIM, CASINO_CHIPS,
         shownFor } from '../src/config.js';

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
const press = key => window.__pressButton(key);
const pull = () => window.__clickLever('casino-gate');
const buttons = () => Object.fromEntries(window.__buttons().map(b => [b.key, b]));

// The arm pulled and the stake in: the pour landed and the bowl still, the
// frame before the floor opens on its own.
function stakeIn() {
  const pulled = pull();
  runUntil(() => !state().pouring && !state().hoisting && state().tableAir === 0 && state().table > 0 && !state().letting, 30);
  return pulled;
}

// A hand from the arm to the tray standing, watching the bins on the way:
// the counts the moment the last pebble is still, so the pay can be checked
// against them; and whether any grain ever faded, anywhere, while the hand
// was on the board, which none may -- sand leaves the hopper through the gate
// and nowhere else.
function playHand() {
  let bins = null, sent = 0, fell = 0, faded = 0, stood = 0;
  for (let f = 0; f < 60 * 60 && (state().armed || state().letting || state().pouring || state().hoisting); f++) {
    run(1 / 60);
    const d = state().drop;
    if (!d) { stood = Math.max(stood, state().table); continue; }
    sent = Math.max(sent, d.sent);
    fell = Math.max(fell, d.falling);
    if (d.stage === 'drop') faded += yard.S.tableAir.filter(k => k.fade).length;
    if (d.stage === 'hold' && !bins) bins = d.bins.slice();
  }
  return { bins, sent, fell, faded, stood, s: state() };
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

group('the panel: a coin a button once the yard hands it out, a chip the purse covers, the window saying the stake', async () => {
  atTheTable(500);
  const fresh = buttons();
  const gone = ['chip', 'stakedust', 'stakeshard', 'stakespore', 'letgo', 'bank', 'ride'];
  const rows = window.__rows().filter(r => gone.includes(r.key)).map(r => r.key);
  const tookDead = press('chip-1k');
  const afterDead = state();
  const took = press('chip-10');
  const ten = state();
  press('chip-all');
  const all = state();
  // the quarry stands and ore is a coin: its button appears
  window.__crew(0, 0, 1);
  window.__grant({ shards: 50 });
  run(0.1);
  const withOre = buttons();
  const tookOre = press('coin-shard');
  const ore = state();
  return [
    ok(Object.keys(fresh).join(',') === 'coin-dust,chip-10,chip-100,chip-1k,chip-all,window,same,bank',
       'a fresh yard has the dust button, the four chips, the window, same bet and the sack', Object.keys(fresh).join(',')),
    ok(fresh['coin-dust'].on && fresh['chip-100'].on && fresh['chip-10'].live && fresh['chip-100'].live,
       'dust and a hundred are chosen to start'),
    ok(!fresh['chip-1k'].live && !tookDead && afterDead.chip === 1, 'a chip the purse cannot cover is dead and cannot be chosen',
       `${afterDead.chip}`),
    ok(!fresh.same.live && !fresh.bank.live, 'same bet and the sack are dead with nothing to repeat or take'),
    ok(took && ten.chip === 0 && ten.nextStake === 10, 'a chip pressed is chosen, and the window says the stake', `${ten.nextStake}`),
    ok(all.chip === 3 && all.nextStake === 500, 'all in is the whole purse', `${all.nextStake}`),
    ok(withOre['coin-shard'] && !withOre['coin-spore'], 'ore gets a button once the quarry stands, crops not yet'),
    ok(tookOre && ore.coin === 'shard' && ore.nextStake === 50, 'and pressed, the bet is in ore', `${ore.coin} ${ore.nextStake}`),
    ok(!rows.length, 'and the casino has no rows on any board', rows.join(','))
  ];
});

group('the arm pulled pours exactly the stake into the funnel and spends the purse by it', async () => {
  atTheTable();
  const held = state().stored;
  press('chip-100');
  const pulled = pull();
  const going = state();
  let sawAir = 0, spent = 0;
  for (let i = 0; i < 600 && state().pouring; i++) { run(1 / 60); if (state().tableAir > 0) sawAir++; spent = held - state().stored; }
  const stood = state();
  return [
    ok(pulled && going.armed && going.pot && going.pot.stake === 100 && going.pot.where === 'hopper' && going.pouring,
       'the pull sets the stake raining into the hopper', JSON.stringify(going.pot)),
    ok(going.stored === held, 'nothing is spent until a grain lands', `${going.stored}`),
    ok(sawAir > 0, 'and it pours in, grain by grain', `${sawAir} frames with a grain flying`),
    ok(stood.stored === held - 100 && stood.pot.on === 100 && stood.owed === 0,
       'the purse is down by exactly the stake once the last grain is in', `${stood.stored} vs ${held - 100}, ${stood.owed} owed`),
    ok(stood.table === shownFor(100), 'and the pile in the funnel is the pot at the band', `${stood.table}`),
    // the written ladder: one for one to the first band, then a tenfold pot for
    // a band more, never past the brim
    ok(shownFor(CASINO_PILE_ONE * 10) === CASINO_PILE_ONE + CASINO_PILE_BAND && shownFor(1e9) === CASINO_PILE_BRIM,
       'which reads off the band ladder', `${shownFor(1000)}, ${shownFor(1e9)}`)
  ];
}, { reload: false });

// A hand is longer than the reload harness's five seconds and is one
// particular handful on the pegs -- a save writes the pot down and a load
// pours it back into the hopper -- so these follow it without the harness.
group('the arm plays the hand: a handful of pebbles for every stake, paid to the grain', async () => {
  atTheTable();
  press('chip-100');
  pull();
  const hand = playHand();
  const s = hand.s;
  const expect = hand.bins ? owed(hand.bins, 100) : -1;
  return [
    ok(hand.stood === shownFor(100), 'the stake stood at the band of the stake before the floor opened', `${hand.stood}`),
    ok(hand.sent === Math.min(100, CASINO_HANDFUL) && hand.bins && hand.bins.reduce((a, b) => a + b, 0) === CASINO_HANDFUL,
       'and exactly a handful of pebbles reaches the bins', `${hand.sent} sent, ${hand.bins && hand.bins.join(',')}`),
    ok(hand.fell > 1, 'as a cascade, several on the board at once', `${hand.fell} at most`),
    ok(hand.faded === 0, 'and nothing fades, in the field or over the hopper: the pile drains through the gate',
       `${hand.faded} fading frames`),
    ok(!s.letting && !s.pouring && !s.armed && s.table === 0, 'the hand settles on its own with the hopper drained'),
    ok(s.pot && s.pot.where === 'tray' && s.pot.on === expect,
       "to the sum of each pebble's bin, to the grain",
       `${s.pot && s.pot.on} on the row, ${expect} owed by ${hand.bins && hand.bins.join(',')}`),
    ok(s.tray === shownFor(expect), 'and the tray stands at the band of what was paid', `${s.tray} for ${expect}`),
    ok(s.hand && Math.abs(s.hand.mult - expect / 100) < 0.01, 'and the box says the multiple', s.hand && `${s.hand.mult}`),
    ok(s.lastBet && s.lastBet.coin === 'dust' && s.lastBet.chip === 1, 'and the bet is remembered for same bet', JSON.stringify(s.lastBet))
  ];
}, { reload: false });

group('a chip of ten is ten pebbles, and a big stake the same handful', async () => {
  atTheTable(60000);
  press('chip-10');
  pull();
  const ten = playHand();
  press('bank');
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  press('chip-1k');
  pull();
  const big = playHand();
  return [
    ok(ten.stood === 10 && ten.bins && ten.bins.reduce((a, b) => a + b, 0) === 10, 'ten pebbles for the ten chip',
       `${ten.stood} stood, ${ten.bins && ten.bins.join(',')}`),
    ok(big.stood === shownFor(1000) && big.bins && big.bins.reduce((a, b) => a + b, 0) === CASINO_HANDFUL,
       'a thousand stands as its band and drops the handful', `${big.stood} stood, ${big.bins && big.bins.join(',')}`),
    ok(ten.faded === 0 && big.faded === 0, 'nothing fades either time')
  ];
}, { reload: false });

group('the sack banks the tray to the hole to the grain, and the next bet goes in at once', async () => {
  atTheTable();
  press('chip-100');
  pull();
  const s = playHand().s;
  const on = s.pot ? s.pot.on : 0;
  const held = state().stored;
  const took = press('bank');
  run(0.3);
  const flying = state();
  // the next bet, set and pulled while the last is still in the air
  const pulled = pull();
  const next = state();
  runUntil(() => state().tableAir === 0 && !state().paying && !state().pouring, 30);
  const landed = state();
  return [
    ok(on > 0 && took, 'there is a pot to take, and the sack takes it', `${on}`),
    ok(flying.tableAir > 0 && flying.paying !== null && flying.pot === null, 'pressed, the tray is in the air toward the hole',
       `${flying.tableAir} flying, ${flying.paying} still to go`),
    ok(flying.stored === held, 'and the counter does not move for it until it lands', `${flying.stored} vs ${held}`),
    ok(pulled && next.pot && next.pot.stake === 100 && next.armed, 'the arm pulls again while the winnings are still flying',
       JSON.stringify(next.pot)),
    ok(landed.stored === held + on - 100, 'and the hole is paid the pot as it lands, to the grain, less the new stake',
       `${held} + ${on} - 100 -> ${landed.stored}`)
  ];
}, { reload: false });

group('same bet plays the last hand again', async () => {
  atTheTable();
  press('chip-10');
  pull();
  playHand();
  press('bank');
  runUntil(() => !state().paying && state().tableAir === 0, 30);
  press('chip-100');
  const set = state();
  const same = press('same');
  const again = state();
  playHand();
  return [
    ok(set.chip === 1 && set.lastBet.chip === 0, 'the panel says a hundred, the last hand was ten'),
    ok(same && again.chip === 0 && again.coin === 'dust' && again.pot && again.pot.stake === 10 && again.armed,
       'same bet sets the last hand and pulls the arm in one press', JSON.stringify(again.pot))
  ];
}, { reload: false });

group('the arm with a tray hoists the winnings into the funnel and adds them to the stake', async () => {
  atTheTable();
  press('chip-100');
  pull();
  const first = playHand().s;
  const on = first.pot ? first.pot.on : 0;
  const window = first.nextStake;
  const held = state().stored;
  press('chip-10');
  const window2 = state().nextStake;
  const pulled = pull();
  let lifted = 0, arcs = 0;
  for (let f = 0; f < 60 * 30 && (state().hoisting || state().pouring); f++) {
    run(1 / 60);
    if (state().hoisting) lifted++;
    if (state().tableAir > 0) arcs++;
  }
  const up = state();
  const second = playHand();
  const s = second.s;
  const expect = second.bins ? owed(second.bins, on + 10) : -1;
  return [
    ok(on > 0 && window === on + 100 && window2 === on + 10, 'the window says the tray rides with the chip', `${window}, ${window2} for a tray of ${on}`),
    ok(pulled && lifted > 0 && arcs > 0, 'the pull hoists the tray, grain by grain rather than appearing', `${lifted} frames, ${arcs} with a grain in the air`),
    ok(up.pot && up.pot.where === 'hopper' && up.pot.on === on + 10 && up.pot.stake === on + 10 && up.stored === held - 10,
       'and the stake is the tray and the chip, the chip out of the purse', JSON.stringify(up.pot)),
    ok(up.tray === 0, 'with the tray bare', `${up.tray} left`),
    ok(second.sent === Math.min(on + 10, CASINO_HANDFUL), 'the second hand plays a handful'),
    ok(s.pot ? s.pot.on === expect : expect === 0, 'and pays off the whole stake, to the grain',
       `${s.pot && s.pot.on} on the row, ${expect} owed`)
  ];
}, { reload: false });

group('every control is dead mid-hand', async () => {
  atTheTable();
  const shut = {};
  const tryAll = when => {
    shut[when] = ['chip-10', 'coin-dust', 'same', 'bank'].filter(k => press(k));
    if (pull()) shut[when].push('arm');
  };
  press('chip-100');
  pull();
  run(0.3);                                          // the stake still pouring
  tryAll('pouring');
  runUntil(() => state().letting, 30);
  run(0.8);
  const mid = state();
  tryAll('cascading');
  runUntil(() => state().drop && state().drop.stage === 'pay', 30);
  tryAll('paying');
  runUntil(() => !state().letting && !state().pouring, 30);
  const after = state();
  return [
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
group('a save mid-cascade comes back a pot in the hopper with the arm live', async () => {
  atTheTable();
  const held = state().stored;
  press('chip-100');
  pull();
  runUntil(() => state().letting, 30);
  run(0.8);
  const mid = state();
  window.__reload();
  const back = state();
  runUntil(() => !state().pouring, 30);
  const stood = state();
  const pulled = pull();
  return [
    ok(mid.letting && mid.drop.falling > 0, 'the handful is on the pegs when the save is taken'),
    ok(!back.letting && back.pot && back.pot.where === 'hopper' && back.pot.on === 100 && !back.armed,
       'it comes back a pot in the hopper, the path in flight forgotten', JSON.stringify(back.pot)),
    ok(back.pouring && back.table < shownFor(100), 'pouring in again out of the sky', `${back.table} down`),
    ok(stood.table === shownFor(100) && !stood.pouring, 'until it stands as it did', `${stood.table}`),
    ok(back.stored === held - 100 && stood.stored === held - 100, 'and the purse is as it was: nothing is spent twice', `${stood.stored}`),
    ok(pulled && state().letting, 'with the arm live again, and a pull opening the floor')
  ];
}, { reload: false });

// And a save mid-pour: what the purse still owed is owed after, and spent
// once.
group('a save mid-pour spends the rest of the stake once', async () => {
  atTheTable();
  const held = state().stored;
  press('chip-1k');
  pull();
  runUntil(() => state().owed < 1000, 10);
  run(0.2);
  const mid = state();
  window.__reload();
  const back = state();
  runUntil(() => !state().pouring && state().owed === 0, 30);
  const stood = state();
  return [
    ok(mid.pouring && mid.owed > 0 && mid.owed < 1000 && mid.stored === held - (1000 - mid.owed),
       'mid-pour, part of the stake is spent and the rest owed', `${mid.owed} owed, ${mid.stored}`),
    ok(back.pot && back.pot.stake === 1000 && back.owed === mid.owed, 'the save keeps what is owed', `${back.owed}`),
    ok(stood.stored === held - 1000 && stood.pot.on === 1000, 'and the pour spends exactly the rest', `${stood.stored} vs ${held - 1000}`)
  ];
}, { reload: false });
