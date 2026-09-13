// The ground: where dust lands, how it heaps, which pile it belongs to, and who
// can reach it.

import { group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';
// Where a check scatters its own dust, it scatters it out of the yard's own
// generator rather than the platform's. A fixture placed with `Math.random` is
// a fixture that lands somewhere else every run, which puts back exactly the
// run-to-run wobble the seed was brought in to take out -- and it does it
// invisibly, because the leak is on this side of the line rather than in the
// game. Every group here is seeded before its body runs (see `group` in
// helpers.mjs), so `rand()` below is part of the same repeatable stream the
// yard is drawing from.
import { rand } from '../src/rng.js';
// The bird is startled through the same call the click makes, out of the same
// module the yard is running: a check that reached for its own copy of the sky
// would be startling a bird nobody can see.
import { BIRDS, startle } from '../src/weather.js';
import { yardLeft, bankCeiling, pastRock } from '../src/world.js';
import { S, floor } from '../src/state.js';
import { at, put } from '../src/grid.js';
// The held button swings through the same door the crew's picks do, and the
// check wants the same point over the rock a player's cursor would be at.
import { topOfRock } from '../src/rock.js';
import { LOOSE_DEEP, PILE_HOLDS, FIND_COLOR } from '../src/config.js';

// How many grains are standing in a column, read straight off the grid. The
// snapshot counts the yard; these checks are about the shape of one seam, so
// they read the columns themselves.
const heightAt = x => {
  const c = Math.max(0, Math.min(floor.cols - 1, Math.round((x - floor.x) / P)));
  for (let r = floor.rows - 1; r >= 0; r--) if (at(floor, c, r)) return r + 1;
  return 0;
};
const colOfX = x => Math.max(0, Math.min(floor.cols - 1, Math.round((x - floor.x) / P)));

// The last columns of ground sit further right than a worker is allowed to
// stand, so one that had to be standing on a column to scoop it stood at the
// lip for ever with the dust a hand's width away.
// Two ways the yard used to bank dust with nobody carrying it: a heap that
// reached the lip tipped itself in four cells at a time, and once the ground
// was full the rest rolled straight into the pit. Both put the haulers out of
// a job, which is the one thing the ground must never do.
group('the ground never banks dust by itself', async () => {
  window.__crew(3, 0);
  window.__clearFloor();
  run(1);
  const s = state();
  const before = state().pitDust;
  // heap it at the ledge, far more than the old four-deep topple needed
  for (let i = 0; i < 40; i++) window.__pile(s.pitX - 30, 200);
  run(2);
  const heaped = state();

  // now fill the rock's strip and watch the crew stop rather than the dust roll in
  const strip = () => state().piles.find(q => q.key === 'rock');
  for (let i = 0; i < 200 && !state().pileFull.rock; i++) {
    const p = strip();
    window.__pile(p.from + rand() * (p.to - p.from), 80);
    run(0.2);
  }
  const full = state();
  const rockThen = full.rock;
  run(4);
  const stalled = state();
  window.__clearFloor();
  run(2);
  const freed = state();
  const rockFreed = freed.rock;
  run(4);
  const working = state();
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    // a handful is what was already in the air when the ground ran out; in play
    // the crew stop before it can, so nothing is ever homeless
    ok(heaped.pitDust - before <= 20, 'a heap at the ledge does not topple in on its own',
       `${before} -> ${heaped.pitDust} in the pit`),
    ok(full.yardFull, "the rock's pile fills up", `${full.pileCount.rock} grains`),
    ok(stalled.pitDust - before <= 20, 'and nothing rolls in but what was already flying',
       `${stalled.pitDust - before} grains in`),
    ok(stalled.rock === rockThen, 'the crew down tools instead',
       `${rockThen} -> ${stalled.rock} of rock`),
    ok(full.dustAtQuarry === 0, 'and none of it is heaped over the mouth of the quarry',
       `${full.dustAtQuarry} grains out there`),
    ok(!freed.yardFull, 'clearing the ground puts them back to work'),
    ok(working.rock < rockFreed, 'and the rock starts coming off again',
       `${rockFreed} -> ${working.rock}`)
  ];
});

