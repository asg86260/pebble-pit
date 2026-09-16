// A player's save, reported 2026-09-13: on every refresh the quarriers floated
// up out of the cut, ran off to the right (and one clear across the yard to the
// left), then walked back and worked. The save caught the gang mid-descent --
// `goal: 'down'` -- and `seat`, the spot in the cut a descending body heads
// for, is not persisted (it is a live target into a cut that may have moved).
// So they came back with the factory's `seat: 0`, the left edge of the world,
// and walked the width of the yard toward it before anything put them right.
// The fix: a seat outside the walls is no seat, and the down leg makes a real
// one. See quarry.js.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run, runUntil, WORKER } from './helpers.mjs';
import { persist } from '../src/persist.js';
import { S, quarry } from '../src/state.js';

const S_ = yard.S;
const quarriers = () => S_.workers.filter(w => w.type === 'quarrier');
const inCut = w => w.x + WORKER > quarry.x && w.x < quarry.x + quarry.w;
const dug = () => (S_.quarryCells || []).reduce((a, b) => a + b, 0);

// The fixture carries no ground blobs (it was trimmed to what matters), so a
// generated yard of the same shape lends its boulder, floor, pit and cut -- the
// same trick test/stuck-yard.test.mjs uses.
const load = () => {
  window.__reset(); window.__crew(3, 6, 5, 3); window.__fullSites(); window.__tip(90000); run(2);
  persist();
  const ground = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  const save = JSON.parse(readFileSync(new URL('./fixtures/quarry-rim-refresh.json', import.meta.url), 'utf8'));
  for (const k of ['boulder', 'gw', 'gh', 'floor', 'pit', 'cut', 'muck', 'poop', 'rockSand', 'meteorCells', 'noticeboard'])
    if (k in ground) save[k] = ground[k];
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
  yard.restore();
};

group('the gang from the rim-refresh save goes into the cut, not off across the yard', async () => {
  load();
  ok(quarriers().every(w => !inCut(w)), 'the save has them out of the cut to begin with');
  // Nobody keeps walking away from the cut. Before the fix the gang headed for
  // x=0 and just kept going -- hundreds of pixels further left every second,
  // never turning round. The cut is to the gang's right, so a body on its way
  // IN is never further left than where the save stood it, give or take an
  // elbow. Measured off the save rather than off the cut's wall, because the
  // wall moves with the yard's layout and the save's bodies do not.
  const startLeft = Math.min(...quarriers().map(w => w.x));
  let leftmost = Infinity;
  for (let i = 0; i < 40; i++) { run(0.25); leftmost = Math.min(leftmost, ...quarriers().map(w => w.x)); }
  // They are down in the cut and digging: the count climbs over a window short
  // enough not to straddle a fill (a near-done cut refills and the tally resets).
  const working = quarriers().filter(inCut).length;
  const before = S_.quarryTotal || 0;                 // cumulative: never resets on a fill
  const went = runUntil(() => (S_.quarryTotal || 0) > before + 3, 6);
  return [
    ok(quarriers().length === 5, 'all five come back', `${quarriers().length}`),
    ok(leftmost >= startLeft - WORKER * 2, 'none runs off across the yard', `leftmost ${Math.round(leftmost)} vs started at ${Math.round(startLeft)}`),
    ok(working >= 4, 'they end up down in the cut', `${working} of 5 in the walls`),
    ok(went, 'and the cut is being dug', `${before} -> ${dug()}`)
  ];
});
