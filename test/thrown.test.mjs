// A body let go of with a flick is thrown, and a throw goes where it was
// thrown. The yard has ends and a body bumps off them -- but the ends are the
// world's, not the first pile's. `yardLeft` is where the crew stop *walking*
// (the first heap, out past the farm's plots), and a body thrown anywhere left
// of it -- the farm's own hands stand there -- was snapped to that line on the
// frame it left your hand: picked up beside the farm shed, let go with the
// slightest flick, and stood four hundred pixels to the right of it.
//
// The throw goes through the real drop(), off a real trail, because the thing
// the check is about is what letting go does.

import { yard, group, ok, state, run, WORKER } from './helpers.mjs';
import { HURL_MAX } from '../src/config.js';
import { now } from '../src/clock.js';

const { drop } = await import('../src/crew/pointer.js');

const S = yard.S;

group('a body thrown left of the farm comes down left of the farm', async () => {
  window.__reset();
  window.__crew(1, 1, 0, 1);
  run(1);
  const fs = state().farmShed;
  const i = state().crewDetail.findIndex(d => d[0] === 'f');
  // in your hand, a little way left of the shed and a body's height off the ground
  const x = fs.x - WORKER * 4, y = fs.y + fs.h - WORKER * 3;
  window.__hold(i, x, y);
  const w = S.workers[i];
  // a gentle flick to the left, the way a hand that is still moving lets go
  const t = now();
  S.trail = [{ x, y, t: t - 40 }, { x: x - 6, y, t }];
  drop(w);

  let jump = 0, lx = w.x, landed = null;
  for (let n = 0; n < 60 * 4 && landed == null; n++) {
    run(1 / 60);
    jump = Math.max(jump, Math.abs(w.x - lx));
    lx = w.x;
    if (!w.falling) landed = w.x;
  }
  window.__crew(0, 0);
  return [
    ok(jump <= HURL_MAX + 1,
       'no frame carried it further than a throw can',
       `biggest step ${jump.toFixed(1)}px, a throw is ${HURL_MAX}px a frame`),
    ok(landed != null && landed + WORKER <= fs.x,
       'it came down left of the shed, where it was thrown',
       `landed at ${landed == null ? 'never' : Math.round(landed)}, the shed at ${fs.x}`)
  ];
});
