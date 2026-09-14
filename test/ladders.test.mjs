// The two grounds' four ladders: a yield one and a speed one at each of the
// farm and the quarry, one card apiece, a rung a coin, the last rung the
// spark's.
//
// Bought through the rows, never by setting a level with a hook. What is worth
// checking about a ladder built out of a table is not that the table has four
// lines in it -- that is the source, read back -- but the things the player
// actually meets: that the bill deepens by a coin a rung on the one card, that
// the spark rung is a rung of the same field and worth what the old multiplier
// was, that a rung is a piece of work bodies have to stand and finish, and that
// a rung of the yield ladder changes what one cut or one dig is actually worth
// in the yard.
//
// See DESIGN.md, "What the two grounds sell" and "The spark band is the top of
// the ladder".

import { group, ok, state, run, runUntil, openSites, buyNow, yard } from './helpers.mjs';
import { S } from '../src/state.js';
import { TEND_BASE, TEND_FLOOR, TIER_BAND, TIER_OWN, TIER_RUNGS, LADDER, SPARK_GAIN,
         QUARRY_BASE, QUARRY_FLOOR, DOSES_CARDS } from '../src/config.js';
import { rungOf, rungsOf, capacity, pickCount, haulCap } from '../src/upgrades.js';
import { tendMs, cropYield, FARM_UPGRADES } from '../src/farm.js';
import { cellMs, seamDig, QUARRY_UPGRADES } from '../src/quarry.js';
import { dosesPer } from '../src/apothecary.js';

// A row as its own board reads it. `__rows()` says which key is on a board and
// what it costs, which is what most checks want; where a card sits on its own
// ladder is `rungOf`/`rungsOf`, the same pair the pips under it are drawn from.
const rowOf = key => [...FARM_UPGRADES, ...QUARRY_UPGRADES].find(u => u.key === key);

// Enough of every coin to climb a whole ladder. Rung one is dust, rung two adds
// the ground's own coin, rung three the other ground's and rung four everything
// -- so a check that wants to reach the top has to be able to pay all five.
const rich = () => window.__grant({ dust: 400000, shards: 9000, spores: 40000,
                                    cores: 400, sparks: 9000 });

const coinsOf = key => (window.__rows().find(r => r.key === key)?.bill || [])
                          .map(([m]) => m).filter(m => m !== 'time').sort().join();

group('a ladder is one card, a pip a rung, and the bill deepens as they fill', async () => {
  window.__reset();
  openSites();
  rich();

  const shown = () => window.__rows().filter(r => r.shown && /^crop/.test(r.key)).map(r => r.key);
  const first = shown();
  const row0 = rowOf('crop');
  const c0 = coinsOf('crop');
  const bought = Array.from({ length: TIER_BAND }, () => buyNow('crop'));
  const second = shown();
  const row = rowOf('crop');

  return [
    ok(first.join() === 'crop', 'the ladder is its first key', first.join() || 'none'),
    ok(row0 && rungsOf(row0) === TIER_RUNGS && row0.group === TIER_BAND,
       'with every rung on it, in groups of a band', row0 ? `${rungsOf(row0)} in ${row0.group}s` : 'no row'),
    ok(bought.every(Boolean), 'and its first rung can be bought', bought.join()),
    ok(second.join() === 'crop', 'on the same card', second.join() || 'none'),
    ok(S.cropLevel === TIER_BAND && rungOf(row) === TIER_BAND, 'a band of rungs on the ladder',
       `${S.cropLevel}, ${rungOf(row)} pips`),
    ok(c0 === 'dust' && coinsOf('crop') === 'dust,spore', 'and the bill has deepened by a coin',
       `${c0} -> ${coinsOf('crop')}`)
  ];
});

