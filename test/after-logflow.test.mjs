// Act 3's saw kept clear (the owner, 2026-10-26: "lets have the logs fall out
// of the saw on the right side and pile up. and also get moved by idle
// members. so the saw always stays clear"): with logs on the forestry
// shack's pile and members idle at the podium, idle hands carry them to the
// saw mill's and the chipper's piles (after/bodies.js, the haul errand), so
// the sawyer never leaves the saw to fetch and works nearly all the time;
// each cut drops out of the saw's right side onto its timber pile there, and
// with no paper mill an idle member stands at the notch tipping the heap, so
// the saw never stops on its own sawdust.
//
// Reached the way a player reaches it: the stations ordered off the
// shack (`__buy`), the sawyer and the feeder put on through the roster's +
// (`__afterPress`). The setup it is not about: the act on and its opening
// played, members walked out of God's yard (`__afterCrowd`), coins and the
// forestry shack's logs granted.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { RIM_PIECES, AFTER_SAW_S, AFTER_CHIP_S } from '../src/config.js';
import { AFTER_JOB } from '../src/jobs.js';
import { stationBox, pileAt } from '../src/after/place.js';
import { sawDrops, heapFull } from '../src/after/mill.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];

// The act begun, `n` members walked out, the saw mill and the chipper ordered
// off the shack and raised, a sawyer and a feeder put on.
function chain(n) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => read().walking === 0, 240);
  window.__afterGrant({ rebel: 9000, timber: 40 });
  for (const st of ['mill', 'chipper']) window.__buy(`after-build-${st}`);
  runUntil(() => read().built.includes('mill') && read().built.includes('chipper'), 300);
  const put = [window.__afterPress(AFTER_JOB.SAW), window.__afterPress(AFTER_JOB.CHIP)];
  window.__afterGrant({ grovelogs: 200 });
  return put.every(Boolean);
}

group('idle members haul logs to the saw, which stays worked, its cuts piling on its right', async () => {
  const staffed = chain(16);
  // Out to their posts, and the first loads carried over.
  run(60);
  const working = k => { const w = S.after.bodies.find(b => b.at === k); return !!w && w.t < (k === 'mill' ? AFTER_SAW_S : AFTER_CHIP_S); };
  const sawyer = () => S.after.bodies.find(b => b.job === AFTER_JOB.SAW);
  const t0 = Math.floor(S.after.stock.timber);
  let n = 0, saw = 0, chip = 0, brim = 0, swept = false, hauled = false, fetched = false, drops = 0, last = sawDrops().at(-1);
  for (let f = 0; f < 90 * 4; f++) {
    run(0.25);
    n++;
    if (working('mill')) saw++;
    if (working('chipper')) chip++;
    if (heapFull()) brim++;
    swept = swept || S.after.bodies.some(b => b.job == null && b.errand === AFTER_JOB.SWEEP);
    hauled = hauled || S.after.bodies.some(b => b.job == null && b.errand === AFTER_JOB.HAUL && b.load === 'log' && b.target === 'mill');
    fetched = fetched || !!(sawyer() && sawyer().load === 'log');
    if (sawDrops().at(-1) !== last) { drops++; last = sawDrops().at(-1); }
  }
  const b = stationBox('mill'), out = pileAt('mill', 'timber');
  window.__actsOn(null);
  return [
    ok(staffed, 'a sawyer and a feeder put on through the roster'),
    ok(hauled, 'an idle member carries logs to the saw mill\'s pile'),
    ok(!fetched, 'the sawyer never leaves the saw to fetch its own'),
    ok(saw / n >= 0.85, 'the saw is worked nearly all the time', `${(saw / n * 100).toFixed(0)}%`),
    ok(chip / n >= 0.75, 'and the chipper most of it', `${(chip / n * 100).toFixed(0)}%`),
    ok(drops > 10 && Math.floor(S.after.stock.timber) > t0 && out >= b.x + b.w, 'each cut drops onto the timber pile on the saw\'s right',
       `${drops} cuts, timber ${t0} -> ${Math.floor(S.after.stock.timber)}, pile at ${out} past ${b.x + b.w}`),
    ok(swept && brim / n < 0.05, 'an idle hand tips the heap, so the saw never stops on its sawdust', `swept ${swept}, at the brim ${(brim / n * 100).toFixed(0)}%`)
  ];
});
