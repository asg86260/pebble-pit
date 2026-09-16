// The haulers carry on while the next rock comes down.
//
// Every rock used to end in a dance, and the dance ducked everybody clear of
// the footprint and kept them there; when the dance went (dance-once), the
// keeping-there stayed: a body that had stepped out of the footprint stood
// where it stepped to until the rock landed. With work on its own side of the
// line -- a load in hand and the lip right there -- that was a hauler stood
// watching the sky for the whole of the gap and the fall, on every rock. The
// rule is now the line, not the body: nobody walks INTO the footprint while
// it stands, and everybody outside it is at work.

import { group, ok, run, state, haveRock, WORKER, P } from './helpers.mjs';
import { S, floor, pit } from '../src/state.js';
import { at } from '../src/grid.js';
import { TYPE } from '../src/jobs.js';

const grains = () => {
  let n = 0;
  for (let c = 0; c < floor.cols; c++) for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  return n;
};
const haulers = () => S.workers.filter(w => w.type === TYPE.HAUL);
const inside = (w, z) => w.x + WORKER > z[0] && w.x < z[1];
const doing = w => `${Math.round(w.x)}|${w.carry || 0}|${w.stored || 0}`;

group('the haulers keep carrying while the next rock comes down', async () => {
  window.__crew(2, 3);
  window.__jump(2);                            // past the one rock that earns a dance
  haveRock();
  run(2);
  // Dust under the rock and either side of it, the way a rock sheds it, so the
  // haulers are working in the footprint when the rock goes and have to step
  // out of it -- and have plenty to do on both sides once they have. At the
  // crew's own pace, not `quickCrew`'s: a quick crew has the footprint bare
  // before the rock goes and nobody is ever in it to duck.
  window.__clearFloor();
  for (let x = S.cx - 320; x < S.cx + 380 && x < pit.x - WORKER * 2; x += P) window.__pile(x, 3);
  run(6);                                      // they are on it
  const g0 = grains();

  window.__next();                             // the last of rock two goes
  run(1 / 60);
  let fell = 0, landed = false, crossed = 0, under = null, gAtFall = -1, tookInFall = 0;
  // Who was clear of the footprint when the rock started down, and whether
  // each of them moved, scooped or tipped at any point while it was in the air.
  const clear = new Map();
  const atLine = new Map();          // where each of them stood on the last frame of the fall
  let line = null;
  for (let i = 0; i < 900 && !landed; i++) {
    const zone = state().dropZone;
    if (zone) line = zone;
    const out = zone ? haulers().filter(w => !inside(w, zone)) : [];
    const before = new Map(out.map(w => [w, doing(w)]));
    run(1 / 60);
    const s = state();
    if (s.rockFall > 0) {
      fell++;
      if (gAtFall < 0) gAtFall = grains();
      for (const w of out) {
        // nobody outside the footprint walks into it while the rock is in the air
        if (inside(w, zone)) crossed++;
        if (!clear.has(w)) clear.set(w, false);
        if (doing(w) !== before.get(w)) clear.set(w, true);
        atLine.set(w, w.x);
      }
    }
    if (fell > 0 && s.rock > 0 && !s.rockFall) {
      landed = true;
      under = haulers().filter(w => inside(w, [s.rockLeftX, s.rockLeftX + s.rockW]));
      tookInFall = gAtFall - grains();
    }
  }
  // The one body allowed to stand: a load in hand and the lip on the far side
  // of the rock. Nobody crosses under a falling rock, so it walks to the line
  // and waits there -- at the line, not wherever the duck left it.
  const lipRight = pit.x > S.cx;
  const waiting = w => w.carry > 0 && line &&
    (lipRight ? Math.abs(atLine.get(w) + WORKER - line[0]) <= P : Math.abs(atLine.get(w) - line[1]) <= P);
  const stood = [...clear].filter(([w, busy]) => !busy && !waiting(w))
    .map(([w]) => Math.round(atLine.get(w)));
  window.__crew(0, 0);
  return [
    ok(g0 > 0, 'there is dust to carry', `${g0} grains`),
    ok(fell > 0 && landed, 'the next rock comes down and lands', `${fell} frames in the air`),
    ok(clear.size > 0, 'somebody is clear of the footprint for the fall', `${clear.size} of ${haulers().length}`),
    ok(stood.length === 0, 'and nobody clear of it stands and watches: every one of them walks, scoops or tips, '
       + 'or waits at the line with a load for the far side',
       `stood still through the fall at ${stood.join(' ')}`),
    ok(tookInFall > 0, 'dust comes off the ground while the rock is in the air', `${tookInFall} grains over ${fell} frames`),
    ok(crossed === 0, 'and nobody walks in under it', `${crossed} crossings`),
    ok(under && under.length === 0, 'or is under it when it lands',
       under ? under.map(w => Math.round(w.x)).join(' ') : 'no landing')
  ];
// Following particular bodies frame by frame through the gap and the fall: a
// reload in the middle stands up a fresh crew, and a fresh crew has forgotten
// whether it ducked -- which is the very thing this group is about.
}, { reload: false });
