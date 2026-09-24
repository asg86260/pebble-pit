// The outhouse's own board: the janitor's ladder, read standing at the shed.
// The row that *builds* it cannot live here (there is no board to press before
// the shed is up), so that one is on the bench: rows-outhouse.js.

import { LOOPOST_SHARDS, LOO_POSTS, MACHINE_TUNE, P, ROOMBA_BILLS, ROOMBA_MAX, ROOMBA_W } from './config.js';
import { S } from './state.js';
import { JOB } from './jobs.js';
import { rebalance } from './staffing.js';
import { kitFull } from './levels.js';
import { buyMachine, canBuy, machine, tuneRow } from './machines.js';
import { dockX, syncRoombas } from './crew/roomba.js';
import { registerRows } from './works.js';
import { registerBoard } from './boardrows.js';

const roombas = () => S.roombas | 0;

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
  },
  // The closet's machine, bought as a count with an end: up to three roombas,
  // each put together on its own slot of the dock (DESIGN.md, "The janitors'
  // roomba"). The first is the machine's purchase -- it caps the closet at
  // the one janitor who minds them (`buyMachine`) -- and each after it one
  // more on the dock. Gated like every machine: the closet's one rung (the
  // second cap) and its caps worn.
  {
    key: 'roomba',
    kind: 'machine', site: 'outhouse',
    at: () => dockX(Math.min(roombas(), ROOMBA_MAX - 1)) + ROOMBA_W * P / 2,
    name: 'a roomba',
    note: () => 'drives to the mess on the open yard and brings it home; one janitor minds them, and they smoke',
    rung: roombas,
    rungs: () => ROOMBA_MAX,
    bill: () => ROOMBA_BILLS[Math.min(roombas(), ROOMBA_MAX - 1)],
    buy: () => {
      if (!machine('roomba')?.bought) buyMachine('roomba');
      S.roombas = roombas() + 1;
      rebalance();
      syncRoombas();
    },
    show: () => S.outhouseOpen && (roombas() > 0 ||
      canBuy('roomba', () => (S.looPosts ?? LOO_POSTS) >= 2, () => kitFull(JOB.JANITOR)))
  },
  // Their ladder, three rungs of red like every machine's: every roomba's
  // intake at once.
  tuneRow('roomba', 'roomba suction',
          () => `the roombas take in ${MACHINE_TUNE}x faster`, 'outhouse')
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
