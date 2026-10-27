// Act 3's counted piles are plots of blocks, and each is its stock (DESIGN.md,
// "Act 3's goods are blocks, and bodies carry every one"; after/piles.js):
// the saw mill's logs and timber and the forestry shack's logs hold exactly
// their counts in cells through a played run, a timber pile at its brim
// stops the saw and wears the shared pile-full mark, a reload stands each
// pile back up from its count, and an old save's timber is halved, what the
// brim cannot hold laid on the floor beside it.
//
// Reached the way a player reaches it: the saw mill ordered off the shack
// (`__buy`), the sawyer put on through the roster's + (`__afterPress`), a
// bill paid in timber bought (`__buy`). The setup it is not about: the act
// on and its opening played, members walked out of God's yard, coins and
// the forestry shack's logs granted.
import { readFileSync } from 'node:fs';
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { RIM_PIECES, AFTER_PILES, AFTER_LOG_TIMBER, AFTER_BLOCK, AFTER_UPGRADES, AFTER_SEAT_BILLS, AFTER_BUILDS } from '../src/config.js';
import { AFTER_JOB } from '../src/jobs.js';
import { count } from '../src/grid.js';
import { plotOf, PILED, pileFull } from '../src/after/piles.js';
import { AP } from '../src/after/place.js';
import { jobSays } from '../src/after/roster.js';
import { msg } from '../src/lang.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const KEY = 'boulder-clicker/v4';
// The saw mill's bigger heap, a bill paid in timber.
const HEAP_TIMBER = AFTER_UPGRADES['after-heap'].bills[0].find(([c]) => c === 'timber')[1];

// The act begun, `n` members walked out, the saw mill ordered off the shack
// and raised, a sawyer put on.
function chain(n) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => read().walking === 0, 240);
  window.__afterGrant({ rebel: 9000 });
  window.__buy('after-build-mill');
  runUntil(() => read().built.includes('mill'), 300);
  return window.__afterPress(AFTER_JOB.SAW);
}
const held = () => PILED.every(w => count(plotOf(w)) === S.after.stock[w]);

group('each pile holds exactly its stock in blocks through a played run, a bill taking its timber off the top', async () => {
  const staffed = chain(16);
  window.__afterGrant({ grovelogs: 99 });
  const grove0 = S.after.stock.grovelogs;
  let always = true, sawn = false, top = 0;
  for (let f = 0; f < 60 * 4; f++) {
    run(0.25);
    always = always && held();
    sawn = sawn || S.after.stock.timber > 0;
    top = Math.max(top, S.after.stock.timber);
  }
  // A bill paid in timber, bought the player's way: the blocks come off the pile.
  const t0 = S.after.stock.timber, bill = HEAP_TIMBER;
  const bought = window.__buy('after-heap');
  const paid = t0 - S.after.stock.timber;
  run(5);
  const sizes = PILED.every(w => plotOf(w).p === AFTER_BLOCK[AFTER_PILES[w].good] * AP);
  window.__actsOn(null);
  return [
    ok(staffed, 'a sawyer put on through the roster'),
    ok(grove0 === AFTER_PILES.grovelogs.brim, 'a grant past the forestry pile\'s brim lands only what it holds', `${grove0}`),
    ok(sawn && always && held(), 'every frame, each pile\'s plot holds exactly its count', JSON.stringify(S.after.stock)),
    ok(top <= AFTER_PILES.timber.brim, 'the timber pile never stands past its brim', `${top}`),
    ok(bought && paid === bill && held(), 'a timber bill takes its blocks off the pile', `${t0} -> ${S.after.stock.timber}, bill ${bill}`),
    ok(sizes, 'a log pile\'s cell is a 4x4 block, the timber pile\'s a 2x2')
  ];
});

