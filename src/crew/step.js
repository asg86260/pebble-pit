// --- one body's frame ----------------------------------------------------------
// Everything that happens to a body between one frame and the next, in the order
// it happens.
//
// This was one `for` loop of six hundred lines with a dozen `continue`s in it,
// and the *order* of those was load-bearing and written down nowhere. Two of
// them have already cost a bug apiece, and both bugs read the same way -- the
// game quietly not doing a thing you had paid for:
//
//   **The tender used to sit below the stations.** That is harmless for the
//   quarrier and the farmhand, whose branches fall through to it, and it was
//   fatal for the rockhand, whose branch `continue`s on every path. The ram was
//   bought, it clamped the gang to one man, and then no rockhand ever walked to it
//   and it never took a single bite.
//
//   **The pit used to sit below the dodge.** The dodge puts a body back on the
//   ground line; the climb pushes it two pixels down a rung. The pair of them
//   took turns and held a hauler at the top of the ladder for ever.
//
// Neither is a bug in a branch. Both are bugs in where a branch was pasted, and
// nothing in the file could have told you so. So the order is a list now.
//
// A **stage** is one thing that can happen to any body, whatever it does for a
// living. It is handed the body and the frame, and it returns true when it has
// used the frame up -- nothing below it runs. A **job** is a row in
// crew/jobs.js: what it does when nothing above has claimed it, plus the handful
// of answers a stage needs from it. Adding a job is a row. Adding a shared
// concern is a stage, and you have to say out loud where in the list it goes.
//
// The list, and why each one sits where it does:
//
//   1. **lifted** -- in the air on the cursor. Not doing anything, and nothing
//      being done to it. First because a body you are holding is not in the yard.
//   2. **falling** -- let go of, and on its way down. Before everything, for the
//      same reason: gravity is not negotiating with the day's work.
//   3. **dizzy** -- shaken about, seeing stars. It rocks where it landed and does
//      nothing at all until they clear; it used to be handed its job back the
//      instant its feet touched, so the stars were decoration over somebody
//      already working.
//   4. **hat** -- its hat came off in the shaking, and it is not going back to
//      work bare-headed. Directly under `dizzy` because it is the tail of it.
//   5. **floating** -- drifting down out of the sky. Falls *through* on the frame
//      its feet land, so a wizard set down carries on with its day.
//   6. **celebrate** -- a rock is off and the whole yard is dancing. Above the
//      commute and everything under it, and that position IS the fix: while a
//      body is dancing, nothing else in this list may move it. The judder that
//      was reported after three rewrites was never in the moves -- it was the
//      duck, the elbow and a work stepper all pulling on one body on one frame,
//      each patched where it was found. Above the lot of them there is nothing
//      left to pull. Every job dances; no job has a row to forget.
//   7. **commute** -- on its way to a job it has been put on, and doing none of it
//      yet. Above everything below because a body walking somewhere is not yet
//      anywhere: the work, the mess and the loo are all things you do where you
//      have arrived.
//   8. **relieve** -- now and then a body has to stop, whatever it was doing.
//      Below the commute (you do not stop halfway across the yard) and above the
//      work (it is the one thing that interrupts work).
//   9. **tender** -- somebody minding a machine. **Above the stations, and this
//      is the first ordering bug quoted above.** A rockhand's branch ends in
//      `continue` on every path, so a tender check below it was never reached.
//  10. **shutIn** -- a body behind a closed door stays behind it. Everything
//      below this line is a reason to walk somewhere -- a mess, a hat, a rock
//      coming down -- and none of them should reach through a shut door. It is a
//      guard rather than a fix to whichever branch was reaching in, because the
//      thing that is true is about the lab and not about any one of them.
//  11. **mess** -- muck on the ground, and somebody whose job it is. Last of the
//      stages: clearing up beats the work, because the work is not going
//      anywhere and the mess is in everybody's way. Which mess is whose is the
//      job's own row -- see `mess` in crew/jobs.js.
//
// ...and then `work`, which is the job itself.
//
// The one exception is the hauler's mess, and it is marked `late` on the row
// rather than hidden inside the stage: a hauler's mess can be lying in the
// bottom of the hole, and the way down there is a route rather than a walk, so
// the trip has to be decided together with the rest of its errands. See
// `haulerWork`.

