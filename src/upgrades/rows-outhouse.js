import { LOOPOST_SHARDS, LOO_MUCK, LOO_POSTS, OUTHOUSE_DUST } from '../config.js';
import { poopLeft } from '../smog.js';
import { S, outhouse } from '../state.js';
import { rebalance } from '../upgrades.js';
import { lookAt } from '../world.js';

// The bench's outhouse rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const OUTHOUSE_ROWS = [
  // The last thing on the ground, and the only one that makes nothing.
  //
  // What it buys is a *job*, not a place. It was a shed the crew walked to,
  // which sent everybody across the yard and back several times an hour and made
  // the purchase a destination -- and a body walking to a shed is a body not
  // working. So the crew go where they stand, as they always did, and what this
  // puts up is the cupboard the shovels live in: somewhere for a janitor to
  // keep one, and therefore somewhere for there to be a janitor at all. See
  // `capOf`, which will not let you post one until this is up.
  {
    key: 'unlockouthouse',
    kind: 'building', site: 'yard', at: () => outhouse.x + outhouse.w / 2,
    name: "build the janitor's closet",
    note: () => 'somewhere to keep a shovel, and somebody to swing it',
    cost: () => OUTHOUSE_DUST,
    buy: () => { S.outhouseOpen = true; lookAt(outhouse.x + outhouse.w / 2); },
    // Offered once you have seen why you want one -- which is now a thing you can
    // point at rather than a guess about how far along you are.
    //
    // It used to appear on a headcount and a fraction of its price, which is the
    // game deciding you are ready. What makes somebody want a janitor is five
    // patches of mess on the ground that nobody is clearing up, so that is what
    // puts it on the board. It stays once seen: a yard that had five and then
    // was tidied is a yard that has learned what the job is for.
    show: () => !S.outhouseOpen && (S.seenMess || poopLeft() >= LOO_MUCK * 5)
  },
  // The closet's own second rung. It went up with one post and one cap on the
  // stand -- ground enough for a single pair of hands, and no more of the yard
  // than that pair can actually keep up with. This is the second, priced in
  // shards because the mess is the *rock's* problem before it is anybody
  // else's: a yard mining hard enough to want a second janitor has already been
  // to the quarry.
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
