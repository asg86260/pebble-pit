// Track A of the wave-3 pass: the numbers a new player meets in the first half
// hour, and four rows that were simply misfiled. See docs/wave-feedback3.md,
// "Track A -- economy & fixes" (A1-A8).

import { yard, group, ok, state, run, runUntil, openSites, buyBuilt } from './helpers.mjs';
import { priceText, billOf, UPGRADES, rockhandBite } from '../src/upgrades.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';
import { SCHOOL_UPGRADES } from '../src/school.js';
import { SCRUB_UPGRADES } from '../src/scrubhouse.js';
import { TOWER_UPGRADES } from '../src/tower.js';
import { CASINO_UPGRADES } from '../src/casino.js';
import { OUTHOUSE_UPGRADES } from '../src/outhouse.js';
import { PLOT_COST, PLOT_RATE, LOO_POSTS, LOOPOST_SHARDS, LAB_DUST, ROCKHAND_RUNGS, RUNGS, QUARRY_CORES } from '../src/config.js';

const roster = () => state().roster;

// --- A1: the second on a bill has no "s" -------------------------------------
group('a time price drops the s, and keeps the minutes', async () => {
  window.__reset();
  return [
    ok(priceText('time', 45000) === '45', 'forty-five seconds reads as a bare number',
       priceText('time', 45000)),
    ok(priceText('time', 12000) === '12', 'the reported case: twelve seconds, not "12s"',
       priceText('time', 12000)),
    ok(priceText('time', 125000) === '2 min', 'a longer wait still says minutes',
       priceText('time', 125000)),
    ok(priceText('dust', 45) === '45', 'a coin price is untouched', priceText('dust', 45))
  ];
});

// --- A2: the janitor's post is the ordinary two lines -------------------------
// Every other station's post is a headcount and, once it owns kit, a second
// line under it for the hats. The janitor's post is built off the same table
// (`POSTS` in roster.js) and drawn by the same function (`drawRoster`) as
// every other one now -- there is no third field and no extra case for it, so
// a report of the roster carries exactly the same shape for the loo as for any
// other kitted post.
group('the janitor post carries no line the others do not', async () => {
  window.__reset();
  window.__loo(true);
  const loo = roster().find(r => r.job === 'janitors');
  const mine = roster().find(r => r.job === 'rockhands');
  return [
    ok(!!loo, 'the outhouse posts a janitor row once it is open'),
    ok(!!mine, 'and the rock has one to compare it with'),
    ok(Object.keys(loo).sort().join() === Object.keys(mine).sort().join(),
       'the two posts report the same fields -- no extra line on the janitor\'s',
       `${Object.keys(loo).sort().join()} vs ${Object.keys(mine).sort().join()}`)
  ];
});

// --- A3: the outhouse opens with one post; loopost buys the second -----------
// `loopost` lives on the outhouse's own board now, so it is looked up there
// rather than in the bench's UPGRADES (where this check went quietly stale
// when wave5 moved the row).
group('the outhouse starts at one post, and loopost buys the second', async () => {
  window.__reset();
  window.__loo(true);
  window.__crew(0, 2);                          // spare hands to build it

  const one = roster().find(r => r.job === 'janitors');
  const shownBefore = OUTHOUSE_UPGRADES.find(u => u.key === 'loopost').show();

  window.__grant({ shards: LOOPOST_SHARDS });
  window.__tip(1000);                           // the bill's dust half, from DUST_PER
  const bought = buyBuilt('loopost');
  const two = roster().find(r => r.job === 'janitors');
  const shownAfter = OUTHOUSE_UPGRADES.find(u => u.key === 'loopost').show();

  return [
    ok(LOO_POSTS === 1, 'LOO_POSTS itself is one now', LOO_POSTS),
    ok(one.hats === 1, 'the outhouse opens with one cap on the stand', one.hats),
    ok(shownBefore, 'and the second cap is on offer'),
    ok(bought, 'and it can be bought'),
    ok(two.hats === 2, 'which puts a second cap on the stand', two.hats),
    ok(!shownAfter, 'and the row is done once bought')
  ];
});

group('a save from before the second cap keeps both', async () => {
  window.__reset();
  window.__loo(true);
  yard.S.dirty = true;
  yard.persist();
  const raw = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  delete raw.looPosts;                          // the field a pre-wave save never wrote
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(raw));
  yard.restore();

  return [
    ok(state().roster.find(r => r.job === 'janitors').hats === 2,
       'a save with no looPosts arrives with both caps, not one',
       state().roster.find(r => r.job === 'janitors').hats)
  ];
});

// --- A4: worker speed at the start --------------------------------------------
group('the crew starts quicker: haul base and commute pace are up', async () => {
  const { HAUL_BASE, COMMUTE_PACE } = await import('../src/config.js');
  return [
    ok(HAUL_BASE === 1.8, 'HAUL_BASE is 1.8', HAUL_BASE),
    ok(COMMUTE_PACE === 4.6, 'COMMUTE_PACE is 4.6', COMMUTE_PACE)
  ];
});

