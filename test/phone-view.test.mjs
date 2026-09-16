// The camera at a phone's window. Every framing rule in the game was written
// against a desk's window, which is wider than anything in the yard, and a
// phone stood upright is not: it is narrower than a shield is wide and than
// the opening's walk lags. What is asserted here is that the thing a scene is
// about stays inside the frame at that width, for the whole of the scene --
// the shield's span under its answer, the pair on the walk out of the house.
// The same checks pass trivially on a desk, which is why they are stood at a
// phone.
import { group, ok, state, run, runUntil, openSites, SEED, yard, WORKER } from './helpers.mjs';
import { PROP_FROM, NET_COST, ARCH_COST } from '../src/config.js';

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

// The arch is the widest shield short of the dome and the check is about the
// width, so it is the one stood up. The same yard cutscene.test.mjs stands.
group("a shield's answer is framed whole at a phone's width", async () => {
  phone();
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
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
  window.__next();
  // The scene, a sixtieth at a time: once the glide in has had its half
  // second, the whole span is inside the frame on every frame until the
  // scene lets go, and the view is narrower than the span at the yard's own
  // zoom, so it is the pull-in doing it.
  let started = null, out = 0, frames = 0, zoomIn = null, narrow = false;
  while (frames < 60 * 40) {
    run(1 / 60);
    frames++;
    const s = state();
    if (s.beat.camera === 'arch' && !s.shotOut) {
      started ??= frames;
      if (frames - started >= 30) {
        zoomIn ??= s.zoom;
        if (!inView(span.x, span.w)) out++;
        if (span.w > PHONE.W / 0.833) narrow = true;
      }
    }
    if (started && !s.beat.camera) break;
  }
  return [
    ok(started != null, 'the scene runs', `${started}`),
    ok(narrow, 'and the span is wider than the yard-zoom view, so the framing has to give',
       `span ${span.w}, window ${PHONE.W}`),
    ok(zoomIn != null && zoomIn < 0.833, 'the view pulls out rather than in',
       `zoom ${zoomIn}`),
    ok(out === 0, 'and the whole span is in the frame for the whole scene',
       `${out} frames with a foot off the edge`),
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
