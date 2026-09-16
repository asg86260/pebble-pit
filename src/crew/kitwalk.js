// The kit economy: who wants a hat, who may claim one lying spare, and the
// book-keeping that stops two bodies grabbing the same one. The walk itself
// (nextLeg, arrive) is commute.js's.

import { KIT_JOBS, TYPE_OF } from '../kit.js';
import { S } from '../state.js';
import { JOB_OF, hats, rebalance, roomAt, spareKit, worn } from '../upgrades.js';
import { kitX } from '../world.js';
import { errand, nextLeg, retask, stationX, syncWorkers } from '../crew.js';
import { JOB, TYPE } from '../jobs.js';

// Somebody who could go on an errand right now. Not one off the ground: a
// wizard aloft cannot be handed a walk, because `stepCommute` puts a body on
// the ground line for the length of it, a four-hundred-pixel drop mid-frame.
const canRun = o => !o.walking && !o.inside && !o.aloft && !o.carry && !o.hasCore;

// Somebody on that job standing bare-headed, who could go and get one.
const bareAt = job => S.workers.find(o => JOB_OF[o.type] === job && !o.trained && canRun(o));

// Somebody wearing that station's kit, whatever it is doing now. Asked by
// `kitOf` and not by job, because the questions below are about bodies whose
// job and hat have come apart.
const hattedIn = job => S.workers.find(o => o.trained && o.kitOf === job && canRun(o));

// Kit already spoken for by somebody on their way to it, or two bodies put on
// the rock in the same breath both set off for the last helmet.
const claimed = job => S.workers.filter(o => o.wanting === job).length;
export const kitFree = job => spareKit(job) - claimed(job);

// --- a hat on the ground is anybody's ------------------------------------------
// A hat belongs to the STATION, not the head under it, so a knocked-off hat is
// anybody's who is entitled to wear one, and the nearest gets it. Entitled:
// somebody already on that job, bare-headed; or any BARE hauler, because
// carrying has nothing to put down first and the hat IS the job. A carter with
// its cart on is not on the list: no head wears two stations' hats, and the
// stray rule in `stepKit` already walks the cart in if it is put on another
// job.
const bareHauler = o => o.type === TYPE.HAUL && !o.trained;

// Could this body wear that hat if it were standing over it? Anybody not on
// the job needs room at the station, because putting the hat on is joining
// it. Entitlement only: `canRun` is false for every claimant from the moment
// it sets off, so asked together a claim is cancelled by the walk it started.
const mayWear = (o, job) => !o.trained &&
  (JOB_OF[o.type] === job || (bareHauler(o) && roomAt(job) >= 1));

// The station's hats lying loose and at rest; in flight they are nobody's.
const looseHats = job => S.workers.filter(o => o.hatOff && o.hatOff.rest && o.hatOff.of === job);

// The owner joins the race when its stars clear, not before.
const ownerRacing = o => !o.dizzyUntil && !o.dizzyFor && !o.lifted && !o.falling && !o.inside;

// A claim is held every frame or it is not a claim. `claimHat` is the body
// whose hat this one is walking for, dropped the instant the thing is not
// there to be claimed. It also re-states `fetching`, which keeps a station to
// one errand at a time.
function holdClaims() {
  for (const w of S.workers) {
    // A wear claim likewise: `wanting` counts against the stand and is only
    // put back by `arrive` or a full `retask`, so anything that kills the walk
    // without either (a stage dropping the legs, a hand, a rock) leaves a
    // stale claim that wedges one hat for the rest of the run. Dropped here,
    // the dispatch below re-issues the errand a frame later.
    if (w.wanting && !(w.walking &&
        (w.leg === 'wear' || (w.legs || []).some(l => l.do === 'wear'))))
      w.wanting = null;
    const o = w.claimHat;
    if (!o) continue;
    const h = o.hatOff;
    if (h && h.rest && w.leg === 'grab' && w.walking && mayWear(w, h.of) &&
        S.workers.includes(o)) { w.fetching = h.of; continue; }
    w.claimHat = null;
    retask(w, w.type);
  }
}

