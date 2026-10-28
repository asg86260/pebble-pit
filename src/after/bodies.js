// The members: souls who walked out of God's yard, and the jobs they are put
// on (DESIGN.md, "Act 3's crew: assigned like the yard's"). Placeholder
// drawing.
//
// A soul whose rim closes leaves its slot and walks to the camp (union.js
// sets it off, 'out'). Every member is a worker. One with no job stands at
// the podium behind the pair and agitates there, a line on its own clock;
// past the spots the floor there holds (place.js, `idleSpots`) the rest wait
// in the crowd, counted (`S.after.camp`) and agitating all the same. A
// station's roster under it (after/roster.js, on the yard's roster.js) says
// how many of each job are wanted (`S.after.crew`), up to the seats bought;
// each frame the nearest idle member takes a job that is short and walks
// there, and one off a job that is over walks back to the podium, empty-
// handed first. Every station works only with a body through its door, never
// a count: the sawyer at the mill saws the log, the joiner at the workshop
// makes the sign, and a carrier walks it out into the crowd.
//
// These are not the yard's crew (`S.workers`): nobody dies up here and the
// yard's rebalance must never reach them, so the act keeps its own list,
// `S.after.bodies`, saved whole, so a reload stands every body back where it
// was (test/after-loop.test.mjs). The list is stepped, walked and picked up
// by the place body engine (placebodies.js), which hell's ghosts share; what
// is the act's is its registry of jobs and its walk on the floor (`go`). A member who has reached the camp
// is only counted (`S.after.camp`) and stands in our crowd, so a crowd that
// has walked out by the thousand costs the frame nothing while it waits.

import { S } from '../state.js';
import { AFTER_JOB } from '../jobs.js';
import { P, AFTER_SLOT_GAP, AFTER_JOBS, AFTER_JOB_POST, AFTER_AGITATE_S, AFTER_FELL_S, AFTER_DIG_S, AFTER_PLANT_S,
         AFTER_CARRY_SLOTS, AFTER_PUT_S, AFTER_SAW_S, AFTER_CHOP_HOLD_S,
         AFTER_JOIN_FADE_S, AFTER_GOODS_HOME, AFTER_GOODS_FOOT, AFTER_WALK, AFTER_TIP_LOAD,
         AFTER_PILES, AFTER_SIGN_TIMBER, AFTER_SIGN_S } from '../config.js';
import { secs, walk, nextId } from './util.js';
import { stepCrew } from '../placebodies.js';
import { haulCap } from '../levels.js';
import { deepAt } from './sky.js';
import { built, stumpsOn, seatsOf, bladeLogs, heapBrim, benchSigns } from './levels.js';
import { afterX0, afterX1, afterFloor, floorAt, stationDoor, stationBox, signFetchX, pileMid, pileOwner, plotX, notchX, soulX, soulY, groveX1, campSpot, idleX, idleSpots, podiumMid, overCrowd, crowdEdge, AP } from './place.js';
import { agitate } from './rebel.js';
import { standing, stumped, chopTree, digStump, settled, takeGroundLog, kindOf, layGood } from './grove.js';
import { isPiled, takeBlock, setBlock, pileRoom, pileBrim } from './piles.js';
import { sweepDue, tipSawdust, sawyerHolds } from './mill.js';
import { signSpot, plantSign } from './press.js';
import { workAfter } from './work.js';
import { fillBuilders, stepBuilder, isIdle, timberReserved, nextOrder, orderOf, orderAt, orderBrought } from './build.js';

