// Load the player's rim-refresh fixture and say where the cut lands versus the
// quarriers, then run a few seconds and watch them settle (or not). Ground the
// save does not carry is overlaid from a generated yard, the way stuck-yard's
// fixture does.
import { readFileSync } from 'node:fs';
import { newYard } from './yard.mjs';
const yard = await newYard(); const S = yard.S;
const { quarry } = await import('../../src/state.js');
const q = await import('../../src/quarry.js');
// A generated yard at the same size, for the ground blobs the trimmed save lacks.
window.__seed(20250830); window.__crew(3, 6, 5, 3); window.__fullSites(); window.__tip(90000); window.__fast(2);
yard.persist();
const ground = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
const save = JSON.parse(readFileSync(new URL('../../test/fixtures/quarry-rim-refresh.json', import.meta.url), 'utf8'));
for (const k of ['boulder', 'gw', 'gh', 'floor', 'pit', 'cut', 'muck', 'poop', 'rockSand', 'meteorCells', 'noticeboard'])
  if (k in ground) save[k] = ground[k];
localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
yard.restore();
const one = () => { const w = S.workers.find(o => o.type === 'quarrier' && o.name === 'mo'); return w
  ? `mo:${w.goal}${w.walking?'/walk':''} x=${Math.round(w.x)} seat=${w.seat==null?'-':Math.round(w.seat)} leg=${w.leg||'-'} lent=${w.lentFrom||'-'} route=${w.route?w.route.map(l=>(l.along?l.along.key:'climb')+'>'+Math.round(l.to)).join(','):'-'}`
  : '(mo gone)'; };
console.log('cut spans', Math.round(quarry.x), '..', Math.round(quarry.x + quarry.w), 'face', Math.round(q.quarryFace()), 'band', JSON.stringify(q.quarryBand ? q.quarryBand() : '?'));
console.log('0.0s', one());
for (let i = 1; i <= 20; i++) { window.__fast(0.25); console.log(`${(i*0.25).toFixed(2)}s`, one()); }
console.log('dug', (S.quarryCells || []).reduce((a, b) => a + b, 0), 'of', S.quarryCells.length * 31);
