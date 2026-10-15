// The serpent's bar follows the camera without a jump (the owner, 2026-10-15:
// "while scrolling on a narrow browser the hp bar jumps a bit when scrolling
// left. it snaps to the end of the snake"). On a glass narrower than the coil,
// the camera is panned across the deep a pixel of glass at a time, from the
// coil well off one side to well off the other, and back: the bar may slide
// with the coil, never more than the camera moved, and never snap.
import { group, ok, run, yard } from './helpers.mjs';
import { coilEnds } from '../src/deep/place.js';

const { barRect } = await import('../src/render/serpentbar.js');
const S = yard.S;

function setUp() {
  window.__snatch({ played: true });
  window.__view('deep');
  window.__serpent({ stage: 1, wound: 0 });
  run(1);
}

// The widest per-step move of the bar's left edge, in screen pixels, over a
// pan of the camera in steps of `step` screen pixels.
function pan(W, H, step) {
  const was = { W: S.W, H: S.H, camX: S.camX };
  S.W = W; S.H = H;
  const { x0, x1 } = coilEnds(), z = S.zoom, d = step / z;
  const from = x0 - W / z * 1.5, to = x1 + W / z * 0.5;
  let worst = 0, at = null, prev = null;
  const one = cx => {
    S.camX = cx;
    const r = barRect();
    if (prev) { const m = Math.abs(r.x - prev.x) + Math.abs(r.y - prev.y); if (m > worst) { worst = m; at = cx; } }
    prev = r;
  };
  for (let cx = from; cx <= to; cx += d) one(cx);
  for (let cx = to; cx >= from; cx -= d) one(cx);
  Object.assign(S, was);
  return { worst, at };
}

group('the serpent\'s bar slides with the camera on a narrow glass, never snapping', () => {
  setUp();
  const step = 2;
  // a step of the camera moves the bar at most that step, and a pixel for rounding
  return [[400, 800], [390, 844], [800, 600], [1200, 800]].map(([W, H]) => {
    const { worst, at } = pan(W, H, step);
    return ok(worst <= step + 1, `at ${W}x${H} the bar moves at most ${step + 1}px in one ${step}px step of the camera`,
      `moved ${worst}px at camX ${at?.toFixed(1)}`);
  });
});
