// --- the builders -------------------------------------------------------------
// Spare hands putting up whatever the yard is building. Not a job on the
// roster: you decide to build something and the idle hands go and do it.
// The count is every place's rule (crew/sitework.js, `manSites`), asked by
// `rebalance` in staffing.js. Which work a
// builder is on, where it stands and when it has arrived are every place's
// (crew/sitework.js); the walk there over the yard's ground is this file's.
// A work goes up one of two ways: hammered where it stands (every station,
// door and machine), or carried up a piece a trip by its row's `way` (the
// ending's mansion): fetched from its pile, carried to its place and set
// there by the body that carried it.

import { WORKER, BUILD_EFFORT } from '../config.js';
import { S, bench } from '../state.js';
import { walkY } from '../world.js';
import { busyBuilderSites, busyDeepSites, siteX, handsAt, rowFor, worksAt, effortAt } from '../works.js';
import { deepPost } from './deep.js';
import { keepTo, stepRoute, wayOver, climbTo, feetOn, ways, belowYard, inShaft } from '../route.js';
import { DOWN_THERE } from '../works.js';
import { commutePace } from '../levels.js';
import { TYPE } from '../jobs.js';
import { now, frames } from '../clock.js';
import { stopJig, workJig } from './dance.js';
import { hireSpot, stand } from './body.js';
import { claimWork, nearestIn, ownBox, arrivedSlack } from './sitework.js';

export function newBuilder() {
  const { x } = hireSpot();
  return { type: TYPE.BUILD, goal: 'to', site: null, x, y: walkY(x + WORKER / 2) };
}
// The deep's: made at the crusher like its gatherers, and building only the
// deep's sites.
export const newDelver = () => ({ type: TYPE.DELVE, goal: 'to', site: null, x: deepPost(TYPE.GATHER) });
const sitesFor = w => (w.type === TYPE.DELVE ? busyDeepSites() : busyBuilderSites());
const siteFor = w => claimWork(w, sitesFor(w), S.workers.filter(o => o.type === w.type));

// The ground a builder's work stands on: the deep's floor for a site down
// the shaft, the yard's otherwise.
const wayFor = (w, x) => (DOWN_THERE.has(w.site) ? ways().deep : wayOver(x));
// Whether it is on that ground. Being over the work is not being at it: a
// deep work's span can lie right under the shaft, and a body coming down it
// is over the work all the way from the plank.
const onGround = w => !DOWN_THERE.has(w.site) || (belowYard(w) && !inShaft(w));

function buildStationX(w) {
  const site = siteFor(w);
  if (!site) return null;
  const box = ownBox(w);
  // Nowhere in particular to stand (a machine on the bench, a ram on the rock,
  // a belt the length of the yard), so it works where it is.
  if (!box) return siteX(site);
  // The nearest ground inside the zone, not `box.x`: the left corner is the
  // near end only for a body coming from the left, and one from the right
  // walked the width of the work past its own errand. Clamped rather than
  // picked by side, because a side has a flip point in it and the walk and
  // the hammer would fight across it.
  return nearestIn(box, w.x);
}

// Walk to x over the yard's ground by its routes, at a trip's pace: true on
// arrival. With no route there it stands, as a hammerer does.
function walkTo(w, x) {
  if (Math.abs(x - w.x) < 0.5 && !w.route) return true;
  w.goal = 'to';
  if (!keepTo(w, x, wayOver(x))) return false;
  if (stepRoute(w, commutePace())) return false;
  w.route = null;
  w.x = x;
  w.y = feetOn(wayOver(x + WORKER / 2), x);
  return true;
}

// One frame of a carried work's builder: a piece a trip, its trip on the body
// (`w.piece`, this session's: a reload lets it go, and the piece, not yet
// set, is carried again). The take and the set are hurried by the build-speed
// ladder, as a hammerer's worker-seconds are.
function stepCarrier(w, way) {
  if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
  let me = w.piece;
  if (me && !way.open(me.i)) me = w.piece = null;
  if (!me) {
    const i = way.next();
    if (i < 0) { w.goal = 'at'; return; }
    me = w.piece = { i, st: 'fetch', u: 0 };
  }
  const dt = frames() / 60 * effortAt(w.site) / BUILD_EFFORT;
  if (me.st === 'fetch') { if (walkTo(w, way.from(me.i))) { me.st = 'take'; me.u = 0; } return; }
  w.goal = 'at';
  if (me.st === 'take') { me.u += dt; if (me.u >= way.takeS) { me.st = 'carry'; me.u = 0; } return; }
  if (me.st === 'carry') { if (walkTo(w, way.to(me.i))) { me.st = 'set'; me.u = 0; } return; }
  me.u += dt;
  if (me.u >= way.setS) { way.set(me.i); w.piece = null; }
}

export function stepBuilder(w) {
  const site = siteFor(w);
  const work = site && worksAt(site).find(x => x.id === w.workId);
  const way = work && rowFor(work.key)?.way;
  if (way) { stepCarrier(w, way); return; }
  if (w.piece) w.piece = null;
  const to = buildStationX(w);
  if (to !== null) {
    const d = to - w.x;
    if (Math.abs(d) >= arrivedSlack(w) || !onGround(w)) {
      if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
      w.goal = 'to';
      // Routed, not slid: a body stepped in x and stood on "whatever is under
      // me now" takes the drop off the hill's footprint in one frame, because
      // `climbTo` has a wall rule facing up and none facing down. A route gets
      // it down a flank like every other errand (`stepCommute`).
      if (!keepTo(w, to, wayFor(w, to))) return;
      // At a trip's pace, so it climbs the pace ladder with everybody else.
      if (stepRoute(w, commutePace())) return;
      w.route = null;
      return;
    }
  }
  // Arrived, or nowhere in particular to walk to: at work where it stands.
  w.goal = 'at';
  // Standing ON the work: the walk stops within a pixel of the mark, and
  // `workJig` would carry that fraction hanging off the near end through every
  // stance of the build. The slack is the walk's and does not decide where the
  // feet finish.
  const zone = w.site && ownBox(w);
  if (zone) w.x = nearestIn(zone, w.x);
  if (w.site && handsAt(w.site) > 0) {
    // The bench is a fixed structure, not terrain: its top edge is where a
    // body climbs on to. Everywhere else the resting height is whatever is
    // underfoot, or a builder on a rock-mounted machine sits pinned to the
    // ground line under it.
    if (w.site === 'bench') { w.foot = bench.y - WORKER; w.footAt = w.x; }
    else climbTo(w, feetOn(wayFor(w, w.x + WORKER / 2), w.x));
    workJig(w, now());
  } else {
    if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
    w.y = DOWN_THERE.has(w.site) ? feetOn(ways().deep, w.x) : stand(w);
  }
}
