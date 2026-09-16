// The yard's furniture: the one gap between stations, the star's slot beside the
// tower, and what a strip can hold now that the crates have gone.
//
// None of these is about drawing -- the shacks' details are a shot, not a check
// (`node tools/look.mjs shacks`) -- and all of them are about arithmetic that
// used to be spread over eleven hand-measured numbers.

import { readFileSync } from 'node:fs';
import { yard, group, ok, state, run, runUntil, openSites, P } from './helpers.mjs';
import { S, floor, sky, tower } from '../src/state.js';
import { at as cellAt } from '../src/grid.js';
import { placeSites, bankCeiling } from '../src/world.js';
import { PILE_LIMIT, padOf, hangOf, STATION_GAP, SUN_GAP, SITES, YARD_MARGIN } from '../src/config.js';

// What ground a site has spoken for, in two readings.
//
// `from`/`to` are its wall to wall -- the building alone -- and that is what
// the walk in `placeSites` spaces. `runFrom`/`runTo` take in its heap as well,
// which is what is actually drawn on the ground.
//
// The rule is one STATION_GAP of bare ground between one drawn thing and the
// next. For a while every site was given the same apron -- the widest heap in
// the yard, laid beside all of them -- and the rhythm was said to be even wall
// to wall; nine sites with no heap stood a quarry's spoil apart for nothing.
// Now a site owns exactly the ground its own heap takes (`padOf`, config/
// sites.js), on the side the heap lies, so the bare ground between drawn runs
// is the gap everywhere and wall to wall is that plus whatever heap stands
// between the two walls.
function extents() {
  const { at, strips } = placeSites();
  return SITES.map(row => {
    const box = at[row.key];
    const strip = strips.find(p => p.key === row.pile);
    return {
      key: row.key,
      pad: padOf(row),
      hang: hangOf(row),
      side: row.side,
      from: box.x,
      to: box.x + box.w,
      runFrom: Math.min(box.x, strip ? strip.from : Infinity),
      runTo: Math.max(box.x + box.w, strip ? strip.to : -Infinity)
    };
  }).sort((a, b) => a.from - b.from);
}

// The separation the walk spends between a pair of neighbouring walls: the
// bare gap, plus the ground of whichever heaps lie between them -- the nearer
// site's if its heap lies on its far side, the further site's if it throws
// toward the rock -- plus whatever the nearer site hangs off its left side,
// which is the side facing the further one.
const pitch = (near, far) => STATION_GAP + near.hang
  + (near.side === 'left' ? near.pad : 0) + (far.side === 'left' ? 0 : far.pad);

group('one gap, and the same one, between every pair of stations', () => {
  openSites();
  const runs = extents();
  const gaps = runs.slice(1).map((r, i) => ({ pair: `${runs[i].key}->${r.key}`,
                                              gap: r.from - runs[i].to,
                                              pitch: pitch(r, runs[i]),
                                              bare: r.runFrom - runs[i].runTo }));
  const odd = gaps.filter(g => g.gap !== g.pitch);
  // A heap that has been given more ground than its own site's apron holds
  // would show up here and nowhere else: it would reach across the walk into
  // the neighbour's apron, and the bare ground between two drawn runs would
  // fall under a station's padding. That is the fault the extent-to-extent
  // reading was really guarding, and it is worth keeping on its own terms.
  const crowded = gaps.filter(g => g.bare < STATION_GAP);
  return [
    ok(runs.length === SITES.length, 'every site in the table stood somewhere',
       `${runs.length} of ${SITES.length}`),
    ok(!odd.length, 'and each pair of walls stands a gap and their heaps apart',
       odd.map(g => `${g.pair} ${g.gap}`).join(', ') || `${STATION_GAP} bare throughout`),
    ok(!crowded.length, 'with no heap reaching out of its own apron into the walk',
       crowded.map(g => `${g.pair} ${g.bare}`).join(', ')
       || `at least ${STATION_GAP} bare between every drawn pair`),
    // At least the margin. `GROUND_LEFT` sums every site's *reserved* width
    // (config/sites.js), but the walk stands each one at its *drawn* width
    // (`DRAWN_W` in world.js), so ground reserved for growth a station has not
    // bought yet -- the apothecary's unbought pots -- collects as slack past
    // the far end of the walk. Exactly the margin only holds fully grown; a
    // station drawn wider than it reserved would still push the walk past the
    // margin, which is the silent overflow this check exists to catch.
    ok(runs[0].from >= YARD_MARGIN,
       'and the far end of the walk stands at least its margin inside the world',
       `${runs[0].key} starts at ${runs[0].from}, margin ${YARD_MARGIN}`)
  ];
});

