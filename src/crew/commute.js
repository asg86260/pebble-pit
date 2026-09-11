// Getting somewhere, and arriving. A body put on a job walks to it, picking its
// kit up on the way, and does none of the job until it is standing where the job
// is.

import { WORKER } from '../config.js';
import { S } from '../state.js';
import { kitX } from '../world.js';
import { keepTo, stepRoute, wayOver } from '../route.js';
import { JOB_OF, JOBS as ROSTER_JOBS } from '../upgrades.js';
import { commutePace } from '../upgrades.js';
import { TYPE } from '../jobs.js';
import { JOB_MACHINE, machine, specOf } from '../machines.js';
import { postOf } from './tenders.js';
// kitwalk.js borrows four names back off this file; the cycle is fine because
// neither side reads the other while the modules are being evaluated.
import { grabHat, kitFree } from './kitwalk.js';
import { spareKit } from '../upgrades.js';
import { bailOut } from '../balloon.js';
import { quarryFace } from '../quarry.js';
import { plotX } from '../farm.js';
import { scrubDoor } from '../scrubhouse.js';
import { schoolDoor } from './teacher.js';
import { apothecaryDoor } from '../apothecary.js';
import { underMeteor } from '../wizard.js';
import { outhouse } from '../state.js';
import { duck, stand, onYard } from './body.js';
import { FACTORY } from './jobs.js';

