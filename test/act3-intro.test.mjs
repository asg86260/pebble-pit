// Act 3's opening as the owner signed it off (review 'act 3: the intro', K2,
// 2026-11-01): the go-on card pressed, the meteor down on the house and the
// crater it leaves, the souls fading up out of the ruin as the gates fade in
// over them, through, the camera on to God, his lines read, and the opening
// over -- play handed back about twenty-two seconds after the press, plus
// however long the lines take to read. Then the two of them walk briskly to
// the pedestal with the camera left where the player has it, and the bowl
// round the rock is walked down into and out of. Act 4's way back down and
// the ending's freed souls float down from the gates where the stair was.
import { group, ok, run, runUntil, yard } from './helpers.mjs';

const S = yard.S;
const { P, WORKER, ACT_GOON_WAIT_S, ACT_GOON_FADE_S, ACT_CRATER, ACT_PEDESTAL_K, GHOST_PX_S, MANSION_SOULS } = await import('../src/config.js');
const { sayGoOn, goOnAlpha } = await import('../src/actbeats.js');
const { beatDone } = await import('../src/beats.js');
const { cutsceneRunning } = await import('../src/cutscene.js');
const { ruinX, yardFeet, threshold, underGates, gatesSeen, soulSeen, floatK, pairBodies } = await import('../src/ghosts.js');
const { craterDip, craterMid } = await import('../src/crater.js');
const { feetOn, ways } = await import('../src/route.js');
const { soulAt, gathered } = await import('../src/mansion.js');

// A frame's walk is at most the pace, called and hurried: past that is a teleport.
const MOST = P * 4;

group('the opening hands play back about twenty-two seconds after the go-on card, plus the lines', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  runUntil(() => goOnAlpha() >= 1, 4 * (ACT_GOON_WAIT_S + ACT_GOON_FADE_S));
  sayGoOn();
  // frame by frame from the press: when the souls are first seen and the
  // gates, what is seen of each as they rise, and when play comes back
  let t = 0, back = null, souls = null, gates = null, gatesEarly = false, linesAt = null;
  for (let i = 0; i < 60 * 60 && back == null; i++) {
    run(1 / 60); t += 1 / 60;
    const p = S.acts.pair;
    if (window.__line() && linesAt == null) linesAt = t;
    window.__goOnLine();                      // a click as each line comes up
    if (p && soulSeen(p) > 0 && souls == null) souls = { t, k: floatK(p) };
    if (S.acts.house === 'fallen' && gatesSeen() > 0 && gates == null) gates = { t, k: floatK(p) };
    if (S.acts.house === 'fallen' && !p && gatesSeen() > 0) gatesEarly = true;
    if (beatDone('meet-god') && !cutsceneRunning()) back = t;
  }
  const end = { back, linesAt, souls, gates, gatesEarly, house: S.acts.house, dip: craterDip(craterMid()) };
  window.__actsOn(null);
  return [
    ok(back != null && back > 19 && back < 26, 'play comes back about twenty-two seconds after the press, the lines read as they come', JSON.stringify(end)),
    ok(linesAt != null && linesAt < back, 'God\'s lines come up at the end of the cutscene, before play comes back', JSON.stringify(end)),
    ok(!gatesEarly && gates && gates.k > 0.3 && souls && souls.k < 0.05, 'the souls are seen as they leave the ruin, the gates only a third of the way up', JSON.stringify(end)),
    ok(end.house === 'fallen' && end.dip === ACT_CRATER.depth * P, 'the house lies under the rock in a crater as deep as it should be', JSON.stringify(end))
  ];
});

