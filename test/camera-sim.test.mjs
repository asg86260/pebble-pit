// The yard does not care where you are looking. A seeded run is the same run
// whether the view sits over the pit, over the farm or pans between them the
// whole time: the camera decides what is drawn, never what happens. The air's
// motes live on the glass and the lightning starts across the view, so both
// draw from streams of their own; were either on the yard's `rand()`, a
// scroll would move every roll after it and the same seed would be two runs.

import { group, ok, state, run } from './helpers.mjs';
import { S, floor, pit } from '../src/state.js';
import { count } from '../src/grid.js';
import { rngState } from '../src/rng.js';

const SECONDS = 60;

// A busy yard under a full storm: bodies walking (the air's dust comes off
// their boots), both sites open, the sky at its cap and a front on the way,
// so the rain, the muck and the lightning are all in it.
function busyStorm() {
  window.__crew(4, 3, 2, 2);
  window.__air({ haze: state().smog.cap });
  window.__front(1);
}

// The facts of the run: the generator's word, where everybody is, the dust in
// both grids, the muck the rain laid, the haze left and what is banked.
function facts() {
  return JSON.stringify({
    rng: rngState(),
    tick: S.tick,
    who: S.workers.map(w => `${w.type}:${w.x.toFixed(2)},${w.y.toFixed(2)}`),
    floor: count(floor), pit: count(pit),
    muck: S.muck.join(''),
    haze: S.haze, stored: S.stored, banked: S.banked, rains: S.rains
  });
}

// One run from the seed with the camera put wherever `camAt(frame)` says,
// every frame.
function runWith(seed, camAt) {
  window.__seed(seed);
  busyStorm();
  const log = [];
  for (let f = 0; f < SECONDS * 60; f++) {
    window.__look(camAt(f));
    run(1 / 60);
    if (f % 60 === 59) log.push(facts());
  }
  return log;
}

group('the same seed is the same yard wherever the camera is', async () => {
  const seed = 20250830;
  const still = runWith(seed, () => 0);
  // Across the world and back every twenty seconds.
  const panned = runWith(seed, f => (S.worldW - S.viewW) * (0.5 - 0.5 * Math.cos(f / 600 * Math.PI)));
  const at = still.findIndex((v, i) => v !== panned[i]);
  return [
    ok(at < 0, 'every second of the run agrees',
       at < 0 ? '' : `second ${at + 1}:\n    still  ${still[at].slice(0, 300)}\n    panned ${panned[at].slice(0, 300)}`),
    ok(JSON.parse(still.at(-1)).rains >= 1, 'and it rained in it', `rains ${JSON.parse(still.at(-1)).rains}`),
  ];
});
