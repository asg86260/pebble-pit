// Gatherers over a floor with scales in more than one place: each goes for
// scales nobody else is on, so several gatherers read as several bodies.
// When every one read the same best stretch they swam to it together and
// scooped it side by side, stacked into what looked like one body.

import { group, ok, yard, runUntil } from './helpers.mjs';
import { P, WORKER } from '../src/config.js';
import { deepBed } from '../src/state.js';
import { addGrain } from '../src/grid.js';
import { tossX } from '../src/deep/place.js';
import { afloat } from '../src/deep/scales.js';

const S = yard.S;
const gatherers = () => S.workers.filter(w => w.type === 'gatherer');
const lay = (x, n) => { for (let i = 0; i < n; i++) addGrain(deepBed, x, null, 3, true); };
const CREW = 4;

group('gatherers spread over the scales rather than stacking on one heap', async () => {
  // The snatch's facts with no station: played, it stands the first one,
  // and one of the hands down there would be its fighter.
  window.__crew(0, 4);
  window.__deepCrew({ spare: CREW });
  // Three patches out along the floor from the crusher's side.
  const at = [P * 40, P * 150, P * 280].map(d => tossX() + d);
  for (const x of at) lay(x, 60);
  const laid = deepBed.n;
  const arms = () => gatherers().reduce((n, g) => n + (g.carry || 0), 0);
  // Frames where two bodies picking up scales have the same stretch, and the
  // longest run of frames two moving bodies spent within a body's width.
  let shared = 0, picking = 0, longest = 0, pair = '';
  const run = new Map();
  const was = new Map();
  for (let f = 0; f < 60 * 90 && (deepBed.n || afloat() || arms()); f++) {
    yard.fast(1 / 60);
    const gs = gatherers();
    const moving = gs.filter(g => {
      const p = was.get(g);
      was.set(g, { x: g.x, y: g.y });
      return p && (p.x !== g.x || p.y !== g.y) && g.goal !== 'rest';
    });
    const seeking = gs.filter(g => (g.goal === 'go' || g.goal === 'scoop') && g.col >= 0);
    if (seeking.length >= 2) {
      picking++;
      for (let i = 0; i < seeking.length; i++)
        for (let j = i + 1; j < seeking.length; j++)
          if (Math.abs(seeking[i].col - seeking[j].col) * P < WORKER) { shared++; i = seeking.length; break; }
    }
    for (let i = 0; i < gs.length; i++)
      for (let j = i + 1; j < gs.length; j++) {
        const a = gs[i], b = gs[j], k = `${i}-${j}`;
        const close = moving.includes(a) && moving.includes(b) &&
                      Math.abs(a.x - b.x) < WORKER && Math.abs(a.y - b.y) < WORKER;
        const n = close ? (run.get(k) || 0) + 1 : 0;
        run.set(k, n);
        if (n > longest) { longest = n; pair = `${k} at ${Math.round(a.x)},${Math.round(a.y)} ${a.goal}/${b.goal} f${f}`; }
      }
  }
  runUntil(() => deepBed.n === 0 && afloat() === 0 && arms() === 0, 300);
  return [
    ok(gatherers().length === CREW, `${CREW} gatherers down there`, `${gatherers().length}`),
    ok(picking > 0 && shared / picking < 0.05, 'they head for different scales',
       `${shared} of ${picking} frames with two on one stretch`),
    ok(longest < 60, 'no two move about within a body\'s width of each other for long',
       `${(longest / 60).toFixed(1)}s, ${pair}`),
    ok(deepBed.n === 0 && S.scales === laid, 'and every scale reaches the crusher',
       `${S.scales} of ${laid}, ${deepBed.n} lying`)
  ];
});

// One heap and a crew for it: they split along it, a reach apart, or wait
// their turn by the crusher -- never two scooping in one place.
group('one heap is shared along its length, not scooped by bodies stood in one place', async () => {
  // The snatch's facts with no station: played, it stands the first one,
  // and one of the hands down there would be its fighter.
  window.__crew(0, 4);
  window.__deepCrew({ spare: CREW });
  lay(tossX() + P * 60, 120);
  const laid = deepBed.n;
  const arms = () => gatherers().reduce((n, g) => n + (g.carry || 0), 0);
  let stacked = 0, scooping = 0;
  for (let f = 0; f < 60 * 120 && (deepBed.n || afloat() || arms()); f++) {
    yard.fast(1 / 60);
    const at = gatherers().filter(g => g.goal === 'scoop');
    if (at.length >= 2) scooping++;
    for (let i = 0; i < at.length; i++)
      for (let j = i + 1; j < at.length; j++)
        if (Math.abs(at[i].x - at[j].x) < WORKER) stacked++;
  }
  runUntil(() => deepBed.n === 0 && afloat() === 0 && arms() === 0, 300);
  return [
    ok(scooping > 0, 'more than one works the heap at once', `${scooping} frames`),
    ok(stacked === 0, 'and no two scoop within a body\'s width of each other', `${stacked} frames`),
    ok(deepBed.n === 0 && S.scales === laid, 'and every scale reaches the crusher',
       `${S.scales} of ${laid}, ${deepBed.n} lying`)
  ];
});