group('after the opening the two of them walk briskly to the pedestal, the camera left where it is', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('home');
  runUntil(() => goOnAlpha() >= 1, 4 * (ACT_GOON_WAIT_S + ACT_GOON_FADE_S));
  sayGoOn();
  runUntil(() => { window.__goOnLine(); return beatDone('meet-god') && !cutsceneRunning(); }, 60);
  const cam = S.camX, from = S.acts.pair.x;
  let t = 0, moved = 0, jump = 0, was = null;
  for (let i = 0; i < 60 * 40 && S.acts.pair.at !== 'pedestal'; i++) {
    run(1 / 60); t += 1 / 60;
    moved = Math.max(moved, Math.abs(S.camX - cam));
    const p = S.acts.pair;
    if (was) jump = Math.max(jump, Math.hypot(p.x - was.x, p.y - was.y));
    was = { x: p.x, y: p.y };
  }
  const p = S.acts.pair, pace = Math.abs(p.x - from) / t;
  const walked = { at: p.at, t: +t.toFixed(2), pace: Math.round(pace), moved, jump: +jump.toFixed(1), refuse: beatDone('refuse') };
  window.__actsOn(null);
  return [
    ok(walked.at === 'pedestal' && walked.refuse, 'they reach the pedestal, the refusal done', JSON.stringify(walked)),
    ok(pace > GHOST_PX_S * (ACT_PEDESTAL_K - 1.5), `briskly: about ${ACT_PEDESTAL_K} times the road's pace`, JSON.stringify(walked)),
    ok(moved < 1, 'the camera stays where the player has it', JSON.stringify(walked)),
    ok(jump < GHOST_PX_S * ACT_PEDESTAL_K / 60 + P, 'walked, every frame a step from the last', JSON.stringify(walked))
  ];
});

group('the crater is ground: the bowl is walked down into and out of, and the rock sits in it', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('act4');
  run(1);
  const mid = craterMid(), yard0 = ways().yard;
  const bottom = feetOn(yard0, mid - WORKER / 2) + WORKER, lip = feetOn(yard0, mid + (ACT_CRATER.half + 2) * P) + WORKER;
  // the ghosts set off from the ruin on their carry: up out of the bowl
  const p = S.acts.pair;
  Object.assign(p, { x: ruinX(), y: yardFeet(ruinX()), route: null, leg: 0, at: null, hold: null });
  window.__sendPair('loop');
  let deepest = -Infinity, out = false, jump = 0, was = null;
  for (let i = 0; i < 60 * 20 && !out; i++) {
    run(1 / 60);
    const b = pairBodies()[0];
    deepest = Math.max(deepest, b.y + WORKER);
    if (Math.abs(b.x - mid) > (ACT_CRATER.half + 2) * P) out = Math.abs(b.y + WORKER - S.groundY) < 1;
    if (was) jump = Math.max(jump, Math.hypot(b.x - was.x, b.y - was.y));
    was = b;
  }
  const bowl = { bottom, lip, ground: S.groundY, deepest, out, jump: +jump.toFixed(1) };
  window.__actsOn(null);
  return [
    ok(bottom === S.groundY + ACT_CRATER.depth * P && lip === S.groundY, 'the ground dips by the bowl under the rock and is level past its lip', JSON.stringify(bowl)),
    ok(deepest >= S.groundY + P && out && jump < MOST, 'a body walks up out of the bowl onto the level ground, a step a frame', JSON.stringify(bowl))
  ];
});

group('act 4\'s freed souls float down from the gates and walk on to their files', async () => {
  window.__actsOn(true);
  window.__crew(2, 2);
  window.__actsAt('mansion', 999);
  run(1);
  const top = threshold(), foot = underGates();
  // the gathering's clock, read off its own soul positions
  const first = soulAt(0, 0), down = soulAt(0, 0.01);
  let jump = 0, was = null, landed = false;
  for (let g = 0; g < 60; g += 1 / 60) {
    const s = soulAt(0, g);
    if (was) jump = Math.max(jump, Math.hypot(s.x - was.x, s.y - was.y));
    if (!s.floating && Math.abs(s.y - foot.y) < 1) landed = true;
    was = s;
  }
  const last = soulAt(MANSION_SOULS - 1, 1e4);
  const came = { first, down: !!down && down.floating, top, foot, landed, jump: +jump.toFixed(1), last };
  window.__actsOn(null);
  return [
    ok(Math.hypot(first.x - top.x, first.y - top.y) < 1 && came.down, 'a freed soul comes out of the gates on their step, floating', JSON.stringify(came)),
    ok(landed && jump < MOST, 'and floats down to the ground under them, and walks on, a step a frame', JSON.stringify(came)),
    ok(!last.floating && Math.abs(last.y - (feetOn(ways().yard, last.x))) < 1, 'the last one stands on the ground in its file', JSON.stringify(came))
  ];
});
