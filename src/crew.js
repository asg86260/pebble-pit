// The crew: who they are, where they stand and what they do with their hands.
//
// Miners take the rock off in layers; workers carry dust to the pit. A new kind
// of worker is a new `type` and a new branch in updateWorkers -- and, when the
// quarry and the farm arrive, its own file.

import { P, WORKER, CORE_SIZE, DANCE_BEAT, HAUL_EMPTY, DUCK_PACE, IDLE_BEAT, IDLE_STRIDE,
        COMMUTE_PACE, COMMUTE_SLOP, CLIMB_PACE, HOME_AFTER, HOME_WALK, ROCK_CLEAR, GRAV,
        MUCK_SWEEP, LOO_EVERY, LOO_SPREAD, LOO_MS, LOO_MUCK,
        HURL, HURL_MAX, HURL_DRAG, SHAKE_TURNS, SHAKE_WINDOW, DIZZY_MS,
        PILE_LIMIT, MACHINE_FOUL } from './config.js';
import { S, floor, pit, bench, outhouse } from './state.js';
import { at, put, colOf } from './grid.js';
import { standOn, walkY, rockLeft, yardLeft, kitX, atStation, overPitMouth } from './world.js';
import { throwVel } from './hands.js';
import { boulderAlive, knockOff, rockTopY, dropZone } from './rock.js';
import { spawnChip, bell, aim } from './dust.js';
import { pitRoom } from './pit.js';
import { minerMs, haulCap, haulSpeed, scoopMs, minerBite, hats, worn, spareKit, JOB_OF, machineRate } from './upgrades.js';
import { stepQuarrier, newQuarrier, quarryFace, quarryFloor, underground } from './quarry.js';
import { stepFarmhand, newFarmhand, plotX } from './farm.js';
import { stepLabber, newLabber, labDoor, indoors } from './lab.js';
import { stepScrubber, newScrubber, scrubDoor, inHouse } from './scrubhouse.js';
import { stepWizard, newWizard, underMeteor, floatDown } from './wizard.js';
import { now, frames } from './clock.js';
import { sweepMuckAt, muckLeft, muckFor, nearestMuck, muckAtCol, pitLadder, pitStand, workSpot, onRock,
         rockMuck, quarryMuck, plotMuck,
         pitSide, pastPit, muckPastPit, dropMuckAt, cleanSpotNear, foul, NEAR, FAR } from './smog.js';
import { doorAt } from './house.js';
import { MACHINES, machine, JOB_MACHINE, specOf } from './machines.js';

// The crew take the hill off in layers. A miner does not stand in one spot and
// bore a shaft: it walks the top layer, striking the rock under its feet as it
// goes, so the crest comes off as a row and the next row is exposed underneath.
// It turns at the ends of the layer and turns before walking into a mate, so the
// gang works back and forth across the rock like a line of men on a bench.
const MINE_BAND = 3;      // cells below the peak still counted as the top layer
const ROAM_RANGE = 420;   // how far an idle worker will wander for no reason
const ROAM_PACE = 0.45;   // and how slowly it goes about it
const ROAM_ELBOW = WORKER * 1.4;   // how close two of them will stand
// How fast a body on the rock gets from one height to another.
//
// It used to be told where it was standing every frame -- the top of whatever
// column it was over, exactly, no matter how far that was from where it had been
// the frame before. So a miner ambling along the crest snapped up and down the
// steps like a cursor, and a gang that took a row out from under itself dropped
// six cells in one frame. A rock is a thing you climb.
//
// The pace is a floor and a fraction: near enough and it steps down a cell at a
// time, a long way off and it moves briskly, so it can always keep up with a
// crest coming apart underneath it and never looks detached from the rock.
const CLIMB_MIN = 1.1;             // pixels a frame at the least
const CLIMB_SHARE = 0.14;          // and this much of whatever is left
// and however far it walked, times this. A body walking on to the hill goes up
// the side it meets, which means its feet have to rise as fast as it is moving
// along: at a fixed pace the walk outruns the climb, and what that looks like is
// a body crossing the footprint at ground level and rising somewhere near the
// middle -- measured, twenty-three pixels inside the rock at fifty-six per cent
// of the way across it. Running to the centre and then going to the top.
//
// One and six tenths carries any slope up to about sixty degrees, which is the
// flank of a hill. What is steeper than that is the last cell or two under the
// crest, and easing up those is right: that part is a climb rather than a walk.
const CLIMB_SLOPE = 1.6;

// One frame of a body getting from the height it is at to the height it should
// be at, and the height it reaches. Every branch that puts a miner on the rock
// goes through this -- working it and stood down over a full pile are the same
// body on the same crest, and only one of them easing was a body that snapped
// the moment the yard filled up.
function climbTo(w, foot) {
  // From where the body actually is. Seeding this with the target instead is a
  // body that arrives at the foot of the rock and is suddenly on top of it --
  // which is the one thing climbing was put in to stop.
  if (w.foot == null) w.foot = w.y;
  const d = foot - w.foot;
  // How far it walked since the last time its feet were asked about, which is
  // what lets a walk up a slope keep its feet on the slope. See CLIMB_SLOPE.
  const along = Math.abs(w.x - (w.footAt ?? w.x));
  w.footAt = w.x;
  // Per frame, times how long this frame was: at sixty that is one and the pace
  // is exactly what it always was. See `frames` in clock.js. The share of what
  // is left is a proportion rather than a distance, so it is raised to the
  // power instead of multiplied -- a fourteenth of the way there twice is not
  // twice a fourteenth of the way there.
  const f = frames();
  const chunk = Math.max(CLIMB_MIN * f, along * CLIMB_SLOPE,
                         Math.abs(d) * (1 - (1 - CLIMB_SHARE) ** f));
  // and never more than a cell in a frame. The rock's surface is made of whole
  // cells, so what is under a body's feet does not slope -- it *steps*, six
  // pixels at a time, and at a corner two or three of those arrive together. A
  // foot that took all of it at once was a body jumping up the hill rather than
  // walking up it. A cell a frame is three hundred and sixty pixels a second,
  // which is faster than anything in this yard moves and still smooth.
  const step = Math.min(chunk, P * f);
  w.foot += Math.sign(d) * Math.min(Math.abs(d), step);
  return w.foot;
}
const MINER_WALK = 0.5;   // pixels a frame along the row

// Where a body's feet go when it is walking: on whatever is under it.
//
// This used to be `walkY` everywhere -- the ground line and the bridge, which do
// not know the rock is there. So anybody crossing the hill's footprint walked
// *through* the hill: measured, a hundred and twenty pixels inside it, buried to
// well over its own height, and it surfaced only on arriving at the far side or
// at work. What that looks like is a body running to the middle of the rock and
// then rising out of it, which is exactly what it was doing.
//
// `landing` already knows the answer -- the rock's surface where there is rock,
// the ground where there is not -- and `climbTo` walks the feet up to it at the
// pace of the walk, so a body goes up the side of the hill it meets.
// Only the gang that works the rock walks over the rock.
//
// Everybody else keeps to the ground and passes in front of it. A hauler is
// carrying dust from the hill to the hole and has no business on the crest --
// and a yard where every errand goes over the summit is a yard where the hill
// is a road. The miners are the ones the hill is a workplace for, so they are
// the ones who climb it.
//
// Falling is not affected: a body thrown on to the rock lands on the rock
// whatever its job is, because that is physics rather than pathfinding, and
// `fall` asks `landing` directly.
const stand = w => climbTo(w, w.type === 'miner' ? landing(w) : walkY(w.x + WORKER / 2));


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
  w.x += Math.sign(out - w.x) * Math.min(DUCK_PACE * frames(), Math.abs(out - w.x));
  return true;
}

// Where a body hired into the crew steps into the yard: the door of the shacks
// the crew live in. Somebody taken on now comes out of the place the crew come
// from and walks to the work, rather than appearing at it -- which is the whole
// of why the housing is there, and why the door is an address the housing keeps
// rather than a number this file holds a copy of.
export const hireSpot = () => doorAt();

// A body that has knocked off and gone in. It is the same idea as a labber
// through the door or a quarrier down the quarry: out of sight, still counted, and
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

// --- who they are --------------------------------------------------------------
// A body used to be a slot: the crew was four counts, `syncWorkers` made people
// out of them when it needed people, and coming back to a saved game made a
// fresh set who happened to be standing in the same places. That was the point
// for a long while -- a job is a count and a body is whichever body happens to
// be doing it -- and it is what lets a hat belong to a station rather than to a
// head.
//
// It is not the point any more. This game opens on two squares who are somebody,
// and a crew of interchangeable slots underneath that story was the yard
// disagreeing with its own first minute. So a body has a name, an age and a
// record: how much rock it has taken, how much it has found, how much it has put
// in the hole, and where it has spent its time. None of it does anything -- no
// number here feeds a rate -- it is only so that the four on the rock are four
// people rather than the number four.
const NAMES = ['ada', 'bel', 'cass', 'dot', 'edie', 'fen', 'gil', 'hal', 'ivy',
               'jax', 'kit', 'lom', 'mo', 'nell', 'ora', 'pip', 'rue', 'sid',
               'tam', 'vic', 'wren', 'yaz', 'zeb', 'bram', 'cleo', 'flo', 'gus',
               'hex', 'iso', 'jom', 'lark', 'mel', 'nix', 'obe', 'quin', 'ros',
               'tess', 'vim', 'wick', 'yew'];

