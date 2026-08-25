// The crew: who they are, where they stand and what they do with their hands.
//
// Miners take the rock off in layers; workers carry dust to the pit. A new kind
// of worker is a new `type` and a new branch in updateWorkers -- and, when the
// quarry and the farm arrive, its own file.

import { P, WORKER, CORE_SIZE, CORE_CELL, HAUL_MS, DANCE_BEAT, HAUL_EMPTY,
         DUCK_PACE, IDLE_BEAT, IDLE_STRIDE,
         COMMUTE_PACE, COMMUTE_SLOP, CLIMB_PACE, HOME_AFTER, HOME_WALK, ROCK_CLEAR } from './config.js';
import { S, floor, pit, bench } from './state.js';
import { at, put, colOf, bottomY } from './grid.js';
import { blocked, standOn, walkY, rockLeft, yardLeft, kitX } from './world.js';
import { boulderAlive, knockOff, rockTopY, cellPos, depthOf, refreshRockTops, dropZone } from './rock.js';
import { spawnChip, spawnSpoil, bell, aim } from './dust.js';
import { depthShade } from './grid.js';
import { bankDust, pitFull, pitRoom } from './pit.js';
import { minerMs, haulCap, haulSpeed, scoopMs, minerBite, hats, worn, spareKit, JOB_OF } from './upgrades.js';
import { stepQuarrier, newQuarrier, quarryFace, quarryFloor } from './quarry.js';
import { stepFarmhand, newFarmhand, bedX } from './farm.js';
import { stepLabber, newLabber, labDoor } from './lab.js';
import { now } from './clock.js';
import { doorAt } from './house.js';

// The crew take the hill off in layers. A miner does not stand in one spot and
// bore a shaft: it walks the top layer, striking the rock under its feet as it
// goes, so the crest comes off as a row and the next row is exposed underneath.
// It turns at the ends of the layer and turns before walking into a mate, so the
// gang works back and forth across the rock like a line of men on a bench.
const MINE_BAND = 3;      // cells below the peak still counted as the top layer
const ROAM_RANGE = 420;   // how far an idle worker will wander for no reason
const ROAM_PACE = 0.45;   // and how slowly it goes about it
const ROAM_ELBOW = WORKER * 1.4;   // how close two of them will stand
const MINER_WALK = 0.5;   // pixels a frame along the row


export function findPeak() {
  S.peakRow = S.gh;
  for (let c = 0; c < S.gw; c++) {
    if (S.rockTops[c] >= 0 && S.rockTops[c] < S.peakRow) S.peakRow = S.rockTops[c];
  }
}

const inBand = c =>
  c >= 0 && c < S.gw && S.rockTops[c] >= 0 && S.rockTops[c] <= S.peakRow + MINE_BAND;

const colAtX = x => Math.max(0, Math.min(S.gw - 1, Math.round((x - rockLeft()) / P)));

// the nearest column that is still part of the working layer
export function nearestInBand(from) {
  for (let d = 0; d < S.gw; d++) {
    if (inBand(from - d)) return from - d;
    if (inBand(from + d)) return from + d;
  }
  return from;
}

// somebody already working the stretch this one is about to walk into
export function elbowed(w, x) {
  for (const o of S.workers) {
    if (o === w || o.type !== 'miner') continue;
    if ((o.x - w.x) * w.dir <= 0) continue;             // behind it: not in the way
    if (Math.abs(o.x - x) < WORKER * 1.2) return true;
  }
  return false;
}

// Get out from under it. A body is in the way while any part of its square is
// over the ground the next rock is coming down on, and it leaves by whichever
// side it is nearer -- crossing under a falling rock to reach the far side is
// not getting out of the way. Returns whether it is still moving, so whatever
// the worker was doing waits until it is clear.
// Which side of a coming rock a spot is on: -1 clear to the left, 1 clear to the
// right, 0 under it. A body already ducked out is never 0.
const sideOf = (zone, x) => x + WORKER <= zone.from ? -1 : x >= zone.to ? 1 : 0;

// Would getting there mean walking under it? A rock is coming down between here
// and where this body wants to be, so the answer is to stand still and let it
// land -- not to set off and be shoved back by the duck every other frame, which
// is what used to happen: out, in, out, in, all the way down, and a body still
// half in the footprint when the rock arrived.
// And only while there is something overhead. The zone stands for the whole
// beat between rocks -- the crew's five seconds on the bare ground as well as
// the fall -- because a body has to be *out* of the footprint before the rock
// starts coming down. But standing still for all of it stopped the whole yard
// dead every time a rock finished: the dance is the miners' business, and a
// hauler halfway to the lip has no reason to wait on it. Nobody may cross while
// the rock is in the air; before that the ground is bare and they carry on.
const across = (zone, x, target) =>
  !!zone && S.rockFall > 0 && sideOf(zone, x) !== sideOf(zone, target);

