// TEMP probe -- not committed
import { newYard } from './yard.mjs';
const yard = await newYard();
const { S, cut } = await import('../../src/state.js');
const grid = await import('../../src/grid.js');
const run = s => yard.fast(s);
window.__seed(20250830); window.__verify(true);
window.__crew(0, 0, 1, 1); window.__crew(0, 0); window.__shack(); window.__levels({ benchLevel: 0, plotLevel: 0 });
window.__digCut(999); run(0.2);
const mouthX = () => yard.state().quarryX + yard.state().quarryW / 2;
window.__pileCut(mouthX(), 15); run(0.3);
const line = t => console.log(t, S.tick, 'cut.n', cut.n, 'cells', grid.countDust ? grid.countDust(cut) : '?', 'count', grid.count(cut), 'quarryOpen', S.quarryOpen);
line('before');
// no reload
try { run(1.5); line('+1.5s'); } catch (e) { console.log('THREW', e.message); }
window.__seed(20250830); line('reseeded');
try { run(1.5); line('+1.5s'); } catch (e) { console.log('THREW', e.message); }
