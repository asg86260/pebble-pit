// Between rocks: the moment one is finished with, and when the next comes down.

import { WORKER, DANCE_MS, ROCK_GAP_MS } from './config.js';
import { S } from './state.js';
import { noteRockCleared } from './notices.js';
import { boulderAlive, makeBoulder, dropZone } from './rock.js';
import { onYard } from './crew/body.js';
import { now } from './clock.js';
import { ownsYard, beatDone } from './beats.js';

// Nobody is standing on the ground the next rock is coming down on. The crew
// step out of the footprint when the last rock dies (crew/step.js) and the
// rock waits in the sky for them. A body in your hand or seeing stars cannot
// step out, so `nextBoulderAt` still brings the rock down rather than hold
// the yard on one body for ever.
const footprintClear = () => {
  const zone = dropZone();
  if (!zone) return true;
  return ![...S.workers, ...(S.lifts || [])]
    .some(w => onYard(w) && w.x + WORKER > zone.from && w.x < zone.to);
};

export function stepCore() {
  // Nothing rolls in while a beat owns the yard: the opening is empty on
  // purpose and its second act puts the rock down itself. (The second dance,
  // after the sqwife is saved, is the ending beat's own -- beats.js.)
  if (ownsYard()) return;

  // The moment the last pixel goes the rock is done with. `coreBuried` is a
  // saved name from when a rock held a core; it says "this rock is not yet
  // finished with", so the finish below happens once a rock.
  if (S.coreBuried && !boulderAlive()) {
    S.coreBuried = false;
    // The dance is for the first rock only (the rescue has its own). No
    // dancers, no dance: five seconds of standing about is most of the early
    // game.
    S.danceUntil = S.boulderNo === 1 && S.rockhands > 0 ? now() + DANCE_MS : 0;
    S.nextBoulderAt = now() + ROCK_GAP_MS;   // backstop if the footprint never clears
  }

  // The reunion (`meet` in beats.js) needs a moment with the first rock dead
  // and the next not yet in the sky; without this the next boulder is built
  // in the same call and the beat never plays.
  if (beatDone('show') && !beatDone('part') && S.boulderNo === 1 && !boulderAlive()) return;

  if (!S.coreBuried && !boulderAlive()) {
    // Nothing lands on top of the celebration, or on top of anybody.
    if ((footprintClear() || now() > S.nextBoulderAt) && now() >= S.danceUntil) {
      noteRockCleared();   // what the one just finished was like
      S.boulderNo++;
      makeBoulder(true);
    }
  }
}
