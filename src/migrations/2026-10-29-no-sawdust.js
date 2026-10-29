// Act 3 has no sawdust since 2026-10-29: a log saws into four timber blocks,
// one a column of the cut, and nothing falls under the blade. A save from
// before keeps the heap's grains (`after.heap`), the saw's grains in the air
// (`saw.dust`, `saw.grains`), the heap's tip clock (`tipAt`, `brimAt`), a
// sawyer off tipping it (`tipping`, the idle errand `sweeper`), and the bigger
// heap row bought (`ups['after-heap']`); all of it goes, the grains with it:
// there is nothing left to spend them on.
//
// The kind itself left the table of units, and its four cell values with it:
// the one kind after it, a construction site's load, moves down four. Cells
// are saved as bytes, so the ground's cells and every load a body carries are
// brought along here -- a sawdust cell is empty, a load is its new value. The
// table of that day, spelled out: the log, plank and sign four tones each, so
// sawdust began at `KINDS.log.first + 12` and the load at `+ 16`.
import { KINDS } from '../config.js';

const obj = v => v && typeof v === 'object' && !Array.isArray(v);
const DUST0 = KINDS.log.first + 12, LOAD0 = DUST0 + 4;
const remap = v => (v >= LOAD0 ? v - 4 : v >= DUST0 ? 0 : v);

// A run-length string of cells (after/ground.js, `runsOf`), each value mapped.
function runs(str) {
  if (typeof str !== 'string' || !str) return str;
  const out = [];
  for (const part of str.split('.')) {
    const x = part.indexOf('x');
    if (x < 0) return str;
    const v = remap(+part.slice(0, x)), len = part.slice(x + 1), last = out[out.length - 1];
    if (last && last[0] === v) last[1] = String(+last[1] + +len); else out.push([v, len]);
  }
  return out.map(([v, len]) => v + 'x' + len).join('.');
}

export default {
  since: '2026-10-29',
  v: 34,
  says: 'act 3 has no sawdust: a save\'s heap, grains and tip clocks go, and the units after it in the table move down four',
  apply(s) {
    const a = s.after;
    if (!obj(a)) return;
    delete a.heap; delete a.tipAt; delete a.brimAt;
    if (obj(a.stock)) delete a.stock.sawdust;
    if (obj(a.ups)) delete a.ups['after-heap'];
    if (obj(a.saw)) { delete a.saw.dust; delete a.saw.grains; }
    if (obj(a.ground)) a.ground.cells = runs(a.ground.cells);
    if (Array.isArray(a.lay)) a.lay = a.lay.filter(q => !(obj(q) && (q.what === 'sawdust' || q.kind === 'sawdust')));
    if (Array.isArray(a.bodies)) {
      for (const b of a.bodies) {
        if (!obj(b)) continue;
        delete b.tipping;
        if (b.errand === 'sweeper') { b.errand = null; b.target = null; b.t = 0; }
        if (Array.isArray(b.load)) { b.load = b.load.map(remap).filter(v => v > 0); b.carry = b.load.length; }
      }
    }
  }
};
