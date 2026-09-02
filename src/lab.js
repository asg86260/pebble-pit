// The lab: where shards and spores and a body's time turn into pace.
//
// The bench sells you *more* -- another worker, another body on the rock. The
// lab sells you *faster*, across the whole operation at once, and it is the only
// place a multiplier lives.
//
// Nothing here is bought outright. Paying starts a piece of research; what
// finishes it is somebody standing in the lab doing the work. So the lab
// competes for the crew with the rock, the quarry and the plots, which is the
// one real question this game asks: who is doing what.
//
// A lab standing EMPTY is the one exception, and it is not about the lab: a
// station with nobody at all on its job is lent a hand by the yard, because a
// purchase that can never start is money taken for nothing said (see
// `busyBuilderSites` in works.js). Put one labber in and the lab is the
// labber's again -- the yard does not cover for a gang that is merely busy. Everything it sells is a rate: a pixel of rock is
// still worth exactly one dust wherever it came from, which is a rule the game
// keeps, so growth has to come from doing the same work sooner.

import { S, lab } from './state.js';
import { puff } from './puff.js';
import { assign, idle, rebalance, rungCost } from './upgrades.js';
import { walkY } from './world.js';
import { now } from './clock.js';
import { P, WORKER, FARM_WALK, LAB_EFFORT, LAB_WORK, LAB_IDLE_MS,
         SMOKE_MS, SMOKE_LIFE, SMOKE_RISE, PUFF_MOTES, PUFF_SPREAD,
         BENCH_KIT_COST, BENCH_KIT_RATE, LAB_ROOM_COST, RUNGS } from './config.js';
import { rand } from './rng.js';
import { registerRows, registerSite, worksAt, abandonAt } from './works.js';

// Each level is a quarter again on top. Four ladders, deliberately few: three
// currencies and a wall of percentages is where cozy turns into a spreadsheet.
export const STEP = 1.25;

// each multiplier stands on its own, and each has an end -- `RUNGS` rungs, like
// every other ladder in the game.
//
// It used to have none. The price went up nine tenths a level and that was the
// whole of the limit, which is the arithmetic of a row meant to be bought for
// ever: you stop when the number gets silly, at a rung nobody wrote down, and
// the board could not tell you how far along you were because there was no along
// to be far. Four ladders that end are four things to *finish*, and finishing
// them is what the rest of the yard is waiting on.
//
// Clamped where it is read rather than only where it is bought, so a save from
// before the ceiling -- which may hold any level at all -- reads as a finished
// ladder rather than as a multiplier nothing else in the game agrees with.
export const levelOf = k => Math.min(RUNGS, S.mult[k] || 0);
export const mult = k => Math.pow(STEP, levelOf(k));

// what a piece of research asks of the crew, in worker-seconds
// Anything without a field of its own -- the readout is the only one -- is a
// plain piece of work at the base effort. Without this it asked for `S.mult`
// under `undefined`, which is NaN worker-seconds: a piece of research that could
// never be finished and never even properly started.
export const workFor = key => Math.round(LAB_WORK * Math.pow(1.35, levelOf(FIELD[key])));

// How fast a body at the bench works, in worker-seconds a second.
//
// The lab's own ladder, and the one it never had: every other station in the
// yard can be made quicker at what it does, and the lab -- which is what stands
// between you and every other multiplier in the game -- worked at exactly the
// pace it did on the first day for the whole run. A quarter again a rung, the
// same step every ladder in here takes.
export const labPace = () => LAB_EFFORT * Math.pow(STEP, S.labKitLevel || 0);

// How many pieces the lab can have on the go, which is how many benches are in
// it. A room with two benches in it can look into two things, with a body at
// each -- see `capOf`, which is what actually lets the second body in.
export const labRooms = () => Math.max(1, S.labRooms || 1);

