// Workers assigned by hand (wave7b-assign, feedback7 item 16): a held body
// dropped on a station retrains onto it. The ask moves at the drop -- the same
// move the roster buttons make -- and the body walks its retraining on foot.
// A drop anywhere else, or onto a full station, is exactly the old throw.
//
// The drop goes through the real drop() -- the thing these checks are about is
// what letting go of a body does, so that part is played, not set. The crew
// itself is the setup, and __crew is the hook for setup.

import { yard, group, ok, state, run, runUntil, WORKER } from './helpers.mjs';

const { dropTargets, holdTarget } = await import('../src/crew/assign.js');
const { lift, drop } = await import('../src/crew/pointer.js');
const { JOB, JOB_OF } = await import('../src/jobs.js');
const { roomAt } = await import('../src/levels.js');
const { kitX } = await import('../src/world.js');

const S = yard.S;

// Every job with an ask of its own; carrying is the remainder and is checked
// against this sum, not listed in it.
const ASKED = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.SCHOLAR, JOB.PURIFY,
               JOB.STIR, JOB.JANITOR, JOB.WIZARD, JOB.TEACH, JOB.BUILD];
const asked = () => ASKED.reduce((n, j) => n + (S[j] || 0), 0);

// Put the held body's center on a target's center. lift() is the real lift;
// only the carry across the yard is elided, because a lift has no walk to
// watch -- the body is in your hand.
const holdOver = (w, t) => {
  lift(w);
  w.x = t.rect.x + t.rect.w / 2 - WORKER / 2;
  w.y = t.rect.y + t.rect.h / 2 - WORKER / 2;
  S.mouse.x = w.x + WORKER / 2;
  S.mouse.y = w.y + WORKER / 2;
};

group('a rockhand dropped on the farm retrains and walks there', async () => {
  window.__crew(1, 2, 0, 1);                  // a rockhand, two haulers, a farmhand
  window.__levels({ plotLevel: 2 });          // the ground starts with one plot; make room
  const w = S.workers.find(o => o.type === 'rockhand');
  const farm = dropTargets().find(t => t.key === 'farm');
  holdOver(w, farm);
  const ring = holdTarget();
  drop(w);
  const movedAsk = ok(S.rockhands === 0 && S.farmhands === 2,
    'the asks move at the drop, miners down one and farmhands up one',
    `rockhands ${S.rockhands}, farmhands ${S.farmhands}`);
  // The walk is watched frame by frame: the body may fall and walk, never
  // jump. A teleport is a frame that covers more ground than any fall or
  // stride can.
  let jump = 0, lx = w.x, ly = w.y;
  for (let i = 0; i < 60 * 90; i++) {
    run(1 / 60);
    if (!w.inside)
      jump = Math.max(jump, Math.hypot(w.x - lx, w.y - ly));
    lx = w.x; ly = w.y;
    if (!w.walking && !w.falling && JOB_OF[w.type] === JOB.FARM &&
        i > 60) break;
  }
  return [
    ok(!!ring, 'the target under the held body reads before the drop',
       ring && ring.key),
    movedAsk,
    ok(w.type === 'farmhand', 'the body itself is the retrained one', w.type),
    ok(jump < WORKER * 3, 'and it walked, never jumped',
       `largest single-frame move ${jump.toFixed(1)}px`),
    ok(!w.walking && !w.falling, 'and it ended up settled at its new work',
       `walking ${!!w.walking}, falling ${!!w.falling}`)
  ];
});