// They are dust with a different mark on them, so they heap the way dust
// heaps: the same grid, the same repose, the same ceiling. There is no second
// implementation of any of it to drift out of step.
// The first colour in the game. Everything the ground makes is a grey, because
// grey is how deep the rock was; the things the sites give up never came off
// the rock, so they are the one thing a colour can mean something about. Each
// grain carries its own tone, so a heap of them speckles like a heap of dust.
group('what the sites give up comes in colours, and in tones', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  run(0.5);
  const p = state().piles.find(q => q.key === 'quarry');
  for (let i = 0; i < 24; i++) { window.__toss('shard', p.from + 40); run(0.25); }
  run(8);
  const cells = state().findCells.filter(c => c.x > p.from - 40 && c.x < p.to + 40);
  const tones = new Set(cells.map(c => c.v));
  return [
    ok(cells.length === 24, 'all of them are there', `${cells.length}`),
    ok(cells.every(c => c.kind === 'shard'), 'and every one is a shard',
       JSON.stringify([...new Set(cells.map(c => c.kind))])),
    ok(tones.size > 1, 'they are not all the same tone', `${tones.size} tones`),
    ok(tones.size <= 4, 'and no more tones than the kind has', `${tones.size}`)
  ];
});

group('a heap of finds heaps, rather than stacking', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  run(0.5);
  const p = state().piles.find(q => q.key === 'quarry');
  for (let i = 0; i < 30; i++) { window.__toss('shard', p.from + 30); run(0.3); }
  run(10);
  const at = state().findAll.map(t => t.split(',').map(Number))
                            .filter(a => a[0] > p.from - 40 && a[0] < p.to + 40);
  const xs = at.map(a => a[0]);
  const tops = {};
  for (const [x, h] of at) tops[x] = Math.max(tops[x] || 0, h);
  const near = Math.min(...xs);
  const peak = (+Object.keys(tops).reduce((a, b) => tops[b] > tops[a] ? b : a) - near) / 6;
  const tall = Math.max(...at.map(a => a[1]));
  return [
    ok(at.length === 30, 'all thirty are lying there', `${at.length}`),
    ok(Math.max(...xs) - Math.min(...xs) >= 36, 'they spread out along the ground',
       `${Math.max(...xs) - Math.min(...xs)}px across`),
    ok(tall <= 30 * 6 / 3, 'rather than going up in a column',
       `${tall / 6} cells at the peak`),
    ok(at.every(a => a[0] % 6 === 0 && a[1] % 6 === 0),
       'every one of them sits in a cell, like a grain of dust',
       JSON.stringify(at.slice(0, 4))),
    ok(new Set(at.map(a => a.join(','))).size === at.length,
       'and no two are in the same cell'),
    ok(peak > 0, 'the heap leans away from the station rather than standing on it',
       `tallest column is ${peak} cells out from the near end`)
  ];
});

group('a worker can reach dust at the far end of a pile', async () => {
  window.__crew(0, 0);                        // lay it down before anyone can take it
  window.__clearFloor();
  run(0.5);
  const s = state();
  const rock = s.piles.find(p => p.key === 'rock');
  window.__pile(rock.to - 12, 3);             // the last column of the strip
  run(0.5);
  const before = state();
  window.__crew(0, 1);
  quickCrew();
  const cleared = runUntil(() => state().stored > before.stored, 30);
  window.__crew(0, 0);
  return [
    ok(before.floor > 0, 'dust is lying at the far end to start with',
       `${before.floor} grains`),
    ok(cleared, 'a worker gets to it rather than stopping short',
       `${before.floor} still there`)
  ];
});

