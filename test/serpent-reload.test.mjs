// The serpent's window across a page refresh (DESIGN.md, "The serpent heals
// whole: a phase is a window"): a refresh in the middle of a phase hands the
// party no free time. The window counts on from where it stood, a creature
// already swimming for the mouth still lands on its beat, and a yard
// refreshed every few seconds, as a dev session's hot reloads come, is still
// eaten at and healed.
//
// A real refresh starts the page's clock again near nought, so each one here
// is `__cold` with a new page's clock. `reload: false` because each group
// makes its own refreshes at chosen points.

import { group, ok, yard } from './helpers.mjs';
import { mealNow, windowS } from '../src/deep/meals.js';
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

group('a refresh late in the window keeps it counting, and the meal lands on its beat', async () => {
  deepYard();
  const ate = toMeal();
  // On into the window until the next creature has turned for the mouth.
  for (let f = 0; f < 60 * 120 && S.mealI == null; f++) frame();
  for (let f = 0; f < 30; f++) frame();
  const before = { t: S.mealT, at: S.phaseAt, i: S.mealI, toLand: mealNow().toLand, meal: S.meal, clock: now() };
  refresh();
  const after = { t: S.mealT, at: S.phaseAt, toLand: mealNow().toLand, clock: now() };
  let g = 0;
  for (; g < 60 * 30 && S.meal === before.meal; g++) frame();
  const landedIn = g / 60;
  return [
    ok(ate, 'a meal lands before the refresh'),
    ok(before.i != null, 'and the next creature has turned for the mouth', `mealI ${before.i}`),
    ok(after.clock < before.clock, 'the refresh starts the page\'s clock again', `${before.clock} -> ${after.clock}`),
    ok(Math.abs(after.t - before.t) < 1e-6 && Math.abs(after.at - before.at) < 1e-6,
       'the window\'s count is the same after it', `mealT ${before.t} -> ${after.t}, phaseAt ${before.at} -> ${after.at}`),
    ok(Math.abs(after.toLand - before.toLand) < 0.05, 'and the meal is as far off as it was',
       `${before.toLand.toFixed(2)}s -> ${after.toLand.toFixed(2)}s`),
    ok(S.meal === before.meal + 1 && Math.abs(landedIn - before.toLand) < 0.1, 'and it lands on that beat',
       `meal ${before.meal} -> ${S.meal}, in ${landedIn.toFixed(2)}s of ${before.toLand.toFixed(2)}`)
  ];
}, { reload: false });

group('a refresh early in the window keeps it counting from where it stood', async () => {
  deepYard();
  toMeal();
  for (let f = 0; f < 60 * (windowS() - 12); f++) frame();
  const before = { t: S.mealT, toLand: mealNow().toLand, meal: S.meal, i: S.mealI };
  refresh();
  const after = { t: S.mealT, toLand: mealNow().toLand };
  let g = 0;
  for (; g < 60 * 60 && S.meal === before.meal; g++) frame();
  return [
    ok(before.i == null, 'nothing has turned for the mouth yet', `mealI ${before.i}`),
    ok(Math.abs(after.t - before.t) < 1e-6, 'the window\'s count is the same after it', `${before.t} -> ${after.t}`),
    ok(after.toLand < before.toLand + 15, 'and the meal no further off than the stream\'s next creature',
       `${before.toLand.toFixed(2)}s -> ${after.toLand.toFixed(2)}s`),
    ok(S.meal === before.meal + 1 && g / 60 < before.toLand + 15, 'and it lands', `in ${(g / 60).toFixed(1)}s`)
  ];
}, { reload: false });

group('refreshed every few seconds, as hot reloads come, the serpent still eats and heals', async () => {
  deepYard();
  const was = fighting();
  toMeal();
  const meals = S.meal, heals = [];
  let wound = 0;
  // Three windows and a stream's slot each, a refresh every three seconds.
  const secs = 3 * (windowS() + 20);
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
