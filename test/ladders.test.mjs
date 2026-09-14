// The two grounds' four ladders: a yield one and a speed one at each of the
// farm and the quarry, twelve rungs apiece in four cards of three.
//
// Bought through the rows, never by setting a level with a hook. What is worth
// checking about a ladder built out of a table is not that the table has four
// lines in it -- that is the source, read back -- but the three things the
// player actually meets: that finishing a band retires its card and shows the
// next one, that the top band is a piece of work bodies have to stand and
// finish, and that a rung of the yield ladder changes what one cut or one dig is
// actually worth in the yard.
//
// See DESIGN.md, "What the two grounds sell".

import { group, ok, state, run, runUntil, openSites, buyNow } from './helpers.mjs';
import { S } from '../src/state.js';
import { TEND_BASE, TEND_FLOOR, TIER_BAND, TIER_OWN, TIER_RUNGS, RUNGS,
         QUARRY_BASE, QUARRY_FLOOR } from '../src/config.js';
import { rungOf, rungsOf } from '../src/upgrades.js';
import { tendMs, cropYield, FARM_UPGRADES } from '../src/farm.js';
import { cellMs, seamDig, QUARRY_UPGRADES } from '../src/quarry.js';

// A row as its own board reads it. `__rows()` says which key is on a board and
// what it costs, which is what most checks want; where a card sits on its own
// ladder is `rungOf`/`rungsOf`, the same pair the pips under it are drawn from.
const rowOf = key => [...FARM_UPGRADES, ...QUARRY_UPGRADES].find(u => u.key === key);

// Enough of every coin to climb a whole ladder. Band one is dust, band two adds
// the ground's own coin, band three the other ground's and band four everything
// -- so a check that wants to reach the top has to be able to pay all five.
const rich = () => window.__grant({ dust: 400000, shards: 9000, spores: 40000,
                                    cores: 400, sparks: 9000 });

// Which of a ladder's four cards is on the board. Exactly one of them ever is,
// which is the whole of what a band buys over a twelve-pip row.
const showing = keys => window.__rows().filter(r => keys.includes(r.key) && r.shown)
                              .map(r => r.key);

group('a ladder is one card, its pips in threes, and the bill deepens as they fill', async () => {
  window.__reset();
  openSites();
  rich();
  const cards = ['crop', 'crop2', 'crop3', 'labcrop'];

  const first = showing(cards);
  const row0 = rowOf('crop');
  const coins = () => rowOf('crop').bill().map(([m]) => m).filter(m => m !== 'time').sort().join();
  const c0 = coins();
  const bought = Array.from({ length: TIER_BAND }, () => buyNow('crop'));
  const second = showing(cards);
  const row = rowOf('crop');

  return [
    ok(first.join() === 'crop', 'the ladder is its first key', first.join() || 'none'),
    ok(row0 && rungsOf(row0) === TIER_OWN && row0.group === TIER_BAND,
       'with its pips in groups of a band', row0 ? `${rungsOf(row0)} in ${row0.group}s` : 'no row'),
    ok(bought.every(Boolean), 'and its first card can be bought', bought.join()),
    ok(second.join() === 'crop', 'on the same card', second.join() || 'none'),
    ok(S.cropLevel === TIER_BAND && rungOf(row) === TIER_BAND, 'a card of rungs on the ladder',
       `${S.cropLevel}, ${rungOf(row)} pips`),
    ok(c0 === 'dust' && coins() === 'dust,spore', 'and the bill has deepened by a coin',
       `${c0} -> ${coins()}`)
  ];
});

group('each band asks for one more coin than the last', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  const coins = key => window.__rows().filter(r => r.key === key)[0]
                             ?.bill.map(([m]) => m).filter(m => m !== 'time') ?? [];
  const seen = [];
  // One card for the ladder's own nine rungs, its bill deepening every three;
  // then the research card.
  for (let band = 0; band < 3; band++) {
    seen.push(coins('seam'));
    for (let i = 0; i < TIER_BAND; i++) buyNow('seam');
  }
  seen.push(coins('labseam'));
  return [
    ok(seen[0].join() === 'dust', 'band one is dust and nothing else', seen[0].join()),
    ok(seen[1].sort().join() === 'dust,shard', "band two adds the cut's own coin",
       seen[1].join()),
    ok(seen[2].sort().join() === 'dust,shard,spore', "band three adds the farm's",
       seen[2].join()),
    ok(seen[3].sort().join() === 'core,dust,shard,spark,spore',
       'and band four asks for everything the yard makes', seen[3].join())
  ];
});

