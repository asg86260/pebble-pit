// A body with nothing to do strolls, and a stroll has legs in it: it gets going
// over a few frames and comes to a stop over a few more. It used to go from
// stood still to its full pace in one frame and stop as dead, which is not a
// walk, it is a sprite being slid -- and nowhere in the yard is that easier to
// see than on an idle hauler, which is the one body that is stood still and
// then walking a dozen times a minute.
//
// The rule is measured on the haulers, frame by frame, and it is about a
// change of pace rather than a pace: between one frame and the next a strolling
// body gains at most a frame's share of its top speed (`AMBLE_RAMP` frames from
// a standstill), and sheds no more than that either.

import { yard, group, ok, run } from './helpers.mjs';
import { AMBLE_RAMP, tuned } from '../src/config.js';
import { haulSpeed } from '../src/levels.js';
import { ROAM_PACE } from '../src/crew/idle.js';

group('an idle hauler gets going and slows down rather than switching on and off', async () => {
  window.__reset();
  // Held out of the house for the length of the watch: this is about a
  // stroll's pace, and an idle body goes indoors after a few seconds.
  const was = tuned('HOME_AFTER');
  window.__tune('HOME_AFTER', 10 * 60 * 1000);
  window.__crew(0, 4);
  window.__air({ haze: 0, muck: 0 });
  run(5);                                    // walked in from the door and settled

  // Every frame of every stroll: how far each body moved, against how far it
  // moved the frame before. Frames a body is not strolling -- resting, or off
  // on an errand -- are left out, and so is the first frame after either.
  // (A stroll counts from the frame after it is picked: the frame that picks
  // it also elbows the body clear of anybody it was stood in.)
  const haulers = () => yard.S.workers.filter(w => w.type === 'hauler');
  const last = new Map();
  let worst = 0, quickest = 0, strolled = 0;
  for (let i = 0; i < 60 * 40; i++) {
    const before = new Map(haulers().map(w => [w, { x: w.x, on: w.roamTo != null }]));
    run(1 / 60);
    for (const w of haulers()) {
      const b = before.get(w);
      const strolling = w.goal === 'idle' && w.roamTo != null && !w.walking && !w.brk;
      const dx = strolling && b?.on ? Math.abs(w.x - b.x) : null;
      if (dx != null && last.has(w)) {
        strolled++;
        worst = Math.max(worst, Math.abs(dx - last.get(w)));
        quickest = Math.max(quickest, dx / (haulSpeed() * ROAM_PACE * (w.amble || 1)));
      }
      if (dx != null) last.set(w, dx); else last.delete(w);
    }
  }
  // The most a frame may add: a frame's share of the quickest stroller's top.
  // Half again on top of that is slack for the stop, which is worked out from
  // the distance left and sheds a hair more than a share on its last frames.
  // The fault this is about is an order of magnitude bigger than the share.
  const gain = haulSpeed() * ROAM_PACE * 1.3 / AMBLE_RAMP;

  window.__tune('HOME_AFTER', was);
  window.__reset();
  return [
    ok(strolled > 600, 'the haulers spend a good part of the time strolling', `${strolled} frames`),
    ok(worst <= gain * 1.5, 'and no frame changes a stroll\'s pace by more than a frame\'s share of it',
       `worst ${worst.toFixed(3)}px a frame, a share is ${gain.toFixed(3)}`),
    ok(quickest > 0.9, 'and a long enough stroll does reach its full pace',
       `${(quickest * 100).toFixed(0)}% of it`)
  ];
});
