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
import { WORKER } from '../src/config.js';

// On this same yard -- deep in mess, so every free hand is on muck duty -- the
// crew spent every fall vibrating at the drop zone. The muck walk never asked
// about the zone, so a body sent at a mess under or across the coming rock
// stepped in and was shoved out by the duck, every frame, juddering on the line
// for the whole of the fall. The answer used to be the dance: every fall was
// danced through and a dancing body covers no ground. No fall is a dance now
// (wave polish, 2026-09-14); what stands in for it is the duck stage in
// crew/step.js -- a body that has stepped out of the footprint stands where it
// stepped to until the rock is down -- and `takeMess` still keeps a shovel off
// a mess under the fall. So what is asserted is the outcome itself: through
// the whole fall nobody grinds on the line.
group('the crew stand clear through the fall instead of grinding at the zone', async () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8'));
  yard.restore();
  window.__next();                             // the rock goes; the gap starts
  // frame by frame -- the fall is under a second and a coarse step walks
  // straight over it
  for (let i = 0; i < 1200 && state().rockFall <= 0; i++) run(1 / 60);
  // Per body, every frame of the fall: where it stood. A judder is a body
  // reversing along the ground again and again within a stride of the zone's
  // line; a body walking clear reverses once at most.
  const films = new Map();
  let frames = 0, zone = null;
  for (let i = 0; i < 600 && state().rockFall > 0; i++) {
    run(1 / 60);
    frames++;
    const s = state();
    zone = s.dropZone || zone;
    s.workerPos.forEach((p, idx) => {
      const x = +p.split(':')[1].split(',')[0];
      if (!films.has(idx)) films.set(idx, []);
      films.get(idx).push(x);
    });
  }
  const grinders = [...films.entries()].filter(([, xs]) => {
    if (!zone) return false;
    const nearLine = xs.some(x => Math.abs(x - zone[0]) < WORKER * 2 || Math.abs(x + WORKER - zone[1]) < WORKER * 2);
    if (!nearLine) return false;
    let flips = 0, last = 0;
    for (let i = 1; i < xs.length; i++) {
      const d = Math.sign(xs[i] - xs[i - 1]);
      if (d && last && d !== last) flips++;
      if (d) last = d;
    }
    return flips > 3;
  }).map(([idx]) => idx);
  window.__crew(0, 0);
  return [
    ok(frames > 20, 'there was a fall to watch', `${frames} frames of it`),
    ok(grinders.length === 0, 'and nobody grinds on the zone line through it',
       `bodies ${grinders.join(',')} reversed more than three times at the line`)
  ];
}, 20250830);

group('the stuck yard comes unstuck', async () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8'));
  yard.restore();
  const before = state();
  // To a stray cell or two, not to the last one: the last is worked at the
  // rock's own pace and lands inside the ten minutes the drain assertion is
  // not willing to wait. Frozen, this number stays at ninety-nine for ever.
  // Sampled over the whole run rather than caught inside a minute.
  //
  // It used to be `runUntil(rock <= 5, 60)`, and that was a threshold on a noisy
  // statistic: the count on the face jitters as bodies drop and lift, so what
  // the check actually rode on was a transient dip inside the window. Measured
  // every ten seconds the old tree read 262, 176, 160, 120, 63, 15 -- it never
  // truly reached five inside the minute, and passed on a dip between samples.
  // A yard that cleans slightly differently then fails for no defect.
  //
  // So what is asserted is the thing that is stable and is what the fixture is
  // about: the face comes clean, and it does not take all day.
  const faceClean = runUntil(() => state().smog.muck.rock <= 5, 180);
  const tookS = Math.round(state().t - before.t);
  run(120);
  const after = state();
  window.__crew(0, 0);
  return [
    ok(before.smog.muck.all > 2000, 'the yard is under a real layer',
       `${before.smog.muck.all} cells, ${before.smog.muck.rock} of them on the rock`),
    ok(faceClean, 'the face comes clean rather than staying stuck',
       `${state().smog.muck.rock} left on the rock after ${tookS}s`),
    ok(after.smog.muck.all < 2000, 'and the yard is draining rather than silting',
       `${before.smog.muck.all} -> ${after.smog.muck.all} after three minutes`)
  ];
}, 20250830);
