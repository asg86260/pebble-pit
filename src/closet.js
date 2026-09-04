// The janitor's closet: the cupboard the brooms are kept in, and the board you
// read standing at it.
//
// It is the one shop stand in the yard nobody buys. Everything else with a board
// on it -- the lab, the school, the cut, the tower -- is a place you paid to
// have, and its board arrives with the building. The closet arrives with the
// *people*: a settlement keeps its brooms somewhere, and there is no settlement
// until somebody lives here. That is what makes it the right home for the rows
// below, which is the whole reason it exists: what they sell is the janitor's
// job, and the row that opens that job cannot sit on the board of a place the
// job opens. It would have nowhere to be bought.
//
// So they were on the bench, under a heading naming a shed on the other side of
// the yard -- a decision about a place, made somewhere else, which is exactly
// what the lab and the school were moved off the bench to stop being.
//
// What the closet is *not* is the outhouse. The outhouse is the shed with the
// moon over the door that the first row here puts up, and it is where a body
// goes; the closet is where the tools live. The two were one thing for a while,
// which is why the row below used to be called "build the janitor's closet".

import { LOOPOST_SHARDS, LOO_MUCK, LOO_POSTS, OUTHOUSE_DUST } from './config.js';
import { poopLeft } from './smog.js';
import { S, outhouse } from './state.js';
import { rebalance } from './upgrades.js';
import { lookAt } from './world.js';
import { registerRows } from './works.js';

export const CLOSET_UPGRADES = [
  // What it buys is a *job*, not somewhere to keep a broom -- the broom already
  // has somewhere, which is the closet you are standing at. Until this is up
  // there is nowhere for a body to go, and `capOf` will not post a janitor
  // without one.
  //
  // It was called "build the janitor's closet" for as long as the closet and
  // the outhouse were the same building. They are two now: the cupboard is the
  // crew's and always there, and this is the shed with the moon on the door.
  {
    key: 'unlockouthouse',
    kind: 'building', site: 'yard', at: () => outhouse.x + outhouse.w / 2,
    name: 'build the outhouse',
    note: () => 'somewhere for the crew to go, and somebody to clear up after',
    cost: () => OUTHOUSE_DUST,
    buy: () => { S.outhouseOpen = true; lookAt(outhouse.x + outhouse.w / 2); },
    // Offered once you have seen why you want one -- which is a thing you can
    // point at rather than a guess about how far along you are.
    //
    // It used to appear on a headcount and a fraction of its price, which is the
    // game deciding you are ready. What makes somebody want a janitor is five
    // patches of mess on the ground that nobody is clearing up, so that is what
    // puts it on the board. It stays once seen: a yard that had five and then
    // was tidied is a yard that has learned what the job is for.
    show: () => !S.outhouseOpen && (S.seenMess || poopLeft() >= LOO_MUCK * 5)
  },
  // The closet's own second rung. The stand outside it went up with one cap on
  // it -- ground enough for a single pair of hands, and no more of the yard than
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
export const CLOSET_SECTIONS = [
  { title: "the janitor's closet", keys: CLOSET_UPGRADES.map(u => u.key) }
];

// and the yard is told what these rows are, so a work coming back out of a save
// knows which one it belongs to. See `registerRows` in works.js -- the outhouse
// is built rather than had, and a save closed mid-build has to find its way back
// to this row's own `buy`.
registerRows(CLOSET_UPGRADES);
