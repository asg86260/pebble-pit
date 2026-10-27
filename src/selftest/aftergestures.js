// Act 3's hand work through the real pointer (after/gestures.js, wired in
// input.js): a press, moves and a release dispatched on the canvas, the way a
// mouse makes them, with the camera up in the afterlife. A station's moving
// part is dragged where it stands; a plain click anywhere else on a station
// opens its board beside it, and taking hold of a part shuts it (DESIGN.md,
// "Act 3's goods are blocks", rule 4). The motions' rules are the node
// tier's (test/after-gestures.test.mjs); this is only that the page's
// pointer reaches them.

import { S } from '../state.js';
import { newRun, settle, raf, ok, point, panel, P } from './kit.js';
import { AFTER_PODIUM_REBEL, GESTURE_BUBBLE_CRIT, GESTURE_CUE_ALPHA, GESTURE_CUE_HOVER, GESTURE_CUE_USES } from '../config.js';
import { partsOf, useBubbles, gestureUnder } from '../after/gestures.js';
import { cueShown } from '../render/aftercues.js';
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
// A world box on the glass, in client pixels.
const onGlass = b => { const [l, t] = glass(b.x, b.y), [r, d] = glass(b.x + b.w, b.y + b.h); return { left: l, top: t, right: r, bottom: d }; };
const meets = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
// A point on the mill's frame that its hand work would not take: the station
// is its own shop there.
function onFrame(key) {
  const fr = key === 'mill' ? partsOf('mill').frame : stationBox(key);
  for (let y = fr.y + P / 2; y < fr.y + fr.h; y += P)
    for (let x = fr.x + P / 2; x < fr.x + fr.w; x += P) if (!gestureUnder(x, y)) return { x, y };
  return null;
}
// The flywheel taken by its rim and turned at two turns a second for
// `secs`, the page's frames turning as it goes.
async function spinWheel(secs) {
  const w = partsOf('mill').wheel;
  const at = a => glass(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r);
  point('pointerdown', ...at(0));
  for (let f = 1; f <= secs * 60; f++) {
    point('pointermove', ...at(f / 60 * 2 * 2 * Math.PI));
    window.__fast(1 / 60);
    if (f % 20 === 0) await raf();
  }
  point('pointerup', ...at(0));
}

export const TESTS = [
  ['act 3: the saw mill\'s flywheel dragged round where it stands cuts a log; a click on its frame opens its board beside it, and taking hold of the wheel shuts it', async () => {
    newRun();
    await settle();
    await upThere(['mill'], { logs: 4 });
    const b = stationBox('mill');
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.1);
    const t0 = S.after.stock.timber;
    await spinWheel(6);
    const cut = S.after.stock.timber - t0;
    // The mill at the window's left, so there is room for the board on its
    // right (in a window too narrow for both, the window's edge wins).
    window.__look(b.x - P * 2);
    await settle(0.2);
    // A plain click on the frame, off the wheel.
    const spot = onFrame('mill'), at = glass(spot.x, spot.y);
    point('pointerdown', ...at); point('pointerup', ...at);
    await settle(0.4);
    const asked = openBoard();
    // Beside it, never over it: the board's box on the glass clear of the
    // station's drawing.
    const pr = panel().getBoundingClientRect(), sr = onGlass(b);
    const beside = !panel().hidden && !meets({ left: pr.left, top: pr.top, right: pr.right, bottom: pr.bottom }, sr);
    // A press on the wheel takes hold of the work, and the board goes.
    const w = partsOf('mill').wheel, rim = glass(w.x + w.r, w.y);
    point('pointerdown', ...rim);
    await settle(0.1);
    const held = openBoard();
    point('pointerup', ...rim);
    window.__actsOn(null);
    return [
      ok(cut > 0, 'spun round by the pointer for six seconds, the flywheel cuts a log', `${cut} timber`),
      ok(asked === 'after-mill', 'a plain click on its frame opens its board', JSON.stringify(asked)),
      ok(beside, 'and the board stands beside the station, never over it', JSON.stringify({ board: [pr.left, pr.top, pr.right, pr.bottom].map(Math.round), station: Object.values(sr).map(Math.round) })),
      ok(held === null, 'taking hold of the flywheel shuts it', JSON.stringify(held))
    ];
  }],
  ['act 3: a bubble clicked by the pointer pops where it rises, and the big one pays five lines', async () => {
    newRun();
    await settle();
    await upThere();
    // The members agitate rebel onto the same pile: another check's.
    S.after.bodies = []; S.after.camp = 0;
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
  // One ghost hand (DESIGN.md, "Act 3's goods are blocks", rule 3): read off
  // what the cue layer drew, so it is a fact about the picture and not only
  // the sim.
  ['act 3: once the flywheel\'s lesson is done, the pointer over it brings its hand back faint and opens no board; taken hold of, the hand goes', async () => {
    newRun();
    await settle();
    await upThere(['mill'], { logs: 8 });
    const b = stationBox('mill');
    window.__look(b.x + b.w / 2 - S.viewW / 2);
    await settle(0.1);
    // The lesson done: the wheel worked GESTURE_CUE_USES logs through, then
    // the pointer taken away and the first uses' hand let fade.
    await spinWheel(GESTURE_CUE_USES * 5);
    const w = partsOf('mill').wheel, at = a => glass(w.x + Math.cos(a) * w.r, w.y + Math.sin(a) * w.r);
    point('pointerleave', ...at(0), 0);
    for (let f = 0; f < 90; f++) { window.__fast(1 / 60); if (f % 10 === 0) await raf(); }
    await raf(); await raf();
    const away = cueShown().mill || 0;
    point('pointermove', ...at(0), 0);
    for (let f = 0; f < 40; f++) { window.__fast(1 / 60); if (f % 10 === 0) await raf(); }
    await raf(); await raf();
    const hovered = cueShown().mill || 0, board = openBoard();
    point('pointerdown', ...at(0));
    let most = 0;
    for (let f = 1; f <= 60; f++) {
      point('pointermove', ...at(f / 60 * 2 * 2 * Math.PI));
      window.__fast(1 / 60);
      if (f % 10 === 0) { await raf(); most = Math.max(most, cueShown().mill || 0); }
    }
    point('pointerup', ...at(0), 0);
    point('pointerleave', ...at(0), 0);
    window.__actsOn(null);
    const faint = GESTURE_CUE_HOVER * GESTURE_CUE_ALPHA;
    return [
      ok(away < 0.01, 'its lesson done and the pointer away, no hand shows', `${away}`),
      ok(Math.abs(hovered - faint) < 0.05, 'the pointer on the wheel brings the hand back, faint', `${hovered} (faint is ${faint})`),
      ok(board === null, 'and opens no board: the wheel is the hand\'s', String(board)),
      ok(most === 0, 'taken hold of and spun, the hand is gone', `${most}`)
    ];
  }],
];
