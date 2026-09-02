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
        SHAKE_FLING, SHAKE_SCATTER, SHAKE_LIFT, LUNGE_EASE, FARM_WALK,
        BUILD_HAMMER_MS, BUILD_HAMMER_H, BUILD_HITS_MIN, BUILD_HITS_MAX,
        BUILD_SHIFT, BUILD_SHIFT_SPAN, BUILD_REST_MS, CORE_LOB_H } from './config.js';
import { S, floor, pit, cut, quarry, bench, outhouse } from './state.js';
import { at, put, colOf, addGrain, topRow, isDust } from './grid.js';
import { standOn, walkY, rockLeft, yardLeft, kitX, atStation, blocked } from './world.js';
import { SITE_JOB, setHands, setStaff, busyBuilderSites, siteX, handsAt,
         workAt, OPENS_PLACE } from './works.js';
import { throwVel } from './hands.js';
import { boulderAlive, knockOff, rockTopY, dropZone, rockPatch, restOnRock, fallMs } from './rock.js';
import { spawnChip, bell, aim } from './dust.js';
import { tidyStep, TIDY_ELBOW } from './tidy.js';
import { pitRoom } from './pit.js';
import { minerMs, haulCap, haulSpeed, scoopMs, minerBite, hats, worn, spareKit, JOB_OF, machineRate,
         roomAt, rebalance, commutePace } from './upgrades.js';
import { KIT_JOBS, TYPE_OF } from './kit.js';
import { standTop, keepTo, stepRoute, wayAt, wayOver, feetOn, rockTop,
         ways, climbTo, plant, inWorking, footing, solidNear, SOLID } from './route.js';
import { stepQuarrier, newQuarrier, quarryFace, quarryFloor, underground } from './quarry.js';
import { stepFarmhand, newFarmhand, plotX } from './farm.js';
import { stepLabber, newLabber, labDoor, indoors } from './lab.js';
import { stepScrubber, newScrubber, scrubDoor, inHouse } from './scrubhouse.js';
import { bailOut } from './balloon.js';
import { stepWizard, newWizard, underMeteor, floatDown } from './wizard.js';
import { now, frames } from './clock.js';
import { sweepMuckAt, muckLeft, muckFor, nearestMuck, muckAtCol, workSpot, MUCK_ELBOW,
         rockMuck, quarryMuck, plotMuck,
         dropMuckAt, cleanSpotNear, foul, poopCols, colAt } from './smog.js';
import { doorAt } from './house.js';
import { spelled } from './tower.js';
import { SPELL_SWEEP } from './config.js';
import { MACHINES, machine, JOB_MACHINE, specOf } from './machines.js';
import { spawnGrit } from './grit.js';
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
// Builders come before carrying, like every other job: a spare body goes to the
// thing the yard is in the middle of building before it goes back to sweeping.
const TYPES = ['miner', 'quarrier', 'farmhand', 'labber', 'scrubber', 'janitor', 'wizard', 'builder', 'hauler'];
const MAKE = { miner: newMiner, quarrier: newQuarrier, farmhand: newFarmhand,
               labber: newLabber, scrubber: newScrubber,
               janitor: newJanitor, wizard: newWizard, builder: newBuilder, hauler: newHauler };

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

// --- the builders -------------------------------------------------------------
// Spare hands putting up whatever the yard is building.
//
// Four of the five sites have a gang of their own and their own work is theirs
// -- the quarriers take out the next bench, the farmhands break the next furrow.
// The school and everything on the bench have nobody, because the thing being
// built is not standing there yet, so the yard's idle hands walk over and do it.
//
// It is not a job on the roster and never will be. You do not decide to have
// builders: you decide to build something, and the hands that had nothing else
// on go and do it -- which is exactly what "spare" already meant. What it costs
// is the dust they are not carrying while they are over there, and that is a
// real price rather than a slider. See `rebalance` in upgrades.js, which is the
// one place the count is set.
function newBuilder() {
  const { x } = hireSpot();
  return { type: 'builder', goal: 'to', site: null, x, y: walkY(x + WORKER / 2) };
}

// Which site a builder is on. Three places can want one at once -- the bench,
// the yard and the school -- and a body is at exactly one of them, so each
// builder is given a site and counted there. It keeps the one it has while
// that site is busy; when the work lands it takes the busiest-short site next,
// or is stood down by `rebalance` if there is none.
function siteFor(w) {
  const busy = busyBuilderSites();
  if (w.site && busy.includes(w.site)) return w.site;
  let pick = null, fewest = Infinity;
  for (const site of busy) {
    const n = S.workers.filter(o => o.type === 'builder' && o.site === site).length;
    if (n < fewest) { fewest = n; pick = site; }
  }
  w.site = pick;
  return pick;
}

// Where the work is. A row that opens a place knows where its place will stand
// and says so, and the bench is the bench; the two machines on the bench do
// not, because a ram is on the rock and a belt is the length of the yard, and a
// body already standing in the yard is standing at both. Those get no walk and
// are at work where they are.
// A builder stands BESIDE what it is putting up, not in the middle of it.
//
// `siteX` answers with the middle of the thing -- which is the right answer to
// the question it is asked ("where is this work") and the wrong place to put a
// body. Everything in this yard is drawn as a black mass on a white page, and
// a black body standing inside a black building is not a body standing in
// front of a building: it is nothing at all. The builder was there the whole
// time, hammering, invisible, which is most of why the animation read as
// missing however hard it swung.
//
// So it stands off the near edge of the footprint, on open ground, where its
// own silhouette and the grit coming off it have the page to read against. The
// footprint is `S.placed`'s, the same rect the barriers are drawn round (see
// `siteFoot` in render.js), so the body stands at the tape rather than at a
// number picked to look right for one building.
function buildStationX(w) {
  const site = siteFor(w);
  if (!site) return null;
  const x = siteX(site);
  if (x == null) return null;
  const foot = buildFoot(site);
  // Off the left edge, because that is the side the yard's own traffic comes
  // from; a body on the right of a building stands between it and the next one
  // along. Half outside the tape, so it reads as working ON the thing rather
  // than as somebody who happens to be stood nearby.
  if (foot) return foot.x - WORKER - P;
  return x - WORKER / 2;
}

// The ground a site's work covers, where that is known. Only the yard's own
// slot needs looking up: every other site IS a station, and a body sent to one
// of those is already standing at the thing rather than in it.
function buildFoot(site) {
  if (site !== 'yard') return null;
  const w = workAt(site);
  if (!w) return null;
  const place = OPENS_PLACE[w.key] || (w.key === 'house' ? 'house' : null);
  return (place && S.placed && S.placed[place]) || null;
}

// A builder walks to the site and stands there. There is nothing to watch after
// that on purpose -- what a building going up looks like is the bar over it, the
// same signal the lab has always used, and a mime of hammering would be the one
// piece of animation in this yard that is about nothing. Except the one thing
// this got in the way of watching for -- see B2 in wave-feedback3.md. A
// builder that has arrived and still has a busy site under it hops rather
// than stands: on to the bench's own top edge for a `site: 'bench'` work, on
// the ground beside the footprint for a `site: 'yard'` one, the same
// `MOVES`/`jig` machinery the rock's own celebration uses. It does no work
// mid-air -- the swing only ever touches `w.y`, and `workFor`/`handsAt` never
// ask where a body's feet are, only whether it has arrived -- so the rate a
// bench goes up at is exactly what it always was.
export function stepBuilder(w) {
  const to = buildStationX(w);
  if (to !== null) {
    const d = to - w.x;
    // Arrived is a patch, not a pixel.
    //
    // A builder works a burst, steps along, works the next one (see `workJig`),
    // which means a body at work is nearly always a little off the exact spot
    // it walked to. Testing arrival against that one pixel put the walk and the
    // hammer in a tug of war: the burst shifted the body a few cells, the walk
    // saw a gap and dragged it straight back, sixty times a second. That is the
    // same shape as the jitter in TODO.md item 5, and it is worth naming twice
    // -- anything that re-aims a body every frame will fight anything that
    // moves it for its own reasons unless the aim has slack in it.
    //
    // So the walk brings it to the mark, and thereafter leaves it alone for as
    // long as it stays within the span it is allowed to work across. Only a
    // body genuinely somewhere else -- a new site, a body knocked off the rock
    // -- is walked again.
    const slack = w.goal === 'at' ? BUILD_SHIFT_SPAN + BUILD_SHIFT * 2 : 1;
    if (Math.abs(d) >= slack) {
      if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
      w.goal = 'to';
      // Routed, not slid -- see #6, "Wave 3.1" in wave-feedback3.md. This used
      // to be `w.y = stand(w)` (a fresh climb-toward-wherever-it-is-standing)
      // followed by a plain step in x, and a miner lent off the rock reads as
      // ON the rock right up until a step carries it clear of the hill's
      // footprint -- at which point `wayAt` answers with the yard's own floor
      // instead, `climbTo`'s target jumps from the rock's height to the
      // ground's in one call, and `climbTo` has a wall rule facing *up* and
      // none facing *down*, so most of that drop is taken in the one frame.
      // Every other errand crosses the hill by a route instead of by asking
      // "what is under me now" a step at a time (see `stepCommute`), which is
      // what gets a hauler down a flank without a jump; a builder is no more
      // special than a hauler crossing the pit.
      if (!keepTo(w, to, wayOver(to))) return;
      // At a trip's pace, like every other errand in the yard. It walked at
      // FARM_WALK -- a farmhand's pace for stepping to the next furrow, 1.1px
      // a frame against COMMUTE_PACE's 4.6 -- which is the very bug the
      // comment over `commutePace` in upgrades.js was written about: a
      // station's shuffling speed used for a whole commute. A builder crossed
      // the yard at under a quarter of everybody else's pace and, because it
      // never asked `commutePace`, ignored every boot and pace rung the player
      // had bought.
      if (stepRoute(w, commutePace())) return;
      w.route = null;
      return;
    }
  }
  // Arrived, or nowhere in particular to walk to -- at work where it stands
  // either way.
  w.goal = 'at';
  if (w.site && handsAt(w.site) > 0) {
    // The bench is a fixed structure, not terrain -- its top edge is always
    // where a body climbs on to. Everywhere else (the yard's own machines,
    // some of them mounted on the rock) the resting height is whatever is
    // actually underfoot, eased the way `stand` eases anybody else -- which
    // is what let a lone builder, taking three times as long alone as a gang
    // of three used to, sit parked mid-build with its feet pinned to the
    // ground line under a rock that stood well above it.
    if (w.site === 'bench') { w.foot = bench.y - WORKER; w.footAt = w.x; }
    else climbTo(w, feetOn(wayOver(w.x + WORKER / 2), w.x));
    workJig(w, now());
  } else {
    if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
    w.y = stand(w);
  }
}

