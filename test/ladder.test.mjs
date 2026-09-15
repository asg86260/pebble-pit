// Every upgrade is a ladder with an end, and the row says where it is on it.
//
// What this is checking is the shape rather than the numbers: that a ladder
// stops, that it stops where the game's own floor is rather than at some level
// nobody wrote down, that nothing can be bought past the top, and that a ladder
// is sold in cards whose bill deepens -- dust, then dust and crops, then dust,
// crops and ore -- which is what keeps the rock worth digging for the whole run
// and the grounds worth working. See "Every ladder is sold in bands" in
// DESIGN.md.

import { group, ok, state, yard, openSites, buyBuilt, climb } from './helpers.mjs';

import { LADDER, TIER_BAND, LADDERS } from '../src/config.js';
import { maxed, gainText, UPGRADES } from '../src/upgrades.js';
import { SCRUB_UPGRADES } from '../src/scrubhouse.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';
import { TOWER_UPGRADES } from '../src/tower.js';
import { CASINO_UPGRADES } from '../src/casino.js';

// Every board's rows in one list, for the checks that are about all of them
// rather than about one ladder.
const ALL_ROWS = [...UPGRADES, ...SCRUB_UPGRADES,
                  ...QUARRY_UPGRADES, ...FARM_UPGRADES, ...TOWER_UPGRADES,
                  ...CASINO_UPGRADES];

const row = key => window.__upgrades().find(u => u.key === key);

group('a ladder has an end, and says where you are on it', async () => {
  window.__reset();
  window.__invest();                         // the grounds stand: rungs past three are priced in their coins
  window.__crew(1, 0);
  window.__give(2000000);
  window.__grant({ shards: 40000, spores: 40000, cores: 9, sparks: 4000 });   // every coin: the last rung is the spark's

  const start = state().carryLevel;
  // The whole ladder over three cards, then a card's worth of presses that
  // buy nothing: the ladder is climbed through whichever card is showing, as a
  // player does.
  const got = climb('carry', LADDER + TIER_BAND, buyBuilt);
  const top = state().carryLevel;
  const last = window.__upgrades().find(u => u.key === 'carry');

  return [
    ok(start === 0, 'a new yard starts at the bottom of it', `${start}`),
    ok(top === LADDER, 'and twelve purchases get nine rungs', `${top} of ${LADDER}`),
    ok(got === LADDER, 'because the last few did nothing at all', `${got} bought`),
    ok(maxed(last), 'and the last card knows it is finished')
  ];
});

group('a rate ladder ends exactly on the floor it always had', async () => {
  window.__reset();
  window.__invest();                         // the grounds stand: rungs past three are priced in their coins
  window.__crew(1, 0);
  window.__give(2000000);
  window.__grant({ shards: 40000, spores: 40000, cores: 9, sparks: 4000 });
  // the swing row is not offered until the swinging is automatic, which is the
  // row above it on the same board
  buyBuilt('auto');
  const before = state().mineMs;
  climb('speed', LADDER + 1, buyBuilt);
  const after = state();
  return [
    ok(before > after.mineMs, 'the swing gets faster', `${before}ms -> ${after.mineMs}ms`),
    // The floor was always there. What is new is that the ladder lands on it
    // rather than approaching it for ever and then vanishing off the board.
    ok(after.mineMs === Math.round(1000 / LADDERS.speed.value[LADDER]),
       'and the last rung is the fastest a pick has ever gone',
       `${after.mineMs}ms against a floor of ${Math.round(1000 / LADDERS.speed.value[LADDER])}ms`)
  ];
});

