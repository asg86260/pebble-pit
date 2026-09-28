// The Swordsman's blade meets the coil in one place, once a move: the cut's
// contact, or the Whirlwind turn the blow lands on, dents the hide once,
// under the blade, at every rung; the other turns cut the air.

import { group, ok } from './helpers.mjs';
import { SEGMENTS, sauceOf, dentsOf } from '../src/render/attacks.js';

group('a sword contact dents the coil once', () => {
  const out = [];
  for (const R of [0, 4, 8]) for (const move of ['cut', 'whirl']) for (const twice of [false, true]) {
    const sg = SEGMENTS.sword(move, R, { twice }), S = sauceOf(sg.c, R, sg.hit, 10);
    const dents = dentsOf(S, sg.hit, sg.hit);
    out.push(ok(dents.length === 1 && Math.abs(dents[0].t0 - sg.hit) < 1e-9,
      `rung ${R} ${move}${twice ? ' twice' : ''}: one dent, when the blow lands`,
      `dents at ${dents.map(d => d.t0.toFixed(2))}, the blow at ${sg.hit.toFixed(2)}`));
  }
  return out;
});
