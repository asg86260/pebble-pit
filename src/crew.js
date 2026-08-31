// The crew: who they are, where they stand and what they do with their hands.
//
// Miners take the rock off in layers; workers carry dust to the pit. A new kind
// of worker is a new `type` and a new branch in updateWorkers -- and, when the
// quarry and the farm arrive, its own file.

import { P, WORKER, CORE_SIZE, DANCE_BEAT, JIG_PACE, HAUL_EMPTY, DUCK_PACE, IDLE_BEAT, IDLE_STRIDE,
        COMMUTE_PACE, COMMUTE_SLOP, CLIMB_PACE, HOME_AFTER, HOME_WALK, ROCK_CLEAR, GRAV,
        MUCK_SWEEP, MUCK_SWING, LOO_EVERY, LOO_SPREAD, LOO_MS, LOO_MUCK,
        HURL, HURL_MAX, HURL_DRAG, SHAKE_TURNS, SHAKE_WINDOW, DIZZY_MS,
        PILE_LIMIT, MACHINE_FOUL, MACHINE_MAX_BEATS, JANITOR_PROP, IDLE_PACE, IDLE_ROAM, AT_POST, WOBBLE, WOBBLE_BEAT, SHAKE_SHED,
        SHAKE_FLING, SHAKE_SCATTER, SHAKE_LIFT } from './config.js';
import { S, floor, pit, cut, quarry, bench, outhouse } from './state.js';
import { at, put, colOf, addGrain, topRow, isDust } from './grid.js';
import { standOn, walkY, rockLeft, yardLeft, kitX, atStation, blocked } from './world.js';
import { throwVel } from './hands.js';
import { boulderAlive, knockOff, rockTopY, dropZone, rockPatch, restOnRock } from './rock.js';
import { spawnChip, bell, aim } from './dust.js';
import { tidyStep, TIDY_ELBOW } from './tidy.js';
import { pitRoom } from './pit.js';
import { minerMs, haulCap, haulSpeed, scoopMs, minerBite, hats, worn, spareKit, JOB_OF, machineRate } from './upgrades.js';
import { KIT_JOBS } from './kit.js';
import { standTop, keepTo, stepRoute, wayAt, wayOver, feetOn, rockTop,
         ways, climbTo, plant, inWorking, footing, solidNear, SOLID } from './route.js';
import { stepQuarrier, newQuarrier, quarryFace, quarryFloor, underground } from './quarry.js';
import { stepFarmhand, newFarmhand, plotX } from './farm.js';
import { stepLabber, newLabber, labDoor, indoors } from './lab.js';
import { stepScrubber, newScrubber, scrubDoor, inHouse } from './scrubhouse.js';
import { stepWizard, newWizard, underMeteor, floatDown } from './wizard.js';
import { now, frames } from './clock.js';
import { sweepMuckAt, muckLeft, muckFor, nearestMuck, muckAtCol, workSpot, MUCK_ELBOW,
         rockMuck, quarryMuck, plotMuck,
         dropMuckAt, cleanSpotNear, foul } from './smog.js';
import { doorAt } from './house.js';
import { tillerSeat } from './render.js';
import { spelled } from './tower.js';
import { SPELL_SWEEP } from './config.js';
import { MACHINES, machine, JOB_MACHINE, specOf, askLever, asked, LEVER_W, LEVER_H } from './machines.js';
import { rand } from './rng.js';

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

// Where a body's feet go when it is standing still or walking: on whatever it is
// standing on.
//
// This used to be `walkY` everywhere -- the ground line and the bridge, which do
// not know the rock is there. So anybody crossing the hill's footprint walked
// *through* the hill: measured, a hundred and twenty pixels inside it, buried to
// well over its own height, and it surfaced only on arriving at the far side or
// at work. What that looks like is a body running to the middle of the rock and
// then rising out of it, which is exactly what it was doing.
//
// Then it was one surface for everybody, the hill included, and that fixed the
// burying and broke the yard the other way about: with the hill in the floor,
// the shortest path from one side of the yard to the other goes over the crest,
// so every hauler and every janitor ramped up and over the summit on every
// errand. A hill that everybody walks over is a road.
//
// Both of those are the same mistake -- deciding a body's footing from its x
// alone -- and the answer is not to go back to asking its job. A body's footing
// comes from the *way it is on*: the floor of the yard, the floor of a working,
// or the face of the hill, and `wayAt` says which from where the body actually
// is. Two bodies at the same x, one at ground level and one up on the crest,
// are in two different places and get two different answers, and neither of
// them was asked what it does for a living.
//
// Which way a body ends up on is decided when it is sent somewhere: a route on
// to the hill puts it on the hill, and it stays there until it walks off the
// end or climbs down a flank. See route.js.
const surfaceUnder = w => feetOn(wayAt(w.x, w.y), w.x);
const stand = w => climbTo(w, surfaceUnder(w));


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

