// The queue: a site builds one thing at a time and the rest wait in line,
// paid for on the press and handed back in full if pulled out before anybody
// has hands on them. See DESIGN.md, "The queue".
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
const setUp = () => {
  window.__crew(3, 0);
  window.__grant({ dust: 5000 });
  yard.S.seenDrag = true;
  yard.S.autoMine = true;
  run(0.5);
};
const THREE = ['carry', 'speed', 'pick'];

group('a second press at a busy site goes in line, and is paid for now', async () => {
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

group('only the front of the line is worked; the rest stand at nought', async () => {
  setUp();
  for (const key of THREE) window.__buy(key);
  run(4);
  const list = at('bench');
  const front = list[0], behind = list.slice(1);
  return [
    ok(front && front.done > 0, 'the front one is being built', `${front?.key} ${front?.done}`),
    ok(behind.every(w => w.done === 0), 'the ones behind it have not moved',
       behind.map(w => `${w.key}:${w.done}`).join(' ')),
    ok(state().builders <= 1, 'and one body, not a gang, is at the bench', `${state().builders}`),
  ];
});

group('they land in the order bought, each stepping up as the one before lands', async () => {
  setUp();
  for (const key of THREE) window.__buy(key);
  const landed = [];
  const note = () => {
    for (const key of THREE) if (!on(key) && !landed.includes(key)) landed.push(key);
    return landed.length === 3;
  };
  runUntil(note, 240);
  return [
    ok(landed.join(',') === THREE.join(','), 'all three landed, in order', landed.join(',')),
    ok(state().carryLevel === 1 && state().speedLevel === 1 && state().pickLevel === 1,
       'and each one did what its row does',
       `carry ${state().carryLevel} speed ${state().speedLevel} pick ${state().pickLevel}`),
  ];
});

group('a press on a row in line pulls it out and hands the bill back', async () => {
  setUp();
  window.__buy('carry');
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
    ok(list.join(',') === 'carry', 'and the pick is out of the line', list.join(',')),
    ok(purse() === before, 'with the whole bill back in the pile', `${before} -> ${purse()}`),
  ];
});

group('the one being built is committed: pressing it again does nothing', async () => {
  setUp();
  window.__buy('carry');
  run(1);
  const before = purse();
  const again = window.__buy('carry');
  return [
    ok(again === false, 'the press is refused', `${again}`),
    ok(at('bench').length === 1 && at('bench')[0].key === 'carry', 'the work is still there',
       at('bench').map(w => w.key).join(',')),
    ok(purse() === before, 'and nothing changed hands', `${before} -> ${purse()}`),
  ];
});

group('a line survives a reload in the same order, still at nought behind the front', async () => {
  setUp();
  for (const key of THREE) window.__buy(key);
  run(2);
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
