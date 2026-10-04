// The serpent heals whole (DESIGN.md, "The serpent heals whole: a phase is a
// window"): each phase gives the party a window, and when it has run the
// serpent eats the next creature to reach its mouth and the wound closes
// whole. A stun or Held stops the window, the surge runs it fast, and a
// creature already turned for the mouth is eaten whatever the window does.
// Setup is the serpent's own (test/serpent.test.mjs).

import { group, ok, yard, run } from './helpers.mjs';
import { SERPENT_WOUND, SERPENT_WINDOW, MECHANICS } from '../src/config.js';
import { nextMeal } from '../src/deep/meals.js';
import { strike } from '../src/deep/serpent.js';
import { lay } from '../src/deep/statuses.js';
import { bellyAt } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);

// A fresh window at `stage`, the wound set.
function deepYard(stage = 0, wound = 0) {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage, wound });
  S.mealT = 0; S.mealI = null; S.breakT = null;
}
const stunNow = () => { const p = bellyAt(now()); strike('brawler', 1, p.x, p.y, null, 1, { stun: 1 }); };

group('a meal comes once the window has run: each phase its own, shorter as the fight goes on', async () => {
  const bad = [];
  for (let stage = 0; stage < 4; stage++) {
    deepYard(stage, 0);
    let land = 1000;
    for (let k = 0; k < 20; k++) {
      const m = nextMeal(land), wait = m.land - land;
      if (wait < SERPENT_WINDOW[stage] - 1e-9 || wait > SERPENT_WINDOW[stage] + 40) bad.push(`stage ${stage}: ${wait.toFixed(1)}`);
      land = m.land;
    }
  }
  return [
    ok(bad.length === 0, 'every meal waits out its phase\'s window, and not much longer', bad.slice(0, 4).join('; ')),
    ok(SERPENT_WINDOW.every((w, i) => i === 0 || w < SERPENT_WINDOW[i - 1]), 'and each window is shorter than the last', SERPENT_WINDOW.join(' '))
  ];
});

group('when the meal lands the wound closes whole, in one step, and says so', async () => {
  deepYard(1, SERPENT_WOUND[1] / 2);
  const at = S.meal;
  let steps = 0, closed = 0, was = S.serpentWound;
  for (let f = 0; f < 60 * (SERPENT_WINDOW[1] + 45) && S.meal === at; f++) {
    frame();
    if (was - S.serpentWound > 1e-9) { steps++; closed = was - S.serpentWound; }
    was = S.serpentWound;
  }
  return [
    ok(S.meal === at + 1, 'a meal lands', `meal ${at} then ${S.meal}`),
    ok(S.mealT < 1, 'just now, at the end of the window', `${S.mealT}`),
    ok(steps === 1 && S.serpentWound === 0, 'the wound closes whole, in one frame', `${steps} frames, ${S.serpentWound} left`),
    ok(Math.abs(closed - SERPENT_WOUND[1] / 2) < 1, 'by all of it', `${closed}`),
    ok(S.hits.some(h => h.weapon === 'heal' && Math.abs(h.done - closed) < 1e-6), 'and the heal says so once, at the belly')
  ];
});

group('a stun stops the window, and Held does too', async () => {
  deepYard(0, SERPENT_WOUND[0] / 2);
  run(2);
  stunNow();
  const stunned = S.serpentStun > 0, t0 = S.mealT;
  while (S.serpentStun > 0) frame();
  const stunHeld = S.mealT - t0;
  deepYard(0, SERPENT_WOUND[0] / 2);
  run(2);
  lay('held', 0, 3);
  const t1 = S.mealT;
  run(2.5);
  const heldHeld = S.mealT - t1;
  return [
    ok(stunned, 'the blow stuns him'),
    ok(stunHeld < 1e-9, 'the window stands still while he is stunned', `${stunHeld}`),
    ok(heldHeld < 1e-9, 'and while he is Held', `${heldHeld}`)
  ];
});

group('the surge runs the window fast', async () => {
  deepYard(1, 0);
  const m = MECHANICS[1];
  S.mechAt = m.every - m.last + 0.5;            // in the surge, its warning gone by
  const t0 = S.mealT;
  run(2);
  const ran = S.mealT - t0;
  return [ok(Math.abs(ran - 2 * m.x) < 0.2, `two seconds of the surge are ${m.x} times as much of the window`, `${ran.toFixed(2)}s`)];
});

group('a creature already turned for the mouth is eaten, stun or no stun', async () => {
  deepYard(0, SERPENT_WOUND[0] / 2);
  let f = 0;
  while (S.mealI == null && f++ < 60 * (SERPENT_WINDOW[0] + 45)) frame();
  const turnedTo = S.mealI, at = S.meal;
  stunNow();
  while (S.meal === at && f++ < 60 * 120) frame();
  return [
    ok(turnedTo != null, 'a creature turns for the mouth', `${turnedTo}`),
    ok(S.meal === at + 1 && S.eaten.includes(turnedTo), 'and that creature is the one eaten, though he was stunned', `${S.eaten.slice(-3)}`)
  ];
});

group('a break opens the next defense on a fresh window', async () => {
  deepYard(0, 0);
  run(6);
  const ran = S.mealT;
  window.__serpent({ stage: 0, wound: SERPENT_WOUND[0] });
  run(0.1);
  return [
    ok(ran > 5, 'the window had been running', `${ran}`),
    ok(S.serpentStage === 1 && S.mealT < 0.5, 'a break starts the next one from nothing', `stage ${S.serpentStage}, ${S.mealT}s in`)
  ];
});
