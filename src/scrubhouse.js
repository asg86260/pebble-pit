// The scrubbing house: the building, the bodies in it, and its board.
//
// The air itself lives in `smog.js`. This is the place on the ground you walk
// up to, the crew standing in it, and what you can buy there. It is a house
// rather than a purchase because the bodies in it are bodies not on the rock
// (DESIGN.md).

import { WORKER, FARM_WALK, SCRUB_DUST, RECYCLE_SHARDS, SCRUB_PUMP, SCRUB_FOLDS, BALLOON_RUNGS } from './config.js';
import { tierRows, named } from './upgrades/tiers.js';
import { fanPull } from './smog.js';
import { S, scrub } from './state.js';
import { walkY } from './world.js';

import { airRows, airSection } from './airboard.js';
import { CRAFT, craftCost, buyCraft, berthFor, stepRider, dismount } from './balloon.js';
import { registerRows } from './works.js';
import { TYPE } from './jobs.js';

export function newPurifier() {
  return { type: TYPE.PURIFY, goal: 'to', x: scrub.x, y: 0 };
}

// the door, and who is through it
export const scrubDoor = () => scrub.x + scrub.w * 0.5;
export const inHouse = w => w.type === TYPE.PURIFY && w.goal === 'in';

// Not `S.purifiers`: that counts everybody the house has been given, and one
// may still be crossing the yard. Nothing comes out of the sky until they are
// through the door.
export const inScrub = () => S.workers.filter(inHouse).length;

// The bellows on the front, in folds of stroke. It breathes while somebody is
// in there, quickening with the roster to a cap of four, and an empty house
// adds nothing rather than catching up to a clock that ran on without it.
//
// It closes rather than stops: the folds fall shut toward nought from
// whichever side of the stroke they are on, so the last thing it does is close.
//
// Stepped in the sim, not in drawScrub: a clock kept by the draw loop runs at
// double speed the moment anything draws the yard twice in a frame. Kept
// inside one stroke rather than counting up forever, so a float never runs
// out of precision to say which fold it is on.
export function stepScrub(dt) {
  if (!S.scrubOpen) return;
  const step = SCRUB_PUMP * dt / 1000, cycle = SCRUB_FOLDS * 2;
  const n = Math.min(4, inScrub());
  if (n) { S.pumpAt = (S.pumpAt + step * n) % cycle; return; }
  if (!S.pumpAt) return;
  // shutting: the near half of the triangle runs back down to nought, the far
  // half runs on to the end of the stroke; both are the folds closing
  if (S.pumpAt <= SCRUB_FOLDS) S.pumpAt = Math.max(0, S.pumpAt - step);
  else S.pumpAt = Math.min(cycle, S.pumpAt + step) % cycle;
}

export function stepPurifier(w) {
  if (w.goal === 'in') return;                   // through the door, out of sight

  // A body whose berth is a craft walks to the mast instead and boards a
  // basket standing on the ground (`stepRider`).
  const berth = berthFor(w);
  if (berth >= 0) { stepRider(w, berth); return; }
  // One that has come off a craft lets go of it here, rather than leaving it
  // on the body to be believed by something else later.
  if (w.craft != null) dismount(w);

  w.y = walkY(w.x + WORKER / 2);
  const d = scrubDoor() - WORKER / 2 - w.x;
  if (Math.abs(d) < 1) { w.goal = 'in'; return; }
  w.x += Math.sign(d) * Math.min(FARM_WALK, Math.abs(d));
}

// The house's own ladder, in bands (CLAUDE.md, "Decided"): the machines
// out-dirty hand labor several times over, and without a ladder the house
// stops being an answer at exactly the point the yard is worth having one.
const FAN = tierRows({
  field: 'fanLevel',
  unit: 'motes/s', pct: true, does: 'scrub',
  value: lvl => fanPull(lvl),
  site: 'scrub',
  show: () => S.scrubOpen,
  bands: named('fan', 'fan power')
});

// The craft the house sells: a finite ladder on the building that owns the
// number. Written here rather than in balloon.js because this list reads it
// at load, and balloon.js and this file are in one import cycle -- a row
// read across the cycle at load is a TDZ error whichever way the entry
// happens to walk it. The calls are wrapped for the same reason.
const CRAFT_ROW = {
  key: 'balloon',
  // Built at the scrubbing house, where it is moored, in a machine's time.
  kind: 'machine', site: 'scrub',
  name: 'the balloon',
  note: () => 'rides the sky and drops what it catches under itself',
  rung: () => CRAFT.length,
  cost: () => craftCost(),
  currency: 'dust',
  buy: () => buyCraft(),
  show: () => S.scrubOpen && CRAFT.length < BALLOON_RUNGS
};

export const SCRUB_UPGRADES = [
  ...FAN,

  // No row for who is in it: it is a shed with a fan in it (`capOf`), so it
  // staffs itself while it is standing (`rebalance`). The sky's reading sits
  // over the rows that decide what to do about it.
  ...airRows(),
  // The craft the house sells; see balloon.js.
  CRAFT_ROW,
  {
    key: 'recycler',
    // A fitting the house's own body puts in, so the house is not scrubbing
    // while it happens.
    kind: 'place', site: 'scrub',
    name: 'the recycler',
    note: () => 'replaces the filters: what it catches comes back as pebbles',
    cost: () => RECYCLE_SHARDS,
    currency: 'shard',
    buy: () => { S.recycler = true; },
    // Priced in ore, so not before the quarry stands.
    show: () => S.scrubOpen && S.quarryOpen && !S.recycler
  }
];

export const SCRUB_SECTIONS = [
  airSection(),
  { title: 'equipment', keys: ['fan', 'balloon', 'recycler'] }
];

// Dust, like every other building: a core buys the one thing nothing else can.
export const scrubCost = () => SCRUB_DUST;

// So a work coming back out of a save knows which row it belongs to
// (`registerRows` in works.js).
registerRows(SCRUB_UPGRADES);
