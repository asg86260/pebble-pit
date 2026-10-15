// The serpent's window across a page refresh (DESIGN.md, "The serpent heals
// whole: a phase is a window"): a refresh in the middle of a phase hands the
// party no free time. The window counts on from where it stood, a meal under
// way finishes on its beat with its creature still in the orb, and a yard
// refreshed every few seconds, as a dev session's hot reloads come, is still
// eaten at and healed.
//
// A real refresh starts the page's clock again near nought, so each one here
// is `__cold` with a new page's clock. `reload: false` because each group
// makes its own refreshes at chosen points.

import { group, ok, yard } from './helpers.mjs';
import { windowS, landAt } from '../src/deep/meals.js';
import { slotGone } from '../src/deep/fauna.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);
// A fresh page's clock: a second in, whatever the old page had run to.
const refresh = () => window.__cold({ clock: 1000 });

// Past the snatch, the way the game is played: the first station stands
// with her at it, hitting the serpent.
function deepYard() {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__serpent({ stage: 0, wound: 0 });
}
const fighting = () => S.stations.length > 0 && S.stations[0].fighter != null;

// Run until a meal lands, at most `limit` seconds.
function toMeal(limit = 120) {
  const n = S.meal;
  for (let f = 0; f < 60 * limit && S.meal === n; f++) frame();
  return S.meal > n;
}

group('a refresh mid-meal finishes the meal: the creature still in the orb, on its beat, and never back on the walk', async () => {
  deepYard();
  const ate = toMeal();
  // On into the window until the next meal has its creature, a little into
  // the haul (the last one's slot let go first).
  for (let f = 0; f < 60 * 30 && S.mealGo; f++) frame();
  for (let f = 0; f < 60 * 120 && !(S.mealGo && S.mealGo.reel != null); f++) frame();
  for (let f = 0; f < 20; f++) frame();
  const g = S.mealGo && { ...S.mealGo }, left = g ? landAt(g) - g.t : 0;
  const before = { t: S.mealT, at: S.phaseAt, meal: S.meal, clock: now() };
  refresh();
  const after = { t: S.mealT, at: S.phaseAt, clock: now(), go: S.mealGo && { ...S.mealGo } };
  const held = g && slotGone(g.slot, now() / 1000);
  let seen = false, f = 0;
  for (; f < 60 * 30 && S.meal === before.meal; f++) {
    frame();
    if (!slotGone(g.slot, now() / 1000)) seen = true;
  }
  return [
    ok(ate, 'a meal lands before the refresh'),
    ok(g && g.kind, 'and the next has a creature in its orb', g ? `${g.kind}, ${g.t.toFixed(2)}s in` : 'none'),
    ok(after.clock < before.clock, "the refresh starts the page's clock again", `${before.clock} -> ${after.clock}`),
    ok(Math.abs(after.t - before.t) < 1e-6 && Math.abs(after.at - before.at) < 1e-6,
       "the window's count is the same after it", `mealT ${before.t} -> ${after.t}, phaseAt ${before.at} -> ${after.at}`),
    ok(after.go && JSON.stringify(after.go) === JSON.stringify(g), 'and the meal is where it was, its creature and its spot',
       JSON.stringify(after.go)),
    ok(held && !seen, 'its creature is in the orb on the new page, not swimming'),
    ok(S.meal === before.meal + 1 && Math.abs(f / 60 - left) < 0.1, 'and it lands on its beat',
       `meal ${before.meal} -> ${S.meal}, in ${(f / 60).toFixed(2)}s of ${left.toFixed(2)}`)
  ];
}, { reload: false });

group('a refresh early in the window keeps it counting from where it stood', async () => {
  deepYard();
  toMeal();
  for (let f = 0; f < 60 * (windowS() - 12); f++) frame();
  const before = { t: S.mealT, meal: S.meal, go: S.mealGo };
  refresh();
  const after = { t: S.mealT };
  let g = 0;
  for (; g < 60 * 60 && S.meal === before.meal; g++) frame();
  return [
    ok(before.go == null, 'no meal has begun yet', JSON.stringify(before.go)),
    ok(Math.abs(after.t - before.t) < 1e-6, "the window's count is the same after it", `${before.t} -> ${after.t}`),
    ok(S.meal === before.meal + 1 && Math.abs(g / 60 + before.t - windowS()) < 2.5, 'and the meal lands as the window runs out',
       `in ${(g / 60).toFixed(1)}s, ${before.t.toFixed(1)}s into a window of ${windowS()}`)
  ];
}, { reload: false });

group('refreshed every few seconds, as hot reloads come, the serpent still eats and heals', async () => {
  deepYard();
  const was = fighting();
  toMeal();
  const meals = S.meal, heals = [];
  let wound = 0;
  // Three windows and some, a refresh every three seconds.
  const secs = 3 * (windowS() + 5);
  for (let f = 1; f <= 60 * secs; f++) {
    const n = S.meal;
    wound = S.serpentWound;
    frame();
    if (S.meal > n) heals.push({ wound: Math.round(wound), left: Math.round(S.serpentWound) });
    if (f % 180 === 0) refresh();
  }
  return [
    ok(was, 'a fighter is at the first station'),
    ok(S.meal - meals >= 3, 'the serpent eats at the end of each window', `${S.meal - meals} meals in ${secs}s, ${secs / 3} refreshes`),
    ok(heals.some(h => h.wound > 0 && h.left === 0), 'and a meal closes the wound she opened', JSON.stringify(heals))
  ];
}, { reload: false });
