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

import { WORKER, BUILD_SHIFT, BUILD_SHIFT_SPAN } from '../config.js';
import { S, bench } from '../state.js';
import { walkY } from '../world.js';
import { busyBuilderSites, siteX, siteBox, handsAt } from '../works.js';
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
    const n = S.workers.filter(o => o.type === TYPE.BUILD && o.site === site).length;
    if (n < fewest) { fewest = n; pick = site; }
  }
  w.site = pick;
  return pick;
}

// Where the work is, and how much of it there is to walk along.
//
// One box for every site -- `siteBox` in works.js, the same one the tape is
// drawn round and the bar hangs over -- so the body, the fence and the sign
// cannot end up on different ground. They did: the settlement's zone is the
// rooms it will have once the one going up lands, while the body was placed
// off a slot looked up separately, which put the hammering away to the left of
// the fence it was inside.
function buildStationX(w) {
  const site = siteFor(w);
  if (!site) return null;
  const box = siteBox(site);
  // Nowhere in particular to stand -- the two machines on the bench, a ram on
  // the rock, a belt the length of the yard -- so it works where it is.
  if (!box) return siteX(site);
  // The near end of the zone, a body's width in, which is where a walk to it
  // ends. The patch below carries it across the rest.
  return box.x;
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
      // followed by a plain step in x, and a rockhand lent off the rock reads as
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
