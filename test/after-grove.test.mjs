// Act 3's grove rebuilt (DESIGN.md, "Act 3's grove, rebuilt"), the checks a
// player's way. Each track adds its own block below, headed by its name.
// The setup a check is not about goes through the hooks (the act on and its
// opening played, members walked out, coins granted); the thing each check
// is about goes through `__buy`, the roster's + and the hand.

// ===== Track D: seeds =====================================================================
import { group, ok, run, runUntil, yard, P } from './helpers.mjs';
import { RIM_PIECES, TREE_CHOPS, AFTER_SEEDS0, AFTER_SEED_BILLS, AFTER_SELF_SEED, AFTER_TREE } from '../src/config.js';
import { AFTER_JOB } from '../src/jobs.js';
import { pileCount, pileFull } from '../src/after/piles.js';
import { lying } from '../src/after/ground.js';
import { clearPlot, chopTree, plantable } from '../src/after/grove.js';
import { jobSays } from '../src/after/roster.js';
import { afterRow, afterBill } from '../src/after/rows.js';
import { seedsOwed } from '../src/after/seeds.js';
import { plotX, groundOf, stationBox, pileMid, AP } from '../src/after/place.js';
import { loadKind } from '../src/carry.js';
import { flowBy } from '../src/flow.js';
import { msg } from '../src/lang.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
// The act begun, `n` members walked out of God's yard and idle at the podium,
// the yard's coins granted for the rows (a purse is no check's subject).
function up(n = 4) {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e7, spores: 1e6, shards: 1e6, scales: 1e5, sparks: 1e5 });
  window.__afterGrant({ rebel: 5000, timber: 40 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  run(2);
}
const basket = () => pileCount('seeds');
// Acorns taken out of the basket for room, through its one door.
const room = n => window.__afterGrant({ seeds: -n });

group('a seed bought is fetched from the gates, and the basket counts it on the frame it is set down', async () => {
  up();
  room(2);
  const bill0 = afterBill(afterRow('after-seeds')), dust0 = S.stored;
  const bought = window.__buy('after-seeds');
  const bill1 = afterBill(afterRow('after-seeds'));
  const gates = Math.max(0, 54 * P), owed0 = seedsOwed();
  let atGates = false, made = false, risen = -1, risenHolding = null, f = 0;
  const was = basket();
  for (; f < 60 * 90 && risen < 0; f++) {
    run(1 / 60);
    const w = S.after.bodies.find(b => loadKind(b) === 'acorn');
    if (S.after.bodies.some(b => Math.abs(b.x - gates) < P * 2)) atGates = true;
    if (w) made = true;
    if (basket() > was) { risen = f; risenHolding = S.after.bodies.some(b => loadKind(b) === 'acorn'); }
  }
  const dearer = afterBill(afterRow('after-seeds'));
  window.__actsOn(null);
  return [
    ok(bought && owed0 === 1, 'the row bought leaves one acorn owed', `${bought} ${owed0}`),
    ok(JSON.stringify(bill0) === JSON.stringify(AFTER_SEED_BILLS[0]), 'the first seed costs the first bill, in the earlier acts\' coins', JSON.stringify(bill0)),
    ok(S.stored < dust0, 'its dust came off the yard\'s purse', `${dust0} -> ${S.stored}`),
    ok(JSON.stringify(bill1) === JSON.stringify(AFTER_SEED_BILLS[1]) && dearer[0][1] > bill0[0][1], 'the next costs more', JSON.stringify(bill1)),
    ok(atGates, 'a member walked to heaven\'s gates for it'),
    ok(made && risen >= 0 && !risenHolding, 'the basket\'s count rose only once the acorn left the arms', `${was} -> ${basket()}, frame ${risen}`),
    ok(seedsOwed() === 0 && (flowBy()['acorn:gates'] || 0) === 1, 'the unit was made at the gates, once', JSON.stringify(flowBy()))
  ];
});

group('the seeds row is greyed full while the basket and the seeds owed fill it, and says so', async () => {
  up();
  const row = afterRow('after-seeds');
  const marked = pileFull('seeds');
  const full = row.dead() && row.waits() === msg('after-seeds-full') && basket() === AFTER_SEEDS0;
  const refused = !window.__buy('after-seeds');
  room(1);
  const open = !row.dead();
  window.__buy('after-seeds');
  const owed = row.dead();
  window.__actsOn(null);
  return [
    ok(full, 'a full basket greys the row, saying full', `${basket()} ${row.waits()}`),
    ok(refused, 'and a press does nothing'),
    ok(!marked, 'a full basket is its resting state and wears no pile-full mark'),
    ok(open, 'one acorn out of it opens the row'),
    ok(owed, 'and the seed bought and owed shuts it again')
  ];
});

group('self-seeding at a quarter drops exactly one acorn over four falls, and a member carries it to the basket', async () => {
  up();
  const bought = window.__buy('after-selfseed');
  // Four standing trees, the plots the grove's board would clear; each planted
  // from an acorn and grown (setup a check is not about).
  S.after.plots = [];
  for (let i = 0; i < 4; i++) { clearPlot(); window.__afterPlant(i, 1); }
  room(3);
  const was = basket();
  const drops = [];
  const crown = () => flowBy()['acorn:crown'] || 0;
  for (let i = 0; i < 4; i++) {
    for (let k = 0; k < TREE_CHOPS; k++) chopTree(i, true);
    runUntil(() => S.after.plots[i].fell != null, 5);
    drops.push(crown());
    run(0.1);
  }
  // Left lying where the crown broke until somebody carries it home.
  const lyingAcorns = lying().filter(q => q.kind === 'acorn').length;
  runUntil(() => basket() > was, 90);
  window.__actsOn(null);
  return [
    ok(bought && S.after.ups['after-selfseed'] === 1 && AFTER_SELF_SEED[0] === 0.25, 'rung one bought through the row, a chance in four'),
    ok(drops.join() === '0,0,0,1', 'the first three falls drop nothing and the fourth one acorn', drops.join()),
    ok(lyingAcorns + (basket() - was) >= 1, 'it lay on the ground where the crown broke', `${lyingAcorns}`),
    ok(basket() === was + 1, 'and a member carried it to the basket', `${was} -> ${basket()}`),
    ok(Math.abs(S.after.selfSeed) < 1e-6, 'the debt is paid', String(S.after.selfSeed))
  ];
});

group('a woodcutter with a bare plot and an empty basket says it waits on seeds, then plants once an acorn comes', async () => {
  up();
  S.after.plots = [];
  clearPlot();
  room(AFTER_SEEDS0);
  const put = window.__afterPress(AFTER_JOB.CUT);
  run(2);
  const says = jobSays(AFTER_JOB.CUT);
  const bare = S.after.plots[0].grow == null;
  window.__afterGrant({ seeds: 1 });
  runUntil(() => S.after.plots[0].grow != null, 60);
  window.__actsOn(null);
  return [
    ok(put, 'a woodcutter put on through the roster\'s +'),
    ok(says.includes(msg('after-stall-seeds')), 'the roster\'s note reads waiting on seeds', says),
    ok(bare, 'nothing planted without an acorn'),
    ok(S.after.plots[0].grow != null && basket() === 0, 'with one in the basket it is carried to the bed and planted', `${S.after.plots[0].grow} ${basket()}`)
  ];
});

group('an acorn let go over a bare bed plants it, and the second over the same bed lies on the ground', async () => {
  up();
  S.after.plots = [];
  clearPlot();
  const x = plotX(0), y = groundOf('grove') - AP * 14, p = window.__afterPile('forestry', 'seeds');
  const let_go = () => {
    window.__afterHand(p.x, p.y, 'press');
    window.__afterHand(x, y, 'move'); run(0.05);
    S.trail = [];
    window.__afterHand(x, y, 'drop');
  };
  let_go(); let_go(); let_go();
  run(3);
  const plot = S.after.plots[0];
  const acorns = lying().filter(q => q.kind === 'acorn').length;
  window.__actsOn(null);
  return [
    ok(plot.grow != null && plot.seed != null, 'the first acorn went into the bed and the tree began', `${plot.grow}`),
    ok(!plantable(0), 'the bed is no longer bare'),
    ok(acorns >= 1 && (flowBy()['acorn:planted'] || 0) === -1, 'the others fell through to the ground, only one planted', `${acorns} lying, ${JSON.stringify(flowBy())}`),
    ok(basket() === AFTER_SEEDS0 - 3, 'each came out of the basket', String(basket()))
  ];
});
