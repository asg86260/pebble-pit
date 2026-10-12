// The air filter comes with its first balloon: finish the house and one craft
// moors at its first post, gets a rider and goes up. The row for balloons
// still starts at the ladder's first rung and bill, and a save from before
// the gift gets its balloon on load.

import { group, ok, state, run, runUntil, buyNow, openSites, yard } from './helpers.mjs';
import { migrate } from '../src/migrations/index.js';

const rich = () => {
  window.__reset();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__tip(90000);
  openSites();
  window.__machine('ram', { bought: true });
  yard.S.crew += 4;                    // hands to spare once the places are open
  window.__air({ rains: 1 });
  yard.S.seenAir = true;
  run(2);
};

const crafts = () => state().craft.length;
const found = () => window.__rows().find(r => r.key === 'balloon');
const row = () => { const r = found(); return r && { ...r, cost: r.bill[0] && r.bill[0][1] }; };

group('finishing the air filter brings one balloon, which goes up and draws', async () => {
  rich();
  const bought = window.__buy('unlockfilter');
  const early = crafts();
  window.__finish();
  run(1);
  const moored = crafts();
  const up = runUntil(() => state().craft[0] && state().craft[0].up, 120);
  const r = row();
  return [
    ok(bought && early === 0, 'the house is bought and no balloon is there before it is built'),
    ok(moored === 1 && yard.S.craftGift === 1, 'one balloon moored with the finished house', `${moored}`),
    ok(up, 'with a rider aboard it goes up', `${yard.S.purifiers} riders, ${JSON.stringify(state().craft[0])}`),
    ok(r && r.cost === 1200, 'the row still starts at its first bill', JSON.stringify(r && r.cost))
  ];
});

group('the first balloon bought is the second craft, at the first bill', async () => {
  rich();
  buyNow('unlockfilter');
  run(1);
  const paid = row().cost;
  const got = buyNow('balloon');
  run(1);
  return [
    ok(got && crafts() === 2, 'two craft after one purchase', `${crafts()}`),
    ok(paid === 1200 && row().cost === Math.round(1200 * 1.9), 'the next is the second rung', `${paid} then ${row().cost}`)
  ];
});

group('a save with the filter and no balloon gets the included one; bought ones are kept', async () => {
  const a = { filterOpen: true, craft: [] }; migrate(a);
  const b = { filterOpen: true, craft: [{ phase: 'moored', t: 0, hang: false }] }; migrate(b);
  const c = { filterOpen: false, craft: [] }; migrate(c);
  const d = { filterOpen: true, craft: [], craftGift: 1, saveV: 12 }; migrate(d);
  return [
    ok(a.craft.length === 1 && a.craftGift === 1, 'filter and none: one comes', `${a.craft.length}`),
    ok(b.craft.length === 2 && b.craftGift === 1, 'one already bought: keeps it and gets one extra', `${b.craft.length}`),
    ok(c.craft.length === 0, 'no filter: nothing'),
    ok(d.craft.length === 0, 'already given: not twice')
  ];
});
