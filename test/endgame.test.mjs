// The endgame pass: what a driven ram and a running belt do at the top of their
// ladders. See `## The endgame pass` in DESIGN.md.
//
// Two things are checked. The ram waits for a rock to be on the ground before
// it strikes -- it used to hammer the hill the whole way down from the sky, the
// one worker in the yard that did not duck. And a beat of the belt lifts a
// carter's load rather than a single grain, so the band can be tuned to keep up
// with the ram at all.

import { yard, group, ok, state, run, runUntil, openSites, haveRock, buyBuilt } from './helpers.mjs';
import { specOf } from '../src/machines.js';
import { haulCap } from '../src/upgrades.js';
import { beltFrom } from '../src/dust.js';

// A yard with the ram standing and somebody on it.
function rammed() {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(5, 4);
  window.__grant({ sparks: 9999, shards: 999, spores: 999 });
  window.__tip(90000);
  // B1 (wave-feedback3.md, Track B): BUILD_GANG is one body now, not three,
  // so the ram's 180 worker-seconds are one lent body's alone rather than
  // three -- the default `buyBuilt` limit was sized for the old gang.
  buyBuilt('ram', 220);                           // bought, and put up by the hands at the site
  window.__fast(12);                              // the gang shifts, the tender arrives
}

group('the ram does not strike a rock that is still coming down', async () => {
  rammed();
  haveRock();
  const before = state();

  // The last of this rock goes, and the next one comes down out of the sky.
  window.__next();
  // A frame at a time: the fall is under a second, and `runUntil` steps a whole
  // second, which would skip the entire thing.
  for (let i = 0; i < 1200 && !(yard.S.rockFall > 0); i++) run(1 / 60);
  const falling = yard.S.rockFall > 0;
  const ram = yard.S.machines.ram;
  // The tender is put at its post for the fall. A new rock's face is back at
  // the near end and the tender is still walking over from where the last one
  // finished, so left alone the machine is simply unmanned while the rock is in
  // the air and the check would pass by saying nothing. What is being checked
  // is the machine's own rule, so the body is stood where the rule is asked.
  const tender = yard.S.workers.find(w => w.type === 'rockhand');
  const post = specOf('ram').tendAt();
  if (tender) { tender.x = post; tender.walking = false; tender.route = null; tender.walkTo = null; }
  const workedAtStart = ram.workedAt || 0;
  // Every frame of the fall: nothing off the hill.
  let struck = 0, frames = 0;
  while (yard.S.rockFall > 0 && frames < 600) {
    run(1 / 60);
    frames++;
    if ((ram.workedAt || 0) > workedAtStart) struck++;
  }
  const landedAt = yard.S.boulderNo;
  // And once it is down, the ram goes back to work. Generously: `ready` also
  // waits for room on the rock's heap, and with the gang straight back on the
  // face after a landing (no dance after rock one, wave polish 2026-09-14) the
  // heap stays full longer than it did while they danced. How long the haulers
  // take to make room is a fact about the heap, not about the ram's rule.
  const worked = runUntil(() => (ram.workedAt || 0) > workedAtStart, 60);

  return [
    ok(before.rock > 0 && ram.bought, 'the ram is standing at a rock', `bought ${ram.bought}`),
    ok(falling, 'a new rock comes down from the sky', `fall ${yard.S.rockFall}`),
    ok(frames > 0 && struck === 0, 'and the ram strikes nothing while it is in the air',
       `${struck} strikes over ${frames} frames of fall`),
    ok(worked, 'then strikes once it is on the ground', `rock ${landedAt}`)
  ];
});

group('a beat of the belt lifts a load, not a grain', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__levels({ haulCarryLevel: 5 });
  window.__crew(0, 6);
  window.__grant({ sparks: 9999, shards: 999, spores: 999 });
  window.__tip(9000);
  window.__machine('belt', { bought: true });
  // Dust on the run, out by the rock where the band starts.
  window.__pile(beltFrom() + 30, 200);
  yard.S.belt = [];
  const load = haulCap();
  const spec = specOf('belt');
  const one = spec.bite(null, 1);
  const onBand = yard.S.belt.length;
  const three = spec.bite(null, 3);
  const after = yard.S.belt.length;
  return [
    ok(load > 1, 'a carter carries more than one', `${load}`),
    ok(one === 1 && onBand === load, 'one beat puts one load on the band',
       `${onBand} grains for ${load} a load, answered ${one}`),
    ok(three === 3 && after === load * 4, 'and three beats asked at once put three',
       `${after - onBand} grains, answered ${three}`)
  ];
});
