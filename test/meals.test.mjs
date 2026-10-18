// The serpent heals whole (DESIGN.md, "The serpent heals whole: a phase is a
// window"): each phase gives the party a window, and as it runs out the
// serpent takes the nearest creature with its constrict (the owner's B,
// docs/mocks/serpent-constrict-meal-2026-10-15.html) and the wound closes
// whole as the swallow lands. A stun or Held stops the window, and a meal
// already under way plays out whatever the window does.
// Setup is the serpent's own (test/serpent.test.mjs).

import { group, ok, yard, run } from './helpers.mjs';
import { SERPENT_WOUND, SERPENT_WINDOW, MEAL_WARN_S, ORB_BOLT_S, ORB_R, MEAL_REEL, MEAL_SKIP, MEAL_BACK_S, P } from '../src/config.js';
import { beatOf, orbOf, mouthAt, mealJaw, mealComb, landAt } from '../src/deep/meals.js';
import { strike } from '../src/deep/serpent.js';
import { lay } from '../src/deep/statuses.js';
import { bellyAt, coilAt } from '../src/deep/place.js';
import { SLOTS, visitAt, faunaAt, slotGone, faunaReport, spanOf } from '../src/deep/fauna.js';
import { deepX0 } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);

// A fresh window at `stage`, the wound set.
function deepYard(stage = 0, wound = 0) {
  // The snatch's facts and nobody down there: the snatch played stands the
  // first station with her fighting at it, and a blow of hers would be in
  // every wound these checks read.
  window.__deepCrew();
  window.__serpent({ stage, wound });
  S.mealT = 0; S.mealGo = null; S.breakT = null;
}
const stunNow = () => { const p = bellyAt(now()); strike('brawler', 1, p.x, p.y, null, 1, { stun: 1 }); };
// Frames until `done`, at most `secs`; the frames it took.
function until(done, secs) { let f = 0; while (!done() && f < secs * 60) { frame(); f++; } return f; }

group('a meal lands as the window runs out: each phase its own, shorter as the fight goes on', async () => {
  const bad = [];
  for (let stage = 0; stage < 4; stage++) {
    deepYard(stage, 0);
    const n = S.meal, f = until(() => S.meal > n, SERPENT_WINDOW[stage] + 20), took = f / 60;
    if (S.meal === n || Math.abs(took - SERPENT_WINDOW[stage]) > 2.5) bad.push(`stage ${stage}: ${took.toFixed(1)}s of ${SERPENT_WINDOW[stage]}`);
  }
  return [
    ok(bad.length === 0, 'every meal lands within a couple of seconds of its window', bad.join('; ')),
    ok(SERPENT_WINDOW.every((w, i) => i === 0 || w < SERPENT_WINDOW[i - 1]), 'and each window is shorter than the last', SERPENT_WINDOW.join(' '))
  ];
});

// The comb is the meal's timer (the owner's A,
// docs/mocks/serpent-comb-timer-2026-10-18.html): it fills over the whole
// window, never back, held by a stun, and is full as the bolts leave.
group('the comb fills over the window and is full as the bolts leave', async () => {
  deepYard(0, 0);
  const W = SERPENT_WINDOW[0], at = [];
  let back = 0, last = 0, stunHeld = null;
  while (!S.mealGo || beatOf().name === 'warn') {
    frame();
    const c = mealComb();
    if (c < last - 1e-9) back++;
    last = c;
    if (!stunHeld && S.mealT >= W / 2) {
      stunNow();
      const was = mealComb(); for (let i = 0; i < 30; i++) frame();
      stunHeld = { was, now: mealComb() };
      for (let i = 0; i < 6 * 60 && S.serpentStun > 0; i++) frame();
    }
    if (at.length < 3 && S.mealT >= W * (at.length + 1) / 4) at.push(mealComb());
    if (S.mealT > W + 10) break;
  }
  const bolts = beatOf()?.name;
  return [
    ok(at.length === 3 && at[0] > 0.15 && at[0] < 0.4 && at[2] > 0.6 && at[2] < 0.95, 'a quarter, half and three quarters into the window it is partly lit, and more each time', at.map(k => k.toFixed(2)).join(' ')),
    ok(back === 0, 'it never goes back while it fills', `${back} frames went back`),
    ok(stunHeld && stunHeld.now === stunHeld.was, 'a stun holds it where it is', JSON.stringify(stunHeld)),
    ok(bolts === 'bolts' && mealComb() === 1 && last > 0.99, 'and it is full as the bolts leave', `${bolts}, ${last}`)
  ];
});

