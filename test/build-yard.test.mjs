// The build yard: a building is raised by whoever is spare, and by whoever is
// nearest when nobody is. See DESIGN.md, "The build yard".
//
// There was a construction bench here for a while -- a trestle you bought, at
// which builders became a post you hired into, so a build with nobody assigned
// stood fenced and waited. It is gone, and with it the three groups that were
// about hiring: what is left is the behavior the yard has always had and now
// has again, which is the one worth a check of its own.
//
// Bought the way a player buys it: the school through `__buy`, and the setup
// the group is NOT about (crew, coin) through the hooks.

import { group, ok, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';

const rich = () => {
  window.__crew(2, 2);
  window.__grant({ cores: 9, dust: 90000, shards: 900, spores: 900, sparks: 500 });
  // This group wants any building to put up, and the school's gate is the
  // loosest left in the game once a shard has been seen.
  S.farmOpen = true;
};

group('a building rises with nobody assigned to building', async () => {
  rich();
  run(1);
  const bought = window.__buy('unlockschool');
  // The derived gang: a spare body walks over and puts it up, with nobody
  // assigned to anything.
  const landed = runUntil(() => S.schoolOpen, 300);
  return [
    ok(bought, 'the school row answers when it is pressed'),
    ok(landed, 'and the yard raises it with nobody assigned to building'),
    ok(S.builders === 0, 'and the derived gang stands down after it lands',
       `${S.builders}`)
  ];
});
