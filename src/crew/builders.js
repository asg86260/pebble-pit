// --- the builders -------------------------------------------------------------
// Spare hands putting up whatever the yard is building. Not a job on the
// roster: you decide to build something and the idle hands go and do it.
// `rebalance` in upgrades.js is the one place the count is set.

import { WORKER, BUILD_SHIFT, BUILD_SHIFT_SPAN } from '../config.js';
import { S, bench } from '../state.js';
import { walkY } from '../world.js';
import { busyBuilderSites, siteX, siteBox, handsAt, worksAt, onTheGo } from '../works.js';
import { keepTo, stepRoute, wayOver, climbTo, feetOn } from '../route.js';
import { commutePace } from '../upgrades.js';
import { TYPE } from '../jobs.js';
import { now } from '../clock.js';
import { stopJig, workJig } from './dance.js';
import { hireSpot, stand } from './body.js';

export function newBuilder() {
  const { x } = hireSpot();
  return { type: TYPE.BUILD, goal: 'to', site: null, x, y: walkY(x + WORKER / 2) };
}

// Which (site, work) slot a builder is on. The unit is a work, not a site: the
// yard can hold two builds at once, and a body has to be at one of them or its
// presence credits a bar it is nowhere near. It keeps its slot while the work
// is on the go; when the work lands it takes the emptiest slot next, oldest
// first on a tie, so a queue finishes in the order it was bought.
function siteFor(w) {
  const busy = busyBuilderSites();
  if (w.site && busy.includes(w.site)
      && onTheGo(w.site).some(x => x.key === w.workKey)) return w.site;
  let pick = null, pickKey = null, fewest = Infinity;
  for (const site of busy) {
    // Only what is being built: a work in line has nobody walking to it until
    // it reaches the front (`stepWorks` in works.js).
    for (const work of onTheGo(site)) {
      const n = S.workers.filter(o => o.type === TYPE.BUILD && o !== w
                                   && o.site === site && o.workKey === work.key).length;
      if (n < fewest) { fewest = n; pick = site; pickKey = work.key; }
    }
  }
  w.site = pick;
  w.workKey = pickKey;
  return pick;
}

// The ground inside a site's zone nearest a given x: the whole box less the
// body's own width, the same span `jigSpan` works across in dance.js, so the
// spot a builder walks to and the patch it shuffles along are one rule.
const nearestIn = (box, x) => Math.max(box.x, Math.min(box.x + box.w - WORKER, x));

// The box a builder's OWN work is on (`siteBox`, the same box the tape is
// drawn round and the bar hangs over), by key, so two bodies on the yard each
// stand at the thing they are putting up rather than both at the head work's.
const ownBox = w =>
  siteBox(w.site, worksAt(w.site).find(x => x.key === w.workKey) || null);

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

export function stepBuilder(w) {
  const to = buildStationX(w);
  if (to !== null) {
    const d = to - w.x;
    // Arrived is a patch, not a pixel: `workJig` shifts the body a few cells a
    // burst, and a walk re-aimed at one pixel drags it straight back, sixty
    // times a second. Only a body genuinely somewhere else is walked again.
    const slack = w.goal === 'at' ? BUILD_SHIFT_SPAN + BUILD_SHIFT * 2 : 1;
    if (Math.abs(d) >= slack) {
      if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
      w.goal = 'to';
      // Routed, not slid: a body stepped in x and stood on "whatever is under
      // me now" takes the drop off the hill's footprint in one frame, because
      // `climbTo` has a wall rule facing up and none facing down. A route gets
      // it down a flank like every other errand (`stepCommute`).
      if (!keepTo(w, to, wayOver(to))) return;
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
    else climbTo(w, feetOn(wayOver(w.x + WORKER / 2), w.x));
    workJig(w, now());
  } else {
    if (w.jigAt != null) { stopJig(w); w.lunge = 0; }
    w.y = stand(w);
  }
}