group('a drop on a full station changes nothing and throws as today', async () => {
  window.__crew(1, 1, 0, 4);                  // every plot the farm has, taken
  // The setup only counts if the farm really is full; a wider plot table would
  // make this a check of nothing.
  const full = roomAt(JOB.FARM) < 1;
  const w = S.workers.find(o => o.type === 'rockhand');
  const before = { rock: S.rockhands, farm: S.farmhands };
  const farm = dropTargets().find(t => t.key === 'farm');
  holdOver(w, farm);
  const ring = holdTarget();
  drop(w);
  return [
    ok(full, 'the farm is full for this check', `room ${roomAt(JOB.FARM)}`),
    ok(ring === null, 'a full station shows no ring: no ring, no deal'),
    ok(S.rockhands === before.rock && S.farmhands === before.farm,
       'no ask moved', `rockhands ${S.rockhands}, farmhands ${S.farmhands}`),
    ok(w.falling && w.type === 'rockhand',
       'the body takes the ordinary throw instead', w.type)
  ];
});

group('a drop on open ground changes nothing and throws as today', async () => {
  window.__crew(1, 2, 0, 1);
  const w = S.workers.find(o => o.type === 'rockhand');
  const before = { rock: S.rockhands, farm: S.farmhands, haul: S.haulers };
  lift(w);
  // A spot on no target: just clear of every target's padded rect, mid-air
  // over the yard.
  let x = 0;
  const clear = (px) => !dropTargets().some(t =>
    px >= t.rect.x && px <= t.rect.x + t.rect.w);
  for (x = 40; x < 4000 && !clear(x); x += 20);
  w.x = x - WORKER / 2;
  w.y = S.groundY - 120;
  S.mouse.x = x; S.mouse.y = w.y + WORKER / 2;
  const ring = holdTarget();
  drop(w);
  return [
    ok(ring === null, 'no target, no ring'),
    ok(S.rockhands === before.rock && S.farmhands === before.farm &&
       S.haulers === before.haul, 'no ask moved',
       `rockhands ${S.rockhands}, farmhands ${S.farmhands}, haulers ${S.haulers}`),
    ok(w.falling && w.type === 'rockhand', 'the body just falls, as today')
  ];
});

group('rebalance still owns the haulers after a drop', async () => {
  window.__crew(2, 3, 0, 1);
  window.__levels({ plotLevel: 2 });          // room on the farm for the retrained body
  const w = S.workers.find(o => o.type === 'rockhand');
  const farm = dropTargets().find(t => t.key === 'farm');
  holdOver(w, farm);
  drop(w);
  run(2);
  return [
    ok(S.haulers === S.crew - asked(),
       'carrying is the remainder, rebalance()\'s to give',
       `crew ${S.crew}, asked ${asked()}, haulers ${S.haulers}`)
  ];
});

group('a hauler dropped on the rock goes for its helmet before it climbs', async () => {
  // Three helmets, one on a head: two spare on the stand. The drop lands the
  // body ON the station, and landing there used to settle it -- legs and all,
  // hat leg included -- so it stood on the rock bare-headed.
  window.__crew(1, 3, 0, 0);
  window.__kit({ breakers: 3 });
  window.__shack();
  run(2);
  const w = S.workers.find(o => o.type === 'hauler');
  const rock = dropTargets().find(t => t.key === 'rock');
  holdOver(w, rock);
  drop(w);
  const legs = [w.leg, ...(w.legs || []).map(l => l.do)];
  // Watched to the stand: it must reach the hat still bare, and climb wearing it.
  let bareAtStand = false, landedWalking = false;
  for (let i = 0; i < 60 * 60; i++) {
    run(1 / 60);
    if (!w.falling && w.walking && w.leg === 'wear') landedWalking = true;
    if (w.leg === 'wear' && !w.trained && Math.abs(w.x - kitX(JOB.ROCK)) < WORKER) bareAtStand = true;
    if (!w.walking && !w.falling && w.leg === 'work') break;
  }
  return [
    ok(legs[0] === 'wear' && legs[1] === 'work', 'the drop queues the hat, then the work', legs.join(' > ')),
    ok(landedWalking, 'and landing on the station keeps that walk'),
    ok(bareAtStand, 'so it reaches the stand bare-headed'),
    ok(w.trained && w.kitOf === JOB.ROCK && !w.walking, 'and is at work in its helmet',
       `trained ${!!w.trained}, kitOf ${w.kitOf}, walking ${!!w.walking}`)
  ];
});