// Every worker used to work out the same answer to "where is the nearest
// dust", so a single grain behind the crew turned the whole line round, and
// turned it round again the moment the first of them picked it up.
group('workers do not all go for the same grain', async () => {
  window.__crew(0, 3);
  window.__clearFloor();
  run(0.5);
  const s = state();
  for (const at of [0.30, 0.45, 0.60]) window.__pile(s.pitX * at, 90);
  // Watched over a stretch rather than glanced at: a claim only lasts until
  // the column is bare, and a fast crew can clear three small heaps between
  // one look and the next.
  let claims = [], best = 0;
  for (let i = 0; i < 30; i++) {
    run(0.1);
    const now = state().claims.filter(c => c >= 0);
    const spread = new Set(now).size;
    if (spread > best) { best = spread; claims = now; }
  }
  const busy = state();
  window.__crew(0, 0);
  return [
    ok(claims.length >= 2, 'the workers are spread over the piles', JSON.stringify(busy.claims)),
    ok(new Set(claims).size === claims.length, 'no two set off for the same column',
       JSON.stringify(claims)),
    ok(busy.pace.empty > busy.pace.laden, 'and a worker moves quicker with its hands free',
       `${busy.pace.empty} empty, ${busy.pace.laden} laden`)
  ];
});

// Holding the button is working the rock, and the rock hands stop working it
// when their pile is full. The hold used to keep going: with nowhere on the
// ground for the spoil, it rolled into the pit -- dust nobody carried.
group('holding the button stops at a full pile, like the crew', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  haveRock();
  run(1);
  const strip = () => state().piles.find(q => q.key === 'rock');
  for (let i = 0; i < 200 && !state().pileFull.rock; i++) {
    const p = strip();
    window.__pile(p.from + rand() * (p.to - p.from), 60);
    run(0.2);
  }
  const full = state();
  // the cursor on the top of the rock, the button down, and a yard that has
  // unlocked holding
  const top = topOfRock(S.cx);
  S.mouse.x = top.x; S.mouse.y = top.y;
  S.autoMine = true;
  S.mining = true;
  S.nextHit = 0;
  const rockThen = state().rock;
  run(4);
  const held = state();
  window.__clearFloor();
  run(1);
  const rockFreed = state().rock;
  run(4);
  const working = state();
  S.mining = false;
  return [
    ok(full.pileFull.rock, "the rock's pile fills", `${full.pileCount.rock} grains`),
    ok(held.rock === rockThen, 'and the held button takes nothing off the rock while it is full',
       `${rockThen} -> ${held.rock}`),
    ok(!working.pileFull.rock && working.rock < rockFreed,
       'and swings again once the pile is cleared', `${rockFreed} -> ${working.rock}`),
  ];
});

// Every station piles to its right, into a strip of ground of its own, and the
// strip has a size. A pile that fills stops the station behind it -- that is
// the whole of the choice the job rows ask, made visible in the yard.
group('each station piles to its right, and stops when its pile is full', async () => {
  window.__crew(2, 0);
  window.__clearFloor();
  run(1);
  const s = state();
  const order = s.piles.map(p => p.key).join(' ');
  // fill the rock's strip by hand rather than waiting eight minutes for it
  for (let i = 0; i < 200 && !state().pileFull.rock; i++) {
    const p = state().piles.find(q => q.key === 'rock');
    window.__pile(p.from + rand() * (p.to - p.from), 60);
    run(0.2);
  }
  const full = state();
  const rockThen = full.rock;
  run(4);
  const stalled = state();
  window.__clearFloor();
  run(2);
  const freed = state();
  const rockFreed = freed.rock;
  run(4);
  const working = state();
  window.__crew(0, 0);
  return [
    ok(order === 'farm quarry rock', 'the strips run farm, quarry, rock, left to right', order),
    ok(s.piles.every((p, i) => i === 0 || p.from >= s.piles[i - 1].to),
       'and none of them runs into the next', JSON.stringify(s.piles)),
    ok(full.pileFull.rock, "the rock's pile fills", `${full.pileCount.rock} grains`),
    ok(stalled.rock === rockThen, 'and the crew stop working while it is',
       `${rockThen} -> ${stalled.rock} of rock`),
    ok(full.pileMarks.includes('rock'), 'the station says so, under it',
       JSON.stringify(full.pileMarks)),
    ok(!freed.yardFull, 'clearing it puts them back to work'),
    ok(!freed.pileMarks.includes('rock'), 'and the mark comes down with it'),
    ok(working.rock < rockFreed, 'and the rock starts coming off again',
       `${rockFreed} -> ${working.rock}`)
  ];
});

