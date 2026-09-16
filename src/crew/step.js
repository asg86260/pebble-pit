// --- one body's frame ----------------------------------------------------------
// Everything that happens to a body between one frame and the next, in the
// order it happens. The order is load-bearing: a **stage** is one thing that
// can happen to any body, handed the body and the frame, and returning true
// when it has used the frame up so nothing below it runs. A **job** is a row
// in crew/jobs.js. Adding a shared concern is a stage, and you have to say out
// loud where in the list it goes.
//
// The list, and why each one sits where it does:
//
//   1. **lifted** -- on the cursor. A body you are holding is not in the yard.
//   2. **falling** -- gravity is not negotiating with the day's work.
//   3. **dizzy** -- rocks where it landed and does nothing until the stars
//      clear.
//   4. **hat** -- the tail of dizzy: it goes and gets its hat before it works.
//   5. **floating** -- falls *through* on the frame its feet land.
//   6. **commute** -- a body walking somewhere is not yet anywhere: the work,
//      the mess and the loo are all things you do where you have arrived.
//   7. **relieve** -- below the commute (you do not stop halfway across the
//      yard), above the work (it is the one thing that interrupts work).
//   8. **celebrate** -- above the work, the stations and the mess: while a body
//      is dancing nothing else in this list may move it, and that position IS
//      the fix for the judder (the duck, the elbow and a work stepper pulling
//      on one body on one frame). Below the commute, so a body already on its
//      way finishes the walk.
//   9. **tender** -- above the stations: a rockhand's work claims every frame,
//      so a tender check below it is never reached and the ram never bites.
//  10. **shutIn** -- everything below this line is a reason to walk somewhere,
//      and none of them reaches through a shut door.
//  11. **mess** -- last of the stages: the work is not going anywhere and the
//      mess is in everybody's way. Which mess is whose is the job's row.
//
// ...and then `work`, which is the job itself. The hauler's mess is marked
// `late` on the row: it can lie in the bottom of the hole, and the way down is
// a route decided with the rest of its errands (`haulerWork`).

import { P, LUNGE_EASE, WOBBLE, WOBBLE_BEAT, WORKER,
         GROSS_MS, GROSS_COOLDOWN_MS } from '../config.js';
import { S, floor } from '../state.js';
import { colOf } from '../grid.js';
import { dropZone } from '../rock.js';
import { keepTo, stepRoute, wayOver, solidNear } from '../route.js';
import { TIDY_ELBOW } from '../tidy.js';
import { MUCK_ELBOW, colAt, poopCols, muckFloor } from '../smog.js';
import { commutePace } from '../levels.js';
import { TYPE } from '../jobs.js';
import { floatDown } from '../wizard.js';
import { stopJig, celebrate, MOVE_KEYS } from './dance.js';
import { stepDig } from '../intro.js';
import { stepTender } from './tenders.js';
import { outOfYard } from './records.js';
import { dispossessed, stepKit } from './kitwalk.js';
import { onYard, stand, surfaceUnder, duck, sideOf } from './body.js';
import { findPeak } from './rockhand.js';
import { claims } from './hauler.js';
import { fall, stepHat } from './falls.js';
import { retask, stepCommute } from './commute.js';
import { relieve } from './nature.js';
import { takeMess } from './shovel.js';
import { jobOf } from './jobs.js';
import { sfx } from '../audio.js';

// The yard is celebrating, and the dance ends at the clock and nowhere else.
// A fall is never a party: read as a dance by `danceUntil > 0`, a stale
// deadline danced every fall after a shield stood, and a body dancing under
// a rock the dome held was jigged up onto its top.
const dancing = c => c.now < S.danceUntil;

