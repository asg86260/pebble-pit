// The outhouse's own board: the janitor's ladder, read standing at the shed.
// The row that *builds* it cannot live here (there is no board to press before
// the shed is up), so that one is on the bench: rows-outhouse.js.

import { LOOPOST_SHARDS, LOO_POSTS } from './config.js';
import { S } from './state.js';
import { rebalance } from './staffing.js';
import { registerRows } from './works.js';
import { registerBoard } from './boardrows.js';

export const OUTHOUSE_UPGRADES = [
  // The second cap on the stand outside, priced in shards because the mess is
  // the rock's problem before it is anybody else's.
  {
    key: 'loopost',
    kind: 'rung', site: 'outhouse',
    name: 'another cap',
    cost: () => LOOPOST_SHARDS,
    currency: 'shard',
    buy: () => { S.looPosts = 2; rebalance(); },
    // Priced in ore, so off the board until there is somewhere to get ore from.
    show: () => S.outhouseOpen && S.quarryOpen && (S.looPosts ?? LOO_POSTS) < 2
  }
];

// One heading, the board's own name, so the sheet draws no heading at all
// (`lone` in shop.js).
export const OUTHOUSE_SECTIONS = [
  // Display string only: everything internal still says outhouse.
  { title: "the janitor's closet", keys: OUTHOUSE_UPGRADES.map(u => u.key) }
];

// A rung is built rather than had, and a save closed mid-build has to find its
// way back to this row's own `buy` (`registerRows` in works.js).
registerRows(OUTHOUSE_UPGRADES);

registerBoard('outhouse', { rows: () => OUTHOUSE_UPGRADES, sections: () => OUTHOUSE_SECTIONS });
