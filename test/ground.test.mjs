// The ground: where dust lands, how it heaps, which pile it belongs to, and who
// can reach it.

import { group, ok, state, run, runUntil, quickCrew, haveRock, openSites, P, WORKER } from './helpers.mjs';

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
    window.__pile(p.from + Math.random() * (p.to - p.from), 80);
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
    window.__pile(p.from + Math.random() * (p.to - p.from), 60);
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
  // no miners, so nothing new lands while we watch, and only one heap on the
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
  window.__crew(0, 0, 4, 0);                 // quarriers, and nobody to carry it off
  quickCrew();
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

  const part = runUntil(() => state().pileCount.quarry >= 45, 120) && profile();
  const filled = runUntil(() => state().pileFull.quarry, 300);
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
    ok(part && tall(part) >= wide(part) / 3,
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
    ok(tall(crest) >= cells / 2,
       'a full one stands at its crest', `${tall(crest)} cells over ${cells}`),
    ok(peak > cells / 4 && peak < cells * 3 / 4,
       'and the crest is in the middle of the strip', `column ${peak} of ${cells}`),
    ok(crest.every((h, c) => h <= (Math.min(c + 1, cells - 1 - c) * 1.5) + 1),
       'with nothing standing up as a wall at either end', JSON.stringify(crest))
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


// A dig takes the far wall out from under whatever was lying behind it. The
// dust stood on the strip past the hole; after the dig that strip is hole, and
// it hung there in the air over the mouth for the rest of the run -- settling
// only moves a grain that has somewhere to fall to, and the ground under it was
// still the bottom row of the floor.
group('widening the pit drops the dust behind the wall into it', async () => {
  window.__crew(0, 0);
  window.__clearFloor();
  run(0.4);
  const before = state();
  const far = before.pitX + before.pitW;
  // a bank on the ground the next dig is about to take
  for (let i = 0; i < 300; i++) window.__pile(far + P * 2 + (i % 40) * P, 1);
  run(2);
  const piled = window.__dustSpan();
  const onGround = state().floor;
  window.__dig(1);
  const dug = state();
  run(3);
  const after = state();
  const banked = after.pitDust - before.pitDust;
  const stranded = window.__dustOverPit();       // read the ground before clearing it
  window.__clearFloor();
  return [
    ok(onGround > 100, 'there is a bank behind the far wall to start with',
       `${onGround} grains, lying ${piled.lo}..${piled.hi}`),
    ok(dug.pitW > before.pitW, 'and the dig takes the wall out past it',
       `${before.pitW} -> ${dug.pitW} wide`),
    ok(stranded === 0, 'nothing is left standing in the air over the mouth',
       `${stranded} grains out there`),
    ok(banked > 100, 'what was over it comes down into the hole',
       `${banked} grains in`),
    ok(after.floor + banked >= onGround - 20,
       'and none of it is lost on the way', `${onGround} -> ${after.floor} out, ${banked} in`)
  ];
});
