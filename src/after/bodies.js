// The members: souls who walked out of God's yard, the camp they wait in, and
// the posts they hold (DESIGN.md, "Acts 3 and 4", act 3; call 14, settled
// 2026-10-18). Placeholder drawing.
//
// A soul whose rim closes leaves its slot and walks to the camp (union.js
// sets it off, 'out'), where it stands on the camp's ground, a body a spot.
// Members in the camp are not workers: a post is bought at a station (rows.js,
// `S.after.posts`), and the member at the back of the camp walks from its
// spot to hold it. A post with nobody waiting stands empty until somebody
// walks in. Every station works only with a body through its door, never a
// count: the sawyer at the mill saws the log, the joiner at the workshop
// makes the sign, and a carrier walks it out into the crowd.
//
// These are not the yard's crew (`S.workers`, crew/jobs.js): nobody dies up
// here and none of the yard's stations or routes apply, so the act keeps its
// own list, `S.after.bodies`, saved whole, so a reload stands every body back
// where it was (test/after-loop.test.mjs). A member who has reached the camp
// is only counted (`S.after.camp`) and drawn on its spot, so a crowd that has
// walked out by the thousand costs the frame nothing while it waits.

import { S } from '../state.js';
import { AFTER_JOB } from '../jobs.js';
import { P, AFTER_JOBS, AFTER_JOB_POST, AFTER_AGITATE_S, AFTER_FELL_S, AFTER_DIG_S, AFTER_PLANT_S, AFTER_PASTE_S,
         AFTER_PASTE_LOAD, AFTER_PRESS_S, AFTER_SAW_S, AFTER_CHIP_S, AFTER_SIGN_S, AFTER_PULP_S, AFTER_CHOP_HOLD_S } from '../config.js';
import { secs, walk, nextId } from './util.js';
import { built, stumpsOn } from './levels.js';
import { afterFloor, stationDoor, plotX, notchX, soulX, soulY, slotX, groveX1, campSpot, agitatorX, speakerAt } from './place.js';
import { agitate } from './rebel.js';
import { standing, stumped, chopTree, digStump, takeLog } from './grove.js';
import { sweepDue, tipSawdust } from './mill.js';
import { signSpot, plantSign, freeSlot, pastePoster } from './press.js';
import { workAfter } from './work.js';
import { fillBuilders, layPiece, pieceS } from './build.js';

const floorY = () => afterFloor();
// Where a member waits for work at its post: its station's door, or the
// grove's edge.
const postX = w => {
  const post = AFTER_JOB_POST[w.job];
  if (post === 'grove') return groveX1() - P * 4;
  return stationDoor(post) + (w.id % 3) * P;
};
const idle = (w, dt) => walk(w, postX(w), floorY(), dt);

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

// Every post without a member walking to it or at it takes the member at the
// back of the camp, who sets off from its spot. None waiting, it stays empty.
function fillPosts() {
  const a = S.after;
  for (const job of AFTER_JOBS) {
    let want = postsOf(job) - bodiesOf(job).length;
    while (want-- > 0 && a.camp > 0) {
      a.camp -= 1;
      const at = campSpot(a.camp);
      a.bodies.push({ id: nextId(), job, x: at.x, y: at.y, face: 1, state: 'work', t: 0, load: null, target: null, n: 0 });
    }
  }
}

