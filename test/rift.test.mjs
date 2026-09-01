// The rift: bought at the bench, and swallowing from the moment it is torn.
//
// It used to be a station, held open by a body that had walked the whole length
// of the hole to stand at it. Nobody holds it now -- see `## The endgame pass`
// in DESIGN.md -- so what these check is the bargain that is left: it costs red
// and dust to tear, it swallows at a rate you buy up an endless ladder, the
// counter never moves, and the pile and the rift together are always the
// counter.

import { readFileSync } from 'node:fs';
import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

// Straight off the modules: `yard.upgrades` is the `__upgrades` hook, and the
// rift's plot is not among the handles the yard spreads.
const { JOBS, UPGRADES } = await import('../src/upgrades.js');
const { TOWER_UPGRADES } = await import('../src/tower.js');
const { rift } = await import('../src/state.js');

// Everything a player would have before this row is offered: red in the bank,
// dust in the hole, and a hole that has been filled often enough to know why
// this matters. `__give` fills along rather than throwing at random, so a hole
// this full actually gets full.
function readyYard() {
  window.__reset();
  window.__crew(0, 4);
  window.__fullSites();
  window.__meteor();                    // the tower stands: it is summoned from there
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__give(60000);                 // more than the hole holds; the rest is refused
}

group('the rift is not offered until the hole has been a problem', async () => {
  window.__reset();
  window.__crew(0, 2);
  window.__meteor();
  window.__grant({ sparks: 999 });
  const early = window.__rows().find(r => r.key === 'rift');

  // and after the hole has turned a grain away
  window.__give(60000);
  const late = window.__rows().find(r => r.key === 'rift');

  return [
    ok(early && !early.shown, 'a fresh yard is not sold a cure for a full pit',
       `shown ${early?.shown}`),
    ok(late && late.shown, 'and a yard that has filled one is', `shown ${late?.shown}`),
    ok(TOWER_UPGRADES.some(r => r.key === 'rift') && !UPGRADES.some(r => r.key === 'rift'),
       'on the tower, where it is summoned from, and not on the bench'),
    // Red as well: it is the one plainly magic thing in the yard.
    ok((late?.bill || []).some(b => b[0] === 'spark'), 'it is priced in red',
       JSON.stringify(late?.bill)),
    ok((late?.bill || []).some(b => b[0] === 'dust'), 'and in dust, like every row',
       JSON.stringify(late?.bill))
  ];
});

group('a torn rift swallows on its own, and the hole starts draining', async () => {
  readyYard();
  window.__buy('rift');
  const full = state();

  // Nobody is sent anywhere. It is torn, so it is open.
  run(20);
  const after = state();

  return [
    ok(full.riftOpen, 'the rift is torn', `${full.riftOpen}`),
    ok(after.rift > 0, 'and grains are going through with nobody standing at it',
       `${after.rift}`),
    ok(after.pitDust < full.pitDust, 'so the hole is draining',
       `${full.pitDust} -> ${after.pitDust}`),
    // The whole point: nothing is spent. The counter does not move.
    ok(after.stored === full.stored,
       'and none of it is spent -- the counter has not moved',
       `${full.stored} -> ${after.stored}`),
    ok(after.pitDust + after.rift === after.stored,
       'the pile and the rift are still the counter',
       `${after.pitDust} + ${after.rift} = ${after.pitDust + after.rift} against ${after.stored}`),
    // And there is no job for it: no row on the crew board, nobody to assign.
    ok(!JOBS.includes('rifters'), 'there is no rifter to hire', JOBS.join(','))
  ];
});

group('the hole takes dust again once the rift has made room', async () => {
  readyYard();
  const stuck = state();
  window.__buy('rift');
  runUntil(() => state().rift > 500, 120);

  // Room in the hole again, so banking works: the crew stop standing down.
  const room = yard.pitMod.pitCapacity() - state().pitDust;
  const before = state().stored;
  window.__give(400);
  const after = state();

  return [
    ok(stuck.pitDust >= yard.pitMod.pitCapacity() - 200,
       'the hole was full to start with', `${stuck.pitDust}`),
    ok(room > 0, 'the rift has made room in it', `${room} cells`),
    ok(after.stored > before, 'and dust banks into it again',
       `${before} -> ${after.stored}`)
  ];
});

