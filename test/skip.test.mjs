// The space bar, held, ends whichever scene has the yard: the opening, the
// reunion after the first rock, the rescue under the dome, and the camera's
// own scenes. Each is reached the way a player reaches it and cut with the
// key rather than the scene's own hook -- the hold is what is being checked.
// DESIGN.md, "Skipping a scene".
import { group, ok, state, run, runUntil, openSites } from './helpers.mjs';
import { SKIP_HOLD_MS, PROP_FROM, NET_COST, ARCH_COST, DOME_BILL, WORKER } from '../src/config.js';

const HOLD = SKIP_HOLD_MS / 1000;

group('the opening skips under a held space bar, and not under a tap', async () => {
  window.__reset(true);                        // the opening, playing
  run(1);
  const playing = state();
  // a tap: down, up before the hold is through, and the scene carries on
  window.__holdSkip(true);
  run(HOLD / 2);
  window.__holdSkip(false);
  run(1);
  const tapped = state();
  // held through -- the pair are still walking in, so where the survivor
  // stood is read on the frame before the cut
  window.__holdSkip(true);
  run(HOLD / 2);
  const early = state();
  run(HOLD / 2 - 2 / 60);
  const last = state();
  const stood = last.pairX[last.pairX.length - 1];   // the one on the right: the survivor
  run(3 / 60);
  const cut = state();
  const body = cut.workerPos[0];
  const bodyX = body ? parseInt(body.split(':')[1], 10) : NaN;
  window.__holdSkip(false);
  return [
    ok(playing.beat.yard === 'leave' || playing.beat.yard === 'chat', 'the opening is playing', `${playing.beat.yard}`),
    ok(tapped.beat.yard && !tapped.beatsDone.includes('show'), 'a tap changes nothing', `${tapped.beat.yard}`),
    ok(early.beat.yard && !early.beatsDone.includes('show'), 'nor does a hold not yet through', `${early.beat.yard}`),
    ok(!cut.beat.yard && cut.beatsDone.includes('show'), 'held through, the opening is over', `${cut.beat.yard}`),
    ok(cut.crew === 1 && cut.workerPos.length === 1, 'and there is one body in the yard',
       `crew ${cut.crew}, ${cut.workerPos.length} bodies`),
    ok(Math.abs(bodyX - stood) <= WORKER * 2, 'stood where the one you were watching stood',
       `body at ${bodyX}, survivor at ${stood}`),
    ok(cut.pair === 0, 'and the pair are gone'),
    ok(!cut.seenDrag, 'the player has still not dragged anything'),
  ];
});

group('the reunion skips to the next rock coming down', async () => {
  window.__reset(true);
  run(0.4);
  runUntil(() => !state().beat.yard, 200);
  window.__crew(3, 1);
  const before = state();
  window.__next();                             // the first rock is finished: the reunion
  runUntil(() => state().beat.yard === 'meet', 200);
  const meeting = state();
  window.__holdSkip(true);
  run(HOLD + 0.1);
  const cut = state();
  window.__holdSkip(false);
  run(3);
  const after = state();
  return [
    ok(meeting.beat.yard === 'meet', 'the reunion is running', `${meeting.beat.yard}`),
    ok(!cut.beat.yard && cut.beatsDone.includes('part'), 'held through, it is over', `${cut.beat.yard}`),
    ok(cut.boulderNo === before.boulderNo + 1, 'and the next rock is on its way',
       `${before.boulderNo} -> ${cut.boulderNo}`),
    ok(Math.abs(cut.zoom - 1) < 0.2 || cut.zoom < 1.9, 'with the view let go', `zoom ${cut.zoom}`),
    ok(after.rock > 0 && !after.beat.yard, 'and it lands like any other', `rock ${after.rock}`),
  ];
});

// The dome's first hold, the way cutscene.test.mjs reaches it.
const fundDome = () => {
  for (const [money, n] of DOME_BILL) {
    if (money === 'dust') window.__give(n);
    else window.__grant({ [money + 's']: n });
  }
};
const through = (kind) => {
  window.__buy(kind);
  runUntil(() => !!state().shield, 400);
  window.__next();
  runUntil(() => state().shieldsDone.includes(kind), 240);
  runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 240);
};
const ready = () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(40000);
  window.__grant({ shards: ARCH_COST * 2, spores: NET_COST * 2 });
  run(1);
  openSites();
  window.__crew(2, 1);
};
const standAtProps = () => {
  ready();
  window.__buy('props');
  runUntil(() => { const sh = state().shield; return sh && sh.laid >= sh.pieces; }, 400);
};
const standAtDome = () => {
  ready();
  for (const k of ['props', 'net', 'arch']) through(k);
  window.__meteor();
  fundDome();
  window.__crew(2, 1, 0, 0, 0, 1);
  window.__buy('dome');
  runUntil(() => { const sh = state().shield; return sh && sh.laid >= sh.pieces; }, 400);
};

group('the rescue skips its dig and its ceremony, and the body still walks out', async () => {
  standAtDome();
  const crew0 = state().crew;
  window.__next();
  runUntil(() => state().beat.yard === 'rescue' && state().beat.camera === 'dome', 400);
  const holding = state();
  window.__holdSkip(true);
  run(HOLD + 0.1);
  const cut = state();
  window.__holdSkip(false);
  // the walk out, a frame at a time: the biggest single step it takes
  let step = 0, last = cut.pairX[0], frames = 0;
  while (state().beat.yard === 'rescue' && frames < 60 * 30) {
    run(1 / 60); frames++;
    const x = state().pairX[0];
    if (x != null && last != null) step = Math.max(step, Math.abs(x - last));
    last = x;
  }
  const out = state();
  window.__reset();
  return [
    ok(holding.beat.yard === 'rescue' && holding.beat.camera === 'dome' && holding.buried,
       'the dome holds, the scene runs, and the one underneath is still under',
       `${holding.beat.yard} ${holding.beat.camera} buried ${holding.buried}`),
    ok(cut.shotOut || cut.beat.camera !== 'dome', 'held through, the camera is let go', `${cut.beat.camera} out ${cut.shotOut}`),
    ok(!cut.buried && cut.rescued, 'and the dig is done', `buried ${cut.buried}`),
    ok(cut.beat.yard === 'rescue' && cut.pair === 1, 'but the walk out is still to be walked',
       `${cut.beat.yard}, pair ${cut.pair}`),
    ok(step > 0 && step < WORKER, 'and it is walked, a step a frame', `biggest step ${step}`),
    ok(!out.beat.yard && out.crew === crew0 + 1, 'then it joins the crew', `crew ${crew0} -> ${out.crew}`),
    ok(frames < 60 * 12, 'without the hearts', `${frames} frames`),
  ];
});

group("a camera scene skips under the key, and the yard's moment plays on", async () => {
  standAtProps();
  window.__next();
  runUntil(() => state().beat.camera === 'props', 400);
  const watching = state();
  window.__holdSkip(true);
  run(HOLD + 0.1);
  const cut = state();
  window.__holdSkip(false);
  runUntil(() => state().shieldsDone.includes('props'), 600);
  const after = state();
  window.__reset();
  return [
    ok(watching.beat.camera === 'props' && !watching.shotOut, 'the props are being watched',
       `${watching.beat.camera} out ${watching.shotOut}`),
    ok(cut.shotOut, 'held through, the camera is let go', `${cut.beat.camera} out ${cut.shotOut}`),
    ok(after.shieldsDone.includes('props'), 'and the props still give way under the rock'),
  ];
});
