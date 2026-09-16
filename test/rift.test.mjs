// The rift: torn by a hole that could not take another grain, and inhaling from
// that moment on.
//
// It used to be a station, held open by a body that had walked the whole length
// of the hole to stand at it, and then a purchase with a ladder beside it.
// Nobody holds it and nobody buys it now -- see `## The endgame pass` in
// DESIGN.md and `the black hole` in tower.js -- so what these check is the
// bargain that is left: it costs nothing because it is not sold, it takes
// everything in the hole on the frame the grains land, the counter never moves,
// and the pile and the rift together are always the counter.

import { readFileSync } from 'node:fs';
import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

// Straight off the modules: `yard.upgrades` is the `__upgrades` hook, and the
// rift's plot is not among the handles the yard spreads.
const { JOBS } = await import('../src/staffing.js');
const { TOWER_UPGRADES } = await import('../src/tower.js');
const { rift } = await import('../src/state.js');
const { abyssLine, pitDepth } = await import('../src/pit.js');
const { P } = await import('../src/config.js');

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
    // And the ladder is gone too. It was a row on the tower that widened the
    // hole a rung at a time, for ever; a black hole is not a thing you tune, and
    // what it does now it does at full strength from the moment it tears. See
    // `the black hole` in tower.js and `stepRift` in rift.js.
    ok(!TOWER_UPGRADES.some(r => r.key === 'riftrate'),
       'and none that widens one either: it is not a bought thing at all'),
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

// The disc is gone: the drowned pit holds a liquid that eats at its surface --
// see "The abyss" in DESIGN.md -- so what this group holds now is the abyss's
// own picture: the surface stands a few cells under the brim, and every grain
// in flight is inside the mouth on its way to that surface, never off across
// the yard or out of the hole.
group('the drowned hole eats at its surface, and the grains dive to it', async () => {
  readyYard();
  window.__rift();
  // The tearing empties the hole, so a yard three seconds past it has nothing
  // left to swallow and nothing in the air. What this group is about is the
  // ordinary swallowing that comes after: so let the gulp finish and fill the
  // hole again.
  //
  // And then look at it QUICKLY. The abyss inhales -- a pile goes in the frame
  // it lands -- so the stream is a burst rather than a trickle: a fifth of a
  // second after the dust arrives the grains are strung out on their dives,
  // and a second after it they have all gone in.
  run(3);
  window.__give(20000);
  run(0.2);
  const { pit, S } = yard;
  const line = abyssLine();
  let along = 0, astray = 0;
  for (const m of S.gulped) {
    if (m.t <= 0.25) continue;
    along++;
    const inMouth = m.x >= pit.x - P && m.x <= pit.x + pit.w + P;
    const inHole = m.y >= S.groundY - P * 2 && m.y <= S.groundY + pitDepth() + P;
    if (!(inMouth && inHole)) astray++;
  }
  return [
    ok(line > S.groundY && line < S.groundY + pitDepth(),
       'the surface stands under the brim and above the floor',
       `line ${Math.round(line)}, ground ${S.groundY}`),
    ok(S.gulped.length > 0, 'there are grains in flight', `${S.gulped.length}`),
    ok(along > 0 && astray === 0,
       'and every grain past its rise is inside the mouth, bound for the surface',
       `${along} diving, ${astray} astray`)
  ];
});

group('the tearing empties the hole, and nothing is lost to it', async () => {
  window.__reset();
  window.__crew(0, 4);
  window.__fullSites();
  window.__meteor();
  window.__grant({ sparks: 999 });
  window.__give(60000);                  // more than the hole holds: it gives way
  const torn = state();
  const full = torn.pitGrains;

  // The gulp runs on its own clock and is done inside a couple of seconds. The
  // haulers keep tipping in while it goes, so what is checked is that the hole
  // was emptied, not that it is empty to the last grain for ever after.
  run(3);
  const after = state();

  return [
    ok(torn.riftOpen, 'the hole gave way', `${full} grains in it when it did`),
    ok(full > yard.pitMod.pitCapacity() * 0.5, 'and it was full when it went',
       `${full} of ${yard.pitMod.pitCapacity()}`),
    ok(after.pitGrains < full * 0.1, 'the tearing took the pile with it',
       `${full} -> ${after.pitGrains}`),
    // The rule the rift has always kept: nothing is spent and nothing is lost.
    // The counter does not move for a swallow, and the tearing is a swallow.
    ok(after.stored >= torn.stored, 'and the counter never went down',
       `${torn.stored} -> ${after.stored}`),
    ok(after.stored - after.rift === after.pitDust,
       'the pile is still the counter less what is through',
       `${after.stored} - ${after.rift} vs ${after.pitDust}`)
  ];
});

