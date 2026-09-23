// Getting somewhere, and arriving. A body put on a job walks to it, picking its
// kit up on the way, and does none of the job until it is standing where the job
// is.

import { WORKER } from '../config.js';
import { S } from '../state.js';
import { kitX } from '../world.js';
import { keepTo, stepRoute, wayOver } from '../route.js';
import { JOB_OF } from '../levels.js';
import { JOBS as ROSTER_JOBS } from '../staffing.js';
import { commutePace, homePace } from '../levels.js';
import { TYPE } from '../jobs.js';
import { JOB_MACHINE, machine, specOf } from '../machines.js';
import { postOf } from './tenders.js';
// kitwalk.js borrows four names back off this file; the cycle is fine because
// neither side reads the other while the modules are being evaluated.
import { grabHat, kitFree } from './kitwalk.js';
import { spareKit } from '../levels.js';
import { JOB } from '../jobs.js';
import { bailOut, berthFor, mastX } from '../balloon.js';
import { quarryFace } from '../quarry.js';
import { plotX } from '../farm.js';
import { filterDoor } from '../filter.js';
import { apothecaryDoor } from '../apothecary.js';
import { underMeteor } from '../wizard.js';
import { outhouse } from '../state.js';
import { duck, stand, onYard } from './body.js';
import { FACTORY } from './jobs.js';