import { P, LUNGE_EASE, WOBBLE, WOBBLE_BEAT, WORKER,
         GROSS_MS, GROSS_COOLDOWN_MS } from '../config.js';
import { S, floor } from '../state.js';
import { colOf } from '../grid.js';
import { dropZone } from '../rock.js';
import { keepTo, stepRoute, wayOver, solidNear } from '../route.js';
import { TIDY_ELBOW } from '../tidy.js';
import { MUCK_ELBOW, colAt, poopCols, muckFloor } from '../smog.js';
import { commutePace } from '../upgrades.js';
import { TYPE } from '../jobs.js';
import { floatDown } from '../wizard.js';
import { stopJig, celebrate, MOVE_KEYS } from './dance.js';
import { stepTender } from './tenders.js';
import { outOfYard } from './records.js';
import { dispossessed, stepKit } from './kitwalk.js';
import { onYard, stand, surfaceUnder } from './body.js';
import { findPeak } from './rockhand.js';
import { claims } from './hauler.js';
import { fall, stepHat } from './falls.js';
import { retask, stepCommute } from './commute.js';
import { relieve } from './nature.js';
import { takeMess } from './shovel.js';
import { jobOf } from './jobs.js';

// The yard is celebrating: a rock has just come off, or the next one is on its
// way down.
const dancing = c => c.now < S.danceUntil || S.rockFall > 0;

