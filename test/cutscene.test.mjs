// The shields' answers are cutscenes. Each of the five is reached the way a
// player reaches it -- the row bought, the thing built, the next rock let
// fall on it -- and the check is about the camera: that a scene named for
// the kind runs while the rock is in the air, that it is stood on the span,
// that the yard never stops for it, and that it lets go once the answer is
// over. DESIGN.md, "The cutscenes, fleshed out".
import { group, ok, state, run, runUntil, openSites } from './helpers.mjs';
import { PROP_FROM, NET_COST, ARCH_COST, JACK_COST, DOME_BILL } from '../src/config.js';

const fundDome = () => {
  for (const [money, n] of DOME_BILL) {
    if (money === 'dust') window.__give(n);
    else window.__grant({ [money + 's']: n });
  }
};

// The same yard shield.test.mjs stands at each shield: the coin for all of
// them in hand, and the ones before already answered, the way a player would
// have had to.
const ready = () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(40000);
  window.__grant({ shards: ARCH_COST * 2, spores: NET_COST * 2, sparks: JACK_COST * 2 });
  run(1);
};
const through = (kind) => {
  window.__buy(kind);
  runUntil(() => !!state().shield, 400);
  window.__next();
  runUntil(() => state().shieldsDone.includes(kind), 240);
  runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 240);
};
const ORDER = ['props', 'net', 'arch', 'jack'];
const standAt = (kind) => {
  ready();
  openSites();                             // which stands the crew down; back on
  window.__crew(2, 1);
  for (const k of ORDER) {
    if (k === kind) break;
    if (k === 'jack') { window.__meteor(); window.__grant({ sparks: JACK_COST * 2 }); }
    through(k);
  }
  if (kind === 'jack') { window.__meteor(); window.__grant({ sparks: JACK_COST * 2 }); }
  if (kind === 'dome') { window.__meteor(); window.__grant({ sparks: JACK_COST * 2 }); through('jack');
                         fundDome(); window.__crew(2, 1, 0, 0, 0, 1); }
  window.__buy(kind);
  runUntil(() => { const sh = state().shield; return sh && sh.laid >= sh.pieces; }, 400);
};

// Let the next rock fall on the standing shield and watch the camera through
// it, a sixtieth at a time: when the scene starts, where it looks, whether
// somebody kept walking, and when it lets go.
const watch = (kind) => {
  const span = state().shield;
  const spanX = span.x + span.w / 2;
  const seat = state().camX;
  const zoom0 = state().zoom;
  window.__next();
  let started = null, onSpan = false, walked = false, ended = null, frames = 0;
  let pos = state().workerPos.join(' ');
  while (frames < 60 * 40) {
    run(1 / 60);
    frames++;
    const s = state();
    if (s.cine === kind && started == null) started = { frames, rockFall: s.rockFall, zoom: s.zoom };
    if (s.cine === kind) {
      // stood on the span: the seat's center within a body of it, once the glide is in
      if (Math.abs(s.camX + s.viewW / 2 - spanX) < 30) onSpan = true;
      const now = s.workerPos.join(' ');
      if (now !== pos) walked = true;
      pos = now;
    }
    if (started && !s.cine && ended == null) { ended = { frames, shield: s.shield && s.shield.kind, held: s.rockHeld, rockFall: s.rockFall, zoom: s.zoom }; }
    if (ended && frames > ended.frames + 120) break;
  }
  return { started, onSpan, walked, ended, seat, zoom0, spanX, camAfter: state().camX + state().viewW / 2 };
};

for (const kind of ['props', 'net', 'arch', 'jack']) {
  group(`the ${kind}'s answer is watched, and the camera comes back`, async () => {
    standAt(kind);
    const w = watch(kind);
    window.__reset();
    return [
      ok(!!w.started, `a scene named ${kind} runs`, JSON.stringify(w.started)),
      ok(w.started && w.started.rockFall > 0, 'and it starts while the rock is still in the sky',
         w.started && `${w.started.rockFall} to fall`),
      ok(w.onSpan, 'it is stood on the span', `span ${w.spanX}`),
      ok(w.walked, 'and the yard kept walking under it'),
      ok(!!w.ended, 'it lets go', JSON.stringify(w.ended)),
      ok(w.ended && w.ended.shield === null, 'once the shield is gone',
         w.ended && `${w.ended.shield}`),
      // The pull-in is measured against the shield and the window (the node
      // yard's is small, so the arch is watched from further out than the
      // timber), and what is asserted is that it is put back where it was.
      ok(w.ended && w.ended.zoom === w.zoom0, 'with the zoom put back',
         w.ended && `${w.zoom0} -> ${w.started.zoom} -> ${w.ended.zoom}`),
    ];
  });
}

group("the dome's first hold is watched, and the second is not", async () => {
  standAt('dome');
  const first = watch('dome');
  // the rescue happened under it: the second rock is routine
  const again = watch('dome');
  window.__reset();
  return [
    ok(!!first.started, 'the first hold runs a scene', JSON.stringify(first.started)),
    ok(first.onSpan && first.walked, 'on the span, with the yard still walking'),
    ok(first.ended && !first.ended.held && first.ended.rockFall === 0,
       'and it lets go once the rock is set down', JSON.stringify(first.ended)),
    ok(first.ended && first.ended.shield === 'dome', 'with the dome still standing'),
    ok(!again.started, 'the next rock under the dome is not a scene',
       JSON.stringify(again.started)),
  ];
});