const floorY = () => afterFloor();
// A walk that keeps to the floor: the rows of God's crowd stand up the
// screen, so a body goes up into them only over the crowd, and anything off
// the floor elsewhere (the pedestal's top) is climbed straight up to and
// down from. Off the floor where it should not be, it comes down first.
// The floor rises and falls (after/place.js, `floorAt`), so a spot asked
// for on its line is the ground under it, and a body walking along keeps
// its feet on the ground. True once there.
function along(w, tx, dt) {
  const there = walk(w, tx, w.y, dt);
  w.y = floorAt(w.x);
  return there;
}
function walkTo(w, tx, ty, dt) {
  const toFloor = Math.abs(ty - floorY()) < 0.5, gy = toFloor ? floorAt(tx) : ty;
  const onFloor = Math.abs(w.y - floorAt(w.x)) < 0.5;
  if (onFloor && toFloor) return along(w, tx, dt);
  if (overCrowd(w.x) && overCrowd(tx)) return walk(w, tx, gy, dt);
  if (!onFloor) {
    // In the crowd's rows bound out of them, or up on the pedestal bound
    // elsewhere: straight down to the floor.
    if (Math.abs(w.x - tx) < 0.5) return walk(w, tx, gy, dt);
    walk(w, w.x, floorAt(w.x), dt);
    return false;
  }
  // On the floor, bound up: along it to the crowd's edge or to under the spot.
  const ex = overCrowd(tx) ? crowdEdge(w.x) : tx;
  if (Math.abs(w.x - ex) >= 0.5) { along(w, ex, dt); return false; }
  return walk(w, tx, gy, dt);
}
// Each member its own spot (polish bar, own spots; the yard's `elbowIdle`
// nudges two idlers apart, but a nudge fights a walk to a shared pile, so here
// the spot is given up front): bodies on the floor bound for the same place
// are dealt slots by id, the first on the place itself, the rest alternately
// right and left of it a body's width apart. The place a body asked for is
// kept on it (`dest`), and so is the slot, as the others read it.
function slotted(w, tx, ty) {
  if (w.state !== 'work' || w.pair != null || Math.abs(ty - floorY()) >= 0.5) { w.dest = null; return tx; }
  w.dest = tx;
  let r = 0;
  for (const o of S.after.bodies) {
    if (o !== w && o.id < w.id && o.state === 'work' && o.pair == null && o.dest != null && Math.abs(o.dest - tx) < AFTER_SLOT_GAP) r++;
  }
  return tx + (r % 2 ? 1 : -1) * Math.ceil(r / 2) * AFTER_SLOT_GAP * (r ? 1 : 0);
}
const go = (w, tx, ty, dt) => walkTo(w, slotted(w, tx, ty), ty, dt);
// Where a member waits for work at its post: its station's door, or the
// grove's edge.
const postX = w => {
  const post = AFTER_JOB_POST[w.job];
  if (post === 'grove') return groveX1() - P * 4;
  return stationDoor(post);
};
// A body with nothing to do at its job waits at its station; one with no job
// at all is at the podium (`agitating`).
const idle = (w, dt) => go(w, postX(w), floorY(), dt);

// --- the jobs ----------------------------------------------------------------------------
// How many of a job the roster wants, and the bodies on it now.
export const crewAt = job => (S.after ? S.after.crew[job] || 0 : 0);
export const crewCount = () => (S.after ? Object.values(S.after.crew).reduce((n, k) => n + k, 0) : 0);
export const bodiesOf = job => (S.after ? S.after.bodies.filter(b => b.job === job && b.state === 'work') : []);
export { isIdle };
export const idleBodies = () => (S.after ? S.after.bodies.filter(isIdle) : []);
// The members waiting in the crowd past the podium's spots, and those still
// walking out of God's yard to the camp.
export const campCount = () => (S.after ? S.after.camp : 0);
export const walkingOut = () => (S.after ? S.after.bodies.filter(b => b.state === 'out').length : 0);
// The bodies through a station's door now: standing at it, and not off on a
// trip (a sawyer sweeping, a carrier out in the crowd).
export const atStation = key => (S.after ? S.after.bodies.filter(b => b.at === key) : []);

// Who could be put on a job: every idle member, at the podium or in the
// crowd, less those already owed to a job that is short of them.
export function spareMembers() {
  if (!S.after) return 0;
  let owed = 0;
  for (const job of AFTER_JOBS) owed += Math.max(0, crewAt(job) - bodiesOf(job).length);
  return idleBodies().length + S.after.camp - owed;
}
// The roster's press (after/roster.js): one more of `job` wanted, while a
// member is spare and a seat is free; one fewer, while any is wanted. The
// bodies follow on the next frame (`staff`), walking.
export function putOn(job, d) {
  const c = S.after && S.after.crew;
  if (!c) return false;
  if (d > 0) { if (spareMembers() <= 0 || crewAt(job) >= seatsOf(job)) return false; c[job] = crewAt(job) + 1; return true; }
  if (crewAt(job) <= 0) return false;
  c[job] = crewAt(job) - 1;
  if (!c[job]) delete c[job];
  return true;
}

// Where a job is worked, world x: its station's ground, or for the grove's
// jobs the grove and the forestry shack in front of it, a little slack
// either end. A body has got to its job (`on`) once it is inside, so the
// roster's pip fills only for one that has arrived.
const REACH = P * 8;
function zoneOf(job) {
  const card = AFTER_JOB_POST[job];
  if (!card) return null;
  const b = stationBox(card === 'grove' ? 'forestry' : card);
  // A station's door may stand outside its drawing (the saw mill's, on the
  // side the logs come in from).
  if (card !== 'grove') { const d = stationDoor(card); return [Math.min(b.x, d) - REACH, Math.max(b.x + b.w, d) + REACH]; }
  return [Math.min(plotX(0), b.x) - REACH, Math.max(groveX1(), b.x + b.w) + REACH];
}
export function walkLeft(w) {
  const z = zoneOf(w.job);
  return z ? Math.max(0, z[0] - w.x, w.x - z[1]) : 0;
}

