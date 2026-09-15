import { group, ok } from './helpers.mjs';
import { S } from '../src/state.js';
import { UPGRADES, billOf, rungOf, rungsOf, maxed } from '../src/upgrades.js';
import { SCRUB_UPGRADES } from '../src/scrubhouse.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';
import { APOTHECARY_UPGRADES } from '../src/apothecary.js';
group('seed', async () => {
  Object.assign(S, { crew: 8, farmOpen: true, quarryOpen: true, apothecaryOpen: true, scrubOpen: true, shackOpen: true,
    seenShard: true, seenSpore: true, seenCore: true, seenSpark: true, brews: 9, autoMine: true, boulderNo: 3 });
  const rows = [...UPGRADES, ...SCRUB_UPGRADES, ...QUARRY_UPGRADES, ...FARM_UPGRADES, ...APOTHECARY_UPGRADES]
    .filter(u => u.rung && u.group && Number.isFinite(rungsOf(u)));
  const out = {};
  for (const u of rows) {
    const value = [], dust = [];
    const raw = u.unit === '%' && !u.pct;   // percent counts are already in their unit
    for (let i = 0; i < 40 && !maxed(u); i++) {
      const b = Object.fromEntries(billOf(u));
      value.push(+(+u.from()).toFixed(3)); dust.push(b.dust);
      const at = rungOf(u); u.buy(); if (rungOf(u) === at) break;
    }
    value.push(+(+u.from()).toFixed(3));
    out[u.key] = { value, dust, unit: u.unit, pct: !!u.pct };
  }
  console.log('SEED ' + JSON.stringify(out));
  return [ok(true)];
});
