// Act 3 keeps no stock (DESIGN.md, "One resource system for every act",
// section 5): a pile's count is its strip's units on the ground and the
// sawdust heap's is its grains, read off the cells and written nowhere, so a
// count can never disagree with what lies there. The only numbers left beside
// goods are the accounts behind a sink and a claim on cells.
//
// Reached the way a player reaches it: the saw mill and the workshop ordered
// off the shack (`__buy`), members put on through the roster's + (`__afterPress`),
// the chain run for a few minutes. The setup it is not about: the act on and
// its opening played, members walked out, coins granted.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { goodCount, goodsRead, PILED } from '../src/after/piles.js';
import { units, counted, stripOf } from '../src/after/ground.js';
import { heapPlot, sawdustCount } from '../src/after/mill.js';
import { count } from '../src/grid.js';
import { RIM_PIECES } from '../src/config.js';
import { SAVE_V } from '../src/config/saves.js';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];

function camp(n) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e7, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  window.__afterGrant({ rebel: 9000 });
  for (const st of ['mill', 'workshop']) {
    window.__buy(`after-build-${st}`);
    runUntil(() => window.__afterRead().built.includes(st), 600);
  }
}
// A pile's units walked off the cells apart from the count that is asked for.
const walked = what => { const s = stripOf(what); return units().filter(u => u.c0 >= s.c0 && u.c0 < s.c1 && counted(u)).length; };

group('act 3 keeps no stock: every pile is its cells, the heap is its grains, and a save holds the cells', async () => {
  camp(6);
  window.__afterGrant({ grovelogs: 8, logs: 4, timber: 6 });
  window.__afterPress('sawyer'); window.__afterPress('joiner');
  let agree = true, peak = 0;
  for (let k = 0; k < 600; k++) {
    run(0.5);
    peak = Math.max(peak, sawdustCount());
    if (PILED.some(w => walked(w) !== goodCount(w)) || sawdustCount() !== count(heapPlot())) agree = false;
  }
  yard.persist();
  const blob = JSON.parse(localStorage.getItem(KEY));
  const before = goodsRead();
  yard.restore();
  const after = goodsRead();
  window.__actsOn(null);
  return [
    ok(!('stock' in S.after) && !('stock' in blob.after), 'the act keeps no stock, in the game or in its save', Object.keys(blob.after).join(' ')),
    ok(agree && peak > 0, 'through a run of the chain every pile reads what its strip holds and the heap what it carries', `${peak} grains at most`),
    ok(typeof blob.after.heap === 'string' && blob.after.ground && blob.after.ground.blocks.length > 0, 'and the save holds the heap and the ground as cells', `${typeof blob.after.heap}`),
    ok(JSON.stringify(before) === JSON.stringify(after), 'read back, every count is what it was', `${JSON.stringify(before)} -> ${JSON.stringify(after)}`)
  ];
});

group('a save of the day before, with its stock numbers, reads back with its sawdust on the heap', async () => {
  camp(2);
  run(2);
  yard.persist();
  const blob = JSON.parse(localStorage.getItem(KEY));
  // the shape of v32: a stock copy of the piles and the heap's count, no heap cells
  blob.saveV = 32;
  blob.after.stock = { logs: 0, timber: 0, sawdust: 9, signs: 0, grovelogs: 0, benchtimber: 0 };
  blob.after.heap = null;
  localStorage.setItem(KEY, JSON.stringify(blob));
  yard.restore();
  const grains = sawdustCount();
  window.__actsOn(null);
  return [
    ok(SAVE_V >= 33 && grains === 9, 'the nine grains of sawdust the old save counted are on the heap', `${grains}`),
    ok(!('stock' in S.after), 'and the stock is gone')
  ];
});
