// The kit economy: who wants a hat, who may claim one lying spare, and the
// book-keeping that stops two bodies grabbing the same one. Extracted verbatim
// from crew.js; behavior unchanged. Owns canRun/bareAt/hattedIn/claimed/kitFree,
// the claim helpers (mayWear, looseHats, ownerRacing, holdClaims, grabErrand,
// joinJob, grabHat, dispossessed) and stepKit. It leans on four spine helpers
// (errand, nextLeg, retask, stationX), imported from crew.js; the spine calls
// grabHat (from arrive), kitFree, dispossessed and stepKit (a STAGE) back. The
// walk itself -- nextLeg, arrive -- stays in the spine.

import { KIT_JOBS, TYPE_OF } from '../kit.js';
import { S } from '../state.js';
import { JOB_OF, hats, rebalance, roomAt, spareKit, worn } from '../upgrades.js';
import { errand, nextLeg, retask, stationX, syncWorkers } from '../crew.js';
import { JOB, TYPE } from '../jobs.js';

// A body already at work whose station has a hat lying spare, and which is free
// to go and get it: hands empty, not walking anywhere, not indoors. One at a
// time per station, so buying four helmets is four trips rather than the whole
// gang filing down the hill at once.
// The wizards are in here too, and theirs is the one hat the job cannot be done
// without: a body sent to the sky with nothing on its head walks to the tower,
// picks up what the tower has made, and only then goes up. Everywhere else the
// hat is a doubling; here it is the whole trade.
//
// Read off the kit table rather than written out again: a job is on this list if
// it has kit at all -- somewhere its hats come from -- and every row does. The
// janitor is on it now. Its cap used to appear on its head the moment it was put
// on the job, which made it the one hat in the yard that belonged to nobody; the
// outhouse keeps the caps on a stand outside the door, and a body sent to sweep
// walks over and picks one up like everybody else. See kit.js.

// somebody on that job who could go on an errand right now: hands empty, not
// already walking, and not indoors
// ...and not one that is off the ground. A wizard aloft is the one body here a
// walk cannot be handed to: `stepCommute` puts a body on the ground line for the
// length of the walk, which for that one is a four-hundred-pixel drop mid-frame.
// It comes down on its own when it has nothing to do -- see wizard.js -- and
// that is when it can be sent for a hat.
const canRun = o => !o.walking && !o.inside && !o.aloft && !o.carry && !o.hasCore;

// Somebody on that job standing bare-headed, who could go and get one.
const bareAt = job => S.workers.find(o => JOB_OF[o.type] === job && !o.trained && canRun(o));

// Somebody wearing that station's kit, whoever it is and whatever it is doing
// now. Asked by `kitOf` and not by job, because the whole point of the two
// questions below is bodies whose job and whose hat have come apart.
const hattedIn = job => S.workers.find(o => o.trained && o.kitOf === job && canRun(o));

// Kit already spoken for by somebody on their way to it. Without this, two
// bodies put on the rock in the same breath both set off for the last helmet
// and one of them arrives at an empty stand.
const claimed = job => S.workers.filter(o => o.wanting === job).length;
export const kitFree = job => spareKit(job) - claimed(job);

// --- a hat on the ground is anybody's ------------------------------------------
// A knocked-off hat used to belong to the head it came off: it lay where it fell
// until its owner had finished seeing stars and walked back for it, and nobody
// else in the yard so much as looked at it. But a hat belongs to the STATION and
// not to the head under it -- that sentence is what the whole kit is built on --
// and a helmet lying in the dirt is the plainest case of it there is. So it is
// anybody's who is entitled to wear one, and the nearest of them gets it.
//
// Who is entitled:
//   * somebody already on that job, bare-headed. Its own station's kit, on the
//     ground, in front of it.
//   * any BARE hauler. Carrying is what a body does when it is on nothing, so
//     there is nothing to put down first and nothing to walk home: picking the
//     hat up is the whole of the move -- and the job comes with it, because the
//     hat IS the job.
//
// A carter with its cart still on is deliberately NOT on that list. Its cart is
// the lip's kit and no head wears two stations' hats, so it would have to hand
// the cart in first -- and it already can: put it on another job and `stepKit`'s
// stray rule walks it to the stand, and it is bare-handed and eligible on the
// way back. One rule, and no cross-kit special case anywhere.
const bareHauler = o => o.type === TYPE.HAUL && !o.trained;

// Could this body wear that hat if it were standing over it? Somebody on the job
// needs nothing but a bare head. Anybody else needs somewhere to stand at the
// station, because putting the hat on is joining it.
//
// Entitlement only. Whether it is free to set off is `canRun`, and the two are
// deliberately separate questions: `canRun` is false for a body that is walking,
// which is every claimant from the moment it sets off -- ask them together and a
// claim is cancelled by the walk it started.
const mayWear = (o, job) => !o.trained &&
  (JOB_OF[o.type] === job || (bareHauler(o) && roomAt(job) >= 1));

// The station's hats lying loose and at rest. In flight they are nobody's: a hat
// still in the air has not landed anywhere anybody could walk to, and its owner
// is the only body that waits about for it.
const looseHats = job => S.workers.filter(o => o.hatOff && o.hatOff.rest && o.hatOff.of === job);

// The owner is a racer too -- but it joins the race when its stars clear, not
// before. That is the whole of what makes the hat up for grabs: it is lying
// there because somebody turned its owner upside down, and the owner spends the
// next second and a half rocking where it landed.
const ownerRacing = o => !o.dizzyUntil && !o.dizzyFor && !o.lifted && !o.falling && !o.inside;