// --- the carry -----------------------------------------------------------------------
// The yard's carry (levels.js, `haulCap`, grains a load), each thing up here
// taking several of its slots (AFTER_CARRY_SLOTS): how many of `kind` a body
// holds, one at the least. `carry` is how many it has; a body read from a
// save from before the carry holds the one its `load` names.
export const holds = kind => Math.max(1, Math.floor(haulCap() / AFTER_CARRY_SLOTS[kind]));
export const carried = w => w.carry ?? (w.load ? 1 : 0);
// Taken up the yard's way, one a beat (AFTER_PUT_S), until the load is full
// or none is left: true once done, holding however many it got.
function pickUp(w, dt, kind, left, take) {
  if (carried(w) >= holds(kind) || left() <= 0) return true;
  w.t += dt;
  if (w.t < AFTER_PUT_S) return false;
  w.t = 0; take();
  w.carry = carried(w) + 1; w.load = kind;
  return carried(w) >= holds(kind) || left() <= 0;
}
// Set down the same way, the load shrinking as the pile grows: true once
// the hands are empty.
function putDown(w, dt, add) {
  if (!carried(w)) { w.load = null; return true; }
  w.t += dt;
  if (w.t < AFTER_PUT_S) return false;
  w.t = 0; add();
  w.carry = carried(w) - 1;
  if (w.carry > 0) return false;
  w.carry = 0; w.load = null;
  return true;
}
// Set down on counted pile `what` (piles.js) the same way, a block a beat
// onto its middle; a pile at its brim takes no more, and what is still in
// hand is laid on the floor at the body's feet, as a felled log lies, for a
// gatherer to carry home once the pile has room (`looseLogs`). True once the
// hands are empty.
function toPile(w, dt, what) {
  if (carried(w) && pileRoom(what) <= 0) {
    for (let k = 0; k < carried(w); k++) layGood(w.load, w.x + (k - (carried(w) - 1) / 2) * AFTER_GOODS_FOOT[w.load] * AP, floorAt(w.x));
    w.carry = 0; w.load = null; w.t = 0;
    return true;
  }
  return putDown(w, dt, () => setBlock(what));
}

// A body put on a job, from where it stands: it forgets what it was doing
// and walks to the job (the job's own frame takes it there).
function takeJob(w, job) {
  Object.assign(w, { job, errand: null, order: null, on: false, at: null, target: null, to: null, log: null, out: false, t: 0, n: 0, swing: null, dig: false, load: null, carry: 0, pick: false });
}
// A body taken off its job, back to the podium on foot.
function dropJob(w) {
  Object.assign(w, { job: null, on: false, at: null, target: null, to: null, log: null, out: false, t: 0, n: 0, swing: null, dig: false, pick: false });
}
// A member out of the crowd, who steps out of its front at the camp's edge
// by the pedestal, fading in: put on `job`, or (null) to stand at the podium.
function fromCrowd(job) {
  const a = S.after;
  a.camp -= 1;
  const at = campSpot(podiumMid());
  return { id: nextId(), job, on: false, x: at.x, y: at.y, face: 1, state: 'work', t: 0, load: null, target: null, n: 0, born: a.t };
}
// Every job brought to what its roster wants: short, the idle member nearest
// its station takes it (out of the crowd, with nobody at the podium); over,
// one empty-handed body is taken off it, and one carrying waits until it has
// put its load down.
function staff() {
  const a = S.after;
  for (const job of AFTER_JOBS) {
    const on = bodiesOf(job), want = crewAt(job);
    let n = on.length;
    if (n < want) {
      const z = zoneOf(job), mid = z ? (z[0] + z[1]) / 2 : podiumMid();
      const free = idleBodies().sort((p, q) => Math.abs(p.x - mid) - Math.abs(q.x - mid));
      for (const w of free) { if (n >= want) break; takeJob(w, job); n++; }
      while (n < want && a.camp > 0) { a.bodies.push(fromCrowd(job)); n++; }
    }
    for (const w of on) { if (n <= want) break; if (w.load == null) { dropJob(w); n--; } }
  }
  // The podium kept stood: a spot empty and a member waiting in the crowd,
  // one steps out to it.
  if (a.camp > 0 && idleBodies().length < idleSpots()) a.bodies.push(fromCrowd(null));
}

// An idle member's frame: to its spot behind the pedestal by its place among
// the idle, and a line on its own clock there; past the spots, into the
// crowd at the camp's edge (`full`), where it agitates as one of the count.
function agitating(w, dt, f) {
  let k = f.idle.indexOf(w);
  if (k < 0) k = f.idle.push(w) - 1;
  if (k >= idleSpots()) { w.state = 'out'; w.full = true; return; }
  if (!go(w, idleX(k), floorY(), dt)) return;
  w.face = 1;
  w.t += dt;
  if (w.t >= AFTER_AGITATE_S) { agitate(w); w.t = 0; w.swing = S.after.t; }
}
// The members in the crowd agitate at the same pace, a line each
// AFTER_AGITATE_S, each line knocked off a head at the podium's spots in
// turn; the share of a line still owed is kept (`lines`) so a reload loses none.
function crowdLines(dt) {
  const a = S.after;
  a.lines = (a.lines || 0) + dt * a.camp / AFTER_AGITATE_S;
  for (; a.lines >= 1; a.lines -= 1) {
    const k = (a.said = ((a.said || 0) + 1) % idleSpots());
    agitate({ x: idleX(k), y: floorY() });
  }
}
// A body's ink: fading in as it steps out of our crowd, out as it walks into it.
export const bodyInk = w => {
  const t = S.after ? S.after.t : 0;
  if (w.state === 'join') return Math.max(0, 1 - (t - w.joined) / AFTER_JOIN_FADE_S);
  return w.born == null ? 1 : Math.min(1, Math.max(0, (t - w.born) / AFTER_JOIN_FADE_S));
};