function duck(w, zone) {
  if (!zone) return false;
  const mid = w.x + WORKER / 2;
  if (w.x + WORKER <= zone.from || w.x >= zone.to) return false;
  // A cell past the edge rather than exactly on it. The zone is worked out from
  // the size the coming rock *will* be, and that is a rounded number: a body
  // walked to the line lands a pixel inside it as often as not, and a body
  // stood with its shoulder against the rock does not read as out of the way.
  const out = mid < (zone.from + zone.to) / 2 ? zone.from - WORKER - P : zone.to + P;
  w.x += Math.sign(out - w.x) * Math.min(DUCK_PACE, Math.abs(out - w.x));
  return true;
}

// Where a body hired into the crew steps into the yard: the door of the shacks
// the crew live in. Somebody taken on now comes out of the place the crew come
// from and walks to the work, rather than appearing at it -- which is the whole
// of why the housing is there, and why the door is an address the housing keeps
// rather than a number this file holds a copy of.
export const hireSpot = () => doorAt();

// A body that has knocked off and gone in. It is the same idea as a labber
// through the door or a quarrier down the cut: out of sight, still counted, and
// still on the same job the moment it comes back out.
export const atHome = w => !!w.inside;
export const homeCount = () => S.workers.filter(atHome).length;

function newMiner() {
  return {
    type: 'miner', next: 0, lunge: 0,
    x: rockLeft() + Math.random() * S.gw * P, y: S.cy,
    dir: Math.random() < 0.5 ? -1 : 1,
    ph: Math.random() * Math.PI * 2,        // where in its wobble it starts
    sp: 0.5 + Math.random() * 0.9,          // how fast it sways
    wob: 0.05 + Math.random() * 0.10,       // how far it drifts round its seat
    rw: 0.4 + Math.random() * 0.9           // how much it drifts in and out
  };
}

function newHauler() {
  // Its feet are on the ground from the first frame. Every other job's step
  // function puts a new body down before anything looks at it, but a body put
  // straight back on to another job is walked from wherever it is standing --
  // and a placeholder height reads as one that has to climb down out of the sky.
  const { x } = hireSpot();
  return {
    type: 'hauler', x, y: walkY(x + WORKER / 2),
    carry: 0, next: 0, goal: 'seek', claim: -1, roamTo: null,
    // Its own legs and its own patience, for when it has nowhere to be. Six
    // bodies strolling at exactly one speed and standing about for exactly one
    // length of time is a marching band, not a yard at rest -- and it is the
    // same trick every other job here already uses to stop a gang reading as one
    // animation played six times.
    amble: 0.7 + Math.random() * 0.6,
    linger: 0.6 + Math.random() * 1.3
  };
}

// The order jobs are filled in, and how a body for one is made from nothing.
// Carrying comes last so that a spare body goes to a station that is short of
// one before it goes back to sweeping the yard.
const TYPES = ['miner', 'quarrier', 'farmhand', 'labber', 'hauler'];
const FACTORY = { miner: newMiner, quarrier: newQuarrier, farmhand: newFarmhand,
                  labber: newLabber, hauler: newHauler };

// Where each job is done, for a body on its way to it. Carrying has no station:
// the dust is wherever it fell, so somebody put on it is already at work.
function stationX(type) {
  if (type === 'miner') return S.cx - WORKER / 2;
  if (type === 'quarrier') return quarryFace();
  if (type === 'farmhand') return bedX(0);
  if (type === 'labber') return labDoor() - WORKER / 2;
  return null;
}

// Give a body its new job's own fields -- exactly the ones that job's factory
// hands out -- so from here on nothing can tell it from one made on the spot.
// Where it is standing is the one thing it keeps: it walked here. And what is on
// its head, which is a thing it is carrying rather than a field of the job.
function settle(w) {
  const hat = w.trained, of = w.kitOf;
  const fresh = FACTORY[w.type]();
  delete fresh.x;                  // where it is standing is where it walked to
  delete fresh.y;
  Object.assign(w, fresh);
  w.trained = hat;
  w.kitOf = of;
  w.legs = null;
  w.walkTo = null;
  w.walking = false;
}

// --- the kit walk -------------------------------------------------------------
// A hat is a thing lying on the ground until somebody goes and gets it. Nothing
// about it is instant: a body put on the rock walks over to where the helmets
// are, picks one up, and only then climbs the hill in it -- and a body taken off
// the rock walks back and puts it down before it goes anywhere else, because a
// carter who wandered off with the cart is a cart the lip has lost.
//
// So a commute is a list of legs rather than one destination. Each leg is
// somewhere to stand and one thing to do when you get there, and the last of
// them is always the work itself.
function nextLeg(w) {
  const leg = w.legs && w.legs.shift();
  if (!leg) { settle(w); return; }
  w.leg = leg.do;
  w.walkTo = leg.to;
  w.walking = true;
}

function arrive(w) {
  // put down where it was found, or picked up the same way -- and `kitOf`
  // travels with it, because what a body is wearing is a fact about the kit and
  // not about the job it happens to be on this second
  if (w.leg === 'drop') { w.trained = false; w.kitOf = null; }
  if (w.leg === 'wear') { w.trained = true; w.kitOf = w.wanting; w.wanting = null; }
  S.dirty = true;
  if (w.legs && w.legs.length) { nextLeg(w); return; }
  if (w.leg === 'back') { w.leg = null; w.legs = null; w.walkTo = null; w.walking = false; return; }
  settle(w);
}