// The last three rungs are the multiplier over the ladder, which is a BUILD:
// paying starts it and bodies at the site finish it. That was the lab's whole
// bargain and it survives at the top of every one of these.
group('the last band is a build that bodies have to finish', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  window.__crew(0, 0, 0, 2);                 // two farmhands, to do the work
  run(2);

  // Nine rungs of the ladder's own field first -- through the rows, band gates
  // and all -- so band four is the card on the board.
  for (let i = 0; i < TIER_OWN; i++) buyNow('tend');
  const card = showing(['tend', 'tend2', 'tend3', 'labtend']);

  const was = S.mult.tend;
  const pressed = window.__buy('labtend');
  const started = !!Object.values(state().works || {}).flat()
                          .some(w => w && w.key === 'labtend');
  const landedOnPress = S.mult.tend > was;
  const landed = runUntil(() => S.mult.tend > was, 400);

  window.__crew(0, 0);
  return [
    ok(S.tendLevel === TIER_OWN, 'nine rungs of its own field first', `${S.tendLevel}`),
    ok(card.join() === 'tend,labtend', 'and the research card stands beside the finished ladder',
       card.join() || 'none'),
    ok(pressed, 'the row can be pressed'),
    ok(started, 'paying starts a piece of work rather than finishing it'),
    ok(!landedOnPress, 'so the multiplier does not move on the press'),
    ok(landed, 'and the bodies at the plots finish it'),
    ok(S.mult.tend === 1, 'one rung of the multiplier', `${S.mult.tend}`)
  ];
});

// The whole point of a yield ladder: a rung has to change what one go is worth,
// in the yard rather than on the board. Both grounds, bought through the row.
group('a yield rung changes what one go is worth', async () => {
  window.__reset();
  openSites();
  rich();
  const cut0 = cropYield();
  const dig0 = seamDig();
  buyNow('crop');
  buyNow('seam');
  return [
    ok(cropYield() > cut0, 'a cut off a plot is worth more spores',
       `${cut0} -> ${cropYield()}`),
    ok(seamDig() > dig0, 'and a dig turns up more shards', `${dig0} -> ${seamDig()}`)
  ];
});

// And a speed rung changes how many shards come out of the cut. It did not:
// the ladder shortened a swing that was already on its floor, and the time a
// dig takes is nine tenths walking between cells, which the ladder never
// touched. Pace 0 and pace 9 dug the same 45 shards in ten minutes. Measured
// after the fix, 45 -> 182. Bought through the row, a band at a time.
group('a speed rung makes the cut give up shards faster', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  rich();
  window.__crew(0, 6, 3);
  window.__clearFloor();
  run(5);
  // Measured in ground, with the heap swept clear as it goes. The stone is a
  // figure per dig, so the ground rate is the stone rate and the ground is
  // what the ladder is about; and the gang stands down at a full heap, which
  // a fast gang at a rich seam reaches inside this window -- haulers fetch
  // finds one at a time -- so left to fill it is the carting being measured
  // and not the ladder.
  const dug = () => S.quarryTotal || 0;
  const stone = () => state().shards + state().finds.filter(f => f === 'shard').length;
  const swept = seconds => { for (let i = 0; i < seconds; i++) { run(1); window.__clearFloor(); } };
  const a0 = dug(), s0 = stone();
  swept(240);
  const slow = dug() - a0, slowStone = stone() - s0;

  for (let i = 0; i < 6; i++) buyNow(showing(['quarrypace', 'quarrypace2'])[0]);
  const lvl = S.quarryPaceLevel;
  window.__clearFloor();
  run(5);
  const b0 = dug(), t0 = stone();
  swept(240);
  const fast = dug() - b0, fastStone = stone() - t0;

  return [
    ok(lvl === 6, 'six rungs bought through the rows', `${lvl}`),
    ok(fast > slow * 1.8, 'and the cut comes out a good deal faster for them',
       `${slow} -> ${fast} cells in four minutes`),
    ok(fastStone > slowStone, 'and so gives up more shards',
       `${slowStone} -> ${fastStone} in four minutes`)
  ];
});