// Where each job is done, for a body on its way to it. Carrying has no station:
// the dust is wherever it fell, so somebody put on it is already at work.
export function stationX(type) {
  const base = handStationX(type);
  if (base === null) return null;              // carrying: already at work anywhere
  // A station with a machine standing on it is worked *from the machine*, not
  // from the ground the hands used to work. Without this a body put on the rock
  // walks to the middle of the hill, climbs it, and is then walked straight back
  // down to the ram it was always going to end up on -- which is the same three
  // trips to do one thing that `retask` goes out of its way to avoid for the kit
  // stand, and is just as plainly wrong to watch.
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
function handStationX(type) {
  if (type === TYPE.ROCK) return S.cx - WORKER / 2;
  if (type === TYPE.QUARRY) return quarryFace();
  if (type === TYPE.FARM) return plotX(0);
  if (type === TYPE.PURIFY) return scrubDoor() - WORKER / 2;
  if (type === TYPE.TEACH) return schoolDoor() - WORKER / 2;
  if (type === TYPE.STIR) return apothecaryDoor() - WORKER / 2;
  if (type === TYPE.JANITOR) return outhouse.x + outhouse.w / 2 - WORKER / 2;
  // A wizard's station is the ground under the meteor. The work is four hundred
  // pixels above that, but the walk is to here: the going up is the job, not the
  // commute.
  if (type === TYPE.WIZARD) return underMeteor();
  // A builder has no station to be walked to: it picks a site of its own and
  // walks itself there, see `stepBuilder`.
  if (type === TYPE.BUILD) return null;
  return null;
}

// Give a body its new job's own fields -- exactly the ones that job's factory
// hands out -- so from here on nothing can tell it from one made on the spot.
// Where it is standing is the one thing it keeps: it walked here. And what is on
// its head, which is a thing it is carrying rather than a field of the job.
export function settle(w) {
  const hat = w.trained, of = w.kitOf;
  // and whatever is in its hands. A body that walked here holding something is
  // still holding it -- the only place a load is meant to leave a body is the
  // hole, or the ground at its feet when the job itself is taken away.
  const carry = w.carry || 0, load = w.load || [], core = !!w.hasCore;
  const fresh = FACTORY(w.type);
  delete fresh.x;                  // where it is standing is where it walked to
  delete fresh.y;
  Object.assign(w, fresh);
  // and if it has landed on a job of its own, it is nobody's loan any more: the
  // debt was "this body owes its way back to the rock", and a body standing at a
  // station on the roster is not owed to anywhere.
  //
  // Only for a job on the roster. A borrowed body's very next stop is the build
  // it was borrowed FOR -- a builder, and then a hauler when the build lands --
  // and clearing the debt there would clear every debt in the yard about a
  // frame after it was taken on, which is how `S.lent` came to be the only
  // record of it. See KEEPS above.
  if (ROSTER_JOBS.includes(JOB_OF[w.type])) delete w.lentFrom;
  w.trained = hat;
  w.kitOf = of;
  w.carry = carry;
  w.load = load;
  w.hasCore = core;
  // And it is not part way through anything any more.
  //
  // `Object.assign` writes the new job's fields over the old ones and cannot
  // touch a field the new job's factory has never heard of -- so every scrap of
  // a half-finished errand belonging to the *old* job rides along, invisibly,
  // for the rest of that body's life. Three of them were cleared here already
  // (the legs of a walk); the rest were not, and one of them was live.
  //
  // A hauler part way down the hole used to carry `inPit`, and `inPit` was the
  // flag the hauler's own branch read *before* everything else to decide it was
  // standing on the pile rather than on the yard. Put that body on the plots and
  // it walked about the yard for as long as you liked with the flag still set,
  // and nothing showed. Put it back on carrying, and the first line of the
  // hauler dropped it on to a pile eight hundred pixels away: three hundred
  // pixels straight down into solid ground, outside the hole entirely. Nobody
  // would have found that by looking -- the two halves of it are minutes apart
  // -- and verify.js reported it on the frame, with the seed, the first time the
  // invariants were run.
  //
  // That particular field is gone (the hole is walked by route now, and which
  // side of it a body is on is a thing you can see by looking at the body), but
  // the half-finished walk it belonged to is not, and neither is the reason.
  //
  // So the whole of the journey goes, not the walk alone: where it was headed,
  // which way it was on, which patch it had spoken for, and how far its feet had
  // eased up the slope it was climbing.
  w.legs = null;
  w.walkTo = null;
  w.walking = false;
  w.route = null;
  w.routeTo = null;
  w.routeWay = null;
  w.muckAt = null;
  // ...and the shed claim, which belongs to the job it was claimed on. A body
  // retasked mid-upgrade lets go of it; the next frame's `stepShedwork` hands
  // it to another of the gang, or the bar stalls -- honestly -- until one is.
  w.onBuild = null;
  w.atShed = false;
  w.cutClaim = null;
  w.tidyAt = null;
  w.foot = null;
  w.footAt = null;
}

// --- the kit walk -------------------------------------------------------------
// A hat is a thing lying on the ground until somebody goes and gets it. Nothing
// about it is instant: a body put on the rock walks over to where the helmets
// are, picks one up, and only then climbs the hill in it -- and a body taken off
// the rock walks back and puts it down before it goes anywhere else, because a
// carter who wandered off with the cart is a cart the lip has lost.
//
// So a commute is a list of legs rather than one destination. Each leg is
// somewhere to stand and one thing to do when you get there, and the last of
// them is always the work itself.
export function nextLeg(w) {
  const leg = w.legs && w.legs.shift();
  if (!leg) { settle(w); return; }
  w.leg = leg.do;
  w.walkTo = leg.to;
  w.walking = true;
  w.route = null;                  // somewhere new to get to, so a new way there
}

function arrive(w) {
  // put down where it was found, or picked up the same way -- and `kitOf`
  // travels with it, because what a body is wearing is a fact about the kit and
  // not about the job it happens to be on this second
  if (w.leg === 'drop') { w.trained = false; w.kitOf = null; }
  // Off the shelf outside the school and into its hands, and on to the stand
  // at the other end -- the hat is counted on the stand from the moment it is
  // put down there (`spareKit`), and not before. If the shelf is bare by the
  // time it arrives -- the school's count set back -- it carries nothing.
  if (w.leg === 'take') {
    const job = w.fetching;
    if (job && S.hatShelf && S.hatShelf[job] > 0) { S.hatShelf[job]--; w.shelfHat = job; }
    else { w.legs = w.legs ? w.legs.filter(l => l.do !== 'put') : null; }
  }
  if (w.leg === 'put') { w.shelfHat = null; w.fetching = null; }
  // ...and only if there is still one lying there to pick up. A walk to a stand
  // is a walk, and the yard can change while it is being made: the station's
  // count can go to nought behind a body already half way there -- a machine
  // spending the hats, the school's number set back -- and this line used to put
  // one on its head anyway. A helmet out of nothing, worn for the two seconds it
  // took `stepKit` to notice and send the body back with it. Nobody would ever
  // have seen it; verify.js saw it on the frame, twice, in two unrelated groups.
  // `spareKit` is what is on the stand right now, which is the same question the
  // errand asked before it set off.
  if (w.leg === 'wear') {
    if (spareKit(w.wanting) > 0) { w.trained = true; w.kitOf = w.wanting; }
    w.wanting = null;
  }
  // Somebody has walked to a hat lying on the ground that is not its own, and is
  // standing over it. Picking it up sends the body straight back to work through
  // `retask` -- in its new job, if the hat came with one -- so there is no leg
  // left to walk and this returns rather than falling through to one.
  if (w.leg === 'grab' && grabHat(w)) { S.dirty = true; return; }
  // Somebody has walked to a lever and is standing at it. This is the only place
  // in the game a machine starts or stops, which is the point of the walk.
  S.dirty = true;
  if (w.legs && w.legs.length) { nextLeg(w); return; }
  if (w.leg === 'back') { w.leg = null; w.legs = null; w.walkTo = null; w.walking = false;
                          w.route = null; return; }
  settle(w);
}

// The kit, then straight back to the work -- and 'back' rather than 'work',
// because it never left the job and re-settling it would drop what it was doing.
export function errand(w, job, what) {
  w.fetching = job;
  if (what === 'wear') w.wanting = job;
  w.legs = [{ to: kitX(job), do: what }, { to: stationX(w.type) ?? w.x, do: 'back' }];
  nextLeg(w);
}

// Put a body that has just been stood down onto a job that is short of one,
// where it stands. Its `type` changes at once rather than on arrival: `want`,
// `pickPlot`, `elbowed` and `seatX` all filter on type, and somebody walking to a
// job is on that job as far as the books are concerned. What it does not do is
// any of the work, until it gets there.
export function retask(w, type) {
  // Off the errand, off its claim. A re-tasked body is commuting, and a commute
  // owns it until it arrives -- a muck column it was walking to stays barred to
  // the whole crew for as long as the claim rides along. Claims are cheap and
  // re-picked in a frame; a held one with nobody coming is the deadlock every
  // stuck-yard report in TODO.md ends at.
  w.muckAt = null;
  if (w.goal === 'muck') w.goal = null;
  // Off the sky and down. A wizard is the one body here that can be stood down
  // while it is four hundred pixels up, and whatever it is put on next reads its
  // height as the ground it is standing on -- so it has to come down before it
  // does anything else.
  //
  // It floats rather than falls. Gravity put it on the ground in a quarter of a
  // second, which for a body that took the best part of a minute to go up reads
  // as the hat being switched off. It comes down the way it went up.
  if (w.aloft && type !== TYPE.WIZARD) w.floating = true;
  // ...and a body taken out of a balloon goes over the side under an umbrella. It
  // is already floating by the line above; this is what says there is one
  // up over it, and it lets go of the craft so the craft can leave.
  bailOut(w);
  w.type = type;
  w.fetching = null;
  w.wanting = null;
  w.claimHat = null;               // and it is not walking for anybody's hat
  // Out of the house. A body that had knocked off is stood indoors and is not
  // drawn -- that is what `inside` is for -- and nothing else in the game clears
  // it, because nothing else in the game takes somebody off carrying. Put one on
  // the quarry straight from the house and it went down the quarry, worked the
  // face, brought shards up and was invisible the whole time.
  w.inside = false;
  const job = JOB_OF[type];
  const legs = [];
  // The hat goes back where it came from first, and it is put down before the
  // body is anywhere near its new job. `kitOf` rather than the old job: those
  // are the same thing every time except when a body is retasked twice in a row
  // and is still holding the first station's kit.
  //
  // Unless the new job IS the hat's own station. A body picked up and put down
  // is retasked onto the job it was already on, and it used to walk to the
  // stand, lay its own kit down, walk to work bare, and be sent straight back
  // for the very hat it had put there -- three trips to end up exactly as it
  // began. Kit that is already right stays on the head it is on.
  if (w.trained && w.kitOf !== job && kitX(w.kitOf) !== null)
    legs.push({ to: kitX(w.kitOf), do: 'drop' });
  // Then the new station's stand, if there is anything on it -- *before* the
  // work, not after. Walking to the middle of the rock, then back down to the
  // stand, then up the hill again is three trips to do one thing, and it is the
  // one bit of this anybody watching would call wrong.
  if (!w.trained && kitX(job) !== null && kitFree(job) > 0) {
    w.wanting = job;
    legs.push({ to: kitX(job), do: 'wear' });
  }
  const to = stationX(type);
  if (to !== null) legs.push({ to, do: 'work' });
  // No legs means nothing to walk for -- it does NOT mean the kit comes off.
  // This line used to strip `trained`/`kitOf` outright, and the one job with no
  // station to walk to is the hauler: a carter retasked in place (picked up and
  // put down, recovered from a shaking) had its cart confiscated by the books
  // on the very frame it got it back, and then went and fetched a phantom from
  // the stand. Kit that belongs to a different station than the new job already
  // got its drop leg above; kit that belongs to THIS job stays on.
  if (!legs.length) {
    if (w.trained && w.kitOf !== job) { w.trained = false; w.kitOf = null; }
    settle(w);
    return;
  }
  w.legs = legs;
  nextLeg(w);
}

// One frame of a body walking to where it has been sent.
//
// The whole of the going is route.js's now, and what is left here is what this
// function was always actually about: a body may not walk under a falling rock,
// and when it gets there it starts work.
//
// What went is three quarters of it, and all of it was the quarry. There was a
// block that walked a body below the ground line along the floor of the cut to
// the foot of the ladder, and a second block that held it still while it climbed
// -- both written out here, both written out again in `stepQuarrier`, and
// neither of them known to any of the other dozen places that move a body. The
// ladder is a link between two ways now (see route.js), and the reason a body
// leaves the cut by it is that there is no other edge out: the shortest path
// from the floor of a hole to anywhere on the yard goes up the ladder because
// every path does.
export function stepCommute(w, zone) {
  // The route is worked out once, when the walk starts, and then walked. It is
  // re-asked if the ground has changed under it -- the quarry is filled in and
  // re-dug while people are walking about on it -- which is what `sendTo`
  // returning false means: there is no longer a way from here to there.
  //
  // And what it is walking *to* is a place, so it is on a way of its own. A
  // stand on the hill's footprint is on the hill, so the route climbs a flank
  // and walks the crest to it; a place out on the yard is on the yard, so the
  // route runs along the floor in front of the hill, which is flat and shorter
  // and therefore what the search picks. That is the whole of who goes over the
  // rock and who goes past it, and neither half of it is a job title.
  if (!keepTo(w, w.walkTo, wayOver(w.walkTo))) { arrive(w); return; }

  // A rock coming down stops a walk, but only a walk that is on the open yard: a
  // body on a rung is not standing anywhere a rock can land, and holding it
  // against the ladder for the length of a fall is how it used to be pushed off
  // one.
  if (onYard(w) && duck(w, zone)) { w.y = stand(w); return; }

  if (stepRoute(w, commutePace())) return;
  w.route = null;
  arrive(w);
}
