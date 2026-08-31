// A yard from the field, loaded whole: boulder 42, twenty-three crew, the belt
// running, the hole nearly full, and a rain's worth of mess down.
//
// This save came from a player whose whole crew was stuck: every body on muck
// duty held a claim it could never work, the rock's face stayed dirty for ever,
// and the yard silted up. Four different defects lined up to build it, and not
// one of them showed on the small fresh yards the other checks build -- which
// is why the save itself is the fixture. What it asserts is only the outcome:
// the face comes clean and the yard starts draining.
//
//   1. The fall rule read a body scaling the tall rock's sheer toe -- or the
//      full pit's banked pile -- as unsupported, and knocked it off (climbTo
//      now stamps an active ascent, and the fall rule honours the stamp).
//   2. A body walking the brimming pile was read as standing on the yard,
//      a body's height over it (wayAt answers the pile now).
//   3. Landing from a fall re-tasked the body home across the world with its
//      claim still held (a landing resumes a shovelling errand now, and a
//      retask releases any claim).
//   4. Every hauler in the yard walked to the belt's post and stood there in a
//      stack (one tender now; the rest answer to the yard).

import { readFileSync } from 'node:fs';
import { yard, group, ok, state, run, runUntil } from './helpers.mjs';

group('the stuck yard comes unstuck', async () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8'));
  yard.restore();
  const before = state();
  // To a stray cell or two, not to the last one: the last is worked at the
  // rock's own pace and lands inside the ten minutes the drain assertion is
  // not willing to wait. Frozen, this number stays at ninety-nine for ever.
  const faceClean = runUntil(() => state().smog.muck.rock <= 5, 60);
  run(120);
  const after = state();
  window.__crew(0, 0);
  return [
    ok(before.smog.muck.all > 2000, 'the yard is under a real layer',
       `${before.smog.muck.all} cells, ${before.smog.muck.rock} of them on the rock`),
    ok(faceClean, 'the face comes all but clean inside a minute',
       `${state().smog.muck.rock} left on the rock`),
    ok(after.smog.muck.all < 2000, 'and the yard is draining rather than silting',
       `${before.smog.muck.all} -> ${after.smog.muck.all} after three minutes`)
  ];
}, 20250830);
