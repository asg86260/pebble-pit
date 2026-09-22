// Wave 3.1: five follow-ups on the buildings, all in the works/render/world
// area, and three amendments found while building them. See
// docs/wave-feedback3.md, "Wave 3.1 -- feedback4.md" and the amendments after
// it.
//
// #2 and #3 are drawing -- the construction ornament being restricted to
// buildings and machines, and a building rising out of the ground -- and are
// looked at with tools/look.mjs rather than checked here: a green suite
// cannot see a barrier, and it cannot see a clip either. `draw()` itself is
// also never called from `fast()` (see hooks.js), so a puff or a shake fired
// from inside it is not a thing a node check can see fire. This file covers
// the mechanical halves: where the shed sits as the click/hover/board target
// (#1), the builder's hop and lunge actually moving a body (#4), the order
// buildings are recorded in (#5), a builder's walk not dropping a lent rockhand
// off the rock (#6, amendment), and the house's own barrier width and build
// time (#7 and #8, amendments -- #7 is drawing too and is only shot).

import { readFileSync } from 'node:fs';
import { group, ok, state, run, runUntil, openSites, yard } from './helpers.mjs';
import { WORK_BASE } from '../src/config.js';
import { nearQuarry, nearFarm, standRect } from '../src/board.js';

const works = () => state().works || {};
const on = key => Object.values(works()).find(w => w.key === key) || null;

// #1 -- the shed is the board's own anchor for the farm and the quarry now
// (`standRect` returns it), and the way to hover/click each of them open.
//
// Updated: the quarry's hole no longer answers either. Leaving it answering
// was the half-measure this replaces -- pointing anywhere at the cut, at the
// dust in it, at a quarrier on the ladder, threw a shop menu over the thing you
// were trying to look at. Every other station in the yard is opened by its
// building, and the shed is what the quarry's building is. The near ramp is
// still kept clear by the tight margin on the shed's ramp side, which is the
// part of the old reasoning that survives -- see `nearQuarry` in board.js.
group('the farm and the quarry stand at their shed, and only there', async () => {
  openSites();
  window.__levels({ plotLevel: 5 });     // a real run of plots to hover over, clear of the shed
  run(0.5);
  const s = state();
  const qs = s.stands.quarry, fs = s.stands.farm;

  return [
    ok(qs.x === s.quarryShed.x && qs.w === s.quarryShed.w,
       'standRect(quarry) is the shed', JSON.stringify({ qs, shed: s.quarryShed })),
    ok(fs.x === s.farmShed.x && fs.w === s.farmShed.w,
       'standRect(farm) is the shed', JSON.stringify({ fs, shed: s.farmShed })),
    ok(nearQuarry(qs.x + qs.w / 2, qs.y + qs.h / 2), 'hovering the quarry shed answers'),
    ok(!nearQuarry(s.quarryX + s.quarryW / 2, s.groundY + 20),
       'and the mouth of the hole does not',
       `hole at ${s.quarryX}, shed at ${s.quarryShed.x}`),
    ok(nearFarm(fs.x + fs.w / 2, fs.y + fs.h / 2), 'hovering the farm shed answers'),
    ok(s.farmW > 0 && !nearFarm(s.farmX + s.farmW, s.groundY - 5),
       'but the far end of the run of plots no longer does',
       `farmX ${s.farmX} + farmW ${s.farmW}`)
  ];
});