// The meal the way it is seen: the comb, the bolts and the orb closing on the
// nearest creature on the glass, which leaves the walk for the orb; the orb
// hauled to the mouth without a jump, shrinking in held steps, the jaws
// opening as it nears, the gulp, the swallow, the heal; and, as the haul
// begins, the slot's next kind swimming in from just off the side of the
// glass away from the mouth.
group('the meal is the constrict on the nearest creature: taken off the walk, hauled in, swallowed, and its slot filled again', async () => {
  deepYard(1, SERPENT_WOUND[1] / 2);
  window.__view('deep');
  window.__look(coilAt(0, now()).x - S.viewW / 2);
  until(() => S.mealGo, SERPENT_WINDOW[1] + 5);
  const began = !!S.mealGo;
  // the frame before the bolts: who is on the glass, and nearest the mouth
  until(() => S.mealGo.t >= MEAL_WARN_S - 1 / 60, MEAL_WARN_S + 1);
  frame();
  const g = { ...S.mealGo }, taken = visitAt(SLOTS[g.slot], now() / 1000);
  const seen = faunaReport().filter(f => f.slot != null && !MEAL_SKIP.includes(f.kind)
    && f.x > S.camX && f.x < S.camX + S.viewW && f.y > S.camY && f.y < S.camY + S.viewH);
  const offWalk = slotGone(g.slot, now() / 1000) && faunaReport().find(f => f.slot === g.slot).eaten;
  // through the haul and the gulp, a frame at a time
  let jump = 0, was = orbOf(now()), radii = [], opened = 0, end = null, freedIn = null;
  while (S.mealGo && ['bolts', 'reel', 'gulp'].includes(beatOf().name)) {
    frame();
    if (freedIn == null && !slotGone(g.slot, now() / 1000))
      freedIn = { beat: beatOf().name, t: now() / 1000, v: visitAt(SLOTS[g.slot], now() / 1000), p: faunaAt(SLOTS[g.slot], now() / 1000),
                  l: (S.camX - deepX0()) / P, r: (S.camX + S.viewW - deepX0()) / P, tip: (mouthAt(now()).tip.x - deepX0()) / P };
    const o = orbOf(now());
    if (!o) break;
    if (was) jump = Math.max(jump, Math.hypot(o.x - was.x, o.y - was.y));
    if (radii[radii.length - 1] !== o.r) radii.push(o.r);
    opened = Math.max(opened, mealJaw(now()));
    was = o; end = { o, f: mouthAt(now()) };
  }
  const wound = S.serpentWound, n = S.meal, lumpAt = S.mealGo && beatOf().name, reel = S.mealGo && S.mealGo.reel;
  until(() => S.meal > n, 5);
  const healed = S.meal === n + 1 && S.serpentWound === 0 && wound > 0;
  until(() => !S.mealGo, MEAL_BACK_S + 1);
  // the slot let go as the haul began, its next kind just off the glass on
  // the side away from the mouth, and swimming in
  const back = freedIn ? freedIn.v : visitAt(SLOTS[g.slot], now() / 1000), p = freedIn ? freedIn.p : { x: NaN };
  const F = freedIn || { l: 0, r: 0, tip: 0, t: 0 }, fromLeft = F.tip > (F.l + F.r) / 2, span = spanOf(back.kind, p.dir);
  const outside = fromLeft ? p.x + span.r <= F.l + 0.5 : p.x + span.l >= F.r - 0.5;
  const path = [0, 0.5, 1, 1.5].map(d => faunaAt(SLOTS[g.slot], F.t + d).x);
  const inward = path.every((x, i) => i === 0 || (fromLeft ? x > path[i - 1] : x < path[i - 1]));
  return [
    ok(began, 'a meal begins'),
    ok(g.slot != null && !MEAL_SKIP.includes(g.kind) && taken.kind === g.kind, 'the bolts take a creature that fits the orb', `${g.kind}`),
    ok(!seen.length || seen.some(f => f.slot === g.slot), 'one on the glass, there being one', seen.map(f => f.kind).join(' ')),
    ok(offWalk, 'and it leaves the walk for the orb: not drawn twice, not clicked'),
    ok(jump < P * 4, 'the orb is hauled in without a jump', `${(jump / P).toFixed(2)} cells in a frame at most`),
    ok(radii[0] < ORB_R && radii.includes(ORB_R) && radii.slice(radii.indexOf(ORB_R)).join() === '5,4,3', 'it closes, then shrinks 5, 4, 3 in held steps', radii.join(' ')),
    ok(opened === 1, 'the jaws open wide for it', `${opened}`),
    ok(end && Math.hypot(end.o.x - end.f.tip.x, end.o.y - end.f.tip.y) < P * 4, 'and it goes into the mouth', end ? `${Math.round(Math.hypot(end.o.x - end.f.tip.x, end.o.y - end.f.tip.y) / P)} cells off the tip` : ''),
    ok(lumpAt === 'lump', 'then the swallow runs down the body', `${lumpAt}`),
    ok(healed, 'and the heal lands', `meal ${n} then ${S.meal}, wound ${wound} then ${S.serpentWound}`),
    ok(reel >= MEAL_REEL.min && reel <= MEAL_REEL.max, 'the haul took its time', `${reel}s`),
    ok(freedIn && freedIn.beat === 'reel' && back.kind !== g.kind && outside,
       "the slot's next kind comes in as the haul begins, just off the glass away from the mouth",
       `${freedIn && freedIn.beat}: ${back.kind} at x ${p.x.toFixed(1)}, glass ${F.l.toFixed(0)}..${F.r.toFixed(0)}, mouth ${F.tip.toFixed(0)}`),
    ok(inward, 'and swims in', path.map(x => x.toFixed(1)).join(' '))
  ];
});

