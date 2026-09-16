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

// Starts at the shed it belongs to; the work is wherever the mess is.
export function newJanitor() {
  return { type: TYPE.JANITOR, goal: 'to', x: outhouse.x, y: 0 };
}

export function janitorWork(w, c) {
  const { now } = c;
  const post = stationX(TYPE.JANITOR);
  const d = post - w.x;
  // Far enough off its post to have left it: the loitering below is meant to
  // take it a few cells away, and `AT_POST` is that wander plus a margin.
  if (Math.abs(d) > AT_POST) {
    w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    w.y = stand(w);
    return;
  }
  w.resting = true;
  // Waiting for a mess is most of a janitor's day: it shifts its weight on its
  // own phase and now and then props itself up a few cells along, so it reads
  // as minding the shed rather than switched off beside it.
  if (w.idleAt == null || now >= (w.propAt || 0)) {
    w.idleAt = post + (rand() * 2 - 1) * IDLE_ROAM;
    w.propAt = now + JANITOR_PROP * (0.6 + rand() * 0.9);
  }
  const sway = now / 1000 * IDLE_BEAT + w.ph;
  const to = w.idleAt + Math.sin(sway * IDLE_STRIDE) * P;
  const step = to - w.x;
  // At loitering's own pace, not a fraction of a commute: chased at walking
  // pace the spot is reached in a blink and the idle is a freeze then a scoot.
  w.x += Math.sign(step) * Math.min(IDLE_PACE * frames()
           * (spelled('sweep') ? SPELL_SWEEP : 1), Math.abs(step));
  w.y = stand(w);
}

// The whole yard, always: that is the job.
export function janitorBack(w) {
  w.goal = 'to';
  w.muckAt = null;
}
