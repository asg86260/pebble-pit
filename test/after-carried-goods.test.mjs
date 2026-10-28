// Act 3's goods carried by bodies (DESIGN.md, "Act 3's goods are blocks, and
// bodies carry every one", rule 2 and its settled calls): the workshop's
// timber walked to it off the timber mound, four blocks to a sign; a sign
// carried out of its rack to the crowd; a bill paid in timber an order whose
// blocks idle members carry to its station, the row landing on the last;
// and the rule that no pile's count moves but by a hand-off (verify.js, rule
// 24), which every group in the node tier asks on every frame.
//
// Reached the way a player reaches it: both stations ordered off the shack
// (`__buy`), the joiner put on through the roster's + (`__afterPress`), the
// bill bought (`__buy`). The setup it is not about: the act on and its
// opening played, members walked out of God's yard, the yard's and the
// act's coins granted, timber granted on the mound.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { RIM_PIECES, AFTER_SIGN_TIMBER, AFTER_UPGRADES, AFTER_PILES } from '../src/config.js';
import { AFTER_JOB } from '../src/jobs.js';
import { put, topRow, count } from '../src/grid.js';
import { plotOf } from '../src/after/piles.js';
import { stationBox, stationDoor, pileMid } from '../src/after/place.js';
import { orderAt } from '../src/after/build.js';
import { afterRow } from '../src/after/rows.js';
import { purse } from '../src/words.js';
import { msg } from '../src/lang.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const stock = () => S.after.stock;
// The workshop's bigger sign, a bill paid in timber, carried to the workshop.
const REACH = 'after-signreach';
const REACH_TIMBER = AFTER_UPGRADES[REACH].bills[0].find(([c]) => c === 'timber')[1];

// The act begun, `n` members walked out, the saw mill and the workshop
// ordered off the shack and raised.
function camp(n) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e7, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  window.__afterGrant({ rebel: 9000 });
  for (const st of ['mill', 'workshop']) {
    window.__buy(`after-build-${st}`);
    runUntil(() => window.__afterRead().built.includes(st), 600);
  }
  return ['mill', 'workshop'].every(st => window.__afterRead().built.includes(st));
}
// A body between the timber mound and the workshop with blocks of `kind`
// overhead, walking them over.
const between = (w, kind) => {
  const a = pileMid('mill', 'timber'), b = stationBox('workshop').x;
  return w.load === kind && !w.pick && w.x > Math.min(a, b) + 1 && w.x < Math.max(a, b) - 1;
};

group("the workshop's sign is made of four timber blocks a body walked to it off the mound", async () => {
  const stood = camp(6);
  window.__afterGrant({ timber: AFTER_PILES.timber.brim });
  const joiner = window.__afterPress(AFTER_JOB.JOIN);
  const t0 = stock().timber;
  let walked = false, benchTop = 0, sign = false, frames = 0;
  // A frame at a time, so every block on its way is seen in a body's hands.
  for (; frames < 60 * 240 && !sign; frames++) {
    run(1 / 60);
    walked = walked || S.after.bodies.some(w => between(w, 'plank'));
    benchTop = Math.max(benchTop, stock().benchtimber);
    sign = stock().signs > 0 || S.after.signs.length > 0 || S.after.bodies.some(w => w.load === 'sign');
  }
  window.__actsOn(null);
  return [
    ok(stood && joiner, 'both stations raised off the shack, a joiner put on through the roster'),
    ok(walked, 'timber blocks walked over from the mound in a body\'s hands'),
    ok(benchTop >= AFTER_SIGN_TIMBER, 'the workshop\'s own pile reaches a sign\'s four blocks', `${benchTop}`),
    ok(sign, 'a sign is nailed off them', `${frames} frames`),
    ok(stock().timber < t0, 'the mound gave up the blocks', `${t0} -> ${stock().timber}`)
  ];
});

group('a timber bill is an order: its blocks spoken for on the mound, carried to the station, the row landing on the last', async () => {
  const stood = camp(6);
  window.__afterGrant({ timber: AFTER_PILES.timber.brim });
  const t0 = stock().timber, free0 = purse('timber');
  const bought = window.__buy(REACH);
  const u = afterRow(REACH);
  // Bought: nothing lifted, the blocks spoken for, the row waiting.
  const lifted = stock().timber !== t0;
  const spoken = free0 - purse('timber') === REACH_TIMBER && S.after.orders.length === 1;
  const waits = u.dead() && u.waits() === msg('card-building') && !window.__buy(REACH);
  const before = !(S.after.ups[REACH] > 0);
  const door = orderAt(S.after.orders[0]);
  let carriedBy = false, early = false, onLast = false;
  for (let f = 0; f < 60 * 240 && S.after.orders.length; f++) {
    const o = S.after.orders[0], last = o.brought === o.n - 1;
    run(1 / 60);
    carriedBy = carriedBy || S.after.bodies.some(w => w.errand === AFTER_JOB.ORDER && between(w, 'plank'));
    if (S.after.orders.length && S.after.ups[REACH] > 0) early = true;
    if (!S.after.orders.length) onLast = last && S.after.ups[REACH] === 1;
  }
  window.__actsOn(null);
  return [
    ok(stood && bought, 'the row bought the player\'s way'),
    ok(!lifted && spoken, 'no block lifted off the mound: the bill\'s blocks are spoken for there', `${t0} -> ${stock().timber}, free ${free0} -> ${purse('timber')}`),
    ok(waits && before, 'the row waits on its carrying, saying so, and is not sold twice'),
    ok(door === stationDoor('workshop'), 'carried to the workshop it is for', `${door}`),
    ok(carriedBy, 'idle members carry its blocks over in their hands'),
    ok(!early && onLast, 'the row lands on the frame its last block is set down, not before')
  ];
});

group('a sign is carried out of the rack to the crowd and planted there', async () => {
  const stood = camp(6);
  window.__afterGrant({ signs: 2 });
  const rack0 = stock().signs, planted0 = S.after.signs.length;
  let inHands = false, fell = false, prev = rack0;
  for (let f = 0; f < 60 * 120 && S.after.signs.length === planted0; f++) {
    run(1 / 60);
    // The rack a block short only as a body takes one up.
    if (stock().signs < prev && !S.after.bodies.some(w => w.load === 'sign')) fell = true;
    prev = stock().signs;
    inHands = inHands || S.after.bodies.some(w => w.load === 'sign' && w.x > stationBox('workshop').x + stationBox('workshop').w);
  }
  window.__actsOn(null);
  return [
    ok(stood && rack0 === 2, 'two signs standing in the rack', `${rack0}`),
    ok(!fell && inHands, 'each taken up out of the rack into a body\'s hands and walked out'),
    ok(S.after.signs.length > planted0, 'planted in the crowd', `${S.after.signs.length}`)
  ];
});

group('a pile whose count moves with nobody handing a block is caught by the rules', async () => {
  camp(2);
  window.__afterGrant({ timber: 4 });
  run(1);
  // A block written straight onto the mound and its count, round the doors:
  // its plot still holds its stock (rule 23 is satisfied), but no body, hand
  // or tool handed it.
  const b = plotOf('timber'), c = Math.floor(b.cols / 2);
  put(b, c, topRow(b, c) + 1, 1);
  stock().timber += 1;
  let caught = '';
  try { run(1 / 30); } catch (e) { caught = e.message; }
  const matches = count(b) === stock().timber;
  window.__actsOn(null);
  return [
    ok(matches, 'the plot and the count agree, so only the hand-off rule can speak'),
    ok(/nobody handing a block/.test(caught), 'rule 24 is red for it', caught.slice(0, 120))
  ];
});