// Somebody already working the stretch this one is about to walk into.
//
// It asks `mineDir` -- the way this one is working along the row -- rather than
// which way it is facing. They are the same thing for a miner on the crest and
// they are not the same field: a heading is remembered between frames and turned
// round at the ends of the layer, and a facing is measured off the ground the
// body has just covered. See `faceTravel`.
export function elbowed(w, x) {
  for (const o of S.workers) {
    if (o === w || o.type !== 'miner') continue;
    if ((o.x - w.x) * w.mineDir <= 0) continue;         // behind it: not in the way
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
    x: rockLeft() + rand() * S.gw * P, y: S.cy,
    mineDir: rand() < 0.5 ? -1 : 1,  // which way along the layer it is working
    ph: rand() * Math.PI * 2,        // where in its wobble it starts
    sp: 0.5 + rand() * 0.9,          // how fast it sways
    wob: 0.05 + rand() * 0.10,       // how far it drifts round its seat
    rw: 0.4 + rand() * 0.9           // how much it drifts in and out
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
    carry: 0, next: 0, goal: 'seek', claim: -1, cutClaim: null, roamTo: null,
    // Its own legs and its own patience, for when it has nowhere to be. Six
    // bodies strolling at exactly one speed and standing about for exactly one
    // length of time is a marching band, not a yard at rest -- and it is the
    // same trick every other job here already uses to stop a gang reading as one
    // animation played six times.
    amble: 0.7 + rand() * 0.6,
    linger: 0.6 + rand() * 1.3
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
  return from[Math.floor(rand() * from.length)];
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
const MAKE = { miner: newMiner, quarrier: newQuarrier, farmhand: newFarmhand,
               labber: newLabber, scrubber: newScrubber, janitor: newJanitor,
               wizard: newWizard, hauler: newHauler };

// Every body gets a rhythm of its own, whatever trade it is.
//
// `ph` and `sp` are where a body is in its own sway and how fast it sways, and
// they are what stop a gang reading as one animation played five times. Some of
// the factories set them and some did not, which was fine while only the trades
// that sway used them -- and then the janitor was given something to do while it
// waits, read a phase nobody had given it, and multiplied its position by the
// sine of `undefined`. A body at NaN is a body nowhere: it vanishes, and asking
// the view to follow it takes you to an empty white corner of the world.
//
// So they are handed out here, where every body in the game is made, rather than
// eight times over in eight factories that each have to remember.
// The `?.()` is for a save written by a build that had a trade this one does not.
// `restoreCrew` guards that case -- `if (!made.type) continue;` -- but it guards
// it *after* calling this, and spreading the result of calling `undefined` throws
// before the guard is ever reached. An old save should cost you one body, not the
// whole load.
export const FACTORY = type => ({
  ph: rand() * Math.PI * 2,
  sp: 0.5 + rand() * 0.9,
  ...(MAKE[type]?.() || {})
});

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
  const fresh = FACTORY(w.type);
  delete fresh.x;                  // where it is standing is where it walked to
  delete fresh.y;
  Object.assign(w, fresh);
  w.trained = hat;
  w.kitOf = of;
  w.carry = carry;
  w.load = load;
  w.hasCore = core;
  // And it is not part way through anything any more.
  //
  // `Object.assign` writes the new job's fields over the old ones and cannot
  // touch a field the new job's factory has never heard of -- so every scrap of
  // a half-finished errand belonging to the *old* job rides along, invisibly,
  // for the rest of that body's life. Three of them were cleared here already
  // (the legs of a walk); the rest were not, and one of them was live.
  //
  // A hauler part way down the hole used to carry `inPit`, and `inPit` was the
  // flag the hauler's own branch read *before* everything else to decide it was
  // standing on the pile rather than on the yard. Put that body on the plots and
  // it walked about the yard for as long as you liked with the flag still set,
  // and nothing showed. Put it back on carrying, and the first line of the
  // hauler dropped it on to a pile eight hundred pixels away: three hundred
  // pixels straight down into solid ground, outside the hole entirely. Nobody
  // would have found that by looking -- the two halves of it are minutes apart
  // -- and verify.js reported it on the frame, with the seed, the first time the
  // invariants were run.
  //
  // That particular field is gone (the hole is walked by route now, and which
  // side of it a body is on is a thing you can see by looking at the body), but
  // the half-finished walk it belonged to is not, and neither is the reason.
  //
  // So the whole of the journey goes, not the walk alone: where it was headed,
  // which way it was on, which patch it had spoken for, and how far its feet had
  // eased up the slope it was climbing.
  w.legs = null;
  w.walkTo = null;
  w.walking = false;
  w.route = null;
  w.routeTo = null;
  w.routeWay = null;
  w.muckAt = null;
  w.cutClaim = null;
  w.tidyAt = null;
  w.foot = null;
  w.footAt = null;
}

// --- down the hole, and out the other side ---------------------------------------
// Muck that fell in the hole lies on the dust at the bottom of it, and muck that
// fell past the hole lies on ground the crew can only get to by going through.
// Both are the same errand, and neither of them is written out here any more.
//
// This was a five-state machine -- `to`, `down`, `dig`, `cross`, `up`, with a
// `w.side` and a `w.farSide` and a lip clamp with two sides to it -- sitting
// beside a routing system that does all of that generically for everybody else,
// and beside a hole whose two ladders were already rows in the links table. Two
// systems doing one job, and the copy that drifts is always the one that is not
// the general one.
//
// So the body asks for a route and walks it, exactly as a quarrier does since
// the cut stopped having its own way out. Nothing below says "ladder", "side"
// or "across": the ladders are the only edges out of the hole, and the strip of
// ground past the far wall is joined to the world only through it -- see `ways`
// and `links` in route.js -- so a body that gets to either at all gets there
// that way, and one asked to go somewhere no route reaches stays where it is.
//
// What stays is the digging, because digging is work and not getting about.
function downTheHole(w, to) {
  const all = ways();
  // Nothing to go for means coming home, and home is the near lip: the yard is
  // over there. This is what fetches a body back off the far ground once the
  // last of the muck out there has been shifted -- which used to be a rule of
  // its own called `marooned`, because the crossing only ever ran while there
  // was muck to chase and the last body out there was stranded for good.
  const at = to == null ? pit.x - WORKER : to - WORKER / 2;
  const on = to == null ? all.yard : wayOver(at, all);
  // Still on the way: a couple of cells short is arrived, the same slack
  // `takeMuck` allows up top, so a body settling on to a patch is not walked
  // back a pixel at a time every time it plants its feet on a whole cell.
  if (Math.abs(at - w.x) > P * 2 || wayAt(w.x, w.y, all).key !== on.key) {
    if (!keepTo(w, at, on)) return;
    if (stepRoute(w, commutePace())) return;
    w.route = null;
    return;
  }
  w.route = null;
  if (to == null) return;

  // Arrived. The same swing as up top -- see `takeMuck`. Feet planted, a cell to
  // a stroke, rather than a heap quietly melting under a shaking body.
  //
  // `now` is the clock *function* in here -- this one is not handed the frame
  // time the way the yard's branches are -- so it has to be called. Compared
  // against the function it is never greater, and the body stood over the heap
  // swinging at nothing at all.
  const t = now();
  w.x = Math.round(w.x / P) * P;
  w.y = climbTo(w, feetOn(on, w.x));
  w.lunge *= 0.84;
  if (t >= (w.sweepAt || 0)) {
    sweepMuckAt(w.x + WORKER / 2, 1, w);
    w.lunge = 1;
    w.sweepAt = t + swingFor(w) * (0.85 + rand() * 0.3);
  }
}

// --- down the ladder, for a load of the cut's own dust -------------------------
// Grains that fell in through the cut's mouth lie on the floor of the working
// and have to be carried out like anything else on the yard -- down the one
// ladder there is, out with a claim on a column exactly the way the yard's own
// dust is claimed, and banked at the pit like any other load. Mirrors
// `downTheHole`: a column rather than a body, and a route rather than a walk
// written out by hand.
function downTheCut(w, col) {
  const all = ways();
  const spot = col == null ? quarry.x - WORKER : cut.x + col * P + P / 2 - WORKER / 2;
  const on = col == null ? all.yard : all.cut;
  if (!on) { w.cutClaim = null; return; }
  if (Math.abs(spot - w.x) > P * 2 || wayAt(w.x, w.y, all).key !== on.key) {
    if (!keepTo(w, spot, on)) { w.cutClaim = null; return; }
    if (stepRoute(w, commutePace())) return;
    w.route = null;
    return;
  }
  w.route = null;
  if (col == null) return;

  // Arrived at the column it claimed. Feet planted, and a scoop at a time --
  // the same cadence `haulSpeed`'s own fetching keeps on the yard.
  w.x = Math.round(w.x / P) * P;
  w.y = climbTo(w, feetOn(on, w.x));
  w.lunge *= 0.84;
  if (now() < (w.next || 0)) return;
  const r = topRow(cut, col);
  if (r < 0 || !isDust(at(cut, col, r)) || roomOnBoard(w) < 1) { w.cutClaim = null; return; }
  (w.load ||= []).push(at(cut, col, r));
  put(cut, col, r, 0);
  w.carry = (w.carry || 0) + 1;
  tookOne(w);
  w.next = now() + scoopMs();
  S.dirty = true;
}

// The nearest column of the cut's own dust that nobody else has gone for, by
// the same rule `nearestDust` keeps for the yard's own piles: one column, one
// worker. Only a hauler ever calls this -- it is the one trade whose branch
// routes down the ladder for it -- so the claim it makes is already held to
// `nearestMuck`'s own rule: nobody stands on the floor of the cut who cannot
// walk down to it.
function nearestCutDust(x, taken) {
  if (!cut.grid) return -1;
  const from = Math.max(0, Math.min(cut.cols - 1, colOf(cut, x)));
  for (let d = 0; d <= cut.cols; d++) {
    for (const c of [from - d, from + d]) {
      if (c < 0 || c >= cut.cols || taken.has(c)) continue;
      const r = topRow(cut, c);
      if (r >= 0 && isDust(at(cut, c, r))) return c;
    }
  }
  return -1;
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
    w.looAt = now + LOO_EVERY * rand();
    return false;
  }
  // Nobody waits longer than the interval itself. A body is handed its hour when
  // it is first looked at, so turning the interval down on the dev panel would
  // otherwise do nothing at all until every body already standing there had
  // waited out the old one -- which for a ten-minute default is most of a
  // session of watching nothing happen and concluding the knob is broken.
  if (w.looAt > now + LOO_EVERY) w.looAt = now + LOO_EVERY * rand();

  if (w.looUntil) {                        // mid-way through: it is not doing anything else
    if (now < w.looUntil) { w.lunge = 0; return true; }
    // What it leaves, where it was standing, for a janitor to come and clear.
    dropMuckAt(w.x + WORKER / 2, LOO_MUCK, 'poop');
    w.looUntil = 0;
    w.say = null;
    w.looAt = now + LOO_EVERY * (1 + (rand() - 0.5) * 2 * LOO_SPREAD);
    return true;                           // one last frame of standing, then back to it
  }

  if (now < w.looAt) return false;
  // finish what you are holding -- and there is nowhere to go from the sky. A
  // wizard aloft is not somewhere a walk can start: it comes down when it has
  // nothing to do, and it can go then.
  if (w.inside || inWorking(w) || w.aloft || w.carry || w.hasCore) return false;
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
// It read as vibrating again, and for a different reason each time, so here is
// the whole of what a body has to dance with -- because the answer is short, and
// every move below is built out of it and nothing else:
//
//   **Where it is.** `w.x`, in whole cells.
//   **How high it is.** `w.y` off `w.foot`, in whole cells.
//
// That is the list. A body is a filled square, symmetrical, drawn from `x` and
// `y` alone -- `drawBody` takes no facing, and there is nothing on a body that
// is not the same on both sides of it. So facing draws *nothing* here: the old
// spin turned the body over twice a second and the screen did not change
// a pixel, and the old step travelled six hundredths of a cell a frame,
// undivided by frame time, so it barely went anywhere and went less of it the
// faster the display ran. Two of the three moves were invisible. What was left
// was a square changing height on the spot at two and a half beats a second --
// which is the definition of vibrating, and is exactly what it looked like.
//
// So each move is written in travel and height, both of which can be seen, and
// each is given its own rate so the gang are not all pulsing on one tick. And it
// is a table rather than a chain of ifs: a move is a row, the next one is
// another row, and no row can quietly forget to move.
//
//   beat   how fast this move pulses, as a multiple of DANCE_BEAT. A hop is
//          quicker than a step, because a step is a longer thing to do.
//   at     one frame of it: where the body goes and how high, given the swing
//          (0..1, the pulse), the length of the frame, and the ground under a
//          falling rock that it may not wander onto.
const MOVES = {
  // Straight up and down, and high: three cells at the top of it. The one move
  // that is all height and no ground.
  hop: {
    beat: 1.35,
    at: (w, swing) => { w.y = w.foot - Math.round(swing * 3) * P; }
  },

  // Across its patch and back, in whole cells and at a pace you can see, with a
  // bob under it. The travel is the whole point: a body crossing the ground is
  // doing something a body on its mark is not, and it is what spreads a gang out
  // over the yard instead of leaving them stacked where the rock finished.
  step: {
    beat: 0.55,
    at: (w, swing, dt, zone) => {
      const off = w.x - w.jigAt;
      if (Math.abs(off) > JIG_SPREAD) w.jigDir = -Math.sign(off);
      // And the ground under a coming rock is not part of anybody's patch. It is
      // a wall to the dance exactly as the edge of the patch is: the body turns
      // and paces the other way, rather than being walked into a place the dodge
      // then has to drag it out of.
      const next = w.x + w.jigDir * JIG_PACE * dt;
      if (zone && next + WORKER > zone.from && next < zone.to) w.jigDir = -w.jigDir;
      else w.x = next;
      w.y = w.foot - Math.round(swing) * P;
    }
  },

  // A tight turn on the spot. Facing cannot be drawn, so turning is drawn the
  // only way it can be: a cell out and a cell back while it bobs, which traces a
  // little loop. Round the mark it started this move on rather than round the
  // patch's, so switching into it does not jerk the body back across ground it
  // has just stepped over.
  spin: {
    beat: 1.6,
    at: (w, swing, dt, zone, beat) => {
      const to = w.moveFrom + Math.round(Math.sin(beat * Math.PI * 2)) * P;
      if (!zone || !(to + WORKER > zone.from && to < zone.to)) w.x = to;
      w.y = w.foot - Math.round(swing * 2) * P;
    }
  }
};
const MOVE_KEYS = Object.keys(MOVES);
const JIG_SPREAD = P * 14;         // how far off its mark a body will wander

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
    w.jigAt = w.x + (rand() - 0.5) * JIG_SPREAD * 2;
    w.move = MOVE_KEYS[Math.floor(rand() * MOVE_KEYS.length)];
    w.moveFrom = w.x;
    w.moveTil = 0;
    w.jigDir = rand() < 0.5 ? -1 : 1;
    // Where in the beat this body is. The gang on the rock are dealt a slot
    // each and used to take it from that, which is fine until somebody who has
    // never been on the rock joins in: a hauler has no slot, and an undefined
    // one turned the whole hop into NaN and parked the body off the top of the
    // world. Anybody can dance now, so the offset belongs to the dance.
    w.jigPh = rand() * 2;
  }
  // a new move every couple of beats, and never the one it is already doing
  if (now >= w.moveTil) {
    const other = MOVE_KEYS.filter(m => m !== w.move);
    w.move = other[Math.floor(rand() * other.length)];
    // Where it starts this one from. A move that works around a fixed point --
    // the spin -- wants that point to be where the body actually is, or the
    // first frame of it drags the body back to wherever the patch was centred.
    w.moveFrom = w.x;
    w.moveTil = now + (1400 + rand() * 1200);
    w.jigDir = -w.jigDir;
    // and something over its head, now and then rather than every time: five
    // bodies all shouting at once is noise
    if (rand() < 0.5)
      w.say = { mark: rand() < 0.5 ? 'note' : 'burst', until: now + 900 };
  }
  if (w.say && now >= w.say.until) w.say = null;

  // Each move to its own rate, so a gang doing three different things are not
  // all pulsing on the same tick -- which is what turns five dancers into one
  // flickering row. The phase is the body's own on top of that, so even two on
  // the same move are off each other's beat.
  const move = MOVES[w.move] || MOVES.hop;
  const beat = now / 1000 * DANCE_BEAT * move.beat
             + (w.slot != null ? w.slot * 0.5 : w.jigPh);
  const swing = Math.abs(Math.sin(beat * Math.PI));
  move.at(w, swing, frames(), zone, beat);
}

// wiped when the dance ends, so the next one picks fresh ground
function stopJig(w) {
  w.jigAt = null;
  w.move = null;
  w.moveFrom = null;
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
  w.footAt = w.x;
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
  w.route = null;                  // somewhere new to get to, so a new way there
}

