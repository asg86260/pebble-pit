// --- nature -------------------------------------------------------------------
// A body works all day, and now and then it has to stop.
//
// It puts down whatever it was doing, says so over its head, stands there for a
// couple of seconds, and gets back to it -- and what it leaves behind is the
// same muck the sky rains down, so the crew have to shovel it exactly like any
// other mess. The yard makes its own work. A bigger crew is more hands and a
// bigger mess, which is a nicer shape for a number to have than "more hands".
//
// Nowhere it cannot be cleaned up. The rock, the quarry and the plots are held out
// of the shovelling -- see `onSite` in smog.js -- so a body standing on one of
// them holds on and goes when it is next somewhere the crew can reach. That is
// also why nothing is dropped by a body that is inside the lab or down a hole:
// it is not standing on the yard at all.
//
// Every body keeps its own clock, set the first time it is looked at, so they do
// not all go at once on the same tick.

import { WORKER, LOO_EVERY, LOO_SPREAD, LOO_MS, LOO_MUCK } from '../config.js';
import { inWorking } from '../route.js';
import { dropMuckAt, cleanSpotNear } from '../smog.js';
import { rand } from '../rng.js';
import { MOVE_KEYS } from './dance.js';

export function relieve(w, now) {
  // Its own hour -- and it starts somewhere *inside* the cycle rather than a
  // whole one away. Seeding everybody a full interval out is what made a crew
  // hired together go together: they were all handed the same clock at the same
  // moment, so they all came due at the same moment, for ever. Starting each one
  // at a random point of its first cycle breaks them apart on the first pass and
  // the wander keeps them apart after that.
  if (!w.looAt) {
    w.looAt = now + LOO_EVERY * rand();
    return false;
  }
  // Nobody waits longer than the interval itself. A body is handed its hour when
  // it is first looked at, so turning the interval down on the dev panel would
  // otherwise do nothing at all until every body already standing there had
  // waited out the old one -- which for a ten-minute default is most of a
  // session of watching nothing happen and concluding the knob is broken.
  if (w.looAt > now + LOO_EVERY) w.looAt = now + LOO_EVERY * rand();

  if (w.looUntil) {                        // mid-way through: it is not doing anything else
    if (now < w.looUntil) { w.lunge = 0; return true; }
    // What it leaves, where it was standing, for a janitor to come and clear.
    dropMuckAt(w.x + WORKER / 2, LOO_MUCK, 'poop');
    w.looUntil = 0;
    w.say = null;
    w.looAt = now + LOO_EVERY * (1 + (rand() - 0.5) * 2 * LOO_SPREAD);
    return true;                           // one last frame of standing, then back to it
  }

  if (now < w.looAt) return false;
  // Not in the middle of a celebration. A dance is five seconds and this has
  // waited an hour; it can wait five more. It is also the one stage in the list
  // that stops a body without moving it, and a dancing body's feet are off the
  // ground -- so a squat begun mid-jump left somebody standing in the air for
  // the length of it, which is the "left hanging" the dance's own check catches.
  // Asked of the move rather than of `jigAt`, so a builder's hammering -- which
  // uses the same fields and lasts a whole build -- is not held out with it.
  if (MOVE_KEYS.includes(w.move)) return false;
  // finish what you are holding -- and there is nowhere to go from the sky. A
  // wizard aloft is not somewhere a walk can start: it comes down when it has
  // nothing to do, and it can go then.
  if (w.inside || inWorking(w) || w.aloft || w.carry || w.hasCore) return false;
  // Only while it is working. A body winding down -- nothing to carry, on its
  // way home, or standing about between strolls -- is a body whose day is over,
  // and one that stopped on the way in would leave something for the ones
  // already indoors to come back out and shovel, which is a yard that can never
  // settle. It is also what was asked for: they go while they are working.
  if (w.goal === 'home' || w.goal === 'idle' || w.brk) return false;
  // Nowhere within reach that anybody could clean: hold on. A body down a hole
  // or shut in a building is the case this catches.
  if (cleanSpotNear(w.x + WORKER / 2) == null) return false;
  // It goes where it stands, and says so over its own head -- always, now.
  //
  // There used to be a shed to walk to, and the crew walked to it: across the
  // yard, in, out, and back to work. That is a long way to send somebody, it
  // took them off the job for the length of the walk, and it turned the thing
  // you bought into a place rather than a job. What you buy now is the closet a
  // janitor keeps a shovel in -- the *post*, not the destination -- so the mess
  // still lands where the body was working and somebody whose job it is comes
  // round and clears it. See `capOf`, which is what the closet actually opens.
  w.looUntil = now + LOO_MS;
  w.say = { mark: 'loo', until: w.looUntil };
  w.resting = false;                       // stopped, but this is not a break
  return true;
}
