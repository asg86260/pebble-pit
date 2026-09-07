// The drain: the one law of infall, and everything that falls in reading it.
//
// What is checked here is the *shape* of a fall, because that is the thing
// three separate curves used to disagree about -- see "The drain" in DESIGN.md.
// A drain is not "goes round and goes in"; it is "goes round FASTER as it goes
// in", and a check that only asserted the radius shrinks would have passed the
// old orbit, which hung a grain at the rim and then dropped it.
//
// Drawing is not checked here and cannot be: the streaks round the disc read
// the same law, and whether they look right is a question for a shot (the
// `grown` scene in tools/look.mjs).

import { group, ok, state, run, runUntil } from './helpers.mjs';

const { riftFall } = await import('../src/rift.js');
const { RIFT_TURNS, RIFT_FALL_FROM, RIFT_FALL_END } = await import('../src/config.js');
const { S, rift } = await import('../src/state.js');

// A torn yard with hands in it: the hole filled past what it holds, which is
// what tears it, and haulers still carrying so grains keep arriving at a rift
// that is already open.
function tornYard() {
  window.__reset();
  window.__crew(3, 6, 2, 2);
  window.__fullSites();
  window.__meteor();
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__give(60000);                 // more than the hole holds: it tears
}

group('a fall comes in steadily and turns faster the tighter it gets', async () => {
  // Sampled along one fall, from the outside in.
  const at = u => riftFall(RIFT_FALL_FROM, u);
  const steps = [0, 0.2, 0.4, 0.6, 0.8, 1].map(at);

  // The radius comes in, and comes in at an even rate -- the gaps between
  // successive samples are the same size. A drain does not stall and then
  // plunge; the plunge people remember is the *spin*, not the descent.
  const drops = [];
  for (let i = 1; i < steps.length; i++) drops.push(steps[i - 1].r - steps[i].r);
  const evenly = Math.max(...drops) - Math.min(...drops) < 1e-9;

  // ...and the turning accelerates: each fifth of the fall spends more turns
  // than the one before it. This is the half the old orbit had backwards.
  const spins = [];
  for (let i = 1; i < steps.length; i++) spins.push(steps[i].turns - steps[i - 1].turns);
  let rising = true;
  for (let i = 1; i < spins.length; i++) if (spins[i] <= spins[i - 1]) rising = false;

  // A thing joining nearer the middle gets the part of the field that is left,
  // rather than a private copy of the whole journey: half the turns of a full
  // fall, near enough, from half the log-distance out.
  const near = riftFall(1, 1).turns, whole = riftFall(RIFT_FALL_FROM, 1).turns;

  return [
    ok(Math.abs(steps[0].r - RIFT_FALL_FROM) < 1e-9, 'a fall starts where it joined',
       `${steps[0].r}`),
    ok(Math.abs(steps[steps.length - 1].r - RIFT_FALL_END) < 1e-9,
       'and ends under the disc, not at a point', `${steps[steps.length - 1].r}`),
    ok(evenly, 'the radius comes in at a steady rate', drops.map(d => d.toFixed(3)).join(', ')),
    ok(rising, 'and every stretch of the fall turns more than the one before it',
       spins.map(s => s.toFixed(2)).join(' -> ')),
    ok(Math.abs(whole - RIFT_TURNS) < 1e-9, 'a whole fall spends the turns it is given',
       `${whole.toFixed(2)} of ${RIFT_TURNS}`),
    ok(near > 0 && near < whole, 'and one that joins near the rim spends fewer',
       `${near.toFixed(2)} against ${whole.toFixed(2)}`)
  ];
});

group('a grain thrown at a torn hole joins the drain where it went in', async () => {
  tornYard();
  // Let the crew work: the hole is torn, so everything they tip is caught at
  // the mouth and put on the spiral. Bought like a player would earn it --
  // nothing here sets `gulped` by hand.
  runUntil(() => S.gulped.length > 0, 120);
  const flying = S.gulped.slice();

  // Every one of them carries where it joined, and the entry is a real place:
  // the distance it actually was from the middle of the disc, in disc radii.
  const stamped = flying.every(m => Number.isFinite(m.from) && Number.isFinite(m.a0));

  // Measured rather than picked. Not by re-deriving it here -- `from` is a
  // snapshot taken as the grain went in and the disc grows with every grain it
  // eats, so the radius that made an older stamp is already gone. What holds
  // whatever the disc has done since is the ratio: divide each grain's real
  // distance by its own stamp and every one of them answers with the radius it
  // was stamped against. A random number cannot do that.
  const mid = { x: rift.x + rift.w * 0.5, y: rift.y + rift.h * 0.5 };
  const radii = flying
    .filter(m => m.from > RIFT_FALL_END)          // ones that were not clamped
    .map(m => Math.hypot(m.x0 - mid.x, m.y0 - mid.y) / m.from);
  const spread = radii.length ? Math.max(...radii) - Math.min(...radii) : 0;
  const honest = radii.length > 1 && spread < rift.w * 0.1;

  // ...and none of them starts from outside the field. A grain caught at the
  // mouth of a hole is nearer than the streaks' own starting radius, so this
  // also says the mouth is inside the drain rather than out past it.
  const inside = flying.every(m => m.from >= RIFT_FALL_END);

  return [
    ok(flying.length > 0, 'the hole is eating what the crew tip in', `${flying.length}`),
    ok(stamped, 'every grain carries the angle and the distance it joined at'),
    ok(honest, 'and they are where the grain actually was, not a number picked for it',
       `radii ${radii.map(r => r.toFixed(1)).join(', ')}`),
    ok(inside, 'none of them joins from outside the drain')
  ];
});

group('a swallowed grain spirals in rather than hanging and dropping', async () => {
  tornYard();
  runUntil(() => S.gulped.length > 0, 120);

  // Follow one grain across its fall, sampling where it actually is. This is
  // the check the old orbit would have failed: its radius barely moved for the
  // first half of a fall and then collapsed.
  const one = S.gulped[0];
  const mid = { x: rift.x + rift.w * 0.5, y: rift.y + rift.h * 0.5 };
  const far = () => Math.hypot(one.x - mid.x, one.y - mid.y);
  const seen = [];
  for (let i = 0; i < 5 && S.gulped.includes(one); i++) { seen.push(far()); run(0.2); }

  let closing = seen.length > 1;
  for (let i = 1; i < seen.length; i++) if (seen[i] > seen[i - 1] + 0.5) closing = false;

  // It is gone by the end of its fall rather than sitting on the list: the
  // orbit is a journey with an end, and the list is a drawing budget.
  const done = runUntil(() => !S.gulped.includes(one), 30);

  return [
    ok(seen.length > 1, 'there was a grain to follow', `${seen.length} samples`),
    ok(closing, 'and it comes in the whole way, never back out',
       seen.map(d => Math.round(d)).join(' -> ')),
    ok(done, 'and it is gone once its fall is over')
  ];
});
