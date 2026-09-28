// The Swordsman's blade meets the coil in one place: every contact of a cut
// or a Whirlwind turn dents the hide once, under the blade, at every rung.

import { group, ok } from './helpers.mjs';
import { SEGMENTS, sauceOf, dentsOf } from '../src/render/attacks.js';

group('a sword contact dents the coil once', () => {
  const out = [];
  for (const R of [0, 4, 8]) for (const move of ['cut', 'whirl']) {
    const sg = SEGMENTS.sword(move, R, {}), S = sauceOf(sg.c, R, sg.hit, 10);
    const each = S.groups.map(gr => dentsOf({ groups: [gr] }, 0, sg.hit).length);
    out.push(ok(each.every(n => n === 1), `rung ${R} ${move}: one dent a contact`, `dents per contact ${each}`));
  }
  return out;
});