function arrive(w) {
  // put down where it was found, or picked up the same way -- and `kitOf`
  // travels with it, because what a body is wearing is a fact about the kit and
  // not about the job it happens to be on this second
  if (w.leg === 'drop') { w.trained = false; w.kitOf = null; }
  // ...and only if there is still one lying there to pick up. A walk to a stand
  // is a walk, and the yard can change while it is being made: the station's
  // count can go to nought behind a body already half way there -- a machine
  // spending the hats, the school's number set back -- and this line used to put
  // one on its head anyway. A helmet out of nothing, worn for the two seconds it
  // took `stepKit` to notice and send the body back with it. Nobody would ever
  // have seen it; verify.js saw it on the frame, twice, in two unrelated groups.
  // `spareKit` is what is on the stand right now, which is the same question the
  // errand asked before it set off.
  if (w.leg === 'wear') {
    if (spareKit(w.wanting) > 0) { w.trained = true; w.kitOf = w.wanting; }
    w.wanting = null;
  }
  // Somebody has walked to a lever and is standing at it. This is the only place
  // in the game a machine starts or stops, which is the point of the walk.
  if (w.leg === 'lever') throwLever(w.throwing);
  S.dirty = true;
  if (w.legs && w.legs.length) { nextLeg(w); return; }
  if (w.leg === 'back') { w.leg = null; w.legs = null; w.walkTo = null; w.walking = false;
                          w.route = null; w.throwing = null; return; }
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
//
// Read off the kit table rather than written out again: a job is on this list if
// it has kit at all -- somewhere its hats come from -- and every row does. The
// janitor is on it now. Its cap used to appear on its head the moment it was put
// on the job, which made it the one hat in the yard that belonged to nobody; the
// closet keeps the caps on a stand outside the door, and a body sent to sweep
// walks over and picks one up like everybody else. See kit.js.

// somebody on that job who could go on an errand right now: hands empty, not
// already walking, and not indoors
// ...and not one that is off the ground. A wizard aloft is the one body here a
// walk cannot be handed to: `stepCommute` puts a body on the ground line for the
// length of the walk, which for that one is a four-hundred-pixel drop mid-frame.
// It comes down on its own when it has nothing to do -- see wizard.js -- and
// that is when it can be sent for a hat.
const canRun = o => !o.walking && !o.inside && !o.aloft && !o.carry && !o.hasCore;

// Somebody on that job standing bare-headed, who could go and get one.
const bareAt = job => S.workers.find(o => JOB_OF[o.type] === job && !o.trained && canRun(o));

// Somebody wearing that station's kit, whoever it is and whatever it is doing
// now. Asked by `kitOf` and not by job, because the whole point of the two
// questions below is bodies whose job and whose hat have come apart.
const hattedIn = job => S.workers.find(o => o.trained && o.kitOf === job && canRun(o));

// Kit already spoken for by somebody on their way to it. Without this, two
// bodies put on the rock in the same breath both set off for the last helmet
// and one of them arrives at an empty stand.
const claimed = job => S.workers.filter(o => o.wanting === job).length;
export const kitFree = job => spareKit(job) - claimed(job);

// Three ways a hat can be somewhere it should not be, checked every pass.
//
// `retask` already walks a body's kit back to its stand when it is moved off a
// job, and that is still the tidy path -- but it is a list of legs, and a list of
// legs is abandoned the moment a rock falls, a mess lands, or somebody picks the
// body up and shakes it. So the leaving rule cannot only live there. It lives
// here as well, as an invariant this reasserts: whatever happened to the walk, a
// station's kit ends up either on somebody standing at that station or on its
// stand, and it gets there on foot.
//
// One errand at a time per station, so buying four helmets is four trips rather
// than the whole gang filing down the hill at once.
function stepKit() {
  for (const job of KIT_JOBS) {
    if (S.workers.some(o => o.walking && o.fetching === job)) continue;   // one errand a station

    // Kit that has walked off the job it belongs to. A body moved from the rock
    // to carrying is still in the rock's helmet, and it takes it off the way it
    // put it on: it walks to the stand and puts it down. This is what "the kit
    // stays where the work is" means when the walk is watched rather than
    // assumed, and it is checked before anything is handed out -- a helmet on
    // the wrong head is not a helmet the rock can lend to anybody else.
    const stray = S.workers.find(o => o.trained && o.kitOf === job &&
                                      JOB_OF[o.type] !== job && canRun(o));
    if (stray) { errand(stray, job, 'drop'); continue; }

    // A hat lying spare and somebody bare-headed to come and get it.
    if (kitFree(job) > 0) {
      const w = bareAt(job);
      if (w) { errand(w, job, 'wear'); continue; }
    }
    // Or the other way about: a head wearing kit the station does not own any
    // more. That cannot happen by playing -- hats are never sold -- but a
    // machine taking a station's kit does it, and so does a save from another
    // shape of the game or a dev hook. A body walking about in a helmet nobody
    // paid for is a helmet counted twice.
    if (worn(job) > hats(job)) {
      const w = hattedIn(job);
      if (w) errand(w, job, 'drop');
    }
  }
}

// How long between one stroke of a shovel and the next. A hastened janitor works
// at twice the pace, which is the tower reaching into the yard rather than into
// its own tower -- see SPELLS.
const swingFor = w =>
  MUCK_SWING / (w.type === 'janitor' && spelled('sweep') ? SPELL_SWEEP : 1);

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

// The lever as a thing in the yard: where it stands and how big it is, in world
// pixels. The drawing and the hit test both read this, so they cannot drift.
//
// It is a thing you point at rather than a row on a board, and deliberately:
// `buy` returns immediately for any row carrying a `job` or a `dial`, and a
// lever is neither a purchase nor a stepper -- and the ram has no board of its
// own to put one on anyway. Same argument that moved the quarry's rows onto the
// quarry board: a decision about a place is made at the place.
export function leverBox(key) {
  const x = leverX(key);
  if (x == null) return null;
  const m = machine(key);
  if (!m || !m.bought) return null;
  const w = P * LEVER_W, h = P * LEVER_H;
  return { x: Math.round((x + WORKER + P) / P) * P,
           y: Math.round((walkY(x) + WORKER - h) / P) * P, w, h };
}

// Somewhere in the yard was clicked. If it was a lever, throw it -- which means
// asking, and somebody walks over.
export function leverHit(x, y) {
  for (const m of MACHINES) {
    const b = leverBox(m.key);
    if (!b) continue;
    if (x < b.x - P || x > b.x + b.w + P || y < b.y - P || y > b.y + b.h + P) continue;
    const r = machine(m.key);
    askLever(m.key, !(r.ask ? r.ask.on : r.on));
    return true;
  }
  return false;
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
  // Both directions go through the latch, and that is not symmetry for its own
  // sake. Switching a machine *on* changes what `capOf` answers, and nothing in
  // the yard recomputes that per frame -- so a lever thrown on without a
  // rebalance left the whole gang standing at a station that now holds one, for
  // good. It was only ever hidden because the checks reached the same state
  // through `__machine`, which rebalances on the way past.
  if (want) { m.was = S[job] || 0; S.restaff = { job, want: 0 }; }
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
    if (o.walking || o.inside || o.aloft || inWorking(o) || o.carry || o.hasCore) continue;
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

// Tending. One body, standing at the machine that has taken its job over.
//
// It is a walk like any other -- the machine is somewhere to be, and getting
// there is the same commute a body makes to a plot or a face. What it does when
// it arrives is nothing, visibly, which is correct: the machine is doing the
// work and the body is the reason it is allowed to.
//
// Returns true when it has handled the body, so the station's own step is
// skipped. It answers false for every body at a station with no machine running,
// which is every body in the game until one is bought.
function stepTender(w, now) {
  const job = JOB_OF[w.type];
  const key = JOB_MACHINE[job];
  if (!key) return false;
  const r = machine(key);
  if (!r || !r.bought || !r.on) return false;
  const spec = specOf(key);
  if (!spec) return false;

  // Down a hole and needing to be up top. A body caught by the lever while it is
  // still on the floor of the cut has to *climb out* -- assigning it `walkY`
  // lifted it straight up through the wall, which is the one thing this yard
  // never does. The muck branch has the same problem and solves it the same way:
  // walk the floor to the foot of the ladder, then go up it.
  if (w.y + WORKER > S.groundY + 1) {
    const foot = quarryFace();
    const d = foot - w.x;
    if (Math.abs(d) > 1) {
      w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    } else {
      w.x = foot;
      w.y = Math.max(w.y - CLIMB_PACE, walkY(w.x + WORKER / 2));
    }
    w.resting = false;
    return true;
  }
  // A tender is not on its way to a cell any more, and a claim it left behind
  // would keep every other body off that cell for as long as it stands there.
  w.cell = null;

  // The tiller's tender rides it. Everybody else in this yard stands on the
  // ground; a tractor has a seat, and somebody walking along beside one all day
  // is somebody who has forgotten what it is for. It is put in the seat rather
  // than walked to a spot beside it -- and it still had to *walk over* to get
  // aboard, which the branch below does.
  if (key === 'tiller') {
    const seat = tillerSeat();
    const d = seat.x - w.x;
    if (Math.abs(d) > WORKER * 2) {                // still catching it up
      w.y = walkY(w.x + WORKER / 2);
      w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
      w.resting = false;
      return true;
    }
    w.x = seat.x;                                  // aboard
    w.y = seat.y;
    w.resting = false;
    return true;
  }

  w.y = walkY(w.x + WORKER / 2);
  // Beside it, not on top of it, the same way a farmhand stands beside a plot
  // rather than over the crop.
  const to = (spec.tendAt ? spec.tendAt() : spec.at() - WORKER - P);
  const d = to - w.x;
  if (Math.abs(d) > 1) {
    w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    w.resting = false;
    return true;
  }
  w.x = to;
  // Not resting: it is at work, whatever it looks like. `break.js` hands a
  // cigarette to a body that had stopped anyway, and a tender has not stopped --
  // the runner also sets this, and both are right for the same reason.
  w.resting = false;
  return true;
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
    if (w.walking || w.inside || w.aloft || inWorking(w) || w.lifted || w.falling) continue;
    if (w.looUntil) continue;                  // stopped, but not for the machine
    const post = spec.tendAt ? spec.tendAt() : at;
    if (Math.abs(w.x - post) > MACHINE_REACH) continue;
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
    r.working = false;                         // until it gets through all of it
    const tender = tenderFor(spec, at);
    // Unmanned: it does not tick, and the beat is pushed forward every idle
    // frame so the clock cannot fall behind. There is nothing banked to pay out
    // the moment somebody wanders back into reach; it simply is not running.
    if (!tender) { r.beatAt = now + 200; continue; }
    tender.resting = false;                    // it is working, whatever it looks like
    if (!spec.ready()) { r.beatAt = now + 200; continue; }

    // How long one unit of the station's own work takes it. Not clamped to a
    // frame: a machine quicker than sixteen milliseconds has to do *several*
    // units in the frame, or the clamp silently becomes the rate and the dial
    // stops meaning anything at all. That is exactly what was happening -- every
    // machine at every setting of MACHINE_GAIN delivered the same thirty-three
    // units a second, and turning the dial up changed nothing.
    const ms = Math.max(1, spec.ms(machineRate(m.job)));
    if (!r.beatAt || r.beatAt > now + ms) r.beatAt = now + ms;   // a dial turned down
    if (now < r.beatAt) continue;
    // How many beats are owed, capped so that a tab left in the background does
    // not come back and take a hundred cells out of the ground in one frame.
    let owed = Math.min(MACHINE_MAX_BEATS, Math.max(1, Math.floor((now - r.beatAt) / ms) + 1));
    r.beatAt = now + ms;
    // The station's own functions are about to run, and they must not foul: the
    // dirt for this beat goes up off the stack, in soot, all in one place. A flag
    // rather than an argument threaded through four files, because what is true
    // is about the *frame* -- the yard is being worked by a machine right now --
    // and every path underneath wants the same answer.
    let did = 0;
    S.machineWorking = true;
    while (owed-- > 0 && spec.bite(tender)) did++;
    S.machineWorking = false;
    if (!did) continue;
    // It did a unit of work this beat, which is the one thing the stack is
    // allowed to read: a chimney smoking over a machine that is not getting
    // anything done would be the drawing claiming what the yard denies.
    r.working = true;
    // When it last got something done. `working` is true only on the frames a
    // beat actually lands, which for a fast machine is one frame in three -- so
    // a drawing gated on the flag itself strobes. What the drawing wants to know
    // is "has this been working lately", and that is a moment, not a frame.
    r.workedAt = now;

    // The extra dirt, from the machine's stack, in one place.
    //
    // The station's own work already fouled once where it happened, because it
    // went through the station's own function. What a machine adds is the rest
    // of MACHINE_FOUL -- so this is one call rather than three trebled constants
    // at four call sites, and it is why the stack is worth drawing.
    // Per unit of work done, not per frame -- a machine that got through four
    // cells this frame made four cells' worth of dirt.
    // Grey, and 'mach' rather than the station's own kind. What comes off a stack
    // is soot: stone dust off a face is blue because it is stone, and a sky going
    // blue because you bought an engine says the wrong thing twice over.
    // All of it, and all of it soot.
    //
    // This used to be the *extra* over what the station's own work already put
    // up -- so a jaw's dirt went into the sky as one part blue (the cut's own
    // dust, raised inside its own functions) and a bit of grey on top, and the
    // sky over a working quarry stayed blue. What an engine puts up is what an
    // engine puts up wherever it stands, and it is the one thing in the sky that
    // is nobody's resource. So the station's own fouling is switched off while a
    // machine drives it and the whole amount comes off the stack in one colour.
    const dirt = MACHINE_FOUL * did;
    if (dirt > 0) foul(dirt, at + P, spec.y ? spec.y() : walkY(at), 'mach');
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
  //
  // Unless the new job IS the hat's own station. A body picked up and put down
  // is retasked onto the job it was already on, and it used to walk to the
  // stand, lay its own kit down, walk to work bare, and be sent straight back
  // for the very hat it had put there -- three trips to end up exactly as it
  // began. Kit that is already right stays on the head it is on.
  if (w.trained && w.kitOf !== job && kitX(w.kitOf) !== null)
    legs.push({ to: kitX(w.kitOf), do: 'drop' });
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
  // No legs means nothing to walk for -- it does NOT mean the kit comes off.
  // This line used to strip `trained`/`kitOf` outright, and the one job with no
  // station to walk to is the hauler: a carter retasked in place (picked up and
  // put down, recovered from a shaking) had its cart confiscated by the books
  // on the very frame it got it back, and then went and fetched a phantom from
  // the stand. Kit that belongs to a different station than the new job already
  // got its drop leg above; kit that belongs to THIS job stays on.
  if (!legs.length) {
    if (w.trained && w.kitOf !== job) { w.trained = false; w.kitOf = null; }
    settle(w);
    return;
  }
  w.legs = legs;
  nextLeg(w);
}

// One frame of that walk. Nothing else happens on the way -- it does not mine,
// carry, tend, research or cut until it is standing where the job is.
// The pace a body crosses the yard at when it has been put on something else.
// Its own legs, hands free -- it is carrying nothing -- with COMMUTE_PACE as the
// floor so an unupgraded crew is no slower at it than it ever was.
export const commutePace = () => Math.max(COMMUTE_PACE, haulSpeed() * HAUL_EMPTY);

// Up in the open rather than down a working: the one question the dodge, the
// dance and the idle all want, and it is asked of where the body is rather than
// of a flag anybody has to remember to set.
//
// The hill counts as the open, because it is: a gang standing on the crest is
// standing under the sky in the middle of the drop zone, and they are the ones
// with the most reason to get out from under a rock coming down. Only a body on
// a rung or on the floor of a hole has something over its head.
const onYard = w => !inWorking(w);

// One frame of a body walking to where it has been sent.
//
// The whole of the going is route.js's now, and what is left here is what this
// function was always actually about: a body may not walk under a falling rock,
// and when it gets there it starts work.
//
// What went is three quarters of it, and all of it was the quarry. There was a
// block that walked a body below the ground line along the floor of the cut to
// the foot of the ladder, and a second block that held it still while it climbed
// -- both written out here, both written out again in `stepQuarrier`, and
// neither of them known to any of the other dozen places that move a body. The
// ladder is a link between two ways now (see route.js), and the reason a body
// leaves the cut by it is that there is no other edge out: the shortest path
// from the floor of a hole to anywhere on the yard goes up the ladder because
// every path does.
function stepCommute(w, zone) {
  // The route is worked out once, when the walk starts, and then walked. It is
  // re-asked if the ground has changed under it -- the quarry is filled in and
  // re-dug while people are walking about on it -- which is what `sendTo`
  // returning false means: there is no longer a way from here to there.
  //
  // And what it is walking *to* is a place, so it is on a way of its own. A
  // stand on the hill's footprint is on the hill, so the route climbs a flank
  // and walks the crest to it; a place out on the yard is on the yard, so the
  // route runs along the floor in front of the hill, which is flat and shorter
  // and therefore what the search picks. That is the whole of who goes over the
  // rock and who goes past it, and neither half of it is a job title.
  if (!keepTo(w, w.walkTo, wayOver(w.walkTo))) { arrive(w); return; }

  // A rock coming down stops a walk, but only a walk that is on the open yard: a
  // body on a rung is not standing anywhere a rock can land, and holding it
  // against the ladder for the length of a fall is how it used to be pushed off
  // one.
  if (onYard(w) && duck(w, zone)) { w.y = stand(w); return; }

  if (stepRoute(w, commutePace())) return;
  w.route = null;
  arrive(w);
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
      else S.workers.push(Object.assign(FACTORY(type), newRecord()));
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
  if (w.shook >= SHAKE_TURNS) {
    w.dizzyFor = DIZZY_MS;
    // Shaken hard enough and it lets go of everything.
    //
    // What it was carrying goes on the ground where it lands rather than into
    // the pit -- it was never banked, and a load that survives being turned
    // upside down is a load nobody would believe in. The hat comes off with it,
    // and lands where the body lands: it is a thing on a head, not a property of
    // the body, and this is the one moment in the game that makes that visible.
    // Whatever is still in its hands when you let go -- most of it has already
    // been shaken out by now, see `shakeHeld`; this is the remainder.
    w.spill = w.carry || 0;
    w.carry = 0;
    // and the shades of it go with the count. `load` says what colour each
    // grain in a pair of hands is, so it is not a separate thing that happens
    // to be near the count -- it is the count, written out. Left standing here
    // it was a body holding nothing and still naming a shade for it, which is
    // the one shape of untidiness that eventually gets read.
    w.load = [];
    // The hat usually left the head mid-shake -- see `shakeHeld` -- but a
    // shaking finished in the very gesture of letting go still costs it, flung
    // from where the hand is the same way.
    if (w.trained) flingHat(w, v.vx * 4);
  }
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
// What comes out of somebody being shaken, and where it goes.
//
// It used to be laid straight into the floor grid at the body's own column: the
// grains simply appeared on the ground, fully settled, however high up you were
// holding the body and however hard you were waving it. Which is not a load
// coming out of somebody's arms, it is a heap being drawn under them -- and the
// game already had the thing this wanted. Everything else loose in this yard is
// a chip: a shade with a place and a velocity, falling under the same gravity,
// landing where it meets the ground. A miner's spoil is one, a hauler's tip is
// one, the load a stood-down body drops is one.
//
// So this is one too. Each grain leaves the hands where the hands actually are,
// carrying a share of the hand's own travel plus a scatter, and falls from
// there. Shake somebody high over the yard and their load rains down from up
// there; shake them hard and it goes further; shake them gently and it drops
// round their feet. Nothing about that had to be written -- it is what falling
// already does.
function shedLoad(w, dx) {
  const out = Math.min(w.carry, SHAKE_SHED);
  for (let i = 0; i < out; i++) {
    // Off the top of the load, which is what is nearest the top of the pile in
    // its arms -- so a grain that comes out is drawn as the thing it is, the
    // same as it is drawn on the way in.
    const shade = w.load?.length ? w.load.pop() : 1;
    spawnChip(w.x + WORKER / 2, w.y + WORKER / 2,
              dx * SHAKE_FLING + bell() * SHAKE_SCATTER,
              -SHAKE_LIFT + bell() * 0.4, shade);
  }
  w.carry -= out;
  S.dirty = true;
}

// The hat leaves the head as a thing in flight: a share of the hand's travel,
// a kick upward, and gravity from there. It is not a chip -- a chip is a grain
// and banks itself; a hat has a kind and an owner walking back for it -- so it
// keeps its own little arc on `w.hatOff` and `stepHat` flies it down to the
// surface, rock outline included, where it lies until the body comes round.
function flingHat(w, dx) {
  if (w.hatOff) return;                     // one head, one hat, one arc
  // `of` is the whole identity -- which station's kit this is -- and the mark
  // to draw is derived from it, the way it is everywhere else. `kind` used to
  // store `w.trained`, which has been a boolean since the kit table: every
  // dropped thing drew as the helmet fallback, and a knocked-off CART lying on
  // the ground as a little hat was the visible half of that.
  w.hatOff = { of: w.kitOf, rest: false,
               x: w.x, y: w.y - P,
               vx: Math.max(-HURL_MAX, Math.min(HURL_MAX, dx * SHAKE_FLING * 2 + bell())),
               vy: -SHAKE_LIFT * 1.4 + bell() * 0.4 };
  w.trained = false;
  S.dirty = true;
}

// One frame of a knocked-off hat falling. Runs whatever its owner is doing --
// a hat in the air does not wait for the body that lost it to be put down.
export function stepHat(w) {
  const h = w.hatOff;
  if (!h || h.rest) return;
  const f = frames();
  h.vy += GRAV * f;
  h.x += h.vx * f;
  h.y += h.vy * f;
  const floor = standTop(h.x, rockTop);     // the ground, or the hill's outline
  if (h.y >= floor) {
    // It rests where somebody can STAND to pick it up. A cart flung over the
    // mouth of the hole would otherwise lie on the opening's own line -- fresh
    // air with a surface reading -- and its owner would walk to the lip and
    // push against the clamp for the rest of the run. The same slide the mess
    // makes off loose ground: to the nearest solid footing, and only then down.
    if (footing(h.x) !== SOLID) {
      const at = solidNear(h.x, 200);
      if (at != null) { h.x = at; h.y = standTop(h.x, rockTop); }
    }
    h.y = Math.min(h.y, standTop(h.x, rockTop));
    h.x = Math.round(h.x);
    h.rest = true;
  }
  S.dirty = true;
}

export function shakeHeld(w, dx) {
  if (!w || Math.abs(dx) < 1) return;
  const dir = Math.sign(dx);
  const t = now();
  if (t - (w.turnedAt || 0) > SHAKE_WINDOW) w.shook = 0;   // lapsed: start again
  if (w.lastDir && dir !== w.lastDir) {
    w.shook = (w.shook || 0) + 1;
    w.turnedAt = t;
    // Stars while you are still shaking it, not only once it lands. The whole
    // gesture is something you do and watch, so the yard should answer during
    // it: the moment it has been turned about enough to count, it starts seeing
    // them, and `drop` carries the same spell on past the landing.
    if (w.shook >= SHAKE_TURNS) {
      w.say = { mark: 'dizzy', until: t + DIZZY_MS };
      // And the hat comes off NOW, not when the body lands -- flung from the
      // hand with the same motion the shed grains take, falling under the same
      // gravity, resting where it comes down. It used to appear on the ground
      // wherever the body happened to land, which is the same teleport the
      // shaken-out dust used to make; a hat is a thing in the air like any
      // other, and you should see it go.
      if (w.trained) flingHat(w, dx);
    }
    // Nothing comes loose until the shaking is half established. Grains used to
    // fly from the very first change of direction, so an ordinary jostle while
    // carrying somebody about already cost them dust; now the first few turns
    // are just a body being waved, and only a shaking that is clearly becoming
    // one starts to shed. Half of SHAKE_TURNS, derived, so tuning the knob
    // moves both thresholds together.
    if (w.carry > 0 && w.shook > SHAKE_TURNS / 2) shedLoad(w, dx);
  }
  w.lastDir = dir;
}

// Where a dropped body comes to rest: the highest thing under it, hill included.
//
// Falling is physics and not routing, so this is the one place that still asks
// about the world by x alone -- a body in the air is not on any way, and what
// stops it is whatever it hits. Throw somebody at the hill and they land on the
// hill; throw them past it and they land on the ground.
//
// Landing on the hill is then a body standing on the hill, because `wayAt` asks
// how high the feet are and gets its answer from where the fall put them. So the
// next errand routes down a flank and walks off, rather than the body being
// dropped back to the ground line the moment it is given something to do.
const landing = w => standTop(w.x, rockTop) - WORKER;

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
  w.foot = w.footAt = null;        // it climbs to wherever it is standing now
  // and if it was shaken on the way up, it stands there seeing stars first
  if (w.dizzyFor) {
    w.dizzyUntil = now() + w.dizzyFor;
    w.say = { mark: 'dizzy', until: w.dizzyUntil };
    w.dizzyFor = 0;
    w.landedAt = w.x;                       // what it wobbles about
    // Whatever it was carrying, on the ground under it.
    // Shaken loose, and it lands where the body is standing -- which, for a
    // miner, is on top of the hill. The rock is a surface now, so what a shaken
    // body drops there stays there instead of walking eighty columns out from
    // under the footprint to find ground that would take it.
    if (w.spill) {
      for (let i = 0; i < w.spill; i++) {
        const x = w.x + WORKER / 2;
        if (!restOnRock(x, 1)) addGrain(floor, x, blocked);
      }
      w.spill = 0;
    }
    // And its hat where it fell, to be picked up when the stars clear. It is
    // NOT put back on here: the body has to go and get it, the same as it has
    // to walk everywhere else.
    S.dirty = true;                         // the hat is on its own arc already
    return;                                 // it is in no state to be given a job
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
  add(5, w.x + (rand() - 0.5) * ROAM_RANGE);
  // over to somebody, and stopping beside them rather than on them
  const mate = nearIdle(w);
  add(4, mate ? mate.x + Math.sign(w.x - mate.x) * ROAM_ELBOW : null);
  // and the two things in this yard worth going and looking at
  add(2, rockLeft() - ROCK_CLEAR - WORKER * 2);
  add(2, pit.x - WORKER * 3);

  const lo = yardLeft(), hi = pit.x - WORKER;
  return Math.max(lo, Math.min(hi, spots[Math.floor(rand() * spots.length)]));
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
    if (o === w || o.inside || o.goal !== 'muck' || inWorking(o)) continue;
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
  // And the near end is where the crew stop walking, not where the ground stops.
  // Dust may lie the whole way out to the edge of the world now -- a bird sheds
  // over it, and your own cursor reaches it -- but a body held at `yardLeft`
  // cannot stand on a column past it. Booked one anyway, it would set off, stop
  // at the end of its own span, and stand there for the rest of the run with a
  // claim on ground it can never reach. What lies out there is yours to sweep
  // up, not theirs to fetch, which is the same bargain the ground past the lip
  // has always had.
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  const from = Math.max(first, Math.min(last, colOf(floor, x)));
  for (let d = 0; d <= last; d++) {
    for (const c of [from - d, from + d]) {
      // Anything in a column is worth fetching, barred or not: a barred column
      // normally holds nothing, and when it does hold something -- a shard set
      // down at the plots -- somebody should still go out and get it.
      if (c < first || c > last || taken.has(c)) continue;
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
  // bound `nearestDust` has always kept. And nothing off the near end either,
  // for the same reason at the other end of the same walk.
  const last = Math.max(0, colOf(floor, pit.x) - 1);
  const first = Math.max(0, Math.min(last, colOf(floor, yardLeft())));
  for (const m of S.floorMarks) {
    const c = colOf(floor, m.x);
    if (c < first || c > last || taken.has(c) || !at(floor, c, 0)) continue;
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
// Whether a heap is backing up, and *which* heap, because the two want opposite
// answers out of a body deciding what to fetch next.
//
// This used to be "is any pile backing up", and the answer to that was "fetch
// dust". Which is right when the dust is what is backing up and exactly wrong
// when it is not: a full quarry heap is a reason to go and get *shards* sooner,
// not a reason to walk past them carrying grit. And it stopped being an edge
// case the day the machines landed -- a ram fills the rock's pile in under a
// second and never empties it, so `pilingUp` was true for the rest of the run,
// dust won every single time, and the crew stopped fetching the other two
// resources at all.
const backedUp = key =>
  (S.pileCount[key] || 0) >= (PILE_LIMIT[key] || Infinity) * BACKED_UP;
// Kept for the pile mark and the stand-down rules, which are about a station
// having nowhere to put what it makes -- a different question from what a body
// coming out to fetch should pick up.
export const anyBackedUp = () => S.piles.some(p => backedUp(p.key));

// --- one body's frame ----------------------------------------------------------
// Everything that happens to a body between one frame and the next, in the order
// it happens.
//
// This was one `for` loop of six hundred lines with a dozen `continue`s in it,
// and the *order* of those was load-bearing and written down nowhere. Two of
// them have already cost a bug apiece, and both bugs read the same way -- the
// game quietly not doing a thing you had paid for:
//
//   **The tender used to sit below the stations.** That is harmless for the
//   quarrier and the farmhand, whose branches fall through to it, and it was
//   fatal for the miner, whose branch `continue`s on every path. The ram was
//   bought, it clamped the gang to one man, and then no miner ever walked to it
//   and it never took a single bite.
//
//   **The pit used to sit below the dodge.** The dodge puts a body back on the
//   ground line; the climb pushes it two pixels down a rung. The pair of them
//   took turns and held a hauler at the top of the ladder for ever.
//
// Neither is a bug in a branch. Both are bugs in where a branch was pasted, and
// nothing in the file could have told you so. So the order is a list now.
//
// A **stage** is one thing that can happen to any body, whatever it does for a
// living. It is handed the body and the frame, and it returns true when it has
// used the frame up -- nothing below it runs. A **job** is a row: what it does
// when nothing above has claimed it, plus the handful of answers a stage needs
// from it. Adding a job is a row. Adding a shared concern is a stage, and you
// have to say out loud where in the list it goes.
//
// The list, and why each one sits where it does:
//
//   1. **lifted** -- in the air on the cursor. Not doing anything, and nothing
//      being done to it. First because a body you are holding is not in the yard.
//   2. **falling** -- let go of, and on its way down. Before everything, for the
//      same reason: gravity is not negotiating with the day's work.
//   3. **dizzy** -- shaken about, seeing stars. It rocks where it landed and does
//      nothing at all until they clear; it used to be handed its job back the
//      instant its feet touched, so the stars were decoration over somebody
//      already working.
//   4. **hat** -- its hat came off in the shaking, and it is not going back to
//      work bare-headed. Directly under `dizzy` because it is the tail of it.
//   5. **floating** -- drifting down out of the sky. Falls *through* on the frame
//      its feet land, so a wizard set down carries on with its day.
//   6. **commute** -- on its way to a job it has been put on, and doing none of it
//      yet. Above everything below because a body walking somewhere is not yet
//      anywhere: the work, the mess and the loo are all things you do where you
//      have arrived.
//   7. **relieve** -- now and then a body has to stop, whatever it was doing.
//      Below the commute (you do not stop halfway across the yard) and above the
//      work (it is the one thing that interrupts work).
//   8. **tender** -- somebody minding a machine. **Above the stations, and this
//      is the first ordering bug quoted above.** A miner's branch ends in
//      `continue` on every path, so a tender check below it was never reached.
//   9. **shutIn** -- a body behind a closed door stays behind it. Everything
//      below this line is a reason to walk somewhere -- a mess, a hat, a rock
//      coming down -- and none of them should reach through a shut door. It is a
//      guard rather than a fix to whichever branch was reaching in, because the
//      thing that is true is about the lab and not about any one of them.
//  10. **held** -- the rock is off and the gang have the ground to themselves.
//      Above the mess so that a miner dances rather than fetching a shovel in
//      the five seconds the yard is celebrating, and below the commute so that a
//      body already on its way somewhere keeps going.
//  11. **mess** -- muck on the ground, and somebody whose job it is. Last of the
//      stages: clearing up beats the work, because the work is not going
//      anywhere and the mess is in everybody's way. Which mess is whose is the
//      job's own row -- see `mess` in JOBS.
//
// ...and then `work`, which is the job itself.
//
// The one exception is the hauler's mess, and it is marked `late` on the row
// rather than hidden inside the stage: a hauler's mess can be lying in the
// bottom of the hole, and the way down there is a route rather than a walk, so
// the trip has to be decided together with the rest of its errands. See
// `haulerWork`.

// The yard is celebrating: a rock has just come off, or the next one is on its
// way down.
const dancing = c => c.now < S.danceUntil || S.rockFall > 0;

// Up on the surface, rather than down on the floor of a working. A quarrier at
// the bottom of the cut walks to the ladder and climbs it first -- see
// `stepQuarrier` -- and arrives up here on the ground like anybody else.
const upTop = w => w.y + WORKER <= S.groundY + 1;

// Whether a column is one of the finds lying about, so a body that has gone for
// one can be told apart from a body shifting grit.
const isMark = c => S.floorMarks.some(m => colOf(floor, m.x) === c);

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

// --- going and shovelling -------------------------------------------------------
// One thing a body can be told to do, because several different kinds of body
// have to be able to do it.
//
// This used to live inline in the shared part of the loop, below the miners' own
// branch -- and that branch ends in `continue`, so a miner never reached it. That
// was invisible while the rock was worth swinging at. It stops being invisible
// the moment the rock's pile fills up, which is what happens when the hole is
// full and the haulers cannot clear it: the miners stand down, "free to take
// five", and take five under a yard of muck with nothing else in the world to
// do. Idle bodies and a mess is the one combination this whole idea was written
// to rule out.
//
// Returns true if the body is on muck duty and has had its turn this frame.
function takeMess(w, c) {
  const { now, taken, muckTaken } = c;
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
  // A finished column is let go and the next one picked a FRAME later, not in
  // the same breath. The set is rebuilt at the top of the frame from every held
  // claim with its elbows out -- including this body's own, which it has only
  // just finished with -- so a same-frame re-pick was barred from the four
  // columns either side of where it stood, and a lone cleaner hopped away from
  // its own remnants. One frame of empty hands and the rebuild is clean.
  if (w.muckAt != null && muckAtCol(w.muckAt) <= 0) { w.muckAt = null; return false; }
  if (w.muckAt == null) {
    const pick = nearestMuck(w.x + WORKER / 2, muckTaken, w);
    w.muckAt = pick == null ? null : Math.floor(pick / P);
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
  // Getting there, which is a route and not a walk.
  //
  // The mess is a place, and a place is on a way (see `wayOver` in route.js):
  // muck on the face is on the hill, muck out on the yard is on the yard. What
  // this did with that was plant the feet on the *mess's* way for the whole
  // trip and step the body's x towards it by hand -- and that is right only
  // while the body is already on that way.
  //
  // A janitor up on the crest, having just cleared a patch off the face, with
  // its next patch out on the yard, is not. It started easing its feet down to
  // the ground line while it was still standing over the middle of the hill,
  // and walked the length of the footprint sixty pixels inside solid rock.
  // Rule 2 in verify.js caught it -- buried, and still buried a second later,
  // so not a climb lagging behind but a body standing in the hill.
  //
  // Two ways make a route. That is the whole of what the ladders taught this
  // file: getting from a place on one way to a place on another is what
  // `keepTo` and `stepRoute` are for, and every hand-written copy of it walks
  // bodies through something. It is the same going `downTheHole` makes on the
  // same errand when the mess is in the bottom of the hole. It is also what
  // keeps the hill a workplace rather than a road, without anybody being told:
  // a route from one end of the yard to the other runs along the flat in front
  // of the hill because that is the shorter way, and a route to a patch on the
  // face climbs a flank because there is no other way onto it.
  const at = to - WORKER / 2;
  const all = ways();
  const on = wayOver(at, all);
  // Still on the way. A couple of cells short is arrived -- the same slack
  // `downTheHole` allows -- but only from the right way: standing at the mess's
  // x at the height of the yard, under a heap that is up on the hill, is being
  // there in one coordinate out of two.
  if (Math.abs(at - w.x) > P * 2 || wayAt(w.x, w.y, all).key !== on.key) {
    // Nowhere a route reaches: it gives the patch up rather than standing there
    // holding a claim on it. `mess.back` puts the body back on its own goal and
    // it looks again next frame.
    if (!keepTo(w, at, on)) return false;
    if (stepRoute(w, commutePace())) return true;
    w.route = null;
    return true;
  }
  w.route = null;
  // Arrived: it stands still and shovels. It used to keep walking the last
  // two cells in towards the exact column it had claimed while the elbow
  // pushed it back out again -- a body sliding on the spot for as long as
  // there was muck in front of it.
  //
  // And it shovels the way a miner mines: it plants its feet, swings, and a
  // cell comes off. The muck was being poured away at a *rate* with the
  // lunge pinned at full every frame, which reads as a shape vibrating over
  // a heap that melts -- a progress bar wearing a hat. Same throughput, one
  // cell to a swing, so there is something to watch and something to count.
  //
  // Its feet land on a whole cell and stay on it between swings. Pinning it
  // outright was tried and is wrong: the elbow that keeps a gang from
  // standing in each other needs to be able to move a body, and a gang that
  // cannot be spaced out bunches onto one spot and clears a yard slower than
  // it did before. Snapping is enough -- what read as sliding was a body
  // creeping a fraction of a pixel a frame with its lunge pinned at full.
  w.x = Math.round(w.x / P) * P;
  w.y = climbTo(w, feetOn(on, w.x));
  w.lunge *= 0.84;
  if (now >= (w.sweepAt || 0)) {
    sweepMuckAt(w.x + WORKER / 2, 1, w);
    w.lunge = 1;
    w.sweepAt = now + swingFor(w) * (0.85 + rand() * 0.3);
  }
  // and not shoulder to shoulder with the next one. A yard under muck
  // has something to shovel wherever you stand, so a gang that arrived
  // together would each find work on the spot they arrived on and clear
  // the whole mess as one lump you cannot count.
  elbowMuck(w);
  return true;
}

// --- the work -------------------------------------------------------------------
// One frame of a job, once every stage above has passed the body on.

function minerWork(w, c) {
  const { now } = c;

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
    // Stepped toward the sway's target, never assigned to it. An absolute
    // assignment overwrites whatever the climber gave back last frame -- its
    // whole way of refusing a step is to undo it -- so a sway written as
    // position dragged bodies over edges the climber was refusing. The janitor
    // idles this way already; now the stood-down miner does too.
    const swayTo = w.idleAt + Math.sin(idle * IDLE_STRIDE) * P;
    w.x += Math.sign(swayTo - w.x) * Math.min(IDLE_PACE * frames(), Math.abs(swayTo - w.x));
    const surf = rockTopY(colAtX(w.x + WORKER / 2));
    // No straightening-up hop. There used to be a whole cell of it -- the body
    // rose 6px the frame its sway crossed a threshold and dropped 6px when it
    // crossed back, which at these beats is an instant third-of-a-body jump
    // every few seconds. It read as a glitch, not a posture; the amble and the
    // sway carry the standing-about on their own.
    w.y = climbTo(w, standOn(surf));
    w.lunge *= 0.82;
    w.next = now + minerMs();
    return;
  }
  w.resting = false;
  w.idleAt = null;

  const t = now / 1000;

  // Walk the layer, turning at its ends and before walking into a mate. A
  // miner that finds itself off the layer -- because the rest of the gang
  // took the row down around it, or because it was hired onto a flank --
  // climbs back to it rather than standing there boring a shaft.
  //
  // `mineDir` is the way it is working *along the row*, which is a thing it
  // remembers between frames and turns round at the ends -- not the way it
  // happens to be facing, which is measured off its own feet. See
  // `faceTravel`.
  const here = colAtX(w.x + WORKER / 2);
  if (!inBand(here)) {
    const back = nearestInBand(here);
    if (back !== here) w.mineDir = Math.sign(back - here);
    w.x += w.mineDir * MINER_WALK * 2.5 * frames();       // brisk, it has ground to make up
  } else {
    const step = w.x + w.mineDir * MINER_WALK * frames();
    if (inBand(colAtX(step + WORKER / 2)) && !elbowed(w, step)) w.x = step;
    else w.mineDir = -w.mineDir;
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
    w.next = now + minerMs() * (0.85 + rand() * 0.3);    // never quite in time
  } else if (boulderAlive()) {
    // Between swings, and never instead of one: a grain that came down on the
    // hill is lying on the ground this body is working, so it goes on the rock's
    // own heap on the same throw its spoil takes. See tidy.js, and `rockSand` in
    // rock.js for what it is lying on.
    tidyStep(w, rockPatch(), c.rockTaken, now);
  }
}

// The mess, and whoever is on it. A janitor does one thing: it walks to the
// nearest muck and shovels it. With nothing left to shovel it goes back to
// its shed and waits there, which is where you will look for it.
function janitorWork(w, c) {
  const { now } = c;
  const post = stationX('janitor');
  const d = post - w.x;
  // Far enough off its post to have left it, which is a wider mark than being
  // off the post -- the loitering below is *meant* to take it a few cells away.
  // See `AT_POST` in config.js, which is that wander plus what rides on it.
  if (Math.abs(d) > AT_POST) {
    w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    w.y = stand(w);
    return;
  }
  w.resting = true;
  // Waiting for a mess is most of a janitor's day, so it is worth watching.
  //
  // It used to stand exactly on its post, rigid, until something got
  // dropped -- and a body that never moves reads as a body the game has
  // forgotten about. It gets what a stood-down miner gets, and a little
  // more of it: the same slow shift of weight about the spot it stopped
  // on, on its own phase, and now and then it wanders a few cells along
  // and props itself up somewhere else. Somebody minding a shed, rather
  // than somebody switched off beside one.
  if (w.idleAt == null || now >= (w.propAt || 0)) {
    // A new spot to lean on, a few cells either way and never off the
    // shed's own ground. `IDLE_ROAM` is how far that is, and the walk back
    // to the post is measured off the same number -- see `AT_POST`.
    w.idleAt = post + (rand() * 2 - 1) * IDLE_ROAM;
    w.propAt = now + JANITOR_PROP * (0.6 + rand() * 0.9);
  }
  const sway = now / 1000 * IDLE_BEAT + w.ph;
  const to = w.idleAt + Math.sin(sway * IDLE_STRIDE) * P;
  const step = to - w.x;
  // At an amble, and at its own pace rather than at a fraction of a
  // commute. Chased at half a walking pace the spot two or three cells
  // away was reached in a blink, so the whole idle was a long freeze and
  // then a scoot -- and it got worse every time the crew's legs did.
  // `IDLE_PACE` is the speed of loitering and belongs to loitering.
  w.x += Math.sign(step) * Math.min(IDLE_PACE * frames()
           * (spelled('sweep') ? SPELL_SWEEP : 1), Math.abs(step));
  // and its feet stay on the ground -- the straightening-up hop is gone, for
  // the same reason the miner's is: see the note there.
  w.y = stand(w);
}

// Carrying, which is the job with no station: the dust is wherever it fell, so
// somebody put on it is already at work.
//
// It is much the longest of them, because a hauler is the body the yard's own
// furniture happens to: the hole it tips into, the lip it may not walk over, the
// books it holds room in, and the loose core nobody else will pick up.
function haulerWork(w, c) {
  const { now, zone, taken, muckTaken, cutTaken } = c;

  // Down the hole, and nothing else applies.
  //
  // This is checked before everything, including the dodge -- a body on a
  // ladder inside the pit is not standing where a rock can land on it, and it
  // cannot go anywhere but up or down anyway. It was in the middle of the
  // hauler's decisions to begin with, under the dodge, and the dodge put it
  // back on the ground line every other frame: the climb pushed it two pixels
  // down the ladder, the dodge lifted it two back, and the pair of them held it
  // at the top of the ladder for ever, taking turns.
  // Which patch this one is going for -- the same claim `takeMess` makes, made
  // here so that the trip down the hole is made against it too. It used to ask
  // for the nearest muck outright, claims and all ignored, so every hauler in
  // the yard worked out the same patch in the bottom of the hole, went down
  // for it together and stood in one another on the one column until it was
  // gone. One patch, one body, in the hole as much as out of it.
  if (!w.carry && !w.hasCore) {
    // Cleared and re-picked a frame apart, for the reason takeMess gives: the
    // frame's set still carries this body's own elbows.
    if (w.muckAt != null && muckAtCol(w.muckAt) <= 0) w.muckAt = null;
    else if (w.muckAt == null && muckLeft() > 0) {
      const pick = nearestMuck(w.x + WORKER / 2, muckTaken, w);
      w.muckAt = pick == null ? null : Math.floor(pick / P);
    }
  }
  const patch = !w.carry && !w.hasCore && muckLeft() > 0 && w.muckAt != null
    ? w.muckAt * P + P / 2 : null;

  // In the hole, over the hole, or on the ground beyond it: all one errand,
  // and all one question.
  //
  // It used to be four -- `inPit`, `overPitMouth`, a `wrongSide` worked out
  // against a remembered `farSide`, and a `marooned` for the body left
  // stranded out past the far wall when the crossing stopped running. Every
  // one of those is now the same sentence: which way is the body on, and
  // which way is its work on. A body on the hole's own surface or on the
  // strip past it is somewhere only a route reaches; so is a patch of muck
  // lying on either.
  const all = ways();
  const here = wayAt(w.x, w.y, all);
  const on = patch == null ? null : wayOver(patch - WORKER / 2, all);
  const away = here.key === 'hole' || here.key === 'past';
  const through = on != null && (on.key === 'hole' || on.key === 'past');

  if (away || through) {
    if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
    unbook(w);
    w.goal = 'muck';
    downTheHole(w, through ? patch : null);
    return;
  }

  // Down the cut, on the same trip -- the same shape of question `away ||
  // through` just asked, and answered the same way: still down there, or
  // committed to going. A hauler already on the cut's own floor keeps working
  // it even after its claim runs out (there may be another grain worth taking
  // before the trip home), and one only on its way there is caught by the
  // claim alone. Unlike muck, this carries a real load booked against the pit,
  // so it is not folded into `away || through` above -- there is no unbooking
  // it on the way past.
  if (here.key === 'cut' || w.cutClaim != null) {
    if (w.claim >= 0) { taken.delete(w.claim); w.claim = -1; }
    const fetching = w.cutClaim != null && roomOnBoard(w) > 0 && (w.carry || 0) < load(w);
    w.goal = 'cut';
    downTheCut(w, fetching ? w.cutClaim : null);
    if (!fetching) {
      w.cutClaim = null;
      if (wayAt(w.x, w.y, all).key === 'yard') w.goal = w.carry ? 'dump' : 'idle';
    }
    return;
  }

  // a rock coming down beats anything it was carrying or fetching. It keeps its
  // claim and picks the job up again on the far side.
  if (duck(w, zone)) { w.y = stand(w); return; }

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
    if (across(zone, w.x, target)) { heldUp(w, zone, now); return; }
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
    return;
  }

  // The lip, and everybody stops at it. The hole is where dust goes, not where
  // a body with a load in its hands walks.
  //
  // A route has this for nothing: the floor of the yard ends at the near wall,
  // the ground past the far one is its own way, and the only edges between
  // them are the two ladders -- so no route ever offers a leg across the
  // opening (see `ways` in route.js). What the clamp is here for is the walks
  // this file still does by hand: a stroll to nowhere in particular, a step
  // towards a loose core, a nudge at somebody's elbow. None of those knows
  // what a way is.
  //
  // Which side it is held on is not remembered any more. It is the side the
  // body is standing on, which is a thing you can see by looking at it.
  if (!w.route) {
    if (here.key === 'past') { if (w.x < pit.x + pit.w) w.x = pit.x + pit.w; }
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

  // Muck lying about the yard comes first -- and this is the one job that picks
  // its shovel up here rather than in the mess stage. See `late` on the row.
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
  if (takeMess(w, c)) return;
  JOBS.hauler.mess.back(w);                        // the yard is clear

  // Fresh dust down the cut, worth a look before the yard's own: it is what
  // keeps the ladder trip working rather than only ever starting from muck.
  // One column, one hauler -- see `nearestCutDust` -- and it only ever fires
  // for a body with empty hands and nothing else already claimed, so it never
  // steals a load that is already somebody's.
  if ((w.goal === 'seek' || w.goal === 'idle') && w.claim < 0 && !w.carry && !w.hasCore &&
      w.cutClaim == null && cut.n > (cut.rock || 0) && bookRoom(w) > 0) {
    const pick = nearestCutDust(w.x + WORKER / 2, cutTaken);
    // A claim taken and acted on the same frame it is found, or a floor column
    // picked below could double up with it: two claims on one pair of hands.
    if (pick >= 0) { w.cutClaim = pick; cutTaken.add(pick); w.goal = 'cut'; return; }
  }

  if (w.goal === 'seek') {
    // It keeps the column it set off for until that column is bare. Picking
    // the nearest one afresh every frame is what made the crew swarm.
    if (w.claim >= 0 && !at(floor, w.claim, 0)) {
      taken.delete(w.claim); w.claim = -1; w.forMark = false;
    }
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
        // A find first -- but not by everybody at once while a heap is jammed.
        //
        // This was an all-or-nothing switch and both settings are wrong. "Any
        // heap backing up, fetch dust" is what it was, and the machines made
        // that permanently true: a ram fills the rock's pile in under a second
        // and never empties it, so dust won every time for the rest of the run
        // and the crew stopped fetching the other two grounds at all. Turning
        // it off outright is worse in the other direction -- measured, the rock
        // then stands on its own heap 85% of a run, because the stations keep
        // dripping finds and a good share of the crew is always off chasing
        // one.
        //
        // So it is a *cap* rather than a switch. A find is one grain worth a
        // whole shard, so one body fetching them keeps up with what the yard
        // produces; everybody else shifts grit. The other two grounds keep
        // coming in and the rock keeps working.
        const busy = S.workers.filter(o => o.type === 'hauler' && o.forMark).length;
        const spare = !backedUp('rock') || busy < 1;
        const first = spare ? mark : dust;
        const other = spare ? dust : mark;
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
          // Remembered so the cap above can count how many are off after
          // finds. It is a fact about the trip, not about the column: the
          // column stops being a find the moment it is picked up.
          w.forMark = isMark(pick);
        }
      }
    }
    if (w.claim < 0) { w.goal = w.carry ? 'dump' : 'idle'; return; }
    const col = w.claim;
    const target = floor.x + col * P;
    // held up, and dancing rather than standing there: see heldUp
    if (across(zone, w.x, target)) { heldUp(w, zone, now); return; }
    // hands free, so it moves; a load is what slows it down
    const pace = haulSpeed() * HAUL_EMPTY;
    w.x += Math.sign(target - w.x) * Math.min(pace * frames(), Math.abs(target - w.x));
    // It scoops what is under it, not what its left edge is exactly on. The
    // last two columns before the lip sit further right than a worker is
    // allowed to stand, so a worker that had to be standing on them stood at
    // the lip for ever with the dust a hand's width away.
    const under = target >= w.x - P && target <= w.x + WORKER;
    if (under && now >= w.next) {
      const r = topGrain(col);
      if (r >= 0) {
        // A grain is worth taking only if this trip booked room for it --
        // otherwise it stays on the ground, which is somewhere, rather than in
        // a pair of hands, which is not. Dust or find, it is the same rule.
        if (roomOnBoard(w) > 0) {
          (w.load ||= []).push(at(floor, col, r));
          put(floor, col, r, 0);
          w.carry++;
          tookOne(w);
          w.next = now + scoopMs();
          S.dirty = true;
        } else {
          // the booking is used up: this trip is done
          taken.delete(col);
          w.claim = -1;
          w.goal = w.carry ? 'dump' : 'idle';
          return;
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
    if (across(zone, w.x, target)) { heldUp(w, zone, now); return; }
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
      return;
    }
    unbook(w);
    if (w.inside) return;                      // in out of it, and nothing to watch
    const door = hireSpot().x;
    if (across(zone, w.x, door)) { heldUp(w, zone, now); return; }
    w.x += Math.sign(door - w.x) * Math.min(HOME_WALK * frames(), Math.abs(door - w.x));
    w.y = stand(w);
    if (Math.abs(door - w.x) < 1) { w.inside = true; w.x = door; S.dirty = true; }
  } else {
    // Nothing to fetch and nothing to carry. Rather than standing to
    // attention they amble: a spot to stroll to, a stand about when they get
    // there, then another. A yard at rest should read as at rest, not as
    // switched off.
    unbook(w);                  // idle hands hold no room
    if (!noRoom && nearestDust(w.x, taken) >= 0) { w.goal = 'seek'; w.idleSince = 0; return; }

    // A rock has just come off, or the next one is on its way down, and this
    // body has nothing to do about either. It joins in rather than ambling
    // about with its hands in its pockets: the gang on the ground are already
    // celebrating, and a yard where half of it is dancing and the other half
    // is strolling reads as half the yard not having noticed.
    //
    // This is the hauler's own `held`, and it is down here rather than up in
    // the stage because it is the *last* thing a hauler will do with a frame:
    // a body with a load in its hands or a column booked has somewhere to be,
    // and the ones fetching, tipping and walking home all dance from where the
    // rock catches them -- see `across` and `heldUp` above.
    //
    // Everything the dance needs is here -- it spreads out from where it
    // stands, and it elbows clear of anybody it is standing in.
    if (dancing(c)) { heldUp(w, zone, now); return; }

    // A yard with nothing in it to carry is a yard nobody needs to be stood
    // in. After a good while of it -- staggered, so they trickle off rather
    // than clocking out together -- a body goes home. It is not a rate and it
    // costs nothing: every one of them is back the moment there is work.
    if (!w.idleSince) w.idleSince = now + HOME_AFTER * (0.6 + rand() * 0.9);
    if (!w.brk && now >= w.idleSince) { w.goal = 'home'; w.roamTo = null; return; }
    // Stood still between strolls is the one moment a hauler is properly
    // stopped, and it is the only moment it is allowed a break: a body
    // walking somewhere is on its way there.
    w.resting = w.roamTo === null || w.roamTo === undefined;
    if (w.roamTo === null || w.roamTo === undefined) {
      elbowIdle(w);                  // and not stood inside somebody
      // Feet on the ground even while stood still. A resting body never asked
      // where the ground was, so one that stopped at the crest's edge -- or was
      // put down mid-air by anything at all -- rested exactly there, hanging.
      // The climber eases it down the outline in place.
      w.y = stand(w);
      // and it stays put while it is having one: a body that wandered off
      // mid-cigarette would be a body that was never really standing there
      if (!w.brk && now >= (w.restUntil || 0)) w.roamTo = strollTo(w);
    } else {
      const d = w.roamTo - w.x;
      if (across(zone, w.x, w.roamTo)) { w.roamTo = null; heldUp(w, zone, now); return; }
      // its own legs, not everybody's
      const stride = w.x;
      w.x += Math.sign(d) * Math.min(haulSpeed() * ROAM_PACE * (w.amble || 1) * frames(), Math.abs(d));
      // and its feet on the ground it is strolling over. The roam never asked --
      // it moved x and left y where the last job put it, so a body dropped on
      // the crest of the rock strolled off the edge at crest height, drawing a
      // straight line through open air.
      w.y = stand(w);
      // A stroll does not stride off a cliff. If the step just taken left the
      // feet hanging more than a couple of cells over the ground below, the
      // step is given back and the feet come down first. This lives HERE, in
      // the leisure code, and not in the climber: working walks legitimately
      // drop down ramps and lips all over the yard and their length is a tested
      // promise -- a roam has nowhere to be, so it can afford to pick its way
      // down the outline.
      if (standTop(w.x, rockTop) - (w.y + WORKER) > P * 2) w.x = stride;
      if (Math.abs(d) < 1) {
        w.roamTo = null;
        // and its own patience about standing there afterwards
        w.restUntil = now + (500 + rand() * 3000) * (w.linger || 1);
      }
    }
  }
}

// --- the jobs --------------------------------------------------------------------
// One row a job, and the row is the whole of what makes that job different.
// Everything that is the same for everybody is a stage above, and everything a
// stage needs to know about a particular trade is answered from here rather than
// from an `if` on `w.type` inside the stage. It is the same shape as `LOOK` in
// render.js and `MOVES` in the dance: a new job is a row, and no row can quietly
// forget to answer.
//
//   work    one frame of the job, when nothing above has claimed the body.
//   shutIn  when this body is behind a door and nothing outside reaches it.
//   held    what it does while the rock is off and the yard is celebrating.
//           Returns true when it has used the frame up.
//   mess    the shovelling rule, in three parts:
//             when  is there a mess this body should be on right now
//             back  where it goes when there is not
//             late  it picks its own shovel up, inside `work`, rather than in
//                   the mess stage. The hauler alone, and see the note there.
//
// The mess rules, said once and in one place: a miner shovels what is lying on
// the rock, and the whole yard when its pile is full and there is nothing else
// in the world it could be doing; a quarrier and a farmhand shovel their own
// site's, and only from up on the surface; a janitor shovels everything,
// everywhere, always, because that is the whole of the job; a hauler shovels the
// yard. A labber, a scrubber and a wizard have no shovel at all -- a body behind
// a door or four hundred feet up is not somewhere a mess reaches.
const JOBS = {
  miner: {
    work: minerWork,
    // The rock is off. The crew take five on the bare ground. It runs until the
    // next rock has come down, so nobody is caught mid-hop underneath it.
    held: (w, c) => {
      if (!dancing(c)) return false;
      const { now, zone } = c;
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
        plant(w, standOn(S.groundY));
        if (w.jigAt != null) w.jigAt = w.x;
        return true;
      }
      plant(w, standOn(S.groundY));
      jig(w, now, zone);
      return true;
    },
    // A mess on the rock comes before the rock. It used to come before nothing
    // but standing about: a miner picked up a shovel only when its pile was full
    // and there was no swing left to take, and the layer on the rock was not
    // something a shovel could touch at all -- it was worked off a swing at a
    // time by whoever happened to be mining. Nobody mining meant nobody
    // clearing, for the rest of the run: a full pile, a crew with nobody on the
    // rock, or the gap between one rock and the next all left the face under
    // muck for good.
    //
    // Its own site and not the whole yard -- unless its pile is full, in which
    // case there is nothing else for it to be doing. A gang that downed tools
    // for every patch anywhere would stop mining altogether for the minute and a
    // half a full rain takes to shift.
    mess: {
      when: () => rockMuck() > 0 || S.pileFull.rock,
      // and back up the hill when the face is clear. A miner carries no goal of
      // its own, so the shovel's is put down with the shovel.
      back: w => { if (w.goal === 'muck') { w.goal = null; w.muckAt = null; } }
    }
  },

  // A mess on its own site comes before the station, the same as it does for the
  // gang on the rock: what is lying on the quarry or on the plots is in the way
  // of the body working it. This used to run only when their own pile was full
  // -- their branches end in `continue`, above the shovelling -- so a working
  // quarry and a working farm meant two bodies walking over the muck all day,
  // and the layer on the quarry and the plots could only be dug and tended
  // through, a cell at a time, by whoever happened to be there.
  //
  // The rest of the yard they leave to the haulers.
  quarrier: {
    work: (w, c) => stepQuarrier(w, c.now, c),
    mess: {
      when: w => upTop(w) && (quarryMuck() > 0 || S.pileFull.quarry),
      // and back to the station when the mess is gone or the pile has been
      // cleared: `to` is the walk to it, so nobody is put back.
      back: w => { if (w.goal === 'muck') { w.goal = 'to'; w.muckAt = null; } }
    }
  },

  farmhand: {
    work: (w, c) => stepFarmhand(w, c.now, c.dt, c),
    mess: {
      when: w => upTop(w) && (plotMuck() > 0 || S.pileFull.farm),
      back: w => { if (w.goal === 'muck') { w.goal = 'to'; w.muckAt = null; } }
    }
  },

  // A body in the lab stays in the lab. Research is one job being worked on by
  // one pair of hands, and a labber that wandered out to shovel and back left
  // the bench cold for the length of two commutes while the chimney went on
  // smoking, which is the building claiming something the crew deny.
  labber: { work: stepLabber, shutIn: w => w.goal === 'in' },

  scrubber: { work: stepScrubber },

  janitor: {
    work: janitorWork,
    mess: {
      when: () => true,
      back: w => { w.goal = 'to'; w.muckAt = null; }
    }
  },

  // The one job that is not on the ground. Nothing else in the pipeline applies
  // to a body in the sky -- there is no rock to dodge up there, no lip to stop
  // at and no muck to shovel -- so it is taken out of the yard's rules entirely,
  // the same way a body down the hole is.
  wizard: { work: (w, c) => stepWizard(w, c.now) },

  hauler: {
    work: haulerWork,
    mess: {
      late: true,
      when: () => true,
      back: w => { if (w.goal === 'muck') { w.goal = 'idle'; w.muckAt = null; } }
    }
  }
};

// Carrying is the fallback as well as a row: a body of a type nobody has written
// a row for is a body with no station, and a body with no station fetches dust.
const jobOf = w => JOBS[w.type] || JOBS.hauler;

// --- the stages -------------------------------------------------------------------
// The list from the top of this section, in order, as code. Each one is handed
// the body and the frame and answers true when it has used the frame up.
const STAGES = [
  // in the air, on the cursor: not doing anything, and nothing being done to it
  w => w.lifted === true,

  // let go of, and on its way down
  w => { if (!w.falling) return false; fall(w); return true; },

  // Seeing stars. A body shaken about does nothing at all until they clear --
  // it used to be handed its job back the instant its feet touched, so the
  // stars were decoration over somebody already working. It rocks where it
  // landed instead, and then goes and picks its hat up.
  (w, c) => {
    if (w.dizzyUntil && c.now < w.dizzyUntil) {
      w.x = w.landedAt + Math.sin(c.now / 1000 * WOBBLE_BEAT + w.ph) * WOBBLE;
      w.y = stand(w);
      return true;
    }
    if (!w.dizzyUntil) return false;
    w.dizzyUntil = 0;
    w.x = Math.round(w.landedAt);
    w.landedAt = null;
    // and if its hat came off, it is not going back to work bare-headed: the
    // stage below takes it from here on this very frame
    if (w.hatOff) return false;
    retask(w, w.type);
    return true;
  },

  // gone to pick a knocked-off hat back up -- once it has actually come down.
  // A body recovered before its hat has landed stands where it is for the
  // half-second the arc takes, rather than chasing a point still in the air.
  w => {
    if (!w.hatOff) return false;
    if (!w.hatOff.rest) return true;
    const d = w.hatOff.x - w.x;
    if (Math.abs(d) > P) {
      // A route, not a bare walk. The body may have been shaken into the hole
      // and the hat may lie on the far ground -- a straight walk toward its x
      // pushes against the lip clamp or a wall forever, while a route goes up
      // the ladder like everything else in this yard goes anywhere.
      if (!keepTo(w, w.hatOff.x, wayOver(w.hatOff.x))) { w.hatOff.x = solidNear(w.x, 200) ?? w.x; return true; }
      if (stepRoute(w, commutePace())) return true;
      w.route = null;
      return true;
    }
    w.trained = true;
    w.kitOf = w.hatOff.of;
    w.hatOff = null;
    retask(w, w.type);
    return true;
  },

  // A body drifting down out of the sky, which is a body doing nothing else
  // until its feet are down -- see `floatDown`. It falls *through* on the frame
  // it lands, so the rest of its day happens as usual.
  w => w.floating === true && !floatDown(w),

  // on its way to a job it has just been put on, and doing none of it yet
  (w, c) => { if (!w.walking) return false; stepCommute(w, c.zone); return true; },

  // and now and then a body has to stop, whatever it was doing
  (w, c) => relieve(w, c.now),

  // Every station's tender, *before* the station's own work -- the miner's
  // included. See the first of the two ordering bugs at the top of this section.
  (w, c) => stepTender(w, c.now),

  // a body behind a shut door, and nothing outside reaches it
  (w, c) => {
    const job = jobOf(w);
    if (!job.shutIn?.(w)) return false;
    job.work(w, c);
    return true;
  },

  // the rock is off and the yard is celebrating
  (w, c) => jobOf(w).held?.(w, c) === true,

  // Muck on the ground and somebody whose job it is -- and, when there is none,
  // the goal the job goes back to.
  (w, c) => {
    const mess = jobOf(w).mess;
    if (!mess || mess.late) return false;
    if (mess.when(w, c) && takeMess(w, c)) return true;
    mess.back(w);
    return false;
  }
];

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
// The columns already spoken for by bodies that are on their way to them --
  // WITH their elbows. `nearestMuck` reserves a body's width either side when a
  // claim is made, but this rebuild used to carry only the claimed column
  // itself forward, so the reservation lasted exactly one frame: from the next
  // frame on, a fresh body could claim the cell beside a held claim, and the
  // two of them shovelled the same patch standing in each other. A claim held
  // is a claim with its elbows out, every frame, or it is not a claim.
  for (const w of S.workers) {
    if (w.muckAt == null) continue;
    for (let k = w.muckAt - MUCK_ELBOW; k <= w.muckAt + MUCK_ELBOW; k++) muckTaken.add(k);
  }
  // And the same book, kept for the cut's own dust: one column of it, one
  // hauler on their way down the ladder for it.
  const cutTaken = new Set();
  for (const w of S.workers) if (w.cutClaim != null) cutTaken.add(w.cutClaim);
  // And the tidying claims, which are the same rule again on three more patches
  // of ground -- the floor of the cut, the strip the plots stand on, and the
  // surface of the hill. Held on the body between frames and rebuilt here WITH
  // their elbows, for the reason written over the muck book above: a claim
  // carried forward without its elbows is a reservation that lasts one frame.
  //
  // Two of the three join a book that already exists rather than opening one
  // beside it. The cut's floor is fetched from by haulers as well, so a
  // quarrier's claim goes in `cutTaken` and neither trade can pick a column the
  // other has; the farm's strip is floor, so a hand's claim goes in `taken`
  // beside the haulers' own. Only the rock has ground nobody else works.
  const rockTaken = new Set();
  const bookFor = w => w.type === 'quarrier' ? cutTaken
                     : w.type === 'farmhand' ? taken
                     : w.type === 'miner' ? rockTaken : null;
  for (const w of S.workers) {
    if (w.tidyAt == null) continue;
    const book = bookFor(w);
    if (!book) continue;
    for (let k = w.tidyAt - TIDY_ELBOW; k <= w.tidyAt + TIDY_ELBOW; k++) book.add(k);
  }
  // ...and the ground nobody may be *fetching from*, which is not the same rule
  // and used to be missing. A hauler ducks out of the way and then walks
  // straight back in, because what pulled it there was a column of dust it had
  // claimed and the duck does not know about claims: out, in, out, in, until
  // the rock lands on it. So the columns under a coming rock are spoken for as
  // far as everybody is concerned, and the dust there is fetched afterwards.
  if (zone) {
    const from = Math.max(0, colOf(floor, zone.from));
    const to = Math.min(floor.cols - 1, colOf(floor, zone.to));
    for (let col = from; col <= to; col++) taken.add(col);
    for (const w of S.workers) {
      if (w.type === 'hauler' && w.claim >= from && w.claim <= to) w.claim = -1;
    }
  }
  if (!S.coreItem || S.heldCore || !S.coreItem.rest) S.coreTaker = null;
  stepKit();                        // and anybody with kit to go and fetch or put back

  // Where everybody was standing when the frame began, so that where they are
  // standing when it ends can say which way they are facing. See `faceTravel`.
  const was = new Map();
  for (const w of S.workers) was.set(w, w.x);

  // Knocked-off hats keep falling whatever their owners are doing -- a hat in
  // the air does not wait for the body that lost it to be put down, and the
  // owner may well still be in your hand while it comes down.
  for (const w of S.workers) stepHat(w);

  // The frame, as one thing to hand about: the clock, its length, the ground a
  // rock is coming down on, and the books of claims that keep the crew from all
  // setting off for the same cell -- the yard's floor, the mess, the cut's own
  // floor and the surface of the hill.
  const c = { now, dt, zone, taken, muckTaken, cutTaken, rockTaken };
  for (const w of S.workers) {
    let done = false;
    for (const stage of STAGES) if (stage(w, c) === true) { done = true; break; }
    if (!done) jobOf(w).work(w, c);
  }

  faceTravel(was);
}

// Which way everybody is facing, worked out once and from the one thing that can
// answer it: where a body was when the frame began, and where it is now.
//
// Facing used to be two fields -- `w.dir` and `w.face` -- assigned in eight
// places between them, always on the way *into* a walk and always from the sign
// of a distance that had not been travelled yet. Between them they were drawn in
// exactly one spot, the side a cart trails on, and one of the eight writers set
// a field that nothing at all read: the dance's `spin` turned a body over twice
// a second and the screen did not change a pixel, because `drawBody` is a
// symmetric square that takes no facing. Unrenderable state is how that
// happened, and eight writers is how it went unnoticed.
//
// So there is one field, and nobody who is about to move sets it. It is
// *measured*, here, after everything that could have moved a body has had its
// go -- a commute, a route, a shovel, a stroll, a dance, a duck, a climb, a
// nudge at somebody's elbow -- and it comes out right for every one of them
// without a single one of them mentioning it. A body that did not move keeps the
// way it was facing, which is what standing still looks like.
const FACE_STILL = 0.01;             // under this it did not go anywhere
function faceTravel(was) {
  for (const [w, x0] of was) {
    const d = w.x - x0;
    if (Math.abs(d) > FACE_STILL) w.face = Math.sign(d);
  }
}

// a white circle with a black edge. It paints rather than clears, so it never
// eats the dust or the ground line behind it
