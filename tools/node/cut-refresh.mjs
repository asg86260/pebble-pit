// A refresh mid-dig, the way the page does it: one process runs the yard and
// writes the save; a second, fresh one -- new modules, new clock -- loads it and
// says whether the digging goes on.
//   node tools/node/cut-refresh.mjs save [seconds] [quarriers] [pace rung]  > writes the save
//   node tools/node/cut-refresh.mjs load                                     > loads it, runs a minute
import { readFileSync, writeFileSync } from 'node:fs';
import { newYard } from './yard.mjs';
const yard = await newYard();
const S = yard.S;
const file = new URL('../../shots/cut-refresh.json', import.meta.url);
const who = () => S.workers.filter(w => w.type === 'quarrier')
  .map(w => `${w.goal}@${Math.round(w.x)},${Math.round(w.y)} cell=${w.cell} route=${w.route ? 'y' : '-'} rest=${!!w.resting}`);
if (process.argv[2] === 'load') {
  localStorage.setItem('boulder-clicker/v4', readFileSync(file, 'utf8'));
  yard.restore();
  console.log('loaded    ', S.quarryTotal, S.quarryOpen, who());
  for (let i = 1; i <= 6; i++) { window.__fast(10); console.log(`+${i * 10}s`, S.quarryTotal, who()); }
} else {
  const secs = +process.argv[3] || 40, n = +process.argv[4] || 3, lvl = +process.argv[5] || 0;
  window.__seed(20250830); window.__crew(0, 0, n, 0); window.__fullSites(); window.__tip(90000);
  if (lvl) window.__levels({ quarryPaceLevel: lvl });
  window.__fast(secs);
  console.log('before save', S.quarryTotal, who());
  yard.persist();
  writeFileSync(file, localStorage.getItem('boulder-clicker/v4'));
}
