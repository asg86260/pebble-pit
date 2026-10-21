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
import { P, AFTER_JOBS, AFTER_JOB_POST, AFTER_AGITATE_S, AFTER_FELL_S, AFTER_DIG_S, AFTER_PLANT_S, AFTER_PASTE_S,
         AFTER_CARRY_SLOTS, AFTER_PUT_S, AFTER_PRESS_S, AFTER_SAW_S, AFTER_CHIP_S, AFTER_SIGN_S, AFTER_PULP_S, AFTER_CHOP_HOLD_S,
         AFTER_JOIN_FADE_S, AFTER_GOODS_HOME } from '../config.js';
import { secs, walk, nextId } from './util.js';
import { stepCrew } from '../placebodies.js';
import { haulCap } from '../levels.js';
import { deepAt } from './sky.js';
import { built, stumpsOn, seatsOf } from './levels.js';
import { afterX0, afterX1, afterFloor, floorAt, stationDoor, stationBox, signFetchX, pileMid, pileOwner, plotX, notchX, soulX, soulY, slotX, groveX1, campSpot, idleX, idleSpots, podiumMid, overCrowd, crowdEdge, AP } from './place.js';
import { agitate } from './rebel.js';
import { standing, stumped, chopTree, digStump, settled, takeGroundLog, kindOf } from './grove.js';
import { sweepDue, tipSawdust, vatOf } from './mill.js';
import { signSpot, plantSign, freeSlot, pastePoster } from './press.js';
import { workAfter } from './work.js';
import { fillBuilders, stepBuilder, isIdle } from './build.js';

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
function go(w, tx, ty, dt) {
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
// Where a member waits for work at its post: its station's door, or the
// grove's edge.
const postX = w => {
  const post = AFTER_JOB_POST[w.job];
  if (post === 'grove') return groveX1() - P * 4;
  return stationDoor(post) + (w.id % 3) * P;
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
// save from before the carry holds the one its `load` names (a paster then
// counted its sheets in `n`).
export const holds = kind => Math.max(1, Math.floor(haulCap() / AFTER_CARRY_SLOTS[kind]));
export const carried = w => w.carry ?? (w.load === 'posters' ? w.n || 1 : w.load ? 1 : 0);
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

// A body put on a job, from where it stands: it forgets what it was doing
// and walks to the job (the job's own frame takes it there).
function takeJob(w, job) {
  Object.assign(w, { job, errand: null, on: false, at: null, target: null, to: null, log: null, out: false, t: 0, n: 0, swing: null, dig: false, load: null, carry: 0, pick: false });
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
  if (!go(w, stationDoor(key) + (w.id % 3) * P, floorY(), dt)) { w.at = null; return; }
  w.at = key;
  w.t = Math.min(period, w.t + dt);
  if (w.t >= period && workAfter(key, 1)) w.t = 0;
}
// A station's worker fetches its own logs off the forestry shack's pile
// when its own is bare: taken up a log a beat until the load is full or the
// forestry pile bare, carried over and set down the same way. True while on
// that trip.
const PILE = { mill: 'logs', chipper: 'chiplogs' };
function fetchLogs(w, key, dt) {
  const a = S.after, mine = PILE[key];
  if (!carried(w) && !w.pick && (a.stock[mine] > 0 || a.stock.grovelogs <= 0)) return false;
  w.at = null;
  if (!carried(w) || w.pick) {
    if (go(w, pileMid('forestry', 'grovelogs'), floorY(), dt)) w.pick = !pickUp(w, dt, 'log', () => a.stock.grovelogs, () => { a.stock.grovelogs -= 1; });
    return true;
  }
  if (go(w, pileMid(key, mine), floorY(), dt)) putDown(w, dt, () => { a.stock[mine] += 1; });
  return true;
}
// Goods lying still on the floor -- the grove's felled logs, and whatever the
// hand let go of off a pile (after/hand.js) -- taken up nearest first, the
// next of the same kind while the load has room (the yard's carter), and
// carried to that kind's pile (AFTER_GOODS_HOME: a log the forestry shack's,
// a plank the saw mill's timber) a good a beat; `w.log` is the one walked
// to, so no two go for the same. A good whose pile's station is not
// standing is left lying. False with nothing in hand and nothing lying free.
const homeOf = kind => AFTER_GOODS_HOME[kind] || AFTER_GOODS_HOME.log;
const looseLogs = (kind = null) => S.after.groundLogs.filter(o => settled(o)
  && (kind ? kindOf(o) === kind : built(pileOwner(homeOf(kindOf(o))))));
function gather(w, dt) {
  const a = S.after;
  if (w.to === 'pile') {
    const what = homeOf(w.load);
    if (go(w, pileMid(pileOwner(what), what), floorY(), dt) && putDown(w, dt, () => { a.stock[what] += 1; })) w.to = null;
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
const ROUND_OF = { [AFTER_JOB.JOIN]: AFTER_JOB.CARRY, [AFTER_JOB.PRINT]: AFTER_JOB.PASTE };
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
  gatherer(w, dt) { gather(w, dt); },
  sawyer(w, dt) {
    // Off the saw while the heap has stood at its brim: to the notch beside
    // it, a load tipped through, and back.
    if (w.load === 'tip') {
      w.at = null;
      if (go(w, notchX(), floorY(), dt)) { tipSawdust(); w.load = null; }
      return;
    }
    if (built('mill') && sweepDue() && w.at === 'mill' && !S.after.bodies.some(o => o.load === 'tip')) { w.load = 'tip'; w.at = null; return; }
    if (built('mill') && fetchLogs(w, 'mill', dt)) return;
    stationWork(w, 'mill', AFTER_SAW_S, dt);
  },
  feeder(w, dt) {
    if (built('chipper') && fetchLogs(w, 'chipper', dt)) return;
    stationWork(w, 'chipper', AFTER_CHIP_S, dt);
  },
  pulper(w, dt) {
    // A vat its own, or at the door its clock held until one is (mill.js, `vatOf`).
    if (vatOf(w) == null && built('papermill')) { if (go(w, stationDoor('papermill') + (w.id % 3) * P, floorY(), dt)) w.at = null; return; }
    stationWork(w, 'papermill', AFTER_PULP_S, dt);
  },
  // The joiner stands at its bench; its blows are the nails' (gestures.js,
  // the workshop's own taps once the hand stops), so a sign is the four
  // nails it drives, at the hand's pace or its own.
  joiner(w, dt) {
    if (!built('workshop')) { w.at = null; idle(w, dt); return; }
    if (takeOut(w, dt, 'sign', 'signs', () => !!signSpot(), JOB_STEP.carrier)) return;
    w.at = go(w, stationDoor('workshop'), floorY(), dt) ? 'workshop' : null;
  },
  printer(w, dt) {
    if (built('press') && takeOut(w, dt, 'posters', 'posters', () => freeSlot() != null, JOB_STEP.paster)) return;
    stationWork(w, 'press', AFTER_PRESS_S, dt);
  },
  builder(w, dt) {
    // Carrying the station's loads in and raising it off them (build.js).
    stepBuilder(w, dt, go);
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
      if (!signSpot()) { while (carried(w)) putDown(w, AFTER_PUT_S, () => { a.stock.signs += 1; }); return true; }
      if (!pickUp(w, dt, 'sign', () => a.stock.signs, () => { a.stock.signs -= 1; })) return false;
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
  },
  paster(w, dt) {
    const a = S.after;
    if (!built('press')) { idle(w, dt); return; }
    // At the press: posters taken up a sheet a beat, as many as the load holds.
    const door = stationDoor('press') + AP * 4;
    if (!carried(w) || w.pick) {
      if (!go(w, door, floorY(), dt)) return;
      if (!carried(w) && (a.stock.posters <= 0 || freeSlot() == null)) return true;
      w.pick = !pickUp(w, dt, 'posters', () => a.stock.posters, () => { a.stock.posters -= 1; });
      if (w.pick) return false;
      if (!carried(w)) return true;
      w.target = null; w.t = 0;
    }
    const others = a.bodies.filter(o => o !== w && onRound(o, AFTER_JOB.PASTE) && o.target != null).map(o => o.target);
    if (w.target == null || a.posters.some(p => p.slot === w.target) || others.includes(w.target)) {
      const slot = freeSlot(0, others);
      // The fence full: those in hand go back on the press's pile, as the
      // carrier's signs do, or the hand holds them for ever.
      w.target = null;
      if (slot == null) {
        if (!go(w, door, floorY(), dt)) return false;
        while (carried(w)) putDown(w, AFTER_PUT_S, () => { a.stock.posters += 1; });
        return true;
      }
      w.target = slot;
    }
    if (!go(w, slotX(w.target), floorY(), dt)) return false;
    w.t += dt;
    if (w.t < AFTER_PASTE_S) return false;
    pastePoster(w.target); w.target = null; w.t = 0;
    w.carry = carried(w) - 1;
    if (w.carry > 0) return false;
    w.carry = 0; w.load = null;
    return true;
  }
};

// Idle hands take the camp's signs and posters out themselves while they
// wait at the stations (the owner, 2026-10-21: made, "but nobody is using
// them"): a member with no job gathers the grove's loose logs, or runs the
// carrier's or the paster's round, as an errand (`w.errand`), keeping no
// job, while more lie waiting than the hands
// already on their way to them will take, and goes back to the podium once
// the pile is gone. Read off the piles only: where a sign goes is the
// carrier's own pick, made at the door.
const ERRANDS = [
  { job: AFTER_JOB.GATHER, kind: 'log', left: () => looseLogs().length },
  { job: AFTER_JOB.CARRY, kind: 'sign', left: () => (built('workshop') ? S.after.stock.signs : 0) },
  { job: AFTER_JOB.PASTE, kind: 'posters', left: () => (built('press') && freeSlot() != null ? S.after.stock.posters : 0) }
];
const fetching = job => S.after.bodies.filter(o => onRound(o, job) && !carried(o)).length;
const errandFor = () => ERRANDS.find(e => e.left() > fetching(e.job) * holds(e.kind))?.job || null;
function runErrand(w, dt) {
  if (w.errand && !carried(w) && w.target == null && w.log == null && !ERRANDS.find(e => e.job === w.errand).left()) w.errand = null;
  if (!w.errand && !carried(w)) w.errand = errandFor();
  if (!w.errand) return false;
  JOB_STEP[w.errand](w, dt);
  return true;
}

// The act's JOBS registry, shaped like the yard's (crew/jobs.js): a row a
// job, in the order the roster lists them, each with its frame; the builders
// are filled site by site (build.js, `fillBuilders`). None fills itself by a
// count through the engine (no `want`): the roster's count is met by members
// already standing in the place (`staff`), so nobody is made out of nothing.
export const AFTER_JOB_ROWS = {
  ...Object.fromEntries(AFTER_JOBS.map(job => [job, { step: JOB_STEP[job] }])),
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
  route: go,
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
  // errand while signs or posters wait, else at the podium.
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