// --- each job's frame ------------------------------------------------------------------
// A station's worker: at its door, a unit of the station's work (work.js)
// done on its clock by the body standing there, slower than the hand. The
// clock holds full while the station's input is short.
function stationWork(w, key, period, dt) {
  if (!built(key)) { w.at = null; idle(w, dt); return; }
  if (!go(w, stationDoor(key), floorY(), dt)) { w.at = null; return; }
  w.at = key;
  w.t = Math.min(period, w.t + dt);
  if (w.t >= period && workAfter(key, 1)) w.t = 0;
}
// A station's worker fetches its own input when its pile cannot feed a unit
// of work and no idle hand is hauling to it (the haul, below): the saw
// mill's sawyer its logs off the forestry shack's pile, the workshop's
// joiner its timber off the timber mound (DESIGN.md, "Act 3's goods are
// blocks, and bodies carry every one": "walked to it ... by its joiner or an
// idle member"), taken up a block a beat until the load is full or the pile
// it is fed from bare, carried over and set down the same way. True while
// on that trip.
// `PILE` is the pile each station keeps, `FROM` the pile it is fed from and
// `UNIT` the blocks one unit of its work eats.
const PILE = { mill: 'logs', workshop: 'benchtimber' };
const FROM = { mill: 'grovelogs', workshop: 'timber' };
const UNIT = { mill: 1, workshop: AFTER_SIGN_TIMBER };
const goodOf = what => AFTER_PILES[what].good;
const fedAt = what => pileMid(pileOwner(what), what);
// What a pile can give up: the timber mound less the blocks a carried order
// has spoken for (build.js), every other pile all it holds.
const spareOf = what => S.after.stock[what] - (what === 'timber' ? timberReserved() : 0);
function fetchLogs(w, key, dt) {
  const a = S.after, mine = PILE[key], from = FROM[key];
  // The sawyer with a log in its hands on the mill's own trip (mill.js) has
  // its log: fetching another would drop the one it carries.
  if (key === 'mill' && sawyerHolds()) return false;
  if (!carried(w) && !w.pick && (a.stock[mine] >= UNIT[key] || spareOf(from) <= 0 || hauledTo(key))) return false;
  w.at = null;
  if (!carried(w) || w.pick) {
    if (go(w, fedAt(from), floorY(), dt)) w.pick = !pickUp(w, dt, goodOf(from), () => spareOf(from), () => takeBlock(from, w.x));
    return true;
  }
  if (go(w, pileMid(key, mine), floorY(), dt)) toPile(w, dt, mine);
  return true;
}

// --- the haul (the owner, 2026-10-26: logs "get moved by idle members. so
// the saw always stays clear") -------------------------------------------------------
// An idle member carries logs from the forestry shack's pile to the saw
// mill's, so its worker never leaves the station to fetch, and timber off
// the mound to the workshop's rack. A station's pile
// is kept to what its worker eats while a hauler
// walks over and back, a load on top, so the next load lands before the pile
// is bare: read off the walk and the station's pace, not tuned.
const EATS = { mill: () => bladeLogs() / AFTER_SAW_S, workshop: () => benchSigns() * AFTER_SIGN_TIMBER / AFTER_SIGN_S };
const HAULED = Object.keys(PILE);
export function haulWant(key) {
  const kind = goodOf(FROM[key]);
  const trip = 2 * Math.abs(fedAt(FROM[key]) - pileMid(key, PILE[key])) / AFTER_WALK + 2 * holds(kind) * AFTER_PUT_S;
  return Math.ceil(trip * EATS[key]()) + holds(kind);
}
const haulers = () => S.after.bodies.filter(o => o.errand === AFTER_JOB.HAUL);
// Blocks in a hauler's hands bound for station `key`.
const inbound = key => haulers().reduce((n, o) => n + (o.target === key ? carried(o) : 0), 0);
// Whether a hauler is bound for `key`, fetching or carrying: the worker
// there waits for it rather than walk too.
const hauledTo = key => haulers().some(o => o.target === key);
// How far short a standing, worked station's pile is, counting the blocks on
// their way. A saw mill with nobody on its job is worked by the hand alone,
// and its logs are left on the forestry pile for the hand to take where it
// likes; the workshop's rack is kept fed whoever drives its nails, as the
// design has its timber walked to it.
const WORKER = { mill: AFTER_JOB.SAW };
const worked = key => !WORKER[key] || bodiesOf(WORKER[key]).length > 0;
// Never past the pile's brim: a hauler sets no block on a full pile.
const shortOf = key => (built(key) && worked(key) ? Math.max(0, Math.min(haulWant(key), pileBrim(PILE[key])) - S.after.stock[PILE[key]] - inbound(key)) : 0);
// The station most short for its want, the saw mill on a tie, among those
// fed with `kind` (any, with none) and whose feed has a block to give: null
// when none is.
function haulTarget(kind = null) {
  let best = null, most = 0;
  for (const key of HAULED) {
    if ((kind && goodOf(FROM[key]) !== kind) || (!kind && spareOf(FROM[key]) <= 0)) continue;
    const f = shortOf(key) / haulWant(key);
    if (f > most) { most = f; best = key; }
  }
  return best;
}
const haulNeed = () => HAULED.reduce((n, key) => n + Math.min(Math.max(0, spareOf(FROM[key])), shortOf(key)), 0);