// A body already at work whose station has a hat lying spare, and which is free
// to go and get it: hands empty, not walking anywhere, not indoors. One at a
// time per station, so buying four helmets is four trips rather than the whole
// gang filing down the hill at once.
const KIT_JOBS = ['miners', 'haulers', 'quarriers', 'farmhands'];

// somebody on that job who could go on an errand right now: hands empty, not
// already walking, and not indoors
const freeAt = (job, hatted) => S.workers.find(o =>
  JOB_OF[o.type] === job && !!o.trained === hatted && !o.walking &&
  !o.inside && !o.carry && !o.hasCore);

// Kit already spoken for by somebody on their way to it. Without this, two
// bodies put on the rock in the same breath both set off for the last helmet
// and one of them arrives at an empty stand.
const claimed = job => S.workers.filter(o => o.wanting === job).length;
export const kitFree = job => spareKit(job) - claimed(job);

function stepKit() {
  for (const job of KIT_JOBS) {
    if (S.workers.some(o => o.walking && o.fetching === job)) continue;   // one errand a station

    // A hat lying spare and somebody bare-headed to come and get it.
    if (kitFree(job) > 0) {
      const w = freeAt(job, false);
      if (w) { errand(w, job, 'wear'); continue; }
    }
    // Or the other way about: a head wearing kit the station does not own any
    // more. That cannot happen by playing -- hats are never sold -- but a save
    // from another shape of the game or a dev hook can leave one, and a body
    // walking about in a helmet nobody paid for is a helmet counted twice.
    if (worn(job) > hats(job)) {
      const w = freeAt(job, true);
      if (w) errand(w, job, 'drop');
    }
  }
}

// The kit, then straight back to the work -- and 'back' rather than 'work',
// because it never left the job and re-settling it would drop what it was doing.
function errand(w, job, what) {
  w.fetching = job;
  if (what === 'wear') w.wanting = job;
  w.legs = [{ to: kitX(job), do: what }, { to: stationX(w.type) ?? w.x, do: 'back' }];
  nextLeg(w);
}

// Put a body that has just been stood down onto a job that is short of one,
// where it stands. Its `type` changes at once rather than on arrival: `want`,
// `pickBed`, `elbowed` and `seatX` all filter on type, and somebody walking to a
// job is on that job as far as the books are concerned. What it does not do is
// any of the work, until it gets there.
function retask(w, type) {
  w.type = type;
  w.fetching = null;
  w.wanting = null;
  // Out of the house. A body that had knocked off is stood indoors and is not
  // drawn -- that is what `inside` is for -- and nothing else in the game clears
  // it, because nothing else in the game takes somebody off carrying. Put one on
  // the quarry straight from the house and it went down the cut, worked the
  // face, brought shards up and was invisible the whole time.
  w.inside = false;
  const job = JOB_OF[type];
  const legs = [];
  // The hat goes back where it came from first, and it is put down before the
  // body is anywhere near its new job. `kitOf` rather than the old job: those
  // are the same thing every time except when a body is retasked twice in a row
  // and is still holding the first station's kit.
  if (w.trained && kitX(w.kitOf) !== null) legs.push({ to: kitX(w.kitOf), do: 'drop' });
  // Then the new station's stand, if there is anything on it -- *before* the
  // work, not after. Walking to the middle of the rock, then back down to the
  // stand, then up the hill again is three trips to do one thing, and it is the
  // one bit of this anybody watching would call wrong.
  if (!w.trained && kitX(job) !== null && kitFree(job) > 0) {
    w.wanting = job;
    legs.push({ to: kitX(job), do: 'wear' });
  }
  const to = stationX(type);
  if (to !== null) legs.push({ to, do: 'work' });
  if (!legs.length) { w.trained = false; w.kitOf = null; settle(w); return; }
  w.legs = legs;
  nextLeg(w);
}

// One frame of that walk. Nothing else happens on the way -- it does not mine,
// carry, tend, research or cut until it is standing where the job is.
// The pace a body crosses the yard at when it has been put on something else.
// Its own legs, hands free -- it is carrying nothing -- with COMMUTE_PACE as the
// floor so an unupgraded crew is no slower at it than it ever was.
const commutePace = () => Math.max(COMMUTE_PACE, haulSpeed() * HAUL_EMPTY);

