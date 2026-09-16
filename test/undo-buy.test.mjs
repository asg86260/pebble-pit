// A purchase taken back (DESIGN.md, "A tap buys"). For UNDO_MS after a row
// is pressed, pressing it again puts the work down unbuilt and the bill back
// in the pit -- the bill as it was charged, since a rung's next bill is
// dearer than the last. After the moment, or once the work has landed, the
// press is the row's ordinary press again and nothing comes back.
//
// Bought the player's way: the row is pressed through `__buy`, and the undo
// is the same press on the same row.

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { UNDO_MS, UNDO_DEAD_MS } from '../src/config.js';
import { purse, billOf, undoable, undoBuy } from '../src/upgrades.js';
import { rowFor, workOn } from '../src/works.js';

// The undo is the phone's answer to having no hover and no confirm, so the
// yard is stood up as a phone; the last group asks the desk.
const stocked = () => { window.__coarse(true); window.__crew(1, 0); window.__give(5000); run(0.1); };
// Past the dead zone, in which a second tap is not an undo.
const beat = () => run(UNDO_DEAD_MS / 1000 + 0.05);

// --- 1. a rung -----------------------------------------------------------------------
group('a rung pressed twice inside the moment costs nothing', async () => {
  stocked();
  const u = rowFor('carry');
  const bill = billOf(u);
  const had = purse('dust');
  const bought = window.__buy('carry');
  const queued = !!workOn('carry');
  const after = purse('dust');
  const tooSoon = undoable(u);
  beat();
  const offered = undoable(u);
  // The same press again, through the row: `buy` sees the undo and takes it.
  const undone = window.__buy('carry');
  run(0.5);
  return [
    ok(bought, 'the rung is bought at the row'),
    ok(queued, 'and is a piece of work at the bench'),
    ok(after === had - bill.find(([m]) => m === 'dust')[1], 'the bill is taken', `${had} -> ${after}`),
    ok(!tooSoon, 'not in the first instant: a fast double tap is one purchase'),
    ok(offered, 'then the row offers the way back'),
    ok(!undone, 'pressing it again is not a second purchase'),
    ok(!workOn('carry'), 'the work is put down', `${workOn('carry')}`),
    ok(purse('dust') === had, 'and the bill is back in the pit', `${purse('dust')} vs ${had}`),
    ok(S.undo === null, 'and there is nothing left to undo'),
  ];
});

// --- 2. a build ----------------------------------------------------------------------
group('a build pressed twice inside the moment is handed back whole', async () => {
  stocked();
  const u = rowFor('unlockshack');
  const bill = billOf(u).filter(([m]) => m !== 'time');
  const had = Object.fromEntries(bill.map(([m]) => [m, purse(m)]));
  const bought = window.__buy('unlockshack');
  run(0.5);                                   // a few frames of building, and past the dead zone
  const going = !!workOn('unlockshack');
  const undone = undoBuy();
  run(0.5);
  return [
    ok(bought && going, 'the shack is bought and under way'),
    ok(undone, 'and taken back'),
    ok(!workOn('unlockshack') && !S.shackOpen, 'nothing is built', `open ${S.shackOpen}`),
    ...bill.map(([m, n]) => ok(purse(m) === had[m], `the ${m} comes back`, `${purse(m)} vs ${had[m]}`)),
  ];
});

// --- 3. the moment ---------------------------------------------------------------------
group('after UNDO_MS the press is a press again and nothing comes back', async () => {
  stocked();
  const u = rowFor('carry');
  window.__buy('carry');
  const after = purse('dust');
  run(UNDO_MS / 1000 + 0.5);
  const still = !!workOn('carry');           // not landed yet: nobody is at the bench
  const offered = undoable(u);
  const undone = undoBuy();
  return [
    ok(still, 'the work is still in hand (nobody has built it)', `${still}`),
    ok(!offered, 'but the row no longer offers the way back'),
    ok(!undone, 'and asking for it is refused'),
    ok(purse('dust') === after, 'with nothing refunded', `${purse('dust')} vs ${after}`),
  ];
});

// --- 4. landed -------------------------------------------------------------------------
group('a work that has landed is had, whatever the clock says', async () => {
  stocked();
  const u = rowFor('carry');
  const level = S.carryLevel;
  window.__buy('carry');
  window.__finish();
  run(0.1);
  return [
    ok(S.carryLevel === level + 1, 'the rung is up', `${level} -> ${S.carryLevel}`),
    ok(!undoable(u) && !undoBuy(), 'and there is no taking it back'),
  ];
});

// --- 5. the desk ---------------------------------------------------------------------
group('on a desk there is no undo: a work at the front is committed', async () => {
  stocked();
  window.__coarse(null);
  const u = rowFor('carry');
  window.__buy('carry');
  const after = purse('dust');
  beat();
  const offered = undoable(u);
  const undone = undoBuy();
  return [
    ok(!offered, 'the row offers nothing back'),
    ok(!undone && !!workOn('carry') && purse('dust') === after, 'and the work stays, paid for', `${purse('dust')} vs ${after}`),
  ];
});