group('a worker can reach the bank behind the rock', async () => {
  // no rock hands, so nothing new lands while we watch, and only one heap on the
  // ground: the one on the far side of the hill
  window.__crew(0, 1);
  quickCrew();                               // so it walks at a fair clip
  window.__clearFloor();                     // so the only dust is the heap we make
  run(0.3);
  const s = state();
  const behind = s.piles.find(p => p.key === 'quarry').to - 60;
  window.__pile(behind, 10);
  run(0.4);
  const before = state();

  let reached = s.rockX;
  for (let i = 0; i < 150; i++) {
    run(0.1);
    for (const p of state().workerPos) {
      if (p[0] !== 'h') continue;
      reached = Math.min(reached, +p.split(':')[1].split(',')[0]);
    }
    if (state().dustLeftOfRock < before.dustLeftOfRock) break;
  }
  const after = state();
  window.__crew(0, 0);                    // leave the payroll as we found it
  return [
    ok(before.dustLeftOfRock > 0, 'dust is heaped behind the hill to start with',
       `${before.dustLeftOfRock}`),
    ok(reached <= s.rockX - s.rockW / 2 + WORKER, 'a worker walks past the hill to get to it',
       `got to ${Math.round(reached)}, hill starts ${Math.round(s.rockX - s.rockW / 2)}`),
    ok(after.dustLeftOfRock < before.dustLeftOfRock, 'and starts clearing it',
       `${before.dustLeftOfRock} -> ${after.dustLeftOfRock}`)
  ];
});