// #4 -- the builder's work jig, reproduced first: a body building on the yard
// (not the bench) is filmed for ten seconds and its height is measured. The
// hop was there all along -- the jig ran and `w.y` moved -- but at one cell
// (`BUILD_HOP_H`, then 1) it came to six world pixels of travel over ten
// seconds, and `builder` was missing from render.js's `LOOK` table entirely,
// so the lunge at the bottom of every hop was thrown away regardless of what
// `w.lunge` said (`PLAIN.lunge` is 0). Both are fixed: the hop is two cells
// now, and `builder` carries `lunge: 1`.
//
// Rewritten: the hop is a HAMMER now. A body going up and down on one spot at a
// steady rate reads as bouncing however high it goes, so what is checked here
// is no longer "does it travel far enough vertically" but the three things that
// make it read as work -- it drives down and lunges, it throws something off
// each blow, and it works a patch rather than a pixel. The dip is deliberately
// SMALLER than the old hop (`BUILD_HAMMER_H`, under a cell), so the old
// `range >= 10` would now fail for exactly the reason the change was made.
group('a builder on the yard hammers, and it reads as work', async () => {
  window.__reset();
  window.__crew(0, 1);
  window.__grant({ dust: 90000 });
  run(1);

  window.__buy('house');
  const walked = runUntil(() => (state().works?.yard?.hands || 0) > 0, 60);

  // Four seconds, not ten. The first house is eight worker-seconds now, so a
  // ten-second film outlasts the thing being filmed and the builder is gone
  // before the end of it -- which reads as "it wandered off" rather than as
  // "it finished".
  const ys = [], xs = [], lunged = [];
  let gritSeen = 0;
  for (let f = 0; f < 240; f++) {
    run(1 / 60);
    const w = yard.S.workers.find(o => o.type === 'builder');
    if (w) { ys.push(w.y); xs.push(w.x); lunged.push(w.lunge === 1); }
    gritSeen = Math.max(gritSeen, yard.S.grit.length);
  }
  const range = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
  const across = xs.length ? Math.max(...xs) - Math.min(...xs) : 0;

  return [
    ok(walked, 'a spare hand arrives at the site'),
    ok(ys.length > 200, 'and stays there for the whole of the film', `${ys.length} frames`),
    ok(range >= 4, 'it drives down into the work and comes back up',
       `range ${range.toFixed(1)}`),
    ok(lunged.some(Boolean), 'and it lunges at the bottom of a swing',
       `${lunged.filter(Boolean).length} of ${lunged.length} frames`),
    ok(gritSeen > 0, 'and every blow throws grit off the work',
       `${gritSeen} chips in the air at the busiest`),
    // A few hits here, a few hits there: the body moves along its patch between
    // bursts instead of striking the same pixel for the whole build.
    ok(across > 0, 'and it works a patch rather than one pixel',
       `${across.toFixed(1)}px across`)
  ];
});

// #5 -- reproduced first: farm and quarry cannot actually be bought out of
// order (`unlockquarry`'s own `show` requires `S.farmOpen`), so that pair
// can never show the bug either way it is recorded. Two independently-gated
// places -- the shack and the outhouse -- stand in for them: both orders are
// bought for real, through the row, and `S.buildOrder` is checked after each.
// It already comes out right in both directions, because everything past the
// bench builds on one shared site (`site: 'yard'`) and `siteBusy` refuses a
// second press while the first is still going -- so at most one `kind:
// 'building'` work is ever in flight, and recording the order on landing
// (works.js's `stepWorks`, today) cannot come apart from recording it on
// purchase. Nothing changed in works.js for this item; the finding is that
// the reported bug does not reproduce.
group('two independently-gated buildings land in the order they were bought', async () => {
  const bothOrders = async order => {
    window.__reset();
    window.__crew(2, 2);
    window.__grant({ dust: 500000, shards: 900 });
    yard.S.seenMess = true;       // the outhouse's
    run(1);
    for (const key of order) {
      const started = window.__buy(key);
      if (!started) return { ok: false, order };
      const landed = runUntil(() => !on(key), 300);
      if (!landed) return { ok: false, order };
    }
    return { ok: true, buildOrder: state().buildOrder };
  };

  const forward = await bothOrders(['unlockshack', 'unlockouthouse']);
  const backward = await bothOrders(['unlockouthouse', 'unlockshack']);

  return [
    ok(forward.ok, 'shack then outhouse: both are bought and built',
       JSON.stringify(forward)),
    ok(forward.ok && forward.buildOrder.indexOf('shack') <
       forward.buildOrder.indexOf('outhouse'),
       'and land in that order', JSON.stringify(forward.buildOrder)),
    ok(backward.ok, 'outhouse then shack: both are bought and built',
       JSON.stringify(backward)),
    ok(backward.ok && backward.buildOrder.indexOf('outhouse') <
       backward.buildOrder.indexOf('shack'),
       'and land in that order too', JSON.stringify(backward.buildOrder))
  ];
});

// #5 continued -- a save from before `buildOrder` existed sees no change.
group('a save with no build order lays out exactly as it did', async () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8'));
  yard.restore();
  const s = state();

  return [
    ok(!s.buildOrder || s.buildOrder.length === 0,
       'the fixture predates buildOrder', JSON.stringify(s.buildOrder)),
    // the fixed table's own order: bench and the settlement first, then
    // school, quarry, farm, lab, filter, casino, tower -- see siteOrder() in
    // world.js
    ok(s.quarryX > s.farmX, 'the cut still stands nearer the rock than the plots',
       `quarry ${s.quarryX}, farm ${s.farmX}`),
    ok(s.farmX > s.labX, 'and the plots nearer than the lab',
       `farm ${s.farmX}, lab ${s.labX}`)
  ];
});