// A twelve-rung ladder is the same climb in finer steps, not a faster yard. Both
// speeds must still end exactly where they ended when the ladder was five rungs
// and the multiplier sat beside it.
group('the speed ladders end where they always ended', async () => {
  window.__reset();
  openSites();
  const tendTop = tendMs(TIER_OWN);
  const cellAt = lvl => { S.quarryPaceLevel = lvl; return cellMs(); };
  const cell0 = cellAt(0);
  const cellTop = cellAt(TIER_OWN);
  S.quarryPaceLevel = 0;
  return [
    ok(tendTop === TEND_FLOOR, 'tending lands on its floor at the ladder top',
       `${tendTop} vs ${TEND_FLOOR}`),
    ok(tendMs(0) === TEND_BASE, 'and starts from the same base', `${tendMs(0)}`),
    // The cut's swing and the cut's row climb one curve. The swing used to run
    // its own (five rungs of a fifth off, 0.371 at the top) while the row
    // claimed the trip curve's fifth -- and neither reached the ground, because
    // the swing sat on its floor from rung nought (critics 2026-09-10, A4).
    ok(Math.abs(cellTop / cell0 - QUARRY_FLOOR / QUARRY_BASE) < 1e-9,
       'and a cell of the cut ends at the same fifth the row sells',
       `${(cellTop / cell0).toFixed(6)} vs ${(QUARRY_FLOOR / QUARRY_BASE).toFixed(6)}`),
    ok(TIER_RUNGS === TIER_BAND * 4 && TIER_OWN === TIER_RUNGS - TIER_BAND, 'four cards, the last of them the multiplier',
       `${TIER_RUNGS}/${TIER_OWN}`)
  ];
});

// A save is the reason `levelOf` clamps where it is read rather than where it is
// bought. `S.mult.tend` went to five when the farm's multiplier was its own
// five-rung row; the band it lives in now has three, and an old save has to read
// as a ladder somebody finished rather than as a rate nothing else agrees with.
group('an old save with more of a multiplier than the band holds reads as finished', async () => {
  window.__reset();
  openSites();
  S.mult.tend = 5;
  S.tendLevel = TIER_OWN;
  const row = rowOf('labtend');
  const quick = tendMs();
  S.mult.tend = TIER_BAND;
  const capped = tendMs();
  return [
    ok(row && rungOf(row) === TIER_BAND, 'the card reads three of three',
       row ? `${rungOf(row)} of ${rungsOf(row)}` : 'no row'),
    ok(quick === capped, 'and the rate is the one the cap allows, not the save\'s',
       `${quick} vs ${capped}`)
  ];
});

// The two new level fields, and the two new multipliers under `S.mult`, have to
// come back off a save. `persist-roundtrip.test.mjs` covers every plain field on
// the list; this says the same thing about these four in particular, because
// they are the ones a player would notice going missing.
group('the new levels and multipliers survive a reload', async () => {
  window.__reset();
  openSites();
  S.cropLevel = 4;
  S.seamLevel = 7;
  S.mult.crop = 2;
  S.mult.seam = 1;
  S.dirty = true;
  window.__cold();
  return [
    ok(S.cropLevel === 4, 'the crop level comes back', `${S.cropLevel}`),
    ok(S.seamLevel === 7, 'and the seam level', `${S.seamLevel}`),
    ok(S.mult.crop === 2, "and the crop's multiplier", `${S.mult.crop}`),
    ok(S.mult.seam === 1, "and the seam's", `${S.mult.seam}`)
  ];
});