// A pile you cannot read is a number you have to go and look up. Spread along
// seventy cells, a site's output lies two deep whether there is a quarter of
// it or the lot, and only the warning triangle says which. Its strip is now
// only as wide as its limit needs, so what it makes stands up: a quarter is a
// nub against the station, and the limit is a crest across the middle of it.
group('a full pile is a heap you can read', async () => {
  window.__grant({ cores: 8 });
  window.__crew(0, 0, 0, 0);                 // nobody: the pile is thrown, not mined
  window.__clearFloor();
  run(1);

  const strip = () => state().piles.find(p => p.key === 'quarry');
  // how high every column of the pile stands, in cells, left to right. The
  // pile is all shards, so where the marks are is where the pile is.
  const profile = () => {
    const p = strip();
    const tops = new Array(Math.round((p.to - p.from) / P)).fill(0);
    for (const t of state().findAll) {
      const [x, y] = t.split(',').map(Number);
      if (x < p.from || x >= p.to) continue;
      const c = Math.round((x - p.from) / P);
      tops[c] = Math.max(tops[c], y / P + 1);
    }
    return tops;
  };
  const tall = tops => Math.max(...tops);
  const wide = tops => tops.filter(h => h > 0).length;

  // The pile is thrown in rather than dug up. What this group is about is the
  // *shape* a full heap takes -- a triangle standing on its strip, crest in the
  // middle, no wall at either end -- and none of that is about where the shards
  // came from. A cut pays a handful at the bottom of a dig now, so mining a
  // hundred and eighty of them is the better part of an hour of yard for a check
  // about geometry.
  const heap = () => {
    const p = strip();
    // weighted towards the near end, the way a body at the rim actually throws:
    // most of it lands close and it tails away along the strip, which is what
    // makes a heap a mound rather than a carpet
    for (let i = 0; i < 20; i++) {
      const bell = rand() + rand() + rand() - 1.5;
      const at = p.from + Math.min(1, Math.abs(bell)) * (p.to - p.from) * 0.5;
      window.__toss('shard', at);
    }
    run(0.8);
  };
  while (state().pileCount.quarry < 45) heap();
  const part = profile();
  for (let i = 0; i < 60 && !state().pileFull.quarry; i++) heap();
  const filled = state().pileFull.quarry;
  run(2);                                    // and whatever was still in the air
  const full = state();
  const crest = profile();
  const cells = crest.length;
  const peak = crest.indexOf(tall(crest));
  window.__crew(0, 0, 0, 0);
  window.__clearFloor();

  return [
    ok(cells <= 30, 'a site heaps into a strip narrow enough to stand up in',
       `${cells} cells across`),
    // Two thirds as high as it is wide. A third was the band a heap thrown out
    // of `Math.random` needed -- the same twenty shards landed in a different
    // place every run, so the band had to hold for the flattest scatter the
    // chance could deal. Off the seeded fixture it is 9 cells high over 13
    // across every time, which is 0.69; 0.6 is that with a margin, and it is
    // low enough to still be about the shape rather than about the count.
    ok(part && tall(part) >= wide(part) * 0.6,
       'a quarter of a pile is already a mound rather than a scatter',
       part && `${tall(part)} cells high over ${wide(part)} across`),
    ok(filled, 'and it fills to its limit', `${full.pileCount.quarry} grains`),
    ok(full.pileCount.quarry >= 180,
       'which is the same count it has always been full at',
       `${full.pileCount.quarry} grains`),
    ok(full.pileMarks.includes('quarry'), 'the station says so, under it',
       JSON.stringify(full.pileMarks)),
    ok(tall(crest) > tall(part) * 1.5, 'the heap grew upward as it filled, not only along',
       `${part && tall(part)} cells at a quarter, ${tall(crest)} full`),
    // A full pile is a triangle standing on the whole strip: its high point is
    // in the middle of it, not against either end, which is what says at a
    // glance that there is no more room rather than merely a lot lying there.
    // Seven tenths of the strip's width, not half of it. Half was room held
    // open for a scatter that landed differently every run; the seeded heap
    // stands 17 cells over a strip 22 across, which is 0.77 to the digit on
    // three runs. At 0.7 a heap that flattened by two cells is a failure
    // rather than a pass with room to spare.
    ok(tall(crest) >= cells * 0.7,
       'a full one stands at its crest', `${tall(crest)} cells over ${cells}`),
    ok(peak > cells / 4 && peak < cells * 3 / 4,
       'and the crest is in the middle of the strip', `column ${peak} of ${cells}`),
    // The envelope is the slope alone now. It used to be the slope plus five
    // cells of crate side, and the crates went with item 8 of feedback5 -- so
    // what this says is what it always meant to say: nothing stands up as a
    // wall, a strip is a heap of loose stuff and only that, from either end.
    ok(crest.every((h, c) => h <= Math.min(c + 1, cells - 1 - c) * 1.5 + 1),
       'with nothing standing higher than the angle the stuff lies at',
       JSON.stringify(crest))
  ];
});

// A pile is where the crew put dust, not where dust is allowed to be. Dropped
// on the bare ground between two stations it used to find the column full, walk
// outward looking for one that was not, and end up in the nearest heap a
// hundred cells from where you let go of it.
group('dust lies where it is dropped, not where a pile is', async () => {
    run(0.4);
  window.__crew(0, 0);
  run(4);
  window.__clearFloor();
  const s = state();

  // A real gap: bare ground between the end of one station's strip and the
  // start of the next, inside the yard the crew can walk.
  const gaps = s.piles.slice(0, -1)
    .map((p, i) => ({ from: p.to, to: s.piles[i + 1].from }))
    .filter(g => g.to - g.from > 120);
  const at = Math.round((gaps[0].from + gaps[0].to) / 2);
  window.__pile(at, 20);
  run(3);
  const span = window.__dustSpan();
  window.__clearFloor();
  return [
    ok(state().floor >= 0 && span.lo != null, 'a grain put down on bare ground stays down'),
    ok(Math.abs(span.lo - at) < 60 && Math.abs(span.hi - at) < 60,
       'and it lies where it was put rather than being walked off to a heap',
       `dropped at ${at}, lying ${span.lo}..${span.hi}`)
  ];
});