// --- the sweep ----------------------------------------------------------------------
// The heap is tipped a load at a time (mill.js): an idle member stands at
// the notch while the saw is worked and tips a load each time the heap
// comes within a load of its brim, so the saw never stops on its own
// sawdust.
const tipReady = () => S.after.stock.sawdust >= heapBrim() - AFTER_TIP_LOAD;
const chainRuns = () => atStation('mill').length > 0;
const sweeping = () => S.after.bodies.some(o => o.errand === AFTER_JOB.SWEEP);
// Goods lying still on the floor -- the grove's felled logs, and whatever the
// hand threw there (after/piles.js, AFTER_PLOTS) -- taken up nearest first, the
// next of the same kind while the load has room (the yard's carter), and
// carried to that kind's pile (AFTER_GOODS_HOME: a log the forestry shack's,
// a plank the saw mill's timber) a good a beat; `w.log` is the one walked
// to, so no two go for the same. A good whose pile's station is not
// standing is left lying. False with nothing in hand and nothing lying free.
const homeOf = kind => AFTER_GOODS_HOME[kind] || AFTER_GOODS_HOME.log;
// A good whose pile is at its brim is left lying too, until it has room.
const roomAt = what => !isPiled(what) || pileRoom(what) > 0;
const looseLogs = (kind = null) => S.after.groundLogs.filter(o => settled(o)
  && (kind ? kindOf(o) === kind : built(pileOwner(homeOf(kindOf(o)))) && roomAt(homeOf(kindOf(o)))));
function gather(w, dt) {
  const a = S.after;
  if (w.to === 'pile') {
    const what = homeOf(w.load);
    if (go(w, pileMid(pileOwner(what), what), floorY(), dt) && (isPiled(what) ? toPile(w, dt, what) : putDown(w, dt, () => { a.stock[what] += 1; }))) w.to = null;
    return true;
  }
  const kind = carried(w) ? w.load : null;
  let q = w.log != null ? a.groundLogs.find(o => o.id === w.log) : null;
  if (!q || !settled(q) || (kind && kindOf(q) !== kind)) {
    const claimed = new Set(a.bodies.filter(o => o !== w && o.log != null).map(o => o.log));
    const free = looseLogs(kind).filter(o => !claimed.has(o.id));
    q = free.length ? free.reduce((b, o) => (Math.abs(o.x - w.x) < Math.abs(b.x - w.x) ? o : b)) : null;
    w.log = q ? q.id : null;
  }
  if (kind && (carried(w) >= holds(kind) || !q)) { w.to = 'pile'; w.log = null; w.t = 0; return true; }
  if (!q) return false;
  if (!go(w, q.x + AP, floorY(), dt)) return true;
  if (takeGroundLog(q.id)) { w.carry = carried(w) + 1; w.load = kindOf(q); }
  w.log = null;
  return true;
}
// A maker's own goods out, a load at a time: once a full load waits and has
// somewhere to go, the maker runs the round an errand would (`round`, true
// once its hands are empty again) and goes back to its bench.
function takeOut(w, dt, kind, stock, room, round) {
  if (!w.out) {
    if (S.after.stock[stock] < holds(kind) || !room()) return false;
    Object.assign(w, { out: true, at: null, target: null, t: 0, pick: false });
  }
  if (round(w, dt)) w.out = false;
  return true;
}
// Who is on a round now: an errand's, or a maker's taking its goods out.
const ROUND_OF = { [AFTER_JOB.JOIN]: AFTER_JOB.CARRY };
const onRound = (o, round) => o.errand === round || (o.out && ROUND_OF[o.job] === round);
// The plot of `test` nearest `w`, one no other woodcutter has claimed first
// if there is one.
function nearestPlot(w, test) {
  const a = S.after;
  const free = a.plots.map((p, k) => k).filter(k => test(a.plots[k]));
  const lone = free.filter(k => !a.bodies.some(o => o !== w && o.job === AFTER_JOB.CUT && o.target === k));
  const pick = lone.length ? lone : free;
  return pick.length ? pick.reduce((b, k) => (Math.abs(plotX(k) - w.x) < Math.abs(plotX(b) - w.x) ? k : b)) : null;
}

