// --- nature -------------------------------------------------------------------
// A body works all day, and now and then it has to stop: it puts down what it
// was doing, says so over its head, stands there a couple of seconds, and what
// it leaves is the same muck the sky rains down, for the crew to shovel.
//
// Never anywhere it cannot be cleaned up: the rock, the quarry and the plots
// are held out of the shovelling (`onSite` in smog.js), so a body on one of
// them holds on until it is somewhere the crew can reach.

import { WORKER, LOO_EVERY, LOO_SPREAD, LOO_MS, LOO_MUCK } from '../config.js';
import { inWorking } from '../route.js';
import { dropMuckAt, cleanSpotNear } from '../smog.js';
import { rand } from '../rng.js';
import { MOVE_KEYS } from './dance.js';
import { stand } from './body.js';

export function relieve(w, now) {
  // Its own clock, started at a random point *inside* the first cycle: seeded
  // a whole interval out, a crew hired together comes due together for ever.
  if (!w.looAt) {
    w.looAt = now + LOO_EVERY * rand();
    return false;
  }
  // Nobody waits longer than the interval itself, so turning it down on the
  // dev panel takes effect before every body has waited out the old one.
  if (w.looAt > now + LOO_EVERY) w.looAt = now + LOO_EVERY * rand();

  if (w.looUntil) {                        // mid-way through: it is not doing anything else
    // Standing on whatever is under it meanwhile, as every hold does: the gang
    // takes the columns under a squatting mate.
    if (now < w.looUntil) { w.lunge = 0; w.y = stand(w); return true; }
    dropMuckAt(w.x + WORKER / 2, LOO_MUCK, 'poop');
    w.looUntil = 0;
    w.say = null;
    w.looAt = now + LOO_EVERY * (1 + (rand() - 0.5) * 2 * LOO_SPREAD);
    return true;                           // one last frame of standing, then back to it
  }

  if (now < w.looAt) return false;
  // Not mid-dance: a dancing body's feet are off the ground, and a squat begun
  // mid-jump leaves it standing in the air. Asked of the move rather than of
  // `jigAt`, so a builder's hammering (same fields, a whole build long) is not
  // held out with it.
  if (MOVE_KEYS.includes(w.move)) return false;
  // Finish what you are holding, and there is nowhere to go from the sky.
  if (w.inside || inWorking(w) || w.aloft || w.carry || w.hasCore) return false;
  // Only while working: a body that stopped on its way in would leave something
  // for the ones already indoors to come back out for, and the yard never
  // settles.
  if (w.goal === 'home' || w.goal === 'idle' || w.brk) return false;
  // Nowhere within reach that anybody could clean: hold on.
  if (cleanSpotNear(w.x + WORKER / 2) == null) return false;
  // It goes where it stands. What the outhouse buys is the janitor's post, not
  // a place to walk to (`capOf`).
  w.looUntil = now + LOO_MS;
  w.say = { mark: 'loo', until: w.looUntil };
  w.resting = false;                       // stopped, but this is not a break
  return true;
}
