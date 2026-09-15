// Wave 6, Track A: the shed-built upgrade, the belt's box and the
// wizard's base numbers. Each group reaches its feature the way a player does
// -- the row is bought with `__buy`, the body assigned through the roster's
// own `assign` -- and the hooks only set up what the group is not about.

import { group, ok, state, run, runUntil, WORKER } from './helpers.mjs';
import { LADDER, LADDERS } from '../src/config.js';
import { S } from '../src/state.js';
import { workAt, siteBox, worksAt } from '../src/works.js';
import { quarryShed } from '../src/world.js';
import { beltFrom, beltReach } from '../src/dust.js';
import { wizMs } from '../src/wizard.js';
import { critChance } from '../src/crit.js';
import { TYPE } from '../src/jobs.js';

// --- A2: a quarry upgrade is worked at the shed by a spare hand ----------------
//
// The bench used to be credited to the whole gang while every one of them went
// on quarrying: a bar that fills without the yard changing. Then the work
// claimed one of the gang to the shed (wave6-sim item 2), and a body the
// player had put in the cut downed tools and walked off. Now it is the
// shack's rule: a hauler off the dust walks to the shed, the bar moves only
// while it stands there, and the gang digs throughout.
group('a quarry upgrade is worked at the shed by a spare hand, and the gang keeps digging', async () => {
  window.__crew(0, 2, 3);                      // a three-body quarry gang, two spare
  window.__grant({ shards: 500, spores: 500 });  // the bench is priced in crop
  window.__give(50000);
  runUntil(() => S.workers.filter(w => w.type === TYPE.QUARRY && w.goal !== 'to').length === 3, 90);

  const bought = window.__buy('quarrybench');  // the next bench, like a player
  const sent = () => S.workers.filter(w => w.type === TYPE.BUILD && w.site === 'quarry');
  const gang = () => S.workers.filter(w => w.type === TYPE.QUARRY);

  // Exactly one spare hand is sent, and until it is standing at the shed the
  // bar does not move.
  run(0.5);
  const nSent = sent().length;
  const beforeArrive = workAt('quarry')?.done ?? -1;

  const shed = quarryShed();
  const inShed = w => w.x + WORKER > shed.x && w.x < shed.x + shed.w;
  const arrived = runUntil(() => sent().some(w => w.goal === 'at' && inShed(w)), 60);
  const atStart = workAt('quarry')?.done ?? -1;
  run(4);
  const later = workAt('quarry')?.done ?? atStart + 999;

  // While the bench is being cut the gang is still the gang: three in the
  // cut, none of them at the shed.
  const working = gang().filter(w => !inShed(w)).length;

  // And when it lands, the hand goes back to the dust.
  const landed = runUntil(() => !workAt('quarry'), 300);
  const released = runUntil(() => sent().length === 0, 10);

  return [
    ok(bought, 'the bench is bought like a player buys it'),
    ok(nSent === 1, 'exactly one spare hand is sent', `${nSent}`),
    ok(beforeArrive === 0, 'the bar does not move before it is at the shed',
       `${beforeArrive}`),
    ok(arrived, 'the spare hand stands at the quarry shed'),
    ok(later > atStart, 'the bar advances while it stands there',
       `${atStart} -> ${later}`),
    ok(working === 3, 'and all three of the gang go on quarrying', `${working}`),
    ok(landed && released, 'the work lands and the hand goes back to the dust')
  ];
});

// --- A6: the belt's work box spans the run, not the tail -----------------------
//
// The belt's bar used to hang on `beltFrom()` -- the tail of the run, inside
// the boulder -- because the yard row fell through to siteBox's guess. The row
// carries the machine's real ground now.
group('a belt being built is boxed rock-to-lip, not at its tail', async () => {
  window.__crew(3, 3);
  window.__fullSites();
  // the belt's own gates: every rung of the lip's gear, and a full set of carts
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__kit({ carters: 9 });
  window.__grant({ shards: 5000, spores: 5000, sparks: 5000 });
  window.__give(200000);
  const bought = window.__buy('belt');
  const going = worksAt('yard').some(w => w.key === 'belt');
  const box = siteBox('yard');
  const from = beltFrom(), to = beltReach();
  window.__finish();
  return [
    ok(bought && going, 'the belt is bought and on the go'),
    ok(!!box && Math.abs(box.x - from) < 1 && Math.abs(box.x + box.w - to) < 1,
       'its box spans beltFrom()..beltReach()',
       box && `${Math.round(box.x)}..${Math.round(box.x + box.w)} vs ${from}..${to}`)
  ];
});

// --- A10: the wizard starts at the bottom of its ladders -----------------------
group('a fresh wizard casts slowly and rarely crits', async () => {
  return [
    ok(wizMs() === 2600, 'a bolt every 2.6 s at level 0', `${wizMs()}`),
    ok(Math.abs(critChance() - LADDERS.critchance.value[0] / 100) < 1e-9 && critChance() <= 0.05,
       'a crit on one swing in twenty at most, off the table',
       `${critChance()}`)
  ];
});