// Ground that is barred is not all one thing, and the left-hand end of the yard
// is no longer any of it.
//
// It used to be: barred because nobody could walk out there, three hundred
// columns of it running to the edge of the world, and a grain let go over it
// walked the whole way in and landed in the first strip it met -- the farm's --
// which is dust in a heap nobody carried anything to.
//
// The answer was never to bar the ground. Your cursor sweeps wherever the
// camera goes and the camera goes to the left edge of the world, so that ground
// is reachable; what was wrong was the walking, and the walking is what stops.
// A grain let go out there lands where it was let go of, lies there as the same
// thin scatter bare ground takes anywhere, and waits for you rather than for
// the crew. The crew's own bounds have not moved -- they still stop at
// `yardLeft` -- so nothing books a column it cannot stand on.
group('dust let go off the end of the yard lies where it fell', async () => {
  window.__crew(0, 0);
  run(1);
  window.__clearFloor();
  const s = state();
  const left = yardLeft();

  // Bare yard first, so the rest is read against a ground that does take dust:
  // the gap between two stations, where nothing heaps on purpose.
  const gaps = s.piles.slice(0, -1)
    .map((p, i) => ({ from: p.to, to: s.piles[i + 1].from }))
    .filter(g => g.to - g.from > 120);
  const bare = Math.round((gaps[0].from + gaps[0].to) / 2);
  window.__pile(bare, 20);
  run(2);
  const laid = state();
  const span = window.__dustSpan();
  window.__clearFloor();
  run(1);

  // Then a long way past the end of it -- two hundred columns out, well beyond
  // anything a grain was ever allowed to walk to get out from under an obstacle.
  const off = Math.round((left - P * 200) / P) * P;
  window.__pile(off, 30);
  run(2);
  const after = state();
  const offSpan = window.__dustSpan();
  const heaped = Object.values(after.pileCount).reduce((a, b) => a + b, 0);

  // Nobody may book it, either. A hauler held at `yardLeft` that claimed a
  // column two hundred out would set off, stop at the end of its own span, and
  // stand there with a claim it can never work off.
  window.__crew(0, 3);
  quickCrew();
  run(6);
  const claims = state().workerPos.filter(w => w[0] === 'h')
    .map(w => +w.split(':')[1].split(',')[0]);
  const worked = state();
  window.__crew(0, 0);
  window.__clearFloor();
  run(1);

  // And the bird itself, put up where the check wants it rather than where the
  // weather happened to send one. `far: 1` is a bird at the ground's own depth,
  // so the x it is clicked at is the x it is over whatever the camera is doing.
  const bird = x => {
    S.chips.length = 0;
    BIRDS.length = 0;
    BIRDS.push({ x, y: S.camY + P * 20, vx: 0, far: 1, sway: 0, flap: 0, beat: 0.2 });
    startle(x, S.camY + P * 20);
    return S.chips.length;
  };
  const shedOverYard = bird(Math.round(bare / P) * P);
  const shedOffYard = bird(off);
  const shedOffWorld = bird(-P * 40);
  S.chips.length = 0;
  BIRDS.length = 0;
  window.__clearFloor();

  return [
    ok(laid.floor >= 15, 'a grain let go on bare ground stays on it', `${laid.floor} lying`),
    ok(Math.abs(span.lo - bare) < 60 && Math.abs(span.hi - bare) < 60,
       'and it lies where it was let go of', `dropped at ${bare}, lying ${span.lo}..${span.hi}`),
    ok(after.floor >= 25, 'a grain let go off the end of the yard lands there too',
       `${after.floor} on the floor`),
    ok(offSpan.lo != null && Math.abs(offSpan.lo - off) < 120 && Math.abs(offSpan.hi - off) < 120,
       'and lies where it was dropped rather than walking home',
       `dropped at ${off}, lying ${offSpan.lo}..${offSpan.hi}`),
    ok(heaped === 0, 'no heap two hundred columns away gains a grain by it',
       JSON.stringify(after.pileCount)),
    ok(claims.every(x => x >= left - WORKER), 'and no body walks out to fetch it',
       `haulers at ${claims.join(', ')}, the yard starts ${Math.round(left)}`),
    ok(worked.floor >= 25, 'the drop is still lying there when they have had their chance',
       `${worked.floor} on the floor`),
    ok(shedOverYard > 0, 'a bird over the yard still sheds when it is startled',
       `${shedOverYard} grains`),
    ok(shedOffYard > 0, 'and one over the far end sheds too, now that ground holds dust',
       `${shedOffYard} grains`),
    ok(shedOffWorld === 0, 'but one off the edge of the world sheds nothing',
       `${shedOffWorld} grains`)
  ];
});

