// The machines' own ladders: three rungs of red, and an end you reach.
//
// Every ladder in this game used to belong to hands -- pick, swing, carry,
// harness, boots -- and a machine ran at the rate it was born at for ever. So
// the biggest purchase in the game was the end of a line rather than the start
// of one, and these are what came after it.
//
// They were endless once, to be the yard's red sink. They are `MACHINE_TUNE_RUNGS`
// long now, priced off a written table (`MACHINE_TUNE_SPARKS`) like every other
// ladder in the game, so the row carries pips and says "2 of 3" instead of
// climbing into a price nobody reaches. The rift's throughput is the endless
// sink. So these checks are about the ladder ending where the table says, and
// about a save from the endless days not carrying a rung the board cannot sell.

import { group, ok, state, yard, buyBuilt, buyNow } from './helpers.mjs';
import { MACHINE_TUNE_SPARKS, MACHINE_TUNE_RUNGS, DUST_PER_SPARK } from '../src/config.js';

// Straight off the module. `yard.upgrades` is the `__upgrades` hook -- the yard
// spreads `hooks` over its own handles and the two names collide -- so reaching
// for the rate function through it silently gets a function that answers a
// different question.
const { machineRate } = await import('../src/levels.js');

const MACHINES = [
  { key: 'jaw', row: 'tunejaw', job: 'quarriers' },
  { key: 'ram', row: 'tuneram', job: 'rockhands' },
  { key: 'tiller', row: 'tunetiller', job: 'farmhands' }
];

// A yard with every machine standing and money for anything.
function stocked() {
  window.__reset();
  window.__crew(3, 3, 3, 3);
  window.__fullSites();
  window.__grant({ sparks: 99999, shards: 9999, spores: 9999, dust: 200000 });
  for (const m of MACHINES) window.__machine(m.key, { bought: true });
}

const row = key => window.__rows().find(r => r.key === key);

group('every machine has a ladder, on its own board', async () => {
  stocked();
  const bad = [];
  for (const m of MACHINES) {
    const r = row(m.row);
    if (!r) { bad.push(`${m.key}: no row at all`); continue; }
    if (!r.shown) bad.push(`${m.key}: its row is not offered`);
    const bill = r.bill || [];
    if (!bill.some(b => b[0] === 'spark')) bad.push(`${m.key}: not priced in red`);
    if (!bill.some(b => b[0] === 'dust')) bad.push(`${m.key}: not priced in dust`);
  }
  return [
    ok(bad.length === 0, 'all four are sold, in red and in dust', bad.join('; '))
  ];
});

group('a machine with no ladder bought is not offered one', async () => {
  window.__reset();
  window.__crew(3, 3, 3, 3);
  window.__fullSites();
  window.__grant({ sparks: 99999, dust: 200000 });
  const before = row('tunejaw');
  window.__machine('jaw', { bought: true });
  const after = row('tunejaw');
  return [
    ok(before && !before.shown, 'no ladder for a jaw nobody has bought',
       `shown ${before?.shown}`),
    ok(after && after.shown, 'and one the moment it is standing',
       `shown ${after?.shown}`)
  ];
});

group('a rung actually makes the machine faster', async () => {
  stocked();
  const rate = () => machineRate('quarriers');
  const before = rate();
  buyNow('tunejaw');
  const one = rate();
  buyNow('tunejaw');
  const two = rate();
  return [
    ok(one > before, 'one rung is a faster jaw',
       `${before.toFixed(2)} -> ${one.toFixed(2)}`),
    ok(two > one, 'and the next is faster again',
       `${one.toFixed(2)} -> ${two.toFixed(2)}`),
    // The gain compounds, which is what makes it a ladder rather than a stack of
    // flat bonuses -- and it is the same number every time.
    ok(Math.abs((one / before) - (two / one)) < 0.01,
       'each rung is worth the same multiple as the last',
       `${(one / before).toFixed(3)} then ${(two / one).toFixed(3)}`)
  ];
});

group('a ladder ends where its table ends, and is priced off it', async () => {
  stocked();
  window.__grant({ sparks: 9e8, dust: 9e8 });

  // The price of every rung, read off the row as a player would, plus one more
  // press past the top to prove the row refuses it.
  const prices = [];
  for (let i = 0; i < MACHINE_TUNE_RUNGS; i++) {
    const r = row('tuneram');
    prices.push((r.bill.find(b => b[0] === 'spark') || [])[1]);
    buyNow('tuneram');
  }
  const past = buyNow('tuneram');
  const last = row('tuneram');

  return [
    ok(yard.S.machines.ram.tune === MACHINE_TUNE_RUNGS, 'the ladder is climbed to its top',
       `${yard.S.machines.ram.tune} of ${MACHINE_TUNE_RUNGS}`),
    // The whole point of the written table: the bill a player is shown is the
    // line in config, not a rate compounded out of a first cost.
    ok(prices.join(',') === MACHINE_TUNE_SPARKS.join(','),
       'every rung was billed the red the table says',
       `${prices.join(', ')} against ${MACHINE_TUNE_SPARKS.join(', ')}`),
    // The dust leg is derived from the red one, never written twice.
    ok(last.bill.find(b => b[0] === 'dust')[1]
       === last.bill.find(b => b[0] === 'spark')[1] * DUST_PER_SPARK,
       'and its dust leg is the red one at the going rate',
       JSON.stringify(last.bill)),
    ok(!past && yard.S.machines.ram.tune === MACHINE_TUNE_RUNGS,
       'a press past the top buys nothing', `bought ${past}`),
    ok(last && last.done, 'and the row says done', JSON.stringify({ done: last?.done }))
  ];
});

// A save from when these ladders had no top holds a rung count no board can
// now sell or draw, and `tuneGain` would hand that machine a rate the yard
// cannot buy. `restore` clamps it to the table's length.
group('a save from the endless days comes back at the top of the ladder', async () => {
  stocked();
  const raw = JSON.parse(localStorage.getItem('boulder-clicker/v4') || '{}');
  window.__reload();
  const saved = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  saved.machines.ram.tune = 12;
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(saved));
  yard.restore();
  return [
    ok(yard.S.machines.ram.tune === MACHINE_TUNE_RUNGS,
       'twelve rungs come back as the three the ladder has',
       `${yard.S.machines.ram.tune}`)
  ];
});

group('how far up a ladder is survives a reload', async () => {
  stocked();
  for (let i = 0; i < 2; i++) buyNow('tunejaw');
  const before = yard.S.machines.jaw.tune;
  window.__reload();
  const after = yard.S.machines.jaw.tune;
  return [
    ok(before === 2, 'two rungs went on', `${before}`),
    // The dearest red in the game per rung; losing it on a reload is losing a
    // machine's worth of sparks.
    ok(after === before, 'and they are all still there afterwards',
       `${before} -> ${after}`)
  ];
});
