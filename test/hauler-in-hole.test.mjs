// A hauler down the torn, emptied hole is never buried by the hole coming up
// round it faster than a body can rise out of it. The buried rule
// (verify.js) gives a body a second to come out, and nothing rises faster
// than half a cell a frame, so a hole's depth arriving in one frame over a
// body on its floor or on a rung is a body in the ground for a second and
// more. Two things did that:
//
//  - the drowning, which puts the hole's way up at the plank in one frame
//    (`pitTop` in pit.js). It waits, the way it waits for its camera, until
//    nobody is down the hole, and nobody is sent down while it is owed;
//  - a grant (`__grant`, the checks' handout), whose dust and finds were
//    laid as a hole's worth of pile in one frame. With the rift open and a body down the hole,
//    it goes through the rift instead, which is where a grant's overflow
//    goes already.
//
// The hauler is set down at the foot of the near ladder (the setup neither
// check is about); getting out is its own: its job walks it home up the
// ladder. Red before either fix is the buried rule, thrown out of the run.
import { group, ok, run, yard, state, WORKER } from './helpers.mjs';

const { ABYSS_AT, SPORE_CELL, findKind } = await import('../src/config.js');
const { pitLadder, pitTop, NEAR } = await import('../src/pit.js');
const { plant, wayAt } = await import('../src/route.js');

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
