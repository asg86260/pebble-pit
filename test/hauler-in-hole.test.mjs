// A hauler down the torn, emptied hole is never buried by the hole coming up
// round it faster than a body can rise out of it. The buried rule
// (verify.js) gives a body a second to come out, and nothing rises faster
// than half a cell a frame, so a hole's depth arriving in one frame over a
// body on its floor or on a rung is a body in the ground for a second and
// more. Three things did that:
//
//  - the drowning, which puts the hole's way up at the plank in one frame
//    (`pitTop` in pit.js). It waits, the way it waits for its camera, until
//    nobody is down the hole, and nobody is sent down while it is owed;
//  - a grant (`__grant`, the checks' handout), whose dust and finds were
//    laid as a hole's worth of pile in one frame. With the rift open and a body down the hole,
//    it goes through the rift instead, which is where a grant's overflow
//    goes already;
//  - the casino's pay, which a full tray (or a full sky) banked as a lump
//    of thousands of grains on the pile in one frame. It is owed instead and
//    thrown out of the hatch a grain at a time (`S.paying`), and a torn pit
//    takes a thrown grain at the mouth.
//
// The hauler is set down at the foot of the near ladder (the setup neither
// check is about); getting out is its own: its job walks it home up the
// ladder. Red before either fix is the buried rule, thrown out of the run.
import { group, ok, run, runUntil, yard, state, WORKER } from './helpers.mjs';

const { ABYSS_AT, SPORE_CELL, findKind } = await import('../src/config.js');
const { pitLadder, pitTop, NEAR } = await import('../src/pit.js');
const { plant, wayAt } = await import('../src/route.js');
const { tray } = await import('../src/state.js');
const { fillFlat } = await import('../src/grid.js');

const S = yard.S;
// Twenty seconds: the climb out is about two.
const LIMIT_F = 60 * 20;

// An overflow tears the hole the way a full pit does, and the tear's gulp
// empties it.
function tornAndEmpty() {
  window.__reset();
  window.__crew(0, 1);
  window.__give(60000);
  run(10);
}
// The hauler at the foot of the near ladder, out of the shed it waits in
// when there is no work (as `__hold` does); whether it is down the hole.
function haulerDown() {
  const w = S.workers.find(b => b.type === 'hauler');
  const x = pitLadder(NEAR).x;
  w.inside = false; w.x = x; w.route = null; w.goal = null; w.muckAt = null;
  plant(w, pitTop(x + WORKER / 2) - WORKER);
  return { w, down: wayAt(w.x, w.y).key === 'hole' && w.y + WORKER > S.groundY + WORKER };
}
const out = w => wayAt(w.x, w.y).key !== 'hole' || w.y + WORKER <= S.groundY + 1;

group('the pit does not drown over a hauler still down the hole', async () => {
  tornAndEmpty();
  // The threshold crossed by hand, since grains given now would heap the
  // floor back up.
  window.__tear(ABYSS_AT);

  // Frame by frame to the last few before the drowning would begin: owed, its
  // camera almost settled (`due` in rift.js begins it the frame the shot is).
  let f = 0;
  for (; f < LIMIT_F && !(S.riftDue === 'drown' && S.beat.camera === 'drown' && S.hush > 0.9); f++) run(1 / 60);
  const owed = S.riftDue === 'drown' && !S.drowned;
  const { w, down } = haulerDown();

  let threw = null, g = 0;
  try { for (; g < LIMIT_F && !S.drowned; g++) run(1 / 60); run(3); }
  catch (e) { threw = e.message; }

  return [
    ok(owed, 'the drowning came due over a torn pit', `due ${S.riftDue}, after ${f} frames`),
    ok(down, 'with the hauler at the foot of the ladder, down the hole', `${Math.round(w.x)},${Math.round(w.y)}`),
    ok(!threw, 'and nobody is buried in the liquid', threw || ''),
    ok(S.drowned, 'the pit drowns all the same, once the hole is clear', `${g} frames`),
    ok(out(w), 'with the hauler out of it', `${Math.round(w.x)},${Math.round(w.y)}`)
  ];
});

