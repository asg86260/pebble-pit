// The belt runs itself, and nobody stands at the lip holding a load.
//
// The player's save: "nix", a carter with twenty-two in hand, stood at the
// lip of the hole for the rest of the run doing nothing. The belt, like every
// other machine, took the body nearest its post as its tender and the tender
// stage owned that body from then on -- and its post is the lip, which is
// where every hauler comes to tip, so the body it took was one arriving to
// tip. A conveyor is not worked; it is switched on. The belt is `unmanned`
// (machines.js): it runs from the moment it is bought and posts nobody.

import { readFileSync } from 'node:fs';
import { yard, group, ok, state, run, P } from './helpers.mjs';
import { beltRunning } from '../src/dust.js';
import { now } from '../src/clock.js';

group('the belt runs with nobody posted, and a laden body at the lip tips', async () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/belt-lip.json', import.meta.url), 'utf8'));
  yard.restore();
  const S = yard.S;
  const nix = S.workers.find(w => w.name === 'nix');
  const had = nix.carry;
  // the longest any hauler stands at the lip with something in hand, and
  // whether nix ever tips -- by name, since a reload hands back new bodies
  const at = new Map();
  let worst = 0, tipped = false;
  // Thirty-one, not thirty: the reload lands on every fifth second, and
  // whether the belt is running is a stamp the save does not carry
  for (let i = 0; i < 31; i++) {
    run(1);
    for (const w of S.workers) {
      if (w.type !== 'hauler') continue;
      if (w.name === 'nix' && !w.carry) tipped = true;
      const held = w.carry > 0 && Math.abs(w.x - (state().pitX - 36)) < P * 4;
      const n = held ? (at.get(w.name) || 0) + 1 : 0;
      at.set(w.name, n);
      worst = Math.max(worst, n);
    }
  }
  const running = beltRunning(now());
  window.__crew(0, 0);
  return [
    ok(had > 0, 'nix arrives at the lip with a load', `${had} in hand`),
    ok(tipped, 'and tips it', `${tipped}`),
    ok(worst <= 3, 'and nobody stands at the lip holding a load', `${worst} s at the longest`),
    ok(running, 'and the belt is running with nobody posted at it')
  ];
}, 20250830);