function stepCommute(w, zone) {
  // Out of the hole by the way it came in. A body down the cut walks along the
  // floor to the foot of the ladder and goes up it: rising through the wall
  // wherever it happened to be standing was the same not-a-thing-that-happens
  // as sinking into the ground, and the ladder is there to be used both ways.
  if (w.y > S.groundY) {
    const foot = quarryFace();
    if (Math.abs(w.x - foot) > 1) {
      w.y = quarryFloor(w.x + WORKER / 2) - WORKER;
      w.x += Math.sign(foot - w.x) * Math.min(commutePace(), Math.abs(foot - w.x));
      return;
    }
    w.x = foot;
  }

  // The level of the ground first, and only then along it. A quarrier is at work
  // below the ground line, and setting off from down there would take it up
  // through the wall of the cut on the diagonal; it climbs the way it came down.
  // A miner is the same thing the other way up, stood on top of the rock.
  const top = walkY(w.x + WORKER / 2);
  if (Math.abs(w.y - top) > 1) {
    w.y += Math.sign(top - w.y) * Math.min(CLIMB_PACE, Math.abs(top - w.y));
    return;
  }

  if (duck(w, zone)) { w.y = walkY(w.x + WORKER / 2); return; }

  const d = w.walkTo - w.x;
  w.face = Math.sign(d) || w.face || 1;        // a cart is dragged behind
  w.x += Math.sign(d) * Math.min(commutePace(), Math.abs(d));
  w.y = walkY(w.x + WORKER / 2);               // the bridge carries a commuter too
  if (Math.abs(d) < COMMUTE_SLOP) arrive(w);
}

export function syncWorkers() {
  const want = { miner: S.miners, hauler: S.haulers, quarrier: S.quarriers,
                 farmhand: S.farmhands, labber: S.labbers };
  // Bodies are moved between jobs, not bought and sold, so one that is stood
  // down is usually one that has just been put on something else. Whatever it
  // was carrying goes on the ground at its feet: every pixel is worth one dust
  // wherever it came from, and losing a load to a reshuffle would break that.
  const room = { ...want };                 // want, counted down as bodies are kept
  const keep = [], stood = [];
  for (const w of S.workers) (room[w.type]-- > 0 ? keep : stood).push(w);
  for (const w of stood) {
    for (let i = 0; i < (w.carry || 0); i++)
      spawnChip(w.x + WORKER / 2, S.groundY - WORKER, bell() * 0.5, -1.2, w.load?.[i] || 1);
    if (w.hasCore) {
      S.coreItem = { x: w.x, y: S.groundY - CORE_SIZE, vx: 0, vy: -1, rest: false };
      if (S.coreTaker === w) S.coreTaker = null;
    }
    // hands empty and nothing claimed, so whatever it does next it starts with
    // nothing on it
    w.carry = 0;
    w.load = [];
    w.hasCore = false;
    w.claim = -1;
    unbook(w);                     // and the room it had booked goes back
  }
  S.workers = keep;

  // count what is missing first: pushing while re-reading the length only ever
  // creates half of them
  const have = t => S.workers.filter(w => w.type === t).length;

  // A body stood down from one job while another is short of one has not been
  // sacked and replaced -- it is the same person, and it walks over. So the
  // surplus is spent before anything is made from nothing, and the only bodies
  // pushed here are the ones the crew has actually grown by.
  for (const type of TYPES) {
    for (let short = want[type] - have(type); short > 0; short--) {
      const spare = stood.shift();
      if (spare) { retask(spare, type); S.workers.push(spare); }
      else S.workers.push(FACTORY[type]());
    }
  }

  // number the miners off so they can be spaced evenly round the rock, and
  // stagger the new ones through the swing cycle so the crew never hits as one
  let slot = 0;
  for (const w of S.workers) {
    if (w.type !== 'miner') continue;
    w.slot = slot++;
    if (!w.next) w.next = now() + minerMs() * (w.slot / Math.max(1, S.miners));
  }

  // Nothing here hands out hats. A hat is on a head because that body walked
  // over and picked it up, and it comes off because it walked back and put it
  // down -- see `retask` and `stepKit`. A brand new body starts bare-headed and
  // goes and gets one like everybody else.
}

// --- coming back to it --------------------------------------------------------
// Bodies are not saved: the crew is a set of counts, and `syncWorkers` builds
// the people from them when the game comes back. So who was wearing what is not
// saved either, and everybody used to walk back in bare-headed with the stands
// piled high -- a shift's worth of errands to redo for nothing.
//
// The rule is the obvious one: you left them at work in it, so they are at work
// in it. Each station's hats go on that many of the bodies standing at it, and
// the rest stay on the stand. Nobody walks for these: they never took them off.
export function wearKitOnLoad() {
  for (const job of KIT_JOBS) {
    let left = hats(job);
    for (const w of S.workers) {
      if (JOB_OF[w.type] !== job) continue;
      const on = left-- > 0;
      w.trained = on;
      w.kitOf = on ? job : null;
    }
  }
}

// --- booking the hole ---------------------------------------------------------
// A hauler says how much it is going for *before* it goes, and the room it
// asked for is spoken for until it tips.
//
// Without that, every body in the yard set off with an empty pair of hands,
// filled them, walked to the lip and only then found out the hole was full --
// eight workers stood at the brim holding a load each, with nowhere to put any
// of it and no way to put it back. Room in the hole is a resource like a column
// of dust is a resource, and the fix is the same one the columns already use:
// claim it at the moment you decide, and hold the claim until you have spent it.
//
// So a trip is `w.booked` grains of dust and no more. Room for five is one
// worker going for five, not five workers going for a load each.
//
// Everything is in this. A shard, a spore and a core take a grain of room the
// same as a grain of dust does: one capacity, one queue. A hole that held
// everything except the four things it did not hold was a hole with a rule you
// could not see, and it let a body set off for a find with a full pit behind it
// and stand at the lip holding one.
const bookings = () => S.workers.reduce((n, o) => n + (o.booked || 0), 0);
export const pitFree = () => pitRoom() - bookings();

