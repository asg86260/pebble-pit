// The lab's own two upgrades: a bench that works faster, and a second bench.
//
// It was the one building in the yard with no ladder of its own -- every piece
// of research took exactly as long as the first however far into a run you were,
// and the lab is what stands between you and every other multiplier in the game.

import { yard, group, ok, state, run, runUntil, openSites, buyBuilt } from './helpers.mjs';

group('the lab can be made quicker at what it does', async () => {
  window.__reset();
  openSites();
  window.__lab(true);
  window.__crew(0, 2);
  window.__grant({ shards: 400, spores: 400, cores: 9, dust: 30000 });
  run(2);

  const at = () => state().research && state().research.at;
  const runFor = () => {
    window.__research(null);
    // Somebody in the lab BEFORE the piece is started. A lab standing empty is
    // lent a hand by the yard now (see `busyBuilderSites`), and a lent hand
    // would see the piece through before this could measure the pace of the
    // body it is about.
    window.__assign('labbers', 1);
    runUntil(() => state().labbers === 1, 60);
    // Started, not seen through: what is being measured is how fast the piece
    // moves, so it has to still be moving.
    window.__buy('labswing');
    runUntil(() => state().commuting.length === 0, 60);
    const before = at() || 0;
    run(6);
    return (at() || 1) - before;
  };
  const slow = runFor();
  // Built, not just paid for: the lab's own ladder is fitted at the lab now,
  // which is a piece of work at a bench like everything else it does.
  window.__research(null);
  const bought = buyBuilt('labkit');
  const fast = runFor();

  window.__crew(0, 0);
  return [
    ok(bought, 'the lab sells better instruments'),
    ok(slow > 0, 'and research moves without them', `${slow.toFixed(3)} in six seconds`),
    ok(fast > slow * 1.1, 'and moves quicker with them',
       `${slow.toFixed(3)} -> ${fast.toFixed(3)}`)
  ];
});

// One body to a bench, and a second bench is a second *thing being looked into*
// -- not two people leaning over one, which is a queue and is what capOf has
// always refused.
group('a second bench is a second thing looked into', async () => {
  window.__reset();
  openSites();
  window.__lab(true);
  window.__crew(0, 3);
  window.__grant({ shards: 400, spores: 400, cores: 99, dust: 30000 });
  run(2);

  // A bench has to be built before it is a bench. It is a `place` at the lab
  // now -- eighteen worker-seconds like a bench in the cut or a furrow on the
  // farm -- so it wants somebody in the room and the room's one bench free,
  // which is the whole of what a second bench costs: the lab stops looking into
  // anything while it is being fitted.
  window.__assign('labbers', 1);
  runUntil(() => state().labbers === 1, 60);
  const bought = buyBuilt('labroom');

  // Started, not finished: what this group is about is two pieces being ON the
  // benches at once, so neither is seen through.
  window.__buy('labswing');
  const first = state();
  // and now there is room for a second, where a moment ago there was not
  window.__assign('labbers', 1);
  window.__buy('labhaul');
  runUntil(() => state().labbers === 2, 60);
  const two = state();

  window.__crew(0, 0);
  return [
    ok(!!first.research, 'one piece goes on the bench', JSON.stringify(first.research && first.research.key)),
    ok(bought, 'the lab sells a second bench, and it is built rather than had'),
    ok(!!two.research2, 'and a second piece has somewhere to go once it is',
       JSON.stringify(two.research2 && two.research2.key)),
    // Read once both bodies are in. A piece can finish while the second walks
    // over, which slides the other up and leaves one on the go -- true, and not
    // what this group is about -- so the pieces are counted off what the lab is
    // *holding* rather than off the two slots at one instant.
    ok(two.labRooms === 2 && two.labbers === 2,
       'and then two pieces can be looked into at once',
       `${two.labRooms} benches, ${two.labbers} in`),
    ok(!!two.research, 'with work on the bench', `${two.research && two.research.key}`)
  ];
});