// #6, amendment -- a rockhand lent off the rock to build must walk down it, not
// drop. Reproduced first, filmed a frame at a time: a rockhand is put on a tall
// rock, a bench rung is bought with nobody spare to fit it (so the nearest
// body -- a rockhand -- is lent, see "with nobody spare..." in works.test.mjs),
// and every builder's `y` is watched for the whole walk from the rock to the
// bench. Before the fix this could drop most of the rock's height in the one
// frame `wayAt` decided a step off the edge had already carried the body
// clear of the hill's footprint, because `climbTo` eases toward `stand(w)`
// with a wall rule facing up and none facing down. `stepBuilder` now routes
// the walk (`keepTo`/`stepRoute`, the way `stepCommute` does for every other
// errand) instead of asking "what is under me now" fresh every step.
group('a rockhand lent off the rock walks down it, rather than dropping', async () => {
  window.__reset();
  window.__jump(6);                    // a tall rock: room for a real drop
  window.__crew(4, 0);                 // rockhands only -- nobody spare to lend
  window.__grant({ dust: 90000 });
  run(15);                             // let them climb well up the crest

  window.__buy('carry');
  let prevY = null, maxWalkJump = 0, sawWalking = false;
  for (let f = 0; f < 400; f++) {
    run(1 / 60);
    const b = yard.S.workers.find(w => w.type === 'builder');
    if (b) {
      // Only while it is still on its way -- see "goal": arriving at the
      // bench is a separate step (a body's feet are planted straight on to
      // the bench's own top edge there, `stepBuilder`'s `if (w.site ===
      // 'bench')` branch) and it is not what #6 is about.
      if (prevY != null && b.goal === 'to') {
        sawWalking = true;
        maxWalkJump = Math.max(maxWalkJump, Math.abs(b.y - prevY));
      }
      prevY = b.y;
    } else prevY = null;
  }

  return [
    ok(sawWalking, 'a rockhand is lent and actually walks over'),
    // a cell is P (6 world px); a slope can carry a little more than that in
    // one frame (see CLIMB_SLOPE in route.js), so the bar is generous rather
    // than exactly one cell, and still nowhere near a rock's height
    ok(maxWalkJump <= 12, 'its height never moves more than about a cell, a frame, on the way',
       `${maxWalkJump}px`)
  ];
});

// #8, amendment -- the first houses are quick, and they climb from there.
// `HOUSE_ROW.work` overrides `workFor`'s flat WORK_BASE.building number with a
// curve off how many rooms already stand (`S.crew`, clamped at zero). Bought
// for real through the row each time -- `window.__buy` -- rather than read
// off the row directly, because what changed is what a purchase actually
// costs in time.
group('the first houses are quick, and the ladder climbs from there', async () => {
  window.__reset();
  window.__crew(0, 1);
  window.__grant({ dust: 50000000 });
  run(1);

  const seconds = [];
  for (let n = 1; n <= 20; n++) {
    window.__buy('house');
    const w = on('house');
    seconds.push(w ? w.of : null);
    window.__finish();
  }

  return [
    ok(seconds.every(s => s != null), 'every house is a real work on the yard',
       JSON.stringify(seconds)),
    // Cut again from twenty. With one pair of hands these are wall-clock
    // seconds for your first hire standing alone with nothing else built, and
    // the opening is the one stretch of the game with nothing to cut away to.
    ok(seconds[0] === 8, 'the first is eight seconds, not twenty and not ninety',
       `house 1: ${seconds[0]}s`),
    ok(seconds[2] <= 12, 'and the first few are all quick',
       `houses 1-3: ${seconds.slice(0, 3).join('/')}s`),
    ok(seconds[4] > seconds[0] && seconds[9] > seconds[4] && seconds[14] > seconds[9],
       'and each one after climbs past the last',
       `1:${seconds[0]} 5:${seconds[4]} 10:${seconds[9]} 15:${seconds[14]}`),
    ok(Math.max(...seconds) <= WORK_BASE.machine + 30,
       'never much worse than putting up a machine', JSON.stringify(seconds)),
    ok(seconds[19] >= seconds[14], 'and it is still climbing by the twentieth',
       `house 15: ${seconds[14]}s, house 20: ${seconds[19]}s`)
  ];
});
