// Act 3's seed basket through the real pointer (after/seeds.js, wired in
// input.js and hands.js): a press on the basket takes an acorn into the hand,
// and let go over a bare plot's soil bed it is planted (DESIGN.md, "Act 3's
// grove, rebuilt", A2). The planting rules are the node tier's
// (test/after-grove.test.mjs); this is only that the page's pointer reaches
// them.

import { S } from '../state.js';
import { newRun, settle, raf, ok, point, P } from './kit.js';
import { clearPlot } from '../after/grove.js';
import { plotX, groundOf, AP } from '../after/place.js';
import { pileCount } from '../after/piles.js';
import { toScreen } from '../world.js';

const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
// A world point on the glass, as the pointer gives it (input.js `pos`).
const glass = (x, y) => { const r = document.getElementById('c').getBoundingClientRect(), s = toScreen(x, y);
                          return [r.left + s.x, r.top + s.y]; };

export const TESTS = [
  ['act 3: a press on the seed basket takes an acorn, and let go over a bare plot it is planted', async () => {
    newRun();
    await settle();
    window.__actsOn(true);
    S.after = null;
    window.__goPlace('after');
    for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
    window.__fast(1);
    // the grove's one plot bare, the setup this check is not about
    S.after.plots = [];
    clearPlot();
    const basket = window.__afterPile('forestry', 'seeds'), bed = { x: plotX(0), y: groundOf('grove') - AP * 10 };
    window.__look((basket.x + bed.x) / 2 - S.viewW / 2);
    await settle(0.2);
    const before = pileCount('seeds');
    // pressed on the basket, carried across, held still over the bed, let go
    point('pointermove', ...glass(basket.x, basket.y), 0);
    point('pointerdown', ...glass(basket.x, basket.y));
    await settle(0.1);
    const held = S.held, kind = S.motes[0]?.kind || null, taken = pileCount('seeds');
    for (let k = 1; k <= 8; k++) {
      point('pointermove', ...glass(basket.x + (bed.x - basket.x) * k / 8, basket.y + (bed.y - basket.y) * k / 8));
      window.__fast(0.05);
      await raf();
    }
    await new Promise(r => setTimeout(r, 200));   // held still: no flick
    point('pointerup', ...glass(bed.x, bed.y));
    await settle(2);
    const plot = S.after.plots[0];
    window.__actsOn(null);
    return [
      ok(held >= 1 && kind === 'acorn', 'a press on the basket takes an acorn into the hand', `${held} ${kind}`),
      ok(taken === before - held, 'and it comes out of the basket', `${before} -> ${taken}`),
      ok(plot.grow != null && plot.seed != null, 'let go over the bare bed, it is planted and the tree begins', JSON.stringify({ grow: plot.grow, seed: plot.seed }))
    ];
  }]
];