const JOB_STEP = {
  woodcutter(w, dt) {
    // Logs lying first, so a felled tree is carried in before the next is
    // felled; then a grown tree; a stump only with stump removal bought.
    if (gather(w, dt)) return;
    const a = S.after;
    const p = w.target != null ? a.plots[w.target] : null;
    const ok = p && (w.dig ? stumpsOn() && stumped(p) : standing(p));
    if (!ok) {
      let i = nearestPlot(w, standing), dig = false;
      if (i == null && stumpsOn()) { i = nearestPlot(w, stumped); dig = i != null; }
      w.target = i; w.dig = dig; w.t = 0;
    }
    if (w.target == null) { idle(w, dt); return; }
    if (!go(w, plotX(w.target) + AP * 3, floorY(), dt)) return;
    w.t += dt;
    if (w.dig) { if (w.t >= AFTER_DIG_S) { digStump(w.target); w.target = null; w.t = 0; w.swing = a.t; } }
    else if (w.t >= AFTER_FELL_S) { chopTree(w.target); w.t = 0; w.swing = a.t; }
  },
  // An idle member's errand only: a woodcutter gathers as part of its own.
  gatherer(w, dt) { return gather(w, dt); },
  // An idle member's errand only: blocks to the station most short of them
  // (`haulTarget`), chosen before the fetch since each station is fed off its
  // own pile -- logs off the forestry shack's, timber off the mound.
  hauler(w, dt) {
    if (!carried(w) || w.pick) {
      if (w.target == null || !HAULED.includes(w.target)) w.target = haulTarget();
      const from = w.target ? FROM[w.target] : null;
      if (!carried(w) && (!from || spareOf(from) <= 0)) { w.target = null; w.pick = false; return; }
      if (from && go(w, fedAt(from), floorY(), dt)) w.pick = !pickUp(w, dt, goodOf(from), () => spareOf(from), () => takeBlock(from, w.x));
      if (from || !w.pick) return;
      w.pick = false;
    }
    if (w.target == null || !built(w.target) || pileRoom(PILE[w.target]) <= 0) w.target = haulTarget(w.load);
    // No station short of them any more: back on the pile they came off.
    const key = w.target, what = key ? PILE[key] : AFTER_GOODS_HOME[w.load];
    if (go(w, key ? pileMid(key, what) : fedAt(what), floorY(), dt) && toPile(w, dt, what)) w.target = null;
  },
  // An idle member's errand only: at the notch, a load tipped through each
  // time the heap comes within a load of its brim.
  sweeper(w, dt) {
    if (!go(w, notchX(), floorY(), dt)) return;
    if (!tipReady()) { w.t = 0; return; }
    w.t += dt;
    if (w.t >= AFTER_PUT_S) { tipSawdust(); w.t = 0; w.swing = S.after.t; }
  },
  // An idle member's errand only: a bought row's timber (build.js, the
  // orders), taken up off the mound a block a beat, the oldest order first,
  // and carried to the station it is for, where each block set down brings
  // the order a block nearer landing. An order gone from under a load (a new
  // game read over it) sends the load back onto the mound.
  orderer(w, dt) {
    const a = S.after, mound = fedAt('timber');
    let o = w.order != null ? orderOf(w.order) : null;
    if (carried(w) && !w.pick) {
      if (!o) { if (go(w, mound, floorY(), dt) && toPile(w, dt, 'timber')) w.order = null; return; }
      if (go(w, orderAt(o), floorY(), dt) && putDown(w, dt, () => orderBrought(o))) w.order = null;
      return;
    }
    if (!o || o.claimed >= o.n) {
      if (carried(w)) { w.pick = false; return; }
      o = nextOrder(); w.order = o ? o.id : null;
    }
    if (!o) return;
    if (go(w, mound, floorY(), dt)) w.pick = !pickUp(w, dt, 'plank', () => Math.min(o.n - o.claimed, a.stock.timber), () => { takeBlock('timber', w.x); o.claimed += 1; });
  },
  sawyer(w, dt) {
    // Off the saw while the heap has stood at its brim: to the notch beside
    // it, a load tipped through, and back.
    if (w.load === 'tip') {
      w.at = null;
      if (go(w, notchX(), floorY(), dt)) { tipSawdust(); w.load = null; }
      return;
    }
    if (built('mill') && sweepDue() && w.at === 'mill' && !sweeping() && !S.after.bodies.some(o => o.load === 'tip')) { w.load = 'tip'; w.at = null; return; }
    if (built('mill') && fetchLogs(w, 'mill', dt)) return;
    stationWork(w, 'mill', AFTER_SAW_S, dt);
  },
  // The joiner stands at its bench; its blows are the nails' (gestures.js,
  // the workshop's own taps once the hand stops), so a sign is the four
  // nails it drives, at the hand's pace or its own.
  joiner(w, dt) {
    if (!built('workshop')) { w.at = null; idle(w, dt); return; }
    if (takeOut(w, dt, 'sign', 'signs', () => !!signSpot(), JOB_STEP.carrier)) return;
    if (fetchLogs(w, 'workshop', dt)) return;
    w.at = go(w, stationDoor('workshop'), floorY(), dt) ? 'workshop' : null;
  },
  builder(w, dt) {
    // Carrying the station's loads in and raising it off them (build.js).
    stepBuilder(w, dt, walkTo);
  },
  carrier(w, dt) {
    const a = S.after;
    if (!built('workshop')) { idle(w, dt); return; }
    // A sign askew first: straightened where it stands.
    if (!w.load) {
      const bent = a.signs.find(s => s.askew && s.pull == null && !a.bodies.some(o => o !== w && o.target === `s${s.id}`));
      if (bent) w.target = `s${bent.id}`;
    }
    if (typeof w.target === 'string') {
      const s = a.signs.find(q => `s${q.id}` === w.target && q.askew && q.pull == null);
      if (!s) { w.target = null; w.t = 0; return; }
      if (!go(w, soulX(s.f) + P / 2, soulY(s.r) + P * 2, dt)) return;
      w.t += dt;
      if (w.t >= AFTER_PLANT_S) { s.askew = false; w.target = null; w.t = 0; }
      return;
    }
    // At the workshop's door: signs taken up a sign a beat, as many as the
    // load holds; with nowhere left to plant one, those in hand put back.
    if (!carried(w) || w.target == null) {
      if (!go(w, signFetchX(), floorY(), dt)) return;
      if (!signSpot()) return toPile(w, dt, 'signs');
      if (!pickUp(w, dt, 'sign', () => a.stock.signs, () => takeBlock('signs', w.x))) return false;
      if (!carried(w)) return true;
      w.target = signSpot(); w.t = 0;
      if (!w.target) return false;
    }
    const s = w.target;
    if (!go(w, soulX(s.f) + P / 2, soulY(s.r) + P * 2, dt)) return;
    w.t += dt;
    if (w.t >= AFTER_PLANT_S) {
      plantSign(s.f, s.r); w.t = 0;
      // The next in hand to the next spot free, or back to the door.
      w.carry = carried(w) - 1;
      if (w.carry <= 0) { w.carry = 0; w.load = null; w.target = null; return true; }
      w.target = signSpot();
    }
    return false;
  }
};