// --- who is actually at a site ------------------------------------------------
// The one question works.js cannot answer for itself, registered here the same
// way the machines register what only the stations know: a count is not a body,
// and a station idles until somebody is *actually standing there*.
//
// Arrived, not assigned. `S.quarriers` counts everybody the cut has been given
// and one of them may still be crossing the yard, and a bench that came out
// while its gang was halfway down the ladder would be the building claiming
// something the crew deny.
const ARRIVED = {
  quarriers: w => w.type === 'quarrier' && w.goal !== 'to',
  farmhands: w => w.type === 'farmhand' && w.goal !== 'to',
  scrubbers: w => w.type === 'scrubber' && w.goal === 'in',
  // A wizard's work is four hundred pixels up and the walk is to the ground
  // under it; either way it is at the tower, which is the only thing this asks.
  wizards: w => w.type === 'wizard',
  builders: w => w.type === 'builder' && w.goal === 'at',
  // Through the door and at the bench. A labber crossing the yard is not doing
  // research yet, which is the same rule the scrubbers keep.
  labbers: w => w.type === 'labber' && w.goal === 'in'
};

setHands(site => {
  const at = ARRIVED[SITE_JOB[site]];
  if (!at) return 0;
  // A builder is at *its* site and no other: three sites can be busy at once
  // and a body at the bench is not putting up the lab.
  const there = S.workers.filter(w => at(w) && (w.type !== 'builder' || w.site === site)).length;
  // One pair of hands on a piece of work, whoever owns the site.
  //
  // `BUILD_GANG` already said this for the yard and the bench -- one spare body
  // is retasked to a build, not three. It did not say it for the four sites
  // that have a gang of their own: a cut with five quarriers in it took its
  // next bench out five times as fast, and the tower went up at the speed of
  // however many wizards happened to be standing in it. So the same row cost a
  // wildly different amount of time depending on which board it sat on, which
  // is not a difficulty curve, it is an accident of staffing.
  //
  // Capped here rather than in each station because this is the one function
  // that answers "how many hands are on this", and a cap written four times is
  // four things to keep in step. The gang is not idle meanwhile -- the others
  // go on quarrying, farming and scrubbing; what they no longer do is stack up
  // on the one piece of work.
  return Math.min(1, there);
});

// A build starting turns spare hands into builders and a build landing turns
// them back; both have to be walked out to the yard on the frame it happens.
setStaff(() => { rebalance(); syncWorkers(); });


// Where each job is done, for a body on its way to it. Carrying has no station:
// the dust is wherever it fell, so somebody put on it is already at work.
function stationX(type) {
  const base = handStationX(type);
  if (base === null) return null;              // carrying: already at work anywhere
  // A station with a machine standing on it is worked *from the machine*, not
  // from the ground the hands used to work. Without this a body put on the rock
  // walks to the middle of the hill, climbs it, and is then walked straight back
  // down to the ram it was always going to end up on -- which is the same three
  // trips to do one thing that `retask` goes out of its way to avoid for the kit
  // stand, and is just as plainly wrong to watch.
  const key = JOB_MACHINE[JOB_OF[type]];
  const r = key && machine(key);
  if (r && r.bought) {
    const spec = specOf(key);
    if (spec) return postOf(spec, base);
  }
  return base;
}

