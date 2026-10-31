// Act 3 has no sawdust (src/migrations/2026-10-29-no-sawdust.js): a save from
// before loses its heap, grains and tip clocks, and the units after the
// sawdust in the table move down four, so the ground's cells and a builder's
// carried load are brought along. Read back, the act stands whole.
//
// The ground's cells are read where this migration leaves them, at SAVE_V 34:
// the grove's migration after it (2026-10-30-grove.js) turns every unit on
// the ground into the reader's lay list and leaves no ground, so the cells
// are its question past there -- and the units it lays are this one's units.
import { group, ok, yard, storeChecks } from './helpers.mjs';
import { migrate, MIGRATIONS } from '../src/migrations/index.js';
import { blankAfter } from '../src/after/index.js';
import { KINDS } from '../src/config.js';
import { cellsOfRuns } from '../src/after/ground.js';
storeChecks();

const KEY = 'boulder-clicker/v4';
const S = yard.S;
const DUST0 = KINDS.log.first + 12, LOAD0 = DUST0 + 4;

group('a save with sawdust is brought to a yard without it: the heap is gone and a load keeps its cell', async () => {
  window.__reset(true);
  yard.persist();
  const s = JSON.parse(localStorage.getItem(KEY));
  s.saveV = 33;
  s.after = { ...JSON.parse(JSON.stringify(blankAfter())), heap: '5x3', tipAt: 4, brimAt: 9,
    ups: { 'after-heap': 1, 'after-blade': 1 }, saw: { dust: [{ a: 0 }], grains: 7, out: [], n: 0 },
    ground: { cols: 4, rows: 1, cells: `${DUST0}x1.${LOAD0}x1.${KINDS.log.first}x2`, blocks: [0, 1, 2], tags: [] },
    bodies: [{ id: 1, state: 'work', tipping: true, errand: 'sweeper', load: [LOAD0], carry: 1 }] };
  for (const m of MIGRATIONS) if (m.v === 34) m.apply(s);
  const cells = cellsOfRuns(s.after.ground.cells, 4);
  s.saveV = 34;
  migrate(s);
  const laid = (s.after.lay || []).filter(u => u.kind).map(u => u.kind).sort();
  localStorage.setItem(KEY, JSON.stringify(s));
  yard.restore();
  const a = S.after;
  return [
    ok(!('heap' in s.after) && !('tipAt' in s.after) && !('brimAt' in s.after) && !('after-heap' in s.after.ups) && s.after.ups['after-blade'] === 1,
       'the heap, its clocks and its row are gone, the rest of the ups kept', JSON.stringify(s.after.ups)),
    ok(!('dust' in s.after.saw) && !('grains' in s.after.saw), 'the saw keeps no grains'),
    ok(cells[0] === 0 && cells[1] === KINDS.load.first && cells[2] === KINDS.log.first, 'a sawdust cell is empty and the load keeps its unit', [...cells].join(' ')),
    ok(JSON.stringify(laid) === JSON.stringify(['load', 'log']), 'and the grove lays the load and the log again, nothing for the sawdust', JSON.stringify(laid)),
    ok(s.after.bodies[0].load[0] === KINDS.load.first && s.after.bodies[0].errand == null && !('tipping' in s.after.bodies[0]), 'a carried load keeps its unit and a sweeper is idle', JSON.stringify(s.after.bodies[0])),
    ok(!!a, 'and the yard reads back whole', String(!!a))
  ];
});