group('each rung asks for one more coin than the last, on the one card', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  const seen = [];
  for (let band = 0; band < 4; band++) {
    seen.push(coinsOf('seam'));
    for (let i = 0; i < TIER_BAND; i++) buyNow('seam');
  }
  const noCard = !window.__rows().some(r => r.key === 'labseam');
  return [
    ok(seen[0] === 'dust', 'rung one is dust and nothing else', seen[0]),
    ok(seen[1] === 'dust,shard', "rung two adds the cut's own coin", seen[1]),
    ok(seen[2] === 'dust,shard,spore', "rung three adds the farm's", seen[2]),
    ok(seen[3] === 'core,dust,shard,spark,spore',
       'and rung four asks for everything the yard makes', seen[3]),
    ok(noCard && S.seamLevel === TIER_RUNGS, 'all on the one card, to the top',
       `${S.seamLevel} of ${TIER_RUNGS}`)
  ];
});

// The spark rung was the lab's multiplier, a card of its own that climbed
// `S.mult`. It is a rung of the same field now, and it is worth what the whole
// band was: the ladder's top did not come down for the fold.
group('the spark rung climbs the same field and is worth what the multiplier was', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  for (let i = 0; i < TIER_OWN; i++) buyNow('crop');
  const before = cropYield();
  const pressed = buyNow('crop');
  return [
    ok(S.cropLevel === TIER_OWN + 1 && pressed, 'the spark rung is one more of the field', `${S.cropLevel}`),
    ok(cropYield() === Math.round(before * SPARK_GAIN), 'and it multiplies the yield by the old band\'s gain',
       `${before} -> ${cropYield()}`)
  ];
});

// Every rung is a BUILD: paying starts it and bodies at the site finish it. That
// was the lab's whole bargain and it survives at every rung of these.
group('a rung is a build that bodies have to finish', async () => {
  window.__reset();
  openSites();
  window.__invest();
  rich();
  window.__crew(0, 0, 0, 2);                 // two farmhands, to do the work
  run(2);

  const was = S.tendLevel;
  const pressed = window.__buy('tend');
  const started = !!Object.values(state().works || {}).flat()
                          .some(w => w && w.key === 'tend');
  const landedOnPress = S.tendLevel > was;
  const landed = runUntil(() => S.tendLevel > was, 400);

  window.__crew(0, 0);
  return [
    ok(pressed, 'the row can be pressed'),
    ok(started, 'paying starts a piece of work rather than finishing it'),
    ok(!landedOnPress, 'so the rung does not land on the press'),
    ok(landed, 'and the bodies at the plots finish it'),
    ok(S.tendLevel === was + 1, 'one rung', `${S.tendLevel}`)
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
// after the fix, 45 -> 182. Bought through the row, to the top.
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
  // and not the ladder. The stone is read off the quarriers' own tallies of
  // what they brought out: a shard lying in the yard is swept with the rest,
  // and the purse only moves when a hauler gets one to the hole.
  const dug = () => S.quarryTotal || 0;
  const stone = () => S.workers.reduce((n, w) => n + (w.quarried || 0), 0);
  const swept = seconds => { for (let i = 0; i < seconds; i++) { run(1); window.__clearFloor(); } };
  const a0 = dug(), s0 = stone();
  swept(240);
  const slow = dug() - a0, slowStone = stone() - s0;

  for (let i = 0; i < TIER_RUNGS; i++) buyNow('quarrypace');
  const lvl = S.quarryPaceLevel;
  window.__clearFloor();
  run(5);
  const b0 = dug(), t0 = stone();
  swept(240);
  const fast = dug() - b0, fastStone = stone() - t0;

  return [
    ok(lvl === TIER_RUNGS, 'every rung bought through the row', `${lvl}`),
    ok(fast > slow * 1.8, 'and the cut comes out a good deal faster for them',
       `${slow} -> ${fast} cells in four minutes`),
    ok(fastStone > slowStone, 'and so gives up more shards',
       `${slowStone} -> ${fastStone} in four minutes`)
  ];
});

// A shorter ladder is the same climb in fewer steps, not a slower yard. Both
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
    ok(tendTop === TEND_FLOOR, 'tending lands on its floor before the spark rung',
       `${tendTop} vs ${TEND_FLOOR}`),
    ok(tendMs(0) === TEND_BASE, 'and starts from the same base', `${tendMs(0)}`),
    // The cut's swing and the cut's row climb one curve. The swing used to run
    // its own (five rungs of a fifth off, 0.371 at the top) while the row
    // claimed the trip curve's fifth -- and neither reached the ground, because
    // the swing sat on its floor from rung nought (critics 2026-09-10, A4).
    ok(Math.abs(cellTop / cell0 - QUARRY_FLOOR / QUARRY_BASE) < 1e-9,
       'and a cell of the cut ends at the same fifth the row sells',
       `${(cellTop / cell0).toFixed(6)} vs ${(QUARRY_FLOOR / QUARRY_BASE).toFixed(6)}`),
    ok(TIER_RUNGS === TIER_BAND * 4 && TIER_OWN === TIER_RUNGS - TIER_BAND, "four rungs, the last of them the spark's",
       `${TIER_RUNGS}/${TIER_OWN}`)
  ];
});

