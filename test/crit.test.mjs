// Crits: one rule at every station. A unit of work that counts for several --
// adding output where the job is unbounded, and pulling owed work forward where
// it is bounded so the total never moves. And the tell that a crit happened is
// real dust: a fountain that banks like any other grain, never a drawn ring.
//
// Deterministic throughout: the roll is forced with `__crit` (true always, false
// never), and where a real roll is measured the levels are pinned and the run is
// long, so the number is the mechanic rather than the seed.

import { group, ok, state, run, haveRock, openSites, buyBuilt, climb, P, WORKER } from './helpers.mjs';
import { S, floor } from '../src/state.js';
import { findShards, seamShards } from '../src/quarry.js';
import { critMult, critChance, critEV } from '../src/crit.js';
import { TIER_BAND } from '../src/config.js';

// The dust in the world that a crit's fountain ends up as: what is banked on the
// floor, what is down the hole, and what is still in the air. A crit throws real
// grains, so the count has to come out where the pixels went in.
const dustAbout = () =>
  (floor.n || 0) + state().stored + S.chips.length;

// --- 1. the bounded job: a dig never adds -------------------------------------
//
// The whole point of crits being allowed at the cut: a dig is worth
// `seamShards()`, and a crit -- which takes more ground, and so more of the
// cells the stone is scattered through -- turns it up sooner and yields not a
// shard more. `findShards` is the one place the dig turns stone up, and it is
// driven directly here -- one seam, swung out with every swing critting --
// because the invariant is about the accounting and nothing else.
group('a dig with crits forced on yields exactly the seam, never a shard more', async () => {
  openSites();
  window.__crit(true);                       // every swing a crit

  const digOut = owed => {
    S.quarryOwed = owed;
    const w = { x: state().quarryX + state().quarryW / 2, y: S.groundY + 120, quarried: 0 };
    // `left` is the scatter denominator, counted down to the certain last cell.
    // It cannot change the total -- owed only ever comes down -- but it is fed
    // the way a real dig feeds it so the drive is honest.
    let left = Math.max(owed, 64), guard = 0;
    while (S.quarryOwed > 0 && guard++ < 100000) { findShards(w, left); if (left > 1) left--; }
    return w.quarried;
  };

  const seam = seamShards();
  const gotSeam = digOut(seam);              // a full dig, sized to the real seam
  const gotFat = digOut(47);                 // and a fat one, so the cap is exercised hard

  window.__crit(null);
  return [
    ok(gotSeam === seam, 'the crit dig yields exactly seamShards()', `${gotSeam} vs ${seam}`),
    ok(S.quarryOwed === 0, 'and the seam owes nothing after', `${S.quarryOwed}`),
    ok(gotFat === 47, 'a fat seam comes out whole, not overshot', `${gotFat} vs 47`),
  ];
});

// ...and a crit at the cut takes GROUND, not stone. Pulling the seam's shards
// forward changed nothing about when a dig finished, so a crit rung bought at
// the quarry was worth nothing a minute (critics 2026-09-10, B6): a crit swing
// takes the cell and its neighbors now, and a gang whose every swing crits
// gets through a dig -- and so through a seam -- sooner. Measured in ground,
// because the stone over a window this short is mostly which dig the window
// cut off where: 1436 -> 2023 cells in five minutes, with a quarter kept clear
// of the noise. (Counted in stone, this check used to pass on the front-loading
// it was blind to -- a crit pulling whole shards forward paid the truncated
// last dig out early, and the players saw the ore come up only out of the top
// of the cut. See `findShards`.)
group('a crit at the cut takes more ground out at once, so the digs come sooner', async () => {
  const dug = force => {
    window.__reset();
    openSites();
    window.__fullSites();
    window.__crew(0, 6, 3);
    window.__clearFloor();
    window.__crit(force);
    run(5);
    const a = state().shards + state().finds.filter(f => f === 'shard').length;
    const ca = S.quarryTotal || 0;
    run(300);
    return { stone: state().shards + state().finds.filter(f => f === 'shard').length - a,
             cells: (S.quarryTotal || 0) - ca };
  };
  const plain = dug(false);
  const critted = dug(true);
  window.__crit(false);
  return [
    ok(plain.stone > 0, 'the cut gives up stone with crits off', `${plain.stone} in five minutes`),
    ok(critted.cells > plain.cells * 1.25, 'and a gang critting every swing takes a good deal more ground',
       `${plain.cells} -> ${critted.cells} cells in five minutes`),
    ok(critted.stone > plain.stone, 'and so turns up more stone',
       `${plain.stone} -> ${critted.stone} in five minutes`)
  ];
});

