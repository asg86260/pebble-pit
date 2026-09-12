// The perf gate: two counts a frame that must not grow back.
//
// PERF.md records the busy yard going from 0.80 to 0.121 ms a frame, and
// nothing in either tier would notice it going back -- a millisecond is a fact
// about the machine as much as about the game, and on this machine, with other
// agents running, forty-millisecond frames show up on main and on a branch
// alike. So this asserts what the two big passes actually changed, which is
// *how much work* a frame does, as counts: the rule stated directly rather
// than a threshold on a noisy statistic (CLAUDE.md, "Fix the system, not the
// instance"). The counters are `globalThis.__perf`, published from inside
// grid.js and route.js so they are the live module's and not a second
// instance's; the numbers, the reasons and how to move a ceiling are in
// PERF.md section 8.
//
//   ways        how many times `ways()` was built this frame. The set of
//               surfaces a body can walk is worked out from the yard rather
//               than kept, and PERF.md section 3 item 1 is the pass that took
//               `refresh` from one build per column to one a frame. One a
//               frame is the rule.
//   grainCols   how many columns `addGrain` asked whether they had room. PERF.md
//               section 4: the endgame spike was a chip landing on a strip at
//               its ceiling and searching the whole floor for a column with
//               room -- six hundred columns of ninety rows, per grain, fifty
//               grains a frame. The fix keeps a grain inside the ground it
//               landed on, so the ceiling is the widest ground a grain may
//               settle in.
//   grains      how many grains were dropped in this frame, so the column count
//               can be read as a per-grain figure. It is here because a frame's
//               column count is a sum over however many grains came down on it,
//               and the number of grains a frame is the yard's business: a
//               driven ram lands fifty, a quiet yard lands none. The rule is
//               about the search, and the search is per grain.
//
// Two yards, three hundred frames each, each stepped one frame at a time with
// the counters zeroed between them. The verifier is off for the counted frames:
// verify.js builds one `ways()` of its own per frame to check the bodies
// against, and that build is the harness's, not the yard's.

import { group, ok, state, yard, P } from './helpers.mjs';
import { LADDER } from '../src/config.js';
import { BARRED_REACH } from '../src/grid.js';

const { S } = yard;
const FRAMES = 300;

// What a single grain is allowed to search, derived from the yard it lands in
// and not typed in. `addGrain` has two searches and each has its own bound:
//
//   - a grain on a heaped strip may spread the whole length of the strip and no
//     further (`floor.region`), so it asks at most every column of the widest
//     strip in `S.piles` -- the strips are laid out by `placeSites`, so this is
//     read off the yard rather than off a constant;
//   - a grain over barred ground (under the rock, over a mouth) walks outward
//     to `BARRED_REACH` on both sides, and asks those columns and the one it
//     landed on.
//
// The rule is the larger of the two, because either search is legitimate and
// the check cannot tell from the count which one a grain took. What it catches
// is what PERF.md section 4 describes: a search that leaves its strip and walks
// the floor, which is six hundred columns on the pit and seventeen hundred on
// the yard -- three to nine times this ceiling for a single grain.
const widestStripCols = () =>
  Math.max(0, ...(S.piles || []).map(p => Math.ceil((p.to - p.from) / P)));
const perGrainCeiling = () => Math.max(widestStripCols(), 2 * BARRED_REACH + 1);

// Three hundred frames, one at a time, and what the counters said on each.
function watch() {
  const perf = globalThis.__perf;
  const worst = { ways: 0, waysAt: -1, cols: 0, colsAt: -1, grains: 0, perGrain: 0, perGrainAt: -1 };
  const ceiling = perGrainCeiling();
  const over = [];
  for (let i = 0; i < FRAMES; i++) {
    perf.ways = 0; perf.grainCols = 0; perf.grains = 0;
    window.__fast(1 / 60);
    if (perf.ways > worst.ways) { worst.ways = perf.ways; worst.waysAt = i; }
    if (perf.grainCols > worst.cols) { worst.cols = perf.grainCols; worst.colsAt = i; worst.grains = perf.grains; }
    // The per-frame rule: every grain this frame stayed inside its ground. As a
    // product rather than a quotient so that a frame with no grains is a frame
    // with no search, and not a division by nothing.
    if (perf.grainCols > perf.grains * ceiling) over.push(`${i}:${perf.grainCols}/${perf.grains}`);
    const each = perf.grains ? perf.grainCols / perf.grains : 0;
    if (each > worst.perGrain) { worst.perGrain = each; worst.perGrainAt = i; }
  }
  return { worst, ceiling, over };
}

// The numbers are printed even when they pass: the gate is a record of where the
// two counts stand, and a green run that says nothing is a record of nothing.
const verdict = (label, { worst, ceiling, over }) => (console.log(
  `# perf-gate ${label}: ways max ${worst.ways} (frame ${worst.waysAt}); ` +
  `grainCols max ${worst.cols} over ${worst.grains} grains (frame ${worst.colsAt}), ` +
  `worst per grain ${worst.perGrain.toFixed(1)} (frame ${worst.perGrainAt}), ceiling ${ceiling}`), [
  ok(worst.ways <= 1, 'ways() is built at most once a frame',
     `built ${worst.ways} times on frame ${worst.waysAt} (max over ${FRAMES} frames)`),
  ok(over.length === 0, 'a grain never searches past the ground it landed on',
     `ceiling ${ceiling} columns a grain (widest strip ${widestStripCols()}, barred reach ${2 * BARRED_REACH + 1}); ` +
     `worst frame ${worst.colsAt}: ${worst.cols} columns over ${worst.grains} grains; ` +
     `worst per grain ${worst.perGrain.toFixed(1)} on frame ${worst.perGrainAt}; ` +
     `over on ${over.length} frame(s): ${over.slice(0, 5).join(' ')}`)
]);

// The standard busy yard, as PERF.md's header has it: fourteen bodies, every
// site open, the currencies granted, ten seconds of settling before the clock
// starts.
group('the busy yard does a frame of work a frame', async () => {
  window.__fullSites();
  window.__grant({ shards: 500, spores: 500, cores: 20, sparks: 200 });
  window.__crew(4, 4, 3, 3);
  window.__fast(10);
  window.__verify(false);
  return verdict('busy', watch());
});

// The endgame yard, as tools/node/break-perf.mjs sets it up: every machine
// standing, the ram twelve rungs up its ladder and driven, the belt the same,
// the tower up and the rift torn. The script is a script and not a module --
// its setup is its top level, followed by thirty timed seconds and a table --
// so the same hook calls are made here in the same order; if that file's yard
// changes, this one should change with it.
group('the endgame yard does a frame of work a frame', async () => {
  window.__crew(3, 6, 3, 3);
  window.__fullSites();
  window.__grant({ sparks: 999999, shards: 9999, spores: 9999, dust: 200000 });
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  for (const k of ['jaw', 'ram', 'tiller', 'belt']) window.__machine(k, { bought: true });
  const ram = S.machines.ram; ram.tune = 12; ram.driven = true;
  S.machines.belt.tune = 12;
  window.__meteor();
  window.__give(60000);
  const torn = S.riftOpen || window.__buy('rift');
  window.__fast(10);
  window.__verify(false);
  return [
    ok(torn, 'the rift is open, so this is the yard PERF.md section 4 measured', `rift ${state().rift}`),
    ...verdict('endgame', watch())
  ];
}, 20250901);
