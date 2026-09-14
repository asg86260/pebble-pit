// The bench, the shields, the kit, the shack and the machines: every row of
// them reached, bought and read back after a cold reload. The table is
// `shop-rows.mjs`; the walk is `shop-coverage.mjs`. Part 2 is the stations.
import { group, ok } from './helpers.mjs';
import { cover } from './shop-coverage.mjs';
import { ROWS } from './shop-rows.mjs';

// The table is complete, or the walk below is walking past something. A row
// on any board with no line in the table is the next ore yield.
group('every row on every board has a line in the coverage table', async () => {
  const keys = window.__rows().map(r => r.key);
  const named = new Set(ROWS.map(r => r.key));
  const unnamed = keys.filter(k => !named.has(k));
  const stale = ROWS.map(r => r.key).filter(k => !keys.includes(k));
  const twice = ROWS.map(r => r.key).filter((k, i, a) => a.indexOf(k) !== i);
  return [
    ok(unnamed.length === 0, 'every row is in shop-rows.mjs', unnamed.join(', ')),
    ok(stale.length === 0, 'and nothing in the table has left the game', stale.join(', ')),
    ok(twice.length === 0, 'and no row is in it twice', twice.join(', '))
  ];
});

cover(1);
