// The cut is worked in pockets (DESIGN.md): a quarrier's swing comes round on a
// beat you can see and takes a stretch of its course, a body works a run of
// those along the face instead of picking a new cell every frame, and a
// blaster's swing is the one that bursts. What must not move is the time a cut
// takes -- the beat is slower and the pocket wider by the same share.

import { group, ok, state, run, runUntil, openSites } from './helpers.mjs';
import { S } from '../src/state.js';
import { CUT_BEAT_MIN, TIER_OWN, TIER_RUNGS, LADDERS } from '../src/config.js';
import { quarryCells, quarryTarget, cellsLeft, beatMs } from '../src/quarry.js';
import { now } from '../src/clock.js';

const gang = (n, rung = 0) => {
  window.__crew(0, 0, n, 0); window.__fullSites(); window.__tip(90000);
  if (rung) window.__levels({ quarryPaceLevel: rung });
};
const quarriers = () => S.workers.filter(w => w.type === 'quarrier');
const digging = () => quarriers().some(w => w.goal === 'work');

// Frame by frame: each body's swings, read off its own clock -- `next` moves
// forward on the frame a swing lands and on nothing else while it is on the
// face -- and the digs the frame took out of the ground.
function watch(seconds) {
  const seen = new Map();        // body -> [game ms of each swing]
  const gaps = [];
  let perFrame = 0;
  for (let f = 0; f < seconds * 60; f++) {
    const before = S.quarryTotal || 0;
    const nexts = quarriers().map(w => w.next);
    run(1 / 60);
    perFrame = Math.max(perFrame, (S.quarryTotal || 0) - before);
    quarriers().forEach((w, i) => {
      if (w.goal !== 'work' || w.next === nexts[i] || !(w.next > nexts[i])) return;
      const list = seen.get(w) || [];
      if (list.length) gaps.push(w.next - list[list.length - 1]);
      list.push(w.next);
      seen.set(w, list);
    });
  }
  return { gaps, perFrame, swings: [...seen.values()].reduce((n, l) => n + l.length, 0) };
}

group('a swing comes round on the beat, at pace nought and at the top of the ladder', async () => {
  gang(3);
  runUntil(digging, 60);
  const slow = watch(30);
  window.__seed(20250830); window.__verify(true);
  gang(3, 15);
  runUntil(digging, 60);
  const fast = watch(20);
  // The gap between two swings is the beat, less the swing's own scatter
  // (0.85 of it at the tightest) and less a tonic's hurry, which nobody here
  // has drunk. Under the floor the pick does not visibly land, so nothing may
  // swing faster than that, ladder or no ladder.
  const floor = CUT_BEAT_MIN * 0.85;
  return [
    ok(slow.swings > 5, 'three bodies at pace nought swing a few times in half a minute', `${slow.swings}`),
    ok(slow.gaps.every(g => g >= beatMs(0) * 0.85 - 1),
       'and never twice inside the pace-nought beat', `${Math.min(...slow.gaps)} < ${beatMs(0) * 0.85}`),
    ok(fast.swings > slow.swings, 'up the ladder they swing more often', `${fast.swings} vs ${slow.swings}`),
    ok(fast.gaps.every(g => g >= floor - 1),
       "and never under the beat's floor", `${Math.min(...fast.gaps)} < ${floor}`)
  ];
});

group('a cut takes the time it took before the pockets, at pace nought and at the floor of its ladder', async () => {
  // Measured on main at 4ea4675 with tools/node/cut-time.mjs, this seed: five
  // quarriers dig the cut out in 108 s at pace nought and 31 s at the floor
  // of the swing -- the top of the ladder before the spark rung, which since
  // the fold (DESIGN.md, "The spark band is the top of the ladder") sits on
  // the same card and takes the cut half again as quick on top of that.
  // The pocket and the beat are solved to hold those; a tenth either way is
  // the tolerance, and a tune of the beat that breaks it has moved the
  // quarry's economy, which is the thing this file is here to notice.
  const WAS_P0 = 108, WAS_P9 = 31;
  // The spark rung's pace over the floor's, off the pace list itself.
  const sparkGain = LADDERS.quarrypace.value[TIER_OWN] / LADDERS.quarrypace.value[TIER_RUNGS];
  const time = () => {
    runUntil(() => (S.quarryTotal || 0) > 0, 120);
    const t0 = now(), total = (S.quarryTotal || 0) + cellsLeft();
    runUntil(() => S.quarryTotal >= total, 400);
    return (now() - t0) / 1000;
  };
  gang(5);
  const p0 = time();
  window.__seed(20250830); window.__verify(true);
  gang(5, TIER_OWN);
  const p9 = time();
  window.__seed(20250830); window.__verify(true);
  gang(5, TIER_RUNGS);
  const p4 = time();
  return [
    ok(Math.abs(p0 - WAS_P0) <= WAS_P0 * 0.12, 'five at pace nought finish in the time they did', `${p0.toFixed(1)} s vs ${WAS_P0}`),
    ok(Math.abs(p9 - WAS_P9) <= WAS_P9 * 0.12, 'and five at the floor of the ladder', `${p9.toFixed(1)} s vs ${WAS_P9}`),
    ok(Math.abs(p4 - WAS_P9 * sparkGain) <= WAS_P9 * 0.12, 'and the spark rung takes the cut quicker by what its list says', `${p4.toFixed(1)} s vs ${(WAS_P9 * sparkGain).toFixed(1)}`)
  ];
});

