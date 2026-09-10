// The scrubbing house: the building, the bodies in it, and its board.
//
// The air itself -- what fills it, what comes back down, what the numbers are --
// lives in `smog.js`. This is the place on the ground you walk up to, the crew
// standing in it, and the two things you can buy there.
//
// It is a house rather than a purchase on purpose. An upgrade that quietly
// cleaned the sky would be a number you buy once and never think about; a house
// with nobody in it is a shed, visibly doing nothing, and the bodies you put in
// it are bodies not on the rock. That is the cost, and it is a decision you can
// take back whenever you like -- the same bargain every other station makes.

import { WORKER, FARM_WALK, SCRUB_DUST, RECYCLE_SHARDS, SCRUB_PUMP, SCRUB_FOLDS,
         FAN_COST, FAN_RATE, RUNGS } from './config.js';
import { fanPull } from './smog.js';
import { S, scrub } from './state.js';
import { walkY } from './world.js';
import { idle, assign, rungCost } from './upgrades.js';
import { airRows, airSection } from './airboard.js';
import { CRAFT_ROW, berthFor, stepRider, dismount } from './balloon.js';
import { registerRows } from './works.js';
import { TYPE } from './jobs.js';

export function newPurifier() {
  return { type: TYPE.PURIFY, goal: 'to', x: scrub.x, y: 0 };
}

// the door, and who is through it
export const scrubDoor = () => scrub.x + scrub.w * 0.5;
export const inHouse = w => w.type === TYPE.PURIFY && w.goal === 'in';

// How many are actually in there. Not `S.purifiers`: that counts everybody the
// house has been given, and one of them may still be crossing the yard. Nothing
// comes out of the sky until they are through the door.
export const inScrub = () => S.workers.filter(inHouse).length;

// The bellows on the front, in folds of stroke. It breathes while there is
// somebody in there and it is shut when there is not -- and an empty house adds
// nothing at all rather than being caught up to a clock that ran on without it.
//
// It quickens with the roster, to the same cap the lab's chimney smokes on: a
// station whose only two readings are working and not working is a station with a
// switch on the front of it, and every other worked place in this yard says how
// hard as well. Past four bodies the cap holds it, because past four the front
// would be telling you a number the roster underneath already tells you better.
//
// And it closes rather than stops. The moment the house empties, the folds fall
// shut one at a time -- towards nought whichever side of the stroke they were on,
// so the last thing it ever does is close -- instead of the picture cutting from
// wherever it was to the parked pose in a single frame. Watching a machine come
// to rest is half of knowing it has.
//
// Stepped here rather than worked out in drawScrub, where it lived. Everything
// else that moves in this yard is stepped in the sim or read off something that
// is: the smoke, the curtains, the wheel, the lab's bar off its own progress. A
// clock kept by the draw loop runs at double speed the moment anything draws the
// yard twice in a frame -- a thumbnail, a second pass, the harness -- and it
// cannot be stepped or asked about by anything that does not draw.
//
// Kept inside one stroke rather than counting up for ever: the stroke is a
// triangle six folds long, so fold four hundred thousand and fold four are the
// same picture and the only difference between them is how much of a float is
// left to say which.
export function stepScrub(dt) {
  if (!S.scrubOpen) return;
  const step = SCRUB_PUMP * dt / 1000, cycle = SCRUB_FOLDS * 2;
  const n = Math.min(4, inScrub());
  if (n) { S.pumpAt = (S.pumpAt + step * n) % cycle; return; }
  if (!S.pumpAt) return;
  // shutting: the near half of the triangle runs back down to nought, the far
  // half runs on to the end of the stroke, and both of those are the folds
  // closing rather than opening
  if (S.pumpAt <= SCRUB_FOLDS) S.pumpAt = Math.max(0, S.pumpAt - step);
  else S.pumpAt = Math.min(cycle, S.pumpAt + step) % cycle;
}

export function stepPurifier(w) {
  if (w.goal === 'in') return;                   // through the door, out of sight

  // Some of them are not going into the house at all. A body whose berth is a
  // craft walks to the mast instead and gets into a basket standing on the
  // ground -- see `stepRider`, which is the whole of the boarding.
  const berth = berthFor(w);
  if (berth >= 0) { stepRider(w, berth); return; }
  // ...and one that has come off a craft is going back to the door, so whatever
  // it was riding is let go of here rather than left on the body to be believed
  // by something else later.
  if (w.craft != null) dismount(w);

  w.y = walkY(w.x + WORKER / 2);
  const d = scrubDoor() - WORKER / 2 - w.x;
  if (Math.abs(d) < 1) { w.goal = 'in'; return; }
  w.x += Math.sign(d) * Math.min(FARM_WALK, Math.abs(d));
}

export const SCRUB_UPGRADES = [
  {
    // The house was built to answer hand labour, and the machines out-dirty it
    // several times over and never stop. Without a ladder of its own it stops
    // being an answer at exactly the point the yard is worth having one.
    key: 'fan',
    kind: 'rung', site: 'scrub',
    name: 'the fan',
    unit: 'motes/s',
    pct: true,
    rung: () => S.fanLevel,
    from: () => fanPull(),
    to: () => fanPull() * 1.25,
    // On the ordinary rung curve. It climbed three quarters again a rung on its
    // own steeper rate, which is the arithmetic of a row meant to be bought for
    // ever on a ladder that ends at five.
    cost: () => rungCost(FAN_COST, S.fanLevel),
    currency: 'shard',
    buy: () => { S.fanLevel++; },
    show: () => S.scrubOpen && S.fanLevel < RUNGS
  },

  // Who is standing in it, on the board that belongs to it -- the same row the
  // lab has, for the same reason: you are here, and walking back to the bench to
  // staff the place you are standing in is a walk for nothing.
  // No row for who is in it. It is a shed with a fan in it -- `capOf` has said so
  // since the day it was built -- so the stepper only ever went between nought
  // and one, and nought is a house you have paid for and switched off. It staffs
  // itself while it is standing; see `rebalance`.
  // The reading, over the row that decides what to do about it: how many bodies
  // go in here is the one thing anybody does about that number, and a reading you
  // can act on belongs where you act on it.
  ...airRows(),
  // The craft the house sells. A ladder on the board of the building that owns
  // the number, which is what a rung is for; see balloon.js.
  CRAFT_ROW,
  {
    key: 'recycler',
    // A fitting the house's own body puts in, which is the house not scrubbing
    // while it happens.
    kind: 'place', site: 'scrub',
    name: 'the recycler',
    // What it is for. A row that says "recycler" and nothing else is a row you
    // have to buy to find out about.
    note: () => 'replaces the filters: what it catches comes back as pebbles',
    cost: () => RECYCLE_SHARDS,
    currency: 'shard',
    buy: () => { S.recycler = true; S.dirty = true; },
    show: () => S.scrubOpen && !S.recycler
  }
];

export const SCRUB_SECTIONS = [
  airSection(),
  { title: 'equipment', keys: ['fan', 'balloon', 'recycler'] }
];

// what it costs to put the place up at all
// Dust, like every other building. It was cores back when a core was what a
// building cost; a core buys the one thing nothing else can.
export const scrubCost = () => SCRUB_DUST;

// and the yard is told what these rows are, so a work coming back out of a
// save knows which row it belongs to. See `registerRows` in works.js.
registerRows(SCRUB_UPGRADES);
