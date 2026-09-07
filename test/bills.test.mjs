// Every bill carries dust.
//
// Dust is the one coin the whole yard makes, and the pile in the hole is what
// the game is about. A row priced only in shards, spores or red is a row the
// pile has no part in -- and a game whose most expensive things cost nothing out
// of the pile is a game where the pile fills up and stays full, because there is
// nothing to spend it on. The rule is what gives the dust somewhere to go.
//
// Two rows broke it and one of them was the most expensive thing in the game:
// the ram and the belt were priced in red and in the coins of the grounds, and
// the training grounds was priced in shards alone.
//
// This is a check about the *rule* rather than about those three, which is the
// point of writing it here instead of fixing three prices and moving on: a row
// added next year is a row that cannot quietly skip it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yard } from './helpers.mjs';

const { billOf } = await import('../src/upgrades.js');

// Every board in the game, by the name the player knows it under. `shop.js`
// builds each of these into a panel; anything sold anywhere is in one of them.
const BOARDS = Object.entries({
  bench: (await import('../src/upgrades.js')).UPGRADES,
  lab: (await import('../src/lab.js')).LAB_UPGRADES,
  school: (await import('../src/school.js')).SCHOOL_UPGRADES,
  casino: (await import('../src/casino.js')).CASINO_UPGRADES,
  'scrubbing house': (await import('../src/scrubhouse.js')).SCRUB_UPGRADES,
  quarry: (await import('../src/quarry.js')).QUARRY_UPGRADES,
  farm: (await import('../src/farm.js')).FARM_UPGRADES,
  tower: (await import('../src/tower.js')).TOWER_UPGRADES
});

// What is not a purchase, and so has no bill to carry dust.
//
//   job   -- moves bodies between stations; nothing is paid
//   dial  -- sets a number, like the fold switch
//   price -- the casino's two rows, which pay *out* rather than being bought
//   sign  -- a signpost with a thought on it, like the bench wondering about
//            the wizards; pressing it points, and takes nothing
//
// Named here rather than tested for one at a time, because `buy` in upgrades.js
// turns each of them away at the top for exactly these reasons, and the two
// lists have to say the same thing.
const notSold = u => u.job || u.dial || u.price || u.sign;

test('every bill carries dust', () => {
  window.__seed(20260901);
  // Everything unlocked and affordable, so a row's `cost` and `bill` are asked
  // in the state they were written for rather than in a fresh yard where half
  // of them are still hidden.
  window.__fullSites();
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999, cores: 99 });

  const bad = [];
  let checked = 0;
  for (const [board, rows] of BOARDS) {
    for (const u of rows) {
      if (notSold(u)) continue;
      let bill;
      try {
        bill = billOf(u);
      } catch (e) {
        bad.push(`${board}/${u.key}: asking its price threw — ${e.message}`);
        continue;
      }
      checked++;
      const dust = bill.find(([money]) => money === 'dust');
      if (!dust) {
        bad.push(`${board}/${u.key} (${u.name}) is priced in ` +
                 `${bill.map(([m]) => m).join(' + ')} and no dust`);
        continue;
      }
      if (!(dust[1] > 0)) bad.push(`${board}/${u.key} asks for ${dust[1]} dust`);
    }
  }

  // A check that walked no rows would pass in silence, which is the one way this
  // could go quietly wrong.
  assert.ok(checked > 30, `only ${checked} rows were priced; the boards did not build`);
  assert.equal(bad.length, 0, `\n  ${bad.join('\n  ')}`);
});

// And the two that were fixed, by name, so that putting either back the way it
// was fails as itself rather than as a line in the list above.
test('the ram and the belt are priced out of the pile', async () => {
  const { RAM_BILL, BELT_BILL } = await import('../src/config.js');
  for (const [what, bill] of [['ram', RAM_BILL], ['belt', BELT_BILL]]) {
    const dust = bill.find(([money]) => money === 'dust');
    assert.ok(dust && dust[1] > 0, `the ${what} costs no dust`);
    // Sixty dust to the spark is the line the machines that already had dust sat
    // on. Not a law -- a machine may be priced where it needs to be -- but far
    // off it means somebody moved one number and not the others.
    const spark = bill.find(([money]) => money === 'spark');
    const ratio = dust[1] / spark[1];
    assert.ok(ratio > 30 && ratio < 120,
      `the ${what} is ${Math.round(ratio)} dust to the spark, off the line the rest sit on`);
  }
});
