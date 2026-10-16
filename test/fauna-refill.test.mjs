// The deep stays populated through the serpent's meals (the owner,
// 2026-10-15: "it looks like we are at a deficit for abyss creatures now.
// theres only one i see and all of them are getting eaten"). Every meal
// takes a slot's swimmer; the slot's next kind fades in somewhere in the
// water once the swallow lands (FAUNA_REFILL), rather than swimming back in
// from beyond an end, which at the deep's paces took longer than a window.
// So over minutes of meals the deep holds its turns, a slot short only
// while a meal has its creature, and the same after a refresh.
//
// `reload: false` because the group makes its own refresh at a chosen point,
// the way serpent-reload.test.mjs does: a real refresh starts the page's
// clock again near nought.

import { group, ok, yard } from './helpers.mjs';
import { FAUNA_TURNS, FAUNA_REFILL } from '../src/config.js';
import { SLOTS, COLS, wanderAt, visitAt, reachOf } from '../src/deep/fauna.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);
const refresh = () => window.__cold({ clock: 1000 });

// The swimmers with any part over the deep, not in the serpent's keeping.
function swimming() {
  const t = now() / 1000;
  return SLOTS.filter(c => { const w = wanderAt(c, t); return !w.gone && w.x > -reachOf(visitAt(c, t)) && w.x < COLS; }).length;
}

group('through minutes of meals the deep keeps its turns, a slot short only while a meal holds one, across a refresh', async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  // the last phase's window, the shortest: the most meals a minute
  window.__serpent({ stage: 3, wound: 0 });
  window.__view('deep');
  const N = FAUNA_TURNS.slots, secs = 360, m0 = S.meal;
  let short = 0, run = 0, longest = 0, total = 0, lowest = N;
  for (let s = 1; s <= secs; s++) {
    for (let f = 0; f < 60; f++) frame();
    if (s === secs / 2) refresh();
    const n = swimming();
    total += n;
    lowest = Math.min(lowest, n);
    // one out past an end on its lap's wrap is the turns' own; two short is
    // the deficit
    if (n < N - 1) short++;
    // and a slot held by a meal, how long it stays empty
    const t = now() / 1000;
    run = SLOTS.some(c => wanderAt(c, t).gone) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  const meals = S.meal - m0, mean = total / secs;
  return [
    ok(meals >= 10, 'the serpent eats through the run', `${meals} meals in ${secs}s`),
    ok(short <= secs * 0.05, `the deep is seldom down to fewer than ${N - 1} swimmers`, `${short}s of ${secs} below, lowest ${lowest}`),
    ok(mean >= N - 0.5, `and holds ${N} most of the time`, `mean ${mean.toFixed(2)} of ${N}`),
    ok(longest <= FAUNA_REFILL.emptyS, `an eaten swimmer's slot is filled again within ${FAUNA_REFILL.emptyS}s`, `longest ${longest}s empty`),
  ];
}, { reload: false });