// --- 2. the unbounded job: your swing at the rock ADDS -------------------------
//
// The rock is bottomless, so a crit is worth `mult` pixels where an ordinary
// swing is worth one. Measured two ways: forced on against forced off, which is
// the multiplier laid bare; and a long real-rolled run at known rungs against
// the expected 1 + chance*(mult - 1).
group('a crit at the rock adds: one swing worth several pixels', async () => {
  haveRock();
  window.__levels({ pickLevel: 0 });         // an ordinary swing is worth one pixel

  // Average pixels a swing takes, over `n` swings the rock always had stone for.
  const per = (force, n) => {
    window.__crit(force);
    let total = 0, got = 0;
    for (let i = 0; i < n * 4 && got < n; i++) {
      if (state().rock < 120) { window.__next(); haveRock(); continue; }
      const took = window.__swing(1);
      if (took > 0) { total += took; got++; }
    }
    return got ? total / got : 0;
  };

  const off = per(false, 200);
  const on = per(true, 200);

  // A long real-rolled run at the top of both ladders: chance 25%, mult 6x.
  window.__levels({ critChanceLevel: 5, critMultLevel: 5 });
  const ev = per(null, 800);
  window.__crit(null);

  const m = critMult(0);                      // 3, at level 0, which the forced run used
  const want = critEV();                      // 1 + 0.25*(6 - 1) = 2.25
  return [
    ok(Math.abs(off - 1) < 0.05, 'an ordinary swing takes one pixel', `${off.toFixed(3)}`),
    ok(Math.abs(on - m) < 0.25, `a forced crit takes ${m}x`, `${on.toFixed(3)} vs ${m}`),
    ok(Math.abs(ev - want) < 0.35, 'a real run lands near the expected value',
       `${ev.toFixed(3)} vs ${want.toFixed(3)} (chance ${critChance().toFixed(2)}, mult ${critMult()})`),
  ];
});

// --- 3. the tell is real dust ---------------------------------------------------
//
// A crit throws a fountain of grains flagged crit, and they are payload: they
// arc, they land, and they bank like any other dust, wherever the pixels came
// off. Count in equals count out -- no grain is invented and none is lost.
group('a crit throws real dust that is flagged, swells, and banks', async () => {
  haveRock();
  window.__crew(0, 0);                        // no crew: one swing, and only ours
  window.__clearFloor();
  window.__crit(true);
  run(0.2);

  const before = dustAbout();
  const rock0 = state().rock;
  window.__swing(1);                          // one crit swing
  const removed = rock0 - state().rock;

  // The burst is there and flagged, and it is real dust in the air.
  const critChips = S.chips.filter(c => c.crit);

  // Watched through the top of the arc: a crit grain slows to near nothing at
  // its apex, which is where it draws fattest -- a grain the size of two could
  // only be a crit's. `cv` is its launch speed, the fastest it moves.
  let swelled = false;
  for (let i = 0; i < 60; i++) {
    run(1 / 60);
    if (S.chips.some(c => c.crit && Math.abs(c.vy) < c.cv * 0.4)) swelled = true;
  }

  run(3);                                     // let the fountain come down
  const settled = S.chips.filter(c => c.crit).length;
  const after = dustAbout();
  window.__crit(null);

  return [
    ok(removed > 1, 'the crit swing took several pixels', `${removed}`),
    ok(critChips.length === removed, 'every pixel became a crit-flagged grain',
       `${critChips.length} vs ${removed}`),
    ok(swelled, 'a grain hangs slow near its apex, where it draws fattest'),
    ok(settled === 0, 'and the fountain has all come down', `${settled} left aloft`),
    ok(after - before === removed, 'count conserved: the grains banked as dust',
       `+${after - before} vs ${removed}`),
  ];
});

// --- 4. the two ladders are bought in blue and green ---------------------------
//
// A crit lands at every station, so its rungs are owed to more than one of them:
// the quarry's shard and the farm's spore, plus the dust every bill carries.
// Bought through the row a player presses, because what is being asked is
// whether the price is really taken out of those two purses -- a check that set
// `S.critChanceLevel` would prove nothing about the bill at all.
group('the crit ladders are dust first, and the chance ladder asks crops and ore as it climbs', async () => {
  window.__reset();
  window.__invest();                         // the grounds stand: rungs past three are priced in their coins
  window.__crew(1, 0);                       // a hand to walk it to the bench
  window.__give(2000000);
  window.__grant({ shards: 5000, spores: 5000 });

  const purse = () => [state().stored, state().shards, state().spores];
  const [d0, sh0, sp0] = purse();
  const lvl0 = S.critChanceLevel;
  // Bought through the row a player presses, and built the way a bench row is
  // built -- a body walks over and fits it -- rather than by setting the level.
  const gotChance = buyBuilt('critchance');
  const lvl1 = S.critChanceLevel;
  const [d1, sh1, sp1] = purse();

  // And the damage rung, one card of three -- but priced in all three coins
  // from its first rung, the one short ladder that is (see rows-luck.js).
  const mult0 = S.critMultLevel;
  const gotMult = buyBuilt('critmult');
  const [d2, sh2, sp2] = purse();

  // The rest of the first band up the chance ladder, and the bill deepens:
  // the second band takes crops with the dust, the third crops and ore.
  const bill = key => window.__rows().find(r => r.key === key)?.bill || [];
  const coins = key => bill(key).map(([c]) => c).filter(c => c !== 'time').sort().join();
  const got = climb('critchance', TIER_BAND - 1, buyBuilt);
  const secondCoins = coins('critchance');

  return [
    ok(gotChance && lvl1 === lvl0 + 1, 'the chance rung was bought at the row', `${gotChance}, ${lvl0} -> ${lvl1}`),
    ok(d1 < d0, 'it took dust', `${d0} -> ${d1}`),
    ok(sh1 === sh0 && sp1 === sp0, 'and nothing else on the first card', `${sh0}->${sh1} shard, ${sp0}->${sp1} spore`),
    ok(gotMult && S.critMultLevel === mult0 + 1, 'the power rung was bought too'),
    ok(d2 < d1 && sh2 < sh1 && sp2 < sp1, 'in dust, crops and ore together', `${d1}->${d2} dust, ${sh1}->${sh2} shard, ${sp1}->${sp2} spore`),
    ok(got === TIER_BAND - 1 && secondCoins === 'dust,spore', 'the first band finished and the second asks dust and crops', `${got}, ${secondCoins}`)
  ];
});
