// The rift: bought at the bench, held open by a body, and swallowing.
//
// Everything here goes through the row and the roster rather than setting
// `S.riftOpen` by hand, because what is actually being checked is the bargain:
// the rift costs red and dust to tear, and then it costs *a body standing at the
// far end of the yard* to keep open. A check that flips the flag proves the
// swallowing works and nothing about the thing that makes it a decision.

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

// Everything a player would have before this row is offered: red in the bank,
// dust in the hole, and a hole that has been filled often enough to know why
// this matters. `__give` fills along rather than throwing at random, so a hole
// this full actually gets full.
function readyYard() {
  window.__reset();
  window.__crew(0, 4);
  window.__fullSites();
  window.__grant({ sparks: 999, shards: 999, spores: 999 });
  window.__give(60000);                 // more than the hole holds; the rest is refused
}

group('the rift is not offered until the hole has been a problem', async () => {
  window.__reset();
  window.__crew(0, 2);
  window.__grant({ sparks: 999 });
  const early = window.__rows().find(r => r.key === 'rift');

  // and after the hole has turned a grain away
  window.__give(60000);
  const late = window.__rows().find(r => r.key === 'rift');

  return [
    ok(early && !early.shown, 'a fresh yard is not sold a cure for a full pit',
       `shown ${early?.shown}`),
    ok(late && late.shown, 'and a yard that has filled one is', `shown ${late?.shown}`),
    // Red as well: it is the one plainly magic thing in the yard.
    ok((late?.bill || []).some(b => b[0] === 'spark'), 'it is priced in red',
       JSON.stringify(late?.bill)),
    ok((late?.bill || []).some(b => b[0] === 'dust'), 'and in dust, like every row',
       JSON.stringify(late?.bill))
  ];
});

group('a torn rift does nothing at all until somebody is standing at it', async () => {
  readyYard();
  window.__buy('rift');
  const bought = state();

  // Nobody on it. The hole stays exactly as full as it was.
  run(20);
  const alone = state();

  return [
    ok(bought.riftOpen, 'the rift is torn', `${bought.riftOpen}`),
    ok(alone.rift === 0, 'and swallows nothing with nobody there', `${alone.rift}`),
    ok(alone.pitDust >= bought.pitDust - 50,
       'so the hole is as full as it was',
       `${bought.pitDust} -> ${alone.pitDust}`)
  ];
});

group('a body holds it open, and the hole starts draining', async () => {
  readyYard();
  window.__buy('rift');
  const full = state();

  window.__assign('rifters', 1);
  // Long enough for the body to walk the whole length of the hole -- down one
  // ladder, over the pile, up the other -- because nobody in this yard
  // teleports and the rift is the longest walk in it.
  const arrived = runUntil(() => state().rift > 0, 120);
  run(20);
  const after = state();

  return [
    ok(arrived, 'the body crosses the yard and the rift starts swallowing',
       `rift ${after.rift}`),
    ok(after.rift > 0, 'grains are going through', `${after.rift}`),
    ok(after.pitDust < full.pitDust, 'and the hole is draining',
       `${full.pitDust} -> ${after.pitDust}`),
    // The whole point: nothing is spent. The counter does not move.
    ok(after.stored === full.stored,
       'and none of it is spent -- the counter has not moved',
       `${full.stored} -> ${after.stored}`),
    ok(after.pitDust + after.rift === after.stored,
       'the pile and the rift are still the counter',
       `${after.pitDust} + ${after.rift} = ${after.pitDust + after.rift} against ${after.stored}`)
  ];
});

group('the hole takes dust again once the rift has made room', async () => {
  readyYard();
  const stuck = state();
  window.__buy('rift');
  window.__assign('rifters', 1);
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

group('taking the body off shuts it', async () => {
  readyYard();
  window.__buy('rift');
  window.__assign('rifters', 1);
  runUntil(() => state().rift > 200, 120);

  window.__assign('rifters', -1);
  run(2);                                  // let it walk off
  const off = state();
  run(20);
  const later = state();

  return [
    ok(off.rift > 0, 'it had been swallowing', `${off.rift}`),
    ok(later.rift === off.rift,
       'and stops the moment nobody is holding it open',
       `${off.rift} -> ${later.rift}`)
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
