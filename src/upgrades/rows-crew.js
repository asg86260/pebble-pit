import { S } from '../state.js';
import { haulCap, haulSpeed, rungCost } from '../upgrades.js';
import { HAUL_CARRY_COST, HAUL_PACE_COST } from '../config.js';

// The bench's crew rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
//
// These went to the house board with the crew's other gear and have come back,
// because a row is sold where its work is done. Every one of them is
// `site: 'bench'` -- somebody walks to the workbench and fits the kit, and the
// standard bar hangs over the bench while they do it. Sold from the block, the
// press was in one place and the picture of it in another, which reads as the
// bar having wandered. The belt and the crew's multiplier are still sold at the
// block: those are `site: 'yard'` and are built where they stand.
export const CREW_ROWS = [
  {
    key: 'haulcarry',
    kind: 'rung', site: 'bench',
    // The heading over these rows already says "crew gear", so the rows do not
    // need to say "worker" as well -- and what a body can pick up in one go is
    // its strength rather than its load, which is the thing it is carrying.
    name: 'strength',
    unit: 'px',
    rung: () => S.haulCarryLevel,
    from: () => haulCap(),
    to: () => haulCap(S.haulCarryLevel + 1),
    // Dust and nothing else. The crew's first two ladders are the first thing
    // anybody buys after their own hands, and they come long before the quarry or
    // the plots -- so pricing them in stone or crop was asking for a currency the
    // game has not shown you yet, on the two rows most likely to be the first
    // you ever read. The first round is dust. See "The ladder" in DESIGN.md.
    cost: () => rungCost(HAUL_CARRY_COST, S.haulCarryLevel),
    buy: () => S.haulCarryLevel++,
    show: () => S.crew > 0
  },
  // --- and the second round, which the quarry pays for -------------------------
  // A finite ladder means running out, and running out is the game telling you
  // to go and open the next place. These are what is on the other side of that:
  // the same two things about a pair of hands, bought again in the stone the quarry
  // gives up. They are not more rungs on the ladders above -- those are finished
  // and say so -- they are gear, which is what blue is for.
  {
    key: 'harness',
    kind: 'rung', site: 'bench',
    name: 'harness',
    unit: 'px',
    rung: () => S.harnessLevel,
    from: () => haulCap(),
    to: () => haulCap(S.haulCarryLevel, S.harnessLevel + 1),
    bill: () => [['shard', rungCost(40, S.harnessLevel)], ['dust', rungCost(400, S.harnessLevel)]],
    cost: () => rungCost(400, S.harnessLevel),
    buy: () => S.harnessLevel++,
    // Once there is stone to spend, and not before: a row asking for a coin the
    // yard has never handed you is a row that reads as broken.
    show: () => S.seenShard && S.crew > 0
  },
  {
    key: 'boots',
    kind: 'rung', site: 'bench',
    name: 'boots',
    unit: 'px/s',
    pct: true,
    rung: () => S.bootsLevel,
    from: () => haulSpeed() * 60,
    to: () => haulSpeed(S.haulPaceLevel, S.bootsLevel + 1) * 60,
    bill: () => [['shard', rungCost(30, S.bootsLevel)], ['dust', rungCost(300, S.bootsLevel)]],
    cost: () => rungCost(300, S.bootsLevel),
    buy: () => S.bootsLevel++,
    show: () => S.seenShard && S.crew > 0
  },
  {
    key: 'haulpace',
    kind: 'rung', site: 'bench',
    name: 'speed',
    unit: 'px/s',
    pct: true,
    rung: () => S.haulPaceLevel,
    from: () => haulSpeed() * 60,
    to: () => haulSpeed(S.haulPaceLevel + 1) * 60,
    cost: () => rungCost(HAUL_PACE_COST, S.haulPaceLevel),
    buy: () => S.haulPaceLevel++,
    show: () => S.crew > 0
  }
];
