// A gang on the floor of the cut told `to` -- the word a fresh hire carries --
// frame by frame: does it work where it stands, or go round by the rim?
import { newYard } from './yard.mjs';
const yard = await newYard(); const S = yard.S;
window.__seed(20250830); window.__crew(0, 0, 2, 0); window.__fullSites(); window.__tip(90000);
const q = () => S.workers.filter(w => w.type === 'quarrier');
yard.until(() => q().every(w => w.goal === 'work'), 120);
for (const w of q()) { w.goal = 'to'; w.route = null; w.cell = null; }
for (let f = 0; f < 90; f++) {
  window.__fast(1 / 60);
  if (f % 6 === 0) console.log(f, q().map(w => `${w.goal}@${Math.round(w.x)},${Math.round(w.y + 18)} g${S.groundY} r=${w.route ? w.route.map(l => l.along ? l.along.key + '>' + Math.round(l.to) : 'climb').join(',') : '-'}`).join(' | '));
}