group('a grant does not bury a hauler down the torn hole', async () => {
  tornAndEmpty();
  const { w, down } = haulerDown();
  const before = state();
  window.__grant({ dust: 30000, spores: 8000 });   // an act 3 bill's
  const granted = state();

  let threw = null;
  try { run(4); } catch (e) { threw = e.message; }
  const after = state();
  let spores = 0;
  for (const v of yard.pit.grid) if (findKind(v) === SPORE_CELL) spores++;

  return [
    ok(down && before.riftOpen && !before.drowned, 'the hauler is down a torn hole',
       `${Math.round(w.x)},${Math.round(w.y)}, open ${before.riftOpen}`),
    ok(!threw, 'and the grant does not bury it', threw || ''),
    ok(granted.stored === before.stored + 30000, 'the grant is all counted',
       `${before.stored} -> ${granted.stored}`),
    ok(after.stored - after.rift === after.pitDust, 'the counter is still the pile plus what is through',
       `${after.stored} - ${after.rift} vs ${after.pitDust}`),
    ok(spores === S.spores - S.riftHeld.spores, 'and the finds are the pile plus what is through',
       `${spores} in the hole, ${S.spores} owned, ${S.riftHeld.spores} through`),
    ok(out(w), 'and the hauler comes out', `${Math.round(w.x)},${Math.round(w.y)}`)
  ];
});

group('a casino payout does not bury a hauler down the torn hole', async () => {
  tornAndEmpty();
  window.__casino(true);
  window.__build();
  run(0.1);
  // the stake poured out of what is through the rift, the way a player does
  window.__holdArm(true, 1);
  runUntil(() => (state().pot?.stake || 0) >= 20000, 60);
  window.__holdArm(false);
  runUntil(() => !state().pouring && state().tableAir === 0, 60);
  const staked = S.pot ? S.pot.stake : 0;
  const coins = () => ({ dust: S.stored, spore: S.spores, shard: S.shards, spark: S.sparks });
  const s1 = coins();
  window.__tapSign();
  runUntil(() => S.drop && S.drop.stage === 'pay', 60);
  // The tray with no room (the setup this is not about): every bin's pay
  // finds no cell, which is where the lump came from.
  fillFlat(tray, tray.cols * tray.rows);
  const { w, down } = haulerDown();
  const cells = () => { let n = 0; for (const v of yard.pit.grid) if (v) n++; return n; };

  let threw = null, worst = 0, off = null, hand = null, prev = cells();
  try {
    for (let f = 0; f < 60 * 30 && (f < 120 || S.drop || state().paying || state().tray || state().toHole); f++) {
      // a second of lumps, then the tray let go, or the bins wait on it forever
      if (f === 60) { fillFlat(tray, 0); tray.capped = null; }
      run(1 / 60);
      const n = cells();
      worst = Math.max(worst, n - prev);
      prev = n;
      const st = state();
      if (off == null && st.stored - st.rift !== st.pitDust) off = `${st.stored} - ${st.rift} vs ${st.pitDust}`;
      hand = S.hand || hand;
    }
    run(3);
  } catch (e) { threw = e.message; }
  // half a cell of rise a frame across the whole hole, the most anything may pour
  const half = Math.floor(yard.pit.cols / 2);

  return [
    ok(down && S.riftOpen && staked >= 20000, 'the hauler is down a torn hole, and the hand staked',
       `${Math.round(w.x)},${Math.round(w.y)}, stake ${staked}`),
    ok(!threw, 'and the payout does not bury it', threw || ''),
    ok(worst <= half, 'no frame lays more than half a cell over the hole', `${worst} grains in a frame, ${half} allowed`),
    ok(off == null, 'the counter is the pile plus what is through, every frame', off || ''),
    ok(hand && Object.keys(s1).every(k => coins()[k] === s1[k] + (hand.pays[k] || 0)), 'and every grain won is counted',
       hand ? `${JSON.stringify(s1)} + ${JSON.stringify(hand.pays)} vs ${JSON.stringify(coins())}` : 'no hand'),
    ok(out(w), 'and the hauler comes out', `${Math.round(w.x)},${Math.round(w.y)}`)
  ];
}, { reload: false });