// --- A5: the farm's first rows are not free the moment it opens --------------
// The numbers doubled again when the two grounds went over to a place and two
// ladders: the farm is a board you open after the rock has been paying for a
// while, and it should cost like it. The old tending rung asked 360 and the two
// ladders open at twice that. See DESIGN.md, "What the two grounds sell", and
// test/ladders.test.mjs for what the ladders themselves do.
group('the farm costs a real stretch of dust to open, not pocket change', async () => {
  const plotBill = lvl => Math.round(PLOT_COST * Math.pow(PLOT_RATE, lvl));
  const dust = key => window.__rows().filter(r => r.key === key)[0]
                            ?.bill.find(([m]) => m === 'dust')?.[1];
  return [
    ok(PLOT_COST === 520, 'PLOT_COST is 520', PLOT_COST),
    ok(plotBill(0) === 520 && plotBill(1) === 884 && plotBill(2) === 1503,
       'first three plot bills', `${plotBill(0)}, ${plotBill(1)}, ${plotBill(2)}`),
    ok(dust('crop') === 720 && dust('tend') === 720,
       "and both of the plots' ladders open at 720 dust",
       `${dust('crop')}, ${dust('tend')}`)
  ];
});

// --- A6: the rockhand's pick is a whole pixel a rung, capped at its own top ------
// Rewritten by wave 7 (feedback7, item 19): the eased 2.2x curve is gone, the
// ladder is ROCKHAND_RUNGS whole-pixel rungs, and a level past the top bites
// what the top bites. The full new-ladder coverage is in wave7-ui.test.mjs.
group('the rockhand pick bites a whole pixel more per rung, and no further', async () => {
  const b0 = rockhandBite(0), b1 = rockhandBite(1), top = rockhandBite(ROCKHAND_RUNGS);
  return [
    ok(b0 === 1, 'rung 0 is the bare bite', b0),
    ok(b1 === 2, 'a rung is one more whole pixel', b1),
    ok(top === 1 + ROCKHAND_RUNGS, 'the top of the ladder', top),
    ok(rockhandBite(RUNGS) === top, 'a saved level past it bites the top', rockhandBite(RUNGS))
  ];
});

// --- A7: a place costs a core -------------------------------------------------
group('a place costs a core, not dust alone', async () => {
  window.__reset();
  window.__grant({ shards: 400, cores: 5, dust: 30000, spores: 100 });
  window.__crew(0, 2);
  // The quarry, which is the door this group asks about now. It was the lab,
  // and then the construction bench once the lab went; both are gone, and the
  // claim was never about any one of them. The quarry's own gate is the plots
  // being broken, which is the whole of the setup.
  window.__crew(1, 1, 0, 1);
  const before = state().cores;
  const built = buyBuilt('unlockquarry');
  const after = state().cores;
  return [
    ok(built, 'the quarry can be built'),
    // The claim this group has always made is that a PLACE is bought with cores
    // and never with dust alone -- see DESIGN.md, "cores buy places, and only
    // places" -- so what matters is that it costs them at all, and the count is
    // read off the row rather than guessed.
    ok(before - after === QUARRY_CORES, 'and it costs cores, not none',
       `${before} -> ${after}, of ${QUARRY_CORES}`)
  ];
});

// --- A8: nothing shard-, spore- or quarry-priced shows before its coin -------
// The reported case: open the lab before the quarry, and the lab's own
// "quarry speed" row -- and every shard-priced row beside it -- were on the
// board regardless. Walk every row on every board with one building open and
// nothing else seen, and none of them may ask for a coin that has not been
// shown yet.
//
// One building, and deliberately not the quarry: what this sweeps is whether a
// row asks for a coin the yard has never shown, so the setup may not itself
// hand the yard a coin. It was the lab, then the trestle, and it is the casino
// now -- whichever building sits at that tier, opened and nothing else.
group('nothing shard-, spore- or quarry-priced shows before its coin has been seen', async () => {
  window.__reset();
  window.__casino(true);

  const boards = {
    bench: UPGRADES, quarry: QUARRY_UPGRADES, farm: FARM_UPGRADES,
    school: SCHOOL_UPGRADES, scrub: SCRUB_UPGRADES, tower: TOWER_UPGRADES, casino: CASINO_UPGRADES
  };
  const notSold = u => u.job || u.dial || u.price;
  const bad = [];
  let checked = 0;
  for (const [board, rows] of Object.entries(boards)) {
    for (const u of rows) {
      if (notSold(u) || !u.show()) continue;
      checked++;
      let bill;
      try { bill = billOf(u); } catch { continue; }
      for (const [money] of bill) {
        if (money === 'shard') bad.push(`${board}/${u.key} shows, priced in shard, before one is seen`);
        if (money === 'spore') bad.push(`${board}/${u.key} shows, priced in spore, before one is seen`);
      }
      if (/quarry/i.test(u.name || '')) bad.push(`${board}/${u.key} (${u.name}) shows before the quarry exists`);
    }
  }

  return [
    ok(checked > 0, 'some rows were reachable to check', checked),
    ok(bad.length === 0, 'no shard, spore or quarry row is showing early', bad.join('; '))
  ];
});