for (const seed of [20250830, 3]) {
  group(`the cut comes down in layers, never a slot (seed ${seed})`, async () => {
    gang(5, 9);
    runUntil(digging, 60);
    // A slot is a column dug deeper than both the columns beside it by more
    // than a course. A swing takes cells off the course being worked and no
    // other, so none can form. A neighbor dug to its own mark is finished --
    // that step is the bench wall, not a slot -- and does not count.
    //
    // Not asserted: how far the whole floor spreads across courses. A stretch
    // at the far end stands a few courses shallower while the body that
    // picked it walks over, or stands grossed out in front of it, and the
    // number that comes out is a fact about the seed's timing rather than
    // about the digging. The slot is the defect; this is the rule for it.
    let slot = 0, when = '';
    for (let i = 0; i < 90; i++) {
      run(0.5);
      const cells = quarryCells();
      const working = c => c >= 0 && c < cells.length && cells[c] < quarryTarget(c);
      for (let c = 0; c < cells.length; c++) {
        if (!working(c)) continue;
        const beside = [c - 1, c + 1].filter(working).map(n => cells[n]);
        if (!beside.length) continue;
        const over = cells[c] - Math.max(...beside);
        if (over > slot) { slot = over; when = `at ${(i + 1) / 2}s: ${cells.join(',')}`; }
      }
    }
    return [ok(slot <= 1, 'no column is dug more than a course under both its neighbors', `${slot} ${when}`)];
  }, seed);
}

group("a blaster's swing fires the ring, an apprentice's does not, and a crit is one ring either way", async () => {
  // Rings age out of `S.shocks`, so count them as they come, by the stamp each
  // is born with -- and count the swings over the same frames, since a ring a
  // swing is a claim about one window, not about two windows laid side by side.
  const count = seconds => {
    let rings = 0, swings = 0, mark = now();
    for (let f = 0; f < seconds * 60; f++) {
      const nexts = quarriers().map(w => w.next);
      run(1 / 60);
      const fresh = S.shocks.filter(s => s.where === 'quarry' && s.at > mark);
      rings += fresh.length;
      for (const s of fresh) mark = Math.max(mark, s.at);
      quarriers().forEach((w, i) => { if (w.goal === 'work' && w.next > nexts[i]) swings++; });
    }
    return { rings, swings };
  };
  // No hats: one plain quarrier, no crits.
  openSites();
  window.__crew(0, 0, 1, 0); window.__tip(90000); window.__crit(false);
  runUntil(digging, 60);
  const { rings: plain, swings: plainSwings } = count(20);
  // A crit on every swing: one ring a swing, not two.
  window.__crit(true);
  const { rings: critRings, swings: critSwings } = count(15);
  window.__crit(null);
  // And a blaster: the lamp on, no crits, a ring a swing.
  window.__seed(20250830); window.__verify(true);
  gang(1); window.__crit(false);
  runUntil(() => digging() && quarriers()[0].trained, 120);
  const { rings: blastRings, swings: blastSwings } = count(20);
  window.__crit(null);
  return [
    ok(plainSwings > 3 && plain === 0, "a plain swing leaves no ring", `${plain} rings over ${plainSwings} swings`),
    ok(critSwings > 2 && critRings > 0 && critRings <= critSwings + 1,
       'a crit is one ring a swing', `${critRings} rings over ${critSwings} swings`),
    ok(quarriers()[0] && quarriers()[0].trained, 'the one body is a blaster', JSON.stringify(quarriers().map(w => w.trained))),
    ok(blastSwings > 3 && blastRings > 0 && blastRings <= blastSwings + 1,
       "a blaster's swing is a ring", `${blastRings} rings over ${blastSwings} swings`)
  ];
});

group('a body walks its run one way', async () => {
  gang(1);
  runUntil(digging, 60);
  // Between one pick and the next, x moves in one direction: a run is a stretch
  // of course walked from the near end, not a cell chosen afresh each frame.
  let turns = 0, legs = 0, dir = 0, lastRun = null;
  for (let f = 0; f < 60 * 60; f++) {
    const w = quarriers()[0];
    const x0 = w.x;
    run(1 / 60);
    if (w.goal !== 'work') continue;
    if (w.run !== lastRun) { lastRun = w.run; dir = 0; legs++; continue; }
    const d = Math.sign(w.x - x0);
    if (!d) continue;
    if (dir && d !== dir) turns++;
    dir = d;
  }
  return [
    ok(legs > 2, 'it picked a few runs in a minute', `${legs}`),
    ok(turns === 0, 'and never turned round inside one', `${turns} turns over ${legs} runs`)
  ];
});
