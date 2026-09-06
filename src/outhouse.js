// The outhouse's own board: the janitor's ladder, read standing at the shed.
//
// There used to be a second building -- the janitor's closet, a cupboard by the
// rooms that arrived with the crew and held these rows. Two sheds for one trade
// was one shed too many: the outhouse is where a body goes, where the caps hang
// on the stand outside and where the brooms live, so it is the one thing, and
// its board carries the job's rungs the way every other station carries its
// own. The row that *builds* it cannot live here -- there is no board to press
// before the shed is up -- so that one is on the bench with every other "open a
// place" row: see rows-outhouse.js.

import { LOOPOST_SHARDS, LOO_POSTS } from './config.js';
import { S } from './state.js';
import { rebalance } from './upgrades.js';
import { registerRows } from './works.js';

export const OUTHOUSE_UPGRADES = [
  // The shed's second rung. The stand outside it went up with one cap on it --
  // ground enough for a single pair of hands, and no more of the yard than
  // that pair can actually keep up with. This is the second, priced in shards
  // because the mess is the *rock's* problem before it is anybody else's: a yard
  // mining hard enough to want a second janitor has already been to the quarry.
  {
    key: 'loopost',
    kind: 'rung', site: 'bench',
    name: 'another cap',
    cost: () => LOOPOST_SHARDS,
    currency: 'shard',
    buy: () => { S.looPosts = 2; rebalance(); },
    show: () => S.outhouseOpen && (S.looPosts ?? LOO_POSTS) < 2
  }
];

// One heading, and it is the board's own name, so the sheet draws no heading at
// all -- see `lone` in shop.js, which is what keeps a board with a single group
// from saying its own name twice with a rule between.
export const OUTHOUSE_SECTIONS = [
  // Display string only: everything internal still says outhouse (wave7-crew).
  { title: "the janitor's closet", keys: OUTHOUSE_UPGRADES.map(u => u.key) }
];

// and the yard is told what these rows are, so a work coming back out of a save
// knows which one it belongs to. See `registerRows` in works.js -- a rung is
// built rather than had, and a save closed mid-build has to find its way back
// to this row's own `buy`.
registerRows(OUTHOUSE_UPGRADES);
