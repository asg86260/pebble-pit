// A player's save, reported 2026-09-22: haulers crossing the quarry went down
// the ladder instead of over the bridge, walked the cut's floor to its far
// wall, climbed out and went down again, for ever. They were fetching the
// cut's own dust -- but the columns they claimed sat where the quarry stood
// at boot. Loading the save walks the sites in the player's build order,
// which seats the quarry somewhere else; the quarry and the bodies down it
// moved with the seat, the cut's sand grid did not. So every column's spot
// was a thousand pixels past the far wall, and a route to it ran down the
// ladder and along the floor to the end. See `seatSites` in world.js.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run, WORKER } from './helpers.mjs';

const S_ = yard.S;
const q = yard.quarry;

group('haulers go down the cut only for dust that is there, and not in a crowd', async () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/quarry-crossing.json', import.meta.url), 'utf8'));
  yard.restore();
  run(1);                                          // the sites are walked again
  const cut = (await import('../src/state.js')).cut;
  const down = w => w.y + WORKER > S_.groundY + WORKER && w.x + WORKER > q.x && w.x < q.x + q.w;
  // A wasted trip is a hauler that climbs down and comes back up with nothing
  // more in its hands than it went down with. On this save, before the fix,
  // the haulers made dozens a minute: the grid's columns were a thousand
  // pixels past the far wall, and once that was mended one grain sliding
  // down the floor still called a fresh hauler down at every column it
  // crossed. A grain the quarrier tidies first can waste the one trip sent
  // for it, so a few are allowed; a crowd is not.
  let wasted = 0, trips = 0;
  const went = new Map();                          // body -> carry when it went down
  for (let i = 0; i < 30 * 10; i++) {
    run(0.1);
    for (const w of S_.workers) {
      if (w.type !== 'hauler') continue;
      if (down(w)) { if (!went.has(w)) went.set(w, w.carry || 0); continue; }
      if (went.has(w)) { trips++; if ((w.carry || 0) <= went.get(w)) wasted++; went.delete(w); }
    }
  }
  return [
    ok(cut.x === q.x, "the cut's sand sits under the quarry", `cut.x ${cut.x}, quarry.x ${q.x}`),
    ok(wasted <= 4, 'nobody climbs down for nothing, over and over', `${wasted} of ${trips} trips down came back empty in 30s`)
  ];
});