// what one body carries in a trip -- a cart holds twice
const load = w => haulCap() * (w.trained ? 2 : 1);

// what it may still take this trip, and taking one more off it
const roomOnBoard = w => (w.booked || 0) - (w.took || 0);
const tookOne = w => { w.took = (w.took || 0) + 1; };

// Book what is going: whatever is left of a load, or whatever the hole has left,
// whichever is less. Returns what it managed to get.
function bookRoom(w, want = load(w)) {
  if (roomOnBoard(w) < 1) w.booked = (w.took || 0) + Math.max(0, Math.min(want, pitFree()));
  return roomOnBoard(w);
}

// Hands empty and nothing owed: the trip is over, so the room goes back.
function unbook(w) {
  w.booked = 0;
  w.took = 0;
}

// --- the yard at rest ---------------------------------------------------------
// Where a body with nothing to do wanders to.
//
// It used to be a number a few hundred pixels either side of where it already
// was, which is a random walk: no destination, no reason, and six of them doing
// it at once reads as insects rather than as people. A stroll wants somewhere to
// go, and this yard has somewhere -- the rock, the lip of the hole, and whoever
// else is standing about.
//
// So a spot is chosen from a handful of real ones, weighted. Most of the time it
// is still just a few steps, because most of what anybody does when they are
// waiting is shuffle a few steps; but often enough it is *over to somebody*,
// which is what turns two bodies standing near each other into the conversation
// the break code was already able to have and almost never got the chance to.
function nearIdle(w) {
  let best = null, near = Infinity;
  for (const o of S.workers) {
    if (o === w || o.type !== 'hauler' || o.inside || o.carry || o.walking) continue;
    if (o.goal !== 'idle') continue;
    const d = Math.abs(o.x - w.x);
    if (d < 24 || d > ROAM_RANGE * 1.6 || d >= near) continue;
    near = d;
    best = o;
  }
  return best;
}

function strollTo(w) {
  const spots = [];
  const add = (weight, x) => { if (x != null) for (let i = 0; i < weight; i++) spots.push(x); }

  // a few steps, and nothing more: most of what waiting looks like
  add(5, w.x + (Math.random() - 0.5) * ROAM_RANGE);
  // over to somebody, and stopping beside them rather than on them
  const mate = nearIdle(w);
  add(4, mate ? mate.x + Math.sign(w.x - mate.x) * ROAM_ELBOW : null);
  // and the two things in this yard worth going and looking at
  add(2, rockLeft() - ROCK_CLEAR - WORKER * 2);
  add(2, pit.x - WORKER * 3);

  const lo = yardLeft(), hi = pit.x - WORKER;
  return Math.max(lo, Math.min(hi, spots[Math.floor(Math.random() * spots.length)]));
}

// Nobody stands inside anybody. Two idlers who end up on the same spot drift
// apart a little, the way the gang on the rock and the crew down the cut do.
function elbowIdle(w) {
  for (const o of S.workers) {
    if (o === w || o.type !== 'hauler' || o.inside || o.goal !== 'idle') continue;
    const d = o.x - w.x;
    if (Math.abs(d) >= ROAM_ELBOW) continue;
    w.x -= Math.sign(d || 1) * 0.25;
    return;
  }
}

// The nearest column of dust that nobody else has set off for. One column, one
// worker: without that, every worker in the yard works out the same answer and
// the whole line turns round for a single grain behind them, then turns round
// again when the first of them picks it up.
function nearestDust(x, taken) {
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const from = Math.max(0, Math.min(last, colOf(floor, x)));
  for (let d = 0; d <= last; d++) {
    for (const c of [from - d, from + d]) {
      // Anything in a column is worth fetching, barred or not: a barred column
      // normally holds nothing, and when it does hold something -- a shard set
      // down at the beds -- somebody should still go out and get it.
      if (c < 0 || c > last || taken.has(c)) continue;
      if (at(floor, c, 0)) return c;
    }
  }
  return -1;
}