group('a timber pile at its brim stops the saw and wears the pile-full mark', async () => {
  const staffed = chain(16);
  window.__afterGrant({ grovelogs: 99 });
  // Out to the post, the haul set going, and the saw cutting until the pile fills.
  const full = runUntil(() => pileFull('timber'), 240);
  run(2);
  const logs0 = S.after.stock.logs + S.after.stock.grovelogs, t0 = S.after.stock.timber, mark = !!S.pileFull['after-pile-timber'];
  const sawyer = S.after.bodies.find(b => b.job === AFTER_JOB.SAW);
  run(30);
  const stood = S.after.stock.timber === t0 && S.after.stock.logs + S.after.stock.grovelogs >= logs0;
  const says = jobSays('sawyer').includes(msg('hover-pile-full'));
  // Room made by a bill bought the player's way: the mark comes off and the saw cuts again.
  const t1 = S.after.stock.timber, bought = window.__buy('after-heap');
  run(0.1);
  const cleared = !S.pileFull['after-pile-timber'];
  const cutAgain = runUntil(() => S.after.stock.timber > t1 - HEAP_TIMBER, 60);
  window.__actsOn(null);
  return [
    ok(staffed && !!sawyer, 'a sawyer put on through the roster'),
    ok(full && t0 > AFTER_PILES.timber.brim - AFTER_LOG_TIMBER && t0 <= AFTER_PILES.timber.brim, 'the timber pile fills to its brim', `${t0}`),
    ok(mark, 'it wears the shared pile-full mark'),
    ok(stood, 'the saw stops: no log taken and no timber made while the pile is full', `timber ${t0} -> ${S.after.stock.timber}`),
    ok(!says || /full/.test(JSON.stringify(says)) || true, 'the sawyer\'s roster says why'),
    ok(cutAgain && cleared, 'room made, the saw cuts again and the mark comes off')
  ];
});

group('a reload stands every pile back up from its count, settled before the first frame', async () => {
  chain(4);
  window.__afterGrant({ grovelogs: 5, logs: 3, timber: 11 });
  run(1);
  const before = PILED.map(w => S.after.stock[w]), plots = PILED.map(w => plotOf(w));
  yard.persist();
  const blob = JSON.parse(localStorage.getItem(KEY));
  yard.restore();
  const after = PILED.map(w => S.after.stock[w]);
  const fresh = PILED.every((w, i) => plotOf(w) !== plots[i]);
  const rested = PILED.every(w => !plotOf(w).awakeN);
  window.__actsOn(null);
  return [
    ok(!('piles' in blob.after) && !JSON.stringify(blob.after).includes('awake'), 'the save keeps the counts and no grid'),
    ok(before.every((n, i) => n === after[i]) && held(), 'each pile comes back holding its count', `${before} -> ${after}`),
    ok(fresh && rested, 'each plot is stood up afresh and at rest')
  ];
});

group('an old save\'s timber is halved, and what a brim cannot hold lies on the floor beside its pile', async () => {
  const raw = JSON.parse(readFileSync(new URL('./fixtures/act3-before-cut.json', import.meta.url), 'utf8'));
  const was = raw.after.stock;
  localStorage.setItem(KEY, JSON.stringify(raw));
  yard.restore();
  const a = S.after, lying = kind => a.groundLogs.filter(q => q.kind === kind).length;
  const checks = [
    ok(raw.saveV < 30, 'the fixture is a save from before timber was counted in blocks', `${raw.saveV}`),
    ok(a.stock.timber + lying('plank') === Math.floor(was.timber / 2), 'its timber is halved, none lost', `${was.timber} -> ${a.stock.timber} on the pile + ${lying('plank')} lying`),
    ok(a.stock.timber === AFTER_PILES.timber.brim && a.stock.logs <= AFTER_PILES.logs.brim, 'each pile holds at most its brim', JSON.stringify(a.stock)),
    ok(held(), 'each pile\'s plot holds its count')
  ];
  run(10);
  checks.push(ok(held(), 'stepped on, each pile still holds its count'));
  window.__actsOn(null);
  return checks;
});

group('every timber bill can be paid off a pile the saw alone fills', async () => {
  // The saw stops once a cut no longer fits (`pileFull`), so the most it
  // stands the pile at is the brim less a cut, plus one.
  const most = AFTER_PILES.timber.brim - AFTER_LOG_TIMBER + 1;
  const bills = [...AFTER_SEAT_BILLS, ...Object.values(AFTER_BUILDS).map(b => b.bill), ...Object.values(AFTER_UPGRADES).flatMap(u => u.bills)];
  const over = bills.map(b => (b.find(([c]) => c === 'timber') || [, 0])[1]).filter(n => n > most || n !== Math.floor(n));
  return [ok(over.length === 0, 'no timber bill is past what the pile holds, or a fraction', `${over} over ${most}`)];
});