// A claim is held every frame or it is not a claim. `claimHat` is the body whose
// hat this one is walking for -- a claim on the thing, not on the station -- and
// this drops it the instant the thing is not there to be claimed: the owner got
// to it first, somebody else did, the walk was abandoned for a rock coming down,
// or the claimant put something else on on the way. A body that loses its claim
// stops walking for it and goes back to what it was doing.
//
// It also re-states `fetching`, which is what `stepKit` reads to keep a station
// to one errand at a time: a claimant is that station's errand while it walks.
function holdClaims() {
  for (const w of S.workers) {
    const o = w.claimHat;
    if (!o) continue;
    const h = o.hatOff;
    if (h && h.rest && w.leg === 'grab' && w.walking && mayWear(w, h.of) &&
        S.workers.includes(o)) { w.fetching = h.of; continue; }
    w.claimHat = null;
    retask(w, w.type);
  }
}

// Off to pick up somebody else's hat. The same shape as `errand`: a leg to the
// thing and a leg back to the work, and `fetching` set so the station does not
// send a second body after the same hat.
function grabErrand(w, owner) {
  w.claimHat = owner;
  w.fetching = owner.hatOff.of;
  w.legs = [{ to: owner.hatOff.x, do: 'grab' },
            { to: stationX(w.type) ?? w.x, do: 'back' }];
  nextLeg(w);
}

// Put a body on the job whose kit it has just picked up off the ground.
//
// The body's `type` and the station's count move on the same line, and that is
// the whole of the care this needs: `syncWorkers` REBUILDS the crew from the
// counts, so a type changed without the count is a body stood straight back
// down, and a count changed without the type stands somebody ELSE down instead.
// Changed together, the rebuild finds everybody where it wants them and does
// nothing at all. `rebalance` takes the body off the carriers afterwards,
// because carrying is whoever is left over.
function joinJob(w, job) {
  const type = TYPE_OF[job];
  // Carrying is not a station you can join by putting something on -- it is what
  // is left when you are on nothing -- and nothing reaches here asking to: a
  // loose cart is only ever claimable by a hauler, who is on that job already.
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
  // The counts can move while somebody walks. If the station has no room left by
  // the time it arrives, it does not join: the hat stays lying where it is, for
  // its owner or for the next body along, and this one walks back to carrying
  // with nothing on its head. Asked here as well as at the claim because a claim
  // is a plan and this is the moment.
  if (joining && roomAt(job) < 1) return false;
  o.hatOff = null;
  w.trained = true;
  w.kitOf = job;
  // The body it came off has lost the job with it -- see `dispossessed`. Marked
  // rather than moved, because the owner may still be seeing stars, or still in
  // your hand, and a body is not retasked out from under either of those.
  if (joining) { o.robbed = true; joinJob(w, job); }
  retask(w, w.type);                            // and away to the work in it
  return true;
}

// Robbed: it came round to find its hat on somebody else's head.
//
// If the station has another one on the stand, nothing has been lost but the
// walk, and the ordinary books send it over for that -- which is `retask`: to
// the stand if there is anything on it, and to the work if there is not.
//
// If there is nothing for it, the swap stands. Somebody who was carrying is at
// this station now, wearing this station's hat, so the station has a pair of
// hands more than it had and the yard a carrier fewer -- and the body with
// nothing on its head is the one that moves. It goes carrying. One shake, one
// swap: the headcount does not move, and the hat took the job with it both ways.
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

// Three ways a hat can be somewhere it should not be, checked every pass.
//
// `retask` already walks a body's kit back to its stand when it is moved off a
// job, and that is still the tidy path -- but it is a list of legs, and a list of
// legs is abandoned the moment a rock falls, a mess lands, or somebody picks the
// body up and shakes it. So the leaving rule cannot only live there. It lives
// here as well, as an invariant this reasserts: whatever happened to the walk, a
// station's kit ends up either on somebody standing at that station or on its
// stand, and it gets there on foot.
//
// One errand at a time per station, so buying four helmets is four trips rather
// than the whole gang filing down the hill at once.
export function stepKit() {
  holdClaims();
  for (const job of KIT_JOBS) {
    if (S.workers.some(o => o.walking && o.fetching === job)) continue;   // one errand a station

    // Kit that has walked off the job it belongs to. A body moved from the rock
    // to carrying is still in the rock's helmet, and it takes it off the way it
    // put it on: it walks to the stand and puts it down. This is what "the kit
    // stays where the work is" means when the walk is watched rather than
    // assumed, and it is checked before anything is handed out -- a helmet on
    // the wrong head is not a helmet the rock can lend to anybody else.
    const stray = S.workers.find(o => o.trained && o.kitOf === job &&
                                      JOB_OF[o.type] !== job && canRun(o));
    if (stray) { errand(stray, job, 'drop'); continue; }

    // A hat of this station's lying in the dirt, and the nearest body entitled
    // to it goes and gets it. The owner is in that race on the same terms as
    // everybody else once its stars have cleared -- and if the owner is the
    // nearest, nothing is issued here at all: its own recovery walk (see the
    // stages) is already that walk, and a second one is the same hat fetched
    // twice by two bodies.
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
    // Or the other way about: a head wearing kit the station does not own any
    // more. That cannot happen by playing -- hats are never sold -- but a
    // machine taking a station's kit does it, and so does a save from another
    // shape of the game or a dev hook. A body walking about in a helmet nobody
    // paid for is a helmet counted twice.
    if (worn(job) > hats(job)) {
      const w = hattedIn(job);
      if (w) errand(w, job, 'drop');
    }
  }
}
