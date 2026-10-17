// The volunteers: members hired out of God's yard with faith, each a body
// that walks (DESIGN.md, "Acts 3 and 4", act 3, "Faith buys hands").
// Placeholder drawing.
//
// A hire is a member walking out of the crowd -- its slot left empty, a soul
// fewer for God to work -- across the yard to its post, and taking up a job.
// Every station works only with a body through its door, never a count: the
// sawyer at the mill saws the log, the joiner at the workshop makes the sign,
// and a carrier walks it out into the crowd. The dead keep their trade once
// lineage exists to say whose a volunteer is (call 5's ground); until then
// every volunteer is a plain member and works at the one pace.
//
// These are not the yard's crew (`S.workers`, crew/jobs.js): nobody dies up
// here and none of the yard's stations or routes apply, so the act keeps its
// own list, `S.after.bodies`, saved whole, so a reload stands every body back
// where it was (test/after-loop.test.mjs). A pledge is a member given to a
// station for good (rows.js): a keeper, who walks to it and stays.

import { S } from '../state.js';
import { P, AFTER_JOB_POST, AFTER_CANVASS_S, AFTER_CANVASS_RANKS, AFTER_GATHER_S, AFTER_POLE,
         AFTER_FELL_S, AFTER_GRUB_S, AFTER_PLANT_S, AFTER_PASTE_S, AFTER_PASTE_LOAD, AFTER_PRESS_S,
         AFTER_CHOP_HOLD_S } from '../config.js';
import { secs, walk, nextId } from './util.js';
import { built, sawS, signS, pulpS } from './levels.js';
import { afterFloor, stationDoor, stationBox, plotX, edgeX, soulX, soulY, slotX, groveX1 } from './place.js';
import { clouds, cloudW, cloudH, puffCloud } from './faith.js';
import { standing, chopTree, plantPlot, takeLog } from './grove.js';
import { sweepDue, sawLog, takeSweep, pulpSheet } from './mill.js';
import { joinSign, printStack, signSpot, plantSign, freeSlot, pastePoster } from './press.js';
import { canvass, canvassTarget, takeMember, soulPos } from './union.js';

const floorY = () => afterFloor();
// Where a job waits for work: its station's door, or for a job of the open
// cloud, the hall's.
const postX = w => {
  const post = w.job === 'keeper' ? w.post : AFTER_JOB_POST[w.job];
  if (post === 'grove') return groveX1() - P * 4;
  return stationDoor(post || 'hall') + (w.id % 3) * P;
};
const idle = (w, dt) => walk(w, postX(w), floorY(), dt);

// --- hiring ----------------------------------------------------------------------------
// A member walks out of the crowd to take up `job`: false with no member free.
export function hireVolunteer(job, post = null) {
  const a = S.after;
  const i = takeMember();
  if (i < 0) return false;
  const at = soulPos(i);
  a.bodies.push({ id: nextId(), job, post, x: at.x, y: at.y, face: -1, state: 'arrive', t: 0, load: null, target: null, n: 0 });
  a.volunteers[job] = (a.volunteers[job] || 0) + 1;
  return true;
}
export const volunteerCount = () => (S.after ? S.after.bodies.filter(b => b.job !== 'keeper').length : 0);
export const bodiesOf = job => (S.after ? S.after.bodies.filter(b => b.job === job) : []);
// The bodies through a station's door now: standing at it, and not off on a
// trip (a sawyer sweeping, a carrier out in the crowd).
export const atStation = key => (S.after ? S.after.bodies.filter(b => b.at === key) : []);

// --- each job's frame ------------------------------------------------------------------
// A station's worker: at its door, the work done on its clock by the body
// standing there. `make` returns false while the station's input is short,
// and the clock holds full until it is not.
function stationWork(w, key, period, make, dt) {
  if (!built(key)) { w.at = null; idle(w, dt); return; }
  if (!walk(w, stationDoor(key) + (w.id % 3) * P, floorY(), dt)) { w.at = null; return; }
  w.at = key;
  w.t = Math.min(period, w.t + dt);
  if (w.t >= period && make()) w.t = 0;
}

