// The serpent eats to heal (DESIGN.md, "The serpent eats to heal"): its heal
// is banked as it accrues and lands in one lump when a meal lands, every 6 to
// 12 seconds, chosen fresh each meal. The average is what it always was; only
// the arrival changed. Setup is the serpent's own (test/serpent.test.mjs).

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { SERPENT_HEAL, SERPENT_WOUND, MEAL_MIN_S, MEAL_MAX_S } from '../src/config.js';
import { nextMeal } from '../src/deep/meals.js';
import { strike } from '../src/deep/serpent.js';
import { bellyAt } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);

// The meal's clock set back to the top of a wait, so each check counts from a
// fresh one whatever the setup ran.
function deepYard(stage = 0, wound = 0) {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage, wound });
  S.mealT = 0; S.healBank = 0;
}

group('meals come as creatures reach the mouth: never sooner than the shortest wait, never past the ceiling', async () => {
  // forty meals in a row off one landing, as the clock alone would give them
  const waits = [], kinds = new Set(), eaten = new Set();
  let land = 1000;
  for (let k = 0; k < 40; k++) { const m = nextMeal(land); waits.push(m.land - land); kinds.add(m.kind); eaten.add(m.i); land = m.land; }
  const mean = waits.reduce((a, b) => a + b, 0) / waits.length;
  return [
    ok(waits.every(w => w >= MEAL_MIN_S - 1e-9 && w <= MEAL_MAX_S), 'every wait is between the shortest and the ceiling', `${Math.min(...waits).toFixed(1)}..${Math.max(...waits).toFixed(1)}`),
    ok(mean >= 7 && mean <= 13, 'about every nine seconds on average', mean.toFixed(1)),
    ok(eaten.size === 40, 'each meal a different creature', `${eaten.size}`),
    ok(kinds.size >= 6, 'and most of the eight come', `${kinds.size} of 8`),
    ok(nextMeal(1000).i === nextMeal(1000).i, 'the same landing asks the same answer')
  ];
});

group('the heal waits in the bank and the wound closes in one step when the meal lands', async () => {
  deepYard(1, SERPENT_WOUND[1] / 2);
  const start = S.serpentWound, at = S.meal;
  let steps = 0, biggest = 0, was = S.serpentWound, bankAtLand = 0, bankWas = 0;
  for (let f = 0; f < 60 * (MEAL_MAX_S + 2) && S.meal === at; f++) {
    bankWas = S.healBank;
    frame();
    const drop = was - S.serpentWound;
    if (drop > 1e-9) { steps++; biggest = Math.max(biggest, drop); bankAtLand = bankWas; }
    was = S.serpentWound;
  }
  return [
    ok(S.meal === at + 1, 'a meal lands inside the ceiling', `meal ${at} then ${S.meal}`),
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