group('it hangs in the hole, at the near end, and the grains go round it', async () => {
  readyYard();
  window.__buy('rift');
  run(3);
  const { pit, S } = yard;
  const c = yard.riftMod.riftCenter();
  const R = yard.riftMod.riftRadius();
  // Every grain in flight is somewhere between the pile it left and the ring
  // round the disc: never further from the disc than the ring's outer edge plus
  // the rise, and the ones far enough along are inside a radius and a half.
  let far = 0, along = 0, inRing = 0;
  for (const m of S.gulped) {
    if (m.t <= 0) continue;
    const d = Math.hypot(m.x - c.x, m.y - c.y);
    if (m.t > 0.25) { along++; if (d <= R * 1.5) inRing++; }
    if (d > R * 1.5 && m.t > 0.25) far++;
  }
  return [
    ok(rift.x >= pit.x && rift.x + rift.w <= pit.x + pit.w * 0.1,
       'the disc is in the hole, at the near end',
       `rift ${rift.x}..${rift.x + rift.w}, pit from ${pit.x}`),
    ok(rift.y > S.groundY && rift.y + rift.h < S.groundY + yard.pitMod.pitDepth(),
       'and below the ground line, inside the depth of the hole',
       `rift y ${rift.y}..${rift.y + rift.h}, ground ${S.groundY}`),
    ok(S.gulped.length > 0, 'there are grains in flight', `${S.gulped.length}`),
    ok(along > 0 && far === 0, 'and every grain past its rise is on the ring or inside it',
       `${inRing} of ${along} on the ring, ${far} astray`)
  ];
});

group('widening it is a row that never runs out', async () => {
  readyYard();
  window.__buy('rift');
  window.__grant({ sparks: 99999, dust: 30000 });

  const rate = () => yard.riftMod.riftRate();
  const first = rate();
  for (let i = 0; i < 12; i++) window.__buy('riftrate');
  const twelve = rate();
  const row = window.__rows().find(r => r.key === 'riftrate');

  return [
    ok(twelve > first, 'twelve widenings make it faster',
       `${first.toFixed(1)} -> ${twelve.toFixed(1)} a second`),
    ok(row && row.shown, 'and the row is still there afterwards',
       `shown ${row?.shown}`),
    // The point of it having no rung: nothing about this row ever says "done".
    ok(!row?.done, 'it never finishes', JSON.stringify({ done: row?.done }))
  ];
});

// A save from the build where a body held the rift open. Nobody teleports and
// nobody is lost: the body comes back as a carter where it stood and walks home.
group('a save with a rifter in it loses nobody', async () => {
  const SAVE = readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8');
  const s = JSON.parse(SAVE);
  // The old shape: one body of the old trade, standing past the far wall, and
  // the roster counting it.
  const bodies = Array.isArray(s.who) ? s.who.length : 0;
  s.riftOpen = true;
  s.rifters = 1;
  s.crew = (s.crew || bodies) + 1;
  s.who = [...(s.who || []), { type: 'rifter', x: 4200, y: 0, goal: 'in' }];
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(s));
  yard.restore();
  const back = state();
  const n0 = yard.S.workers.length;
  const stray = yard.S.workers.find(w => w.type === 'rifter');
  run(5);                                    // and the yard runs with it, under verify
  return [
    ok(n0 === bodies + 1, 'every body in the save is in the yard',
       `${n0} against ${bodies + 1} saved`),
    ok(!stray, 'and none of them is a rifter', `${stray?.type}`),
    ok(yard.S.workers.length === n0, 'nobody is lost once it runs',
       `${yard.S.workers.length} against ${n0}`),
    ok(back.riftOpen && back.rift >= 0, 'the rift is still torn', `${back.riftOpen}`)
  ];
});
