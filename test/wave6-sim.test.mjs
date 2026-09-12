// Wave 6, Track A: the teacher, the shed-built upgrade, the belt's box and the
// wizard's base numbers. Each group reaches its feature the way a player does
// -- the row is bought with `__buy`, the body assigned through the roster's
// own `assign` -- and the hooks only set up what the group is not about.

import { group, ok, state, run, runUntil, WORKER } from './helpers.mjs';
import { LADDER } from '../src/config.js';
import { S } from '../src/state.js';
import { workAt, siteBox, worksAt } from '../src/works.js';
import { quarryShed } from '../src/world.js';
import { beltFrom, beltReach } from '../src/dust.js';
import { wizMs } from '../src/wizard.js';
import { critChance } from '../src/crit.js';
import { TYPE } from '../src/jobs.js';

// --- A1: the training grounds has a teacher -----------------------------------
//
// The school's works used to be done by whoever was spare, which left the one
// station with no post on the boards and nothing standing in it. Now a teacher
// is assigned like any other body, and the trades taught in there accrue only
// while it is actually through the door -- never off the assigned count.
group('a trade is taught only while the teacher is through the door', async () => {
  window.__grant({ shards: 500 });
  window.__give(50000);
  // The school bought like a player buys it, and built the way every building
  // is: the yard's spare hands. The building is not what this group is about,
  // so the worker-seconds are handed over.
  const bought = window.__buy('unlockschool');
  window.__finish();
  const open = state().schoolOpen;

  // Two bodies: one to teach, one on the rock so nobody is left spare -- a
  // spare hand would be lent to the empty school (the tower's-first-hat rule)
  // and this group is about the teacher, not the lending.
  window.__crew(1, 1);
  const assigned = window.__assign('teachers', 1) !== false && S.teachers === 1;

  // Start a trade with the teacher still crossing the yard: no progress until
  // it is through the door. The count says one teacher; the door says nobody.
  // The door wins -- sampled every frame up to the frame it steps in.
  const started = window.__buy('breaker');
  const w0 = workAt('school');
  let doneWhileWalking = 0;
  const arrived = runUntil(() => {
    const t = S.workers.find(w => w.type === TYPE.TEACH);
    if (!t || t.goal === 'in') return !!t;
    doneWhileWalking = Math.max(doneWhileWalking, workAt('school')?.done ?? 0);
    return false;
  }, 60);
  const before = workAt('school')?.done ?? -1;
  run(4);
  const after = workAt('school')?.done ?? before + 999;

  return [
    ok(bought && open, 'the training grounds is bought and stands'),
    ok(assigned, 'a teacher is put on it through the roster', `${S.teachers}`),
    ok(started && !!w0, 'a trade can be started there'),
    ok(doneWhileWalking === 0,
       'no teaching happens while the teacher is still crossing the yard',
       `${doneWhileWalking}`),
    ok(arrived, 'the teacher gets through the door'),
    ok(after > before, 'and only then does the trade accrue',
       `${before} -> ${after}`)
  ];
});

// --- A2: a quarry upgrade pulls one of the gang to the shed --------------------
//
// The bench used to be credited to the whole gang while every one of them went
// on quarrying: a bar that fills without the yard changing. Now the work
// claims one body -- it stops producing, stands at the shed, and the bar moves
// only while it is standing there -- and it walks back after.
group('a quarry upgrade claims one gang body to the shed, and gives it back', async () => {
  window.__crew(0, 0, 3);                      // a three-body quarry gang
  window.__grant({ shards: 500, spores: 500 });  // the bench is priced in crop
  window.__give(50000);
  runUntil(() => S.workers.filter(w => w.type === TYPE.QUARRY && w.goal !== 'to').length === 3, 90);

  const bought = window.__buy('quarrybench');  // the next bench, like a player
  const claimed = () => S.workers.filter(w => w.onBuild === 'quarry');

  // Exactly one of the gang is claimed, and until it is standing at the shed
  // the bar does not move.
  run(0.5);
  const nClaimed = claimed().length;
  const beforeArrive = workAt('quarry')?.done ?? -1;

  const shed = quarryShed();
  const inShed = w => w.x + WORKER > shed.x && w.x < shed.x + shed.w;
  const arrived = runUntil(() => claimed().some(w => w.atShed && inShed(w)), 60);
  const atStart = workAt('quarry')?.done ?? -1;
  run(4);
  const later = workAt('quarry')?.done ?? atStart + 999;

  // While the bench is being cut, the claimed body is out of the cut: two of
  // three still working it, which is the production drop made visible.
  const working = S.workers.filter(w => w.type === TYPE.QUARRY && !w.onBuild).length;

  // And when it lands, the claim clears and the body goes back to the cut.
  const landed = runUntil(() => !workAt('quarry'), 300);
  const released = runUntil(() => claimed().length === 0, 10);
  const backAtWork = runUntil(() =>
    S.workers.filter(w => w.type === TYPE.QUARRY && !inShed(w)).length === 3, 90);

  return [
    ok(bought, 'the bench is bought like a player buys it'),
    ok(nClaimed === 1, 'exactly one gang body is claimed', `${nClaimed}`),
    ok(beforeArrive === 0, 'the bar does not move before it is at the shed',
       `${beforeArrive}`),
    ok(arrived, 'the claimed body stands at the quarry shed'),
    ok(later > atStart, 'the bar advances while it stands there',
       `${atStart} -> ${later}`),
    ok(working === 2, 'the other two go on quarrying', `${working}`),
    ok(landed && released, 'the work lands and the claim clears'),
    ok(backAtWork, 'and the body walks back to the cut')
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
  window.__school({ carters: 9 });
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
    ok(Math.abs(critChance() - 0.04) < 1e-9, 'a crit on one swing in twenty-five',
       `${critChance()}`)
  ];
});
