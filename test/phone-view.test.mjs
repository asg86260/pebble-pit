// The camera at a phone's window. Every framing rule in the game was written
// against a desk's window, which is wider than anything in the yard, and a
// phone stood upright is not: it is narrower than a shield is wide and than
// the opening's walk lags. What is asserted here is that the thing a scene is
// about is framed at that width, for the whole of the scene -- the shield's
// span centered under its answer, the pair inside the frame on the walk out of
// the house.
// The same checks pass trivially on a desk, which is why they are stood at a
// phone.
import { group, ok, state, run, runUntil, openSites, SEED, yard, WORKER } from './helpers.mjs';
import { PROP_FROM, NET_COST, ARCH_COST, P, shieldWidth, CUT_SETTLE_S } from '../src/config.js';
import { rockWidthAt } from '../src/rock.js';

// A portrait phone, as the page reports it. `__seed` lays the world out again
// through `resize`, which reads the window from the document, so the size is
// set first and the yard stood up after.
const PHONE = { W: 390, H: 844 };
const phone = () => {
  document.documentElement.clientWidth = PHONE.W;
  document.documentElement.clientHeight = PHONE.H;
  globalThis.innerWidth = PHONE.W;
  globalThis.innerHeight = PHONE.H;
  window.__seed(SEED);
};

// Whether a world span [x, x + w) is inside the view, edge to edge.
const inView = (x, w) => {
  const S = yard.S;
  return x >= S.camX && x + w <= S.camX + S.viewW;
};

// The arch is the widest shield short of the dome, and over a big enough rock
// it is wider than a phone's window at the yard's zoom. No scene zooms (the
// owner's C, cutscene.js): the yard's zoom steps through whole cell sizes, so
// any pull-out is a snap. What the scene owes a phone instead is the yard's
// own zoom held for the whole of it, and the span's middle -- the spot the
// rock comes down on -- glided to the middle of the frame and held there. The
// rock is the first whose arch is wider than the view, so the check is stood
// where the framing could have been tempted to give.
group("a shield's answer is centered on its span at a phone's width, at the yard's zoom", async () => {
  phone();
  window.__reset();
  const yardZoom = state().zoom;
  let archFrom = PROP_FROM;
  while (shieldWidth('arch', rockWidthAt(archFrom) * P) <= PHONE.W / yardZoom) archFrom++;
  window.__crew(2, 1);
  window.__jump(archFrom);
  window.__give(40000);
  window.__grant({ shards: ARCH_COST * 2, spores: NET_COST * 2 });
  run(1);
  openSites();
  window.__crew(2, 1);
  for (const k of ['props', 'net']) {
    window.__buy(k);
    runUntil(() => !!state().shield, 400);
    window.__next();
    runUntil(() => state().shieldsDone.includes(k), 240);
    runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 240);
  }
  window.__buy('arch');
  runUntil(() => { const sh = state().shield; return sh && sh.laid >= sh.pieces; }, 400);
  const span = { ...state().shield };
  const middle = span.x + span.w / 2;
  window.__next();
  // The scene, a sixtieth at a time: the zoom on every frame of it, and once
  // the glide in has had its CUT_SETTLE_S, the view's middle on the span's.
  let started = null, frames = 0, zoomed = 0, off = 0, held = 0;
  while (frames < 60 * 40) {
    run(1 / 60);
    frames++;
    const s = state();
    if (s.beat.camera === 'arch' && !s.shotOut) {
      started ??= frames;
      if (s.zoom !== yardZoom) zoomed++;
      if (frames - started > 60 * CUT_SETTLE_S) {
        held++;
        if (Math.abs(yard.S.camX + yard.S.viewW / 2 - middle) > P) off++;
      }
    }
    if (started && !s.beat.camera) break;
  }
  return [
    ok(started != null, 'the scene runs', `${started}`),
    ok(span.w > PHONE.W / yardZoom, 'and the span is wider than the yard-zoom view',
       `span ${span.w}, window ${PHONE.W}, zoom ${yardZoom}`),
    ok(zoomed === 0, "the view holds the yard's zoom the whole way", `${zoomed} frames off ${yardZoom}`),
    ok(held > 0 && off === 0, "and holds the span's middle in the middle of the frame",
       `${off} of ${held} frames off it`),
  ];
});

// The walk out of the house: the seat eases after the pair a beat behind, and
// at a phone's width the beat used to be a third of the frame. Both of them,
// a body wide, inside the frame on every frame of the walk.
group("the pair stay in frame on the walk out at a phone's width", async () => {
  phone();
  window.__reset(true);
  let out = 0, frames = 0, seen = 0;
  while (frames < 60 * 12 && state().beat.yard === 'leave') {
    run(1 / 60);
    frames++;
    seen++;
    for (const b of yard.S.pair) if (!inView(b.x, WORKER)) out++;
  }
  return [
    ok(seen > 60, 'the walk is watched', `${seen} frames`),
    ok(state().beat.yard === 'chat', 'and they arrive', state().beat.yard),
    ok(out === 0, 'with both of them in the frame the whole way',
       `${out} body-frames off the edge`),
  ];
});