// ...and that is the whole of what the lab has to say about itself. A bench is
// a place a work can be on the go, and the lab's ladder is how fast the body at
// it works, and works.js does the rest -- the clock, the bar, the one-per-bench
// rule, the save. The lab used to run its own building site behind the door:
// `S.research`, `S.research2`, a start, a step, a progress and a bar, every one
// of them a second copy of something works.js already had.
registerSite('lab', { room: labRooms, effort: labPace, started: () => begin() });

// The pieces on the go, in order.
export const onTheGo = () => worksAt('lab');
export const roomFree = () => onTheGo().length < labRooms();

const FIELD = { labswing: 'swing', labhaul: 'haul', labcave: 'quarry', labtend: 'tend' };

// Start one. One to a bench, and a lab with one bench in it does one thing.
//
// And it calls back whoever let themselves out. A body that walked out of an
// empty lab did so because there was nothing to do in it; the moment there is,
// the reason it left has gone. Making you walk back to the roster and put the
// same people back in is asking you to undo something the game did on its own.
//
// Only the ones the lab itself sent home, and only if they are still spare: a
// body you have since put on the rock stays on the rock.
export function begin() {
  // Whoever let themselves out comes back: a body that walked out of an empty
  // lab did so because there was nothing to do in it, and the moment there is,
  // the reason it left has gone. Only the ones the lab itself sent home, and
  // only if they are still spare.
  while (S.labLeft > 0 && idle() > 0) { assign('labbers', 1); S.labLeft--; }
  S.labLeft = 0;
  S.dirty = true;
}


// Nothing in the game takes a body off the lab, so a lab that has finished its
// research is a room of people standing about in it for good. They let
// themselves out: after LAB_IDLE_MS of nothing to work on, one walks out and
// goes back to carrying dust, and the next one waits its turn, so a lab empties
// as people drifting off rather than as a room emptying in a frame.
//
// The clock only runs on somebody who is actually inside. A body still crossing
// the yard to get there has not spent a moment doing nothing yet, and turning it
// round halfway is not a decision anybody watching would recognise.
//
// And it is remembered. Starting a new piece of research calls back exactly the
// bodies the lab let out -- see `begin`. It used not to, on the grounds that
// being staffed without asking is a surprise; but the lab emptying itself was
// the game's own tidying, and making you go and undo it before anything can
// happen is a chore rather than a decision.
function letIdleGo() {
  if (onTheGo().length || !S.workers.some(indoors)) { S.labIdleAt = 0; return; }
  if (!S.labIdleAt) { S.labIdleAt = now(); return; }
  if (now() - S.labIdleAt < LAB_IDLE_MS) return;
  S.labIdleAt = 0;
  S.labLeft++;                     // remembered, so starting something fetches it back
  assign('labbers', -1);
}

// One frame of it. Nothing happens without bodies in the lab -- that is the
// whole of the mechanic, and why the row says nothing is moving when it is not.
// What a finished piece of research does. Its own function because there are two
// ways to get here -- the crew working it through, and a check that wants the
// thing it unlocks without the worker-seconds -- and a rule about what a piece of
// research *is* should not have two copies that can disagree.
export function finish(key) {
  // the one piece that is not a multiplier finishes by turning a readout on
  if (key === 'labair') S.seenAir = true;
  else if (FIELD[key]) S.mult[FIELD[key]]++;
  S.dirty = true;
}

// What the lab does when one of its works lands, which is not what the row
// does: the row's own `buy` is the multiplier going up. This is the announcing,
// and the lab is the one site that needs any -- its work happens behind a door,
// so the bar everybody else watches was never the news here. Wired in game.js
// through `setDone`.
export function labFinished(site, key) {
  if (site !== 'lab') return;
  S.labDone = key;                 // a mark over the lab until somebody looks
  cough();                         // and one last plume off the chimney
}

// One frame of the lab. There is no research stepping in here any more --
// `stepWorks` does that for every site in the game, the lab included -- so what
// is left is the room itself: whether anybody is in it, which the smoke reads.
export function stepLab() {
}

