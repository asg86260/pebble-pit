// The hop: a rock lands hard and the crew are knocked off their feet for a
// beat (wave-polish, track C). The hop is stamped on the body by `landRock`
// and drawn by `drawWorkers`; nothing in the simulation moves for it, so the
// only facts the yard has about it are the two stamps, and this file is about
// those: who gets them, when, and who does not.

import { group, ok, run, haveRock } from './helpers.mjs';
import { S } from '../src/state.js';
import { landRock } from '../src/rock.js';
import { keepOf } from '../src/crew.js';
import { LAND_HOP_MS } from '../src/config.js';

// One frame at a time to the landing, so the stamps are read on the frame the
// rock came down and not a second later, when bodies have walked back to work.
// The limit is in game seconds: the dance before the drop is five of them.
const runToLanding = (limit = 20) => {
  let fell = false;
  for (let i = 0; i < limit * 60; i++) {
    run(1 / 60);
    if (S.rockFall > 0) fell = true;
    else if (fell) return true;
  }
  return false;
};

// Stood on the yard with nothing else the matter: not through a door, not in
// the air one way or another. The same bodies `landRock` hands the mark to.
const onGround = w => !w.inside && !w.aloft && !w.falling && !w.lifted && !w.floating;

// Rock two stood, cleared by the rockhands, and rock three dropped on the
// yard: everybody standing on it gets the same stamp, at the landing, with the
// rock's weight on it.
group('a rock landing knocks the crew off their feet', async () => {
  window.__crew(2, 1);
  window.__jump(2);
  haveRock();
  window.__next();
  const landed = runToLanding();
  const crew = S.workers.filter(onGround);
  const stamped = crew.filter(w => w.hopAt === S.landAt && w.hopK > 0);
  const k = crew[0]?.hopK;
  return [
    ok(landed && S.landAt > 0, 'the rock comes down hard', `landAt ${S.landAt}`),
    ok(crew.length > 0, 'and there is somebody standing there', `${crew.length}`),
    ok(stamped.length === crew.length, 'every one of them is knocked at the moment it lands',
       `${stamped.length} of ${crew.length}`),
    ok(k > 0 && k <= 1.6, 'and thrown by the weight of it, on the shake\'s own scale', `${k}`),
    ok(crew.every(w => w.hopK === k), 'the same weight for everybody',
       crew.map(w => w.hopK).join()),
    ok(LAND_HOP_MS > 0, 'for a beat', `${LAND_HOP_MS}ms`)
  ];
});

// A rock set down by the dome is placed, not dropped -- no shake, no mark, and
// nobody off their feet. The gentle branch is reached directly: standing a
// dome and having it catch a rock is shield.js's business, and the rule under
// test is the landing's own.
group('a rock set down gently knocks nobody', async () => {
  window.__crew(2, 1);
  window.__jump(2);
  haveRock();
  window.__next();
  // frame by frame: the whole fall is under a second, and `runUntil` looks once
  // a second, so it would find the rock already down
  for (let i = 0; i < 20 * 60 && !(S.rockFall > 0); i++) run(1 / 60);
  const inAir = S.rockFall > 0;
  for (const w of S.workers) { delete w.hopAt; delete w.hopK; }
  landRock(true);
  const hopped = S.workers.filter(w => w.hopAt != null || w.hopK != null);
  return [
    ok(inAir, 'the rock was in the air to be set down'),
    ok(S.rockFall === 0 && S.landAt === 0, 'and is down without a splat',
       `rockFall ${S.rockFall}, landAt ${S.landAt}`),
    ok(hopped.length === 0, 'and nobody is knocked off their feet', `${hopped.length}`)
  ];
});

// The stamps are for the frame, not for the save. `keepOf` is what a body
// takes into the save; the hop is not in it, so a yard loaded mid-hop does not
// finish somebody else's jump.
group('the hop is never written to the save', async () => {
  window.__crew(2, 1);
  window.__jump(2);
  haveRock();
  window.__next();
  runToLanding();
  const kept = S.workers.map(keepOf);
  const leaked = kept.filter(k => 'hopAt' in k || 'hopK' in k);
  return [
    ok(S.workers.some(w => w.hopAt != null), 'the crew were knocked'),
    ok(leaked.length === 0, 'and none of that goes into the save', `${leaked.length}`)
  ];
});
