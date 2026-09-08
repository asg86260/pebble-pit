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
import { PILE_LIMIT, SLOT_PAD, STATION_GAP, SUN_GAP, SITES, YARD_MARGIN } from '../src/config.js';

// What ground a site has spoken for, in two readings.
//
// `from`/`to` are its wall to wall -- the building alone -- and that is what
// the walk in `placeSites` spaces. `runFrom`/`runTo` take in its heap as well,
// which is what is actually drawn on the ground.
//
// The two used to be one, and the check below asked for STATION_GAP between
// drawn extents. That stopped being the rule when every site was given the same
// apron (`SLOT_PAD`, derived in config/sites.js from the widest heap any site
// parks beside itself): the walk now spends SLOT_PAD + STATION_GAP between
// every pair of walls, and a heap lies inside its own site's apron rather than
// eating the walk. So a site with a small heap -- or none at all -- leaves the
// rest of its apron bare, and measuring extent to extent read that spare apron
// as an uneven gap. The rhythm is even; it is even wall to wall.
function extents() {
  const { at, strips } = placeSites();
  return SITES.map(row => {
    const box = at[row.key];
    const strip = strips.find(p => p.key === row.pile);
    return {
      key: row.key,
      from: box.x,
      to: box.x + box.w,
      runFrom: Math.min(box.x, strip ? strip.from : Infinity),
      runTo: Math.max(box.x + box.w, strip ? strip.to : -Infinity)
    };
  }).sort((a, b) => a.from - b.from);
}

// The one separation the walk spends between a pair of neighbouring walls.
const PITCH = SLOT_PAD + STATION_GAP;

group('one gap, and the same one, between every pair of stations', () => {
  openSites();
  const runs = extents();
  const gaps = runs.slice(1).map((r, i) => ({ pair: `${runs[i].key}->${r.key}`,
                                              gap: r.from - runs[i].to,
                                              bare: r.runFrom - runs[i].runTo }));
  const odd = gaps.filter(g => g.gap !== PITCH);
  // A heap that has been given more ground than its own site's apron holds
  // would show up here and nowhere else: it would reach across the walk into
  // the neighbour's apron, and the bare ground between two drawn runs would
  // fall under a station's padding. That is the fault the extent-to-extent
  // reading was really guarding, and it is worth keeping on its own terms.
  const crowded = gaps.filter(g => g.bare < STATION_GAP);
  return [
    ok(runs.length === SITES.length, 'every site in the table stood somewhere',
       `${runs.length} of ${SITES.length}`),
    ok(!odd.length, 'and each pair of walls stands the same distance apart',
       odd.map(g => `${g.pair} ${g.gap}`).join(', ') || `${PITCH} throughout`),
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
group('a save from before the world widened keeps its dust where it lay', () => {
  const raw = readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8');
  const was = JSON.parse(raw).floor;
  // The saved cells, unpacked the way persist.js unpacks them, as the columns
  // that had anything standing in them.
  const cells = new Uint8Array(was.cols * was.rows);
  let i = 0;
  for (const part of was.cells.split('.')) {
    const x = part.indexOf('x');
    const v = +part.slice(0, x), len = +part.slice(x + 1);
    if (v) cells.fill(v, i, i + len);
    i += len;
  }
  const held = new Map();                    // column -> how many grains stood in it
  for (let r = 0; r < was.rows; r++)
    for (let c = 0; c < was.cols; c++)
      if (cells[r * was.cols + c]) held.set(c, (held.get(c) || 0) + 1);

  localStorage.setItem('boulder-clicker/v4', raw);
  yard.restore();
  const dx = floor.cols - was.cols;          // the columns the world gained, all on its left
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
    ok(dx > 0, 'the world this save was written in was narrower than today\'s',
       `${was.cols} columns then, ${floor.cols} now`),
    ok(grains === total, 'every grain it was carrying came back',
       `${grains} of ${total}`),
    ok(moved, 'and each one is the same distance along, in the same column of the yard',
       `${dx} columns across`),
    // Re-packed flat, every grain comes back as one middling grey. What the
    // shades say is what the ground is made of.
    ok(shades.size > 1, 'still made of what it was made of', [...shades].join(','))
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
    ok(runs.every((r, i) => !i || r.from - runs[i - 1].to === PITCH),
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