group('the first card is dust alone, and the cards after it add the coins the yard has learned', async () => {
  window.__reset();
  window.__invest();                         // the grounds stand: rungs past three are priced in their coins
  window.__crew(1, 0);
  window.__give(2000000);
  buyBuilt('auto');
  window.__grant({ shards: 5000, spores: 5000, cores: 9, sparks: 500 });
  const bill = key => window.__rows().find(r => r.key === key)?.bill || [];
  const coins = key => bill(key).map(([c]) => c).filter(c => c !== 'time').sort().join();

  const poor = state();
  // Up the first band of the pickaxe in dust alone: the coins stay put.
  climb('pick', TIER_BAND, buyBuilt);
  const afterOne = state();
  const secondCoins = coins('pick');
  // And the second band takes crops with the dust, the third crops and ore.
  climb('pick', TIER_BAND, buyBuilt);
  const afterTwo = state();
  const thirdCoins = coins('pick');
  climb('pick', TIER_BAND, buyBuilt);
  const afterThree = state();
  // ...and the fourth, the spark's, everything the yard makes.
  const fourthCoins = coins('pick');
  climb('pick', TIER_BAND, buyBuilt);
  const afterFour = state();

  return [
    ok(afterOne.pickLevel === poor.pickLevel + TIER_BAND, 'the first card climbs', `${poor.pickLevel} -> ${afterOne.pickLevel}`),
    ok(afterOne.shards === poor.shards && afterOne.spores === poor.spores,
       'in dust alone', `${poor.shards}->${afterOne.shards} blue, ${poor.spores}->${afterOne.spores} green`),
    ok(secondCoins === 'dust,spore', 'and the second band is priced in dust and crops', secondCoins),
    ok(afterTwo.pickLevel === afterOne.pickLevel + TIER_BAND && afterTwo.spores < afterOne.spores && afterTwo.shards === afterOne.shards,
       'and the crops are taken with the dust', `${afterOne.spores}->${afterTwo.spores} green`),
    ok(thirdCoins === 'dust,shard,spore', 'the third in dust, crops and ore', thirdCoins),
    ok(afterThree.pickLevel === afterTwo.pickLevel + TIER_BAND && afterThree.shards < afterTwo.shards,
       'and the ore is taken too', `${afterTwo.shards}->${afterThree.shards} blue`),
    ok(fourthCoins === 'dust,shard,spark,spore', 'the fourth in everything the yard makes', fourthCoins),
    ok(afterFour.pickLevel === afterThree.pickLevel + TIER_BAND && afterFour.sparks < afterThree.sparks,
       'and the spark is taken', `${afterThree.sparks}->${afterFour.sparks} red`)
  ];
});

// What a row says it gives you is a change and the thing that change is measured
// in, and the marks table holds only the four units the yard has a coin for: a
// grain of dust, and dust, stone and crop over a clock. A row naming anything
// else had the failed lookup written on the board -- "better instruments, +25%
// undefined" -- on four rows across three stations, for as long as those rows
// had existed.
//
// The fix is in `gainText` rather than in those four rows: a unit with no mark
// of its own is written out in the words the row already names it by. This is
// the check that says so for every row on every board, including the ones
// nobody has written yet, which is the only thing that lets `UNITS` stay short.
group('no row says a unit the board cannot draw', async () => {
  window.__reset();
  openSites();
  window.__invest();

  const said = [];
  const bad = [];
  for (const u of ALL_ROWS) {
    const text = gainText(u);
    said.push(text);
    // `px` is the game's own name for a grain of dust and is never a word on a
    // board: a row reading "+30% px/s" is a mark that failed to be looked up as
    // surely as "undefined" is.
    if (/undefined|NaN|px/.test(text)) bad.push(`${u.key}: ${text}`);
  }
  const spoke = said.filter(Boolean).length;
  return [
    ok(spoke > 10, 'there are rows saying what they give', `${spoke} of ${said.length}`),
    ok(bad.length === 0, 'and none of them says a unit the board cannot draw',
       bad.join(', ') || 'none')
  ];
});

// A share has no unit. The haulers' pace and boots rows read "+30% grains per
// clock" -- the unit `from` and `to` are measured in, hung off a number that is
// a proportion of them and so has cancelled it out. Asserted over every
// percentage row rather than the two that were noticed, so a rate row written
// tomorrow is covered.
//
// What comes BEFORE the share is a different matter: the verb the share is a
// share of -- "walk +30%" -- which every percentage row now leads with (see
// test/gain-verb.test.mjs). Nothing after the per cent sign is the rule here.
group('a percentage row says the share and nothing after it', async () => {
  window.__reset();
  openSites();
  window.__invest();

  const share = /^(?:[a-z ]+ )?\+-?\d+%$/;
  const rows = ALL_ROWS.filter(u => u.pct && u.from);
  const bad = rows.map(u => [u.key, gainText(u)])
    .filter(([, t]) => t && !share.test(t))
    .map(([k, t]) => `${k}: ${t}`);
  const pace = rows.find(u => u.key === 'haulpace');
  return [
    ok(rows.length >= 4, 'there are percentage rows', String(rows.length)),
    ok(pace && share.test(gainText(pace)),
       'the pace row is a verb and a percentage', pace && gainText(pace)),
    ok(bad.length === 0, 'and so is every other one', bad.join(', ') || 'none')
  ];
});