// The chimney stops the moment the work is done, which is a signal made of
// nothing happening. So finishing gets a puff of its own: a plume already
// strung out up the sky, so it reads as the last of it rather than the start.
// Where the smoke leaves from: the middle of the flue render.js draws, which
// stands on cells two, three and four of the front. It was 0.28 of the width --
// right by luck at fourteen cells across, and wrong the moment the lab was
// sixteen, because the flue is a place on the building and not a share of it.
const FLUE_MID = P * 3.5;

const DONE_PUFFS = 8;
function cough() {
  for (let i = 0; i < DONE_PUFFS; i++) S.smoke.push({
    x: lab.x + FLUE_MID + (rand() - 0.5) * P * 2,
    y: lab.y - i * P,
    drift: (rand() - 0.5) * 0.35,
    t: i * SMOKE_LIFE / (DONE_PUFFS * 1.6)
  });
}

// what finished, in the words the row used
export const doneName = () => {
  const u = LAB_UPGRADES.find(x => x.key === S.labDone);
  return u ? `${u.name} done` : 'research done';
};

// and reading it is what clears the mark
export function markLabSeen() {
  if (!S.labDone) return;
  S.labDone = null;
  S.dirty = true;
}

// A body in the lab walks to the door and goes in. There is nothing to watch
// after that, on purpose: what a lab looks like from outside is a chimney.
export function newLabber() {
  return {
    type: 'labber', goal: 'to',
    x: lab.x, y: 0
  };
}

// The door, and who is through it. It is the middle of the front, because that is
// where render.js cuts the way in -- the same DOOR_W by DOOR_H doorway the school,
// the casino, the scrubbing house and the crew's own rooms have. It used to be
// 0.62 of the way across, which was a share of the front and not a place: the
// lab had no door drawn on it at all then, so the number could not be wrong, and
// the moment one was cut it was, by a fifth of the building. Every labber walked
// up to the wall beside it and vanished.
export const labDoor = () => lab.x + lab.w / 2;
export const indoors = w => w.type === 'labber' && w.goal === 'in';

// How many are actually in there working. It is not `S.labbers`: that counts
// everybody the lab has been given, and one of them may still be halfway across
// the yard on its way over. Nobody does the work until they are through the door.
export const inLab = () => S.workers.filter(indoors).length;

// A puff off the chimney, and only when there is someone in there working on
// something. The chimney is the whole of the signal, because the crew are inside
// where you cannot see them.
export function stepSmoke(now, dt) {
  const on = inLab();
  if (onTheGo().length && on && now >= S.smokeAt) {
    puff(lab.x + FLUE_MID, lab.y);
    // Longer between puffs than it used to be, because there is a great deal
    // more in each one: the same amount of smoke, arriving as smoke rather than
    // as a dotted line.
    S.smokeAt = now + SMOKE_MS * 2.2 / Math.min(4, on);
  }
  for (let i = S.smoke.length - 1; i >= 0; i--) {
    const p = S.smoke[i];
    p.t += dt / 1000;
    p.y -= p.rise ?? SMOKE_RISE;
    p.x += p.drift;
    if (p.t > (p.life ?? SMOKE_LIFE)) S.smoke.splice(i, 1);
  }
}

export function stepLabber(w) {
  if (w.goal === 'in') return;                 // through the door, out of sight

  w.y = walkY(w.x + WORKER / 2);
  const d = labDoor() - WORKER / 2 - w.x;
  if (Math.abs(d) < 1) { w.goal = 'in'; return; }
  w.x += Math.sign(d) * Math.min(FARM_WALK, Math.abs(d));
}

