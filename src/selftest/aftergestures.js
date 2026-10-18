// Act 3's hand work through the real pointer (after/gestures.js, wired in
// input.js): a press, moves and a release dispatched on the canvas, the way a
// mouse makes them, with the camera up in the afterlife. A click on the
// station opens its card, and the motion is made on the card's part. The
// motions' rules are the node tier's (test/after-gestures.test.mjs); this is
// only that the page's pointer reaches them.

import { S } from '../state.js';
import { newRun, settle, raf, ok, point, P } from './kit.js';
import { AFTER_SHOUT_REBEL, GESTURE_BUBBLE_CRIT, CARD_IN_S } from '../config.js';
import { partsOf, useBubbles, cardOpen, cardToWorld, cardsView } from '../after/gestures.js';
import { stationBox } from '../after/place.js';

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
const glass = (x, y) => { const r = document.getElementById('c').getBoundingClientRect();
                          return [r.left + (x - S.camX) * S.zoom, r.top + (y - S.camY) * S.zoom]; };
// A point on the open card's grid (card px), on the glass.
const onCard = (x, y) => { const p = cardToWorld(x, y); return glass(p.x, p.y); };

export const TESTS = [
  ['act 3: a click on the saw mill opens its card, and the flywheel dragged round on the card cuts a log', async () => {
    newRun();
    await settle();
    await upThere(['mill'], { logs: 4 });
    const b = stationBox('mill');
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.1);
    const st = glass(b.x + b.w / 2, b.y + b.h / 2);
    point('pointerdown', ...st);
    point('pointerup', ...st);
    await settle(CARD_IN_S * 2);
    const opened = cardOpen(), drawn = cardsView().length;
    const t0 = S.after.stock.timber;
    const w = partsOf('mill').wheel;
    const at = a => onCard(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r);
    point('pointerdown', ...at(0));
    for (let f = 1; f <= 6 * 60; f++) {
      point('pointermove', ...at(f / 60 * 2 * 2 * Math.PI));
      window.__fast(1 / 60);
      if (f % 20 === 0) await raf();
    }
    point('pointerup', ...at(0));
    const cut = S.after.stock.timber - t0;
    // A click on the floor well past the station shuts it.
    const off = glass(b.x + b.w + P * 30, b.y + b.h - P);
    point('pointerdown', ...off);
    point('pointerup', ...off);
    await settle(0.5);
    const shut = cardOpen();
    window.__actsOn(null);
    return [
      ok(opened && opened.key === 'mill' && drawn === 1, 'the pointer\'s click on the saw mill opens its card', JSON.stringify(opened)),
      ok(cut > 0, 'spun round on the card by the pointer for six seconds, the flywheel cuts a log', `${cut} timber`),
      ok(shut === null, 'a click on the floor shuts the card', JSON.stringify(shut))
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
    const popped = air.length === 0, card = cardOpen();
    window.__fast(10);
    const paid = S.after.rebel - r0;
    useBubbles(null);
    window.__actsOn(null);
    return [
      ok(popped, 'the pointer\'s click pops the bubble'),
      ok(card === null, 'in the sky, with no card', JSON.stringify(card)),
      ok(paid === AFTER_SHOUT_REBEL * GESTURE_BUBBLE_CRIT, `the big one pays ${GESTURE_BUBBLE_CRIT} lines`, `${paid} rebel`)
    ];
  }],
];
