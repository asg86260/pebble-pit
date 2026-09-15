// A rung that lands while you are looking elsewhere is news, and the tile says
// so: the turned-down corner a card you have never read wears (`seenRows`)
// comes back on the tile whose work just finished, and goes again only when
// you hover that tile. The tick over the station already says "something
// landed here"; this is the tile-level half of the same sentence.
//
// Bought the way a player buys it: through the row, with the cut digging it.

import { group, ok, state, run, runUntil, openSites, yard } from './helpers.mjs';

group('a rung that lands makes its tile unread again', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 2, 2);
  window.__grant({ shards: 900, spores: 900, dust: 90000 });
  run(2);

  // The row was read before the build was bought, as it would have been: you
  // hovered it to press it.
  yard.S.seenRows = [...yard.S.seenRows, 'quarrybench'];
  const benches = state().benches;
  const started = window.__buy('quarrybench');
  const readWhileBuilding = yard.S.seenRows.includes('quarrybench');
  const landed = runUntil(() => state().benches > benches, 180);

  return [
    ok(started, 'the row answers when it is pressed'),
    ok(readWhileBuilding, 'and stays read while the cut digs it'),
    ok(landed, 'and the gang in the cut finishes it'),
    ok(!yard.S.seenRows.includes('quarrybench'),
       'and the tile is unread again the frame the rung lands',
       yard.S.seenRows.join(',')),
    ok(state().siteDone?.quarry === 'quarrybench',
       'beside the tick over the station', JSON.stringify(state().siteDone))
  ];
});