// A name nobody in the yard already has, while there are any left; after that
// the yard is big enough that two of a name is the two of them, not a bug.
function newName() {
  const taken = new Set(S.workers.map(w => w.name));
  const free = NAMES.filter(n => !taken.has(n));
  const from = free.length ? free : NAMES;
  return from[Math.floor(Math.random() * from.length)];
}

// The record a body keeps. `lived` is counted up rather than measured from a
// start time on purpose: the clock is wall time since the page loaded, so a
// birthday saved in it means nothing the next time you come back.
export const newRecord = () => ({
  name: newName(),
  lived: 0,                        // milliseconds on the payroll
  mined: 0,                        // pixels off the rock
  quarried: 0,                     // shards brought up out of the quarry
  farmed: 0,                       // spores taken off the plots
  stored: 0,                       // grains put in the hole
  at: {}                           // and time spent on each job
});

// The fields that are *this body* rather than what it is doing this second.
// Everything else is rebuilt by the factory for whatever job it is on.
export const KEEPS = ['name', 'lived', 'mined', 'quarried', 'farmed', 'stored',
                      'at', 'trained', 'kitOf', 'x', 'y'];

export function keepOf(w) {
  const out = { type: w.type };
  for (const k of KEEPS) if (w[k] != null) out[k] = w[k];
  return out;
}

// and back again, on to a body the factory has just made
export function wearRecord(w, from) {
  for (const k of KEEPS) if (from[k] != null) w[k] = from[k];
  if (!w.at) w.at = {};
  return w;
}

// one frame of getting older, and of being somewhere
export function stepRecords(dt) {
  for (const w of S.workers) {
    if (w.lived == null) Object.assign(w, newRecord());
    w.lived += dt;
    const job = JOB_OF[w.type];
    w.at[job] = (w.at[job] || 0) + dt;
  }
}

// where it has spent most of its time, which is what it would say it does
export function mainlyAt(w) {
  let best = null, most = 0;
  for (const [job, ms] of Object.entries(w.at || {})) if (ms > most) { most = ms; best = job; }
  return best;
}

// The order jobs are filled in, and how a body for one is made from nothing.
// Carrying comes last so that a spare body goes to a station that is short of
// one before it goes back to sweeping the yard.
const TYPES = ['miner', 'quarrier', 'farmhand', 'labber', 'scrubber', 'janitor', 'wizard', 'hauler'];
export const FACTORY = { miner: newMiner, quarrier: newQuarrier, farmhand: newFarmhand,
                  labber: newLabber, scrubber: newScrubber, janitor: newJanitor,
                  wizard: newWizard, hauler: newHauler };

// Somebody whose job is the mess. It starts at the shed it belongs to, the way
// every other body starts at its station -- though the work is wherever the mess
// happens to be, which is anywhere on the ground.
function newJanitor() {
  return { type: 'janitor', goal: 'to', x: outhouse.x, y: 0 };
}

// Where each job is done, for a body on its way to it. Carrying has no station:
// the dust is wherever it fell, so somebody put on it is already at work.
function stationX(type) {
  if (type === 'miner') return S.cx - WORKER / 2;
  if (type === 'quarrier') return quarryFace();
  if (type === 'farmhand') return plotX(0);
  if (type === 'labber') return labDoor() - WORKER / 2;
  if (type === 'scrubber') return scrubDoor() - WORKER / 2;
  if (type === 'janitor') return outhouse.x + outhouse.w / 2 - WORKER / 2;
  // A wizard's station is the ground under the meteor. The work is four hundred
  // pixels above that, but the walk is to here: the going up is the job, not the
  // commute.
  if (type === 'wizard') return underMeteor();
  return null;
}

// Give a body its new job's own fields -- exactly the ones that job's factory
// hands out -- so from here on nothing can tell it from one made on the spot.
// Where it is standing is the one thing it keeps: it walked here. And what is on
// its head, which is a thing it is carrying rather than a field of the job.
function settle(w) {
  const hat = w.trained, of = w.kitOf;
  // and whatever is in its hands. A body that walked here holding something is
  // still holding it -- the only place a load is meant to leave a body is the
  // hole, or the ground at its feet when the job itself is taken away.
  const carry = w.carry || 0, load = w.load || [], core = !!w.hasCore;
  const fresh = FACTORY[w.type]();
  delete fresh.x;                  // where it is standing is where it walked to
  delete fresh.y;
  Object.assign(w, fresh);
  w.trained = hat;
  w.kitOf = of;
  w.carry = carry;
  w.load = load;
  w.hasCore = core;
  w.legs = null;
  w.walkTo = null;
  w.walking = false;
}

// --- down the hole, and out the other side ---------------------------------------
// Muck that fell in the pit lies on the dust at the bottom of it, and muck that
// fell past the pit lies on ground the crew can only get to by going through.
// Both are the same errand: down one wall, along the top of the pile, up whichever
// wall you need.
//
// Four legs. For three of them the body is out of the yard's ordinary rules -- it
// is past the lip clamp, it is not on `walkY`, and what it stands on is the top of
// the pile rather than the ground. It is checked before everything else a hauler
// might do, including the rock dodge: a body on a ladder is not standing anywhere
// a rock can land, and it cannot go anywhere but up or down anyway.
//
// That ordering was found the hard way. With the dodge running first, the climb
// pushed the body two pixels down the ladder and the dodge lifted it two back onto
// the ground line, and the pair of them held it at the top of the ladder for ever,
// taking turns.
function downTheHole(w, to, dt) {
  if (!w.inPit) w.inPit = 'to';

  // Which wall this trip is aiming at. Muck in the hole is worked from the pile,
  // so it wants whichever wall is nearer; muck out past the hole wants the far
  // wall, because that is the only way onto that ground.
  //
  // Nothing to go for means going home, and home is always the near side: the
  // yard is over there. Aiming at the wall it came down before, this was a body
  // climbing into the hole and straight back out the side it started on.
  const want = to == null ? NEAR
             : pastPit(to) ? FAR
             : overPitMouth(to) ? pitSide(to)
             : NEAR;

  // along the ground to the head of the ladder on the side it is standing on
  if (w.inPit === 'to') {
    const from = w.farSide ? FAR : NEAR;
    const lad = pitLadder(from);
    const d = lad.x - WORKER / 2 - w.x;
    w.y = stand(w);
    w.dir = Math.sign(d) || 1;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
      return;
    }
    w.x = lad.x - WORKER / 2;
    w.y = lad.top;
    w.side = from;
    w.inPit = 'down';
    return;
  }

  // down it, hand over hand: it holds on, so nothing drifts sideways
  if (w.inPit === 'down') {
    const lad = pitLadder(w.side || NEAR);
    w.x = lad.x - WORKER / 2;
    const foot = pitStand(w.x) - WORKER;
    w.y = Math.min(w.y + CLIMB_PACE * frames(), foot);
    if (w.y >= foot) w.inPit = want === (w.side || NEAR) && !pastPit(to) ? 'dig' : 'cross';
    return;
  }

  // Along the top of the pile to the patch, and shovel it. The surface is not
  // level -- a pile heaps under the lip and runs away downhill -- so it walks the
  // shape of it the way a quarrier walks the floor of the quarry.
  if (w.inPit === 'dig') {
    if (to == null || !overPitMouth(to)) { w.inPit = 'cross'; return; }
    const d = to - WORKER / 2 - w.x;
    if (Math.abs(d) > P * 2) {
      w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
      w.dir = Math.sign(d);
    } else {
      sweepMuckAt(w.x + WORKER / 2, MUCK_SWEEP * (dt / 1000), w);
      w.lunge = 1;
    }
    w.y = pitStand(w.x) - WORKER;
    return;
  }

  // Across the pile to the foot of whichever ladder it is leaving by. Climbing
  // the wall from wherever it happened to finish shovelling is not climbing a
  // ladder.
  if (w.inPit === 'cross') {
    const lad = pitLadder(want);
    const d = lad.x - WORKER / 2 - w.x;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
      w.dir = Math.sign(d);
      w.y = pitStand(w.x) - WORKER;
      return;
    }
    w.x = lad.x - WORKER / 2;
    w.side = want;
    w.inPit = 'up';
    return;
  }

  // and up, and out -- on whichever side it climbed. Which side it comes out is
  // the whole of what this errand changes about a body: past the far wall it is
  // on ground it could not otherwise stand on, and the lip clamp holds it there
  // rather than dragging it back across the mouth.
  const lad = pitLadder(w.side || NEAR);
  w.x = lad.x - WORKER / 2;
  w.y = Math.max(w.y - CLIMB_PACE * frames(), lad.top);
  if (w.y > lad.top) return;
  w.y = lad.top;
  w.inPit = null;
  w.farSide = w.side === FAR;
  // and it steps off the ladder onto the ground on that side
  w.x = w.farSide ? pit.x + pit.w : pit.x - WORKER;
}

