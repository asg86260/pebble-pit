// The members: souls who walked out of God's yard, the camp they wait in, and
// the posts they hold (DESIGN.md, "Acts 3 and 4", act 3; call 14, settled
// 2026-10-18). Placeholder drawing.
//
// A soul whose rim closes leaves its slot and walks to the camp (union.js
// sets it off, 'out'), into the front of our crowd behind the camp, and
// fades into it. Members in the camp are not workers: a post is bought at a
// station (rows.js, `S.after.posts`), and a member steps out of our crowd's
// front where it is nearest the post, fading in, to hold it. A post with nobody waiting stands empty until somebody
// walks in. Every station works only with a body through its door, never a
// count: the sawyer at the mill saws the log, the joiner at the workshop
// makes the sign, and a carrier walks it out into the crowd.
//
// These are not the yard's crew (`S.workers`, crew/jobs.js): nobody dies up
// here and none of the yard's stations or routes apply, so the act keeps its
// own list, `S.after.bodies`, saved whole, so a reload stands every body back
// where it was (test/after-loop.test.mjs). A member who has reached the camp
// is only counted (`S.after.camp`) and stands in our crowd, so a crowd that
// has walked out by the thousand costs the frame nothing while it waits.

import { S } from '../state.js';
import { AFTER_JOB } from '../jobs.js';
import { P, AFTER_JOBS, AFTER_JOB_POST, AFTER_AGITATE_S, AFTER_FELL_S, AFTER_DIG_S, AFTER_PLANT_S, AFTER_PASTE_S,
         AFTER_PASTE_LOAD, AFTER_PRESS_S, AFTER_SAW_S, AFTER_CHIP_S, AFTER_SIGN_S, AFTER_PULP_S, AFTER_CHOP_HOLD_S,
         AFTER_JOIN_FADE_S } from '../config.js';
import { secs, walk, nextId } from './util.js';
import { built, stumpsOn } from './levels.js';
import { afterFloor, stationDoor, signFetchX, pileMid, plotX, notchX, soulX, soulY, slotX, groveX1, campSpot, agitatorX, speakerAt, overCrowd, crowdEdge, AP } from './place.js';
import { agitate } from './rebel.js';
import { standing, stumped, chopTree, digStump, takeLog } from './grove.js';
import { sweepDue, tipSawdust, vatOf } from './mill.js';
import { signSpot, plantSign, freeSlot, pastePoster } from './press.js';
import { workAfter } from './work.js';
import { fillBuilders, stepBuilder } from './build.js';

const floorY = () => afterFloor();
// A walk that keeps to the floor: the rows of God's crowd stand up the
// screen, so a body goes up into them only over the crowd, and anything off
// the floor elsewhere (the pedestal's top) is climbed straight up to and
// down from. Off the floor where it should not be, it comes down first.
// True once there.
function go(w, tx, ty, dt) {
  const fl = floorY(), onFloor = Math.abs(w.y - fl) < 0.5, toFloor = Math.abs(ty - fl) < 0.5;
  if (onFloor && toFloor) return walk(w, tx, ty, dt);
  if (overCrowd(w.x) && overCrowd(tx)) return walk(w, tx, ty, dt);
  if (!onFloor) {
    // In the crowd's rows bound out of them, or up on the pedestal bound
    // elsewhere: straight down to the floor.
    if (Math.abs(w.x - tx) < 0.5) return walk(w, tx, ty, dt);
    walk(w, w.x, fl, dt);
    return false;
  }
  // On the floor, bound up: along it to the crowd's edge or to under the spot.
  const ex = overCrowd(tx) ? crowdEdge(w.x) : tx;
  if (Math.abs(w.x - ex) >= 0.5) { walk(w, ex, fl, dt); return false; }
  return walk(w, tx, ty, dt);
}
// Where a member waits for work at its post: its station's door, or the
// grove's edge.
const postX = w => {
  const post = AFTER_JOB_POST[w.job];
  if (post === 'grove') return groveX1() - P * 4;
  return stationDoor(post) + (w.id % 3) * P;
};
const idle = (w, dt) => go(w, postX(w), floorY(), dt);

