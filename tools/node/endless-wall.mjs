// The endless serpent's wall, played (DESIGN.md, "Endless serpent"): a party
// stood at fixed rungs in the node yard against the constrict, the only
// defense past the story, with its bar made too deep to empty, and every
// window's deepest wound written down. Past level 1 the level grows the bar
// and nothing else -- the orb and the stun read the level-1 depth, the
// constrict resists nothing -- so what a party does in a window is the same
// at every level, and one run gives the whole curve: a level whose depth no
// window reached in the run is the wall, and nearer it the share of windows
// that would have emptied the bar is the wait for a level.
//
//   node tools/node/endless-wall.mjs                                   # four at rung 8, the default party
//   node tools/node/endless-wall.mjs --party altar:brawler,armory:ranger,spire:mage,circle:sapper --rung 6
//   node tools/node/endless-wall.mjs --min 20 --dcps 2 --orb lift      # the window, the hand, the orb's answer
//   node tools/node/endless-wall.mjs --json                            # one line, for a script to gather
//
// Unlike deep-pace.mjs this is the real fight: the classes' own moves, the
// stuns and Held stopping the window's clock, Exposed, Inspired, the bleeds,
// the lash-free constrict's orb taking the strongest fighter, the meals'
// real waits. What it leaves out: the scales and rungs (the rungs are set),
// the fangs, and the recoil (3.31 s a level, added to the wait).

import { newYard } from './yard.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PARTY = arg('party', 'altar:brawler,armory:ranger,spire:mage,circle:sapper').split(',').map(s => s.split(':'));
const RUNG = +arg('rung', 8);
const MIN = +arg('min', 20);                 // game minutes of windows
const DCPS = +arg('dcps', 2);                // the hand's punches a second, on the belly
const ORB = arg('orb', 'lift');              // lift: the fighter picked out a second in; none: waited out
const FAR = 120;                             // a level whose bar no party empties

const yard = await newYard();
const g = globalThis;
const { S } = yard;
const { SERPENT_PHASES } = await import('../../src/config.js');
const { depthAt } = await import('../../src/deep/depth.js');
const { clickDeep } = await import('../../src/deep/serpent.js');
const { orbOn, recoilLen } = await import('../../src/deep/phases.js');
const { has } = await import('../../src/deep/statuses.js');
const { bellyAt } = await import('../../src/deep/place.js');
const { now } = await import('../../src/clock.js');
const { lift, drop } = await import('../../src/crew/pointer.js');
const LAST = SERPENT_PHASES - 1;

g.__snatch({ played: true });
g.__party({ stations: PARTY.map(([kind, cls]) => ({ kind, cls, rung: RUNG })) });
g.__serpent({ level: FAR });

// A window is a meal to the next: the wound second by second, so a level's
// wait is the time to the first second it is reached, not a whole window.
const windows = [];
let trace = [], mealWas = S.meal, from = now(), liftAt = null, still0 = 0, held = 0, secs = 0;
const per = Math.max(1, DCPS);
for (let t = 0; t < 30 + MIN * 60; t++) {
  if (t === 30) still0 = S.serpentStill || 0;
  for (let i = 0; i < per; i++) {
    if (DCPS > 0 && !orbOn()) { const p = bellyAt(now()); clickDeep(p.x, p.y); }
    yard.fast(1 / per);
  }
  const o = orbOn();
  if (o && ORB === 'lift' && o.at !== liftAt && now() - o.at > 1000) {
    const w = S.workers.find(x => x.station === o.st);
    if (w) { lift(w); yard.fast(1 / 60); drop(w); liftAt = o.at; }
  }
  trace.push(S.serpentWound);
  if (t >= 30) { secs++; if (has('held')) held++; }
  if (S.meal !== mealWas) {
    // the first 30 s are the party settling at its posts; the second the meal
    // landed is not the window's
    const w = trace.slice(0, -1);
    if (t >= 30) windows.push({ peak: Math.max(0, ...w), s: (now() - from) / 1000, trace: w });
    mealWas = S.meal; trace = []; from = now();
  }
}

const n = windows.length;
const best = Math.max(0, ...windows.map(w => w.peak));
const meanS = windows.reduce((a, w) => a + w.s, 0) / Math.max(1, n);
const recoilS = recoilLen();
// From each window's start, on average: the whole windows that fall short,
// then the seconds into the first that reaches `d`, then the recoil. The run
// wraps round, so every start has an answer when any window reaches it.
const waitFor = d => {
  const reach = windows.map(w => { const i = w.trace.findIndex(x => x >= d); return i < 0 ? null : i + 1; });
  let sum = 0;
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < n; k++) {
      const j = (i + k) % n;
      if (reach[j] != null) { sum += reach[j]; break; }
      sum += windows[j].s;
    }
  }
  return (sum / n + recoilS) / 60;
};
const levels = [];
let wall = 1;
for (let l = 2; l < FAR; l++) {
  const d = depthAt(LAST, l), hit = windows.filter(w => w.peak >= d).length;
  if (!hit) break;
  wall = l;
  levels.push({ level: l, depth: d, share: hit / n, min: waitFor(d) });
}
const stunned = ((S.serpentStill || 0) - still0) / 1000 / Math.max(1, secs);
const out = { party: PARTY.map(p => p[1]).join('+'), stations: PARTY.length, rung: RUNG, windows: n,
              meanWindowS: +meanS.toFixed(1), stunned: +stunned.toFixed(2), held: +(held / Math.max(1, secs)).toFixed(2),
              best: Math.round(best), median: Math.round(windows.map(w => w.peak).sort((a, b) => a - b)[n >> 1] || 0),
              // the last level any window reached: that bar empties, the next stalls
              reached: wall, stallsAt: wall + 1,
              nearWall: levels.slice(-3).map(x => ({ level: x.level, min: +x.min.toFixed(1) })),
              toWallMin: +levels.reduce((a, x) => a + x.min, 0).toFixed(0) };
if (process.argv.includes('--json')) console.log(JSON.stringify(out));
else {
  console.log(`${out.party} at rung ${RUNG}: ${n} windows of ${out.meanWindowS} s, stunned ${out.stunned}, held ${out.held} of the time; deepest ${out.best}, median ${out.median}`);
  for (const x of levels) console.log(`level ${String(x.level).padStart(3)}  depth ${String(x.depth).padStart(8)}  ${(x.share * 100).toFixed(0).padStart(3)}% of windows  ${x.min.toFixed(1).padStart(6)} min a level`);
  console.log(`stalls at level ${out.stallsAt}; levels 2..${wall} in ${out.toWallMin} game minutes`);
}
