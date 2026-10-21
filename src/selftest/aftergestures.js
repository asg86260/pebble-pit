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
import { handworkShown } from '../render/aftercues.js';
import { openBoard } from '../board.js';
import { stationBox, signBoard } from '../after/place.js';
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
  ['act 3: the saw mill\'s flywheel dragged round where it stands cuts a log; a click on its frame asks for no board, one on its sign for its board', async () => {
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
    const press = async (x, y) => { const at = glass(x, y); point('pointerdown', ...at); point('pointerup', ...at); await settle(0.2); return openBoard(); };
    const fr = partsOf('mill').frame, sg = signBoard('mill');
    const onFrame = await press(fr.x + fr.w / 2, fr.y + P);
    window.__look(sg.x + sg.w / 2 - S.viewW / 2);
    await settle(0.1);
    const asked = await press(sg.x + sg.w / 2, sg.y + P * 2);
    window.__actsOn(null);
    return [
      ok(cut > 0, 'spun round by the pointer for six seconds, the flywheel cuts a log', `${cut} timber`),
      ok(onFrame === null, 'a plain click on the station opens no board', JSON.stringify(onFrame)),
      ok(asked === 'after-mill', 'a plain click on its sign opens its board', JSON.stringify(asked))
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
  // The hand work shown in the world (DESIGN.md, "Act 3's hand work and hand
  // carrying", take B): read off what the cue layer drew, so it is a fact
  // about the picture and not only the sim.
  ['act 3: the pointer over the flywheel shows its motion and opens no board; worked, the ghost goes and the strip fills', async () => {
    newRun();
    await settle();
    await upThere(['mill'], { logs: 4 });
    const b = stationBox('mill');
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.1);
    const w = partsOf('mill').wheel;
    const at = a => glass(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r);
    const shown = () => handworkShown().mill || {};
    const before = shown();
    point('pointermove', ...at(0), 0);
    for (let f = 0; f < 40; f++) { window.__fast(1 / 60); if (f % 10 === 0) await raf(); }
    await raf(); await raf();
    const hovered = shown(), board = openBoard();
    point('pointerdown', ...at(0));
    let most = 0, hintWorking = 1;
    for (let f = 1; f <= 3 * 60; f++) {
      point('pointermove', ...at(f / 60 * 2 * 2 * Math.PI));
      window.__fast(1 / 60);
      if (f % 20 === 0) { await raf(); most = Math.max(most, shown().n || 0); if (f >= 60) hintWorking = Math.min(hintWorking, shown().hintA); }
    }
    point('pointerup', ...at(0), 0);
    point('pointerleave', ...at(0), 0);
    window.__actsOn(null);
    return [
      ok(!(before.hintA > 0), 'before the pointer comes, nothing shows', JSON.stringify(before)),
      ok(hovered.hintA > 0.5 && hovered.stripA > 0.5, 'the pointer on the wheel shows its ghost and its strip', JSON.stringify(hovered)),
      ok(board === null, 'and opens no board: the shop is the sign\'s', String(board)),
      ok(hintWorking === 0, 'spun, the ghost is gone', `${hintWorking}`),
      ok(most > 0, 'and the strip fills as the log is fed', `${most} of ${hovered.of}`)
    ];
  }],
];