// --- the posts ---------------------------------------------------------------------------
export const postsOf = job => (S.after ? S.after.posts[job] || 0 : 0);
export const postCount = () => (S.after ? Object.values(S.after.posts).reduce((n, k) => n + k, 0) : 0);
export const bodiesOf = job => (S.after ? S.after.bodies.filter(b => b.job === job) : []);
// The members waiting in the camp, and those still walking to it.
export const campCount = () => (S.after ? S.after.camp : 0);
export const walkingOut = () => (S.after ? S.after.bodies.filter(b => b.state === 'out').length : 0);
// The bodies through a station's door now: standing at it, and not off on a
// trip (a sawyer sweeping, a carrier out in the crowd).
export const atStation = key => (S.after ? S.after.bodies.filter(b => b.at === key) : []);
// A post bought at its station: one more of `job` wanted.
export const addPost = job => { const p = S.after.posts; p[job] = (p[job] || 0) + 1; S.after.postAt[job] = S.after.t; };

// Where a post of `job` first sends its member: the agitators' row behind
// the pedestal, or the post's station door or grove edge.
const postFor = (job, k) => (job === AFTER_JOB.AGITATE ? agitatorX(k) : postX({ job, id: 0 }));
// Every post without a member walking to it or at it takes a member from the
// camp, who steps out of our crowd's front nearest the post, fading in.
// None waiting, it stays empty.
function fillPosts() {
  const a = S.after;
  for (const job of AFTER_JOBS) {
    let want = postsOf(job) - bodiesOf(job).length;
    while (want-- > 0 && a.camp > 0) {
      a.camp -= 1;
      const at = campSpot(postFor(job, bodiesOf(job).length));
      a.bodies.push({ id: nextId(), job, x: at.x, y: at.y, face: 1, state: 'work', t: 0, load: null, target: null, n: 0, born: a.t });
    }
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
// Where a hauler takes a log: whichever of the saw mill and the chipper,
// among those standing, has the smaller pile; the mill on a tie. Null with
// neither standing.
const PILE = { mill: 'logs', chipper: 'chiplogs' };
function logTo() {
  const st = S.after.stock;
  const up = Object.keys(PILE).filter(k => built(k));
  if (!up.length) return null;
  return up.reduce((b, k) => (st[PILE[k]] < st[PILE[b]] ? k : b));
}
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
  agitator(w, dt) {
    // A spot behind the pedestal by its place among the agitators, a line on
    // its own clock: rebel, and nobody won.
    const k = bodiesOf(AFTER_JOB.AGITATE).indexOf(w);
    if (!go(w, agitatorX(k), floorY(), dt)) return;
    w.face = 1;
    w.t += dt;
    if (w.t >= AFTER_AGITATE_S) { agitate(w); w.t = 0; w.swing = S.after.t; }
  },
  woodcutter(w, dt) {
    // A grown tree first; a stump only with stump removal bought.
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
  hauler(w, dt) {
    const a = S.after;
    if (w.load === 'log') {
      // Chosen as it sets off with the log, and kept: a pile that drops
      // behind on the way does not turn it round.
      if (!w.to || !built(w.to)) w.to = logTo();
      if (!w.to) { idle(w, dt); return; }
      // Put down on the station's log pile, on its left, the side the logs
      // come in from.
      if (go(w, pileMid(w.to, PILE[w.to]), floorY(), dt)) { a.stock[PILE[w.to]] += 1; w.load = null; w.target = null; w.to = null; }
      return;
    }
    if (!logTo()) { idle(w, dt); return; }
    let i = w.target;
    if (i == null || !a.plots[i] || a.plots[i].logs <= 0) {
      const claimed = k => a.bodies.filter(o => o !== w && o.job === AFTER_JOB.HAUL && o.target === k && !o.load).length;
      i = a.plots.findIndex((p, k) => p.logs > claimed(k));
      w.target = i < 0 ? null : i;
    }
    if (w.target == null) { idle(w, dt); return; }
    if (!go(w, plotX(w.target) + AP, floorY(), dt)) return;
    if (takeLog(w.target)) { w.load = 'log'; w.to = logTo(); }
    w.target = null;
  },
  sawyer(w, dt) {
    // Off the saw while the heap has stood at its brim: to the notch beside
    // it, a load tipped through, and back.
    if (w.load === 'tip') {
      w.at = null;
      if (go(w, notchX(), floorY(), dt)) { tipSawdust(); w.load = null; }
      return;
    }
    if (built('mill') && sweepDue() && w.at === 'mill' && !S.after.bodies.some(o => o.load === 'tip')) { w.load = 'tip'; w.at = null; return; }
    stationWork(w, 'mill', AFTER_SAW_S, dt);
  },
  feeder(w, dt) { stationWork(w, 'chipper', AFTER_CHIP_S, dt); },
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
    w.at = go(w, stationDoor('workshop'), floorY(), dt) ? 'workshop' : null;
  },
  printer(w, dt) { stationWork(w, 'press', AFTER_PRESS_S, dt); },
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
    if (!w.load) {
      if (!go(w, signFetchX(), floorY(), dt)) return;
      if (a.stock.signs <= 0) return;
      const spot = signSpot();
      if (!spot) return;
      a.stock.signs -= 1; w.load = 'sign'; w.target = spot; w.t = 0;
    }
    const s = w.target;
    if (!go(w, soulX(s.f) + P / 2, soulY(s.r) + P * 2, dt)) return;
    w.t += dt;
    if (w.t >= AFTER_PLANT_S) { plantSign(s.f, s.r); w.load = null; w.target = null; w.t = 0; }
  },
  paster(w, dt) {
    const a = S.after;
    if (!built('press')) { idle(w, dt); return; }
    if (!w.n) {
      w.load = null;
      if (!go(w, stationDoor('press') + AP * 4, floorY(), dt)) return;
      if (a.stock.posters <= 0 || freeSlot() == null) return;
      w.n = Math.min(AFTER_PASTE_LOAD, a.stock.posters);
      a.stock.posters -= w.n; w.load = 'posters'; w.target = null; w.t = 0;
    }
    const others = a.bodies.filter(o => o !== w && o.job === AFTER_JOB.PASTE && o.target != null).map(o => o.target);
    if (w.target == null || a.posters.some(p => p.slot === w.target) || others.includes(w.target)) {
      const slot = freeSlot(0, others);
      if (slot == null) { w.target = null; return; }
      w.target = slot;
    }
    if (!go(w, slotX(w.target), floorY(), dt)) return;
    w.t += dt;
    if (w.t >= AFTER_PASTE_S) {
      pastePoster(w.target); w.n -= 1; w.target = null; w.t = 0;
      if (!w.n) w.load = null;
    }
  }
};

// One frame of every member up here: those walking out to the camp, into
// our crowd's front, counted in the camp as
// they reach it and fading into the crowd; the posts filled from the camp;
// and every post's job.
export function stepBodies(c) {
  const a = S.after, dt = secs(c);
  let arrived = 0;
  for (const w of a.bodies) {
    if (w.swing != null && a.t - w.swing > AFTER_CHOP_HOLD_S) w.swing = null;
    if (w.state === 'join') { if (bodyInk(w) <= 0) w.state = 'gone'; continue; }
    if (w.state === 'out') {
      // Into our crowd's front where it is nearest: its end, for one coming
      // from God's yard; where it stands, for a builder done.
      const at = campSpot(w.x);
      if (go(w, at.x, at.y, dt)) { w.state = 'join'; w.joined = a.t; arrived++; }
      continue;
    }
    (JOB_STEP[w.job] || idle)(w, dt);
  }
  if (arrived) a.camp += arrived;
  if (a.bodies.some(w => w.state === 'gone')) a.bodies = a.bodies.filter(w => w.state !== 'gone');
  fillBuilders();
  fillPosts();
}
