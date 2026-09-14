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
import { LADDER, TIER_OWN, TIER_BAND } from '../src/config.js';

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

// The spark rung is the last rung of the same card, not a card of its own: the
// bill deepens to everything the yard makes and the same field climbs. It was
// `labtend`, a research card that appeared beside the finished ladder.
group("a ground ladder's spark rung is the top of the one card", async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  window.__crew(1, 0);

  const bill = () => (window.__rows().find(r => r.key === 'tend')?.bill || []).map(b => b[0]).filter(m => m !== 'time').join();
  const own = climb('tend', TIER_OWN);
  const asks = bill();
  const noCard = !window.__rows().some(r => r.key === 'labtend');
  const last = climb('tend', TIER_BAND);
  window.__crew(0, 0);

  return [
    ok(own === TIER_OWN, 'the rungs before the spark one climb', `${own}`),
    ok(asks === 'dust,shard,spore,core,spark', 'then the same card asks every coin the yard makes', asks),
    ok(noCard, 'and no research card stands beside it'),
    ok(last === TIER_BAND && S.tendLevel === TIER_OWN + TIER_BAND,
       'and the spark rung climbs the same field', `${last}, ${S.tendLevel}`)
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

  const first = climb("haulcarry", LADDER);
  const noPlots = shown("haulcarry"), saidPlots = says();
  const pressed = climb("haulcarry", 1);
  S.farmOpen = true;
  const withPlots = shown("haulcarry"), saidNothing = says();
  const second = climb("haulcarry", LADDER);
  const noQuarry = shown("haulcarry"), saidQuarry = says();
  S.quarryOpen = true;
  const withQuarry = shown("haulcarry");
  const third = climb("haulcarry", LADDER);
  window.__crew(0, 0);

  return [
    ok(first === TIER_BAND && noPlots && saidPlots === "needs plots",
       "a card in dust, then the card stays and says it needs plots", first + " rungs, shown " + noPlots + ", says " + saidPlots),
    ok(pressed === 0, "and a press with crops in the purse buys nothing", pressed + " bought"),
    ok(withPlots && saidNothing === "" && second === TIER_BAND && noQuarry && saidQuarry === "needs a quarry",
       "a card more in crops, then it says it needs a quarry", second + " rungs, says " + saidQuarry),
    ok(withQuarry && third === TIER_BAND, "and the last card once the quarry stands", third + " rungs")
  ];
});
