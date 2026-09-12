import { BELT_BILL, CAP_BASE, CAP_STEP, RAM_BILL, ROCKHAND_RUNGS, LADDER,
         CARRY_COST, SWING_COST, PICK_COST } from '../config.js';
import { JOB } from '../jobs.js';
import { buyMachine, canBuy, specOf } from '../machines.js';
import { S } from '../state.js';
import { kitFull, mineRate, rebalance } from '../upgrades.js';
import { tierRows, named } from './tiers.js';

// The bench's bench rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
// Your own three ladders, each in bands: dust for the first card, dust and
// crops for the second, dust, crops and ore for the third (CLAUDE.md,
// "Decided"). Strength and the pickaxe are a whole pixel a rung -- a sweep
// picks up grains and a swing takes pixels, and neither comes in fractions --
// so they are the two ladders that climb a little higher than they did at five
// rungs; the swing is a rate and eases to the floor it always had.
const YOU_CARRY = tierRows({
  field: 'carryLevel',
  // The same word the crew's row uses, because it is the same thing: how much
  // a pair of hands lifts in one go. Yours were called "carry" and theirs
  // "load", which is two names for one idea and a player having to learn both.
  unit: 'px', does: 'hold',
  value: lvl => CAP_BASE + lvl * CAP_STEP,
  first: CARRY_COST,
  site: 'bench',
  // Once you have dragged. This is a rung on YOUR hands -- how many grains a
  // sweep of the cursor picks up -- and it was the first-listed, cheapest row
  // on the first board, so a newcomer bought it four times (74 dust, before a
  // 60-dust house) for a mechanic nothing had shown them and nothing changed
  // that they could see (docs/critics-2026-09-10.md, C4). A row about a thing
  // you have done is a row you can read.
  show: () => S.seenDrag,
  bands: named('carry', 'carry amount')
});

const YOU_SWING = tierRows({
  field: 'speedLevel',
  unit: 'px/s', pct: true, does: 'hit',
  value: lvl => mineRate(lvl),
  first: SWING_COST,
  site: 'bench',
  // faster swings only read as an upgrade once the swinging is automatic. It
  // stays on the board once it is finished, saying so -- it used to vanish the
  // moment it reached the floor, which is a cap the game would not admit to.
  show: () => S.autoMine,
  bands: named('speed', 'auto swing')
});

// --- what a swing takes ---------------------------------------------------
// A core is a rock. There is one of them per rock for ever, and what they are
// for is *opening places* -- the quarry, the plots, the lab, the table. Selling a
// pick for one put a rate on the same shelf as a whole new part of the game,
// and every core spent on a bigger bite was a core not spent on somewhere to
// send anybody. So the picks are priced in what the ground gives up instead --
// dust first, and the cut stone a tool is made of on the last card.
const YOU_PICK = tierRows({
  field: 'pickLevel',
  // And the same again for the tool. What you swing and what a rockhand swings do
  // exactly the same job, so they are the same row under two headings rather
  // than "pick" here and "pickaxe" over there.
  unit: 'px', does: 'per swing',
  value: lvl => 1 + lvl,
  first: PICK_COST,
  site: 'bench',
  // Beside the swing, once the swinging is automatic: it was gated on the
  // shard while the shard was its coin, and the coin has moved to the last card.
  show: () => S.autoMine,
  bands: named('pick', 'pick damage')
});

export const BENCH_ROWS = [
  ...YOU_CARRY,
  {
    // The rock's machine, sold at the rock like the other two are sold at
    // theirs. It was the odd one out for as long as the rock had no board of
    // its own; the shack is that board, so this row is on it -- `board:
    // 'shack'` below, and the row is still in this file because where a
    // machine is BOUGHT and where it is BUILT are different questions and only
    // the first one moved.
    //
    // Its gate is those two rows bought right out. The cut has benches and the
    // plots have furrows; the rock has no floor plan to fill, so what stands for
    // "everything hands can be given" here is its gear. `LADDER` is read rather
    // than written: a ladder that grew a sixth rung should move this gate with
    // it.
    key: 'ram',
    // Put up where it will stand, which the machine's own spec knows and this
    // row does not: the builders walk to it rather than building it from
    // wherever they happened to be.
    kind: 'machine', site: 'yard', at: () => specOf('ram')?.at(), board: 'shack',
    name: 'the ram',
    bill: () => RAM_BILL,
    buy: () => { buyMachine('ram'); rebalance(); },
    // The pick ladder is shorter than the house LADDER (wave 7 cut it to whole
    // pixels), so the gate asks its own top, not the shared one -- a gate on a
    // rung nobody can buy is a machine that is never for sale.
    show: () => canBuy('ram', () => S.rockhandPickLevel >= ROCKHAND_RUNGS && S.rockhandSpeedLevel >= LADDER,
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
    // No `board`: the bench sells it, under the haulers' heading, beside the
    // kit it replaces. It was sold at the house for a while as "the crew's
    // machine", which is true and is not where a player looks for it -- the
    // house is for putting a roof up, and everything a hauler carries or rides
    // is fitted at the workbench.
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
                       () => S.haulCarryLevel >= LADDER && S.haulPaceLevel >= LADDER,
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
  ...YOU_SWING,
  ...YOU_PICK
];
