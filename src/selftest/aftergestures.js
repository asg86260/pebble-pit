// Act 3's hand work through the real pointer (after/gestures.js, wired in
// input.js): a press, moves and a release dispatched on the canvas, the way a
// mouse makes them, with the camera up in the afterlife. A station's moving
// part is dragged where it stands; a plain click on a station asks for its
// board. The motions' rules are the node tier's (test/after-gestures.test.mjs);
// this is only that the page's pointer reaches them.

import { S } from '../state.js';
import { newRun, settle, raf, ok, point, P } from './kit.js';
import { AFTER_PODIUM_REBEL, GESTURE_BUBBLE_CRIT } from '../config.js';
import { partsOf, useBubbles } from '../after/gestures.js';
import { openBoard } from '../board.js';
import { stationBox } from '../after/place.js';
import { toScreen } from '../world.js';

const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
// The act up, the camera on the place, the stations wanted standing (the
// setup the groups are not about).
async function upThere(stand = [], stock = {}) {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__fast(1);
  for (const k of stand) if (!S.after.built.includes(k)) S.after.built.push(k);
  window.__afterGrant(stock);
  await settle(0.2);
}
// A world point on the glass, as the pointer gives it (input.js `pos`).
const glass = (x, y) => { const r = document.getElementById('c').getBoundingClientRect(), s = toScreen(x, y);
                          return [r.left + s.x, r.top + s.y]; };

export const TESTS = [
  ['act 3: the saw mill\'s flywheel dragged round where it stands cuts a log; a click on its frame asks for its board', async () => {
    newRun();
    await settle();
    await upThere(['mill'], { logs: 4 });
    const b = stationBox('mill');
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.1);
    const t0 = S.after.stock.timber;
    const w = partsOf('mill').wheel;
    const at = a => glass(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r);
    point('pointerdown', ...at(0));
    for (let f = 1; f <= 6 * 60; f++) {
      point('pointermove', ...at(f / 60 * 2 * 2 * Math.PI));
      window.__fast(1 / 60);
      if (f % 20 === 0) await raf();
    }
    point('pointerup', ...at(0));
    const cut = S.after.stock.timber - t0;
    const fr = partsOf('mill').frame, st = glass(fr.x + fr.w / 2, fr.y + P);
    point('pointerdown', ...st);
    point('pointerup', ...st);
    await settle(0.2);
    const asked = openBoard();
    window.__actsOn(null);
    return [
      ok(cut > 0, 'spun round by the pointer for six seconds, the flywheel cuts a log', `${cut} timber`),
      ok(asked === 'after-mill', 'a plain click on the station opens its board', JSON.stringify(asked))
    ];
  }],
  ['act 3: a bubble clicked by the pointer pops where it rises, and the big one pays five lines', async () => {
    newRun();
    await settle();
    await upThere();
    const pair = partsOf('pedestal').box;
    let air = [{ x: pair.x, y: pair.y - P * 12, w: P * 10, h: P * 6, big: true }];
    const big = air[0];
    useBubbles({ list: () => air, pop: b => { const had = air.includes(b); air = air.filter(x => x !== b); return had; } });
    window.__look(pair.x - S.viewW / 2);
    await settle(0.1);
    const r0 = S.after.rebel;
    const at = glass(big.x + big.w / 2, big.y + big.h / 2);
    point('pointerdown', ...at);
    point('pointerup', ...at);
    const popped = air.length === 0, asked = openBoard();
    window.__fast(10);
    const paid = S.after.rebel - r0;
    useBubbles(null);
    window.__actsOn(null);
    return [
      ok(popped, 'the pointer\'s click pops the bubble'),
      ok(asked === null, 'and asks for no board', JSON.stringify(asked)),
      ok(paid === AFTER_PODIUM_REBEL[0] * GESTURE_BUBBLE_CRIT, `the big one pays ${GESTURE_BUBBLE_CRIT} lines`, `${paid} rebel`)
    ];
  }],
];