// Where each job is done, for a body on its way to it. Carrying has no station:
// the dust is wherever it fell, so somebody put on it is already at work.
// `w`, when given, is the body going: a filter hand whose berth is a balloon
// works at that balloon's post, not at the filter's door.
export function stationX(type, w = null) {
  const base = handStationX(type, w);
  if (base === null) return null;              // carrying: already at work anywhere
  // A station with a machine on it is worked *from the machine*, or a body put
  // on the rock climbs the hill and is walked straight back down to the ram.
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
function handStationX(type, w) {
  if (type === TYPE.ROCK) return S.cx - WORKER / 2;
  if (type === TYPE.QUARRY) return quarryFace();
  if (type === TYPE.FARM) return plotX(0);
  if (type === TYPE.PURIFY) {
    const berth = w ? berthFor(w) : -1;
    return (berth >= 0 ? mastX(berth) : filterDoor()) - WORKER / 2;
  }
  if (type === TYPE.STIR) return apothecaryDoor() - WORKER / 2;
  if (type === TYPE.JANITOR) return outhouse.x + outhouse.w / 2 - WORKER / 2;
  // A wizard's station is the ground under the meteor: the going up is the
  // job, not the commute.
  if (type === TYPE.WIZARD) return underMeteor();
  // A builder picks a site of its own and walks itself there (`stepBuilder`).
  if (type === TYPE.BUILD) return null;
  return null;
}

// Give a body its new job's own fields, exactly the ones its factory hands
// out. It keeps where it is standing, what is on its head and what is in its
// hands: those are things it carried here, not fields of the job.
export function settle(w) {
  const hat = w.trained, of = w.kitOf;
  const carry = w.carry || 0, load = w.load || [], core = !!w.hasCore;
  const fresh = FACTORY(w.type);
  delete fresh.x;                  // where it is standing is where it walked to
  delete fresh.y;
  Object.assign(w, fresh);
  // Landed on a job of its own, it is nobody's loan any more. Only for a job
  // on the roster: a borrowed body's next stop is the build it was borrowed
  // FOR, and clearing the debt there would clear every debt a frame after it
  // was taken on.
  if (ROSTER_JOBS.includes(JOB_OF[w.type])) delete w.lentFrom;
  w.trained = hat;
  w.kitOf = of;
  w.carry = carry;
  w.load = load;
  w.hasCore = core;
  // Not part way through anything any more. `Object.assign` cannot touch a
  // field the new factory has never heard of, so every scrap of the old job's
  // half-finished errand rides along invisibly unless it is cleared here: the
  // whole journey goes -- where it was headed, which way it was on, which
  // patch it had spoken for, how far its feet had eased up a slope.
  w.legs = null;
  w.walkTo = null;
  w.walking = false;
  w.fromHome = false;
  w.route = null;
  w.routeTo = null;
  w.routeWay = null;
  w.muckAt = null;
  w.cutClaim = null;
  w.tidyAt = null;
  w.foot = null;
  w.footAt = null;
}

// --- the kit walk -------------------------------------------------------------
// A hat is a thing lying on the ground until somebody goes and gets it, and a
// body taken off a job puts its hat back before it goes anywhere else. So a
// commute is a list of legs, each somewhere to stand and one thing to do on
// getting there, and the last is always the work itself.
export function nextLeg(w) {
  const leg = w.legs && w.legs.shift();
  if (!leg) { settle(w); return; }
  w.leg = leg.do;
  w.walkTo = leg.to;
  w.walking = true;
  w.route = null;                  // somewhere new to get to, so a new way there
}

function arrive(w) {
  // `kitOf` travels with the hat: what a body wears is a fact about the kit,
  // not about the job it is on this second.
  if (w.leg === 'drop') { w.trained = false; w.kitOf = null; }
  // Only if there is still one on the stand: the count can go to nought behind
  // a body half way there, and putting one on anyway is a helmet out of
  // nothing.
  if (w.leg === 'wear') {
    if (spareKit(w.wanting) > 0) { w.trained = true; w.kitOf = w.wanting; }
    w.wanting = null;
  }
  // Picking up a hat off the ground sends the body straight back to work
  // through `retask`, so there is no leg left to walk.
  if (w.leg === 'grab' && grabHat(w)) return;
  if (w.legs && w.legs.length) { nextLeg(w); return; }
  if (w.leg === 'back') { w.leg = null; w.legs = null; w.walkTo = null; w.walking = false;
                          w.fromHome = false; w.route = null; return; }
  settle(w);
}

// The kit, then straight back to the work: 'back' rather than 'work', because
// it never left the job and re-settling it would drop what it was doing.
export function errand(w, job, what) {
  w.fetching = job;
  if (what === 'wear') w.wanting = job;
  w.legs = [{ to: kitX(job), do: what }, { to: stationX(w.type, w) ?? w.x, do: 'back' }];
  nextLeg(w);
}

// Put a stood-down body onto a job that is short of one, where it stands. Its
// `type` changes at once rather than on arrival: `want`, `pickPlot`, `elbowed`
// and `seatX` all filter on type, and a body walking to a job is on that job
// as far as the books are concerned. It does none of the work until it gets
// there.
export function retask(w, type) {
  // Off its claim: a commute owns the body until it arrives, and a muck column
  // held by a body that is not coming is barred to the whole crew for good.
  w.muckAt = null;
  if (w.goal === 'muck') w.goal = null;
  // A wizard stood down aloft has to come down before anything else, because
  // whatever it is put on next reads its height as the ground. It floats
  // rather than falls, the way it went up.
  if (w.aloft && type !== TYPE.WIZARD) w.floating = true;
  // A body taken out of a balloon goes over the side under an umbrella and
  // lets go of the craft so the craft can leave.
  bailOut(w);
  w.type = type;
  w.fetching = null;
  w.wanting = null;
  w.claimHat = null;               // and it is not walking for anybody's hat
  // Out of the house: nothing else clears `inside`, and a body put on a job
  // straight from the house works it invisibly. It hurries to its work the way
  // one going home hurries back (HOME_HURRY), for this one commute.
  w.fromHome = !!w.inside;
  w.inside = false;
  const job = JOB_OF[type];
  const legs = [];
  // The hat goes back where it came from first. `kitOf` rather than the old
  // job: they differ when a body is retasked twice in a row. Unless the new
  // job IS the hat's own station: kit that is already right stays on, or a
  // body picked up and put down makes three trips to end up as it began.
  if (w.trained && w.kitOf !== job && kitX(w.kitOf) !== null)
    legs.push({ to: kitX(w.kitOf), do: 'drop' });
  // Then the new station's stand, *before* the work, not after.
  if (!w.trained && kitX(job) !== null && kitFree(job) > 0) {
    w.wanting = job;
    legs.push({ to: kitX(job), do: 'wear' });
  }
  const to = stationX(type, w);
  if (to !== null) legs.push({ to, do: 'work' });
  // No legs means nothing to walk for; it does NOT mean the kit comes off. The
  // hauler has no station, and a carter retasked in place with its cart
  // stripped here goes and fetches a phantom from the stand.
  if (!legs.length) {
    if (w.trained && w.kitOf !== job) { w.trained = false; w.kitOf = null; }
    settle(w);
    return;
  }
  w.legs = legs;
  nextLeg(w);
}

// One frame of a body walking to where it has been sent. The going is
// route.js's; what is here is that a body may not walk under a falling rock,
// and that it starts work when it gets there.
export function stepCommute(w, zone) {
  // The route is worked out once and walked, and re-asked if the ground has
  // changed under it; `keepTo` false means there is no longer a way from here
  // to there. The destination is on a way of its own, so a stand on the hill
  // is reached over the crest and a place on the yard along the floor, and
  // neither half of that is a job title.
  if (!keepTo(w, w.walkTo, wayOver(w.walkTo))) { arrive(w); return; }

  // Only a walk on the open yard ducks: holding a body on a rung against the
  // ladder for the length of a fall pushes it off.
  if (onYard(w) && duck(w, zone)) { w.y = stand(w); return; }

  if (stepRoute(w, w.fromHome ? homePace() : commutePace())) return;
  w.route = null;
  arrive(w);
}