// --- the stages -------------------------------------------------------------------
// The list from the top of this file, in order, as code. Each one is handed
// the body and the frame and answers true when it has used the frame up.
const STAGES = [
  // in the air, on the cursor: not doing anything, and nothing being done to it
  w => w.lifted === true,

  // let go of, and on its way down
  w => {
    // An unsupported body FALLS. The climber's ease is for feet following
    // ground that is there; when the ground is not -- the rock finished under
    // a gang standing on it, a column mined out, a stroll off a ledge -- the
    // ease drew a body gliding gently down through open air, which is the
    // reported "floating off the rock". More than a couple of cells of nothing
    // under the feet is not a climb, it is a drop, and gravity takes it. A
    // body on a ladder is the exception: a climb leg holds it over its way's
    // floor on purpose, rungs are what it is standing on.
    // The bar sits above every deliberate jump in the yard -- the dance's hop
    // is three cells, the swings and bobs less -- and a dancing body is let
    // alone entirely: its height IS the animation. What is left above five
    // cells of nothing is ground that genuinely is not there.
    // And only under the open sky. A body down a working stands on its way's
    // own floor, which `fall` knows nothing about -- its landing is the yard's
    // surface, so a quarrier tripped mid-dig was yanked UP through the wall
    // onto the bridge. The reported float is bodies over the yard and the
    // hill; the holes keep their ladders and their eases.
    // And not in its first moments. A fresh body is born at its station's own
    // height -- a rockhand at the heart of the rock -- and eases onto the surface
    // as it comes into the world; treating that settling-in as a fall dropped
    // newborns out of the sky with their velocities zeroed, and a warm-up's
    // worth of hat errands never happened.
    // ...and not a body scaling a face. `climbTo`'s wall rule holds a body at
    // the foot of anything steeper than a walk and leads it up by the feet, and
    // for the length of that climb the surface under it really is a long way
    // down -- that is what climbing a wall looks like. It was read as
    // unsupported, knocked off at five cells, landed, was re-tasked home by the
    // landing, and sent straight back by its errand: on any rock whose toe
    // stands taller than five cells -- every boulder past the mid game -- the
    // whole crew shuttled between their stations and the flank for ever, and
    // the mess on the hill was never cleared, every column of it claimed by a
    // body that could not get up to it. The stamp is this frame's or last's,
    // written by the one climber in the game, so a body genuinely dropped --
    // ground mined out from under it, a ledge walked off -- has no stamp and
    // falls exactly as it did.
    if (!w.falling && !w.lifted && !w.aloft && !w.floating && !w.inside &&
        w.jigAt == null && onYard(w) && (w.lived || 0) > 4000 &&
        !(w.route && w.route[0] && w.route[0].climb) &&
        S.tick - (w.scaleAt ?? -9) > 2 &&
        surfaceUnder(w) - w.y > P * 5) {
      w.falling = true;
      w.vy = 0;
      w.vx = 0;
    }
    if (!w.falling) return false; fall(w); return true; },

  // Seeing stars. A body shaken about does nothing at all until they clear --
  // it used to be handed its job back the instant its feet touched, so the
  // stars were decoration over somebody already working. It rocks where it
  // landed instead, and then goes and picks its hat up.
  (w, c) => {
    if (w.dizzyUntil && c.now < w.dizzyUntil) {
      w.x = w.landedAt + Math.sin(c.now / 1000 * WOBBLE_BEAT + w.ph) * WOBBLE;
      w.y = stand(w);
      return true;
    }
    if (!w.dizzyUntil) return false;
    w.dizzyUntil = 0;
    w.x = Math.round(w.landedAt);
    w.landedAt = null;
    // and if its hat came off, it is not going back to work bare-headed: the
    // stage below takes it from here on this very frame -- and that stage is
    // also where it finds out that somebody took the hat while it lay there.
    if (w.hatOff || w.robbed) return false;
    retask(w, w.type);
    return true;
  },

  // gone to pick a knocked-off hat back up -- once it has actually come down.
  // A body recovered before its hat has landed stands where it is for the
  // half-second the arc takes, rather than chasing a point still in the air.
  w => {
    if (!w.hatOff) {
      // Gone: somebody walked over and put it on while this one was seeing
      // stars. What that costs is `dispossessed`.
      if (!w.robbed) return false;
      w.robbed = false;
      dispossessed(w);
      return true;
    }
    if (!w.hatOff.rest) return true;
    const d = w.hatOff.x - w.x;
    if (Math.abs(d) > P) {
      // A route, not a bare walk. The body may have been shaken into the hole
      // and the hat may lie on the far ground -- a straight walk toward its x
      // pushes against the lip clamp or a wall forever, while a route goes up
      // the ladder like everything else in this yard goes anywhere.
      if (!keepTo(w, w.hatOff.x, wayOver(w.hatOff.x))) { w.hatOff.x = solidNear(w.x, 200) ?? w.x; return true; }
      if (stepRoute(w, commutePace())) return true;
      w.route = null;
      return true;
    }
    w.trained = true;
    w.kitOf = w.hatOff.of;
    w.hatOff = null;
    retask(w, w.type);
    return true;
  },

  // A body drifting down out of the sky, which is a body doing nothing else
  // until its feet are down -- see `floatDown`. It falls *through* on the frame
  // it lands, so the rest of its day happens as usual.
  w => w.floating === true && !floatDown(w),

  // wave7-crew: a cursor resting on a body holds it still, so the card over its
  // head is read off somebody standing rather than somebody walking away. Above
  // the commute -- the bodies you hover are mostly mid-walk, and a pause that
  // let the walk finish first would never be seen -- and held out of a dance,
  // whose feet are off the ground: a body frozen mid-hop would hang in the air.
  // Nothing is dropped and no claim is released; the body simply spends the
  // frame standing, and everything it was doing resumes when the cursor leaves.
  (w, c) => {
    if (!(w.pauseUntil > c.now) || dancing(c)) return false;
    w.say = { mark: '?', until: w.pauseUntil };
    return true;
  },

  // on its way to a job it has just been put on, and doing none of it yet
  (w, c) => { if (!w.walking) return false; stepCommute(w, c.zone); return true; },

  // and now and then a body has to stop, whatever it was doing
  (w, c) => relieve(w, c.now),

  // wave7-crew: grossed out. A body whose next step lands in somebody's
  // leavings stops short, says so, then steps around rather than through.
  // Directly after the loo stage: the mess exists because that stage ran, and a
  // body mid-squat must not be interrupted by its own results. The step around
  // is a local hop of two columns -- the duck's own scale of move -- rather
  // than a call into body.js, and the cooldown is per body so a crowd crossing
  // a fouled yard does not gridlock.
  (w, c) => {
    if (w.grossUntil) {
      if (c.now < w.grossUntil) { w.lunge = 0; return true; }
      // done gagging: around it, one clear column past the fouled one
      w.x += (w.face || 1) * P * 2;
      w.grossUntil = 0;
      w.say = null;
      return true;
    }
    // The crew that works the mess is not grossed out by it -- a janitor
    // gagging at the poop it came to shovel circled it forever and the pile
    // only grew; same for any body already on a shovel errand.
    if (w.type === TYPE.JANITOR || w.muckAt != null) return false;
    if (c.now < (w.grossOkAt || 0) || dancing(c)) return false;
    const dir = w.face || 1;
    const ahead = colAt(w.x + WORKER / 2 + dir * P);
    if (!(poopCols()[ahead] > 0)) return false;
    // only leavings at this body's own feet -- a patch on the rock's flank far
    // over a walker's head is not something it is about to step in
    if (Math.abs(muckFloor(ahead) - (w.y + WORKER)) > P * 3) return false;
    w.grossUntil = c.now + GROSS_MS;
    w.grossOkAt = c.now + GROSS_COOLDOWN_MS;
    w.say = { mark: 'yuck', until: w.grossUntil };
    return true;
  },

  // The rock is off and the whole yard is celebrating. Above the work, the
  // stations and the mess, so that nothing else in this list can move a dancing
  // body -- which is the whole of the fix, and the reason there is one row here
  // rather than a `held` on every job.
  //
  // Below the commute and the loo, which is where the old `held` sat and for
  // the reason worked out then: a body already on its way somewhere finishes
  // the walk. Above them it stopped bodies mid-errand -- a rockhand fetching its
  // helmet stood down to dance with the hat still on the stand -- and walking
  // and dancing at once is the collision this whole rewrite is against.
  //
  // A body that is not standing in the yard cannot dance in it, and this is the
  // whole of the exception: through a door, or up in the balloon. The ones in
  // your hand, falling, seeing stars or floating down are claimed by the stages
  // above and never reach this line.
  (w, c) => {
    if (!dancing(c)) {
      // The party is over: put the dance away once, here, and let the body have
      // the rest of its frame back. This is the only place a dance ends now.
      //
      // A DANCE, and not whatever else is using the same fields. The builders'
      // work jig is this machinery on a move of its own and keeps `jigAt` for
      // as long as the build lasts, so a blanket wipe here reset a hammering
      // body every frame it was not celebrating -- which is every frame -- and
      // no builder ever swung. The move says which animation this is; the job
      // does not, and a second work jig later would be caught by the same test.
      if (w.jigAt != null && MOVE_KEYS.includes(w.move)) { stopJig(w); w.say = null; }
      return false;
    }
    // ...and a body that belongs to a craft: aloft in it, or on its way to the
    // mooring to take it up. A balloon halfway through being crewed is the
    // errand case again -- the walk is finished first -- and a body already in
    // the basket is no more in the yard than one behind a door.
    if (outOfYard(w) || w.craft) return false;
    celebrate(w, c.now, c.zone);
    return true;
  },

  // Every station's tender, *before* the station's own work -- the rockhand's
  // included. See the first of the two ordering bugs at the top of this file.
  (w, c) => stepTender(w, c.now),

  // a body behind a shut door, and nothing outside reaches it
  (w, c) => {
    const job = jobOf(w);
    if (!job.shutIn?.(w)) return false;
    job.work(w, c);
    return true;
  },


  // Muck on the ground and somebody whose job it is -- and, when there is none,
  // the goal the job goes back to.
  (w, c) => {
    const mess = jobOf(w).mess;
    if (!mess || mess.late) return false;
    if (mess.when(w, c) && takeMess(w, c)) return true;
    mess.back(w);
    return false;
  }
];

