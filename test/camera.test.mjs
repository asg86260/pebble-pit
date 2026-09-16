// The camera in the node yard, which has no scroller. On a page the platform
// holds the view's x and the game reads it back (DESIGN.md, "Momentum
// scrolling"); here nothing is bound, and `S.camX` has to be the same fact
// with nothing to read it from: it clamps to the world, a `lookAt` glides at
// the same ease and lands where it said, and the reduced-motion cut still
// cuts. If the scroller ever became the only place the camera lived, every
// check in this tier would be looking through a camera that does not move.

import { group, ok, run, P } from './helpers.mjs';
import { S } from '../src/state.js';
import { lookAt, clampCam } from '../src/world.js';
import { setPref } from '../src/prefs.js';

// --- 1. the clamp -----------------------------------------------------------------
group('the view clamps to the world with no scroller to clamp it', async () => {
  window.__look(-500);
  const left = S.camX;
  window.__look(S.worldW * 2);
  const right = S.camX;
  const most = Math.max(0, S.worldW - S.viewW);
  return [
    ok(left === 0, 'asked for past the left end, it stands at nought', `camX ${left}`),
    ok(Math.abs(right - most) < 1, 'asked for past the right end, it stands at the last window',
       `camX ${right} vs ${most}`),
  ];
});

// --- 2. the glide -------------------------------------------------------------------
group('a lookAt glides frame by frame and lands where it said', async () => {
  window.__look(0);
  const target = 1500;
  lookAt(target);
  const want = target - S.viewW / 2;
  run(1 / 60);
  const afterOne = S.camX;
  // The ease is 0.12 of what is left a frame: after one frame it has covered
  // about that share and no more.
  const share = afterOne / want;
  let frames = 0;
  while (S.camTo !== null && frames < 600) { run(1 / 60); frames++; }
  return [
    ok(afterOne > 0 && afterOne < want, 'one frame in, it is on its way and not there',
       `camX ${afterOne} of ${want}`),
    ok(share > 0.08 && share < 0.16, 'at the glide\'s own ease', `${share.toFixed(3)} of the way`),
    ok(S.camTo === null, 'and the glide ends', `${frames} frames`),
    ok(Math.abs(S.camX - want) < 1, 'where it said', `camX ${S.camX} vs ${want}`),
  ];
});

// --- 3. the cut ---------------------------------------------------------------------
group('under reduced motion a lookAt is a cut, scroller or none', async () => {
  setPref('motion', true);
  window.__look(0);
  lookAt(2000);
  const at = S.camX, to = S.camTo;
  setPref('motion', null);
  return [
    ok(to === null, 'nothing is left gliding', `camTo ${to}`),
    ok(Math.abs(at - (2000 - S.viewW / 2)) < 1, 'and the view is already there', `camX ${at}`),
  ];
});

// --- 4. every writer clamps ---------------------------------------------------------
group('a camera written past the edge and clamped stands inside the world', async () => {
  S.camX = -P * 50;
  clampCam();
  const a = S.camX;
  S.camX = S.worldW + P * 50;
  clampCam();
  const b = S.camX;
  return [
    ok(a === 0, 'the left edge', `${a}`),
    ok(b <= S.worldW - S.viewW + 1, 'the right edge', `${b} of ${S.worldW - S.viewW}`),
  ];
});
