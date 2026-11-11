// Act 3's builders, on the yard's construction (DESIGN.md, "Act 3 builds
// through the yard's construction"): a station bought is a work on works.js,
// and the act hands works.js its crew (`registerPlaceCrew`) so a site counts
// the members who have ARRIVED at it, as the yard's count its builders. A
// builder picks its work, its mark on the station's ground and its hammer
// the yard's way (crew/sitework.js, crew/dance.js `workJig`); what is the
// act's is its walk along the cloud floor and the way its bodies are kept:
// x the middle column and y the feet, where the yard's are the top-left.

import { S } from '../state.js';
import { P, WORKER } from '../config.js';
import { AFTER_JOB } from '../jobs.js';
import { busySitesIn, handsAt, registerPlaceCrew } from '../works.js';
import { claimWork, ownBox, nearestIn, arrivedSlack } from '../crew/sitework.js';
import { workJig, stopJig } from '../crew/dance.js';
import { now } from '../clock.js';
import { floorAt } from './place.js';

export const builds = b => b.job === AFTER_JOB.BUILD && b.state === 'work';
registerPlaceCrew('after', { list: () => (S.after ? S.after.bodies : null), builds });

// From an act body's x to its left edge, and from its feet to its top.
const DX = -P, DY = -WORKER;

// One frame of a builder: to its mark on its work's ground along `walk`
// (the act's walk on the floor, true once there), then at work there. With
// no work for it, it stands where it is until the crew lets it go.
export function stepActBuilder(w, dt, walk) {
  const site = claimWork(w, busySitesIn('after'), S.after.bodies.filter(builds));
  if (!site) { if (w.jigAt != null) { stopJig(w); w.lunge = 0; } w.goal = null; return; }
  const box = ownBox(w);
  const mark = box ? nearestIn(box, w.x + DX) - DX : w.x;
  if (Math.abs(mark - w.x) >= arrivedSlack(w)) {
    if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
    w.goal = 'to';
    walk(w, mark, dt);
    return;
  }
  w.goal = 'at';
  if (box) w.x = nearestIn(box, w.x + DX) - DX;
  if (handsAt(site) > 0) {
    w.foot = floorAt(w.x);
    workJig(w, now(), box && { x: box.x - DX, w: box.w }, { dx: DX, dy: DY, ground: w.foot });
  } else {
    if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
    w.y = floorAt(w.x);
  }
}

// A builder read back from a save: its hammer's beat was on the last page's
// clock, so it takes its mark again from where it stands.
export function settleBuilders(bodies) {
  for (const w of bodies || []) if (w.jigAt != null) { stopJig(w); w.lunge = 0; w.restUntil = 0; }
}