// Where the job is done by hand, which is where a body goes when there is no
// machine standing on it.
function handStationX(type) {
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
  // A builder has no station to be walked to: it picks a site of its own and
  // walks itself there, see `stepBuilder`.
  if (type === 'builder') return null;
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
  // and it is nobody's loan any more: whatever it was lent for, it is on a job
  // of its own now, and the next borrowing starts from scratch
  delete w.lend;
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
// --- and a move is counted in beats, from its own start -----------------------
// The third rewrite is about the seams rather than the moves. Every move used to
// be read off the wall clock -- `now / 1000 * rate` -- and every move has its own
// height: a cell for the step, two for the spin, three for the hop. So the swing
// a body was on when it swapped moves was whatever the clock happened to be
// showing, and the height it was swinging through changed at the same instant.
// The body did not move to the next thing. It *appeared* in it: measured jumps of
// fifteen pixels of height and five of ground in a single frame, on a body
// eighteen pixels tall -- three or four of them per body per celebration, plus
// one entering the dance and one leaving it. That is the glitching, and no amount
// of tuning the moves themselves would have touched it, because it was never in
// a move. It was in the joins.
//
// So the clock is gone from here. A move is measured from the instant it started
// and is a whole number of beats long, which fixes both ends of every join at
// once, because at a whole beat every move is in the same pose:
//
//   swing = |sin(beat * PI)| is zero at every whole beat -- the body is on the
//   ground, and `hop`, `step` and `spin` all draw it at `w.foot` there,
//   whatever their height.
//   the spin's travel, sin(beat * 2PI), is zero at every whole beat too -- the
//   body is on `moveFrom`, which is where the next move is about to start it.
//
// A move therefore ends with the body standing on the ground on its mark, and
// the next one begins from exactly there. Nothing to jump across. It is a
// property of where the beats are cut, not a number anybody tuned, so a fourth
// move added to the table below gets it without asking.
//
//   beat   how fast this move pulses, as a multiple of DANCE_BEAT. A hop is
//          quicker than a step, because a step is a longer thing to do. Nothing
//          here may run much over a beat a second: a body crossing its own
//          height twice a second is not dancing, it is buzzing, and that is the
//          other half of what was wrong.
//   beats  how many whole beats of it a body does before it swaps -- the low
//          and the high of the roll. Beats and not milliseconds, because the
//          join has to land on one.
//   at     one frame of it: where the body goes and how high, given the swing
//          (0..1, the pulse), the length of the frame, the ground under a
//          falling rock that it may not wander onto, and the beat it is on.
const MOVES = {
  // Straight up and down, and high: three cells at the top of it. The one move
  // that is all height and no ground.
  hop: {
    beat: 1.2,
    beats: [2, 4],
    at: (w, swing) => { w.y = w.foot - swing * 3 * P; }
  },

  // Across its patch and back, in whole cells and at a pace you can see, with a
  // bob under it. The travel is the whole point: a body crossing the ground is
  // doing something a body on its mark is not, and it is what spreads a gang out
  // over the yard instead of leaving them stacked where the rock finished.
  step: {
    beat: 0.55,
    beats: [1, 2],
    at: (w, swing, dt, zone) => {
      const off = w.x - w.jigAt;
      if (Math.abs(off) > JIG_SPREAD) w.jigDir = -Math.sign(off);
      // And the ground under a coming rock is not part of anybody's patch. It is
      // a wall to the dance exactly as the edge of the patch is: the body turns
      // and paces the other way, rather than being walked into a place the dodge
      // then has to drag it out of.
      //
      // ...and the mark comes to this side of the wall with it. A body whose
      // mark lay through the zone was ordered toward it by the drift rule above
      // and flipped straight back by the wall, every frame, going nowhere -- a
      // square bobbing on the spot for the whole of the fall, which is the
      // vibration this dance was twice rewritten to kill. With the mark re-taken
      // where it stands, the body paces its own side like anybody else.
      //
      // The other wall is the ground itself. A body dances on the footing it
      // joined with (see `celebrate`), so the edge of that footing -- the lip of
      // the hole, the toe of a pile, the wall of the cut -- is a wall to the
      // dance too. Without it a body paced off its own ground and hung in the
      // air over the next thing down, or had its feet dragged a cell to meet it.
      const next = w.x + w.jigDir * JIG_PACE * dt;
      const offGround = Math.abs(feetOn(wayOver(next + WORKER / 2), next) - w.foot) > 1;
      if (offGround || (zone && next + WORKER > zone.from && next < zone.to)) {
        w.jigDir = -w.jigDir;
        // The mark comes to this side of the wall with it. A mark on the far
        // side is an order to walk into the wall, which the wall countermands
        // the next frame, and the body paces on the spot for the whole of the
        // celebration. Moving a mark is not moving a body -- `jigAt` is only
        // read by the turn rule above -- which is why this one is safe where
        // the old re-anchoring of `moveFrom` was not.
        w.jigAt = w.x;
      } else w.x = next;
      w.y = w.foot - swing * P;
    }
  },

  // A tight turn on the spot. Facing cannot be drawn, so turning is drawn the
  // only way it can be: a cell out and a cell back while it bobs, which traces a
  // little loop. Round the mark it started this move on rather than round the
  // patch's, so switching into it does not jerk the body back across ground it
  // has just stepped over.
  spin: {
    beat: 1.2,
    beats: [2, 3],
    // How far this move carries the body off its mark at a given beat. Only the
    // spin travels, and naming it here means the duck can take it back off when
    // it re-anchors -- see `jig`. Without that the anchor swallows the offset and
    // hands it back all at once when the duck lets go.
    dx: beat => Math.sin(beat * Math.PI * 2) * P,
    at: (w, swing, dt, zone, beat) => {
      const to = w.moveFrom + Math.sin(beat * Math.PI * 2) * P;
      if (!zone || !(to + WORKER > zone.from && to < zone.to)) w.x = to;
      w.y = w.foot - swing * 2 * P;
    }
  }
};
const MOVE_KEYS = Object.keys(MOVES);      // the dance's own three -- see below
const JIG_SPREAD = P * 14;         // how far off its mark a body will wander

// A fourth move, added after `MOVE_KEYS` is taken rather than into the table
// above, so the rock's own celebration never rolls it by chance -- see B2 in
// wave-feedback3.md and, for the rewrite, the hammer note in config.js.
//
// A builder swings a hammer. The body dips and drives rather than leaping: the
// engine cannot draw an arm, so the strike is a short drop plus the lunge
// (`LOOK.builder` in render.js) throwing the body into the work. It hopped two
// cells on a 1400ms beat before, which at any speed reads as a body bouncing
// on the spot rather than one hitting something.
MOVES.build = {
  beat: 1000 / (BUILD_HAMMER_MS * DANCE_BEAT),
  beats: [1, 1],
  at: (w, swing) => { w.y = w.foot - swing * BUILD_HAMMER_H * P; }
};

// How long one beat of a move takes this body, in milliseconds. A body's own
// tempo is in here: the gang used to be spread across the beat by the slot they
// held on the rock, which is a number a hauler has not got -- so anybody who had
// never been on the rock danced on the same tick as everybody who had. Every
// body rolls its own rate instead, so no two of them are ever quite together and
// nobody needs a slot to join in.
const beatMs = (w, move) => 1000 / (DANCE_BEAT * move.beat * (w.jigRate || 1));

// Start a move at a given instant -- which is the instant the last one ended,
// not the instant this frame began, so the overshoot of a frame is not thrown
// away and the beats stay flush with each other.
function startMove(w, at, key) {
  const [lo, hi] = MOVES[key].beats;
  w.move = key;
  w.moveAt = at;
  w.moveFrom = w.x;
  w.moveBeats = lo + Math.floor(rand() * (hi - lo + 1));
}

// When the yard stops watching. Two things hold a dance open and they are asked
// in order rather than taken the later of: a rock in the air is the nearer end
// of the two, because the landing is what everybody in the yard turns back to
// work for -- see the mess walk, which takes its body back the moment the rock
// is down, and takes it back mid-hop if the dance has not put its feet on the
// ground first. With nothing in the air it is the five seconds on the clock.
//
// Every body reads the same instant, so the gang wind down together rather than
// one at a time.
const danceEnd = now =>
  S.rockFall > 0 ? now + fallMs() : S.danceUntil;

// `zone` is the ground the next rock is coming down on, when there is one. The
// dance has to know about it, because the dance travels: a body stepping across
// its patch will walk into the drop zone, the dodge will push it straight back
// out, and the two of them will hold it against that line at sixty steps a
// second. That is not a body dancing near a falling rock, it is a body
// vibrating -- and it is the one thing anybody watching a celebration notices.
//
// `endsAt` is when the yard stops celebrating, and it is here for the last join
// of all: a body still in the air when the dance is switched off lands by
// teleport. It is the same rule as every other join, asked one beat early.
function jig(w, now, zone, endsAt) {
  // a mark to dance around, taken once, so the gang spread out instead of
  // dancing in the line they happened to finish the rock in
  if (w.jigAt == null) {
    // The ground this body will dance on, for as long as it dances. Everything
    // below turns on it: the height of every move is measured off `foot`, and
    // the step turns back where the footing changes.
    //
    // Where the body already is, and not a fresh lookup of the surface. Its own
    // stepper put it there and knows things this does not -- a quarrier stands
    // on the floor of the cut, which `surfaceUnder` answered with the yard's
    // own line, so the first frame of the dance lifted four bodies out of the
    // cut and stood them on the ground above it. Nothing in here knows better
    // than the job about where that job stands.
    w.foot = w.y;
    w.footAt = w.x;
    w.jigAt = w.x + (rand() - 0.5) * JIG_SPREAD * 2;
    // and never on the ground the next rock is coming down on: a mark in the
    // zone is an order to dance under the rock, which the wall in `step` then
    // countermands every frame. The body dances where it stands instead.
    if (zone && w.jigAt + WORKER > zone.from && w.jigAt < zone.to) w.jigAt = w.x;
    w.jigDir = rand() < 0.5 ? -1 : 1;
    // its own tempo, so the gang are never all on one tick -- see `beatMs`
    w.jigRate = 0.85 + rand() * 0.3;
    w.jigBeat = null;                // no beat counted yet, and not winding down
    w.jigDown = false;
    startMove(w, now, MOVE_KEYS[Math.floor(rand() * MOVE_KEYS.length)]);
  }

  // The frame this body last danced. `jigAt` says a body has a mark to dance
  // around, which it keeps hold of through a fall even on the frames something
  // else is moving it; this says it actually danced, and it is what anybody
  // measuring the dance should ask.
  w.jigOn = now;

  let move = MOVES[w.move] || MOVES.hop;
  let beat = (now - w.moveAt) / beatMs(w, move);

  // Nobody is caught in mid-air by the end of the celebration. A body only goes
  // up if it can be back down before the yard has something else to look at, and
  // it is asked at the top of every beat -- which is the only moment it is on the
  // ground and so the only moment the answer can be acted on without a jump.
  // Asked at any other moment it would be answered by dropping the body wherever
  // it happened to be, which is the fifteen-pixel teleport this whole rewrite is
  // about, moved to the end of the dance.
  //
  // What it does then is not stop. It is the same dance with the bounce taken
  // out: the feet stay down and the ground travel carries on, so a body winds
  // down rather than being switched off. See `swing` at the bottom.
  // Asked afresh each beat rather than latched, because the end moves: a rock
  // lands and the five seconds on the clock are the horizon again, which is
  // further off than the beat this body is standing out. A body that has stood
  // one beat out is on the ground, so it can join back in without a jump -- the
  // same reason it could stand out without one.
  const whole = Math.floor(beat);
  if (endsAt != null && whole !== w.jigBeat) {
    w.jigBeat = whole;
    w.jigDown = now + beatMs(w, move) > endsAt;
  }

  // A move ends on a whole beat and the next one starts from that same instant.
  // Never the one it is already doing.
  if (beat >= w.moveBeats) {
    const ended = w.moveAt + w.moveBeats * beatMs(w, move);
    // The body is on the ground on `moveFrom` at a whole beat, whatever the move
    // was doing on the way there. Put it there before the next move reads `w.x`
    // off it, so the join is exact rather than a frame's worth of near enough.
    if (w.move === 'spin') w.x = w.moveFrom;
    w.y = w.foot;
    const other = MOVE_KEYS.filter(m => m !== w.move);
    startMove(w, ended, other[Math.floor(rand() * other.length)]);
    w.jigDir = -w.jigDir;
    move = MOVES[w.move];
    beat = (now - w.moveAt) / beatMs(w, move);
    // and something over its head, now and then rather than every time: five
    // bodies all shouting at once is noise
    if (rand() < 0.5)
      w.say = { mark: rand() < 0.5 ? 'note' : 'burst', until: now + 900 };
  }
  if (w.say && now >= w.say.until) w.say = null;

  // The swing is the height, and a body winding down has none: its feet are on
  // the ground for the rest of the celebration and everything else about the
  // move goes on as it was.
  const swing = w.jigDown ? 0 : Math.abs(Math.sin(beat * Math.PI));
  move.at(w, swing, frames(), zone, beat);
}

// wiped when the dance ends, so the next one picks fresh ground
function stopJig(w) {
  w.jigAt = null;
  w.move = null;
  w.moveFrom = null;
  w.moveAt = 0;
  w.moveBeats = 0;
  w.jigRate = 0;
  w.jigBeat = null;
  w.jigDown = false;
  w.shiftTo = null;
}

// --- the builders' work jig ---------------------------------------------------
// One frame of a builder hammering at a busy site (B2, wave-feedback3.md,
// rewritten). It is the dance's own `MOVES`/`startMove` read a different way
// rather than a second animator: the same beat-and-swing arithmetic `jig`
// uses, on the one move built for it (`MOVES.build`, above), which never swaps
// to another and never winds down -- a body at a bench works until the bench
// is done, not until a clock five seconds out says the party is over.
//
// The caller sets `w.foot` first -- the bench's top edge or the ground beside
// the site, whichever this body is standing on -- the same way `heldUp` sets
// it before handing off to `jig`.
//
// The rhythm is a burst, not a metronome: a few hits in one place, a step
// along, a few more. A body striking the same pixel at a fixed rate for three
// minutes is a machine; a body that works a patch, moves, and works the next
// one is somebody building something. Each strike throws its own grit, which
// is why the dust comes off the blow rather than off a timer of its own.
// The patch a body works across, in world x. A burst walks the body a few cells
// along and the next burst a few more, and this is what says how far it may get.
//
// It is the GROUND UNDERFOOT that answers, not one number for everybody. A
// build site has the open yard beside it and the span is whatever reads as
// working a stretch of it. A bench is twelve cells of timber standing on two
// legs, and a body allowed the same span walks off the end of it and hammers on
// thin air -- which is what it did: the patch ran sixty pixels back from the
// middle of a seventy-two pixel top, so an eighteen pixel body finished a
// couple of cells clear of the near end.
//
// Widening the bench would have fixed the bench and left the next narrow thing
// anybody stands on to be found by looking at it. Asking the footing is the
// same question every time.
function jigSpan(w) {
  // On the slab, and no further: the near end is the timber's own edge and the
  // far end is the last place a body's whole width still has something under
  // it. `jigAt` does not come into it -- a mark taken up near one end would
  // otherwise pin the patch to a corner of a bench there is room to work along.
  if (w.site === 'bench') return { from: bench.x, to: bench.x + bench.w - WORKER };
  // Everywhere else: back along the yard from the mark it arrived on, one side
  // only, never past the mark. A patch centred on the mark would spend half of
  // itself inside the footprint, which is the black the stand-off exists to
  // keep the body out of.
  return { from: w.jigAt - BUILD_SHIFT_SPAN, to: w.jigAt };
}

function workJig(w, at) {
  if (w.jigAt == null) {
    w.jigAt = w.x;              // the near end of the patch it is working
    // Away from the thing being built, not into it. `buildStationX` stands the
    // body off the footprint's left edge precisely so it is not lost against
    // the black of the building; a burst that walked the other way put it back
    // inside within two shifts and undid that.
    w.jigDir = -1;
    w.jigRate = 1;
    w.jigBeat = null;
    w.jigDown = false;
    w.hits = 0;
    w.hitsWanted = nextBurst();
    w.restUntil = 0;
    startMove(w, at, 'build');
  }
  w.jigOn = at;

  // Between bursts the body WALKS to its next patch. It does not appear there.
  //
  // This shifted `w.x` by a whole `BUILD_SHIFT` -- four cells -- in the single
  // frame the burst ended, which is a body teleporting, and this yard has one
  // rule it has never broken: every body walks. It was also invisible as a bug
  // and measurable as one, which is why `tools/node/walk-pace.mjs` reads the
  // fastest frame of travel rather than an average: a 24px hop in one frame
  // stood out of that reading instantly and stood out of the picture not at all.
  if (at < (w.restUntil || 0)) {
    w.y = w.foot;
    w.lunge = 0;
    if (w.shiftTo != null) {
      const d = w.shiftTo - w.x;
      const step = Math.min(commutePace() * frames(), Math.abs(d));
      if (Math.abs(d) < 0.5) w.shiftTo = null; else w.x += Math.sign(d) * step;
    }
    return;
  }

  const move = MOVES.build;
  let beat = (at - w.moveAt) / beatMs(w, move);
  if (beat >= w.moveBeats) {
    // The blow lands. The lunge is the same one a shovel's swing plants at the
    // bottom of its stroke (see `sweepMuckAt`), so the strike reads as a body
    // driving into the work rather than settling out of a hop.
    const ended = w.moveAt + w.moveBeats * beatMs(w, move);
    w.y = w.foot;
    w.lunge = 1;
    // One puff per hit, off the point of impact -- at the body's feet, which is
    // where the head of a hammer is if the body is swinging one.
    // Off the body's waist rather than its feet. A chip leaving at ground level
    // is a chip drawn on the ground line, which is already black.
    spawnGrit(w.x + WORKER / 2, w.foot + WORKER / 2);
    if (++w.hits >= w.hitsWanted) {
      // Burst done: rest a beat, then take the next patch a step along. It
      // turns back at the edge of its span the way the dance's `step` turns at
      // the edge of its patch -- otherwise a long build walks the body clean
      // off the site it is meant to be putting up.
      w.hits = 0;
      w.hitsWanted = nextBurst();
      w.restUntil = ended + BUILD_REST_MS;
      // The patch is whatever the body is standing on -- see `jigSpan`. It
      // turns back at either end of it the way the dance's `step` turns at the
      // edge of its patch.
      const span = jigSpan(w);
      let next = w.x + w.jigDir * BUILD_SHIFT;
      if (next > span.to || next < span.from) {
        w.jigDir = -w.jigDir;
        next = w.x + w.jigDir * BUILD_SHIFT;
      }
      // Aimed, not applied: the rest window above walks it there.
      w.shiftTo = Math.max(span.from, Math.min(span.to, next));
      w.lunge = 0;
      startMove(w, ended + BUILD_REST_MS, 'build');
      return;
    }
    startMove(w, ended, 'build');
    beat = (at - w.moveAt) / beatMs(w, move);
  }
  move.at(w, Math.abs(Math.sin(beat * Math.PI)));
}

// How many blows this burst gets. Its own roll every time, so two builders on
// two sites are never in step and one builder never falls into a rhythm you
// can predict.
const nextBurst = () =>
  BUILD_HITS_MIN + Math.floor(rand() * (BUILD_HITS_MAX - BUILD_HITS_MIN + 1));

// --- the celebration ------------------------------------------------------------
// A rock is off, and every body in the yard stops what it is doing and dances.
// One function, called from one stage (see `celebrate` in STAGES), and that is
// the whole arrangement.
//
// It was five: a `held` row on the miner, an idle branch on the hauler, and
// three errand call sites that handed a body to the dance when a rock cut
// across its walk -- with every other job having no row at all, so half the
// yard went on working through the party. The judder everybody kept seeing was
// never in the moves. It was two things moving one body on the same frame: the
// duck walking it out of the drop zone while the spin pulled it back onto its
// mark; the elbow shoving it apart while the same marks dragged it home; a
// step drifting toward a mark that lay under the rock while the zone wall
// flipped it away. Each was patched where it was found -- by dragging the marks
// along with the duck, in three places, each with its own re-anchoring rule --
// and each patch left the collision itself in place.
//
// So the collision is what goes. While the yard is celebrating this is the ONLY
// thing that moves a body, because the stage sits above the commute, the work
// and the mess and nothing below it runs. No clamp, no elbow, no work stepper.
// There is nothing left to fight.
//
// Bodies may now stand in each other for a few seconds. That is a smaller thing
// to look at than either of them juddering, and the marks are spread wide
// enough that it is rare.
function celebrate(w, now, zone) {
  w.resting = false;                   // a dance is not a break
  w.idleAt = null;
  w.lunge = 0;

  // A body that was hammering arrives with a jig already running: the builders'
  // work jig is this same machinery on a move of its own (`MOVES.build`), and
  // inheriting it had a builder celebrate at a hammer's beat -- twice the pace
  // anything here is allowed to move at, which is the definition of the buzzing
  // this whole arrangement is against. Anything that is not one of the dance's
  // own moves is put away, and the join below takes fresh marks. Asked of the
  // move rather than of the job, so a second work jig added later gets it too.
  if (w.jigAt != null && !MOVE_KEYS.includes(w.move)) stopJig(w);
  // The footing, taken ONCE when this body joins in and then left alone -- see
  // the join below, where `jigAt` is taken. Read afresh every frame, as the old
  // `heldUp` read it, it is a third thing moving a dancing body: the dance
  // travels, the ground under the yard is not flat, and a body stepping over
  // the lip of the hole or the toe of a pile had its feet moved a whole cell
  // between two frames. Measured at 36px on one body in the fixture yard, which
  // is twice its own height, and at up to thirty crossings a second on another
  // -- the judder, arriving by a route nobody had looked at because until now
  // only the gang on the flat yard ever danced.
  w.footAt = w.x;

  // Out from under a coming rock BEFORE any of the dance runs, and dancing
  // nothing while it goes. This is the one ordering that matters in here: the
  // old code ducked and danced the same body on the same frame, which is the
  // judder itself. A body walks clear, and only then joins in.
  // ...and only a body out under the open sky. `duck` walks a body sideways
  // with no notion of walls, which is right on the yard and wrong everywhere
  // else: a quarrier dancing on the floor of the cut is nowhere near a rock
  // coming down on the surface, and shoving it toward the edge of the
  // footprint walked it out through the side of the cut -- the one thing
  // `route.test.mjs` exists to forbid.
  if (upTop(w) && duck(w, zone)) {
    w.jigAt = null;                    // it will take its mark where it ends up
    w.y = stand(w);
    return;
  }

  // And the mark it dances around is never under the rock either. It is taken
  // once, out here where the body is standing and therefore already clear; a
  // zone that appears later -- the next rock is announced mid-celebration --
  // can put it back under one, and then it is pushed to the near edge rather
  // than re-taken on the body, so the dance carries on from where it is instead
  // of restarting.
  if (zone && w.jigAt != null && w.jigAt + WORKER > zone.from && w.jigAt < zone.to)
    w.jigAt = w.x + WORKER / 2 < (zone.from + zone.to) / 2 ? zone.from - WORKER - P : zone.to + P;

  jig(w, now, zone, danceEnd(now));
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
  // Somebody has walked to a hat lying on the ground that is not its own, and is
  // standing over it. Picking it up sends the body straight back to work through
  // `retask` -- in its new job, if the hat came with one -- so there is no leg
  // left to walk and this returns rather than falling through to one.
  if (w.leg === 'grab' && grabHat(w)) { S.dirty = true; return; }
  // Somebody has walked to a lever and is standing at it. This is the only place
  // in the game a machine starts or stops, which is the point of the walk.
  S.dirty = true;
  if (w.legs && w.legs.length) { nextLeg(w); return; }
  if (w.leg === 'back') { w.leg = null; w.legs = null; w.walkTo = null; w.walking = false;
                          w.route = null; return; }
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

// --- a hat on the ground is anybody's ------------------------------------------
// A knocked-off hat used to belong to the head it came off: it lay where it fell
// until its owner had finished seeing stars and walked back for it, and nobody
// else in the yard so much as looked at it. But a hat belongs to the STATION and
// not to the head under it -- that sentence is what the whole kit is built on --
// and a helmet lying in the dirt is the plainest case of it there is. So it is
// anybody's who is entitled to wear one, and the nearest of them gets it.
//
// Who is entitled:
//   * somebody already on that job, bare-headed. Its own station's kit, on the
//     ground, in front of it.
//   * any BARE hauler. Carrying is what a body does when it is on nothing, so
//     there is nothing to put down first and nothing to walk home: picking the
//     hat up is the whole of the move -- and the job comes with it, because the
//     hat IS the job.
//
// A carter with its cart still on is deliberately NOT on that list. Its cart is
// the lip's kit and no head wears two stations' hats, so it would have to hand
// the cart in first -- and it already can: put it on another job and `stepKit`'s
// stray rule walks it to the stand, and it is bare-handed and eligible on the
// way back. One rule, and no cross-kit special case anywhere.
const bareHauler = o => o.type === 'hauler' && !o.trained;

// Could this body wear that hat if it were standing over it? Somebody on the job
// needs nothing but a bare head. Anybody else needs somewhere to stand at the
// station, because putting the hat on is joining it.
//
// Entitlement only. Whether it is free to set off is `canRun`, and the two are
// deliberately separate questions: `canRun` is false for a body that is walking,
// which is every claimant from the moment it sets off -- ask them together and a
// claim is cancelled by the walk it started.
const mayWear = (o, job) => !o.trained &&
  (JOB_OF[o.type] === job || (bareHauler(o) && roomAt(job) >= 1));

// The station's hats lying loose and at rest. In flight they are nobody's: a hat
// still in the air has not landed anywhere anybody could walk to, and its owner
// is the only body that waits about for it.
const looseHats = job => S.workers.filter(o => o.hatOff && o.hatOff.rest && o.hatOff.of === job);

// The owner is a racer too -- but it joins the race when its stars clear, not
// before. That is the whole of what makes the hat up for grabs: it is lying
// there because somebody turned its owner upside down, and the owner spends the
// next second and a half rocking where it landed.
const ownerRacing = o => !o.dizzyUntil && !o.dizzyFor && !o.lifted && !o.falling && !o.inside;

// A claim is held every frame or it is not a claim. `claimHat` is the body whose
// hat this one is walking for -- a claim on the thing, not on the station -- and
// this drops it the instant the thing is not there to be claimed: the owner got
// to it first, somebody else did, the walk was abandoned for a rock coming down,
// or the claimant put something else on on the way. A body that loses its claim
// stops walking for it and goes back to what it was doing.
//
// It also re-states `fetching`, which is what `stepKit` reads to keep a station
// to one errand at a time: a claimant is that station's errand while it walks.
function holdClaims() {
  for (const w of S.workers) {
    const o = w.claimHat;
    if (!o) continue;
    const h = o.hatOff;
    if (h && h.rest && w.leg === 'grab' && w.walking && mayWear(w, h.of) &&
        S.workers.includes(o)) { w.fetching = h.of; continue; }
    w.claimHat = null;
    retask(w, w.type);
  }
}

// Off to pick up somebody else's hat. The same shape as `errand`: a leg to the
// thing and a leg back to the work, and `fetching` set so the station does not
// send a second body after the same hat.
function grabErrand(w, owner) {
  w.claimHat = owner;
  w.fetching = owner.hatOff.of;
  w.legs = [{ to: owner.hatOff.x, do: 'grab' },
            { to: stationX(w.type) ?? w.x, do: 'back' }];
  nextLeg(w);
}

// Put a body on the job whose kit it has just picked up off the ground.
//
// The body's `type` and the station's count move on the same line, and that is
// the whole of the care this needs: `syncWorkers` REBUILDS the crew from the
// counts, so a type changed without the count is a body stood straight back
// down, and a count changed without the type stands somebody ELSE down instead.
// Changed together, the rebuild finds everybody where it wants them and does
// nothing at all. `rebalance` takes the body off the carriers afterwards,
// because carrying is whoever is left over.
function joinJob(w, job) {
  const type = TYPE_OF[job];
  // Carrying is not a station you can join by putting something on -- it is what
  // is left when you are on nothing -- and nothing reaches here asking to: a
  // loose cart is only ever claimable by a hauler, who is on that job already.
  if (!type || job === 'haulers' || roomAt(job) < 1) return false;
  w.type = type;
  S[job] += 1;
  rebalance();
  syncWorkers();
  S.dirty = true;
  return true;
}

// Picking the hat up, at the spot where it is lying.
function grabHat(w) {
  const o = w.claimHat;
  w.claimHat = null;
  const h = o && o.hatOff;
  if (!h || !h.rest) return false;              // somebody got there first
  const job = h.of;
  const joining = JOB_OF[w.type] !== job;
  // The counts can move while somebody walks. If the station has no room left by
  // the time it arrives, it does not join: the hat stays lying where it is, for
  // its owner or for the next body along, and this one walks back to carrying
  // with nothing on its head. Asked here as well as at the claim because a claim
  // is a plan and this is the moment.
  if (joining && roomAt(job) < 1) return false;
  o.hatOff = null;
  w.trained = true;
  w.kitOf = job;
  // The body it came off has lost the job with it -- see `dispossessed`. Marked
  // rather than moved, because the owner may still be seeing stars, or still in
  // your hand, and a body is not retasked out from under either of those.
  if (joining) { o.robbed = true; joinJob(w, job); }
  retask(w, w.type);                            // and away to the work in it
  return true;
}

// Robbed: it came round to find its hat on somebody else's head.
//
// If the station has another one on the stand, nothing has been lost but the
// walk, and the ordinary books send it over for that -- which is `retask`: to
// the stand if there is anything on it, and to the work if there is not.
//
// If there is nothing for it, the swap stands. Somebody who was carrying is at
// this station now, wearing this station's hat, so the station has a pair of
// hands more than it had and the yard a carrier fewer -- and the body with
// nothing on its head is the one that moves. It goes carrying. One shake, one
// swap: the headcount does not move, and the hat took the job with it both ways.
function dispossessed(w) {
  const job = JOB_OF[w.type];
  if (w.trained || w.type === 'hauler' || !S[job] || kitFree(job) > 0) {
    retask(w, w.type);
    return;
  }
  w.type = 'hauler';                 // the body and the count together, as ever
  S[job] -= 1;
  rebalance();                       // ...and carrying is whoever is left over
  syncWorkers();
  retask(w, 'hauler');
  S.dirty = true;
}

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
  holdClaims();
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

    // A hat of this station's lying in the dirt, and the nearest body entitled
    // to it goes and gets it. The owner is in that race on the same terms as
    // everybody else once its stars have cleared -- and if the owner is the
    // nearest, nothing is issued here at all: its own recovery walk (see the
    // stages) is already that walk, and a second one is the same hat fetched
    // twice by two bodies.
    const hat = looseHats(job)[0];
    if (hat) {
      const near = o => Math.abs(o.x - hat.hatOff.x);
      let best = null;
      for (const o of S.workers) {
        if (o === hat || !mayWear(o, job) || !canRun(o)) continue;
        if (!best || near(o) < near(best)) best = o;
      }
      if (best && !(ownerRacing(hat) && near(hat) <= near(best))) {
        grabErrand(best, hat);
        continue;
      }
    }

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
  if (!r || !r.bought) return false;
  const spec = specOf(key);
  if (!spec) return false;

  // One machine, one tender. This used to catch every body of the trade: the
  // machine caps its station at one, but nothing capped how many walked to the
  // post -- so a yard carrying nine haulers when the belt was bought parked all
  // nine at its post for the rest of the run, standing in a stack, while the
  // weather's muck -- chiefly the haulers' job -- lay where it fell. Whoever is
  // nearest the post is the tender this frame; everybody else answers to the
  // yard's ordinary work, exactly as if the machine were not theirs to mind.
  const post = postOf(spec, spec.at() - WORKER - P);
  const mine = Math.abs(w.x - post);
  const me = S.workers.indexOf(w);
  for (let i = 0; i < S.workers.length; i++) {
    const o = S.workers[i];
    if (o === w || o.type !== w.type) continue;
    if (o.walking || o.inside || o.aloft || o.lifted || o.falling || o.looUntil) continue;
    const d = Math.abs(o.x - post);
    // Nearer takes it; a dead heat goes to whoever is first in the roster. Nine
    // bodies parked on the same pixel are all exactly as near, and without the
    // tie-break every one of them concluded it was the tender.
    if (d < mine - 0.5 || (Math.abs(d - mine) <= 0.5 && i < me)) return false;
  }

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

  // Some machines are worked from *inside*. A tractor has a seat and a drill rig
  // has a cab, and a body walking along beside either of them all day is a body
  // that has forgotten what the machine is for. Where that place is, is the
  // machine's own business -- see `seat` on the spec -- so this branch knows
  // there is such a thing as a seat and nothing about which machines have one.
  //
  // It still has to *walk over* and get aboard, which is what the catching-up
  // half does. Nothing in this yard arrives anywhere it did not walk to.
  if (spec.seat) {
    const seat = spec.seat();
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

// Where a machine's tender stands, which is the one question "is this thing
// manned" turns on.
//
// A seat outranks a post. `tendAt` is where a body stands *beside* a machine,
// and for one it works from on top of -- a tractor's seat, a rig's roof -- the
// body is nowhere near that spot by design: the ram's roof is sixty-six pixels
// from its tending post, and `MACHINE_REACH` is fifty-four, so the moment its
// tender climbed aboard the machine decided nobody was there and stopped dead.
//
// One answer, read in both places that ask.
const postOf = (spec, at) =>
  spec.seat ? spec.seat().x : (spec.tendAt ? spec.tendAt() : at);

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
    if (Math.abs(w.x - postOf(spec, at)) > MACHINE_REACH) continue;
    return w;
  }
  return null;
}

export function stepMachines(now) {
  for (const m of MACHINES) {
    const r = machine(m.key);
    const spec = specOf(m.key);
    if (!r || !spec || !r.bought) continue;

    const at = spec.at();
    r.working = false;                         // until it gets through all of it
    const tender = tenderFor(spec, at);
    // Unmanned: it does not tick, and the beat is pushed forward every idle
    // frame so the clock cannot fall behind. There is nothing banked to pay out
    // the moment somebody wanders back into reach; it simply is not running.
    if (!tender) { r.beatAt = now + 200; continue; }
    // Somebody is standing at it, this frame. The belt's band reads this to know
    // whether to keep running -- a load already on it must not be gated on the
    // machine having *bitten*, since the ground goes clean long before the last
    // grain reaches the hole. See `stepBelt`.
    r.mannedAt = now;
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
    //
    // Everything owed is handed over at once. A bite takes a count and answers
    // with how many beats' worth it got through -- `true` is one, for a station
    // that works a unit at a time -- and it is asked again only for what it
    // left. A machine past a beat a frame used to be called eight times a frame,
    // and each call did the station's whole bookkeeping over again: eight
    // `refreshRockTops` for the ram, eight walks of the run for the belt. The
    // cap stays what it was, a cap on *units* a frame, so a tab left in the
    // background still cannot come back and take a hundred cells in one go.
    let did = 0;
    S.machineWorking = true;
    while (owed > 0) {
      const got = spec.bite(tender, owed);
      const n = got === true ? 1 : +got || 0;
      if (n <= 0) break;
      did += n;
      owed -= n;
    }
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
    //
    // Off the top of the stack, which is where the smoke you can see comes from.
    // It used to go up from `at + P` at the machine's own waist -- the left-hand
    // end of the engine, halfway up it -- so the yard drew a chimney puffing at
    // one place and put the dirt into the sky at another. Both read the machine's
    // own `stack` now, which is the station's to answer and nobody else's.
    const dirt = MACHINE_FOUL * did;
    if (dirt > 0) {
      const s = spec.stack ? spec.stack() : { x: at + P, y: spec.y ? spec.y() : walkY(at) };
      foul(dirt, s.x, s.y, 'mach');
    }
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
  // Off the errand, off its claim. A re-tasked body is commuting, and a commute
  // owns it until it arrives -- a muck column it was walking to stays barred to
  // the whole crew for as long as the claim rides along. Claims are cheap and
  // re-picked in a frame; a held one with nobody coming is the deadlock every
  // stuck-yard report in TODO.md ends at.
  w.muckAt = null;
  if (w.goal === 'muck') w.goal = null;
  // Off the sky and down. A wizard is the one body here that can be stood down
  // while it is four hundred pixels up, and whatever it is put on next reads its
  // height as the ground it is standing on -- so it has to come down before it
  // does anything else.
  //
  // It floats rather than falls. Gravity put it on the ground in a quarter of a
  // second, which for a body that took the best part of a minute to go up reads
  // as the hat being switched off. It comes down the way it went up.
  if (w.aloft && type !== 'wizard') w.floating = true;
  // ...and a body taken out of a balloon goes over the side under an umbrella. It
  // is already floating by the line above; this is what says there is one
  // up over it, and it lets go of the craft so the craft can leave.
  bailOut(w);
  w.type = type;
  w.fetching = null;
  w.wanting = null;
  w.claimHat = null;               // and it is not walking for anybody's hat
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
// Its own legs, hands free. Lives in upgrades.js now so the stations can pace
// their own long trips with it; re-exported here for everybody that always
// imported it from the crew.
export { commutePace } from './upgrades.js';

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
                 scrubber: S.scrubbers,
                 janitor: S.janitors, wizard: S.wizards,
                 builder: S.builders };
  // Bodies are moved between jobs, not bought and sold, so one that is stood
  // down is usually one that has just been put on something else. Whatever it
  // was carrying goes on the ground at its feet: every pixel is worth one dust
  // wherever it came from, and losing a load to a reshuffle would break that.
  const room = { ...want };                 // want, counted down as bodies are kept
  const keep = [], stood = [];
  // A body lent to a build is the one its station gives up -- `rebalance` picked
  // it for being nearest -- so it is considered last and therefore stood down
  // first. Everybody else keeps their order.
  const ordered = [...S.workers.filter(w => !w.lend), ...S.workers.filter(w => w.lend)];
  for (const w of ordered) (room[w.type]-- > 0 ? keep : stood).push(w);
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
// ...on the hill or the ground as it always did -- except over the mouth of
// the hole, where the floor is the pile. `rockTop` knows nothing of the hole,
// so a body falling over the mouth landed at the ground line: inside the pile
// when the pile stood proud of it, in mid-air over the mouth when it did not.
// Landed inside the pile, it read as standing on the yard, and its next route
// to the patch ten pixels away went back across the yard and up the near
// ladder -- the reported lap out along the pile, down to "ground level", back
// to the yard and out again.
//
// Deliberately NOT the general "whatever way is over this spot": that was
// tried, and a kitted gang mining deep notches fell through them to the ground
// line instead of landing on the neighbouring rock the way `standTop` has
// always caught them, and the rock's own throughput dropped by a quarter. The
// hill keeps its old landing to the pixel; only the mouth changes.
const landing = w => {
  const mid = w.x + WORKER / 2;
  const h = ways().hole;
  if (h && mid > h.from && mid < h.to) return standTop(w.x, h.at) - WORKER;
  return standTop(w.x, rockTop) - WORKER;
};

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
  // Straight back to it if this is where it works, and a walk if it is not --
  // unless it fell in the middle of a shovelling errand, in which case the
  // errand is still its and it picks the trip up from where it came down.
  //
  // Falls are routine now, not catastrophes: a full pit's pile undulates, and a
  // body crossing it steps off a two-cell dip and lands a body's height lower
  // on the same pile. Re-tasking on every landing sent that body home across
  // half the world, its claim still held so nobody else could take the patch,
  // and its errand marched it straight back to the same dip -- a lap of the
  // yard per fall, for ever, which from outside is "the whole crew is stuck".
  // The mess stage steers a body with a claim on every frame, so all a landing
  // has to do is drop the stale route and let it.
  if (atStation(JOB_OF[w.type], w.x + WORKER / 2)) settle(w);
  else if (w.goal === 'muck' && w.muckAt != null) w.route = null;
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
//   6. **celebrate** -- a rock is off and the whole yard is dancing. Above the
//      commute and everything under it, and that position IS the fix: while a
//      body is dancing, nothing else in this list may move it. The judder that
//      was reported after three rewrites was never in the moves -- it was the
//      duck, the elbow and a work stepper all pulling on one body on one frame,
//      each patched where it was found. Above the lot of them there is nothing
//      left to pull. Every job dances; no job has a row to forget.
//   7. **commute** -- on its way to a job it has been put on, and doing none of it
//      yet. Above everything below because a body walking somewhere is not yet
//      anywhere: the work, the mess and the loo are all things you do where you
//      have arrived.
//   8. **relieve** -- now and then a body has to stop, whatever it was doing.
//      Below the commute (you do not stop halfway across the yard) and above the
//      work (it is the one thing that interrupts work).
//   9. **tender** -- somebody minding a machine. **Above the stations, and this
//      is the first ordering bug quoted above.** A miner's branch ends in
//      `continue` on every path, so a tender check below it was never reached.
//  10. **shutIn** -- a body behind a closed door stays behind it. Everything
//      below this line is a reason to walk somewhere -- a mess, a hat, a rock
//      coming down -- and none of them should reach through a shut door. It is a
//      guard rather than a fix to whichever branch was reaching in, because the
//      thing that is true is about the lab and not about any one of them.
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

// The nearest column of poop to a place, the same search `nearestMuck` runs
// over every kind at once, kept to the one kind that is a janitor's alone (see
// B4 in wave-feedback3.md, and `takeMess` below, which is the only caller). A
// column already spoken for -- by anybody, the same `taken` set `nearestMuck`
// itself reads and writes -- is skipped and a claim reserves the same elbow on
// the way out, so the two searches can never both hand out the same ground.
function nearestPoop(wx, taken) {
  const p = poopCols();
  const home = colAt(wx);
  for (let d = 0; d < p.length; d++) {
    for (const c of (d ? [home - d, home + d] : [home])) {
      if (c < 0 || c >= p.length || !p[c]) continue;
      if (taken && taken.has(c)) continue;
      if (taken) for (let k = c - MUCK_ELBOW; k <= c + MUCK_ELBOW; k++) taken.add(k);
      return c * P + P / 2;
    }
  }
  return null;
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
  const { now, taken, muckTaken, poopTaken } = c;
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
    // A janitor's own mess first -- see B4 in wave-feedback3.md. `nearestMuck`
    // treats every kind alike and hands out whichever column is nearest, which
    // is fine with one pair of hands on it and is not fine with a yard full of
    // haulers idling into the shared muck besides: poop is the one mess only a
    // janitor may touch, and with everybody else free to work everything else,
    // the nearest column for a janitor's own search kept drifting to wherever
    // the crowd had not yet reached, and the actual mess a player wants gone
    // sat for as long as the yard had any ordinary muck left to offer instead
    // -- not shoved by anybody's elbow, simply never the nearest thing going.
    // A janitor looks for its own kind first and only falls back to the shared
    // search when there is genuinely none of it left.
    const pick = (w.type === 'janitor' ? nearestPoop(w.x + WORKER / 2, poopTaken) : null)
      ?? nearestMuck(w.x + WORKER / 2, muckTaken, w);
    w.muckAt = pick == null ? null : Math.floor(pick / P);
  }
  // The patch, and the ground to work it from. They are the same place out on
  // the yard and they are not on the rock, the quarry or the plots: a body cannot
  // stand on a site, so it walks to the edge of it and reaches across. The
  // claim is still the muck's own column, so it is held until that column is
  // clear rather than until the ground beside it is.
  const patch = w.muckAt == null ? null : w.muckAt * P + P / 2;
  if (patch == null) return false;
  // Ground a shovel can actually be swung from is ground close to the patch --
  // a body's own width, give or take, the way it already stands a step back
  // from a heap it cannot walk into. `workSpot` does not know that: asked for a
  // patch with nothing solid anywhere near it -- muck lying over the open mouth
  // of an empty pit, where `footing` rightly calls the whole span NONE -- it
  // widens its search until it finds real ground *somewhere*, however far off,
  // and hands that back. Taken at face value, that reads as a stance beside the
  // mess; it is really the nearest dry land, cells away, with the claimed
  // column left hanging over open air in between. `nearestMuck` lets a hauler
  // or a janitor be sent at such a column on the understanding that getting
  // down there is a route, the same one a hauler takes into a filled pit; a
  // body that instead stood at that far stance and shovelled across the gap
  // was standing on the ground line with its claim several hundred pixels
  // below its feet -- the reported "walking through the air over the pit",
  // reappeared here at the pit's own mouth once the crew started moving fast
  // enough to reach the lip and stop before anything caught the mismatch. So a
  // stance too far from its patch to be a stance at all is not one: the claim
  // is dropped and picked up again next frame, the same way an emptied column
  // is, rather than worked from arm's length.
  const to = patch == null ? null : workSpot(patch);
  if (to == null || Math.abs(to - patch) > WORKER) { w.muckAt = null; return false; }
  // A mess under the coming rock, or the far side of it, is not fetched through
  // the fall. The walk never asked about the zone, so a body sent at one ground
  // against the zone's wall -- stepping in, shoved out by the duck, stepping in
  // -- and juddered on the line for the whole of the fall. Every hauler errand
  // already answers this with the dance (see `across` and `heldUp` below), and
  // a shovel is an errand like any other: the body joins in and picks the mess
  // back up when the ground is open again. The claim is kept -- nobody else can
  // walk there either.
  if (S.rockFall > 0 && c.zone &&
      ((to + WORKER > c.zone.from && to < c.zone.to) || across(c.zone, w.x, to))) {
    // The claim is kept -- nobody else can walk there either -- and the body is
    // left to the celebrate stage, which has already had this frame. Reached
    // only by a body whose shovel was booked before the rock was announced.
    return true;
  }
  // and the dance is put away when the shovel comes back out, the same tidy-up
  // the miners and the haulers do, so the hop is not carried to the mess
  if (w.jigAt != null) { stopJig(w); w.say = null; }
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
    w.x += Math.sign(target - w.x) * Math.min(haulSpeed() * frames(), Math.abs(target - w.x));
    if (Math.abs(target - w.x) < P) {
      // A proper toss off the lip, so it arcs out over the edge -- and it is
      // aimed at the hole, the same way spoil is aimed at a pile. It used to
      // be a fixed spray, which was fine while the pit ran two windows to the
      // right and never once while it is a scrape: the same throw sailed over
      // the far wall and came down on the ground behind it.
      const from = w.x + WORKER / 2, up = S.groundY - WORKER - P;
      const far = pit.x + Math.max(P, pit.w - P * 2);
      if (w.hasCore) {
        // Lobbed, not dropped -- see B3 in wave-feedback3.md. Same lip, same
        // hands, the same landing formula a grain of dust gets a column further
        // down this function, and the same arc-from-here-to-there `aim` throws
        // everything else on, just sized to a fixed peak instead of one picked
        // by distance. It is not banked here: it is caught by `stepCore`,
        // which only counts it the moment it actually touches the pile, the
        // same as it always has for a core dropped off the rock.
        const land = Math.min(far, pit.x + P * 2 + Math.abs(bell()) * (far - pit.x) * 0.45);
        const v = aim(from, up, land, CORE_SIZE, CORE_LOB_H);
        S.coreItem = { x: from - CORE_SIZE / 2, y: up, vx: v.vx, vy: v.vy, rest: false };
        w.hasCore = false;
        S.dirty = true;
      }
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

  // A scrubber is behind a door, and a balloon is a door too.
  //
  // The house's body has always been out of the yard's reach once it is through
  // the door -- it simply had no `shutIn` to say so, because `goal === 'in'`
  // also means "not drawn" and nothing outside was reaching for it anyway. A
  // body in a *craft* is a different case and needs saying out loud: it is
  // standing in a basket several hundred pixels up, and every rule in the
  // pipeline below -- the fall, the lip, the muck errand, the re-plant on to the
  // ground it is supposedly standing on -- would take it back. What that looked
  // like was a balloon that rose a few pixels, lost its rider to the yard, sank,
  // and picked it up again: the rider was aloft on six frames in a hundred.
  //
  // The same sentence the wizard's entry makes, for the same reason: nothing in
  // the pipeline applies to a body that is not on the ground.
  scrubber: { work: stepScrubber, shutIn: w => w.goal === 'in' || w.goal === 'aloft' },

  // A builder walks to whatever is being put up and stands there. It shovels
  // like anybody else: a build is not so urgent that the mess can pile up round
  // it, and the mess is the one errand every body in this yard answers.
  builder: { work: stepBuilder },

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
  w => {
    // An unsupported body FALLS. The climber's ease is for feet following
    // ground that is there; when the ground is not -- the rock finished under
    // a gang standing on it, a column mined out, a stroll off a ledge -- the
    // ease drew a body gliding gently down through open air, which is the
    // reported "floating off the rock". More than a couple of cells of nothing
    // under the feet is not a climb, it is a drop, and gravity takes it. A
    // body on a ladder is the exception: a climb leg holds it over its way's
    // floor on purpose, rungs are what it is standing on.
    // The bar sits above every deliberate jump in the yard -- the dance's hop
    // is three cells, the swings and bobs less -- and a dancing body is let
    // alone entirely: its height IS the animation. What is left above five
    // cells of nothing is ground that genuinely is not there.
    // And only under the open sky. A body down a working stands on its way's
    // own floor, which `fall` knows nothing about -- its landing is the yard's
    // surface, so a quarrier tripped mid-dig was yanked UP through the wall
    // onto the bridge. The reported float is bodies over the yard and the
    // hill; the holes keep their ladders and their eases.
    // And not in its first moments. A fresh body is born at its station's own
    // height -- a miner at the heart of the rock -- and eases onto the surface
    // as it comes into the world; treating that settling-in as a fall dropped
    // newborns out of the sky with their velocities zeroed, and a warm-up's
    // worth of hat errands never happened.
    // ...and not a body scaling a face. `climbTo`'s wall rule holds a body at
    // the foot of anything steeper than a walk and leads it up by the feet, and
    // for the length of that climb the surface under it really is a long way
    // down -- that is what climbing a wall looks like. It was read as
    // unsupported, knocked off at five cells, landed, was re-tasked home by the
    // landing, and sent straight back by its errand: on any rock whose toe
    // stands taller than five cells -- every boulder past the mid game -- the
    // whole crew shuttled between their stations and the flank for ever, and
    // the mess on the hill was never cleared, every column of it claimed by a
    // body that could not get up to it. The stamp is this frame's or last's,
    // written by the one climber in the game, so a body genuinely dropped --
    // ground mined out from under it, a ledge walked off -- has no stamp and
    // falls exactly as it did.
    if (!w.falling && !w.lifted && !w.aloft && !w.floating && !w.inside &&
        w.jigAt == null && onYard(w) && (w.lived || 0) > 4000 &&
        !(w.route && w.route[0] && w.route[0].climb) &&
        S.tick - (w.scaleAt ?? -9) > 2 &&
        surfaceUnder(w) - w.y > P * 5) {
      w.falling = true;
      w.vy = 0;
      w.vx = 0;
    }
    if (!w.falling) return false; fall(w); return true; },

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
    // stage below takes it from here on this very frame -- and that stage is
    // also where it finds out that somebody took the hat while it lay there.
    if (w.hatOff || w.robbed) return false;
    retask(w, w.type);
    return true;
  },

  // gone to pick a knocked-off hat back up -- once it has actually come down.
  // A body recovered before its hat has landed stands where it is for the
  // half-second the arc takes, rather than chasing a point still in the air.
  w => {
    if (!w.hatOff) {
      // Gone: somebody walked over and put it on while this one was seeing
      // stars. What that costs is `dispossessed`.
      if (!w.robbed) return false;
      w.robbed = false;
      dispossessed(w);
      return true;
    }
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

  // The rock is off and the whole yard is celebrating. Above the work, the
  // stations and the mess, so that nothing else in this list can move a dancing
  // body -- which is the whole of the fix, and the reason there is one row here
  // rather than a `held` on every job.
  //
  // Below the commute and the loo, which is where the old `held` sat and for
  // the reason worked out then: a body already on its way somewhere finishes
  // the walk. Above them it stopped bodies mid-errand -- a miner fetching its
  // helmet stood down to dance with the hat still on the stand -- and walking
  // and dancing at once is the collision this whole rewrite is against.
  //
  // A body that is not standing in the yard cannot dance in it, and this is the
  // whole of the exception: through a door, or up in the balloon. The ones in
  // your hand, falling, seeing stars or floating down are claimed by the stages
  // above and never reach this line.
  (w, c) => {
    if (!dancing(c)) {
      // The party is over: put the dance away once, here, and let the body have
      // the rest of its frame back. This is the only place a dance ends now.
      //
      // A DANCE, and not whatever else is using the same fields. The builders'
      // work jig is this machinery on a move of its own and keeps `jigAt` for
      // as long as the build lasts, so a blanket wipe here reset a hammering
      // body every frame it was not celebrating -- which is every frame -- and
      // no builder ever swung. The move says which animation this is; the job
      // does not, and a second work jig later would be caught by the same test.
      if (w.jigAt != null && MOVE_KEYS.includes(w.move)) { stopJig(w); w.say = null; }
      return false;
    }
    // ...and a body that belongs to a craft: aloft in it, or on its way to the
    // mooring to take it up. A balloon halfway through being crewed is the
    // errand case again -- the walk is finished first -- and a body already in
    // the basket is no more in the yard than one behind a door.
    if (w.inside || w.aloft || w.craft || indoors(w) || inHouse(w)) return false;
    celebrate(w, c.now, c.zone);
    return true;
  },

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
  // ...and a second book, for the one mess only a janitor may touch.
  //
  // Poop and muck share a book because they share a layer of columns, and that
  // is right for muck: two bodies must not shovel the same patch. It is wrong
  // for poop. A hauler idling into the yard's ordinary muck reserves the four
  // columns either side of its patch, and if a body left something under that
  // reservation the janitor's own search -- which asks for poop FIRST, and only
  // falls back to the shared one when there is none to be had -- was told there
  // was none, by a body that could not have touched it in any case. With a yard
  // full of idle hands on the muck, the poop the player actually wants gone can
  // sit under somebody else's elbow for ever. B4 said poop is a janitor's
  // alone; this is the other half of saying so.
  const poopTaken = new Set();
// The columns already spoken for by bodies that are on their way to them --
  // WITH their elbows. `nearestMuck` reserves a body's width either side when a
  // claim is made, but this rebuild used to carry only the claimed column
  // itself forward, so the reservation lasted exactly one frame: from the next
  // frame on, a fresh body could claim the cell beside a held claim, and the
  // two of them shovelled the same patch standing in each other. A claim held
  // is a claim with its elbows out, every frame, or it is not a claim.
  for (const w of S.workers) {
    if (w.muckAt == null) continue;
    for (let k = w.muckAt - MUCK_ELBOW; k <= w.muckAt + MUCK_ELBOW; k++) {
      muckTaken.add(k);
      // Only a janitor's claim is an elbow on poop -- nobody else can be going
      // for any.
      if (w.type === 'janitor') poopTaken.add(k);
    }
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
  const c = { now, dt, zone, taken, muckTaken, poopTaken, cutTaken, rockTaken };
  for (const w of S.workers) {
    // A swing settles, wherever the body spends this frame. Whoever swings sets
    // the lunge to 1 and nobody eases it themselves -- see `LUNGE_EASE`, and the
    // janitor that used to be dragged from one patch of muck to the next at full
    // lunge by the branches that forgot.
    if (w.lunge) w.lunge *= LUNGE_EASE;
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
