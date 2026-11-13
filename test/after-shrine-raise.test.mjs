// The shrine's prayer rungs are built, not had (the owner, 2026-11-11: "yes use
// the builders"): a rung bought on the shrine's board has its timber carried
// to the shrine, then is a work on the yard's works at the shrine, and the
// rung -- and the shrine's new look with it -- lands only when the act's
// builders have walked there and hammered it up. A save taken mid-build comes
// back mid-build.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { workOn, progressOf, busySitesIn } from '../src/works.js';
import { upCount } from '../src/after/levels.js';
import { afterRow } from '../src/after/rows.js';
import { forSale } from '../src/upgrades.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
  runUntil(() => read().walking === 0, 120);
  S.after.camp = 4;
  window.__afterGrant({ rebel: 2000, timber: 40 });
};
const raise = () => workOn('after-prayer-raise');
const hammering = () => S.after.bodies.some(b => b.site === 'after-shrine' && b.goal === 'at' && b.jigAt != null);

group('a prayer rung is carried, then built at the shrine by the builders, and lands when they finish', async () => {
  up();
  const bought = window.__buy('after-prayer');
  const carriedFirst = S.after.orders.some(o => o.key === 'after-prayer') && !raise();
  const opened = runUntil(() => !!raise(), 240);
  const shrineBusy = busySitesIn('after').includes('after-shrine');
  const countedEarly = upCount('after-prayer');
  const again = forSale(afterRow('after-prayer'));
  const atWork = runUntil(hammering, 120);
  const half = runUntil(() => raise() && progressOf(raise()) >= 0.5, 240);
  const midRung = upCount('after-prayer');
  const landed = runUntil(() => !raise(), 240);
  const rung = upCount('after-prayer');
  window.__actsOn(null);
  return [
    ok(bought && carriedFirst, 'bought on the shrine\'s board, its timber is an order carried before anything goes up'),
    ok(opened && shrineBusy, 'the carried timber opens a work at the shrine on the yard\'s works'),
    ok(countedEarly === 0 && midRung === 0 && !again, 'the rung is not had, nor sold again, while it is going up', `${countedEarly} ${midRung} ${again}`),
    ok(atWork, 'a builder walks to the shrine and hammers there'),
    ok(half && landed && rung === 1, 'the work goes up as they hammer and the rung lands when it is done', `${rung}`)
  ];
});

group('a prayer rung half built comes back half built after a reload, and is finished', async () => {
  up();
  window.__buy('after-prayer');
  runUntil(() => raise() && progressOf(raise()) >= 0.3, 480);
  const before = raise() ? progressOf(raise()) : -1;
  yard.persist(); window.__reload(); run(0.1);
  const after = raise() ? progressOf(raise()) : -1;
  const landed = runUntil(() => !raise(), 300);
  const rung = upCount('after-prayer');
  window.__actsOn(null);
  return [
    ok(before >= 0.3 && Math.abs(after - before) < 0.05, 'the work at the shrine is read back as far along as it was', `${before} -> ${after}`),
    ok(landed && rung === 1, 'and the builders finish it, the rung landing', `${rung}`)
  ];
});