// Idle hands take the camp's signs out themselves while they wait at the
// stations (the owner, 2026-10-21: made, "but nobody is using them"): a
// member with no job gathers the grove's loose logs, stands at the heap's
// notch tipping it, carries a bought row's timber, hauls logs to the saw
// mill and timber to the workshop, or runs the carrier's
// round, as an errand (`w.errand`),
// keeping no job, while more lie waiting than the hands
// already on their way to them will take, and goes back to the podium once
// the pile is gone. Read off the piles only: where a sign goes is the
// carrier's own pick, made at the door.
const ERRANDS = [
  { job: AFTER_JOB.GATHER, kind: 'log', left: () => looseLogs().length },
  // One sweeper, kept at the notch while the chain runs (`hold`).
  { job: AFTER_JOB.SWEEP, per: 1, left: () => (chainRuns() && !sweeping() ? 1 : 0), hold: chainRuns },
  // A bought row's timber, while any of it waits on the mound (build.js).
  { job: AFTER_JOB.ORDER, kind: 'plank', left: () => Math.min(timberReserved(), S.after.stock.timber) },
  { job: AFTER_JOB.HAUL, kind: 'log', left: haulNeed },
  { job: AFTER_JOB.CARRY, kind: 'sign', left: () => (built('workshop') ? S.after.stock.signs : 0) }
];
const fetching = job => S.after.bodies.filter(o => onRound(o, job) && !carried(o)).length;
const errandFor = () => ERRANDS.find(e => e.left() > fetching(e.job) * (e.per ?? holds(e.kind)))?.job || null;
function runErrand(w, dt) {
  // A hauler names the station it fetches for before it has a block in hand
  // (each station is fed off its own pile), so empty-handed it is as free as
  // any other errand.
  if (w.errand && !carried(w) && (w.target == null || w.errand === AFTER_JOB.HAUL) && w.log == null) {
    const e = ERRANDS.find(q => q.job === w.errand);
    if (!e || (!e.left() && !(e.hold && e.hold()))) { w.errand = null; w.target = null; }
    // The notch first: with nobody there, the first empty hands on any other
    // errand go to it, or every idle member can be out hauling while the
    // heap stands at its brim and the saw stops.
    else if (w.errand !== AFTER_JOB.SWEEP && !w.pick && chainRuns() && !sweeping()) { w.errand = AFTER_JOB.SWEEP; w.target = null; }
  }
  if (!w.errand && !carried(w)) w.errand = errandFor();
  if (!w.errand) return false;
  // A gatherer with every loose log claimed by another and nothing in hand
  // has no errand after all: back to its spot at the podium, not stood
  // where it was while the spot is dealt to someone else.
  if (JOB_STEP[w.errand](w, dt) === false && w.errand === AFTER_JOB.GATHER && !carried(w)) { w.errand = null; return false; }
  return true;
}