// --- the stages -------------------------------------------------------------------
const STAGES = [
  // in the air, on the cursor: not doing anything, and nothing being done to it
  w => w.lifted === true,

  // let go of, and on its way down
  w => {
    // An unsupported body FALLS: the climber's ease is for feet following
    // ground that is there, and over ground that is not it draws a body
    // gliding down through open air. The bar, four cells, sits above every
    // deliberate jump (the dance's hop is three) and under the machines' seats.
    // Exceptions, each a body that is genuinely supported by something the
    // surface reading does not see: on a ladder (a climb leg holds it over the
    // floor on purpose); down a working (`fall` lands on the yard's surface
    // and would yank a quarrier UP through the wall); dancing (its height IS
    // the animation); scaling a face (`climbTo`'s wall rule leads it up by
    // the feet, and the surface under it really is a long way down, so
    // `scaleAt` is stamped by the one climber in the game); in a machine's
    // seat (`aboardAt`). A body genuinely dropped has no stamp.
    if (!w.falling && !w.lifted && !w.aloft && !w.floating && !w.inside &&
        w.jigAt == null && onYard(w) &&
        !(w.route && w.route[0] && w.route[0].climb) &&
        S.tick - (w.scaleAt ?? -9) > 2 &&
        S.tick - (w.aboardAt ?? -9) > 1 &&
        surfaceUnder(w) - w.y > P * 4) {
      w.falling = true;
      w.vy = 0;
      w.vx = 0;
    }
    if (!w.falling) return false; fall(w); return true; },

  // Seeing stars: it rocks where it landed and does nothing until they clear.
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
    // If its hat came off, the stage below takes it from here on this very
    // frame, and finds out there whether somebody took the hat meanwhile.
    if (w.hatOff || w.robbed) return false;
    retask(w, w.type);
    return true;
  },

  // Gone to pick a knocked-off hat back up, once it has actually come down:
  // a body recovered before its hat lands stands where it is for the arc.
  w => {
    if (!w.hatOff) {
      // Somebody put it on while this one was seeing stars.
      if (!w.robbed) return false;
      w.robbed = false;
      dispossessed(w);
      return true;
    }
    if (!w.hatOff.rest) return true;
    const d = w.hatOff.x - w.x;
    if (Math.abs(d) > P) {
      // A route, not a bare walk: the hat may lie across the hole, and a
      // straight walk pushes against the lip clamp forever.
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

  // Drifting down out of the sky (`floatDown`); falls *through* on the frame
  // it lands.
  w => w.floating === true && !floatDown(w),

  // A cursor resting on a body holds it still, so its card is read off
  // somebody standing. Above the commute, because the bodies you hover are
  // mostly mid-walk; held out of a dance, whose feet are off the ground.
  // Nothing is dropped and no claim is released.
  (w, c) => {
    if (!(w.pauseUntil > c.now) || dancing(c)) return false;
    w.say = { mark: '?', until: w.pauseUntil };
    // Standing on whatever is under it now: a hold that only returns true
    // leaves the body at the height it had when the hold began, and the gang
    // take the columns under it. Every hold stands its body every frame.
    w.y = stand(w);
    return true;
  },

  // On its way to a job, and doing none of it yet. A digger walks *into* the
  // footprint on purpose; the rock coming down is what sends it back out
  // (`stepDig`).
  (w, c) => { if (!w.walking) return false; stepCommute(w, w.dig ? null : c.zone); return true; },

  // Digging at the one lodged in the ground (`stepDig` in intro.js). Under the
  // walk, so it gets there first; over the dance, so it digs while the yard
  // celebrates.
  (w, c) => stepDig(w, c),

  // and now and then a body has to stop, whatever it was doing
  (w, c) => relieve(w, c.now),

  // Grossed out: a body whose next step lands in somebody's leavings stops
  // short, says so, then steps around. Directly after the loo stage, so a body
  // mid-squat is not interrupted by its own results. The cooldown is per body
  // so a crowd crossing a fouled yard does not gridlock.
  (w, c) => {
    if (w.grossUntil) {
      if (c.now < w.grossUntil) { w.lunge = 0; w.y = stand(w); return true; }   // and standing, see the pause
      // done gagging: around it, one clear column past the fouled one
      w.x += (w.face || 1) * P * 2;
      w.grossUntil = 0;
      w.say = null;
      return true;
    }
    // The crew that works the mess is not grossed out by it, or a janitor
    // circles the poop it came to shovel forever.
    if (w.type === TYPE.JANITOR || w.muckAt != null) return false;
    if (c.now < (w.grossOkAt || 0) || dancing(c)) return false;
    const dir = w.face || 1;
    const ahead = colAt(w.x + WORKER / 2 + dir * P);
    if (!(poopCols()[ahead] > 0)) return false;
    // only leavings at this body's own feet, not a patch on the rock's flank
    // far over a walker's head
    if (Math.abs(muckFloor(ahead) - (w.y + WORKER)) > P * 3) return false;
    w.grossUntil = c.now + GROSS_MS;
    w.grossOkAt = c.now + GROSS_COOLDOWN_MS;
    w.say = { mark: 'yuck', until: w.grossUntil };
    return true;
  },

  // The rock is off and the whole yard is celebrating. The ones in your hand,
  // falling, seeing stars or floating down are claimed by the stages above
  // and never reach this line.
  (w, c) => {
    if (!dancing(c)) {
      // The only place a dance ends. A DANCE, by its move: the builders' work
      // jig uses the same fields for as long as the build lasts, and a blanket
      // wipe here resets a hammering body every frame.
      if (w.jigAt != null && MOVE_KEYS.includes(w.move)) stopJig(w);
      return false;
    }
    // A body through a door, in the balloon, or on its way to crew one cannot
    // dance in the yard.
    if (outOfYard(w) || w.craft) return false;
    celebrate(w, c.now, c.zone);
    return true;
  },

  // A rock on its way over a yard that is not dancing: a body in the footprint
  // steps out of it; the gang stand where they stepped to until it lands (or
  // a rockhand's work stage stands it on the rock's top in the sky); everybody
  // else is back at work the frame they are clear, since the footprint's
  // columns are `taken` and `holdTheLine` keeps them out. Asked of the zone,
  // which is there from the moment the last rock dies, so the footprint is
  // clear before the next one is made (core.js). The gang wait on the rock
  // being in the air, not on the zone: a scene takes the zone away while the
  // dome holds a rock overhead.
  (w, c) => {
    if (outOfYard(w) || w.craft || !onYard(w)) return false;
    const coming = S.rockFall > 0;
    if (!c.zone && !(coming && w.type === TYPE.ROCK)) return false;
    if (!(c.zone && duck(w, c.zone)) && w.type !== TYPE.ROCK) return false;
    w.lunge = 0;
    w.y = stand(w);
    return true;
  },

  // Every station's tender, *before* the station's own work, the rockhand's
  // included.
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
  // Who is going for which patch of muck, rebuilt each pass from the claims
  // held on the bodies.
  const muckTaken = new Set();
  // A second book for the one mess only a janitor may touch: in the shared
  // book a hauler's elbow on ordinary muck tells the janitor's own search
  // there is no poop under it, and the poop sits there for ever.
  const poopTaken = new Set();
  // WITH their elbows: a claim carried forward without them is a reservation
  // that lasts one frame, and the next body claims the cell beside it.
  for (const w of S.workers) {
    if (w.muckAt == null) continue;
    for (let k = w.muckAt - MUCK_ELBOW; k <= w.muckAt + MUCK_ELBOW; k++) {
      muckTaken.add(k);
      // Only a janitor's claim is an elbow on poop.
      if (w.type === TYPE.JANITOR) poopTaken.add(k);
    }
  }
  // The same book for the cut's own dust: one column, one hauler.
  const cutTaken = new Set();
  for (const w of S.workers) if (w.cutClaim != null) cutTaken.add(w.cutClaim);
  // The tidying claims, rebuilt with their elbows for the same reason. Two of
  // the three join a book that already exists: the cut's floor is fetched from
  // by haulers too, and the farm's strip is floor. Only the rock has ground
  // nobody else works.
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
  // The ground nobody may be *fetching from*: the duck knows nothing of
  // claims, and a hauler with a claim under the coming rock walks straight
  // back in. A claim on the far side goes the same way -- kept, it is a walk
  // to the line and a stand there until the rock is down (`holdTheLine`);
  // let go, the body picks again on its own side (`firstPick`). A body still
  // in the footprint has no side yet and keeps its claim until it has ducked.
  if (zone) {
    const from = Math.max(0, colOf(floor, zone.from));
    const to = Math.min(floor.cols - 1, colOf(floor, zone.to));
    for (let col = from; col <= to; col++) taken.add(col);
    for (const w of S.workers) {
      if (w.type !== TYPE.HAUL || w.claim < 0) continue;
      const side = sideOf(zone, w.x);
      const across = side && sideOf(zone, floor.x + w.claim * P) !== side;
      if ((w.claim >= from && w.claim <= to) || across) w.claim = -1;
    }
  }
  if (!S.coreItem || S.heldCore || !S.coreItem.rest) S.coreTaker = null;
  stepKit();                        // and anybody with kit to go and fetch or put back

  // Where everybody was standing when the frame began, for `faceTravel`.
  const was = new Map();
  for (const w of S.workers) was.set(w, w.x);

  // Knocked-off hats keep falling whatever their owners are doing.
  for (const w of S.workers) stepHat(w);

  // The frame, as one thing to hand about: the clock, its length, the ground a
  // rock is coming down on, and the books of claims.
  const c = { now, dt, zone, taken, muckTaken, poopTaken, cutTaken, rockTaken };
  for (const w of S.workers) {
    // Whoever swings sets the lunge to 1 and nobody eases it themselves.
    if (w.lunge) w.lunge *= LUNGE_EASE;
    let done = false;
    for (const stage of STAGES) if (stage(w, c) === true) { done = true; break; }
    if (!done) jobOf(w).work(w, c);
    holdTheLine(w, was.get(w), zone);
  }

  faceTravel(was);
}

// Nobody walks into the footprint while it stands. The drop-zone stage ducks a
// body already in it; this is the other half, for a body outside whose errand
// leads in. Every walk moves x for itself and none knows what a zone is, so
// the line is held once, here: a body that began the frame clear and ended
// inside is put back on the edge. The gang are the drop-zone stage's own
// business, and a body in your hand or under the ground is not walking.
function holdTheLine(w, x0, zone) {
  if (!zone || x0 == null || w.type === TYPE.ROCK) return;
  if (outOfYard(w) || w.craft || !onYard(w) || w.lifted || w.falling) return;
  const inside = x => x + WORKER > zone.from && x < zone.to;
  if (inside(x0) || !inside(w.x)) return;
  w.x = x0 + WORKER <= zone.from ? zone.from - WORKER : zone.to;
  w.y = stand(w);
}

// Which way everybody is facing: one field, *measured* here after everything
// that could have moved a body has had its go, so nobody who is about to move
// sets it. A body that did not move keeps the way it was facing.
const FACE_STILL = 0.01;             // under this it did not go anywhere
function faceTravel(was) {
  for (const [w, x0] of was) {
    const d = w.x - x0;
    if (Math.abs(d) > FACE_STILL) w.face = Math.sign(d);
    // A footstep every body's width of ground: the bodies have no walk cycle,
    // so the stride is the ground covered. Not on the cursor or in the balloon.
    if (d && !w.lifted && !w.aloft && Math.floor(x0 / WORKER) !== Math.floor(w.x / WORKER)) {
      sfx('footstep', { x: w.x });
    }
  }
}