// --- nature -------------------------------------------------------------------
// A body works all day, and now and then it has to stop.
//
// It puts down whatever it was doing, says so over its head, stands there for a
// couple of seconds, and gets back to it -- and what it leaves behind is the
// same muck the sky rains down, so the crew have to shovel it exactly like any
// other mess. The yard makes its own work. A bigger crew is more hands and a
// bigger mess, which is a nicer shape for a number to have than "more hands".
//
// Nowhere it cannot be cleaned up. The rock, the quarry and the plots are held out
// of the shovelling -- see `onSite` in smog.js -- so a body standing on one of
// them holds on and goes when it is next somewhere the crew can reach. That is
// also why nothing is dropped by a body that is inside the lab or down a hole:
// it is not standing on the yard at all.
//
// Every body keeps its own clock, set the first time it is looked at, so they do
// not all go at once on the same tick.
function relieve(w, now) {
  // Its own hour -- and it starts somewhere *inside* the cycle rather than a
  // whole one away. Seeding everybody a full interval out is what made a crew
  // hired together go together: they were all handed the same clock at the same
  // moment, so they all came due at the same moment, for ever. Starting each one
  // at a random point of its first cycle breaks them apart on the first pass and
  // the wander keeps them apart after that.
  if (!w.looAt) {
    w.looAt = now + LOO_EVERY * Math.random();
    return false;
  }
  // Nobody waits longer than the interval itself. A body is handed its hour when
  // it is first looked at, so turning the interval down on the dev panel would
  // otherwise do nothing at all until every body already standing there had
  // waited out the old one -- which for a ten-minute default is most of a
  // session of watching nothing happen and concluding the knob is broken.
  if (w.looAt > now + LOO_EVERY) w.looAt = now + LOO_EVERY * Math.random();

  if (w.looUntil) {                        // mid-way through: it is not doing anything else
    if (now < w.looUntil) { w.lunge = 0; return true; }
    // What it leaves, where it was standing, for a janitor to come and clear.
    dropMuckAt(w.x + WORKER / 2, LOO_MUCK, 'poop');
    w.looUntil = 0;
    w.say = null;
    w.looAt = now + LOO_EVERY * (1 + (Math.random() - 0.5) * 2 * LOO_SPREAD);
    return true;                           // one last frame of standing, then back to it
  }

  if (now < w.looAt) return false;
  // finish what you are holding -- and there is nowhere to go from the sky. A
  // wizard aloft is not somewhere a walk can start: it comes down when it has
  // nothing to do, and it can go then.
  if (w.inside || w.inPit || w.aloft || w.carry || w.hasCore) return false;
  // Only while it is working. A body winding down -- nothing to carry, on its
  // way home, or standing about between strolls -- is a body whose day is over,
  // and one that stopped on the way in would leave something for the ones
  // already indoors to come back out and shovel, which is a yard that can never
  // settle. It is also what was asked for: they go while they are working.
  if (w.goal === 'home' || w.goal === 'idle' || w.brk) return false;
  // Nowhere within reach that anybody could clean: hold on. A body down a hole
  // or shut in a building is the case this catches.
  if (cleanSpotNear(w.x + WORKER / 2) == null) return false;
  // It goes where it stands, and says so over its own head -- always, now.
  //
  // There used to be a shed to walk to, and the crew walked to it: across the
  // yard, in, out, and back to work. That is a long way to send somebody, it
  // took them off the job for the length of the walk, and it turned the thing
  // you bought into a place rather than a job. What you buy now is the closet a
  // janitor keeps a shovel in -- the *post*, not the destination -- so the mess
  // still lands where the body was working and somebody whose job it is comes
  // round and clears it. See `capOf`, which is what the closet actually opens.
  w.looUntil = now + LOO_MS;
  w.say = { mark: 'loo', until: w.looUntil };
  w.resting = false;                       // stopped, but this is not a break
  return true;
}

// --- the dance ----------------------------------------------------------------
// A rock is off and the gang have the ground to themselves. This used to be one
// hop on the spot with a fortieth of a pixel of sway on it, played by everybody
// at a half-beat offset -- which on five squares eighteen pixels tall did not
// read as dancing. It read as vibrating.
//
// What was wrong with it was not the size of the hop. It was that nobody *went*
// anywhere and nobody did anything twice. So: three moves, held for a couple of
// beats each and then swapped, and a patch of ground each to do them on. Bodies
// that travel and change what they are doing read as pleased with themselves;
// bodies that stay on their mark read as an animation.
const MOVES = ['hop', 'step', 'spin'];
const JIG_SPREAD = P * 9;          // how far off its mark a body will wander
const JIG_STEP = P;                // and it goes in whole cells, like everything else

// `zone` is the ground the next rock is coming down on, when there is one. The
// dance has to know about it, because the dance travels: a body stepping across
// its patch will walk into the drop zone, the dodge will push it straight back
// out, and the two of them will hold it against that line at sixty steps a
// second. That is not a body dancing near a falling rock, it is a body
// vibrating -- and it is the one thing anybody watching a celebration notices.
function jig(w, now, zone) {
  // a mark to dance around, taken once, so the gang spread out instead of
  // dancing in the line they happened to finish the rock in
  if (w.jigAt == null) {
    w.jigAt = w.x + (Math.random() - 0.5) * JIG_SPREAD * 2;
    w.move = MOVES[Math.floor(Math.random() * MOVES.length)];
    w.moveTil = 0;
    w.jigDir = Math.random() < 0.5 ? -1 : 1;
    // Where in the beat this body is. The gang on the rock are dealt a slot
    // each and used to take it from that, which is fine until somebody who has
    // never been on the rock joins in: a hauler has no slot, and an undefined
    // one turned the whole hop into NaN and parked the body off the top of the
    // world. Anybody can dance now, so the offset belongs to the dance.
    w.jigPh = Math.random() * 2;
  }
  // a new move every couple of beats, and never the one it is already doing
  if (now >= w.moveTil) {
    const other = MOVES.filter(m => m !== w.move);
    w.move = other[Math.floor(Math.random() * other.length)];
    w.moveTil = now + (1400 + Math.random() * 1200);
    w.jigDir = -w.jigDir;
    // and something over its head, now and then rather than every time: five
    // bodies all shouting at once is noise
    if (Math.random() < 0.5)
      w.say = { mark: Math.random() < 0.5 ? 'note' : 'burst', until: now + 900 };
  }
  if (w.say && now >= w.say.until) w.say = null;

  const beat = now / 1000 * DANCE_BEAT + (w.slot != null ? w.slot * 0.5 : w.jigPh);
  const swing = Math.abs(Math.sin(beat * Math.PI));

  if (w.move === 'hop') {
    // straight up, and higher than it was: two cells is a bob, three is a jump
    w.y = w.foot - Math.round(swing * 3) * P;
    return;
  }

  if (w.move === 'step') {
    // sideways in whole cells, turning back at the edge of its patch. The
    // travel is the whole point: a body crossing the ground is doing something
    // a body on its mark is not.
    const off = w.x - w.jigAt;
    if (Math.abs(off) > JIG_SPREAD) w.jigDir = -Math.sign(off);
    // And the ground under a coming rock is not part of anybody's patch. It is
    // a wall to the dance exactly as the edge of the patch is: the body turns
    // and paces the other way, rather than being walked into a place the dodge
    // then has to drag it out of.
    const next = w.x + w.jigDir * JIG_STEP * 0.06;
    if (zone && next + WORKER > zone.from && next < zone.to) w.jigDir = -w.jigDir;
    else w.x = next;
    w.dir = w.jigDir;
    w.y = w.foot - Math.round(swing) * P;        // and a small bob under it
    return;
  }

  // spin: on the spot, but turning -- the one move where what changes is which
  // way it is facing, which on a square is the hat swapping sides
  w.dir = Math.sin(beat * Math.PI * 0.5) > 0 ? 1 : -1;
  w.y = w.foot - Math.round(swing * 2) * P;
}

// wiped when the dance ends, so the next one picks fresh ground
function stopJig(w) {
  w.jigAt = null;
  w.move = null;
  w.moveTil = 0;
  w.jigPh = 0;
}

// --- held up by a rock --------------------------------------------------------
// A rock in the air stops anybody who would have to walk under it to get on with
// the job, and that part is right: the alternative is being shoved back by the
// duck every other frame all the way down.
//
// What was wrong was what they did instead. They stood exactly still for the
// whole fall -- ten seconds of it -- and because a stopped hauler holds the spot
// it stopped on, five of them that had been walking in step stood on the same
// pixel. One body twitching, not a crew waiting.
//
// The gang on the ground are already celebrating the rock that just came off.
// Anybody the next one has stopped joins in: the yard has nothing to do for a
// couple of seconds and may as well look like it is enjoying them.
//
// Clamped out of the footprint on the way through. The dance wanders -- that is
// the whole point of it -- and under a rock that is coming down is the one place
// it must not wander to.
// Nobody dances inside anybody. The dance walks -- that is how it spreads a gang
// out -- but only one of its three moves goes anywhere, so a body that draws two
// hops in a row stays exactly where it stopped, and five that stopped on the same
// pixel stay stacked for as long as the rock takes to come down.
//
// So they elbow apart as well, the same quarter-step the idlers already use. Two
// on the very same pixel have no side to push to, so each takes the way it is
// already facing in the dance, which is its own coin toss.
function elbowJig(w) {
  for (const o of S.workers) {
    if (o === w || o.jigAt == null) continue;
    const d = o.x - w.x;
    if (Math.abs(d) >= ROAM_ELBOW) continue;
    w.x -= Math.sign(d || w.jigDir || 1) * 0.5 * frames();
    return;
  }
}

