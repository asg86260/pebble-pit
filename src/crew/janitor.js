// The mess, and whoever is on it. A janitor does one thing: it walks to the
// nearest muck and shovels it. With nothing left to shovel it goes back to
// its shed and waits there, which is where you will look for it.

import { P, AT_POST, IDLE_BEAT, IDLE_STRIDE, IDLE_PACE, IDLE_ROAM, JANITOR_PROP,
         SPELL_SWEEP } from '../config.js';
import { outhouse } from '../state.js';
import { commutePace } from '../upgrades.js';
import { spelled } from '../tower.js';
import { TYPE } from '../jobs.js';
import { frames } from '../clock.js';
import { rand } from '../rng.js';
import { stand } from './body.js';
import { stationX } from './commute.js';
import { amble } from './idle.js';

// Somebody whose job is the mess. It starts at the shed it belongs to, the way
// every other body starts at its station -- though the work is wherever the mess
// happens to be, which is anywhere on the ground.
export function newJanitor() {
  return { type: TYPE.JANITOR, goal: 'to', x: outhouse.x, y: 0 };
}

export function janitorWork(w, c) {
  const { now } = c;
  const post = stationX(TYPE.JANITOR);
  const d = post - w.x;
  // Far enough off its post to have left it, which is a wider mark than being
  // off the post -- the loitering below is *meant* to take it a few cells away.
  // See `AT_POST` in config.js, which is that wander plus what rides on it.
  if (Math.abs(d) > AT_POST) {
    w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    w.y = stand(w);
    return;
  }
  w.resting = true;
  // Waiting for a mess is most of a janitor's day, so it is worth watching.
  //
  // It used to stand exactly on its post, rigid, until something got
  // dropped -- and a body that never moves reads as a body the game has
  // forgotten about. It gets what a stood-down rockhand gets, and a little
  // more of it: the same slow shift of weight about the spot it stopped
  // on, on its own phase, and now and then it wanders a few cells along
  // and props itself up somewhere else. Somebody minding a shed, rather
  // than somebody switched off beside one.
  if (w.idleAt == null || now >= (w.propAt || 0)) {
    // A new spot to lean on, a few cells either way and never off the
    // shed's own ground. `IDLE_ROAM` is how far that is, and the walk back
    // to the post is measured off the same number -- see `AT_POST`.
    w.idleAt = post + (rand() * 2 - 1) * IDLE_ROAM;
    w.propAt = now + JANITOR_PROP * (0.6 + rand() * 0.9);
  }
  const sway = now / 1000 * IDLE_BEAT + w.ph;
  const to = w.idleAt + Math.sin(sway * IDLE_STRIDE) * P;
  // At an amble, and at its own pace rather than at a fraction of a
  // commute. Chased at half a walking pace the spot two or three cells
  // away was reached in a blink, so the whole idle was a long freeze and
  // then a scoot -- and it got worse every time the crew's legs did.
  // `IDLE_PACE` is the speed of loitering and belongs to loitering.
  amble(w, to, IDLE_PACE * (spelled('sweep') ? SPELL_SWEEP : 1));
  // and its feet stay on the ground -- the straightening-up hop is gone, for
  // the same reason the rockhand's is: see the note there.
  w.y = stand(w);
}

// The whole yard, always: that is the job.
export function janitorBack(w) {
  w.goal = 'to';
  w.muckAt = null;
}
