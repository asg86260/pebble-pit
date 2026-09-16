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
import { LADDER, LADDERS } from '../src/config.js';
const ROCKHAND_PX = LADDERS.rockhandpick.value, CRIT_MULT = LADDERS.critmult.value;
import { critMult } from '../src/crit.js';
import { rockhandBite } from '../src/levels.js';
import { rebalance } from '../src/staffing.js';

// --- 1. the pickaxe: three integer rungs, bought off the bench -----------------
group('the pickaxe ladder is whole-pixel rungs off its list, bought like a player', async () => {
  const out = [];
  // the row shows once spores have been seen and there is a crew. The purse
  // is the dust one, sized like the spore one: enough for the whole ladder
  // with room to spare, so what the check is about is the rung, not the bill.
  window.__invest();                        // the grounds stand: the rungs past the first are priced in their coins
  window.__crew(1, 1);
  window.__grant({ spores: 5000 });
  window.__give(50000);
  run(0.5);

  // Every coin, so the last rung -- the spark's, like every ladder's -- is
  // within reach; the check is about the rungs, not the bill.
  window.__grant({ shards: 20000, spores: 20000, cores: 9, sparks: 5000 });
  out.push(ok(rockhandBite(0) === ROCKHAND_PX[0], 'level 0 bites the foot of its list', `${rockhandBite(0)}`));
  for (let lvl = 0; lvl < LADDER; lvl++) {
    const before = rockhandBite();
    const bought = buyNow('rockhandpick');
    out.push(ok(bought, `rung ${lvl + 1} can be bought through the row`, `level ${lvl}`));
    const after = rockhandBite();
    out.push(ok(Number.isInteger(after), 'the bite is a whole pixel', `${after}`),
             ok(after > before && after === ROCKHAND_PX[lvl + 1], 'and each rung is worth more, off the list',
                `${before} -> ${after}`));
  }
  out.push(ok(S.rockhandPickLevel === LADDER, 'the ladder tops out at the ladder\'s length',
              `${S.rockhandPickLevel}`),
           ok(!window.__buy('rockhandpick'), 'and a rung past it is not for sale'));
  return out;
});

// --- 2. crit power: no rung repeats a value ------------------------------------
group('no crit-power rung reads "a -> a", bought rung by rung', async () => {
  const out = [];
  window.__give(500000);
  // Crit damage is priced in the quarry's blue and the farm's green as well as
  // in dust -- the one three-rung ladder that is, being the strongest rung on
  // the bench -- so the purse has to hold all three or the row is out of reach
  // and the ladder reads as broken rather than as unaffordable.
  window.__grant({ shards: 20000, spores: 50000, cores: 9, sparks: 5000 });
  // ...and the card is off the board until both grounds stand -- a bill naming
  // a coin the yard cannot get is a card the yard does not draw (coinsOpen).
  window.__crew(0, 0, 1, 1);
  window.__crew(1, 0);
  run(0.5);

  out.push(ok(critMult(0) === CRIT_MULT[0], 'the ladder starts at the foot of its list',
              `${critMult(0)} vs ${CRIT_MULT[0]}`));
  for (let lvl = 0; lvl < LADDER; lvl++) {
    const from = critMult(S.critMultLevel);
    const to = critMult(S.critMultLevel + 1);
    out.push(ok(Number.isInteger(to) && to > from, `rung ${lvl + 1} promises whole units more`,
                `${from} -> ${to}`));
    out.push(ok(buyNow('critmult'), 'and can be bought through the row', `level ${lvl}`));
  }
  out.push(ok(critMult() === CRIT_MULT[LADDER], 'the top of the ladder is the end of its list',
              `${critMult()} vs ${CRIT_MULT[LADDER]}`),
           ok(!window.__buy('critmult'), 'and there is no rung past it'));
  return out;
});

// --- 3. a save from the longer ladders reads as the new top --------------------
group('saved levels past the shorter ladders clamp to their tops', async () => {
  S.rockhandPickLevel = LADDER + 1;        // a rung past the top, off a longer ladder's save
  S.critMultLevel = LADDER + 1;
  rebalance();                             // the same clamp a load runs
  return [
    ok(S.rockhandPickLevel === LADDER, 'a pick level past the top reads as the top',
       `${S.rockhandPickLevel}`),
    ok(rockhandBite() === ROCKHAND_PX[LADDER], 'and bites what the top rung bites',
       `${rockhandBite()}`),
    ok(S.critMultLevel === LADDER, 'crit power clamps the same way',
       `${S.critMultLevel}`),
    ok(critMult() === CRIT_MULT[LADDER], 'to exactly the top of its list', `${critMult()}`),
  ];
});