function heldUp(w, zone, now) {
  w.resting = false;                   // waiting on a rock is not a break
  w.foot = walkY(w.x + WORKER / 2);
  jig(w, now, zone);
  elbowJig(w);
  if (!zone) return;
  if (w.x + WORKER > zone.from && w.x < zone.to) {
    const mid = w.x + WORKER / 2;
    w.x = mid < (zone.from + zone.to) / 2 ? zone.from - WORKER - P : zone.to + P;
    w.jigAt = w.x;                     // and it dances from where it was put
    w.y = stand(w);
  }
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
  // Somebody has walked to a lever and is standing at it. This is the only place
  // in the game a machine starts or stops, which is the point of the walk.
  if (w.leg === 'lever') throwLever(w.throwing);
  S.dirty = true;
  if (w.legs && w.legs.length) { nextLeg(w); return; }
  if (w.leg === 'back') { w.leg = null; w.legs = null; w.walkTo = null; w.walking = false;
                          w.throwing = null; return; }
  settle(w);
}

// A body already at work whose station has a hat lying spare, and which is free
// to go and get it: hands empty, not walking anywhere, not indoors. One at a
// time per station, so buying four helmets is four trips rather than the whole
// gang filing down the hill at once.
// The wizards are in here too, and theirs is the one hat the job cannot be done
// without: a body sent to the sky with nothing on its head walks to the tower,
// picks up what the tower has made, and only then goes up. Everywhere else the
// hat is a doubling; here it is the whole trade.
const KIT_JOBS = ['miners', 'haulers', 'quarriers', 'farmhands', 'wizards'];

// somebody on that job who could go on an errand right now: hands empty, not
// already walking, and not indoors
// ...and not one that is off the ground. A wizard aloft is the one body here a
// walk cannot be handed to: `stepCommute` puts a body on the ground line for the
// length of the walk, which for that one is a four-hundred-pixel drop mid-frame.
// It comes down on its own when it has nothing to do -- see wizard.js -- and
// that is when it can be sent for a hat.
const freeAt = (job, hatted) => S.workers.find(o =>
  JOB_OF[o.type] === job && !!o.trained === hatted && !o.walking &&
  !o.inside && !o.aloft && !o.carry && !o.hasCore);

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

// --- the levers -----------------------------------------------------------------
// Where each machine's lever stands. Derived every time it is asked for, never
// stored: the quarry falls in and is dug out again, the farm is resited when a
// plot is bought, and a remembered x would be a lever in the wrong field.
//
// The jaw's is at the head of the ladder rather than down on the floor of the
// cut beside the machine itself. That is not a fudge -- it is where the hoist
// stands, on the deck over the mouth, and a switch for the whole works belongs
// at the top of the hole rather than at the bottom of it. It also means stopping
// a jaw is not a climb down a ladder into a hole full of machine.
export function leverX(key) {
  if (key === 'jaw') return quarryFace();
  if (key === 'tiller') return plotX(0);
  if (key === 'ram') return rockLeft() - WORKER * 2;
  return null;
}

// Throw it, now, because somebody is standing at it.
//
// `was` is the whole of why a lever is worth throwing twice: `rebalance` only
// ever clamps *down*, so switching a machine on walks the gang to carrying and
// nothing walks them home. The complement is recorded here and given back here.
//
// It cannot put the bodies back itself. `restaff` calls `syncWorkers`, which
// replaces `S.workers` -- and this runs inside the loop that is iterating it. So
// it sets a latch and the frame drains it afterwards. See game.js.
function throwLever(key) {
  const m = machine(key);
  if (!m || !m.bought) return;
  const want = m.ask ? m.ask.on : !m.on;
  const job = (MACHINES.find(x => x.key === key) || {}).job;
  m.ask = null;
  if (m.on === want) return;
  m.on = want;
  if (want) m.was = S[job] || 0;                 // what it is standing in for
  else { S.restaff = { job, want: m.was }; m.was = 0; }
  S.dirty = true;
}

// Somebody to send. Deliberately a wider net than `freeAt`: a lever is not a
// station's own errand, so anybody not otherwise engaged will do -- and that
// matters, because the commonest case is a machine whose own station now holds
// one body and five haulers who used to work there.
//
// The filters are the ones a walk cannot survive. A body in a hole or a building
// is not somewhere a commute can start, one in the air even less so, and one in
// the player's hand is not going anywhere it chose.
const freeForLever = at => {
  let best = null, near = Infinity;
  for (const o of S.workers) {
    if (o.walking || o.inside || o.aloft || o.inPit || o.carry || o.hasCore) continue;
    if (o.lifted || o.falling || o.looUntil) continue;
    const d = Math.abs((o.x + WORKER / 2) - at);
    if (d < near) { near = d; best = o; }
  }
  return best;
};

// One frame of the levers. An ask stands until somebody answers it: if there is
// nobody free this frame there will be somebody next frame, and a lever that
// gave up because the yard was busy would be a lever you had to click twice.
export function stepLevers() {
  for (const m of MACHINES) {
    const r = machine(m.key);
    if (!r || !r.bought || !r.ask) continue;
    // Already on its way. One walk per lever, or the whole yard sets off for the
    // same switch and five of them arrive at a machine that is already running.
    if (S.workers.some(o => o.walking && !o.lifted && o.throwing === m.key)) continue;
    const at = leverX(m.key);
    if (at == null) continue;
    const w = freeForLever(at);
    if (!w) continue;                            // nobody free: the ask stands
    w.throwing = m.key;
    w.legs = [{ to: at, do: 'lever' },
              { to: stationX(w.type) ?? w.x, do: 'back' }];
    nextLeg(w);
  }
}

// --- running a machine ----------------------------------------------------------
// One frame of all three. The beat, the manning rule, and the extra dirt; the
// work itself belongs to the station and is called through its own `bite`.
//
// It lives here rather than in machines.js because it needs the crew, and
// machines.js is imported by `upgrades.js` -- which the quarry, the farm and the
// rock all import in turn. A runner in there that reached back into the stations
// would close that ring. So the stations register what only they can answer and
// this walks the list.

// Somebody of the right trade, standing at the machine and not doing something
// else. This is the yard's oldest rule rather than a new one -- **a station
// idles until somebody is actually standing there** -- and it is what makes the
// whole feature safe: an unmanned machine produces nothing and smokes nothing,
// so a yard under its own smoke with nobody free to stop it cannot get worse.
// The moment the last body walks away, the machine stops.
//
// It is deliberately generous about *which* body. A machine that insisted on one
// particular tender would stop every time that tender went for a hat.
const MACHINE_REACH = WORKER * 3;
function tenderFor(spec, at) {
  for (const w of S.workers) {
    if (w.type !== spec.type) continue;
    if (w.walking || w.inside || w.aloft || w.inPit || w.lifted || w.falling) continue;
    if (w.looUntil) continue;                  // stopped, but not for the machine
    if (Math.abs((w.x + WORKER / 2) - (at + P)) > MACHINE_REACH) continue;
    return w;
  }
  return null;
}

