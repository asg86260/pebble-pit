// The pit drowns over an empty hole. The drowning raises the hole's way from
// its floor to the plank at the brim in one frame (`pitTop` in pit.js), so a
// body still down there -- climbing out on the near ladder at the ladder's
// pace, or standing on the floor -- would be a hole's depth inside the
// liquid. The drowning waits, the way it waits for its camera, until nobody
// is down the hole, and nobody is sent down while it is owed.
//
// The hauler is set down at the foot of the near ladder on the frame the
// drowning would otherwise begin (the setup this check is not about); getting
// out is its own: its job walks it home up the ladder. Red before the fix is
// the buried rule (verify.js), thrown out of the run.
import { group, ok, run, yard, WORKER } from './helpers.mjs';

const { ABYSS_AT } = await import('../src/config.js');
const { pitLadder, pitTop, NEAR } = await import('../src/pit.js');
const { plant, wayAt } = await import('../src/route.js');

const S = yard.S;
// Twenty seconds: the climb out is about two.
const LIMIT_F = 60 * 20;

group('the pit does not drown over a hauler still down the hole', async () => {
  window.__reset();
  window.__crew(0, 1);
  // An overflow tears the hole the way a full pit does, and the tear's gulp
  // empties it; then the threshold is crossed by hand, since grains given
  // now would heap the floor back up.
  window.__give(60000);
  run(10);
  window.__tear(ABYSS_AT);

  // Frame by frame to the last few before the drowning would begin: owed, its
  // camera almost settled (`due` in rift.js begins it the frame the shot is).
  let f = 0;
  for (; f < LIMIT_F && !(S.riftDue === 'drown' && S.beat.camera === 'drown' && S.hush > 0.9); f++) run(1 / 60);
  const owed = S.riftDue === 'drown' && !S.drowned;

  const w = S.workers.find(b => b.type === 'hauler');
  const x = pitLadder(NEAR).x;
  // Out of the shed it waits in when there is no work, as `__hold` does.
  w.inside = false; w.x = x; w.route = null; w.goal = null; w.muckAt = null;
  plant(w, pitTop(x + WORKER / 2) - WORKER);
  const down = wayAt(w.x, w.y).key === 'hole' && w.y + WORKER > S.groundY + WORKER;

  let threw = null, g = 0;
  try { for (; g < LIMIT_F && !S.drowned; g++) run(1 / 60); run(3); }
  catch (e) { threw = e.message; }

  return [
    ok(owed, 'the drowning came due over a torn pit', `due ${S.riftDue}, after ${f} frames`),
    ok(down, 'with the hauler at the foot of the ladder, down the hole', `${Math.round(w.x)},${Math.round(w.y)}`),
    ok(!threw, 'and nobody is buried in the liquid', threw || ''),
    ok(S.drowned, 'the pit drowns all the same, once the hole is clear', `${g} frames`),
    ok(wayAt(w.x, w.y).key !== 'hole' || w.y + WORKER <= S.groundY + 1,
       'with the hauler out of it', `${Math.round(w.x)},${Math.round(w.y)}`)
  ];
});
