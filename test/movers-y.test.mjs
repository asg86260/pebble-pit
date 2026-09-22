// Nothing teleports, asked of height.
//
// A mover that writes a body's height outright puts it wherever the line says
// whatever it stood at the frame before: a body getting onto a machine's
// roof, into a basket, or handed over from a body thrown through the air jumps
// or drops the difference in one frame. `climbTo` (route.js) is the law of
// walking height and never moves feet more than a cell a frame, so that is the
// bar each mover here is held to, asked of every body it moves, every frame.
//
// A body falling or held on the cursor is excused: that is its own motion,
// with its own checks.

import { group, ok, state, run, openSites, buyNow, yard, P, WORKER } from './helpers.mjs';
import { SKIP_HOLD_MS } from '../src/config.js';

const excused = w => w.falling || w.lifted;

// A cell, and the float dust a frame's length carries (`frames` in clock.js).
const CELL = P + 1e-6;

// The worst single-frame change of height over `frames` frames, among the
// bodies `pick` names, and who and when. `until` ends the watch early.
function watch(frames, pick = () => true, until = () => false) {
  const last = new Map();
  let worst = 0, at = '';
  for (let f = 0; f < frames; f++) {
    run(1 / 60);
    for (const w of yard.S.workers) {
      const was = last.get(w);
      if (!pick(w) || excused(w)) { last.delete(w); continue; }
      if (was != null && Math.abs(w.y - was) > worst) {
        worst = Math.abs(w.y - was);
        at = `${w.name} (${w.type}) ${Math.round(was)} -> ${Math.round(w.y)} on frame ${yard.S.tick}, goal ${w.goal}`;
      }
      last.set(w, w.y);
    }
    if (until()) break;
  }
  return { worst, at };
}

const aboard = w => yard.S.tick - (w.aboardAt ?? -9) <= 1 && Math.abs(w.y - w.foot) < 0.5;

// --- the machine tender (crew/tenders.js) ----------------------------------------
// The ram's seat is five cells up on its roof and the jaw's nine up its rig;
// the tender gets there up the side, not in one frame from the ground.
// The ram is bought off its board as a player buys it; the jaw's row waits on
// the cut's specialists, which are not what this is about, so it is stood up.
for (const [key, type, crew] of [['ram', 'rockhand', [3, 0]], ['jaw', 'quarrier', [0, 0, 3]]])
group(`a tender climbs up onto the ${key} rather than appearing on it`, async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(...crew);
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  run(8);                                     // at work on the station
  const bought = key === 'ram' ? buyNow(key) : (window.__machine(key, { bought: true }), true);
  const seated = () => yard.S.workers.some(w => w.type === type && aboard(w));
  const on = watch(40 * 60, w => w.type === type, seated);
  const up = seated();
  window.__crew(0, 0, 0);
  return [
    ok(bought, `the ${key} is bought`),
    ok(up, 'and a body gets up into its seat'),
    ok(on.worst <= CELL, 'never more than a cell of height in a frame on the way',
       `worst ${on.worst.toFixed(1)}px: ${on.at}`)
  ];
});

// --- the balloon's rider (balloon.js) --------------------------------------------
// The basket hangs off the mast over a body's head, so a rider climbs into it.
group('a rider climbs into the basket rather than appearing in it', async () => {
  window.__reset();
  window.__crew(0, 3);
  window.__grant({ sparks: 999, shards: 999, spores: 999, cores: 9 });
  window.__tip(90000);
  window.__air({ open: true });
  run(2);
  buyNow('balloon');
  run(1);
  window.__air({ purifiers: 2 });
  const up = () => state().craft[0] && state().craft[0].up;
  const seen = watch(3000, w => w.type === 'purifier', up);
  const rose = up();
  window.__air({ purifiers: 0 });
  return [
    ok(rose, 'a body put on the purifiers gets into the craft and it goes up'),
    ok(seen.worst <= CELL, 'and no rider moves more than a cell of height in a frame',
       `worst ${seen.worst.toFixed(1)}px: ${seen.at}`)
  ];
});

// --- the opening (intro.js) ------------------------------------------------------
// The body that carries on is the one you were watching, at the height you
// were watching it: cut while it is thrown clear, it is still in the air.
group('a skipped opening hands its body over at the height it was', async () => {
  // Once through to find the frame the survivor is thrown on...
  window.__reset(true);
  const t0 = yard.S.tick;
  for (let i = 0; i < 7200 && yard.S.beat.yard !== 'fall'; i++) run(1 / 60);
  const thrown = yard.S.tick - t0;
  // ...and again, with the space bar held so the cut lands near the top of it.
  window.__reset(true);
  const t1 = yard.S.tick;
  const hold = Math.round(SKIP_HOLD_MS / 1000 * 60);
  let before = null, ground = null;
  for (let i = 0; i < 7200 && !yard.S.beatsDone.includes('show'); i++) {
    if (yard.S.tick - t1 === thrown + 5 - hold) window.__holdSkip(true);
    const b = yard.S.pair.filter(p => !p.under).at(-1);
    if (b) { before = b.y; ground = yard.world.walkY(b.x + WORKER / 2); }
    run(1 / 60);
  }
  window.__holdSkip(false);
  const w = yard.S.workers[0];
  const handed = w && w.y;
  const after = watch(60);
  return [
    ok(before != null && ground - before > P, 'the cut comes while the survivor is in the air',
       `${Math.round(ground - before)}px up`),
    ok(w && Math.abs(handed - before) <= CELL, 'and the body that carries on is at that height',
       `survivor at ${before}, body at ${handed}`),
    ok(after.worst <= CELL, 'and carries on from there without a jump',
       `worst ${after.worst.toFixed(1)}px: ${after.at}`)
  ];
});