group('it eats the pile under it, not the whole top of it', async () => {
  readyYard();
  window.__rift();
  const { pit, S } = yard;
  const { at, topRow } = yard.grid;
  const mouth = yard.riftMod.riftMouth();
  const mid = Math.floor((mouth - pit.x) / pit.p);

  // The height of a column, before and after a swallow, and no frames run in
  // between: what is measured is the walk itself, not the settle that follows
  // it. Taken straight off `swallow` rather than by waiting for the rift's own
  // clock, so it is one known number of grains rather than however many a
  // second of game happened to be worth.
  const high = c => topRow(pit, c) + 1;
  // The far shoulder of the hollow, measured in disc widths rather than in a
  // flat number of columns.
  //
  // This was `mid + 4`, and four columns is INSIDE the bite's own flat top: a
  // three-thousand-grain swallow digs a well about a hundred columns across,
  // and along the middle of that the columns differ by a grain or two of
  // nothing. It passed on which way that grain fell, and it fell the other way
  // the moment the disc was made wider -- forty-four under the mouth against
  // forty-five four columns out, on a profile that runs 11, 38, 44, 42, 21, 0
  // as you walk out from it. The shape was never wrong; the ruler was too
  // short. Two disc widths out is off the plateau and on the slope, where
  // "deepest at the mouth" is a claim about the hollow rather than about
  // rounding.
  const wide = Math.round(rift.w / pit.p);
  const cols = [mid, mid + wide * 2, Math.floor(pit.cols / 2), pit.cols - 3];
  const before = cols.map(high);
  const took = yard.pitMod.swallow(3000);
  const after = cols.map(high);
  const lost = before.map((h, i) => h - after[i]);

  return [
    ok(took === 3000, 'the rift took what it was asked for', `${took}`),
    ok(lost[0] > 0, 'the column under the mouth is lower than it was',
       `${before[0]} -> ${after[0]}`),
    ok(lost[0] > lost[1], 'the hollow is deepest at the mouth',
       `${lost[0]} under it, ${lost[1]} two disc widths out`),
    // And the far end of a six-hundred-column pile is not touched at all, which
    // is the whole difference: the old walk took the top row end to end and wore
    // the pile down flat while the disc hung over one column of it.
    ok(lost[2] === 0 && lost[3] === 0, 'and the far end of the pile is untouched',
       `${lost[2]} at the middle, ${lost[3]} at the far end`),
    ok(S.gulped.length > 0, 'and there are grains in flight', `${S.gulped.length}`)
  ];
});

// It used to be a ladder: `widening it is a row that never runs out`, twelve
// rungs deep and priced in red. There is no row and no rate -- what a torn rift
// takes is what is in the hole, every frame, and the only number left is a
// ceiling on how much of that one frame may do. See `stepRift`.
// `__rift` opens the hole drowned -- the abyss, at full reach -- so this is
// the far end of the arc: everything, on the frame it lands.
group('a grown hole takes the whole pile, not a rate off a ladder', async () => {
  readyYard();
  window.__rift();
  run(4);                                    // the tear empties it; then it idles
  const empty = state().pitGrains;

  window.__give(3000);
  const owed = state().pitGrains;
  run(1 / 60);                               // ONE frame
  const after = state().pitGrains;

  return [
    ok(empty === 0, 'the tear leaves the hole empty', `${empty}`),
    ok(owed > 0, 'a fresh pile lands in it', `${owed} grains`),
    ok(after === 0, 'and one frame later there is nothing left down there',
       `${owed} -> ${after}`),
    ok(yard.riftMod.riftBite() === 0, 'with nothing owed to the next frame',
       `${yard.riftMod.riftBite()}`)
  ];
});

// A young one does not. It eats what is within its reach of its underside, and
// the reach grows with the disc (see `riftReach`): freshly torn, it skims a
// crater out of the top of the pile under its mouth and the rest of the pile
// stands, its top peeling up into the disc -- so the torn era is a pile being
// lost, not an empty white hole for the three hours between the tear and the
// drowning (critics 2026-09-10, B5). What the yard tips in still all goes
// through: the pile holds at a level and the counter climbs by every grain.
group('a young hole skims the pile it hangs over, and the pile stands under it', async () => {
  readyYard();
  window.__tear(30000);                      // torn, barely grown
  window.__nocine();
  run(4);
  const emptied = state().pitGrains;
  let refused = 0;
  for (let i = 0; i < 30; i++) {
    const was = state().stored;
    window.__tip(100);
    refused += 100 - (state().stored - was);
    run(4);
  }
  const standing = state().pitGrains;
  const young = yard.riftMod.riftReach();

  window.__tear(900000);                     // nearly grown: the reach is the hole
  run(6);
  const late = state().pitGrains;
  const grown = yard.riftMod.riftReach();

  return [
    ok(emptied === 0, 'the tear leaves the hole empty', `${emptied}`),
    ok(standing > 500, 'and the pile the yard tips in afterward stands under the disc',
       `${standing} grains after two minutes`),
    ok(refused === 0, 'with every grain tipped in still counted', `${refused} refused`),
    ok(grown > young * 10, 'the reach grows with the hole', `${young.toFixed(0)} -> ${grown.toFixed(0)} cells`),
    ok(late < standing / 4, 'and a grown hole eats what the young one left standing',
       `${standing} -> ${late}`)
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
