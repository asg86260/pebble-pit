// Down a hole is a depth, not a pixel (TODO.md, "`inWorking` reads the ground
// line to a pixel again").
//
// `onYard` is `!inWorking`, and the duck out of a falling rock, the walk's
// duck, the fall rule and the muck errands all ask it. A body's own motion
// rides its feet under the ground it stands on -- a rockhand's sway and the
// drive of its swing, a quarrier's sway at a cut not dug yet -- and the dance
// takes its foot wherever that motion left it. So a body standing on the yard
// must read as on the yard at every phase of that motion, and a body deeper
// than any of it, with no working under it (the cut moved on a re-walk),
// must still read as down a hole.

import { group, ok, run, P, WORKER } from './helpers.mjs';
import { S } from '../src/state.js';
import { SWING_BOB, SWING_DRIVE, DIG_SWAY } from '../src/config.js';
import { onYard, hireSpot } from '../src/crew/body.js';
import { wayAt, inWorking } from '../src/route.js';

// The feet's place on the open yard: the shacks' door, nowhere near a mouth.
function onTheGround() {
  window.__crew(2, 2);
  run(1);
  const w = S.workers.find(b => !b.inside) || S.workers[0];
  w.x = hireSpot().x;
  w.y = S.groundY - WORKER;
  return w;
}

group('a body bobbing on the yard is on the yard at every phase', async () => {
  const w = onTheGround();
  const foot = w.y;
  const way = wayAt(w.x, foot).key;
  // A whole cycle of each sway, finely enough that the crest is in it, and
  // the rockhand's at every point of a swing's drive from rest to full lunge.
  const STEPS = 96;
  const wrong = [], swayOnly = [];
  let deepest = 0;
  for (let i = 0; i < STEPS; i++) {
    const s = Math.sin(i / STEPS * Math.PI * 2);
    for (const lunge of [0, 0.25, 0.5, 0.75, 1]) {
      const dy = s * SWING_BOB + lunge * P * SWING_DRIVE;
      w.y = foot + dy;
      deepest = Math.max(deepest, dy);
      if (!onYard(w)) (lunge ? wrong : swayOnly).push(`rockhand sway ${dy.toFixed(2)}px`);
    }
    w.y = foot + s * DIG_SWAY;
    if (!onYard(w)) wrong.push(`dig sway ${(s * DIG_SWAY).toFixed(2)}px`);
  }
  w.y = foot;
  return [
    ok(way === 'yard', 'the spot is the open yard', way),
    ok(deepest > 1, 'and the motion does reach more than a pixel under the ground', `${deepest.toFixed(2)}px`),
    ok(swayOnly.length === 0, 'the idle sway alone never reads as down a hole',
       `${swayOnly.length} phases, first ${swayOnly.slice(0, 3).join(', ')}`),
    ok(wrong.length === 0, 'nor does any phase of a swing\'s drive or a dig',
       `${wrong.length} phases, first ${wrong.slice(0, 3).join(', ')}`)
  ];
});

group('a body deeper than any bob, with no working under it, is down a hole', async () => {
  const w = onTheGround();
  const foot = w.y;
  // The first floor on the cell grid past the deepest a body's own motion
  // reaches: a rockhand's sway plus a full drive.
  const reach = Math.max(SWING_BOB + SWING_DRIVE * P, DIG_SWAY);
  const down = Math.ceil(reach / P) * P;
  w.y = foot + down;
  const way = wayAt(w.x, w.y).key;
  const held = inWorking(w), yardSays = onYard(w);
  w.y = foot;
  return [
    ok(way === 'yard', 'no working is under it: the spans read it as on the yard', way),
    ok(held && !yardSays, `${down / P} cells under the ground it reads as down a hole`,
       `inWorking ${held}, onYard ${yardSays}`)
  ];
});
