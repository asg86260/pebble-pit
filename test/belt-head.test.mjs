// A lift on the belt's scoop stays on the band until it joins it.
//
// The player's save: a late yard whose air held thousands of grains with no
// position. The scoop creeps a grain forward while it climbs, and a long
// climb at the head end of the run crept it off the band's last column; past
// the head it was taken for a rider on the ramp, with no row and no throw,
// and flicked off the lip as a grain whose every coordinate was NaN. Such a
// grain never lands, so it never leaves, and every distance test calls it
// near: a click anywhere caught a handful of them and threw them as real
// pebbles. The rule that watches it is verify.js rule 19; this file walks
// the player's yard through the creep.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run, P } from './helpers.mjs';
import { beltTo, beltReach, loadBelt } from '../src/dust.js';

group('a lift near the head joins the band and leaves the lip with a place', async () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/click-pebbles.json', import.meta.url), 'utf8'));
  yard.restore();
  const S = yard.S;
  // Grains scooped off the ground at the head end of the run, under a band
  // heaped tall there: the longest climbs the scoop makes, each creeping
  // toward the head the whole way up.
  for (let i = 0; i < 12; i++) loadBelt(beltReach() - (i % 3) * P, S.groundY - P, 1 + (i % 4));
  const head = beltTo();
  let past = 0, nowhere = 0;
  for (let f = 0; f < 600; f++) {
    run(1 / 30);
    past += S.belt.filter(b => b.r == null && b.x >= head).length;
    nowhere += S.chips.filter(c => !Number.isFinite(c.x) || !Number.isFinite(c.y)).length;
  }
  return [
    ok(past === 0, 'no lift creeps past the head off the band', `${past} lift-frames past it`),
    ok(nowhere === 0, 'and nothing leaves the lip without a place', `${nowhere} grain-frames with none`)
  ];
}, 20250830);