// The act's JOBS registry, shaped like the yard's (crew/jobs.js): a row a
// job, in the order the roster lists them, each with its frame; the builders
// are filled site by site (build.js, `fillBuilders`). None fills itself by a
// count through the engine (no `want`): the roster's count is met by members
// already standing in the place (`staff`), so nobody is made out of nothing.
// A bought row's timber never waits for want of hands, as a station's
// raising never does (build.js, `offPosts`): with nobody idle, the member on
// a job nearest the mound, its hands empty, is lent to the order -- it keeps
// its job, so its roster still counts it, carries a load, and goes back to
// its post once no order has a block left to take up.
const lent = w => w.job && w.errand === AFTER_JOB.ORDER;
function lendHands() {
  const a = S.after;
  if (!timberReserved() || a.stock.timber <= 0 || a.camp > 0 || idleBodies().length || a.bodies.some(o => o.errand === AFTER_JOB.ORDER)) return;
  const mound = fedAt('timber');
  const free = a.bodies.filter(o => o.job && o.job !== AFTER_JOB.BUILD && o.state === 'work' && o.load == null && !o.out && !o.pick)
    .sort((p, q) => Math.abs(p.x - mound) - Math.abs(q.x - mound));
  if (free[0]) Object.assign(free[0], { errand: AFTER_JOB.ORDER, order: null, at: null, t: 0 });
}
function lentStep(w, dt) {
  if (!carried(w) && !w.pick && (!nextOrder() || S.after.stock.timber <= 0)) { w.errand = null; w.order = null; return; }
  JOB_STEP.orderer(w, dt);
}
const orLent = step => (w, dt) => (lent(w) ? lentStep(w, dt) : step(w, dt));
export const AFTER_JOB_ROWS = {
  ...Object.fromEntries(AFTER_JOBS.map(job => [job, { step: orLent(JOB_STEP[job]) }])),
  [AFTER_JOB.BUILD]: { step: JOB_STEP.builder }
};

// The act's crew, as the place body engine (placebodies.js) steps it and the
// hand takes one up: the members walking out of God's yard to the podium,
// those past its spots into the crowd, counted there as they reach it and
// fading into it; every job's frame and the idle at the podium; then each
// job staffed to its roster and the sites given builders.
const BODY_H = 3 * P;
export const AFTER_CREW = {
  list: () => (S.after ? S.after.bodies : null),
  route: walkTo,
  jobs: AFTER_JOB_ROWS,
  dt: secs,
  begin: () => ({ arrived: 0, idle: idleBodies() }),
  tick(w) {
    if (w.swing != null && S.after.t - w.swing > AFTER_CHOP_HOLD_S) w.swing = null;
    if (w.job && !w.on && walkLeft(w) <= 0) w.on = true;
  },
  stage(w, f) {
    if (w.state === 'join') { if (bodyInk(w) <= 0) w.state = 'gone'; return true; }
    if (w.state !== 'out') return false;
    // Out of God's yard to the camp's edge by the pedestal, then on to the
    // podium while a spot is free; past the spots, or sent on from them,
    // into the crowd there.
    const at = campSpot(w.x);
    if (!go(w, at.x, at.y, f.dt)) return true;
    if (!w.full && f.idle.length < idleSpots()) { w.state = 'work'; w.job = null; w.on = false; f.idle.push(w); return true; }
    w.state = 'join'; w.joined = S.after.t; w.full = false; f.arrived++;
    return true;
  },
  // No job (or a job the act no longer has, read from an older save): an
  // errand while signs wait, else at the podium.
  idle(w, dt, f) {
    if (w.job != null) { dropJob(w); if (!f.idle.includes(w)) f.idle.push(w); }
    if (runErrand(w, dt)) { const k = f.idle.indexOf(w); if (k >= 0) f.idle.splice(k, 1); return; }
    agitating(w, dt, f);
  },
  end(f) {
    const a = S.after;
    if (f.arrived) a.camp += f.arrived;
    if (a.bodies.some(w => w.state === 'gone')) a.bodies = a.bodies.filter(w => w.state !== 'gone');
    crowdLines(f.dt);
    staff();
    lendHands();
    fillBuilders();
  },
  spare: () => S.after.camp > 0,
  // Drawn as the yard's square, x its middle column and y its feet
  // (render/after.js, `body`).
  box: w => ({ x: w.x - P, y: w.y - BODY_H, w: 3 * P, h: BODY_H }),
  // Not one drawn somewhere else than where it stands: a body out among
  // God's crowd (drawn in depth), one walking into ours or still fading in,
  // the pair building (they are the pedestal's), and the first through a
  // working station's door (drawn in the station's pose).
  pickable: w => w.state !== 'join' && w.pair == null && bodyInk(w) >= 1 && deepAt(w.x) <= 0
    && !(w.at && atStation(w.at)[0] === w),
  hold(w, x, y) { w.x = x; w.y = y + BODY_H / 2; },
  lifted(w) { w.at = null; },
  land: w => ({ y: floorAt(w.x), x0: afterX0() + P, x1: afterX1() - P * 2 }),
  landed() {}
};

// One frame of every member up here.
export const stepBodies = c => stepCrew(AFTER_CREW, c);
