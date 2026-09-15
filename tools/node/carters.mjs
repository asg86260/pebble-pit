// How well the carters keep up, scenario by scenario.
//
//   node tools/node/carters.mjs [seconds] [--crew N] [--hands L] [--pace L] [--only name,name]
//
// A driven yard: nothing mines, nothing digs, nothing grows. Each scenario
// feeds the strips itself -- dust onto the rock's, the quarry's and the farm's
// heap at a rate each, finds onto the ground of each site at a rate each --
// from a starting heap of a chosen size, and a crew of carters is let loose on
// it for a fixed stretch of game time. What is printed is one row a scenario:
// what went down, what was banked, how much of the time each heap sat full
// (which is what stops the station behind it), how long a find lay before
// somebody came for it, how the trips were shared out over the grounds, and
// what the crew were doing with their time.
//
// Read the per-resource columns, not the total. The rule is chosen for how
// it reads from the yard -- bodies spread over every pile, every load full --
// and each pile's own rate is the measure of that; the total banked rewards
// a crew stood on the one heap beside the hole (DESIGN.md, "Farthest from
// the rest of the crew").
//
// The point is comparing rules, not passing: run it on main and on a branch
// and read the two tables side by side. The sim is seeded, so the same
// scenario is the same yard both times. `YARD=file:///.../yard.mjs` measures
// another checkout's game with this same script.
const { newYard } = await import(process.env.YARD || './yard.mjs');
// After the yard: it installs the page the modules expect before they load.
const { P, SHARD_CELL, SPORE_CELL, SPARK_CELL, someFind, PILE_LIMIT } = await import('../../src/config.js');
const { spawnChip } = await import('../../src/dust.js');
const { rand } = await import('../../src/rng.js');

const args = process.argv.slice(2);
const flag = (name, d) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : d; };
const seconds = +(args.find(a => /^\d+$/.test(a)) || 90);
const crew = +flag('--crew', 4);
const hands = +flag('--hands', 4);
const pace = +flag('--pace', 4);
const only = flag('--only', null)?.split(',');

// Feed rates are grains a second onto a strip and finds a minute onto a
// ground; `start` is how full each heap is when the crew arrive, as a share of
// its limit. The strips are the rock's, the quarry's and the farm's; the finds
// are shards by the quarry, spores by the plots, sparks under the star.
const SCENARIOS = [
  { name: 'heaps-full',  rock: 0,  quarry: 0, farm: 0,   shards: 0, spores: 0, sparks: 0, start: { rock: 1, quarry: 1, farm: 1 } },
  { name: 'trickle',     rock: 2,  quarry: 1, farm: 0.5, shards: 3, spores: 3, sparks: 2, start: { rock: 0, quarry: 0, farm: 0 } },
  { name: 'rock-heavy',  rock: 10, quarry: 1, farm: 0.5, shards: 3, spores: 3, sparks: 2, start: { rock: 0.5, quarry: 0, farm: 0 } },
  { name: 'ram',         rock: 30, quarry: 1, farm: 1,   shards: 4, spores: 4, sparks: 3, start: { rock: 1, quarry: 0, farm: 0 } },
  { name: 'quarry-jam',  rock: 6,  quarry: 5, farm: 1,   shards: 6, spores: 2, sparks: 1, start: { rock: 0.5, quarry: 1, farm: 0 } },
  { name: 'finds-only',  rock: 0,  quarry: 0, farm: 0,   shards: 10, spores: 10, sparks: 10, start: { rock: 0, quarry: 0, farm: 0 } },
];

const yard = await newYard();
const { S } = yard;
const state = () => yard.state();

