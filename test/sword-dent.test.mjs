// The Swordsman's blade meets the coil in one place, once a move: the cut's
// contact, or the Whirlwind turn the blow lands on, dents the hide once,
// under the blade, at every rung; the other turns cut the air.

import { group, ok } from './helpers.mjs';
import { ATTACKS, SEGMENTS, sauceOf, dentsOf } from '../src/render/attacks.js';

group('a sword contact dents the coil once', () => {
  const out = [];
  // below rung 4 the fight only ever cuts
  for (const [R, move] of [[0, 'cut'], [4, 'cut'], [4, 'whirl'], [8, 'cut'], [8, 'whirl']]) for (const twice of [false, true]) {
    const sg = SEGMENTS.sword(move, R, { twice }), S = sauceOf(sg.c, R, sg.hit, 10);
    const dents = dentsOf(S, sg.hit, sg.hit);
    out.push(ok(dents.length === 1 && Math.abs(dents[0].t0 - sg.hit) < 1e-9,
      `rung ${R} ${move}${twice ? ' twice' : ''}: one dent, when the blow lands`,
      `dents at ${dents.map(d => d.t0.toFixed(2))}, the blow at ${sg.hit.toFixed(2)}`));
  }
  // and the whole page, which a fighter plays before its first swing: one
  // dent a Whirlwind, on the turn that lands
  for (const R of [4, 8]) {
    const c = ATTACKS.sword, S = sauceOf(c, R, 0, 10);
    const n = dentsOf(S, 0, 0).length;
    out.push(ok(n === 1, `rung ${R} whole page: one dent`, `${n} dents`));
  }
  return out;
});

// A held beam bites the hide every tick, a stream and not a string of blows:
// the Mage is never knocked back by a tick, and
// every tick's give is marked a stream's (render/serpent.js leaves the body
// be under it; only the finishing blow makes it flinch).
group("a beam's ticks neither knock the Mage back nor spring the coil", () => {
  const out = [];
  for (const R of [0, 4, 8]) {
    const c = ATTACKS.mage, B = c.BEAM, kicks = [];
    for (let a = B.start; a < c.end(R) - B.surge; a += 0.01) kicks.push(sauceOf(c, R, a, 10).kick);
    const dents = dentsOf(sauceOf(c, R, 0, 10), 0, 0);
    out.push(ok(kicks.every(k => k === 0), `rung ${R}: no knock while the beam is held`, `${Math.max(...kicks)} cells at most`),
             ok(dents.filter(d => !d.stream).length === 1 && dents.filter(d => d.stream).length > 3,
                `rung ${R}: one blow's give, and the rest a stream's`, `${dents.filter(d => d.stream).length} ticks`));
  }
  return out;
});