// --- each job's frame ------------------------------------------------------------------
// A station's worker: at its door, a unit of the station's work (work.js)
// done on its clock by the body standing there, slower than the hand. The
// clock holds full while the station's input is short.
function stationWork(w, key, period, dt) {
  if (!built(key)) { w.at = null; idle(w, dt); return; }
  if (!walk(w, stationDoor(key) + (w.id % 3) * P, floorY(), dt)) { w.at = null; return; }
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
    if (!walk(w, agitatorX(k), floorY(), dt)) return;
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
    if (!walk(w, plotX(w.target) + P * 3, floorY(), dt)) return;
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
      if (walk(w, stationDoor(w.to) - P * 2, floorY(), dt)) { a.stock[PILE[w.to]] += 1; w.load = null; w.target = null; w.to = null; }
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
    if (!walk(w, plotX(w.target) + P, floorY(), dt)) return;
    if (takeLog(w.target)) { w.load = 'log'; w.to = logTo(); }
    w.target = null;
  },
  sawyer(w, dt) {
    // Off the saw while the heap has stood at its brim: to the notch beside
    // it, a load tipped through, and back.
    if (w.load === 'tip') {
      w.at = null;
      if (walk(w, notchX(), floorY(), dt)) { tipSawdust(); w.load = null; }
      return;
    }
    if (built('mill') && sweepDue() && w.at === 'mill' && !S.after.bodies.some(o => o.load === 'tip')) { w.load = 'tip'; w.at = null; return; }
    stationWork(w, 'mill', AFTER_SAW_S, dt);
  },
  feeder(w, dt) { stationWork(w, 'chipper', AFTER_CHIP_S, dt); },
  pulper(w, dt) { stationWork(w, 'papermill', AFTER_PULP_S, dt); },
  joiner(w, dt) { stationWork(w, 'workshop', AFTER_SIGN_S, dt); },
  printer(w, dt) { stationWork(w, 'press', AFTER_PRESS_S, dt); },
  builder(w, dt) {
    // At the site's door a piece a stretch; the station up, home: a member
    // back to the camp (walking out again, counted on arrival), the pair back
    // up onto the pedestal.
    if (w.state === 'home') {
      const at = speakerAt(w.pair);
      if (walk(w, at.x + P, at.y, dt)) w.state = 'gone';
      return;
    }
    if (built(w.site)) {
      if (w.pair != null) { w.state = 'home'; return; }
      w.job = null; w.state = 'out'; w.site = null; return;
    }
    if (!walk(w, stationDoor(w.site) + (w.pair ? P * 4 : 0), floorY(), dt)) return;
    w.t += dt;
    if (w.t >= pieceS()) { w.t = 0; w.swing = S.after.t; if (w.pair !== 1) layPiece(w.site); }
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
      if (!walk(w, soulX(s.f) + P / 2, soulY(s.r) + P * 2, dt)) return;
      w.t += dt;
      if (w.t >= AFTER_PLANT_S) { s.askew = false; w.target = null; w.t = 0; }
      return;
    }
    if (!w.load) {
      if (!walk(w, stationDoor('workshop') + P * 4, floorY(), dt)) return;
      if (a.stock.signs <= 0) return;
      const spot = signSpot();
      if (!spot) return;
      a.stock.signs -= 1; w.load = 'sign'; w.target = spot; w.t = 0;
    }
    const s = w.target;
    if (!walk(w, soulX(s.f) + P / 2, soulY(s.r) + P * 2, dt)) return;
    w.t += dt;
    if (w.t >= AFTER_PLANT_S) { plantSign(s.f, s.r); w.load = null; w.target = null; w.t = 0; }
  },
  paster(w, dt) {
    const a = S.after;
    if (!built('press')) { idle(w, dt); return; }
    if (!w.n) {
      w.load = null;
      if (!walk(w, stationDoor('press') + P * 4, floorY(), dt)) return;
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
    if (!walk(w, slotX(w.target), floorY(), dt)) return;
    w.t += dt;
    if (w.t >= AFTER_PASTE_S) {
      pastePoster(w.target); w.n -= 1; w.target = null; w.t = 0;
      if (!w.n) w.load = null;
    }
  }
};

// One frame of every member up here: those walking out to the camp, each to
// the spot behind the last one waiting, and counted in the camp once they
// stand on it; the posts filled from the camp; and every post's job.
export function stepBodies(c) {
  const a = S.after, dt = secs(c);
  // A walker is counted only from the front of the queue, so the one counted
  // is always the one standing on the camp's next spot.
  let k = 0, arrived = 0, front = true;
  for (const w of a.bodies) {
    if (w.swing != null && a.t - w.swing > AFTER_CHOP_HOLD_S) w.swing = null;
    if (w.state === 'out') {
      const at = campSpot(a.camp + k++);
      const there = walk(w, at.x, at.y, dt);
      if (there && front) { w.state = 'camp'; arrived++; } else front = false;
      continue;
    }
    (JOB_STEP[w.job] || idle)(w, dt);
  }
  if (arrived) a.camp += arrived;
  if (arrived || a.bodies.some(w => w.state === 'gone')) a.bodies = a.bodies.filter(w => w.state !== 'camp' && w.state !== 'gone');
  fillBuilders();
  fillPosts();
}
