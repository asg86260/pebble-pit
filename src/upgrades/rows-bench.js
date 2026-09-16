import { BELT_BILL, RAM_BILL, LADDER } from '../config.js';
import { JOB } from '../jobs.js';
import { buyMachine, canBuy, specOf } from '../machines.js';
import { S } from '../state.js';
import { kitFull, mineRate, capacity, pickCount } from '../levels.js';
import { rebalance } from '../staffing.js';
import { tierRows, named } from './tiers.js';

// The bench's bench rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
// Your own three ladders, each in bands (CLAUDE.md, "Decided"). Carry and the
// pick are a whole pixel a rung, since neither grains nor pixels come in
// fractions; the swing is a rate and eases to its floor.
const YOU_CARRY = tierRows({
  field: 'carryLevel',
  unit: 'px', does: 'hold',
  value: lvl => capacity(lvl),
  site: 'bench',
  // Once you have dragged: a row about a thing you have done is a row you can
  // read, and this was the first, cheapest row on the first board.
  show: () => S.seenDrag,
  bands: named('carry', 'carry amount')
});

const YOU_SWING = tierRows({
  field: 'speedLevel',
  unit: 'hits/s', pct: true, does: 'hit',
  value: lvl => mineRate(lvl),
  site: 'bench',
  // faster swings only read as an upgrade once the swinging is automatic
  show: () => S.autoMine,
  bands: named('speed', 'auto swing')
});

// --- what a swing takes ---------------------------------------------------
// Never priced in cores: a core opens places, and a core spent on a bigger
// bite was a core not spent on somewhere to send anybody.
const YOU_PICK = tierRows({
  field: 'pickLevel',
  unit: 'px', does: 'per swing',
  value: lvl => pickCount(lvl),
  site: 'bench',
  show: () => S.autoMine,
  bands: named('pick', 'pick damage')
});

export const BENCH_ROWS = [
  ...YOU_CARRY,
  {
    // The rock's machine, sold on the shack's board (`board: 'shack'`); it is
    // in this file because where a machine is BOUGHT and where it is BUILT are
    // different questions. Its gate is the rock's gear bought right out, since
    // the rock has no floor plan to fill. `LADDER` is read rather than
    // written, so a longer ladder moves the gate with it.
    key: 'ram',
    // Put up where it will stand, which the machine's spec knows: the builders
    // walk to it.
    kind: 'machine', site: 'yard', at: () => specOf('ram')?.at(), board: 'shack',
    name: 'the ram',
    bill: () => RAM_BILL,
    buy: () => { buyMachine('ram'); rebalance(); },
    show: () => canBuy('ram', () => S.rockhandPickLevel >= LADDER && S.rockhandSpeedLevel >= LADDER,
                       () => kitFull(JOB.ROCK))
  },
  {
    // The belt from the rock to the hole: the one machine that changes the
    // yard's *traffic* rather than a station's rate. Gated like the others:
    // every rung of the haulers' gear, and a cart for every pair of hands.
    key: 'belt',
    // No `board`: the bench sells it, under the haulers' heading, beside the
    // kit it replaces.
    kind: 'machine', site: 'yard', at: () => specOf('belt')?.at(),
    // the ground the machine covers, for the bar to hang over: the whole run,
    // not the tail `at` names (`siteBox` in works.js)
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
    // What it gives is the swing ladder's foot.
    unit: 'hit/s',
    to: () => mineRate(0),
    cost: () => 25,
    buy: () => { S.autoMine = true; },
    show: () => !S.autoMine
  },
  ...YOU_SWING,
  ...YOU_PICK
];