// Something that is not dust is worth crossing the yard for: it is one grain and
// it is worth a whole shard. Workers take the nearest column of anything, so
// without this a shard out at the beds waits for the whole yard to be swept
// clean first -- which, in a yard with a working crew, is never.
function nearestMark(w, taken) {
  let best = -1, bestD = Infinity;
  // Nothing beyond the near lip: a body cannot cross the hole, so a find over
  // there is one it would set off for and stand at the edge of for ever. What
  // lands past the pit is yours to sweep up, not theirs to fetch -- the same
  // bound `nearestDust` has always kept.
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  for (const m of S.floorMarks) {
    const c = colOf(floor, m.x);
    if (c < 0 || c > last || taken.has(c) || !at(floor, c, 0)) continue;
    const d = Math.abs(m.x - w.x);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// the columns already spoken for this frame
function claims() {
  const taken = new Set();
  for (const w of S.workers) if (w.type === 'hauler' && w.claim >= 0) taken.add(w.claim);
  return taken;
}

export function topGrain(c) {
  for (let r = floor.rows - 1; r >= 0; r--) if (at(floor, c, r)) return r;
  return -1;
}

export function updateWorkers(now, dt) {
  if (S.miners > 0) findPeak();
  const zone = dropZone();          // the ground nobody may be standing on
  const taken = claims();
  // ...and the ground nobody may be *fetching from*, which is not the same rule
  // and used to be missing. A hauler ducks out of the way and then walks
  // straight back in, because what pulled it there was a column of dust it had
  // claimed and the duck does not know about claims: out, in, out, in, until
  // the rock lands on it. So the columns under a coming rock are spoken for as
  // far as everybody is concerned, and the dust there is fetched afterwards.
  if (zone) {
    const from = Math.max(0, colOf(floor, zone.from));
    const to = Math.min(floor.cols - 1, colOf(floor, zone.to));
    for (let c = from; c <= to; c++) taken.add(c);
    for (const w of S.workers) {
      if (w.type === 'hauler' && w.claim >= from && w.claim <= to) w.claim = -1;
    }
  }
  if (!S.coreItem || S.heldCore || !S.coreItem.rest) S.coreTaker = null;
  stepKit();                        // and anybody with kit to go and fetch or put back
  for (const w of S.workers) {
    // on its way to a job it has just been put on, and doing none of it yet
    if (w.walking) { stepCommute(w, zone); continue; }

    if (w.type === 'miner') {
      // The rock is off. The crew take five on the bare ground: a hop on the
      // spot, each one a beat behind the last, so it reads as a line of them
      // rather than one animation played five times. It runs until the next
      // rock has come down, so nobody is caught mid-hop underneath it.
      if (now < S.danceUntil || S.rockFall > 0) {
        w.resting = false;                     // a dance is not a break
        w.idleAt = null;
        w.lunge = 0;
        w.next = now + minerMs();              // nobody swings at nothing
        // The next rock lands where the last one stood, and the last one is
        // what they were standing on. So the first thing they do when the job
        // is off is walk out of its footprint -- and they celebrate from
        // there, rather than being stood under a rock coming out of the sky.
        if (duck(w, zone)) { w.y = standOn(S.groundY); continue; }
        const beat = now / 1000 * DANCE_BEAT + w.slot * 0.5;
        const hop = Math.abs(Math.sin(beat * Math.PI));
        w.y = standOn(S.groundY) - Math.round(hop * 2) * P;
        w.x += Math.sin(beat * Math.PI * 0.5) * 0.4;
        continue;
      }

      // The crew climb the hill and work it from the top down. Each one keeps a
      // stretch of the crest to itself, stands on whatever rock is left there and
      // sinks with it as the rock goes; when its stretch is bare it ambles along
      // to the nearest that is not.
      // The rock's pile is full. The crew stand where they are until it has
      // been carried away: dust with nowhere to go used to roll into the pit,
      // which banks it for nothing and leaves the haulers with no job.
      if (S.pileFull.rock) {
        w.resting = true;                      // stopped, and free to take five
        // Standing down is not being switched off. It shifts its weight where
        // it stands: a slow pace of about a cell either side of the spot it
        // stopped on, and now and then it straightens up. Every miner has its
        // own phase already, so a stopped gang reads as a gang standing about
        // rather than as one animation played five times -- and it is nothing
        // like the dance, which is three hops a second and goes nowhere.
        if (w.idleAt == null) w.idleAt = w.x;
        const idle = now / 1000 * IDLE_BEAT + w.ph;
        w.x = w.idleAt + Math.sin(idle * IDLE_STRIDE) * P;
        const surf = rockTopY(colAtX(w.x + WORKER / 2));
        w.y = standOn(surf) - (Math.sin(idle) > 0.9 ? P : 0);
        w.lunge *= 0.82;
        w.next = now + minerMs();
        continue;
      }
      w.resting = false;
      w.idleAt = null;

      const t = now / 1000;

      // Walk the layer, turning at its ends and before walking into a mate. A
      // miner that finds itself off the layer -- because the rest of the gang
      // took the row down around it, or because it was hired onto a flank --
      // climbs back to it rather than standing there boring a shaft.
      const here = colAtX(w.x + WORKER / 2);
      if (!inBand(here)) {
        const back = nearestInBand(here);
        if (back !== here) w.dir = Math.sign(back - here);
        w.x += w.dir * MINER_WALK * 2.5;              // brisk, it has ground to make up
      } else {
        const step = w.x + w.dir * MINER_WALK;
        if (inBand(colAtX(step + WORKER / 2)) && !elbowed(w, step)) w.x = step;
        else w.dir = -w.dir;
      }

      const col = colAtX(w.x + WORKER / 2);
      const surf = rockTopY(col);
      w.lunge *= 0.82;
      // it bobs on its feet, and drops into the swing
      w.y = standOn(surf + Math.sin(t * w.sp + w.ph) * 1.2 + w.lunge * P * 1.4);

      if (boulderAlive() && now >= w.next && S.rockTops[col] >= 0) {
        // twice the bite for a breaker: the shards bought a bigger swing on a
        // body that is not going anywhere
        knockOff(w.x + WORKER / 2, surf + P / 2, minerBite() * (w.trained ? 2 : 1));
        w.lunge = 1;
        w.next = now + minerMs() * (0.85 + Math.random() * 0.3);    // never quite in time
      }
      continue;
    }

    if (w.type === 'quarrier') { stepQuarrier(w, now); continue; }
    if (w.type === 'farmhand') { stepFarmhand(w, now, dt); continue; }
    if (w.type === 'labber') { stepLabber(w); continue; }

    // hauler: a rock coming down beats anything it was carrying or fetching.
    // It keeps its claim and picks the job up again on the far side.
    if (duck(w, zone)) { w.y = walkY(w.x + WORKER / 2); continue; }

    // fetch a loose core if there is one, else scoop dust, then tip it all
    // over the ledge
    if ((w.goal === 'seek' || w.goal === 'idle') &&
        S.coreItem && S.coreItem.rest && !S.heldCore && !w.hasCore &&
        (!S.coreTaker || S.coreTaker === w) && bookRoom(w, 1) > 0) {
      S.coreTaker = w;
      if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }   // the core comes first
      const target = S.coreItem.x + CORE_SIZE / 2 - WORKER / 2;
      if (across(zone, w.x, target)) continue;      // wait for the rock to land
      const pace = haulSpeed() * HAUL_EMPTY;
      w.x += Math.sign(target - w.x) * Math.min(pace, Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P * 2) {
        S.coreItem = null;
        S.coreTaker = null;
        w.hasCore = true;
        tookOne(w);                            // a core is a grain of the hole too
        w.goal = 'dump';
        S.dirty = true;
      }
      continue;
    }

    if (w.x > pit.x - WORKER) w.x = pit.x - WORKER;
    w.y = walkY(w.x + WORKER / 2);

    // Nothing to go for and nothing owing. A hauler with no room booked and none
    // to book stands down rather than walking to the lip and throwing at a brim,
    // the same as a gang stops when the pile it is filling has no room left. It
    // keeps whatever it is already carrying -- a load tipped into a full pit is
    // a load lost -- and picks the job up the moment a dig makes room.
    //
    // Somebody already on a trip is left to finish it: the room it is holding is
    // room it booked, and turning it round at the lip is the exact thing this is
    // here to stop. A core is not dust and the hole always takes one.
    const noRoom = !w.hasCore && !w.carry && roomOnBoard(w) < 1 && pitFree() < 1;
    // Somebody already on their way home is left alone. Telling a body there is
    // no room is telling it to stand down, and a body walking to the door has
    // stood down already -- so this used to catch it, put it back on `idle`, and
    // the idle branch would send it home again on the very next frame. Home,
    // idle, home, idle, and it never took a step: a yard full of dust, a full
    // hole, and the whole crew stood stock still between the pile and the lip.
    if (noRoom && w.goal !== 'idle' && w.goal !== 'home') {
      if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
      unbook(w);
      w.goal = 'idle';
    }

    w.resting = false;
    if (w.goal !== 'idle' && w.goal !== 'home') w.idleSince = 0;
    if (w.goal === 'seek') {
      // It keeps the column it set off for until that column is bare. Picking
      // the nearest one afresh every frame is what made the crew swarm.
      if (w.claim >= 0 && !at(floor, w.claim, 0)) { taken.delete(w.claim); w.claim = -1; }
      if (w.claim < 0) {
        // Book the hole before picking a column, not after filling your hands.
        // Nothing at all is fetched without room for it -- a shard on the ground
        // with a full hole behind it is a shard that stays on the ground.
        if (bookRoom(w) > 0) {
          const c = nearestMark(w, taken);                // a find first, if there is one
          const pick = c >= 0 ? c : nearestDust(w.x, taken);
          if (pick >= 0) { w.claim = pick; taken.add(pick); }
        }
      }
      if (w.claim < 0) { w.goal = w.carry ? 'dump' : 'idle'; continue; }
      const c = w.claim;
      const target = floor.x + c * P;
      if (across(zone, w.x, target)) continue;      // wait for the rock to land
      // hands free, so it moves; a load is what slows it down
      const pace = haulSpeed() * HAUL_EMPTY;
      w.face = Math.sign(target - w.x) || w.face || 1;   // a cart is dragged behind
      w.x += Math.sign(target - w.x) * Math.min(pace, Math.abs(target - w.x));
      // It scoops what is under it, not what its left edge is exactly on. The
      // last two columns before the lip sit further right than a worker is
      // allowed to stand, so a worker that had to be standing on them stood at
      // the lip for ever with the dust a hand's width away.
      const under = target >= w.x - P && target <= w.x + WORKER;
      if (under && now >= w.next) {
        const r = topGrain(c);
        if (r >= 0) {
          // A grain is worth taking only if this trip booked room for it --
          // otherwise it stays on the ground, which is somewhere, rather than in
          // a pair of hands, which is not. Dust or find, it is the same rule.
          if (roomOnBoard(w) > 0) {
            (w.load ||= []).push(at(floor, c, r));
            put(floor, c, r, 0);
            w.carry++;
            tookOne(w);
            w.next = now + scoopMs();
            S.dirty = true;
          } else {
            // the booking is used up: this trip is done
            taken.delete(c);
            w.claim = -1;
            w.goal = w.carry ? 'dump' : 'idle';
            continue;
          }
        }
      }
      if (w.carry >= load(w)) {                  // a cart holds twice
        if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
        w.goal = 'dump';
      }
    } else if (w.goal === 'dump') {
      const target = pit.x - WORKER;                 // the lip, where they can stand
      if (across(zone, w.x, target)) continue;      // wait for the rock to land
      w.face = Math.sign(target - w.x) || w.face || 1;
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed(), Math.abs(target - w.x));
      if (Math.abs(target - w.x) < P) {
        if (w.hasCore) {
          S.coreItem = { x: pit.x + P * 2, y: S.groundY - CORE_SIZE, vx: 1.1, vy: -1.2, rest: false };
          w.hasCore = false;
          S.dirty = true;
        }
        // A proper toss off the lip, so it arcs out over the edge -- and it is
        // aimed at the hole, the same way spoil is aimed at a pile. It used to
        // be a fixed spray, which was fine while the pit ran two windows to the
        // right and never once while it is a scrape: the same throw sailed over
        // the far wall and came down on the ground behind it.
        const from = w.x + WORKER / 2, up = S.groundY - WORKER - P;
        const far = pit.x + Math.max(P, pit.w - P * 2);
        for (let i = 0; i < w.carry; i++) {
          // most of it near the lip, where they are standing, tailing away down
          // the hole -- which is the shape the pile has always had
          const land = Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
          const v = aim(from, up, land, P);
          spawnChip(from, up, v.vx, v.vy, w.load?.[i] || 1);
        }
        w.carry = 0;
        w.load = [];
        unbook(w);                             // the room it booked is spent
        w.goal = 'seek';
        S.dirty = true;
      }
    } else if (w.goal === 'home') {
      // Knocked off. It walks to the door it was hired out of and goes in, and
      // the moment there is dust on the ground it comes straight back out --
      // which is the one thing that has to be true of this, because a crew you
      // cannot get back is a crew you would never let go in the first place.
      w.resting = false;
      if (!noRoom && nearestDust(w.x, taken) >= 0) {
        w.inside = false;
        w.goal = 'seek';
        continue;
      }
      unbook(w);
      if (w.inside) continue;                    // in out of it, and nothing to watch
      const door = hireSpot().x;
      if (across(zone, w.x, door)) continue;     // wait for the rock to land
      w.face = Math.sign(door - w.x) || w.face || 1;
      w.x += Math.sign(door - w.x) * Math.min(HOME_WALK, Math.abs(door - w.x));
      w.y = walkY(w.x + WORKER / 2);
      if (Math.abs(door - w.x) < 1) { w.inside = true; w.x = door; S.dirty = true; }
    } else {
      // Nothing to fetch and nothing to carry. Rather than standing to
      // attention they amble: a spot to stroll to, a stand about when they get
      // there, then another. A yard at rest should read as at rest, not as
      // switched off.
      unbook(w);                  // idle hands hold no room
      if (!noRoom && nearestDust(w.x, taken) >= 0) { w.goal = 'seek'; w.idleSince = 0; continue; }

      // A yard with nothing in it to carry is a yard nobody needs to be stood
      // in. After a good while of it -- staggered, so they trickle off rather
      // than clocking out together -- a body goes home. It is not a rate and it
      // costs nothing: every one of them is back the moment there is work.
      if (!w.idleSince) w.idleSince = now + HOME_AFTER * (0.6 + Math.random() * 0.9);
      if (!w.brk && now >= w.idleSince) { w.goal = 'home'; w.roamTo = null; continue; }
      // Stood still between strolls is the one moment a hauler is properly
      // stopped, and it is the only moment it is allowed a break: a body
      // walking somewhere is on its way there.
      w.resting = w.roamTo === null || w.roamTo === undefined;
      if (w.roamTo === null || w.roamTo === undefined) {
        elbowIdle(w);                  // and not stood inside somebody
        // and it stays put while it is having one: a body that wandered off
        // mid-cigarette would be a body that was never really standing there
        if (!w.brk && now >= (w.restUntil || 0)) w.roamTo = strollTo(w);
      } else {
        const d = w.roamTo - w.x;
        if (across(zone, w.x, w.roamTo)) { w.roamTo = null; continue; }
        w.face = Math.sign(d) || w.face || 1;
        // its own legs, not everybody's
        w.x += Math.sign(d) * Math.min(haulSpeed() * ROAM_PACE * (w.amble || 1), Math.abs(d));
        if (Math.abs(d) < 1) {
          w.roamTo = null;
          // and its own patience about standing there afterwards
          w.restUntil = now + (500 + Math.random() * 3000) * (w.linger || 1);
        }
      }
    }
  }
}

// a white circle with a black edge. It paints rather than clears, so it never
// eats the dust or the ground line behind it