// The star called down the way the tower calls it: a wizard is made, and the
// first hat out of the tower summons the first star (see `stepTower`). There is
// no row that buys the star itself, so there is no purchase for this check to
// go through -- what it is about is where the two of them end up standing.
group('the star stands beside the tower, on its far side', () => {
  openSites();
  window.__crew(0, 0, 0, 0, 0, 1);            // a wizard, which calls a star down
  run(1);
  const strip = S.piles.find(p => p.key === 'sky');
  const mid = strip ? (strip.from + strip.to) / 2 : null;
  return [
    ok(S.meteorOpen, 'there is a star up there'),
    ok(!!strip, 'and it has ground of its own under it'),
    ok(strip && Math.abs(mid - sky.x) <= P,
       'the star hangs over the middle of that ground',
       `star ${sky.x}, ground ${strip && strip.from}..${strip && strip.to}`),
    // Far side means away from the rock, which is left: everything in this yard
    // is walked leftwards from the boulder.
    ok(strip && strip.to <= tower.x,
       'and it is on the tower\'s far side from the rock',
       `ground ends ${strip && strip.to}, tower stands at ${tower.x}`),
    ok(strip && tower.x - strip.to === SUN_GAP,
       'standing off the tower\'s wall by SUN_GAP and no more',
       `${strip && tower.x - strip.to}`)
  ];
});

// The crates went with item 8, and they were holding something up: a strip used
// to fill flat to five cells everywhere before anything leaned, which covered
// over the fact that `heapBase` reserved a cell or two less ground than a heap
// of whole cells actually needs. Without that cover a station's heap could not
// reach its own limit -- so the station would never stop, and the full-pile mark
// would never light on any of them.
group('a strip can still hold everything its station may pile on it', () => {
  openSites();
  window.__meteor();
  window.__air({ open: true });
  run(1);
  const out = [];
  for (const p of S.piles) {
    if (!PILE_LIMIT[p.key] || p.key === 'rock') continue;   // the rock's is a bank, not a heap
    let holds = 0;
    for (let x = p.from; x < p.to; x += P) {
      const c = Math.round((x - floor.x) / P);
      holds += Math.floor(bankCeiling(c));
    }
    out.push(ok(holds >= PILE_LIMIT[p.key],
                `the ${p.key} strip holds everything the ${p.key} may pile`,
                `${holds} cells of room for ${PILE_LIMIT[p.key]} grains`));
  }
  // ...and nothing stands flat at the ends any more, which is what a crate's
  // sides did. The end column of a strip takes a grain and no more.
  const strip = S.piles.find(p => p.key === 'quarry');
  const end = Math.floor(bankCeiling(Math.round((strip.from - floor.x) / P)));
  out.push(ok(out.length >= 3, 'and every station with a heap was looked at',
              `${out.length} strips`));
  out.push(ok(end <= 1, 'a heap leans off the bare end of its ground, with no sides to fill',
              `${end} cells of room in the first column`));
  return out;
});