// The strip in front of the hill. It was bare for as long as the game has
// existed, and not because nothing was ever dropped there: `blocked` refused
// every column of the rock's clearance, so a grain aimed at it rolled out to
// the nearest column that would have it. Only the boulder's own footprint is
// refused now, and the clearance is ground like the rest of the yard.
group('dust lies on the ground in front of the hill', async () => {
  window.__crew(0, 0);
  await haveRock();
  window.__clearFloor();
  run(0.5);
  const s = state();

  // The clearance on the yard side: between the near edge of the boulder and
  // the near end of the heap that stands off it.
  const face = s.rockLeftX + s.rockW;
  const heap = s.piles.find(p => p.key === 'rock');
  const mid = Math.round((face + heap.from) / 2 / P) * P;
  for (let d = -60; d <= 60; d += P) window.__pile(mid + d, 12);
  run(3);
  const laid = state();

  // The seam: every column from the foot of the hill out into the heap, and
  // what the ceiling says each of them is allowed.
  const seam = [];
  for (let x = face; x <= heap.from + P * 20; x += P)
    seam.push({ x, h: heightAt(x), cap: bankCeiling(colOfX(x)) });

  const inClear = seam.filter(q => q.x < heap.from);
  const under = (() => {
    let n = 0;
    for (let c = 0; c < floor.cols; c++) {
      if (pastRock(floor.x + c * P) >= 0) continue;
      for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
    }
    return n;
  })();

  // A wall is a column standing well over what the ceiling beside it allows.
  // Nothing here may: the clearance is capped by the scatter, and the heap
  // rises off its own end at the slope.
  const wall = seam.find(q => q.h > q.cap + 1);
  window.__clearFloor();

  return [
    ok(laid.floor > 0, 'dust let go in front of the hill stays there', `${laid.floor} lying`),
    ok(inClear.some(q => q.h > 0), 'the clearance holds it',
       `${inClear.filter(q => q.h > 0).length} of ${inClear.length} columns standing`),
    ok(inClear.every(q => q.h <= LOOSE_DEEP), 'no deeper than bare ground anywhere else',
       `tallest ${Math.max(...inClear.map(q => q.h))}, scatter is ${LOOSE_DEEP}`),
    ok(under === 0, 'and not one grain under the boulder itself', `${under} under it`),
    ok(seam[0].h === 0 && seam[1] && seam[1].h <= 2,
       'the ground lies down against the foot of the hill rather than standing up',
       JSON.stringify(seam.slice(0, 4).map(q => q.h))),
    ok(!wall, 'and nothing along the seam stands up as a wall',
       wall ? `${wall.h} cells at ${wall.x}, ceiling ${wall.cap}` : '')
  ];
});

