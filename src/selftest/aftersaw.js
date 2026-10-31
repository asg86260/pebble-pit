// Act 3's grove by hand, F1 (DESIGN.md, "Act 3's grove, rebuilt", call 9;
// track B), through the real pointer: the hand saw lies across the grown
// trunk with no icon over the tree and nothing bought; a press on it takes
// it, the pointer dragged end to end saws, and the tree goes over and breaks
// into its four logs. The stroke's rules are the node tier's
// (test/after-gestures.test.mjs); this is only that the page's pointer
// reaches them.

import { S } from '../state.js';
import { newRun, settle, raf, ok, point } from './kit.js';
import { GESTURE_SAW_AMP, AFTER_TREE, AFTER_FALL_S, AFTER_FALL_BOUNCE_S, AFTER_BREAK_S } from '../config.js';
import { handSawAt, gestureHeld } from '../after/gestures.js';
import { plotX } from '../after/place.js';
import { lying } from '../after/ground.js';
import { toScreen } from '../world.js';

const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
// A world point on the glass, as the pointer gives it (input.js `pos`).
const glass = (x, y) => { const r = document.getElementById('c').getBoundingClientRect(), s = toScreen(x, y);
                          return [r.left + s.x, r.top + s.y]; };

export const TESTS = [
  ['act 3 grove F1: the hand saw lies across the grown trunk, no icon; a real pointer takes it, drags it end to end and fells the tree into its four logs', async () => {
    newRun();
    await settle();
    window.__actsOn(true);
    S.after = null;
    window.__goPlace('after');
    for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
    window.__fast(1);
    window.__look(plotX(0) - S.viewW / 2);
    await settle(0.2);
    const bought = !!S.after.sawBought;
    const g = handSawAt(0).grip;
    point('pointermove', ...glass(g.x, g.y), 0);
    point('pointerdown', ...glass(g.x, g.y));
    await raf();
    const took = gestureHeld();
    // End to end and back a second, a little past the saw's swing, the
    // page's frames turning as it goes.
    for (let f = 1; f <= 60 * 20 && S.after.plots[0].fall == null; f++) {
      point('pointermove', ...glass(g.x + Math.sin(f / 60 * Math.PI) * GESTURE_SAW_AMP * 1.1, g.y));
      window.__fast(1 / 60);
      if (f % 20 === 0) await raf();
    }
    point('pointerup', ...glass(g.x, g.y));
    const p = S.after.plots[0], fell = p.fall != null, by = p.by;
    window.__fast(AFTER_FALL_S + AFTER_FALL_BOUNCE_S + AFTER_BREAK_S + 0.2);
    await raf();
    const logs = lying().filter(q => q.i === 0).length;
    window.__actsOn(null);
    return [
      ok(!bought, 'the saw not bought', JSON.stringify({ bought })),
      ok(took === 'tree', 'a press on the saw lying across the trunk takes it', String(took)),
      ok(fell && by === 'hand', 'dragged end to end, it saws the tree down', JSON.stringify({ fell, by })),
      ok(logs === AFTER_TREE.logs, 'which breaks into its four logs', `${logs}`)
    ];
  }]
];