// Widening the yard moves the world's left-hand edge away from everything
// standing on it, which is a thing that happens to saves people are in the
// middle of playing. What the ground carries is not only how MUCH dust there is
// but where each grain lies and what it is -- a shard in the quarry's heap is
// not the same object as a grey grain at the foot of the yard -- and re-packing
// the floor flat, which is what a shape change used to mean, loses both.
//
// The fixture is written at today's width (every fixture was re-saved at the
// save floor), so the narrower world is made from it the way the wider one is
// made below: the same ground with its first columns cut off and its anchor
// moved by exactly as many. Nothing stands in those columns -- they are the
// bare YARD_MARGIN ground -- so the two describe the same yard.
group('a save from before the world widened keeps its dust where it lay', () => {
  const raw = readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8');
  const was = JSON.parse(raw).floor;
  const TOOK = 19;
  const cols = was.cols - TOOK;
  // The saved cells, unpacked the way persist.js unpacks them, then the
  // columns that had anything standing in them, as the narrower world would
  // have written them down.
  const cells = new Uint8Array(was.cols * was.rows);
  let i = 0;
  for (const part of was.cells.split('.')) {
    const x = part.indexOf('x');
    const v = +part.slice(0, x), len = +part.slice(x + 1);
    if (v) cells.fill(v, i, i + len);
    i += len;
  }
  const narrow = new Uint8Array(cols * was.rows);
  const held = new Map();                    // column -> how many grains stood in it
  let lost = 0;
  for (let r = 0; r < was.rows; r++)
    for (let c = 0; c < was.cols; c++) {
      const v = cells[r * was.cols + c];
      if (!v) continue;
      if (c < TOOK) { lost++; continue; }
      narrow[r * cols + c - TOOK] = v;
      held.set(c - TOOK, (held.get(c - TOOK) || 0) + 1);
    }
  let packed = '', v = narrow[0], n = 0;      // run-length, the way persist.js writes it
  for (const x of narrow) { if (x === v) n++; else { packed += `${v}x${n}.`; v = x; n = 1; } }
  packed += `${v}x${n}`;

  const save = JSON.parse(raw);
  save.floor = { cols, rows: was.rows, cx: was.cx - TOOK * P, cells: packed };
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
  yard.restore();
  const dx = floor.cols - cols;              // the columns the world gained, all on its left
  const now = new Map();
  const shades = new Set();
  for (let r = 0; r < floor.rows; r++)
    for (let c = 0; c < floor.cols; c++) {
      const v = cellAt(floor, c, r);
      if (!v) continue;
      now.set(c, (now.get(c) || 0) + 1);
      shades.add(v);
    }
  const moved = [...held].every(([c, n]) => now.get(c + dx) === n);
  const grains = [...now.values()].reduce((a, b) => a + b, 0);
  const total = [...held.values()].reduce((a, b) => a + b, 0);
  return [
    ok(lost === 0, 'the columns cut off held nothing', `${lost} grains stood in them`),
    ok(dx > 0, 'the world this save was written in was narrower than today\'s',
       `${cols} columns then, ${floor.cols} now`),
    ok(grains === total, 'every grain it was carrying came back',
       `${grains} of ${total}`),
    ok(moved, 'and each one is the same distance along, in the same column of the yard',
       `${dx} columns across`),
    // Re-packed flat, every grain comes back as one middling grey. What the
    // shades say is what the ground is made of.
    ok(shades.size > 1, 'still made of what it was made of', [...shades].join(','))
  ];
});

