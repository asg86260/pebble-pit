// The cut, half a second at a time: the depth profile and what every quarrier
// is doing -- its leg, the column it stands over, the cell it has picked, the
// run it has planned, and how long until its next swing. For chasing a stretch
// of the face nobody works, or a body that works one column into a slot.
//   node tools/node/cut-trace.mjs [seconds] [quarriers] [pace rung] [seed] [from second]
// DT=0.05 for a line a frame; DUMP=<n> prints every field the n-th quarrier
// carries at the end. The flags after a body: R on a route, B on a build,
// K wanting kit, T trained, H holding.
import { newYard } from './yard.mjs';
const yard = await newYard();
const S = yard.S;
const q = await import('../../src/quarry.js');
const smog = await import('../../src/smog.js');
const secs = +process.argv[2] || 60, n = +process.argv[3] || 5, lvl = +process.argv[4] || 0;
const seed = +process.argv[5] || 20250830, from = +process.argv[6] || 0;
window.__seed(seed); window.__crew(0, 0, n, 0); window.__fullSites(); window.__tip(90000);
if (lvl) window.__levels({ quarryPaceLevel: lvl });
const col = w => q.colOfX(w.x + 6);
const who = () => S.workers.filter(w => w.type === 'quarrier').map(w =>
  `${w.goal}${w.resting ? '~' : ''}@${col(w)} cell=${w.cell} run=${(w.run || []).join('/')} in=${Math.round((w.next || 0) - yard.clock.now())}${w.route ? ' R' : ''}${w.onBuild ? ' B' : ''}${w.wanting ? ' K' : ''}${w.trained ? ' T' : ''}${w.holding ? ' H' : ''}`).join(' | ') + ' muck=' + smog.quarryMuck();
const dt = +(process.env.DT || 0.5);
for (let t = 0; t < secs; t += dt) {
  window.__fast(dt);
  if (t < from) continue;
  const cells = q.quarryCells();
  console.log(t.toFixed(2).padStart(6), cells.map(c => c.toString(36)).join(''), '|', who());
}
if (process.env.DUMP) { const w = S.workers.filter(w => w.type === 'quarrier')[+process.env.DUMP]; console.log(JSON.stringify(Object.fromEntries(Object.entries(w).filter(([k, v]) => v != null && v !== false && v !== 0 && k !== 'run')))); }
console.log('target', q.quarryCells().map((_, c) => q.quarryTarget(c).toString(36)).join(''));
