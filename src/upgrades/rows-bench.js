import { BELT_BILL, CAP_STEP, RAM_BILL, RUNGS } from '../config.js';
import { JOB } from '../jobs.js';
import { buyMachine, canBuy, specOf } from '../machines.js';
import { S } from '../state.js';
import { capacity, kitFull, mineRate, pickCount, rebalance, rungCost } from '../upgrades.js';

// The bench's bench rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const BENCH_ROWS = [
  {
    key: 'carry',
    // Fitted at the bench, by whoever walks over to do it. The bench's own
    // ladders were the one part of the game still had on the press; see "The
    // bench takes time too" in DESIGN.md for why they are not any more.
    kind: 'rung', site: 'bench',
    // The same word the crew's row uses, because it is the same thing: how much
    // a pair of hands lifts in one go. Yours were called "carry" and theirs
    // "load", which is two names for one idea and a player having to learn both.
    name: 'strength',
    unit: 'px',
    rung: () => S.carryLevel,
    from: () => capacity(),
    to: () => capacity() + CAP_STEP,
    cost: () => rungCost(8, S.carryLevel),
    buy: () => S.carryLevel++,
    show: () => true
  },
  {
    // The rock's machine, and the only one of the three sold from the bench --
    // because the rock is the one station with no board of its own, its two kit
    // rows having always lived here under 'the rock'.
    //
    // Its gate is those two rows bought right out. The cut has benches and the
    // plots have furrows; the rock has no floor plan to fill, so what stands for
    // "everything hands can be given" here is its gear. `RUNGS` is read rather
    // than written: a ladder that grew a sixth rung should move this gate with
    // it.
    key: 'ram',
    // Put up where it will stand, which the machine's own spec knows and this
    // row does not: the builders walk to it rather than building it from
    // wherever they happened to be.
    kind: 'machine', site: 'yard', at: () => specOf('ram')?.at(),
    name: 'the ram',
    bill: () => RAM_BILL,
    buy: () => { buyMachine('ram'); rebalance(); },
    show: () => canBuy('ram', () => S.rockhandPickLevel >= RUNGS && S.rockhandSpeedLevel >= RUNGS,
                       () => kitFull(JOB.ROCK))
  },
  {
    // The belt from the rock to the hole, and the one machine that changes the
    // yard's *traffic* rather than a station's rate.
    //
    // It is what the yard starts asking for the moment any other machine runs: a
    // ram fills the rock's pile in well under a second and then stands down
    // waiting to be carried, so haulage becomes the bottleneck exactly when the
    // works becomes worth watching. DESIGN.md's tier three promised carts from
    // the beginning.
    //
    // Gated like the others: every rung of the lip's own gear, and a cart for
    // every pair of hands.
    key: 'belt',
    // Put up where it will stand, which the machine's own spec knows and this
    // row does not: the builders walk to it rather than building it from
    // wherever they happened to be.
    kind: 'machine', site: 'yard', at: () => specOf('belt')?.at(),
    // ...and the ground the machine covers, for the bar to hang over: the whole
    // run, rock to lip, not the tail `at` names. See `siteBox` in works.js.
    box: () => specOf('belt')?.box?.(),
    name: 'the belt',
    bill: () => BELT_BILL,
    buy: () => { buyMachine('belt'); rebalance(); },
    show: () => canBuy('belt',
                       () => S.haulCarryLevel >= RUNGS && S.haulPaceLevel >= RUNGS
                          && S.harnessLevel >= RUNGS && S.bootsLevel >= RUNGS,
                       () => kitFull(JOB.HAUL))
  },
  {
    key: 'auto',
    kind: 'rung', site: 'bench',
    name: 'hold to mine',
    cost: () => 25,
    buy: () => { S.autoMine = true; },
    show: () => !S.autoMine
  },
  {
    key: 'speed',
    kind: 'rung', site: 'bench',
    name: 'swing',
    unit: 'px/s',
    pct: true,
    rung: () => S.speedLevel,
    from: () => mineRate(S.speedLevel),
    to: () => mineRate(S.speedLevel + 1),
    cost: () => rungCost(20, S.speedLevel),
    buy: () => S.speedLevel++,
    // faster swings only read as an upgrade once the swinging is automatic. It
    // stays on the board once it is finished, saying so -- it used to vanish the
    // moment it reached the floor, which is a cap the game would not admit to.
    show: () => S.autoMine
  },
  // --- what a swing takes ---------------------------------------------------
  // A core is a rock. There is one of them per rock for ever, and what they are
  // for is *opening places* -- the quarry, the plots, the lab, the table. Selling a
  // pick for one put a rate on the same shelf as a whole new part of the game,
  // and every core spent on a bigger bite was a core not spent on somewhere to
  // send anybody. So the picks are priced in what the ground gives up instead,
  // which is what the ground is for.
  //
  // Yours is a tool, and a tool is cut stone: shards.
  {
    key: 'pick',
    kind: 'rung', site: 'bench',
    // And the same again for the tool. What you swing and what a rockhand swings do
    // exactly the same job, so they are the same row under two headings rather
    // than "pick" here and "pickaxe" over there.
    name: 'pickaxe',
    unit: 'px',
    rung: () => S.pickLevel,
    from: () => pickCount(),
    to: () => pickCount() + 1,
    // Its own tier's coin, and dust with it. The rock never stops giving dust,
    // so every rung above the first tier is priced in both -- see "The ladder"
    // in DESIGN.md. Digging stays worth doing for the whole run.
    bill: () => [['shard', rungCost(4, S.pickLevel)], ['dust', rungCost(240, S.pickLevel)]],
    cost: () => rungCost(240, S.pickLevel),
    buy: () => S.pickLevel++,
    show: () => S.seenShard
  }
];
