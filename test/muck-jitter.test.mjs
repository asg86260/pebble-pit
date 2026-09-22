// A body shovelling the rock's flank stands on it.
//
// Rain lays muck across the rock's columns, and the gang work down it a column
// at a time. A body stepping to its next column carried the elbow's push from
// the column before, which pulled it a cell back -- off the new column's ground
// and on to the next way down the flank -- so it dropped, walked back up, and
// was pulled back again, five frames a round, for as long as that column took.
//
// Counted rather than looked at, because each round is a few frames long: a
// climb of two pixels or more, then a drop of twelve or more from the high
// point, by a body that has not walked a body's width in between. One of
// those is the ground changing under a body -- a column swept from under its
// feet, a step down the flank. The same body doing it again at the same spot
// within the second is a loop.
//
// A seed each where the loop turned up on the yard before the fix: it is a
// matter of which column a body is on when the rain comes, and the file's
// own seed never puts one there.

import { yard, group, ok, state, run, openSites } from './helpers.mjs';
import { P, WORKER } from '../src/config.js';
import { floor } from '../src/state.js';

const clearUp = seed => group(`a clear-up on the rock does not bob the gang up and down its flank (seed ${seed})`, async () => {
  window.__reset();
  openSites();
  window.__loo(true);
  yard.S.looPosts = 2;            // both janitors on the shed, not what this is about
  window.__crew(2, 4);            // two of the four carrying go to the shed
  window.__air({ janitors: 2, haze: 0, muck: 0 });
  window.__tune('LOO_EVERY', 600000);
  run(5);

  // Three cells on every column of the rock, laid again every five seconds.
  const { rockLeftX, rockW } = state();
  const onRock = c => c * P + P / 2 >= rockLeftX && c * P + P / 2 < rockLeftX + rockW;
  const had = () => (yard.S.muck || []).reduce((n, v) => n + v, 0);
  const rain = () => {
    const was = had();
    // `__muckSet` counts the floor's columns, which start at the floor's x.
    return window.__muckSet(c => onRock(c + floor.x / P)
      ? Math.max(3, yard.S.muck[c] || 0) : (yard.S.muck[c] || 0)) - was;
  };

  // By place in the crew, not as objects: the harness reloads the yard every
  // five seconds and stands up new bodies.
  const track = [];
  let cycles = 0, bobs = 0, laid = 0;
  for (let f = 0; f < 60 * 60; f++) {
    if (f % (5 * 60) === 0) laid += rain();
    run(1 / 60);
    yard.S.workers.forEach((w, i) => {
      const t = track[i] ??= { low: w.y, high: w.y, x: w.x, up: false, last: null, lastX: 0 };
      // A body that has walked a body's width since the climb began is going
      // somewhere, and a ledge on the way is not a bob.
      if (Math.abs(w.x - t.x) >= WORKER) { t.up = false; t.low = w.y; t.x = w.x; return; }
      if (!t.up) {
        if (w.y >= t.low) { t.low = w.y; t.x = w.x; }
        if (t.low - w.y >= 2) { t.up = true; t.high = w.y; }
        return;
      }
      t.high = Math.min(t.high, w.y);
      if (w.y - t.high < 12) return;
      cycles++;
      if (t.last != null && f - t.last <= 60 && Math.abs(w.x - t.lastX) < WORKER) bobs++;
      t.last = f; t.lastX = w.x;
      t.up = false; t.low = w.y; t.x = w.x;
    });
  }
  const left = state().smog.muck.rock;
  const janitors = state().janitors;

  window.__crew(0, 0);
  window.__loo(false);
  window.__air({ haze: 0, muck: 0 });
  window.__clearFloor();
  return [
    ok(laid > 0 && janitors === 2, 'rain was laid on the rock, with two janitors in the yard',
       `${laid} laid, ${janitors} janitors`),
    ok(bobs < 3, 'and nobody bobbed up and down one spot on the flank shovelling it',
       `${bobs} climb-then-drop cycles repeated at the same spot inside a second`),
    ok(cycles < 15, 'and hardly anybody climbed and dropped at all',
       `${cycles} climb-then-drop cycles in a minute`),
    // The fix must not cost the clearing: a gang that stands still is a gang
    // that also does not bob.
    ok(left < laid / 12, 'while the gang kept up with it',
       `${laid} laid, ${left} on the rock at the end`)
  ];
}, seed);

clearUp(11);
clearUp(33);
clearUp(77);