// A new boulder lands on whatever the last one left lying on its footprint, and
// that dust has to go somewhere. It used to be handed to `addGrain`, which walks
// outward for the first column with room -- the first column of the rock's own
// heap, which then stood a dozen cells hard against the boulder. It is thrown
// now, on the arc a rockhand's spoil takes, so it leaves the ground as dust in the
// air and comes down out along the heap like everything else thrown at it.
group('a rock landing throws the dust off its footprint rather than shovelling it', async () => {
  window.__crew(0, 0);
  await haveRock();
  window.__clearFloor();
  run(0.5);

  // Dust standing on the footprint, which is the one place `__pile` will not
  // put it -- the ground under a boulder is refused, and rightly. So it is
  // written straight into the grid: this is the state a rock coming down on a
  // dusty footprint finds, however it got there.
  let planted = 0;
  for (let c = 0; c < floor.cols; c++) {
    if (pastRock(floor.x + c * P) >= 0) continue;
    for (let r = 0; r < 2; r++) { put(floor, c, r, 1); planted++; }
  }
  const before = state();
  const heapBefore = before.pileCount.rock || 0;

  // The next boulder, which sweeps as it lands. The banks either side are bare,
  // so nothing here is the jolt shaking grains off them: every chip in the air
  // came off the footprint.
  window.__next();
  let airborne = 0;
  for (let i = 0; i < 200; i++) {
    run(0.1);
    airborne = Math.max(airborne, state().chips);
    const s = state();
    if (s.rock > 0 && !s.rockFall && !s.dancing) break;
  }
  await haveRock();
  run(6);
  const after = state();

  const under = (() => {
    let n = 0;
    for (let c = 0; c < floor.cols; c++) {
      if (pastRock(floor.x + c * P) >= 0) continue;
      for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
    }
    return n;
  })();
  const heap = after.piles.find(p => p.key === 'rock');
  const firstCol = heightAt(heap.from);
  window.__clearFloor();

  return [
    ok(planted > 0 && before.floor >= planted,
       'there is dust on the footprint to begin with', `${planted} grains planted`),
    ok(airborne > 0, 'the sweepings leave the ground as dust in the air rather than being written across it',
       `${airborne} chips flying at the most`),
    ok(under === 0, 'nothing is left standing under the new boulder', `${under} under it`),
    ok((after.pileCount.rock || 0) > heapBefore,
       'and what was swept lands on the heap that belongs to the rock',
       `${heapBefore} -> ${after.pileCount.rock || 0}`),
    ok(firstCol <= bankCeiling(colOfX(heap.from)) + 1,
       'the first column of that heap is not a wall against the rock',
       `${firstCol} cells, ceiling ${bankCeiling(colOfX(heap.from))}`)
  ];
});

// Every strip is marked out on the ground before anything lands on it -- pegs at
// its two ends and the mark of what piles there in the middle -- and the marking
// is drawn off the strip itself. There is nothing here that can go wrong with a
// strip's *position*, because nothing about it is written down twice.
//
// What can go wrong is the one thing that is written down: `PILE_HOLDS` says
// what each strip holds, and a key misspelled in it is a station silently marked
// as holding dust. That is a wrong drawing with nothing to say it is wrong, so
// it is checked here rather than looked for on screen. The other direction is
// deliberately NOT an error: a strip with no entry holds dust, which is what the
// rock and the scrubbing house pay out and what a new station pays out until
// somebody gives it a find of its own.
group('every strip on the ground says whose it is', async () => {
  // Everything the yard can open, so every strip that can exist does.
  openSites();
  window.__meteor();
  window.__buy('unlockscrub');
  window.__finish();
  run(1);
  const keys = state().piles.map(p => p.key);
  const named = Object.keys(PILE_HOLDS);
  const strays = named.filter(k => !keys.includes(k));
  return [
    ok(keys.length >= 4, 'the yard lays out its strips', keys.join(' ')),
    ok(strays.length === 0, 'and nothing in PILE_HOLDS names a strip that does not exist',
       strays.join(' ')),
    ok(keys.every(k => PILE_HOLDS[k] === undefined || FIND_COLOR[PILE_HOLDS[k]]),
       'and everything it does name is a find the game has a colour for',
       JSON.stringify(named.map(k => `${k}:${PILE_HOLDS[k]}`)))
  ];
});