const JOB_STEP = {
  canvasser(w, dt) {
    if (w.target == null || w.target < 0) { w.target = canvassTarget(w.x, AFTER_CANVASS_RANKS); w.t = 0; }
    if (w.target < 0) { idle(w, dt); return; }
    const p = soulPos(w.target);
    if (!walk(w, p.x, p.y + P * 2, dt)) return;
    w.t += dt;
    if (w.t >= AFTER_CANVASS_S) { canvass(w.target); w.target = null; }
  },
  gatherer(w, dt) {
    // A cloud the pole reaches: low enough over the floor.
    const alive = clouds().filter(c => c.die == null && floorY() - (c.y + cloudH(c)) <= AFTER_POLE);
    let c = alive.find(q => q.id === w.target);
    if (!c) {
      let bd = Infinity;
      for (const q of alive) { const d = Math.abs(q.x + cloudW(q) / 2 - w.x); if (d < bd) { bd = d; c = q; } }
      w.target = c ? c.id : null; w.t = 0;
    }
    if (!c) { idle(w, dt); return; }
    const under = walk(w, Math.round((c.x + cloudW(c) / 2) / P) * P, floorY(), dt);
    const reach = floorY() - (c.y + cloudH(c)) <= AFTER_POLE;
    if (!under || !reach) { w.swing = null; return; }
    w.t += dt;
    if (w.t >= AFTER_GATHER_S) { puffCloud(c, false); w.t = 0; w.swing = S.after.t; }
  },
  planter(w, dt) {
    const a = S.after;
    if (!built('grove')) { idle(w, dt); return; }
    let i = w.target;
    if (i == null || !a.plots[i] || a.plots[i].stage !== 0) {
      i = a.plots.findIndex((p, k) => p.stage === 0 && p.fall == null
                          && !a.bodies.some(o => o !== w && o.job === 'planter' && o.target === k));
      w.target = i < 0 ? null : i; w.t = 0;
    }
    if (w.target == null) { idle(w, dt); return; }
    if (!walk(w, plotX(w.target) - P * 2, floorY(), dt)) return;
    w.t = Math.min(AFTER_GRUB_S, w.t + dt);
    if (w.t >= AFTER_GRUB_S && plantPlot(w.target)) { w.target = null; w.t = 0; }
  },
  feller(w, dt) {
    const a = S.after;
    if (!built('grove')) { idle(w, dt); return; }
    let i = w.target;
    if (i == null || !a.plots[i] || !standing(a.plots[i])) {
      const free = a.plots.map((p, k) => k).filter(k => standing(a.plots[k]));
      const lone = free.filter(k => !a.bodies.some(o => o !== w && o.job === 'feller' && o.target === k));
      const pick = (lone.length ? lone : free);
      i = pick.length ? pick.reduce((b, k) => (Math.abs(plotX(k) - w.x) < Math.abs(plotX(b) - w.x) ? k : b)) : null;
      w.target = i; w.t = 0;
    }
    if (w.target == null) { idle(w, dt); return; }
    if (!walk(w, plotX(w.target) + P * 3, floorY(), dt)) return;
    w.t += dt;
    if (w.t >= AFTER_FELL_S) { chopTree(w.target); w.t = 0; w.swing = a.t; }
  },
  hauler(w, dt) {
    const a = S.after;
    if (w.load === 'log') {
      if (walk(w, stationDoor('mill') - P * 2, floorY(), dt)) { a.stock.logs += 1; w.load = null; w.target = null; }
      return;
    }
    let i = w.target;
    if (i == null || !a.plots[i] || a.plots[i].logs <= 0) {
      const claimed = k => a.bodies.filter(o => o !== w && o.job === 'hauler' && o.target === k && !o.load).length;
      i = a.plots.findIndex((p, k) => p.logs > claimed(k));
      w.target = i < 0 ? null : i;
    }
    if (w.target == null) { idle(w, dt); return; }
    if (!walk(w, plotX(w.target) + P, floorY(), dt)) return;
    if (takeLog(w.target)) w.load = 'log';
    w.target = null;
  },
  sawyer(w, dt) {
    // Off the saw while the heap is at its brim: a load swept off the cloud's
    // edge, and back.
    if (w.load === 'sawdust') {
      w.at = null;
      if (walk(w, edgeX(), floorY(), dt)) { w.load = null; w.n = 0; }
      return;
    }
    if (built('mill') && sweepDue() && w.at === 'mill') { w.n = takeSweep(); w.load = 'sawdust'; w.at = null; return; }
    stationWork(w, 'mill', sawS(), sawLog, dt);
  },
  pulper(w, dt) { stationWork(w, 'papermill', pulpS(), pulpSheet, dt); },
  joiner(w, dt) { stationWork(w, 'workshop', signS(), joinSign, dt); },
  printer(w, dt) { stationWork(w, 'press', AFTER_PRESS_S, printStack, dt); },
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
    const others = a.bodies.filter(o => o !== w && o.job === 'paster' && o.target != null).map(o => o.target);
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
  },
  keeper(w, dt) { walk(w, stationDoor(w.post) + P * 6, floorY(), dt); }
};

// One frame of every volunteer: the walk out of the crowd to the post, then
// the job.
export function stepBodies(c) {
  const a = S.after, dt = secs(c);
  for (const w of a.bodies) {
    if (w.state === 'arrive') {
      // Down out of the ranks to the floor first, then along it.
      if (w.y < floorY() && !walk(w, w.x, floorY(), dt)) continue;
      w.state = 'work';
    }
    if (w.swing != null && a.t - w.swing > AFTER_CHOP_HOLD_S) w.swing = null;
    (JOB_STEP[w.job] || idle)(w, dt);
  }
}

// The box a station stands in, for the drawing and the pointer.
export { stationBox };