// With the camera up in the yard nothing is on the glass: the meal takes the
// nearest in the deep all the same, as the bolts leave, never waiting.
group('with nobody on the glass, the meal takes the nearest in the deep without waiting', async () => {
  deepYard(0, SERPENT_WOUND[0] / 2);
  window.__view('yard');
  until(() => S.mealGo, SERPENT_WINDOW[0] + 5);
  const began = !!S.mealGo;
  until(() => S.mealGo.x != null, MEAL_WARN_S + 1);
  const t = S.mealGo.t;
  const n = S.meal;
  until(() => S.meal > n, 15);
  return [
    ok(began, 'a meal begins'),
    ok(Math.abs(t - MEAL_WARN_S) < 2 / 60, 'the bolts leave on the warning\'s end', `${t}s in`),
    ok(S.meal === n + 1 && S.serpentWound === 0, 'and it lands and heals')
  ];
});

group('when the meal lands the wound closes whole, in one step, and says so', async () => {
  deepYard(1, SERPENT_WOUND[1] / 2);
  const at = S.meal;
  let steps = 0, closed = 0, was = S.serpentWound;
  for (let f = 0; f < 60 * (SERPENT_WINDOW[1] + 15) && S.meal === at; f++) {
    frame();
    if (was - S.serpentWound > 1e-9) { steps++; closed = was - S.serpentWound; }
    was = S.serpentWound;
  }
  return [
    ok(S.meal === at + 1, 'a meal lands', `meal ${at} then ${S.meal}`),
    ok(S.mealT < 1, 'just now, and the next window opens', `${S.mealT}`),
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

group('a meal under way plays out, stun or no stun', async () => {
  deepYard(0, SERPENT_WOUND[0] / 2);
  until(() => S.mealGo && S.mealGo.reel != null, SERPENT_WINDOW[0] + 5);
  const kind = S.mealGo && S.mealGo.kind, at = S.meal, left = S.mealGo ? landAt(S.mealGo) - S.mealGo.t : 0;
  stunNow();
  const f = until(() => S.meal > at, 15);
  return [
    ok(kind, 'a creature is in the orb', `${kind}`),
    ok(S.meal === at + 1 && Math.abs(f / 60 - left) < 2 / 60, 'and it is swallowed on its beat, though he was stunned', `${(f / 60).toFixed(2)}s of ${left.toFixed(2)}`)
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
