// The serpent eats to heal (DESIGN.md, "The serpent eats to heal"): its heal
// is banked as it accrues and lands in one lump when a meal lands, every 6 to
// 12 seconds, chosen fresh each meal. The average is what it always was; only
// the arrival changed. Setup is the serpent's own (test/serpent.test.mjs).

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { SERPENT_HEAL, SERPENT_WOUND, MEAL_MIN_S, MEAL_MAX_S } from '../src/config.js';
import { cycleS, kindOf } from '../src/deep/meals.js';
import { strike } from '../src/deep/serpent.js';
import { bellyAt } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);

function deepYard(stage = 0, wound = 0) {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage, wound });
}

group('the wait is 6 to 12 seconds, differs meal to meal, and is the same every time it is asked', async () => {
  const waits = Array.from({ length: 60 }, (_, n) => cycleS(n));
  const kinds = new Set(Array.from({ length: 60 }, (_, n) => kindOf(n, 8)));
  return [
    ok(waits.every(w => w >= MEAL_MIN_S && w <= MEAL_MAX_S), 'every wait is inside the two ends', `${Math.min(...waits)}..${Math.max(...waits)}`),
    ok(Math.max(...waits) - Math.min(...waits) > 3, 'and they are not on a clock', `${Math.min(...waits)}..${Math.max(...waits)}`),
    ok(waits.every((w, n) => cycleS(n) === w) && kindOf(7, 8) === kindOf(7, 8), 'the same meal asks the same answer'),
    ok(kinds.size === 8, 'and every one of the eight comes', `${kinds.size} of 8`)
  ];
});

group('the heal waits in the bank and the wound closes in one step when the meal lands', async () => {
  deepYard(1, SERPENT_WOUND[1] / 2);
  const start = S.serpentWound, at = S.meal;
  let steps = 0, biggest = 0, was = S.serpentWound, bankAtLand = 0, bankWas = 0;
  for (let f = 0; f < 60 * 14 && S.meal === at; f++) {
    bankWas = S.healBank;
    frame();
    const drop = was - S.serpentWound;
    if (drop > 1e-9) { steps++; biggest = Math.max(biggest, drop); bankAtLand = bankWas; }
    was = S.serpentWound;
  }
  return [
    ok(S.meal === at + 1, 'a meal lands inside twelve seconds', `meal ${at} then ${S.meal}`),
    ok(steps === 1, 'the wound closes in one frame, not a trickle', `${steps} frames closed it`),
    ok(Math.abs(biggest - bankAtLand) < SERPENT_HEAL[1] / 30, 'by the whole of the bank', `closed ${biggest.toFixed(1)}, banked ${bankAtLand.toFixed(1)}`),
    ok(S.healBank < SERPENT_HEAL[1] / 30, 'which is empty after', `${S.healBank}`),
    ok(start - S.serpentWound > SERPENT_HEAL[1] * MEAL_MIN_S * 0.9, 'and it is at least the wait\'s worth of the heal', `${start - S.serpentWound}`),
    ok(S.hits.some(h => h.weapon === 'heal' && h.done > 0), 'and the heal says so once, at the belly')
  ];
});

group('over any run the wound closes by what the trickle closed, less what is still banked', async () => {
  // the bare phase, which has no surge to change the rate
  deepYard(0, SERPENT_WOUND[0] * 0.9);
  const start = S.serpentWound, banked = S.healBank, secs = 70;
  run(secs);
  const closed = start - S.serpentWound + S.healBank - banked;
  const owed = SERPENT_HEAL[0] * secs;
  return [ok(Math.abs(closed - owed) < 1, 'the total is the rate over the time', `${closed.toFixed(1)} against ${owed.toFixed(1)}`)];
});

group('a stun stops the bank filling, and a meal lands all the same', async () => {
  deepYard(1, SERPENT_WOUND[1] / 2);
  const p = bellyAt(now());
  strike('brawler', SERPENT_WOUND[1] / 4, p.x, p.y, null, 1, { stun: 1 });
  const stunned = S.serpentStun > 0, bank = S.healBank, at = S.meal;
  let most = bank;
  while (S.serpentStun > 0) { frame(); most = Math.max(most, S.healBank); }
  return [
    ok(stunned, 'the blow stuns him'),
    ok(most <= bank + 1e-9, 'the bank does not fill while it lasts', `${bank} then ${most}`),
    ok(S.mealT > 0 || S.meal > at, 'but the clock runs and a creature comes', `${S.mealT}`)
  ];
});

group('a break starts the next defense hungry, on a new creature', async () => {
  deepYard(0, 0);
  run(4);
  const bank = S.healBank, at = S.meal;
  window.__serpent({ stage: 0, wound: SERPENT_WOUND[0] });
  run(0.1);
  return [
    ok(bank > 0, 'there was a bank', `${bank}`),
    ok(S.serpentStage === 1 && S.healBank < bank && S.meal === at + 1, 'a break empties it and moves the meal on', `stage ${S.serpentStage}, bank ${S.healBank}, meal ${S.meal}`)
  ];
});
