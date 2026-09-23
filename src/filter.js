// The air filter: the shed the balloons are sold from and moor beside, and
// the gauge on its wall.
//
// It takes nothing out of the sky itself; the balloons do all of that
// (balloon.js, smog/craft.js). The shed is where you buy them and their power,
// the gauge that reads the sky, and the row of posts they moor at.

import { WORKER, COMMUTE_PACE, rungValue, FILTER_DUST, RECYCLE_SHARDS, BALLOON_RUNGS, DIAL_STEPS, DIAL_EASE, DIAL_GIVE } from './config.js';
import { tierRows, named } from './upgrades/tiers.js';
import { balloonPull, murk } from './smog.js';
import { S, filter } from './state.js';
import { walkY } from './world.js';
import { climbTo } from './route.js';

import { CRAFT, craftCost, buyCraft, berthFor, stepRider, dismount } from './balloon.js';
import { registerRows } from './works.js';
import { JOB, TYPE } from './jobs.js';
import { staffDoor } from './staffing.js';

export function newPurifier() {
  return { type: TYPE.PURIFY, goal: 'to', x: filter.x, y: 0 };
}

// the shed's door: where a hand with no balloon to go to waits
export const filterDoor = () => filter.x + filter.w * 0.5;

export function stepFilter(dt) {
  if (!S.filterOpen) return;
  stepDial(dt / 1000);
}

// The dial reads what the clouds are drawn from, so the two cannot disagree.
// The needle eases toward the reading and moves to another line of cells only
// once the reading is well past its own, so a sky sitting on a boundary does
// not set it trembling.
function stepDial(secs) {
  S.dialAt += (murk() - S.dialAt) * Math.min(1, DIAL_EASE * secs);
  const want = S.dialAt * (DIAL_STEPS - 1);
  if (Math.abs(want - S.dialStep) > DIAL_GIVE) S.dialStep = Math.round(want);
}

// A filter hand is a balloon's rider: to its craft's post, and aboard
// (`stepRider`). One with no craft to go to -- `capOf` should not let there
// be one -- waits at the shed's door rather than inside it, since there is
// nothing inside to do.
export function stepPurifier(w) {
  const berth = berthFor(w);
  if (berth >= 0) { stepRider(w, berth); return; }
  if (w.craft != null) dismount(w);
  w.y = climbTo(w, walkY(w.x + WORKER / 2));
  const d = filterDoor() - WORKER / 2 - w.x;
  if (Math.abs(d) >= 1) w.x += Math.sign(d) * Math.min(COMMUTE_PACE, Math.abs(d));
}

// Balloon power, in bands (CLAUDE.md, "Decided"): the machines out-dirty hand
// labor several times over, and without a ladder the balloons stop being an
// answer at exactly the point the yard is worth having them. One ladder for
// the whole fleet: every craft pulls at it.
// And how fast they go from one cloud to the next: a balloon draws only while
// it hangs at a cloud, so the trips between are time it is not cleaning.
const SPEED = tierRows({
  field: 'balloonSpeedLevel',
  unit: 'x', does: 'fly',
  value: lvl => rungValue('balloonspeed', lvl),
  site: 'filter',
  show: () => S.filterOpen,
  bands: named('balloonspeed', 'balloon speed')
});

const FAN = tierRows({
  field: 'powerLevel',
  unit: 'motes/s', pct: true, does: 'filter',
  value: lvl => balloonPull(lvl),
  site: 'filter',
  show: () => S.filterOpen,
  bands: named('power', 'balloon power')
});

// The craft the shed sells: a finite ladder on the building that owns the
// number. Written here rather than in balloon.js because this list reads it
// at load, and balloon.js and this file are in one import cycle -- a row
// read across the cycle at load is a TDZ error whichever way the entry
// happens to walk it. The calls are wrapped for the same reason.
const CRAFT_ROW = {
  key: 'balloon',
  // Built at the air filter, where it is moored, in a machine's time.
  kind: 'machine', site: 'filter',
  name: 'the balloon',
  note: () => 'rides the clouds and lets what it catches fall under itself',
  rung: () => CRAFT.length,
  rungs: () => BALLOON_RUNGS,
  cost: () => craftCost(),
  currency: 'dust',
  // A craft is a place for one, and opens like a door: a spare body is sent
  // over to ride it (`staffDoor`).
  buy: () => { buyCraft(); staffDoor(JOB.PURIFY); },
  show: () => S.filterOpen && CRAFT.length < BALLOON_RUNGS
};

export const FILTER_UPGRADES = [
  ...FAN,
  ...SPEED,

  // No row for who is aboard: a craft is a place for one (`capOf`), so the
  // balloons staff themselves (`rebalance`). No row for the sky either: the
  // gauge on the shed's wall reads it, and its hover says the rest.
  // The craft the shed sells; see balloon.js.
  CRAFT_ROW,
  {
    key: 'recycler',
    // A fitting a spare hand puts in (`SITE_JOB`), like balloon power's rungs.
    kind: 'place', site: 'filter',
    name: 'the recycler',
    note: () => 'what the balloons catch comes down as pebbles instead of muck',
    cost: () => RECYCLE_SHARDS,
    currency: 'shard',
    buy: () => { S.recycler = true; },
    // Priced in ore, so not before the quarry stands.
    show: () => S.filterOpen && S.quarryOpen && !S.recycler
  }
];

export const FILTER_SECTIONS = [
  { title: 'equipment', keys: ['power', 'balloonspeed', 'balloon', 'recycler'] }
];

// Dust, like every other building: a core buys the one thing nothing else can.
export const filterCost = () => FILTER_DUST;

// So a work coming back out of a save knows which row it belongs to
// (`registerRows` in works.js).
registerRows(FILTER_UPGRADES);
