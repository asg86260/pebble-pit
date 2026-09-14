// One keeper, the whole farm.
//
// A farmhand used to put all of its tending into the plot it was standing over,
// so a farm with one body on it was one stalk and six patches of bare dirt for
// as long as you left it there -- and this file's first check is the one that
// caught it: over three minutes the other six plots never moved off nought.
//
// A hand keeps the row now: most of its work goes in front of it and the rest
// spreads over the other plots. What is not allowed to change is the pace. A
// hand is still worth one plot's worth of tending in the time one plot takes,
// so the farm's output is its headcount and nothing else -- one body is
// meaningfully slower than seven, which is the whole reason to assign more than
// one, and the top of the ladder lands exactly where it did before. Both halves
// are checked here, because either one on its own is easy to get and useless.

import { group, ok, state, run, openSites } from './helpers.mjs';

// What the farm has actually grown, in plots, however far round the row it is:
// every crop taken off plus what is standing in the ground unripe. Counting the
// pile instead would be counting spores that a hauler may or may not have got
// to, and counting ripe plots alone would miss the six that are half up.
const cuts = () => [...state().crewNames.matchAll(/\|g(\d+)\|/g)]
  .reduce((a, m) => a + +m[1], 0);
const grown = () => cuts() + state().plots.reduce((a, b) => a + b, 0);

// A farm with `hands` on it, watched for `mins`. The floor is swept as it goes
// so the spores never heap up to the pile mark and stop the place -- what is
// being weighed is tending, not hauling -- and the high-water mark of every
// plot is kept, because a plot that came ripe and was cut reads as nought if you
// only look at the end.
function watch(hands, mins) {
  window.__crew(0, 0, 0, hands);
  window.__levels({ plotLevel: 6, tendLevel: 6 });     // the whole row, briskly
  window.__clearFloor();
  const from = grown();
  const top = new Array(state().plotCount).fill(0);
  for (let i = 0; i < mins * 30; i++) {
    run(2);
    state().plots.forEach((v, k) => { if (v > top[k]) top[k] = v; });
    window.__clearFloor();
  }
  return { grew: grown() - from, top, full: state().pileFull.farm };
}

group('one farmhand keeps the whole farm, slowly', async () => {
  window.__reset();
  openSites();
  window.__kit({ growers: 0 });
  const one = watch(1, 3);
  const all = watch(7, 3);
  window.__crew(0, 0, 0);

  const ratio = one.grew / all.grew;
  const dead = one.top.filter(v => v < 0.9).length;

  return [
    // Every furrow came in at least once in the three minutes, with one body
    // walking the row. Before the split this read [1, 0, 0, 0, 0, 0, 0] on all
    // three seeds tried.
    ok(dead === 0, 'one hand brings every plot in the row on',
       one.top.map(v => v.toFixed(2)).join(' ')),
    ok(one.grew > 0 && all.grew > 0, 'and the farm is working at both headcounts',
       `${one.grew.toFixed(1)} plots against ${all.grew.toFixed(1)}`),
    ok(!one.full && !all.full, 'without the pile mark stopping either run'),
    // Seven hands are worth about seven hands. The floor is a seventh less the
    // walking a lone keeper does that a full crew does not -- observed 0.118,
    // 0.119, 0.118 across seeds 20250830, 7 and 991, against 1/7 = 0.143 -- and
    // the ceiling is there to catch a hand that has quietly been given the whole
    // row's worth of work rather than a seventh of it.
    ok(ratio > 0.06 && ratio < 0.25,
       'and one hand is a fraction of seven, not a match for them',
       `${(ratio * 100).toFixed(1)}% of the full crew`)
  ];
});

// The other half of the bargain, and the one the spread could have broken
// without anybody noticing: the plots still grow nothing on their own. Tending
// is the only thing that moves them, so a farm with the crew taken off it is a
// farm exactly as far along as it was when they left.
group('an empty farm grows nothing', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 0, 2);
  window.__levels({ plotLevel: 6, tendLevel: 6 });
  run(20);
  const some = state().plots.filter(v => v > 0).length;

  window.__crew(0, 0, 0);                    // everybody off the plots
  run(5);                                    // and away from them
  const before = state().plots.slice();
  run(60);
  const after = state().plots.slice();

  return [
    ok(some > 1, 'a crew on the farm brings more than one plot on', `${some} of 7`),
    ok(after.every((v, k) => v === before[k]),
       'and with nobody on it nothing moves at all',
       `${before.map(v => v.toFixed(2)).join(' ')} -> ${after.map(v => v.toFixed(2)).join(' ')}`)
  ];
});
