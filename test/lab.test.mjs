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
    window.__buy('labswing');
    window.__assign('labbers', 1);
    runUntil(() => state().labbers === 1, 60);
    runUntil(() => state().commuting.length === 0, 60);
    const before = at() || 0;
    run(6);
    return (at() || 1) - before;
  };
  const slow = runFor();
  // Fitted rather than had: the body already at the bench puts them in, between
  // pieces of research. See works.js.
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

  const one = state();
  const roomBefore = one.roster ? null : null;
  window.__buy('labswing');
  const first = state();
  window.__buy('labhaul');                    // no room for it yet
  const stillOne = state();

  // A bench is built before it can be worked at, and the lab builds its own --
  // so somebody has to be in there first. See works.js.
  window.__assign('labbers', 1);
  runUntil(() => state().labbers === 1, 60);
  const bought = buyBuilt('labroom');
  // A bench and a body for it: the lab holds one to a bench and neither is
  // handed out on its own.
  window.__assign('labbers', 1);
  window.__assign('labbers', 1);
  // Two pieces started back to back and read before either can finish. Left to
  // run, the first one comes off the bench and slides the second up, and what
  // you are looking at is one piece again -- which is true and is not what this
  // group is about.
  window.__buy('labhaul');
  runUntil(() => state().labbers === 2, 60);
  const two = state();

  window.__crew(0, 0);
  return [
    ok(!!first.research, 'one piece goes on the bench', JSON.stringify(first.research && first.research.key)),
    ok(!stillOne.research2, 'and a second has nowhere to go with one bench'),
    ok(bought, 'the lab sells a second bench'),
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
