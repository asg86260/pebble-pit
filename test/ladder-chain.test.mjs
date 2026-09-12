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

group('the cards of one ladder follow one another, and the finished ones fold away', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  window.__crew(1, 0);

  const before = [shown('haulpace'), shown('haulpace2'), shown('haulpace3')];
  // Nine rungs over three cards, bought through whichever card is showing.
  const bought = climb('haulpace', LADDER);
  const after = [shown('haulpace'), shown('haulpace2'), shown('haulpace3')];
  window.__crew(0, 0);

  return [
    ok(before.join() === 'true,false,false', 'only the first card is on the board to begin with', before.join()),
    ok(bought === LADDER, 'the speed ladder can be climbed through its cards', `${bought}`),
    ok(S.haulPaceLevel === LADDER, 'to the top', `${S.haulPaceLevel}`),
    ok(after.join() === 'false,false,true', 'and at the top only the last card stands, saying done', after.join())
  ];
});

group('the fourth card of a ground ladder waits on the three before it', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  window.__crew(1, 0);

  const mult0 = shown('labtend');
  climb('tend', 9);
  const mult1 = shown('labtend');
  window.__crew(0, 0);

  return [
    ok(!mult0 && mult1, "the plots' multiplier follows the tending ladder",
       `${mult0} -> ${mult1}`)
  ];
});
