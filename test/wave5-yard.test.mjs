// The yard's furniture: the one gap between stations, the star's slot beside the
// tower, and what a strip can hold now that the crates have gone.
//
// None of these is about drawing -- the shacks' details are a shot, not a check
// (`node tools/look.mjs shacks`) -- and all of them are about arithmetic that
// used to be spread over eleven hand-measured numbers.

import { readFileSync } from 'node:fs';
import { yard, group, ok, state, run, runUntil, openSites, P } from './helpers.mjs';
import { S, floor, sky, tower } from '../src/state.js';
import { placeSites, bankCeiling } from '../src/world.js';
import { PILE_LIMIT, STATION_GAP, SUN_GAP, SITES } from '../src/config.js';

// What ground a site has spoken for: its own box and its heap's strip as one
// run, because the bare gap between a station and its own heap is that
// station's business and not padding between neighbours.
function extents() {
  const { at, strips } = placeSites();
  return SITES.map(row => {
    const box = at[row.key];
    const strip = strips.find(p => p.key === row.pile);
    return {
      key: row.key,
      from: Math.min(box.x, strip ? strip.from : Infinity),
      to: Math.max(box.x + box.w, strip ? strip.to : -Infinity)
    };
  }).sort((a, b) => a.from - b.from);
}

group('one gap, and the same one, between every pair of stations', () => {
  openSites();
  const runs = extents();
  const gaps = runs.slice(1).map((r, i) => ({ pair: `${runs[i].key}->${r.key}`,
                                              gap: r.from - runs[i].to }));
  const odd = gaps.filter(g => g.gap !== STATION_GAP);
  return [
    ok(runs.length === SITES.length, 'every site in the table stood somewhere',
       `${runs.length} of ${SITES.length}`),
    ok(!odd.length, 'and each one is exactly STATION_GAP from the next',
       odd.map(g => `${g.pair} ${g.gap}`).join(', ') || `${STATION_GAP} throughout`),
    // The gap has one job that no number in the table can be trusted with any
    // more: it has to hold the furniture a site hangs off its own left-hand
    // side. The farmhands' stand is the deepest of those.
    ok(runs[0].from >= 0, 'and the far end of the walk is still inside the world',
       `${runs[0].key} starts at ${runs[0].from}`)
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
    ok(runs.every((r, i) => !i || r.from - runs[i - 1].to === STATION_GAP),
       'and it is laid out on the new spacing, not the one it was saved under'),
    ok(!strayed.length, 'no body is left standing outside the yard',
       strayed.map(w => `${w.type} at ${Math.round(w.x)}`).join(', ')),
    // The proof that they got where they were going: the yard is still paying
    // out a minute and a half after a layout it has never seen before.
    ok(after.dust !== before.dust || after.shards > before.shards
       || after.spores > before.spores,
       'and the yard is still making something on the far side of the move')
  ];
});
