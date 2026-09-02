// The machines' own ladders, and the fact that they never end.
//
// Every ladder in this game used to belong to hands -- pick, swing, carry,
// harness, boots -- and a machine ran at the rate it was born at for ever. So
// the biggest purchase in the game was the end of a line rather than the start
// of one, and there was nothing left anywhere to spend an endgame's dust on.
//
// These are that missing thing, and being **endless** is the whole of what makes
// them work as a sink: a five-rung ladder has a finite total cost, and a finite
// total cost puts the surplus straight back where it was. Which is why the
// checks below are as much about the twentieth rung as about the first.

import { group, ok, state, yard, buyBuilt, buyNow } from './helpers.mjs';

// Straight off the module. `yard.upgrades` is the `__upgrades` hook -- the yard
// spreads `hooks` over its own handles and the two names collide -- so reaching
// for the rate function through it silently gets a function that answers a
// different question.
const { machineRate } = await import('../src/upgrades.js');

const MACHINES = [
  { key: 'jaw', row: 'tunejaw', job: 'quarriers' },
  { key: 'ram', row: 'tuneram', job: 'miners' },
  { key: 'tiller', row: 'tunetiller', job: 'farmhands' },
  { key: 'belt', row: 'tunebelt', job: 'haulers' }
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

group('the ladders never end, and get dearer all the way up', async () => {
  stocked();
  // Enough of both to reach the twenty-fifth rung. It takes a great deal, and
  // that is the finding rather than an inconvenience: by rung ten a single rung
  // costs more dust than the hole can hold, so the ladder is only climbable at
  // all by a yard with a rift under it. Which is the two halves of this change
  // meeting -- the sink is deep enough to need the bank.
  window.__grant({ sparks: 9e8, dust: 9e8 });

  const prices = [];
  for (let i = 0; i < 25; i++) {
    const r = row('tuneram');
    prices.push((r.bill.find(b => b[0] === 'spark') || [])[1]);
    buyNow('tuneram');
  }
  const last = row('tuneram');

  // Each rung dearer than the one before it, all the way up. This is what stops
  // an endless row from running away with the game: the price climbs faster than
  // the gain, so a rung buys less than the last one did and the ladder is a
  // slope rather than a lever.
  const climbs = prices.every((p, i) => i === 0 || p > prices[i - 1]);

  return [
    ok(yard.S.machines.ram.tune === 25, 'twenty-five rungs went on',
       `${yard.S.machines.ram.tune}`),
    ok(last && last.shown, 'and the row is still on the board',
       `shown ${last?.shown}`),
    ok(!last?.done && !last?.maxed, 'it never says done',
       JSON.stringify({ done: last?.done, maxed: last?.maxed })),
    ok(climbs, 'every rung cost more than the one before it',
       `${prices[0]} ... ${prices[prices.length - 1]}`),
    // A sink deep enough to matter: the twenty-sixth rung alone costs more red
    // than the whole first ten did.
    ok(prices[prices.length - 1] > prices.slice(0, 10).reduce((a, b) => a + b, 0),
       'and the top of it dwarfs the bottom',
       `rung 25 costs ${prices[prices.length - 1]}, the first ten together ` +
       `${prices.slice(0, 10).reduce((a, b) => a + b, 0)}`)
  ];
});

group('how far up a ladder is survives a reload', async () => {
  stocked();
  for (let i = 0; i < 4; i++) buyNow('tunejaw');
  const before = yard.S.machines.jaw.tune;
  window.__reload();
  const after = yard.S.machines.jaw.tune;
  return [
    ok(before === 4, 'four rungs went on', `${before}`),
    // An endless ladder is a number that only goes up, so losing it on a reload
    // is losing everything ever spent on the biggest sink in the game.
    ok(after === before, 'and they are all still there afterwards',
       `${before} -> ${after}`)
  ];
});