export function updateWorkers(now, dt) {
  if (S.rockhands > 0) findPeak();
  const zone = dropZone();          // the ground nobody may be standing on
  const taken = claims();
  // And who is going for which patch of muck. Rebuilt each pass rather than kept
  // on the bodies: a shovelling body is not carrying a claim around the way a
  // fetching one is -- it walks to a mess, clears it, and looks again -- so the
  // only thing that has to be true is that two of them starting out on the same
  // frame do not start out for the same cell.
  const muckTaken = new Set();
  // ...and a second book, for the one mess only a janitor may touch.
  //
  // Poop and muck share a book because they share a layer of columns, and that
  // is right for muck: two bodies must not shovel the same patch. It is wrong
  // for poop. A hauler idling into the yard's ordinary muck reserves the four
  // columns either side of its patch, and if a body left something under that
  // reservation the janitor's own search -- which asks for poop FIRST, and only
  // falls back to the shared one when there is none to be had -- was told there
  // was none, by a body that could not have touched it in any case. With a yard
  // full of idle hands on the muck, the poop the player actually wants gone can
  // sit under somebody else's elbow for ever. B4 said poop is a janitor's
  // alone; this is the other half of saying so.
  const poopTaken = new Set();
// The columns already spoken for by bodies that are on their way to them --
  // WITH their elbows. `nearestMuck` reserves a body's width either side when a
  // claim is made, but this rebuild used to carry only the claimed column
  // itself forward, so the reservation lasted exactly one frame: from the next
  // frame on, a fresh body could claim the cell beside a held claim, and the
  // two of them shovelled the same patch standing in each other. A claim held
  // is a claim with its elbows out, every frame, or it is not a claim.
  for (const w of S.workers) {
    if (w.muckAt == null) continue;
    for (let k = w.muckAt - MUCK_ELBOW; k <= w.muckAt + MUCK_ELBOW; k++) {
      muckTaken.add(k);
      // Only a janitor's claim is an elbow on poop -- nobody else can be going
      // for any.
      if (w.type === TYPE.JANITOR) poopTaken.add(k);
    }
  }
  // And the same book, kept for the cut's own dust: one column of it, one
  // hauler on their way down the ladder for it.
  const cutTaken = new Set();
  for (const w of S.workers) if (w.cutClaim != null) cutTaken.add(w.cutClaim);
  // And the tidying claims, which are the same rule again on three more patches
  // of ground -- the floor of the cut, the strip the plots stand on, and the
  // surface of the hill. Held on the body between frames and rebuilt here WITH
  // their elbows, for the reason written over the muck book above: a claim
  // carried forward without its elbows is a reservation that lasts one frame.
  //
  // Two of the three join a book that already exists rather than opening one
  // beside it. The cut's floor is fetched from by haulers as well, so a
  // quarrier's claim goes in `cutTaken` and neither trade can pick a column the
  // other has; the farm's strip is floor, so a hand's claim goes in `taken`
  // beside the haulers' own. Only the rock has ground nobody else works.
  const rockTaken = new Set();
  const bookFor = w => w.type === TYPE.QUARRY ? cutTaken
                     : w.type === TYPE.FARM ? taken
                     : w.type === TYPE.ROCK ? rockTaken : null;
  for (const w of S.workers) {
    if (w.tidyAt == null) continue;
    const book = bookFor(w);
    if (!book) continue;
    for (let k = w.tidyAt - TIDY_ELBOW; k <= w.tidyAt + TIDY_ELBOW; k++) book.add(k);
  }
  // ...and the ground nobody may be *fetching from*, which is not the same rule
  // and used to be missing. A hauler ducks out of the way and then walks
  // straight back in, because what pulled it there was a column of dust it had
  // claimed and the duck does not know about claims: out, in, out, in, until
  // the rock lands on it. So the columns under a coming rock are spoken for as
  // far as everybody is concerned, and the dust there is fetched afterwards.
  if (zone) {
    const from = Math.max(0, colOf(floor, zone.from));
    const to = Math.min(floor.cols - 1, colOf(floor, zone.to));
    for (let col = from; col <= to; col++) taken.add(col);
    for (const w of S.workers) {
      if (w.type === TYPE.HAUL && w.claim >= from && w.claim <= to) w.claim = -1;
    }
  }
  if (!S.coreItem || S.heldCore || !S.coreItem.rest) S.coreTaker = null;
  stepKit();                        // and anybody with kit to go and fetch or put back

  // Where everybody was standing when the frame began, so that where they are
  // standing when it ends can say which way they are facing. See `faceTravel`.
  const was = new Map();
  for (const w of S.workers) was.set(w, w.x);

  // Knocked-off hats keep falling whatever their owners are doing -- a hat in
  // the air does not wait for the body that lost it to be put down, and the
  // owner may well still be in your hand while it comes down.
  for (const w of S.workers) stepHat(w);

  // The frame, as one thing to hand about: the clock, its length, the ground a
  // rock is coming down on, and the books of claims that keep the crew from all
  // setting off for the same cell -- the yard's floor, the mess, the cut's own
  // floor and the surface of the hill.
  const c = { now, dt, zone, taken, muckTaken, poopTaken, cutTaken, rockTaken };
  for (const w of S.workers) {
    // A swing settles, wherever the body spends this frame. Whoever swings sets
    // the lunge to 1 and nobody eases it themselves -- see `LUNGE_EASE`, and the
    // janitor that used to be dragged from one patch of muck to the next at full
    // lunge by the branches that forgot.
    if (w.lunge) w.lunge *= LUNGE_EASE;
    let done = false;
    for (const stage of STAGES) if (stage(w, c) === true) { done = true; break; }
    if (!done) jobOf(w).work(w, c);
  }

  faceTravel(was);
}

// Which way everybody is facing, worked out once and from the one thing that can
// answer it: where a body was when the frame began, and where it is now.
//
// Facing used to be two fields -- `w.dir` and `w.face` -- assigned in eight
// places between them, always on the way *into* a walk and always from the sign
// of a distance that had not been travelled yet. Between them they were drawn in
// exactly one spot, the side a cart trails on, and one of the eight writers set
// a field that nothing at all read: the dance's `spin` turned a body over twice
// a second and the screen did not change a pixel, because `drawBody` is a
// symmetric square that takes no facing. Unrenderable state is how that
// happened, and eight writers is how it went unnoticed.
//
// So there is one field, and nobody who is about to move sets it. It is
// *measured*, here, after everything that could have moved a body has had its
// go -- a commute, a route, a shovel, a stroll, a dance, a duck, a climb, a
// nudge at somebody's elbow -- and it comes out right for every one of them
// without a single one of them mentioning it. A body that did not move keeps the
// way it was facing, which is what standing still looks like.
const FACE_STILL = 0.01;             // under this it did not go anywhere
function faceTravel(was) {
  for (const [w, x0] of was) {
    const d = w.x - x0;
    if (Math.abs(d) > FACE_STILL) w.face = Math.sign(d);
  }
}