// Off to pick up somebody else's hat, with `fetching` set so the station does
// not send a second body after the same hat.
function grabErrand(w, owner) {
  w.claimHat = owner;
  w.fetching = owner.hatOff.of;
  w.legs = [{ to: owner.hatOff.x, do: 'grab' },
            { to: stationX(w.type) ?? w.x, do: 'back' }];
  nextLeg(w);
}

// Put a body on a job: `type` and the station's count on the same line,
// because `syncWorkers` REBUILDS the crew from the counts, and either one
// changed alone stands a body down. `rebalance` takes it off the carriers
// afterwards. Also the hand-assignment drop's move (crew/assign.js).
export function joinJob(w, job) {
  const type = TYPE_OF[job];
  // Carrying is what is left when you are on nothing, not a station to join.
  if (!type || job === JOB.HAUL || roomAt(job) < 1) return false;
  w.type = type;
  S[job] += 1;
  rebalance();
  syncWorkers();
  S.dirty = true;
  return true;
}

// Picking the hat up, at the spot where it is lying.
export function grabHat(w) {
  const o = w.claimHat;
  w.claimHat = null;
  const h = o && o.hatOff;
  if (!h || !h.rest) return false;              // somebody got there first
  const job = h.of;
  const joining = JOB_OF[w.type] !== job;
  // The counts can move while somebody walks; a claim is a plan and this is
  // the moment.
  if (joining && roomAt(job) < 1) return false;
  o.hatOff = null;
  w.trained = true;
  w.kitOf = job;
  // The body it came off has lost the job with it (`dispossessed`). Marked
  // rather than moved: the owner may still be seeing stars or in your hand.
  if (joining) { o.robbed = true; joinJob(w, job); }
  retask(w, w.type);                            // and away to the work in it
  return true;
}

// Robbed: it came round to find its hat on somebody else's head. Another on
// the stand and `retask` sends it over; otherwise the swap stands and the
// bare body goes carrying. One shake, one swap: the headcount does not move.
export function dispossessed(w) {
  const job = JOB_OF[w.type];
  if (w.trained || w.type === TYPE.HAUL || !S[job] || kitFree(job) > 0) {
    retask(w, w.type);
    return;
  }
  w.type = TYPE.HAUL;                 // the body and the count together, as ever
  S[job] -= 1;
  rebalance();                       // ...and carrying is whoever is left over
  syncWorkers();
  retask(w, TYPE.HAUL);
  S.dirty = true;
}

// The invariant, reasserted every pass: a station's kit ends up on somebody
// standing at that station or on its stand, and gets there on foot. `retask`
// walks kit back too, but its legs are abandoned by a rock, a mess or a hand.
// One errand at a time per station, so buying four helmets is four trips.
export function stepKit() {
  holdClaims();
  for (const job of KIT_JOBS) {
    if (S.workers.some(o => o.walking && o.fetching === job)) continue;   // one errand a station

    // Kit that has walked off the job it belongs to goes back to the stand,
    // checked before anything is handed out: a helmet on the wrong head is
    // not one the station can lend.
    const stray = S.workers.find(o => o.trained && o.kitOf === job &&
                                      JOB_OF[o.type] !== job && canRun(o));
    if (stray) { errand(stray, job, 'drop'); continue; }

    // A hat lying in the dirt goes to the nearest body entitled to it. If the
    // owner is nearest nothing is issued: its own recovery walk is already
    // that walk.
    const hat = looseHats(job)[0];
    if (hat) {
      const near = o => Math.abs(o.x - hat.hatOff.x);
      let best = null;
      for (const o of S.workers) {
        if (o === hat || !mayWear(o, job) || !canRun(o)) continue;
        if (!best || near(o) < near(best)) best = o;
      }
      if (best && !(ownerRacing(hat) && near(hat) <= near(best))) {
        grabErrand(best, hat);
        continue;
      }
    }

    // A hat lying spare and somebody bare-headed to come and get it.
    if (kitFree(job) > 0) {
      const w = bareAt(job);
      if (w) { errand(w, job, 'wear'); continue; }
    }
    // A head wearing kit the station no longer owns (a machine taking its kit,
    // an old save, a dev hook) is a helmet counted twice.
    if (worn(job) > hats(job)) {
      const w = hattedIn(job);
      if (w) errand(w, job, 'drop');
    }
  }
}