export const LAB_UPGRADES = [
  {
    // The lab's own ladder, and the one it never had. Every other station can be
    // made quicker at what it does; the lab -- which stands between you and every
    // other multiplier in the game -- worked at the pace it did on the first day
    // for the whole run.
    key: 'labkit',
    name: 'better instruments',
    unit: 'work/s',
    pct: true,
    rung: () => S.labKitLevel,
    from: () => labPace(),
    to: () => labPace() * STEP,
    // `rungCost` like every other ladder in the game. It used to climb four
    // fifths again a rung on a rate of its own, which is the arithmetic of a row
    // meant to be bought for ever -- and this ladder ends at five.
    cost: () => rungCost(BENCH_KIT_COST, S.labKitLevel),
    currency: 'shard',
    kind: 'rung', site: 'lab',
    buy: () => { S.labKitLevel++; },
    // And not before a shard has been seen: a row priced in stone is a row
    // that reads as broken to a yard that has never dug any -- see the note
    // over `pick` in upgrades.js, which is the same rule for the same reason.
    show: () => S.labOpen && S.seenShard && S.labKitLevel < RUNGS
  },
  {
    // A second bench, which is a *place* rather than a rung: it is the only thing
    // in this game that widens a station that has always held one. What it buys
    // is a second thing being looked into, with a body at each -- not two people
    // leaning over the same bench, which is a queue and is what `capOf` has
    // always refused.
    key: 'labroom',
    name: 'a second bench',
    from: () => labRooms(),
    to: () => labRooms() + 1,
    cost: () => LAB_ROOM_COST,
    currency: 'core',
    // A bench is a place, and it is built where the other one stands.
    kind: 'place', site: 'lab',
    buy: () => { S.labRooms = 2; rebalance(); },
    show: () => S.labOpen && labRooms() < 2
  },
  // There is no row here for who is standing in it any more. The lab holds one
  // body and has one thing to do with it, so the stepper had one useful setting
  // and asked you to go and find it. It takes somebody when there is research on
  // and hands to spare, and gives them back when the bench is clear -- see
  // `rebalance`.
  {
    key: 'labswing',
    name: 'swing speed',
    pct: true,
    rung: () => levelOf('swing'),
    from: () => mult('swing'),
    to: () => mult('swing') * STEP,
    cost: () => rungCost(3, levelOf('swing')),
    currency: 'shard',
    kind: 'rung', site: 'lab',
    // What it costs in somebody's time is the piece of research itself --
    // the same worker-seconds the lab has always asked for, climbing with
    // the rung the way the price does.
    work: () => workFor('labswing'),
    buy: () => finish('labswing'),
    // A finished ladder stays on the board saying so, like every other one --
    // but not before a shard has been seen, or the lab is a board asking for a
    // currency a fresh yard has never been shown. See A8 in feedback3.md.
    show: () => S.labOpen && S.seenShard
  },
  {
    key: 'labhaul',
    name: 'carry speed',
    pct: true,
    rung: () => levelOf('haul'),
    from: () => mult('haul'),
    to: () => mult('haul') * STEP,
    cost: () => rungCost(4, levelOf('haul')),
    currency: 'shard',
    kind: 'rung', site: 'lab',
    // What it costs in somebody's time is the piece of research itself --
    // the same worker-seconds the lab has always asked for, climbing with
    // the rung the way the price does.
    work: () => workFor('labhaul'),
    buy: () => finish('labhaul'),
    // A finished ladder stays on the board saying so, like every other one.
    show: () => S.labOpen && S.seenShard
  },
  {
    key: 'labcave',
    name: 'quarry speed',
    pct: true,
    rung: () => levelOf('quarry'),
    from: () => mult('quarry'),
    to: () => mult('quarry') * STEP,
    cost: () => rungCost(3, levelOf('quarry')),
    currency: 'spore',
    kind: 'rung', site: 'lab',
    // What it costs in somebody's time is the piece of research itself --
    // the same worker-seconds the lab has always asked for, climbing with
    // the rung the way the price does.
    work: () => workFor('labcave'),
    buy: () => finish('labcave'),
    // A finished ladder stays on the board saying so, like every other one --
    // but not before the quarry exists to have a speed at all. This was the
    // reported case: the lab standing before the quarry, selling a row named
    // for a hole that has not been dug yet. See A8 in feedback3.md.
    show: () => S.labOpen && S.quarryOpen
  },
  // Not a multiplier: a pair of eyes. Everything else the lab sells makes a
  // number bigger; this makes a number *visible*. The sky fills whether you can
  // read it or not, and playing the scrubbing house against the rock without
  // knowing either rate is playing it blind -- so the readout is the piece of
  // research that turns a guess into a decision.
  {
    key: 'labair',
    name: 'watch the sky',
    // What it tells you, and not what it leads to. A row that names the building
    // it unlocks is the game handing you the end of the thread: the point of this
    // one is that you buy it because the sky is filling and you want to know how
    // fast, and what that knowledge is worth is a thing to find out.
    note: () => 'tells you whether the sky is filling or emptying',
    cost: () => 9,
    currency: 'spore',
    kind: 'rung', site: 'lab',
    work: () => workFor('labair'),
    buy: () => finish('labair'),
    show: () => S.labOpen && !S.seenAir && S.seenSpore
  },
  {
    key: 'labtend',
    name: 'plot speed',
    pct: true,
    rung: () => levelOf('tend'),
    from: () => mult('tend'),
    to: () => mult('tend') * STEP,
    cost: () => rungCost(4, levelOf('tend')),
    currency: 'spore',
    kind: 'rung', site: 'lab',
    // What it costs in somebody's time is the piece of research itself --
    // the same worker-seconds the lab has always asked for, climbing with
    // the rung the way the price does.
    work: () => workFor('labtend'),
    buy: () => finish('labtend'),
    // A finished ladder stays on the board saying so, like every other one --
    // but not before a spore has been seen. See A8 in feedback3.md.
    show: () => S.labOpen && S.seenSpore
  }
];