// ...and the same thing the other way, which is new. The world had only ever
// grown at its left-hand end, so `gridSlide` only ever slid right; then the
// shack moved in against the rock and the yard gave nineteen columns back (see
// TO_FIRST_SITE, config/sites.js). A save from the wider world took the
// `fillFlat` path -- the same grains, re-packed flat as middling grey, with
// where each lay and what it was thrown away.
//
// There is no fixture from a wider world, because the world that wrote one is
// gone. So one is made from a real save: the same yard with columns added at
// the end everything is measured away from, and its anchor moved by exactly as
// many. Restoring it has to put every grain in the same column of today's yard
// as the unwidened save does -- which is the whole claim, checked against the
// other save rather than against a number typed in here.
group('a save from a world wider than today keeps its dust where it lay', () => {
  const raw = readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8');

  // What is on the ground, as columns and as what each grain is made of.
  const columns = () => {
    const m = new Map(), shades = new Set();
    for (let r = 0; r < floor.rows; r++)
      for (let c = 0; c < floor.cols; c++) {
        const v = cellAt(floor, c, r);
        if (!v) continue;
        m.set(c, (m.get(c) || 0) + 1);
        shades.add(v);
      }
    return { m, shades };
  };

  // A real save, restored the ordinary way. Where its dust ends up in today's
  // yard is the answer the made-up one has to reproduce.
  localStorage.setItem('boulder-clicker/v4', raw);
  yard.restore();
  const want = columns();

  // ...and now the same ground as it would have been written down in a world
  // nineteen columns wider: everything shifted along by nineteen, with the
  // anchor moved by exactly as much, so the two describe the same yard. Built
  // off the restored floor rather than off the fixture's own cells, because
  // this fixture is old enough to have no anchor in it at all.
  const GAVE = 19;
  const cols = floor.cols + GAVE;
  const wide = new Uint8Array(cols * floor.rows);
  for (let r = 0; r < floor.rows; r++)
    for (let c = 0; c < floor.cols; c++)
      wide[r * cols + c + GAVE] = cellAt(floor, c, r);
  let packed = '', v = wide[0], n = 0;         // run-length, the way persist.js writes it
  for (const x of wide) { if (x === v) n++; else { packed += `${v}x${n}.`; v = x; n = 1; } }
  packed += `${v}x${n}`;

  const save = JSON.parse(raw);
  save.floor = { cols, rows: floor.rows, cx: S.cx + GAVE * P, cells: packed };
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
  yard.restore();
  const got = columns();

  const sum = m => [...m.values()].reduce((a, b) => a + b, 0);
  const same = want.m.size === got.m.size
            && [...want.m].every(([c, k]) => got.m.get(c) === k);
  return [
    ok(cols > floor.cols, 'the world this save was written in was wider than the one today lays',
       `${cols} columns then, ${floor.cols} now`),
    ok(sum(want.m) > 0, 'the save it was made from had dust on the ground',
       `${sum(want.m)} grains`),
    ok(sum(got.m) === sum(want.m), 'every grain it was carrying came back',
       `${sum(got.m)} of ${sum(want.m)}`),
    ok(same, 'and each one is in the column of the yard it belongs to',
       `${got.m.size} columns holding dust, wanted ${want.m.size}`),
    // Re-packed flat, every grain comes back as one middling grey. What the
    // shades say is what the ground is made of.
    ok(got.shades.size > 1, 'still made of what it was made of',
       [...got.shades].join(','))
  ];
});

// A save made before any of this moved. Every building in it stands somewhere
// else now, and the one thing that must not happen is a body left holding an
// errand to a place that has moved out from under it.
group('a save from before the move loads, and its crew walk to the new spots', () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/player-yard.json', import.meta.url), 'utf8'));
  yard.restore();
  const before = state();
  run(90);
  const after = state();
  const runs = extents();
  const strayed = S.workers.filter(w => w.x < -P * 4 || w.x > S.worldW);
  return [
    ok(before.crew > 0, 'the save brought a crew with it', `${before.crew} bodies`),
    ok(floor.cols === Math.ceil(S.worldW / P),
       'the ground it saved still fits the world it is laid on',
       `${floor.cols} columns`),
    ok(runs.every((r, i) => !i || r.from - runs[i - 1].to === pitch(r, runs[i - 1])),
       'and it is laid out on the new spacing, not the one it was saved under',
       runs.slice(1).map((r, i) => `${runs[i].key}->${r.key} ${r.from - runs[i].to}`)
         .join(', ')),
    ok(!strayed.length, 'no body is left standing outside the yard',
       strayed.map(w => `${w.type} at ${Math.round(w.x)}`).join(', ')),
    // The proof that they got where they were going: the yard is still paying
    // out a minute and a half after a layout it has never seen before.
    ok(after.dust !== before.dust || after.shards > before.shards
       || after.spores > before.spores,
       'and the yard is still making something on the far side of the move')
  ];
});