// One scenario, from a fresh seeded game, and its row of numbers.
// which ground a claimed column is on: a strip's key, or the open ground
const groundKey = c => {
  const x = yard.floor.x + c * P;
  return S.piles.find(p => x + P > p.from && x < p.to)?.key || 'yard';
};
function measure(sc) {
  window.__seed(20250913);
  window.__reset();
  window.__fullSites();
  window.__meteor();                                 // the star stands, so sparks have a ground
  window.__crew(0, crew, 0, 0);
  window.__levels({ haulCarryLevel: hands, haulPaceLevel: pace });
  window.__clearFloor();
  window.__fast(0.5);

  const s0 = state();
  const strip = key => s0.piles.find(p => p.key === key);
  const within = key => { const p = strip(key); return p.from + P * 2 + rand() * (p.to - p.from - P * 4); };
  const FIND = { shards: ['quarry', SHARD_CELL], spores: ['farm', SPORE_CELL], sparks: ['sky', SPARK_CELL] };

  // the starting heaps
  for (const key of ['rock', 'quarry', 'farm']) {
    const want = Math.round((sc.start[key] || 0) * (PILE_LIMIT[key] || 0));
    // a frame between handfuls: the count is tallied once a frame, so a loop
    // that never stepped one piled twenty thousand grains before it noticed
    for (let i = 0; i < 400 && state().pileCount[key] < want; i++) { window.__pile(within(key), 10); window.__fast(1 / 60); }
  }
  window.__fast(1);                                  // and let them settle

  const before = state();
  const dropped = { rock: 0, quarry: 0, farm: 0, shards: 0, spores: 0, sparks: 0 };
  const acc = { rock: 0, quarry: 0, farm: 0, shards: 0, spores: 0, sparks: 0 };
  const full = { rock: 0, quarry: 0, farm: 0 };
  let lying = 0, idle = 0, bodies = 0, trips = 0, load = 0;
  const carry = new Map();
  // trips a ground: a body's claim landing on a ground it was not claiming on
  const went = {};
  const wasOn = new Map();

  const frames = seconds * 60;
  for (let i = 0; i < frames; i++) {
    // feed: a rate a second, dropped one grain at a time as the fraction rolls over
    for (const key of ['rock', 'quarry', 'farm']) {
      acc[key] += sc[key] / 60;
      // counted only if it landed: a full strip refuses a grain, and a refused
      // grain is not one the crew failed to clear
      while (acc[key] >= 1) { acc[key] -= 1; const n = yard.floor.n; window.__pile(within(key), 1); if (yard.floor.n > n) dropped[key]++; }
    }
    for (const [kind, [ground, cell]] of Object.entries(FIND)) {
      if (!strip(ground)) continue;
      acc[kind] += sc[kind] / 3600;
      while (acc[kind] >= 1) {
        acc[kind] -= 1;
        spawnChip(within(ground), S.groundY - 60, 0, 0, someFind(cell));
        dropped[kind]++;
      }
    }
    window.__fast(1 / 60);

    const s = state();
    for (const key of ['rock', 'quarry', 'farm']) if (s.pileFull[key]) full[key]++;
    lying += s.finds.length;
    for (const row of s.crewDetail) {
      const [type, goal] = row.split('|');
      if (type !== 'h') continue;
      bodies++;
      if (goal === 'idle' || goal === 'home') idle++;
    }
    // trips: a body's carry dropping to nothing is a tip
    S.workers.forEach((w, k) => {
      if (w.type !== 'hauler') return;
      const was = carry.get(k) || 0;
      if (was > 0 && !w.carry) { trips++; load += was; }
      const on = w.claim >= 0 ? groundKey(w.claim) : null;
      if (on && on !== wasOn.get(k)) went[on] = (went[on] || 0) + 1;
      wasOn.set(k, on);
      carry.set(k, w.carry || 0);
    });
  }
  const after = state();
  const mins = seconds / 60;
  const pct = n => `${Math.round(100 * n / frames)}%`;
  const cleared = key => dropped[key] + (before.pileCount[key] || 0) - (after.pileCount[key] || 0);
  const got = { shards: after.shards - before.shards, spores: after.spores - before.spores, sparks: after.sparks - before.sparks };
  const finds = dropped.shards + dropped.spores + dropped.sparks;
  const fetched = got.shards + got.spores + got.sparks;
  // Little's law: mean grains lying × time ÷ throughput is the mean wait
  const wait = fetched ? (lying / frames) * seconds / fetched : NaN;
  return {
    scenario: sc.name,
    'banked/min': ((after.stored - before.stored) / mins).toFixed(0),
    'rock in/clr/full': `${(dropped.rock / mins).toFixed(0)}/${(cleared('rock') / mins).toFixed(0)} ${pct(full.rock)}`,
    'quarry in/clr/full': `${(dropped.quarry / mins).toFixed(0)}/${(cleared('quarry') / mins).toFixed(0)} ${pct(full.quarry)}`,
    'farm in/clr/full': `${(dropped.farm / mins).toFixed(0)}/${(cleared('farm') / mins).toFixed(0)} ${pct(full.farm)}`,
    'finds got/dropped': `${fetched}/${finds}`,
    'shd/spo/spk': `${got.shards}/${got.spores}/${got.sparks}`,
    'find wait s': isFinite(wait) ? wait.toFixed(0) : '-',
    'left': after.finds.length,
    'trips': trips,
    'trips/ground': Object.entries(went).map(([g, n]) => `${g[0]}${n}`).join(' '),
    'load': trips ? (load / trips).toFixed(1) : '-',
    'idle': pct(idle / Math.max(1, bodies / frames))
  };
}

const rows = [];
for (const sc of SCENARIOS) {
  if (only && !only.includes(sc.name)) continue;
  const t0 = performance.now();
  rows.push(measure(sc));
  process.stderr.write(`${sc.name}: ${((performance.now() - t0) / 1000).toFixed(0)}s\n`);
}
console.log(`carters: ${crew} bodies, hands L${hands}, pace L${pace}, ${seconds}s of game each`);
console.table(rows);
process.exit(0);