export const LAB_SECTIONS = [
  // The lab's own two, first, because they are about this room rather than about
  // somewhere else in the yard.
  { title: 'the lab', keys: ['labkit', 'labroom'] },
  { title: 'the work', keys: ['labswing', 'labhaul'] },
  { title: 'the ground', keys: ['labcave', 'labtend'] },
  { title: 'the air', keys: ['labair'] }
];

// --- the books --------------------------------------------------------------
// A rate nobody can see is a rate nobody can weigh a purchase against. These are
// smoothed, because a raw per-second count of something that arrives in lumps
// reads as noise.

// What the books watch. All of these only ever go up: a rate is what the
// operation *made*, and reading it off the balance meant a big purchase showed
// as forty thousand dust a minute of negative production.
const WATCH = ['banked', 'shards', 'spores', 'cores'];
const EASE = 0.25;                         // how fast the reading follows reality

export const rates = { banked: 0, shards: 0, spores: 0, cores: 0 };
let last = null, lastAt = 0;

// after a reset the books are meaningless: a counter going to zero is not a
// negative rate
export function resetRates() {
  last = null;
  for (const k of WATCH) rates[k] = 0;
}

export function sampleRates(now) {
  if (!last) { last = snapshot(); lastAt = now; return; }
  const dt = now - lastAt;
  if (dt < 500) return;                    // often enough to feel live, rarely enough to be steady

  const nowVals = snapshot();
  for (const k of WATCH) {
    const perMin = (nowVals[k] - last[k]) * 60000 / dt;
    rates[k] += (perMin - rates[k]) * EASE;
    if (Math.abs(rates[k]) < 0.001) rates[k] = 0;
  }
  last = nowVals;
  lastAt = now;
}

const snapshot = () => ({ banked: S.banked, shards: S.shards, spores: S.spores, cores: S.cores });

// and the yard is told what these rows are, so a work coming back out of a
// save knows which row it belongs to. See `registerRows` in works.js.
registerRows(LAB_UPGRADES);
