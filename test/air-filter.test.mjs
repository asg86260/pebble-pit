// The air filter (DESIGN.md, "The air filter"): the scrubbing house renamed
// through the code and the save, a dial reading the sky, and a spout the
// loads fall out of. The dial is a drawing and no check can see it; the
// scenes `filterclean`, `filterhalf`, `filterbrim`, `filterclog` and
// `filtersieve` are its check.

import { readFileSync } from 'node:fs';
import { group, ok, run, runUntil, buyBuilt, yard, state } from './helpers.mjs';
import { FILTER_MUCK, FILTER_PER_MUCK, SMOG_PER_MOTE } from '../src/config.js';
import { JOB, TYPE } from '../src/jobs.js';

const S = yard.S;

// Everything the filter is sold behind, so the row can be bought the way a
// player buys it.
const rich = (...crew) => {
  window.__reset();
  window.__crew(...crew);
  window.__grant({ cores: 9, dust: 90000, shards: 900, spores: 900, sparks: 500 });
  window.__answered('props', 'net', 'arch');
  window.__machine('ram', { bought: true });
  window.__air({ rains: 1 });
  S.seenAir = true;
  S.seenMess = true;
  S.seenSpore = true;
};

group('a save from before the rename comes back with its scrubbing house as the filter', async () => {
  // A player's yard with the house standing, its row seen and its board read.
  const raw = readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8');
  const was = JSON.parse(raw);
  localStorage.setItem('boulder-clicker/v4', raw);
  yard.restore();
  return [
    ok(was.scrubOpen === true && S.filterOpen === true, 'the building is still standing', `filterOpen ${S.filterOpen}`),
    ok(!('scrubOpen' in S), 'under its new name only'),
    ok(S.seenRows.includes('unlockfilter') && !S.seenRows.includes('unlockscrub'),
       'its row is still one the player has seen'),
    ok(S.seenSects.includes('the air filter') && !S.seenSects.includes('the scrubbing house'),
       'and its board is still one they have read', S.seenSects.join(', '))
  ];
});

group('a save with balloons in it gets its dust back, and its rider floats down', async () => {
  // A save from before the balloons went: two bought, a third being built,
  // and the filter's body up in a basket.
  window.__crew(0, 0);
  window.__air({ open: true, purifiers: 1 });
  run(20);
  yard.persist();
  const s = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  const rider = s.who.find(r => r.type === TYPE.PURIFY);
  s.saveV = 5;
  s.craft = [{ x: 0, dir: 1, lift: 1 }, { x: 0, dir: -1, lift: 0 }];
  s.works = { ...(s.works || {}), filter: [{ key: 'balloon', done: 1, of: 45, at: null }] };
  s.seenRows = [...(s.seenRows || []), 'balloon'];
  Object.assign(rider, { goal: 'aloft', aloft: true, craft: 0, berth: 0, y: rider.y - 300 });
  const was = s.stored;
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(s));
  yard.restore();
  const body = S.workers.find(w => w.type === TYPE.PURIFY);
  const high = body && body.y;
  const landed = runUntil(() => body && !body.aloft && !body.floating, 30);
  return [
    ok(S.stored === was + 1200 + 2280 + 4332, 'every balloon bought or on order is paid back',
       `${was} -> ${S.stored}`),
    ok(!S.seenRows.includes('balloon'), 'and its row is forgotten'),
    ok(!(S.works.filter || []).some(w => w.key === 'balloon'), 'and its build is off the site'),
    ok(body && body.craft === undefined && body.berth === undefined, 'the rider is out of the basket'),
    ok(high < S.groundY - 100, 'and still up where it was', `${Math.round(high)} over ground ${S.groundY}`),
    ok(landed, 'and comes down on its own')
  ];
});

group('the filter pumps out what it takes, and every load falls out of the spout', async () => {
  rich(1, 2);
  run(1);
  const up = buyBuilt('unlockfilter', 300);
  // Nothing else in the sky's books: no hands fouling it, no rain on it, no
  // muck but the filter's. The one body stays on it.
  window.__crew(0, 0);
  window.__air({ haze: 2400, purifiers: 1, muck: 0, rains: 1 });
  S.rainDue = 1e6;
  const muckNow = () => (S.muck || []).reduce((n, v) => n + (v || 0), 0);
  const haze0 = S.haze, owed0 = S.filterMuck || 0;
  let seen = 0, popped = 0, wasAir = 0, was = muckNow();
  for (let f = 0; f < 60 * 60; f++) {
    run(1 / 60);
    const air = state().smog.clods, m = muckNow();
    if (air > 0) seen++;
    // A load lands only out of the air: muck that rose with nothing falling
    // the frame before appeared on the heap.
    if (m > was && wasAir === 0) popped++;
    wasAir = air; was = m;
  }
  const taken = Math.round((haze0 - S.haze) / SMOG_PER_MOTE);
  const loads = Math.floor((owed0 + taken) / FILTER_PER_MUCK);
  const laid = muckNow() + state().smog.clods * FILTER_MUCK;
  return [
    ok(up && S.filterOpen, 'the filter goes up, bought off its row'),
    ok(S[JOB.PURIFY] >= 1, 'with a body on it'),
    ok(taken > FILTER_PER_MUCK * 3, 'it takes the sky down', `${taken} motes`),
    ok(Math.abs(laid - loads * FILTER_MUCK) <= FILTER_MUCK, 'and lays a load for every load it took',
       `${laid} laid or falling, ${loads} owed`),
    ok(seen > 0, 'the loads are seen in the air', `${seen} frames with one falling`),
    ok(popped === 0, 'and none appears on the heap without falling', `${popped} popped`)
  ];
});
