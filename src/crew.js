// The crew: who they are, where they stand and what they do with their hands.
//
// Miners take the rock off in layers; workers carry dust to the pit. A new kind
// of worker is a new `type` and a new branch in updateWorkers -- and, when the
// quarry and the farm arrive, its own file.

import { P, WORKER, CORE_SIZE, DANCE_BEAT, HAUL_EMPTY, DUCK_PACE, IDLE_BEAT, IDLE_STRIDE,
        COMMUTE_PACE, COMMUTE_SLOP, CLIMB_PACE, HOME_AFTER, HOME_WALK, ROCK_CLEAR, GRAV,
        MUCK_SWEEP, LOO_EVERY, LOO_SPREAD, LOO_MS, LOO_MUCK,
        HURL, HURL_MAX, HURL_DRAG, SHAKE_TURNS, SHAKE_WINDOW, DIZZY_MS } from './config.js';
import { S, floor, pit, bench } from './state.js';
import { at, put, colOf } from './grid.js';
import { standOn, walkY, rockLeft, yardLeft, kitX, atStation, overPitMouth } from './world.js';
import { throwVel } from './hands.js';
import { boulderAlive, knockOff, rockTopY, dropZone } from './rock.js';
import { spawnChip, bell, aim } from './dust.js';
import { pitRoom } from './pit.js';
import { minerMs, haulCap, haulSpeed, scoopMs, minerBite, hats, worn, spareKit, JOB_OF } from './upgrades.js';
import { stepQuarrier, newQuarrier, quarryFace, quarryFloor, underground } from './quarry.js';
import { stepFarmhand, newFarmhand, bedX } from './farm.js';
import { stepLabber, newLabber, labDoor, indoors } from './lab.js';
import { stepScrubber, newScrubber, scrubDoor, inHouse } from './scrubhouse.js';
import { now } from './clock.js';
import { sweepMuckAt, yardMuck, nearestMuck, pitLadder, pitTop,
         pitSide, pastPit, muckPastPit, dropMuckAt, cleanSpotNear, NEAR, FAR } from './smog.js';
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
  w.foot += Math.sign(d) * Math.min(Math.abs(d), Math.max(CLIMB_MIN, Math.abs(d) * CLIMB_SHARE));
  return w.foot;
}
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
  quarried: 0,                     // shards brought up out of the cut
  farmed: 0,                       // spores taken off the beds
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
const TYPES = ['miner', 'quarrier', 'farmhand', 'labber', 'scrubber', 'hauler'];
export const FACTORY = { miner: newMiner, quarrier: newQuarrier, farmhand: newFarmhand,
                  labber: newLabber, scrubber: newScrubber, hauler: newHauler };