// No ladder's top came down when a band became a rung. These are the figures
// the count ladders reached at six rungs, written as numbers on purpose: a
// unit is one constant, and a change to one is a change to this line.
group("no ladder's top came down with the band", async () => {
  window.__reset();
  openSites();
  const at = (field, lvl, read) => { const was = S[field]; S[field] = lvl; const v = read(); S[field] = was; return v; };
  const carryTop = at('carryLevel', LADDER, capacity);
  const cropOwn = at('cropLevel', TIER_OWN, cropYield);
  const cropTop = at('cropLevel', TIER_RUNGS, cropYield);
  const dig0 = at('seamLevel', 0, seamDig), digOwn = at('seamLevel', TIER_OWN, seamDig);
  return [
    ok(carryTop === 7, 'what you carry tops at seven pixels', `${carryTop}`),
    ok(pickCount(LADDER) === 7, 'and so does your pick', `${pickCount(LADDER)}`),
    ok(haulCap(LADDER) === 13, 'a hauler carries thirteen at the top', `${haulCap(LADDER)}`),
    ok(cropOwn === 7 && cropTop === 11, 'a cut is seven spores before the spark rung and eleven after',
       `${cropOwn}, ${cropTop}`),
    ok(Math.abs(digOwn / dig0 - 2.5) < 0.05, 'a dig is two and a half times its base before the spark rung',
       `${(digOwn / dig0).toFixed(2)}`),
    ok(dosesPer(DOSES_CARDS * TIER_BAND) === 5, 'and a batch tops at five doses', `${dosesPer(DOSES_CARDS * TIER_BAND)}`)
  ];
});

// A save from when the last band was a multiplier: `S.mult.tend` held a rung
// or two of the lab's quarter-again over a finished ladder. It reads as the
// spark rung bought -- a rung the old ladder had is a rung the new one has --
// and a `lab*` piece still in flight lands the same way, since the sparks
// were paid and there is no row left to finish it.
group('an old save with a multiplier reads as the spark rung bought', async () => {
  window.__reset();
  openSites();
  S.tendLevel = TIER_OWN;
  S.mult.tend = 2;
  S.dirty = true;
  window.__cold();
  const tend = S.tendLevel, mult = S.mult.tend;

  // ...and one written mid-research, by hand, since nothing writes one now.
  S.dirty = true;
  yard.persist();
  const raw = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  raw.cropLevel = TIER_OWN;
  raw.works = { ...(raw.works || {}), farm: [{ key: 'labcrop', done: 3, of: 60, at: null }] };
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(raw));
  yard.restore();
  return [
    ok(tend === TIER_RUNGS, 'the field goes to the top', `${tend}`),
    ok(mult === 0, 'and the multiplier is folded away', `${mult}`),
    ok(S.cropLevel === TIER_RUNGS, 'a piece of research in flight lands as the spark rung', `${S.cropLevel}`),
    ok(!Object.values(S.works).flat().some(w => w && w.key === 'labcrop'), 'and is not left on the bench')
  ];
});

