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
import { maxed } from '../src/upgrades.js';
import { LADDER } from '../src/config.js';

const shown = key => !!window.__rows().find(r => r.key === key && r.shown);
// Sparks too: the research card is priced in them, and a card is off the board
// until every coin on its bill has a source (see coinsOpen in upgrades/price.js).
const rich = () => window.__grant({ dust: 900000, shards: 9000, spores: 9000, cores: 90, sparks: 900 });

group('a ladder is one card that fills, and says done at the top', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  window.__crew(1, 0);

  const before = shown('haulpace');
  const bought = climb('haulpace', LADDER);
  const row = window.__upgrades().find(u => u.key === 'haulpace');
  const still = shown('haulpace');
  window.__crew(0, 0);

  return [
    ok(before, 'the card is on the board to begin with'),
    ok(bought === LADDER, 'the speed ladder can be climbed on it', `${bought}`),
    ok(S.haulPaceLevel === LADDER, 'to the top', `${S.haulPaceLevel}`),
    ok(still && row && maxed(row), 'and at the top the same card stands, finished')
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

// A card never asks for a coin the yard has no source for. Rung four of any
// ladder is priced in crops and rung seven in ore, so a yard with no plots
// stops after three rungs, and a yard with plots and no quarry after six.
//
// The card *stays* while it waits. The ladder is one card with every rung on
// it, and when this gate took the card off the board it took the three rungs
// you had just bought with it -- a ladder that vanished the moment its first
// band was done, which the player read as the board losing purchases. So the
// card stands, says what it is waiting on where the price was, and sells
// nothing until the ground is broken -- with the coin in the purse, since the
// point is the source and not the balance. See coinNeeds in upgrades/price.js.
group("a card waits, still on the board, while its bill names a coin the yard cannot get", async () => {
  window.__reset();
  window.__crew(1, 0);
  window.__grant({ dust: 900000, shards: 9000, spores: 9000 });
  const says = () => window.__rows().find(r => r.key === "haulcarry")?.waits;

  const first = climb("haulcarry", 9);
  const noPlots = shown("haulcarry"), saidPlots = says();
  const pressed = climb("haulcarry", 1);
  S.farmOpen = true;
  const withPlots = shown("haulcarry"), saidNothing = says();
  const second = climb("haulcarry", 9);
  const noQuarry = shown("haulcarry"), saidQuarry = says();
  S.quarryOpen = true;
  const withQuarry = shown("haulcarry");
  const third = climb("haulcarry", 9);
  window.__crew(0, 0);

  return [
    ok(first === 3 && noPlots && saidPlots === "needs plots",
       "three rungs in dust, then the card stays and says it needs plots", first + " rungs, shown " + noPlots + ", says " + saidPlots),
    ok(pressed === 0, "and a press with crops in the purse buys nothing", pressed + " bought"),
    ok(withPlots && saidNothing === "" && second === 3 && noQuarry && saidQuarry === "needs a quarry",
       "three more in crops, then it says it needs a quarry", second + " rungs, says " + saidQuarry),
    ok(withQuarry && third === 3, "and the last three once the quarry stands", third + " rungs")
  ];
});
