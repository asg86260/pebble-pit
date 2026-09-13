// A count on its way (tween.js): the one thing every number in the yard --
// the card, a purse, a roster -- goes through before it is drawn. A price does
// not: it is a fact about the next rung, not a count that moved (shop.js).
//
// The clock is handed in rather than read, so a run here is a fact about the
// curve and not about how fast the machine is.

import { group, ok } from './helpers.mjs';
import { shown, snapShown } from '../src/tween.js';
import { setPref } from '../src/prefs.js';
import { TWEEN_MIN_MS, TWEEN_MAX_MS } from '../src/config.js';

const full = () => setPref('motion', false);
const less = () => setPref('motion', true);

group('a count runs to its value rather than jumping', async () => {
  full(); snapShown();
  const first = shown('t:a', 100, 0);
  shown('t:a', 200, 1000);
  const mid = shown('t:a', 200, 1000 + TWEEN_MIN_MS / 2);
  const done = shown('t:a', 200, 1000 + TWEEN_MAX_MS);
  return [
    ok(first === 100, 'the first reading of a name is its value, not a run up from nothing', first),
    ok(mid > 100 && mid < 200, 'half way through it is between the two', mid),
    ok(done === 200, 'and it arrives', done),
  ];
});

group('a count that changes again runs on from where it is', async () => {
  full(); snapShown();
  shown('t:b', 0, 0);
  shown('t:b', 100, 1000);
  const at = shown('t:b', 100, 1000 + TWEEN_MIN_MS / 2);
  const next = shown('t:b', 0, 1000 + TWEEN_MIN_MS / 2);
  return [
    ok(next === at, 'the turn is taken from wherever it had got to, not from the last value', `${at} -> ${next}`),
    ok(shown('t:b', 0, 1000 + TWEEN_MIN_MS / 2 + 1) < at, 'and heads back the other way'),
  ];
});

group('a bigger jump takes longer, up to the ceiling', async () => {
  full(); snapShown();
  shown('t:c', 0, 0); shown('t:c', 10, 1000);
  shown('t:d', 0, 0); shown('t:d', 1e6, 1000);
  const smallDone = shown('t:c', 10, 1000 + TWEEN_MIN_MS) === 10;
  const bigStill = shown('t:d', 1e6, 1000 + TWEEN_MIN_MS) < 1e6;
  const bigDone = shown('t:d', 1e6, 1000 + TWEEN_MAX_MS) === 1e6;
  return [
    ok(smallDone, 'a ten-step jump is over by the floor'),
    ok(bigStill, 'a million is not'),
    ok(bigDone, 'but it is by the ceiling'),
  ];
});

group('under less motion a count is its value, and a snap forgets every run', async () => {
  full(); snapShown();
  shown('t:e', 0, 0);
  less();
  const snapped = shown('t:e', 500, 1);
  full(); snapShown();
  shown('t:e', 0, 0);
  shown('t:e', 500, 1);
  snapShown();
  const fresh = shown('t:e', 500, 2);
  setPref('motion', null);
  return [
    ok(snapped === 500, 'less motion: the reading is the count', snapped),
    ok(fresh === 500, 'after a snap the next reading is the count, not the run it was on', fresh),
  ];
});
