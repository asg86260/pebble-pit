// The rift: bought at the bench, and swallowing from the moment it is torn.
//
// It used to be a station, held open by a body that had walked the whole length
// of the hole to stand at it. Nobody holds it now -- see `## The endgame pass`
// in DESIGN.md -- so what these check is the bargain that is left: it costs red
// and dust to tear, it swallows at a rate you buy up an endless ladder, the
// counter never moves, and the pile and the rift together are always the
// counter.

import { readFileSync } from 'node:fs';
import { group, ok, state, run, runUntil, yard, buyBuilt, buyNow } from './helpers.mjs';

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

group('the hole tears itself open the first time it cannot take a grain', async () => {
  window.__reset();
  window.__crew(0, 2);
  window.__meteor();
  window.__grant({ sparks: 999 });
  const early = state();

  // and now more dust than the hole can hold
  window.__give(60000);
  const late = state();

  return [
    ok(!early.riftOpen, 'a fresh yard has no hole in the air over its hole'),
    // It used to be a row: red and dust, on the tower, offered the first time the
    // hole said no. The trouble was what it was a cure FOR -- a full hole stops
    // the yard earning, so the cure was priced in the coin that had stopped
    // coming in, and a player who filled the hole first was stuck for good. So
    // the hole collapses on its own instead and there is nothing to buy.
    ok(late.riftOpen, 'and a yard that has filled one has torn it open'),
    ok(!window.__rows().some(r => r.key === 'rift'),
       'there is no row that sells one, on any board'),
    // The ladder stays: how wide it is torn is still worth buying.
    ok(TOWER_UPGRADES.some(r => r.key === 'riftrate'),
       'but widening it is still a row, and on the tower'),
    // Nothing is lost to the collapse. What will not fit is through the rift,
    // and what you own is the pile plus what is through it.
    ok(late.stored > late.pitDust, 'the dust over the brim is banked, not turned away',
       `${late.stored} counted, ${late.pitDust} in the pile`),
    ok(late.stored - late.rift === late.pitDust,
       'and the books balance: what is counted, less what is through, is the pile',
       `${late.stored} - ${late.rift} against ${late.pitDust}`)
  ];
});

group('a torn rift swallows on its own, and the hole starts draining', async () => {
  readyYard();
  window.__rift();
  const full = state();

  // Nobody is sent anywhere. It is torn, so it is open.
  run(20);
  const after = state();

  // Everything through it, of whatever kind: the hole swallows a shard exactly
  // as it swallows a grain, so what is through is the dust plus the coins.
  const through = s => s.rift + Object.values(s.riftHeld).reduce((a, b) => a + b, 0);

  return [
    ok(full.riftOpen, 'the rift is torn', `${full.riftOpen}`),
    ok(through(after) > 0, 'and grains are going through with nobody standing at it',
       `${through(after)}`),
    ok(after.pitGrains < full.pitGrains, 'so the hole is draining',
       `${full.pitGrains} -> ${after.pitGrains}`),
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
  window.__rift();
  runUntil(() => state().rift > 500, 120);

  // Room in the hole again, so banking works: the crew stop standing down.
  const room = yard.pitMod.pitCapacity() - state().pitGrains;
  const before = state().stored;
  window.__give(400);
  const after = state();

  return [
    // Grains, not dust: the coins granted above are in the pile too, and every
    // one of them takes a cell of the same hole.
    ok(stuck.pitGrains >= yard.pitMod.pitCapacity() - 200,
       'the hole was full to start with', `${stuck.pitGrains}`),
    ok(room > 0, 'the rift has made room in it', `${room} cells`),
    ok(after.stored > before, 'and dust banks into it again',
       `${before} -> ${after.stored}`)
  ];
});

group('it hangs in the hole, at the near end, and the grains go round it', async () => {
  readyYard();
  window.__rift();
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
  window.__rift();
  window.__grant({ sparks: 99999, dust: 30000 });

  const rate = () => yard.riftMod.riftRate();
  const first = rate();
  for (let i = 0; i < 12; i++) buyNow('riftrate');
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

// The hole holds everything, not just dust. A shard, a spore, a spark and a
// core all go through the black hole the way a grain does -- see `### 7. The
// hole holds everything` in DESIGN.md. What this checks is the bargain: the
// counters do not move, the pile shows the counter less what is through, and
// spending reaches into the rift only once the pile has none.
group('the hole swallows the coins too, and they are still yours', async () => {
  readyYard();
  window.__grant({ shards: 300, spores: 300, cores: 4 });
  window.__rift();
  for (let i = 0; i < 6; i++) buyNow('riftrate');
  // Measured from *after* the hole is seeded, not from before it. A full hole
  // cannot hold every coin you own, so some are through the rift before a
  // single frame has run -- which is the right answer and not what this group
  // is about. What it is about is the swallowing, so the reading starts here.
  const before = state();

  // Long enough for the rift to eat well past the coins lying on top.
  const went = runUntil(() => state().riftHeld.shards > before.riftHeld.shards
                              && state().riftHeld.spores > before.riftHeld.spores, 120);
  const after = state();
  const pile = kind => yard.pitMod.heldInHole(kind);

  return [
    ok(before.shards === after.shards && before.spores === after.spores,
       'the counters do not move: nothing is spent and nothing is lost',
       `shards ${before.shards} -> ${after.shards}, spores ${before.spores} -> ${after.spores}`),
    ok(went && after.riftHeld.shards > before.riftHeld.shards,
       'shards go through the black hole',
       `${before.riftHeld.shards} -> ${after.riftHeld.shards} of ${after.shards}`),
    ok(after.riftHeld.spores > before.riftHeld.spores, 'and spores',
       `${before.riftHeld.spores} -> ${after.riftHeld.spores} of ${after.spores}`),
    // The rule the whole feature stands on, asked of a coin rather than of dust.
    ok(pile('shards') + after.riftHeld.shards === after.shards,
       'the pile shows what you own less what is through',
       `${pile('shards')} + ${after.riftHeld.shards} against ${after.shards}`)
  ];
});

group('a coin is spent out of the hole first, and the rift after', async () => {
  readyYard();
  window.__grant({ shards: 40 });
  window.__rift();
  for (let i = 0; i < 8; i++) buyNow('riftrate');
  // Everything through: run until the hole has no shards left in it at all.
  const gone = runUntil(() => yard.pitMod.heldInHole('shards') === 0
                              && state().riftHeld.shards > 0, 200);
  const held = state().riftHeld.shards, owned = state().shards;

  // Spend more than the pile has, which is all of it: it has to come out of the
  // other dimension, because that is the only place any of it is.
  window.__pay('shard', 5);
  const after = state();

  return [
    ok(gone, 'every shard in the hole has gone through', `${held} through, ${owned} owned`),
    ok(after.shards === owned - 5, 'the counter comes down by what was spent',
       `${owned} -> ${after.shards}`),
    ok(after.riftHeld.shards === held - 5,
       'and it comes out of the rift, the hole having none',
       `${held} -> ${after.riftHeld.shards}`),
    ok(yard.pitMod.heldInHole('shards') + after.riftHeld.shards === after.shards,
       'the two of them are still the counter',
       `${yard.pitMod.heldInHole('shards')} + ${after.riftHeld.shards} against ${after.shards}`)
  ];
});
