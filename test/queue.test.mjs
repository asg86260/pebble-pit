// The queue: a site builds everything it is paid for at once, one body a work
// while there are spare bodies, paid for on the press and handed back in full
// if pulled out before anybody has started on it. See DESIGN.md, "The queue".
//
// Bought the way a player buys -- `__buy`, the row's own path -- and never by
// writing to `S.works`: the thing under test is what a press does when the
// site is already building.

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

const at = site => (state().line || {})[site] || [];
const on = key => Object.values(state().line || {}).flat().find(w => w.key === key) || null;
const purse = () => state().stored;

// Three rungs on the bench: a hauler's carry, your swing, and a sharper pick.
// The swing and the pick are offered once mining is automatic, which is set by
// hand here because it is the gate on the rows and not the thing under test.
const setUp = (spare = 3) => {
  window.__crew(1, spare);
  window.__grant({ dust: 5000 });
  yard.S.seenDrag = true;
  yard.S.autoMine = true;
  run(0.5);
};
const THREE = ['carry', 'speed', 'pick'];

group('a second press at a busy site starts too, and is paid for now', async () => {
  setUp();
  const before = purse();
  const first = window.__buy('carry');
  const afterOne = purse();
  const second = window.__buy('speed');
  const afterTwo = purse();
  const third = window.__buy('pick');
  run(0.25);
  const list = at('bench').map(w => w.key);
  return [
    ok(first && second && third, 'all three presses go through', `${first} ${second} ${third}`),
    ok(list.join(',') === THREE.join(','), 'in the order they were bought', list.join(',')),
    ok(before > afterOne && afterOne > afterTwo && afterTwo > purse(), 'and every bill is taken on the press',
       `${before} ${afterOne} ${afterTwo} ${purse()}`),
  ];
});

group('every work is built at once, one body each', async () => {
  setUp();
  for (const key of THREE) window.__buy(key);
  run(3);
  const list = at('bench');
  return [
    ok(list.length === 3 && list.every(w => w.done > 0), 'all three are being built',
       list.map(w => `${w.key}:${w.done.toFixed(1)}`).join(' ')),
    ok(state().builders === 3, 'and a body is at each of them', `${state().builders}`),
  ];
});

group('with fewer spare bodies than works, the rest stand until one comes free', async () => {
  setUp(1);
  for (const key of THREE) window.__buy(key);
  run(3);
  const list = at('bench');
  const going = list.filter(w => w.done > 0), still = list.filter(w => w.done === 0);
  return [
    ok(going.length === 1 && going[0].key === 'carry', 'the first bought has the one body',
       list.map(w => `${w.key}:${w.done.toFixed(1)}`).join(' ')),
    ok(still.length === 2, 'and the other two have not moved', still.map(w => w.key).join(',')),
    ok(state().builders === 1, 'one body, not a gang', `${state().builders}`),
  ];
});

group('they all land, and each one does what its row does', async () => {
  setUp();
  for (const key of THREE) window.__buy(key);
  const landed = [];
  const note = () => {
    for (const key of THREE) if (!on(key) && !landed.includes(key)) landed.push(key);
    return landed.length === 3;
  };
  runUntil(note, 240);
  return [
    ok(landed.length === 3, 'all three landed', landed.join(',')),
    ok(state().carryLevel === 1 && state().speedLevel === 1 && state().pickLevel === 1,
       'and each one did what its row does',
       `carry ${state().carryLevel} speed ${state().speedLevel} pick ${state().pickLevel}`),
  ];
});

group('a press on a row nobody has started on pulls it out and hands the bill back', async () => {
  setUp(1);
  window.__buy('carry');
  run(3);                                     // the one body is on the carry
  const before = purse();
  window.__buy('pick');
  const paid = before - purse();
  run(0.25);
  const pulled = window.__buy('pick');        // the same press, the other way
  run(0.25);
  const list = at('bench').map(w => w.key);
  return [
    ok(paid > 0, 'the pick was paid for', `${paid}`),
    ok(pulled === false, 'the press is not a purchase', `${pulled}`),
    ok(list.join(',') === 'carry', 'and the pick is out of the list', list.join(',')),
    ok(purse() === before, 'with the whole bill back in the pile', `${before} -> ${purse()}`),
  ];
});

group('the one being built is committed: pressing it again does nothing', async () => {
  setUp();
  window.__buy('carry');
  run(3);
  const before = purse();
  const again = window.__buy('carry');
  return [
    ok(again === false, 'the press is refused', `${again}`),
    ok(at('bench').length === 1 && at('bench')[0].key === 'carry', 'the work is still there',
       at('bench').map(w => w.key).join(',')),
    ok(purse() === before, 'and nothing changed hands', `${before} -> ${purse()}`),
  ];
});

group('the works survive a reload in the same order and state', async () => {
  setUp(1);
  for (const key of THREE) window.__buy(key);
  run(3);
  const was = at('bench').map(w => `${w.key}:${w.done > 0 ? 'going' : 'waiting'}`);
  window.__reload();
  run(0.1);
  const now = at('bench').map(w => `${w.key}:${w.done > 0 ? 'going' : 'waiting'}`);
  return [
    ok(was.length === 3, 'three works before the reload', was.join(' ')),
    ok(now.join(' ') === was.join(' '), 'and the same three, in the same state, after',
       `${was.join(' ')} -> ${now.join(' ')}`),
  ];
});