// Where each job is done, for a body on its way to it. Carrying has no station:
// the dust is wherever it fell, so somebody put on it is already at work.
function stationX(type) {
  if (type === 'miner') return S.cx - WORKER / 2;
  if (type === 'quarrier') return quarryFace();
  if (type === 'farmhand') return bedX(0);
  if (type === 'labber') return labDoor() - WORKER / 2;
  if (type === 'scrubber') return scrubDoor() - WORKER / 2;
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
    w.y = walkY(w.x + WORKER / 2);
    w.dir = Math.sign(d) || 1;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(commutePace(), Math.abs(d));
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
    const foot = pitTop(w.x + WORKER / 2) - WORKER;
    w.y = Math.min(w.y + CLIMB_PACE, foot);
    if (w.y >= foot) w.inPit = want === (w.side || NEAR) && !pastPit(to) ? 'dig' : 'cross';
    return;
  }

  // Along the top of the pile to the patch, and shovel it. The surface is not
  // level -- a pile heaps under the lip and runs away downhill -- so it walks the
  // shape of it the way a quarrier walks the floor of the cut.
  if (w.inPit === 'dig') {
    if (to == null || !overPitMouth(to)) { w.inPit = 'cross'; return; }
    const d = to - WORKER / 2 - w.x;
    if (Math.abs(d) > P * 2) {
      w.x += Math.sign(d) * Math.min(commutePace(), Math.abs(d));
      w.dir = Math.sign(d);
    } else {
      sweepMuckAt(w.x + WORKER / 2, MUCK_SWEEP * (dt / 1000));
      w.lunge = 1;
    }
    w.y = pitTop(w.x + WORKER / 2) - WORKER;
    return;
  }

  // Across the pile to the foot of whichever ladder it is leaving by. Climbing
  // the wall from wherever it happened to finish shovelling is not climbing a
  // ladder.
  if (w.inPit === 'cross') {
    const lad = pitLadder(want);
    const d = lad.x - WORKER / 2 - w.x;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(commutePace(), Math.abs(d));
      w.dir = Math.sign(d);
      w.y = pitTop(w.x + WORKER / 2) - WORKER;
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
  w.y = Math.max(w.y - CLIMB_PACE, lad.top);
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
// Nowhere it cannot be cleaned up. The rock, the cut and the beds are held out
// of the shovelling -- see `onSite` in smog.js -- so a body standing on one of
// them holds on and goes when it is next somewhere the crew can reach. That is
// also why nothing is dropped by a body that is inside the lab or down a hole:
// it is not standing on the yard at all.
//
// Every body keeps its own clock, set the first time it is looked at, so they do
// not all go at once on the same tick.
function relieve(w, now) {
  if (!w.looAt) {                          // its own hour, from the moment it exists
    w.looAt = now + LOO_EVERY * (1 + (Math.random() - 0.5) * 2 * LOO_SPREAD);
    return false;
  }

  if (w.looUntil) {                        // mid-way through: it is not doing anything else
    if (now < w.looUntil) { w.lunge = 0; return true; }
    dropMuckAt(w.x + WORKER / 2, LOO_MUCK);
    w.looUntil = 0;
    w.say = null;
    w.looAt = now + LOO_EVERY * (1 + (Math.random() - 0.5) * 2 * LOO_SPREAD);
    return true;                           // one last frame of standing, then back to it
  }

  if (now < w.looAt) return false;
  if (w.inside || w.inPit || w.carry || w.hasCore) return false;   // finish what you are holding
  // Only while it is working. A body winding down -- nothing to carry, on its
  // way home, or standing about between strolls -- is a body whose day is over,
  // and one that stopped on the way in would leave something for the ones
  // already indoors to come back out and shovel, which is a yard that can never
  // settle. It is also what was asked for: they go while they are working.
  if (w.goal === 'home' || w.goal === 'idle' || w.brk) return false;
  // Nowhere within reach that anybody could clean: hold on. A body down a hole
  // or shut in a building is the case this catches.
  if (cleanSpotNear(w.x + WORKER / 2) == null) return false;
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

function jig(w, now) {
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
    w.x += w.jigDir * JIG_STEP * 0.06;
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
    w.x -= Math.sign(d || w.jigDir || 1) * 0.5;
    return;
  }
}

function heldUp(w, zone, now) {
  w.resting = false;                   // waiting on a rock is not a break
  w.foot = walkY(w.x + WORKER / 2);
  jig(w, now);
  elbowJig(w);
  if (!zone) return;
  if (w.x + WORKER > zone.from && w.x < zone.to) {
    const mid = w.x + WORKER / 2;
    w.x = mid < (zone.from + zone.to) / 2 ? zone.from - WORKER - P : zone.to + P;
    w.jigAt = w.x;                     // and it dances from where it was put
    w.y = walkY(w.x + WORKER / 2);
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
export const commutePace = () => Math.max(COMMUTE_PACE, haulSpeed() * HAUL_EMPTY);

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
  // Every job, and this list is the one that decides whether a job exists at all.
  // A job missing from here has a count on the boards and no bodies in the yard:
  // `room[w.type]` comes back undefined, every body of that type is stood down on
  // the frame it is made, and the station runs on the number alone with nobody
  // ever walking to it.
  const want = { miner: S.miners, hauler: S.haulers, quarrier: S.quarriers,
                 farmhand: S.farmhands, labber: S.labbers,
                 scrubber: S.scrubbers };
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
  if (w.vx) {
    w.x += w.vx;
    w.vx *= HURL_DRAG;
    // The yard has ends. A body thrown at one bumps off it rather than sailing
    // out of the world and walking back in from nowhere.
    const lo = yardLeft(), hi = pit.x + pit.w - WORKER;
    if (w.x < lo) { w.x = lo; w.vx = -w.vx * 0.4; }
    if (w.x > hi) { w.x = hi; w.vx = -w.vx * 0.4; }
    if (Math.abs(w.vx) < 0.05) w.vx = 0;
  }
  const foot = landing(w);
  w.vy += GRAV;
  w.y += w.vy;
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

// Nobody shovels inside anybody. The same quarter-step the idlers take, for the
// one job the whole crew drops everything to do at once.
function elbowMuck(w) {
  for (const o of S.workers) {
    if (o === w || o.type !== 'hauler' || o.inside || o.goal !== 'muck') continue;
    const d = o.x - w.x;
    if (Math.abs(d) >= ROAM_ELBOW) continue;
    // Two on the very same pixel have no side to push to. The tiebreak is where
    // each stands in the crew list, so they alternate and actually come apart --
    // a coin toss they both call the same way leaves them stacked for ever.
    const tie = S.workers.indexOf(w) % 2 ? 1 : -1;
    w.x -= Math.sign(d || tie) * 0.35;
    w.y = walkY(w.x + WORKER / 2);
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
  // And who is going for which patch of muck. Rebuilt each pass rather than kept
  // on the bodies: a shovelling body is not carrying a claim around the way a
  // fetching one is -- it walks to a mess, clears it, and looks again -- so the
  // only thing that has to be true is that two of them starting out on the same
  // frame do not start out for the same cell.
  const muckTaken = new Set();
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
        if (duck(w, zone)) { w.y = w.foot = standOn(S.groundY); continue; }
        w.foot = standOn(S.groundY);
        jig(w, now);
        continue;
      }

      // Back to it. The dance leaves its ground and its move behind, so the next
      // rock is celebrated somewhere else -- and the say goes with it, or a body
      // walks back up the hill still shouting about the last one.
      if (w.jigAt != null) { stopJig(w); w.say = null; }

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
        w.x += w.dir * MINER_WALK * 2.5;              // brisk, it has ground to make up
      } else {
        const step = w.x + w.dir * MINER_WALK;
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

    if (w.type === 'quarrier') { stepQuarrier(w, now); continue; }
    if (w.type === 'farmhand') { stepFarmhand(w, now, dt); continue; }
    if (w.type === 'labber') { stepLabber(w); continue; }
    if (w.type === 'scrubber') { stepScrubber(w); continue; }

    // Down the hole, and nothing else applies.
    //
    // This is checked before everything, including the dodge -- a body on a
    // ladder inside the pit is not standing where a rock can land on it, and it
    // cannot go anywhere but up or down anyway. It was in the middle of the
    // hauler's decisions to begin with, under the dodge, and the dodge put it
    // back on the ground line every other frame: the climb pushed it two pixels
    // down the ladder, the dodge lifted it two back, and the pair of them held it
    // at the top of the ladder for ever, taking turns.
    const inHole = w.inPit || (!w.carry && !w.hasCore && yardMuck() > 0)
      ? nearestMuck(w.x + WORKER / 2) : null;
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
    if (duck(w, zone)) { w.y = walkY(w.x + WORKER / 2); continue; }

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
    if (!w.carry && !w.hasCore && yardMuck() > 0) {
      const to = nearestMuck(w.x + WORKER / 2, muckTaken);
      if (to != null) {
        if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
        unbook(w);
        // Out of the house first. A mess is the one thing that calls a body back
        // off its own doorstep, and this branch runs before the going-home one --
        // so a body indoors used to pick up a shovel without ever coming out,
        // and worked the yard invisible and still counted as being at home.
        w.inside = false;
        w.goal = 'muck';
        const d = to - WORKER / 2 - w.x;
        // walk to it, then shovel: it is somewhere you go, not something that
        // happens wherever you are standing
        if (Math.abs(d) > P * 2) {
          w.x += Math.sign(d) * Math.min(commutePace(), Math.abs(d));
          w.dir = Math.sign(d);
          w.y = walkY(w.x + WORKER / 2);
        } else {
          sweepMuckAt(w.x + WORKER / 2, MUCK_SWEEP * (dt / 1000));
          w.lunge = 1;
          // and not shoulder to shoulder with the next one. A yard under muck
          // has something to shovel wherever you stand, so a gang that arrived
          // together would each find work on the spot they arrived on and clear
          // the whole mess as one lump you cannot count.
          elbowMuck(w);
        }
        continue;
      }
    }
    if (w.goal === 'muck') w.goal = 'idle';      // the yard is clear: back to it
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
      // held up, and dancing rather than standing there: see heldUp
      if (across(zone, w.x, target)) { heldUp(w, zone, now); continue; }
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
      // held up, and dancing rather than standing there: see heldUp
      if (across(zone, w.x, target)) { heldUp(w, zone, now); continue; }
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
        if (across(zone, w.x, w.roamTo)) { w.roamTo = null; heldUp(w, zone, now); continue; }
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
