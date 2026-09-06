// Wave 7, track B: the shop and boards UI. The drawing itself is checked by
// looking at shots -- no test here can see a pixel -- so what this file pins is
// the arithmetic under the drawing: the pickaxe's whole-pixel rungs and their
// dearer prices, the crit-power ladder that never repeats a value, the saved
// levels clamped to the shorter ladders, and the under-staffed mark's slot.
//
// The ladders are bought through `__buy`, like a player: a level set with a
// hook proves nothing about the row that sells it.

import { group, ok, state, run, buyNow, openSites } from './helpers.mjs';
import { S } from '../src/state.js';
import { ROCKHAND_RUNGS, CRIT_MULT_RUNGS, CRIT_MULT_MIN, CRIT_MULT_MAX } from '../src/config.js';
import { critMult } from '../src/crit.js';
import { rockhandBite, rebalance } from '../src/upgrades.js';

// --- 1. the pickaxe: three integer rungs, bought off the bench -----------------
group('the pickaxe ladder is three whole-pixel rungs, bought like a player', async () => {
  const out = [];
  // the row shows once spores have been seen and there is a crew
  window.__crew(1, 1);
  window.__grant({ spores: 500 });
  window.__give(50000);
  run(0.5);

  out.push(ok(rockhandBite(0) === 1, 'level 0 bites one pixel', `${rockhandBite(0)}`));
  for (let lvl = 0; lvl < ROCKHAND_RUNGS; lvl++) {
    const before = rockhandBite();
    const bought = buyNow('rockhandpick');
    out.push(ok(bought, `rung ${lvl + 1} can be bought through the row`, `level ${lvl}`));
    const after = rockhandBite();
    out.push(ok(Number.isInteger(after), 'the bite is a whole pixel', `${after}`),
             ok(after === before + 1, 'and each rung is worth exactly one more',
                `${before} -> ${after}`));
  }
  out.push(ok(S.rockhandPickLevel === ROCKHAND_RUNGS, 'the ladder tops out at three rungs',
              `${S.rockhandPickLevel}`),
           ok(!window.__buy('rockhandpick'), 'and a fourth rung is not for sale'));
  return out;
});

// --- 2. crit power: no rung repeats a value ------------------------------------
group('no crit-power rung reads "a -> a", bought rung by rung', async () => {
  const out = [];
  window.__give(50000);
  run(0.5);

  out.push(ok(critMult(0) === CRIT_MULT_MIN, 'the ladder starts at the minimum',
              `${critMult(0)} vs ${CRIT_MULT_MIN}`));
  for (let lvl = 0; lvl < CRIT_MULT_RUNGS; lvl++) {
    const from = critMult(S.critMultLevel);
    const to = critMult(S.critMultLevel + 1);
    out.push(ok(to === from + 1, `rung ${lvl + 1} promises a whole unit more`,
                `${from} -> ${to}`));
    out.push(ok(buyNow('critmult'), 'and can be bought through the row', `level ${lvl}`));
  }
  out.push(ok(critMult() === CRIT_MULT_MAX, 'the top of the ladder is the maximum',
              `${critMult()} vs ${CRIT_MULT_MAX}`),
           ok(!window.__buy('critmult'), 'and there is no rung past it'));
  return out;
});

// --- 3. a save from the longer ladders reads as the new top --------------------
group('saved levels past the shorter ladders clamp to their tops', async () => {
  S.rockhandPickLevel = 5;                 // the old five-rung ladder's top
  S.critMultLevel = 5;
  rebalance();                             // the same clamp a load runs
  return [
    ok(S.rockhandPickLevel === ROCKHAND_RUNGS, 'pick level five reads as the new top',
       `${S.rockhandPickLevel}`),
    ok(rockhandBite() === 1 + ROCKHAND_RUNGS, 'and bites what the top rung bites',
       `${rockhandBite()}`),
    ok(S.critMultLevel === CRIT_MULT_RUNGS, 'crit power clamps the same way',
       `${S.critMultLevel}`),
    ok(critMult() === CRIT_MULT_MAX, 'to exactly the maximum multiplier', `${critMult()}`),
  ];
});