export function stepMachines(now) {
  for (const m of MACHINES) {
    const r = machine(m.key);
    const spec = specOf(m.key);
    if (!r || !spec || !r.bought || !r.on) continue;

    const at = spec.at();
    const tender = tenderFor(spec, at);
    // Unmanned: it does not tick, and -- because `beatAt` is left where it is --
    // it does not bank up a burst of work to do the moment somebody wanders back
    // into reach either. It simply is not running.
    if (!tender) { r.beatAt = now + 200; continue; }
    tender.resting = false;                    // it is working, whatever it looks like
    if (!spec.ready()) { r.beatAt = now + 200; continue; }

    const ms = spec.ms(machineRate(m.job));
    if (!r.beatAt || r.beatAt > now + ms) r.beatAt = now + ms;   // a dial turned down
    if (now < r.beatAt) continue;
    r.beatAt = now + ms;
    if (!spec.bite(tender)) continue;

    // The extra dirt, from the machine's stack, in one place.
    //
    // The station's own work already fouled once where it happened, because it
    // went through the station's own function. What a machine adds is the rest
    // of MACHINE_FOUL -- so this is one call rather than three trebled constants
    // at four call sites, and it is why the stack is worth drawing.
    const extra = Math.max(0, MACHINE_FOUL - 1);
    if (extra > 0) foul(extra, at + P, spec.y ? spec.y() : walkY(at), 'shard');
    S.dirty = true;
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
// `pickPlot`, `elbowed` and `seatX` all filter on type, and somebody walking to a
// job is on that job as far as the books are concerned. What it does not do is
// any of the work, until it gets there.
function retask(w, type) {
  // Off the sky and down. A wizard is the one body here that can be stood down
  // while it is four hundred pixels up, and whatever it is put on next reads its
  // height as the ground it is standing on -- so it has to come down before it
  // does anything else.
  //
  // It floats rather than falls. Gravity put it on the ground in a quarter of a
  // second, which for a body that took the best part of a minute to go up reads
  // as the hat being switched off. It comes down the way it went up.
  if (w.aloft && type !== 'wizard') w.floating = true;
  w.type = type;
  w.fetching = null;
  w.wanting = null;
  // Out of the house. A body that had knocked off is stood indoors and is not
  // drawn -- that is what `inside` is for -- and nothing else in the game clears
  // it, because nothing else in the game takes somebody off carrying. Put one on
  // the quarry straight from the house and it went down the quarry, worked the
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
export const commutePace = () => Math.max(COMMUTE_PACE, haulSpeed() * HAUL_EMPTY);

function stepCommute(w, zone) {
  // Out of the hole by the way it came in. A body down the quarry walks along the
  // floor to the foot of the ladder and goes up it: rising through the wall
  // wherever it happened to be standing was the same not-a-thing-that-happens
  // as sinking into the ground, and the ladder is there to be used both ways.
  //
  // Measured at the feet, not the top of the head. A body is three cells tall,
  // and a cut that has only just been started is shallower than that -- so a
  // quarrier standing in a hole up to its shoulders read as being *above* ground
  // and climbed straight out through the dirt. It never showed while the quarry was
  // a fixed hole a body could only ever be right at the bottom of; it showed the
  // moment the hole started at nothing and got deeper.
  if (w.y + WORKER > S.groundY) {
    const foot = quarryFace();
    if (Math.abs(w.x - foot) > 1) {
      w.y = quarryFloor(w.x + WORKER / 2) - WORKER;
      w.x += Math.sign(foot - w.x) * Math.min(commutePace() * frames(), Math.abs(foot - w.x));
      return;
    }
    w.x = foot;
  }

  // There used to be a block here that got the body to the right height *before*
  // letting it walk at all: "the level of the ground first, and only then along
  // it". Its reason was the quarry -- a quarrier setting off from the bottom of a
  // hole would otherwise rise through the wall on the diagonal -- and that reason
  // is served above, where a body below the ground line walks to the foot of the
  // ladder and goes up it.
  //
  // What was left of it was a body standing on the rock, and there it did harm
  // twice over. It moved `w.y` directly, so `w.foot` -- which is what the walk
  // below climbs with -- was left saying something else, and the two disagreed
  // every frame. And it `return`ed, so while the feet were catching up the body
  // did not move along at all: rise, step, rise, step. Which is a body that
  // cannot climb a slope smoothly.
  //
  // A walk does both at once now. `stand` raises the feet by as much as the body
  // moved along and a half again (see CLIMB_SLOPE), which is enough for any
  // flank, and the two are one movement rather than two taking turns.
  //
  // Except below the ground line, where the old rule still holds and has to:
  // a body at the foot of the ladder goes *up the ladder* before it goes
  // anywhere, or it sets off across the yard on a diagonal through the wall of
  // the quarry. Standing still while it climbs is right here -- that is what a
  // ladder is -- and it is only ever a second of it.
  if (w.y + WORKER > S.groundY + 1) {
    const top = walkY(w.x + WORKER / 2);
    w.y += Math.sign(top - w.y) * Math.min(CLIMB_PACE * frames(), Math.abs(top - w.y));
    w.foot = w.y;               // so the walk above ground carries on from here
    return;
  }

  if (duck(w, zone)) { w.y = stand(w); return; }

  const d = w.walkTo - w.x;
  w.face = Math.sign(d) || w.face || 1;        // a cart is dragged behind
  w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
  // Over the ground, or over whatever is standing on it.
  //
  // `walkY` is the ground line and the bridge -- it does not know about the
  // rock. So a body walking to the rock walked *through* it: across the whole
  // footprint at ground level, buried to the shoulders in the middle of the
  // hill, and only when it arrived and started work did its feet find the
  // surface and haul it up. Which is exactly what running to the centre and then
  // going to the top looks like, because that is what it was.
  //
  // Measured before: twenty-three pixels inside the rock at the halfway mark.
  // `landing` already knows the answer -- the rock's surface where a body is, or
  // the ground where there is no rock -- and `climbTo` walks the feet up it at
  // the pace of the walk. Which is a body going up the side it met.
  w.y = climbTo(w, landing(w));
  if (Math.abs(d) < COMMUTE_SLOP) arrive(w);
}

export function syncWorkers() {
  // Every job, and this list is the one that decides whether a job exists at all.
  // A job missing from here has a count on the boards and no bodies in the yard:
  // `room[w.type]` comes back undefined, every body of that type is stood down on
  // the frame it is made, and the station runs on the number alone with nobody
  // ever walking to it.
  const want = { miner: S.miners, hauler: S.haulers, quarrier: S.quarriers,
                 farmhand: S.farmhands, labber: S.labbers,
                 scrubber: S.scrubbers, janitor: S.janitors, wizard: S.wizards };
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
      else S.workers.push(Object.assign(FACTORY[type](), newRecord()));
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

// --- picking somebody up ------------------------------------------------------
// You can pick a body up and put it down somewhere else, and that is all it
// does: it does not put them on a job, it does not take them off one, it moves
// them. Whoever you drop walks back to whatever they were doing from wherever
// you left them.
//
// So it is a toy, and it is meant to be. The one thing it is *for* is that
// these are people now -- they have names and ages and a record of what they
// have shifted -- and a yard full of people you can only address as a number on
// a roster is a yard that says so and does not mean it.
//
// The right button, held. The left one is the whole game -- swinging, sweeping,
// catching -- and a body is eighteen pixels moving about on top of the dust you
// are trying to sweep, so anything that competes for a left-press competes with
// the thing you do most. And a press-and-hold is no good either: they walk.
export function workerAt(x, y) {
  const pad = P * 1.5;
  for (let i = S.workers.length - 1; i >= 0; i--) {
    const w = S.workers[i];
    if (w.inside || indoors(w) || inHouse(w) || underground(w)) continue;
    if (x < w.x - pad || x > w.x + WORKER + pad) continue;
    if (y < w.y - pad || y > w.y + WORKER + pad) continue;
    return w;
  }
  return null;
}

export const lifted = () => S.workers.find(w => w.lifted) || null;

export function lift(w) {
  if (!w) return false;
  for (const o of S.workers) o.lifted = false;
  w.lifted = true;
  // An errand it was in the middle of is dropped, and the lever it was walking
  // to goes back into the pile of things wanting doing. Without this, picking up
  // the one body on its way to a lever would leave the ask claimed for ever by a
  // pair of hands that is now in yours: the dispatcher sees somebody already on
  // their way and stands everybody else down, and the machine never starts.
  //
  // The *ask* is not cancelled, only the walk. What you asked for is still what
  // you want, and somebody else can go.
  w.throwing = null;
  w.legs = null;
  w.leg = null;
  w.walking = false;
  // Picked out of the sky. Whatever it was hanging off is no longer its
  // business, and it is not aloft any more either -- it is in your hand, and
  // what happens when you let go is what happens to anything you let go of.
  w.aloft = false;
  w.cell = null;
  // whatever it was in the middle of, it is not any more: a body in the air has
  // claimed nothing and booked nothing
  if (w.claim >= 0) w.claim = -1;
  unbook(w);
  w.walking = false;
  w.legs = null;
  w.brk = null;
  w.say = null;
  S.dirty = true;
  return true;
}

// Let go of. It falls -- properly, under the same gravity everything else in
// this yard falls under, rather than being lowered on a wire -- and picks its
// job up again where it lands.
//
// Nothing is reassigned either way. If it came down on its own station it is
// already at work; if it came down anywhere else it walks back. A body dropped
// down the far end of the yard is a body with a walk ahead of it, which is the
// entire joke and the entire point.
// Thrown, not lowered. A body leaves your hand with whatever you were doing with
// your hand -- the same flick the dust is thrown with, off the same trail of
// cursor samples, so a hand that had stopped moving before it let go drops the
// body where it stands and a hand still travelling sends it.
//
// A share of the flick rather than all of it, and capped: a person is heavier
// than a grain, and a body flung the length of the yard is a body with a very
// long walk back. It is a toy, and a toy that punishes you for playing with it
// is not one.
export function drop(w) {
  if (!w) return;
  const v = throwVel();
  w.lifted = false;
  w.falling = true;
  w.vx = Math.max(-HURL_MAX, Math.min(HURL_MAX, v.vx * HURL));
  w.vy = Math.max(-HURL_MAX, Math.min(HURL_MAX, v.vy * HURL));
  // Shaken about rather than thrown: it lands not knowing which way is up. The
  // count is taken while it is in your hand -- see `shakeHeld` -- and spent
  // here, so one shaking is one dizzy spell however long you keep hold of it.
  if (w.shook >= SHAKE_TURNS) w.dizzyFor = DIZZY_MS;
  w.shook = 0;
  w.turnedAt = 0;
  w.lastDir = 0;
  S.dirty = true;
}

// --- shaking somebody ---------------------------------------------------------
// Waggling a held body back and forth is a different act from throwing it, and
// the difference is direction changes rather than speed: a throw goes one way,
// a shaking goes both. So the changes are counted, and they lapse -- four of
// them inside three-quarters of a second is a shaking, four spread over a minute
// of carrying somebody about is just carrying somebody about.
export function shakeHeld(w, dx) {
  if (!w || Math.abs(dx) < 1) return;
  const dir = Math.sign(dx);
  const t = now();
  if (t - (w.turnedAt || 0) > SHAKE_WINDOW) w.shook = 0;   // lapsed: start again
  if (w.lastDir && dir !== w.lastDir) {
    w.shook = (w.shook || 0) + 1;
    w.turnedAt = t;
  }
  w.lastDir = dir;
}

// Where a dropped body comes to rest: the rock if it is over the rock, the
// ground if it is not. Put a miner on the rock and it should land on the rock.
function landing(w) {
  const mid = w.x + WORKER / 2;
  if (boulderAlive() && mid > rockLeft() && mid < rockLeft() + S.gw * P) {
    const col = colAtX(mid);
    if (S.rockTops[col] >= 0) return standOn(rockTopY(col));
  }
  return walkY(mid);
}

// one frame of that fall, and what happens when it stops
function fall(w) {
  // It travels while it falls now, and the ground it is going to land on is
  // whatever is under it *there* -- so the foot is read after the step, not
  // before it, or a body thrown onto the rock would stop in the air where the
  // rock was not.
  // Falling, in frames rather than in frames' worth of arithmetic. Speeds are
  // pixels a frame and gravity is pixels a frame a frame, so both are stepped by
  // however long this frame was; the drag is a proportion of what is left, so it
  // is raised to that power instead. At sixty all three come out exactly as they
  // were written.
  const f = frames();
  if (w.vx) {
    w.x += w.vx * f;
    w.vx *= HURL_DRAG ** f;
    // The yard has ends. A body thrown at one bumps off it rather than sailing
    // out of the world and walking back in from nowhere.
    const lo = yardLeft(), hi = pit.x + pit.w - WORKER;
    if (w.x < lo) { w.x = lo; w.vx = -w.vx * 0.4; }
    if (w.x > hi) { w.x = hi; w.vx = -w.vx * 0.4; }
    if (Math.abs(w.vx) < 0.05) w.vx = 0;
  }
  const foot = landing(w);
  w.vy += GRAV * f;
  w.y += w.vy * f;
  if (w.y < foot) return;
  w.y = foot;
  w.vy = 0;
  w.vx = 0;
  w.falling = false;
  w.foot = null;                   // it climbs to wherever it is standing now
  // and if it was shaken on the way up, it stands there seeing stars first
  if (w.dizzyFor) {
    w.dizzyUntil = now() + w.dizzyFor;
    w.say = { mark: 'dizzy', until: w.dizzyUntil };
    w.dizzyFor = 0;
  }
  // Straight back to it if this is where it works, and a walk if it is not.
  if (atStation(JOB_OF[w.type], w.x + WORKER / 2)) settle(w);
  else retask(w, w.type);
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
// apart a little, the way the gang on the rock and the crew down the quarry do.
function elbowIdle(w) {
  for (const o of S.workers) {
    if (o === w || o.type !== 'hauler' || o.inside || o.goal !== 'idle') continue;
    const d = o.x - w.x;
    if (Math.abs(d) >= ROAM_ELBOW) continue;
    w.x -= Math.sign(d || 1) * 0.25 * frames();
    return;
  }
}

// Nobody shovels inside anybody. The same quarter-step the idlers take, for the
// one job the whole crew drops everything to do at once.
// Only when two of them are genuinely standing in each other.
//
// It used to push at anything within a body and a half, every frame, while the
// body it was pushing was walking back towards the patch it had claimed -- so a
// shovelling gang slid back and forth on the spot for the whole clear-up, each
// body shoved out and walking in again sixty times a second. The claims already
// keep them four columns apart (see `nearestMuck`); this is only for the end of
// a clear-up, when the last patch is claimed by somebody and a second body comes
// for it anyway.
function elbowMuck(w) {
  for (const o of S.workers) {
    if (o === w || o.inside || o.goal !== 'muck' || o.inPit) continue;
    const d = o.x - w.x;
    if (Math.abs(d) >= WORKER * 0.8) continue;
    // Two on the very same pixel have no side to push to. The tiebreak is where
    // each stands in the crew list, so they alternate and actually come apart --
    // a coin toss they both call the same way leaves them stacked for ever.
    const tie = S.workers.indexOf(w) % 2 ? 1 : -1;
    w.x -= Math.sign(d || tie) * 0.35 * frames();
    // Sideways, and nothing else. It used to plant the feet on the ground line
    // after the nudge, which is right for the yard and wrong on the hill: a
    // miner shovelling the crest was dropped the height of the rock on every
    // frame it stood too close to somebody, and lifted back up on every frame it
    // did not -- the body flickering between the top of the rock and the ground
    // for as long as the two of them were shoulder to shoulder. Height belongs
    // to whoever is doing the job; the elbow only says where along the ground.
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
      // down at the plots -- somebody should still go out and get it.
      if (c < 0 || c > last || taken.has(c)) continue;
      if (at(floor, c, 0)) return c;
    }
  }
  return -1;
}

// Something that is not dust is worth crossing the yard for: it is one grain and
// it is worth a whole shard. Workers take the nearest column of anything, so
// without this a shard out at the plots waits for the whole yard to be swept
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

// How much more this trip will hold.
const roomLeft = w => load(w) - (w.carry || 0);

// Whether anything on the ground is backing up.
//
// A pile that fills stops the station behind it: the rock stops coming apart,
// the quarry stops being cut. A find lying on the ground stops nothing at all -- it
// is worth money and it is in nobody's way. So while a heap is near its limit
// the dust is the urgent thing and the find can wait, which is the other way
// round from the rest of the time.
//
// Three quarters rather than full, because full is already too late: by then the
// station has stopped, and what you want is the crew turning up before it does.
const BACKED_UP = 0.75;
const pilingUp = () => S.piles.some(p =>
  (S.pileCount[p.key] || 0) >= (PILE_LIMIT[p.key] || Infinity) * BACKED_UP);

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
  // And who is going for which patch of muck. Rebuilt each pass rather than kept
  // on the bodies: a shovelling body is not carrying a claim around the way a
  // fetching one is -- it walks to a mess, clears it, and looks again -- so the
  // only thing that has to be true is that two of them starting out on the same
  // frame do not start out for the same cell.
  // Going and shovelling, as one thing a body can be told to do, because two
  // different kinds of body have to be able to do it.
  //
  // This used to live inline in the shared part of the loop, below the miners'
  // own branch -- and that branch ends in `continue`, so a miner never reached
  // it. That was invisible while the rock was worth swinging at. It stops being
  // invisible the moment the rock's pile fills up, which is what happens when
  // the hole is full and the haulers cannot clear it: the miners stand down,
  // "free to take five", and take five under a yard of muck with nothing else
  // in the world to do. Idle bodies and a mess is the one combination this
  // whole idea was written to rule out.
  //
  // Returns true if the body is on muck duty and has had its turn this frame.
  function takeMuck(w) {
    // Two kinds of mess, and they are not the same job.
    //
    // What the sky drops is weather. It lands on everybody's yard and everybody
    // clears it, the way they always have. What a body leaves behind is a body's
    // own, and that is a post: it lies there until you put somebody on it, and
    // there is nobody to put on it until the shed is up. Which is what the shed
    // buys -- not a tidier yard, but the job. See `capOf` and `sweepMuckAt`.
    if (w.carry || w.hasCore || muckFor(w) <= 0) return false;
    // One body, one column, held until that column is clear -- the same
    // booking a hauler makes on a column of dust.
    //
    // The set below is rebuilt every pass, so on its own it only stopped two
    // bodies choosing the same column *in the same frame*: every one of them
    // then re-chose the nearest the very next frame, and the whole crew walked
    // to the same spot anyway. A claim has to be kept to be a claim.
    if (w.muckAt != null && muckAtCol(w.muckAt) <= 0) w.muckAt = null;
    if (w.muckAt == null) {
      const pick = nearestMuck(w.x + WORKER / 2, muckTaken, w);
      w.muckAt = pick == null ? null : Math.floor(pick / P);
    } else {
      muckTaken.add(w.muckAt);
    }
    // The patch, and the ground to work it from. They are the same place out on
    // the yard and they are not on the rock, the quarry or the plots: a body cannot
    // stand on a site, so it walks to the edge of it and reaches across. The
    // claim is still the muck's own column, so it is held until that column is
    // clear rather than until the ground beside it is.
    const patch = w.muckAt == null ? null : w.muckAt * P + P / 2;
    const to = patch == null ? null : workSpot(patch);
    if (to == null) return false;
    if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
    unbook(w);
    // Out of the house first. A mess is the one thing that calls a body back
    // off its own doorstep, and this runs before the going-home branch --
    // so a body indoors used to pick up a shovel without ever coming out,
    // and worked the yard invisible and still counted as being at home.
    w.inside = false;
    w.goal = 'muck';
    // Off the rock, and down -- but climbed down, not dropped down.
    //
    // This used to put the body's feet on the ground line the moment the job
    // came up, on the reasoning that a miner going shovelling is a miner off the
    // rock. It is, eventually; it is not off it in the frame it decides to go.
    // A body standing on the crest with muck to clear fell ninety pixels in one
    // frame -- the height of the hill, from the top of it to the yard, between
    // one frame and the next -- and then walked to the mess. Which is the one
    // thing this file exists to not do.
    //
    // Nothing needs setting. `foot()` below already asks where the body is: on
    // the rock's footprint it climbs to the rock's surface, off it, it walks the
    // ground -- and `climbTo` eases from wherever the feet actually are, in
    // either direction. A miner leaving the crest walks down it the way it
    // walked up.
    if (w.type === 'miner') {
      if (w.jigAt != null) { stopJig(w); w.say = null; }
      w.resting = false;
      w.idleAt = null;
    }
    const d = to - WORKER / 2 - w.x;
    // Where its feet go while it is doing this: the ground, or the face of the
    // rock if that is what it is standing on. Climbed to rather than assigned,
    // so a body going up the hill goes up it rather than appearing at the top --
    // the same climb the gang working the rock make.
    // Always eased, whichever side of the rock's edge the body is standing on.
    // Only the rock branch used to climb and the ground branch set the height
    // outright, so a body shovelling at the foot of the hill -- where a pixel of
    // sway puts its middle on and off the footprint from one frame to the next --
    // flicked between the crest and the yard as the two branches took turns. The
    // question the edge answers is *where it is going*, not how fast it gets
    // there.
    const foot = () => climbTo(w, onRock(w.x + WORKER / 2) && boulderAlive()
      ? landing(w) : walkY(w.x + WORKER / 2));
    // walk to it, then shovel: it is somewhere you go, not something that
    // happens wherever you are standing
    if (Math.abs(d) > P * 2) {
      w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
      w.dir = Math.sign(d);
      w.y = foot();
    } else {
      // Arrived: it stands still and shovels. It used to keep walking the last
      // two cells in towards the exact column it had claimed while the elbow
      // pushed it back out again -- a body sliding on the spot for as long as
      // there was muck in front of it.
      w.y = foot();
      sweepMuckAt(w.x + WORKER / 2, MUCK_SWEEP * (dt / 1000), w);
      w.lunge = 1;
      // and not shoulder to shoulder with the next one. A yard under muck
      // has something to shovel wherever you stand, so a gang that arrived
      // together would each find work on the spot they arrived on and clear
      // the whole mess as one lump you cannot count.
      elbowMuck(w);
    }
    return true;
  }

  const muckTaken = new Set();
  // and the columns already spoken for by bodies that are on their way to them
  for (const w of S.workers) if (w.muckAt != null) muckTaken.add(w.muckAt);
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
    // in the air, on the cursor: not doing anything, and nothing being done to it
    if (w.lifted) continue;
    if (w.falling) { fall(w); continue; }
    // and a body drifting down out of the sky, which is a body doing nothing
    // else until its feet are down -- see `floatDown`
    if (w.floating) { if (!floatDown(w)) continue; }
    // on its way to a job it has just been put on, and doing none of it yet
    if (w.walking) { stepCommute(w, zone); continue; }

    // and now and then a body has to stop, whatever it was doing
    if (relieve(w, now)) continue;

    if (w.type === 'miner') {
      // The rock is off. The crew take five on the bare ground. It runs until the next
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
        // Everything that puts a miner somewhere other than on the rock has to
        // say so, or the climb picks up again from wherever it was standing
        // before -- a body that danced on the bare ground and then went back to
        // work would jump the whole height of the rock in one frame.
        // Out of the way first -- and its mark comes with it, so the dance it
        // goes back to is on the ground it has been moved to rather than the
        // ground it was moved off.
        if (duck(w, zone)) {
          w.y = w.foot = standOn(S.groundY);
          if (w.jigAt != null) w.jigAt = w.x;
          continue;
        }
        w.foot = standOn(S.groundY);
        jig(w, now, zone);
        continue;
      }

      // Back to it. The dance leaves its ground and its move behind, so the next
      // rock is celebrated somewhere else -- and the say goes with it, or a body
      // walks back up the hill still shouting about the last one.
      if (w.jigAt != null) { stopJig(w); w.say = null; }

      // And a mess on the rock comes before the rock. It used to come before
      // nothing but standing about: a miner picked up a shovel only when its
      // pile was full and there was no swing left to take, and the layer on the
      // rock was not something a shovel could touch at all -- it was worked off
      // a swing at a time by whoever happened to be mining. Nobody mining meant
      // nobody clearing, for the rest of the run: a full pile, a crew with
      // nobody on the rock, or the gap between one rock and the next all left
      // the face under muck for good.
      //
      // Its own site and not the whole yard. Muck lying on the thing it is
      // stood on is in its way and it clears it; muck out on the yard is the
      // haulers' job, and a gang that downed tools for every patch anywhere
      // would stop mining altogether for the minute and a half a full rain
      // takes to shift.
      if (rockMuck() > 0 && takeMuck(w)) continue;
      // and back up the hill when the face is clear. A miner carries no goal of
      // its own, so the shovel's is put down with the shovel.
      if (w.goal === 'muck') { w.goal = null; w.muckAt = null; }

      // The crew climb the hill and work it from the top down. Each one keeps a
      // stretch of the crest to itself, stands on whatever rock is left there and
      // sinks with it as the rock goes; when its stretch is bare it ambles along
      // to the nearest that is not.
      // The rock's pile is full. The crew stand where they are until it has
      // been carried away: dust with nowhere to go used to roll into the pit,
      // which banks it for nothing and leaves the haulers with no job.
      if (S.pileFull.rock) {
        // Nothing to swing at and a mess anywhere in the yard: go and clear it.
        // Standing about under muck is the one combination this whole idea was
        // written to rule out.
        if (takeMuck(w)) continue;
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
        w.y = climbTo(w, standOn(surf)) - (Math.sin(idle) > 0.9 ? P : 0);
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
        w.x += w.dir * MINER_WALK * 2.5 * frames();              // brisk, it has ground to make up
      } else {
        const step = w.x + w.dir * MINER_WALK * frames();
        if (inBand(colAtX(step + WORKER / 2)) && !elbowed(w, step)) w.x = step;
        else w.dir = -w.dir;
      }

      const col = colAtX(w.x + WORKER / 2);
      const surf = rockTopY(col);
      w.lunge *= 0.82;
      // Where it is standing, climbed to rather than assigned. The bob and the
      // swing go on top of the foot, not into it: they are what the body is
      // doing, and easing them would damp them into nothing.
      w.y = climbTo(w, standOn(surf)) + Math.sin(t * w.sp + w.ph) * 1.2 + w.lunge * P * 1.4;

      if (boulderAlive() && now >= w.next && S.rockTops[col] >= 0) {
        // twice the bite for a breaker: the shards bought a bigger swing on a
        // body that is not going anywhere
        const bite = minerBite() * (w.trained ? 2 : 1);
        knockOff(w.x + WORKER / 2, surf + P / 2, bite);
        w.mined = (w.mined || 0) + bite;
        w.lunge = 1;
        w.next = now + minerMs() * (0.85 + Math.random() * 0.3);    // never quite in time
      }
      continue;
    }

    // A mess on its own site comes before the station, the same as it does for
    // the gang on the rock: what is lying on the quarry or on the plots is in the
    // way of the body working it. This used to run only when their own pile was
    // full -- their branches end in `continue`, above the shovelling -- so a
    // working quarry and a working farm meant two bodies walking over the muck
    // all day, and the layer on the quarry and the plots could only be dug and
    // tended through, a cell at a time, by whoever happened to be there.
    //
    // The rest of the yard they leave to the haulers -- unless their own pile is
    // full, in which case there is nothing else for them to be doing.
    //
    // Only from the surface. A quarrier at the bottom of the quarry walks to the
    // ladder and climbs it first -- see `stepQuarrier` -- and arrives here on
    // the ground like anybody else.
    const upTop = w.y + WORKER <= S.groundY + 1;
    const mine = w.type === 'quarrier' ? quarryMuck() > 0 || S.pileFull.quarry
               : w.type === 'farmhand' ? plotMuck() > 0 || S.pileFull.farm : false;
    if (mine && upTop && takeMuck(w)) continue;
    // and back to the station when the mess is gone or the pile has been
    // cleared: `to` is the walk to it, for both of them, so nobody is put back.
    if (w.goal === 'muck' && (w.type === 'quarrier' || w.type === 'farmhand')) {
      w.goal = 'to';
      w.muckAt = null;
    }
    if (w.type === 'quarrier') { stepQuarrier(w, now); continue; }
    if (w.type === 'farmhand') { stepFarmhand(w, now, dt); continue; }
    if (w.type === 'labber') { stepLabber(w); continue; }
    if (w.type === 'scrubber') { stepScrubber(w); continue; }
    // The mess, and whoever is on it. A janitor does one thing: it walks to the
    // nearest muck and shovels it. With nothing left to shovel it goes back to
    // its shed and waits there, which is where you will look for it.
    if (w.type === 'janitor') {
      if (takeMuck(w)) continue;
      w.goal = 'to';
      w.muckAt = null;
      const post = stationX('janitor');
      const d = post - w.x;
      if (Math.abs(d) > WORKER) {
        w.face = Math.sign(d) || w.face || 1;
        w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
        w.y = stand(w);
      } else {
        w.resting = true;
        w.y = stand(w);
      }
      continue;
    }
    // The one job that is not on the ground. Nothing else in the loop applies to
    // a body in the sky -- there is no rock to dodge up there, no lip to stop at
    // and no muck to shovel -- so it is taken out of the yard's rules entirely,
    // the same way a body down the hole is.
    if (w.type === 'wizard') { stepWizard(w, now); continue; }

    // Down the hole, and nothing else applies.
    //
    // This is checked before everything, including the dodge -- a body on a
    // ladder inside the pit is not standing where a rock can land on it, and it
    // cannot go anywhere but up or down anyway. It was in the middle of the
    // hauler's decisions to begin with, under the dodge, and the dodge put it
    // back on the ground line every other frame: the climb pushed it two pixels
    // down the ladder, the dodge lifted it two back, and the pair of them held it
    // at the top of the ladder for ever, taking turns.
    // Which patch this one is going for -- the same claim `takeMuck` makes, made
    // here so that the trip down the hole is made against it too. It used to ask
    // for the nearest muck outright, claims and all ignored, so every hauler in
    // the yard worked out the same patch in the bottom of the hole, went down
    // for it together and stood in one another on the one column until it was
    // gone. One patch, one body, in the hole as much as out of it.
    if (!w.carry && !w.hasCore) {
      if (w.muckAt != null && muckAtCol(w.muckAt) <= 0) w.muckAt = null;
      if (w.muckAt == null && muckLeft() > 0) {
        const pick = nearestMuck(w.x + WORKER / 2, muckTaken, w);
        w.muckAt = pick == null ? null : Math.floor(pick / P);
      } else if (w.muckAt != null) {
        muckTaken.add(w.muckAt);
      }
    }
    const inHole = w.inPit || (!w.carry && !w.hasCore && muckLeft() > 0)
      ? (w.muckAt == null ? null : w.muckAt * P + P / 2) : null;
    // in the hole, over the hole, or on the other side of it: all one errand
    const wrongSide = inHole != null && pastPit(inHole) !== !!w.farSide;

    // And a body stranded out past the far wall with nothing left to do out
    // there comes home, whether or not there is muck anywhere to call it back.
    // Without this the far side was a one-way trip: the crossing only ever ran
    // while there was muck to chase, so the last body to finish out there stood
    // on ground the lip clamp would not let it leave, for good.
    const marooned = w.farSide && !w.inPit && !w.carry && !w.hasCore && !muckPastPit();

    if (w.inPit || overPitMouth(inHole) || wrongSide || marooned) {
      if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
      unbook(w);
      w.goal = 'muck';
      downTheHole(w, marooned ? null : inHole, dt);
      continue;
    }

    // hauler: a rock coming down beats anything it was carrying or fetching.
    // It keeps its claim and picks the job up again on the far side.
    if (duck(w, zone)) { w.y = stand(w); continue; }

    // The rock has landed and this one was dancing while it came down. Put the
    // dance away before it walks off, or it carries the hop and the shout on to
    // the next thing it does -- the same tidy-up the gang on the rock do.
    if (w.jigAt != null && S.rockFall <= 0) { stopJig(w); w.say = null; }

    // fetch a loose core if there is one, else scoop dust, then tip it all
    // over the ledge
    if ((w.goal === 'seek' || w.goal === 'idle') &&
        S.coreItem && S.coreItem.rest && !S.heldCore && !w.hasCore &&
        (!S.coreTaker || S.coreTaker === w) && bookRoom(w, 1) > 0) {
      S.coreTaker = w;
      if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }   // the core comes first
      const target = S.coreItem.x + CORE_SIZE / 2 - WORKER / 2;
      // held up, and dancing rather than standing there: see heldUp
      if (across(zone, w.x, target)) { heldUp(w, zone, now); continue; }
      const pace = haulSpeed() * HAUL_EMPTY;
      w.x += Math.sign(target - w.x) * Math.min(pace * frames(), Math.abs(target - w.x));
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

    // The lip, and everybody stops at it -- on whichever side of the hole they are
    // standing. This is the line that keeps the crew out of the pit, and it is
    // right for every errand but one: the hole is where dust goes, not where a
    // body with a load in its hands walks.
    //
    // It has two sides now, because the crew can be on either. Written as one
    // wall it dragged a body that had climbed out the far ladder straight back
    // across the mouth, which is the clamp undoing the only reason anybody went
    // down there.
    if (!w.inPit) {
      if (w.farSide) { if (w.x < pit.x + pit.w) w.x = pit.x + pit.w; }
      else if (w.x > pit.x - WORKER) w.x = pit.x - WORKER;
    }
    w.y = stand(w);

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

    // Muck lying about the yard comes first.
    //
    // It used to be what a body did when it had nothing else on, which meant it
    // was never done: there is always dust to fetch, so a yard under an inch of
    // muck stayed under an inch of muck while the crew walked over it carrying
    // grains. Clearing up is the job when there is a mess -- the dust is not
    // going anywhere and the mess is in everybody's way.
    //
    // Hands full is the one exception: a body already carrying a load finishes
    // the trip first. Putting a load down to pick up a shovel is a load on the
    // floor and a trip wasted.
    if (takeMuck(w)) continue;
    if (w.goal === 'muck') { w.goal = 'idle'; w.muckAt = null; }   // the yard is clear
    if (w.goal === 'seek') {
      // It keeps the column it set off for until that column is bare. Picking
      // the nearest one afresh every frame is what made the crew swarm.
      if (w.claim >= 0 && !at(floor, w.claim, 0)) { taken.delete(w.claim); w.claim = -1; }
      if (w.claim < 0) {
        // Book the hole before picking a column, not after filling your hands.
        // Nothing at all is fetched without room for it -- a shard on the ground
        // with a full hole behind it is a shard that stays on the ground.
        if (bookRoom(w) > 0) {
          // A find first, if there is one -- unless the heaps are backing up, and
          // then the dust first, because that is the half of it that stops the
          // yard working. Whichever is chosen, the other is the fallback: a body
          // that came out to fetch goes back with something.
          const mark = nearestMark(w, taken);
          const dust = nearestDust(w.x, taken);
          const first = pilingUp() ? dust : mark;
          const other = pilingUp() ? mark : dust;
          const pick = first >= 0 ? first : other;
          // And nothing further off than the hole is, once the hands are more
          // than half full.
          //
          // A find is taken before dust however far away it lies, which is right
          // -- a green one is worth crossing the yard for. It is not right for a
          // body with one grain of room left: it walks the length of the world,
          // past the hole it could have emptied into on the way, to fetch one
          // thing it can barely hold, while an empty pair of hands behind it
          // fetches dust from under its feet. So the walk has to be worth the
          // room: half a load or more free and it goes anywhere, and under that
          // it takes what is nearer than the hole or banks what it has and comes
          // back out empty, when the whole yard is open to it again.
          const far = pick >= 0 &&
            Math.abs((floor.x + pick * P) - w.x) > Math.abs(pit.x - w.x);
          if (pick >= 0 && !(far && roomLeft(w) <= load(w) / 2)) {
            w.claim = pick; taken.add(pick);
          }
        }
      }
      if (w.claim < 0) { w.goal = w.carry ? 'dump' : 'idle'; continue; }
      const c = w.claim;
      const target = floor.x + c * P;
      // held up, and dancing rather than standing there: see heldUp
      if (across(zone, w.x, target)) { heldUp(w, zone, now); continue; }
      // hands free, so it moves; a load is what slows it down
      const pace = haulSpeed() * HAUL_EMPTY;
      w.face = Math.sign(target - w.x) || w.face || 1;   // a cart is dragged behind
      w.x += Math.sign(target - w.x) * Math.min(pace * frames(), Math.abs(target - w.x));
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
      // held up, and dancing rather than standing there: see heldUp
      if (across(zone, w.x, target)) { heldUp(w, zone, now); continue; }
      w.face = Math.sign(target - w.x) || w.face || 1;
      w.x += Math.sign(target - w.x) * Math.min(haulSpeed() * frames(), Math.abs(target - w.x));
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
        w.stored = (w.stored || 0) + w.carry;
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
      if (across(zone, w.x, door)) { heldUp(w, zone, now); continue; }
      w.face = Math.sign(door - w.x) || w.face || 1;
      w.x += Math.sign(door - w.x) * Math.min(HOME_WALK * frames(), Math.abs(door - w.x));
      w.y = stand(w);
      if (Math.abs(door - w.x) < 1) { w.inside = true; w.x = door; S.dirty = true; }
    } else {
      // Nothing to fetch and nothing to carry. Rather than standing to
      // attention they amble: a spot to stroll to, a stand about when they get
      // there, then another. A yard at rest should read as at rest, not as
      // switched off.
      unbook(w);                  // idle hands hold no room
      if (!noRoom && nearestDust(w.x, taken) >= 0) { w.goal = 'seek'; w.idleSince = 0; continue; }

      // A rock has just come off, or the next one is on its way down, and this
      // body has nothing to do about either. It joins in rather than ambling
      // about with its hands in its pockets: the gang on the ground are already
      // celebrating, and a yard where half of it is dancing and the other half
      // is strolling reads as half the yard not having noticed.
      //
      // Everything the dance needs is here -- it spreads out from where it
      // stands, and it elbows clear of anybody it is standing in.
      if (now < S.danceUntil || S.rockFall > 0) { heldUp(w, zone, now); continue; }

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
        if (across(zone, w.x, w.roamTo)) { w.roamTo = null; heldUp(w, zone, now); continue; }
        w.face = Math.sign(d) || w.face || 1;
        // its own legs, not everybody's
        w.x += Math.sign(d) * Math.min(haulSpeed() * ROAM_PACE * (w.amble || 1) * frames(), Math.abs(d));
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
