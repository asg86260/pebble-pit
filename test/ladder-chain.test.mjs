// A ladder sold in more than one row shows one row at a time.
//
// Pace and boots are two rows over one number -- how fast a hauler walks -- and
// side by side they read as the same upgrade for sale twice. The rule is general
// (`chained` in upgrades.js): a row that continues another stays off the board
// until that row's ladder is finished, and then stands where it stood. Bought
// through the rows, never by setting a level with a hook, because what is worth
// checking is what the player meets: the second row is not there, five rungs
// are bought, and now it is.

import { group, ok, openSites, climb } from './helpers.mjs';
import { S } from '../src/state.js';
import { LADDER } from '../src/config.js';

const shown = key => !!window.__rows().find(r => r.key === key && r.shown);
const rich = () => window.__grant({ dust: 900000, shards: 9000, spores: 9000, cores: 90 });

group('boots are not for sale until the pace ladder is finished', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  S.seenShard = true;                // the coin boots ask for has been seen
  window.__crew(1, 0);

  const before = shown('boots');
  // Nine rungs over three cards, bought through whichever card is showing.
  const bought = climb('haulpace', LADDER);
  const after = shown('boots');
  window.__crew(0, 0);

  return [
    ok(!before, 'with pace unbought, boots are not on the board'),
    ok(bought === LADDER, 'the pace ladder can be climbed through its cards', `${bought}`),
    ok(S.haulPaceLevel === LADDER, 'to the top', `${S.haulPaceLevel}`),
    ok(after, 'and only then are boots for sale'),
    ok(!shown('haulpace') && !shown('haulpace2'), 'in the place the finished pace cards folded away from')
  ];
});

group('every tier of one ladder waits on the one before it', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  S.seenShard = true;
  window.__crew(1, 0);

  const harness0 = shown('harness'), mult0 = shown('labhaul'), swing0 = shown('labswing');
  climb('haulcarry', LADDER);
  const harness1 = shown('harness');
  climb('haulpace', LADDER);
  climb('boots', LADDER);
  const mult1 = shown('labhaul');
  climb('rockhandspeed', LADDER);
  const swing1 = shown('labswing');
  window.__crew(0, 0);

  return [
    ok(!harness0 && harness1, 'the harness follows the load ladder',
       `${harness0} -> ${harness1}`),
    ok(!mult0 && mult1, 'the pace multiplier follows the boots',
       `${mult0} -> ${mult1}`),
    ok(!swing0 && swing1, "the swing multiplier follows the rockhands' swing",
       `${swing0} -> ${swing1}`)
  ];
});
