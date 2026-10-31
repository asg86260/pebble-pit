// A save from before the grove's rebuild (SAVE_V 34; DESIGN.md, "Act 3's
// grove, rebuilt", "Saves and migration"), kept as it was written by the
// game that day (test/fixtures/act3-grove-v34.json): a tree felled by hand
// with two of its logs still lying, a tree mid-growth, a stump with a root
// dug, a grown tree with the woodcutter mid-chop at it, logs on the forestry
// shack's pile and timber on the mound, the axe bought and handed over and
// bigger trees bought. Read today, every unit comes back on its strip or
// near where it lay, the growth carries over, the stumps stand, bigger trees
// is self-seeding's first rung, the saw is bought where the axe was, the
// basket starts full, and no key, field or beat is named after the axe.
import { readFileSync } from 'node:fs';
import { group, ok, run, yard } from './helpers.mjs';
import { goodsRead } from '../src/after/piles.js';
import { units, lying } from '../src/after/ground.js';
import { plotSpan } from '../src/after/place.js';
import { blockProblems } from '../src/grid.js';
import { afterGround } from '../src/state.js';
import { SAVE_V } from '../src/config.js';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const raw = () => JSON.parse(readFileSync(new URL('./fixtures/act3-grove-v34.json', import.meta.url), 'utf8'));
// The units a v34 save holds, by kind: its ground's blocks.
function before(r) {
  const g = r.after.ground, n = {};
  const cells = [];
  let i = 0;
  for (const part of g.cells.split('.')) { const x = part.indexOf('x'), v = +part.slice(0, x), len = +part.slice(x + 1); for (let k = 0; k < len; k++) cells[i++] = v; }
  for (const ai of g.blocks) n[cells[ai]] = (n[cells[ai]] || 0) + 1;
  return n;
}
const byValue = () => { const n = {}; for (const u of units()) n[u.v] = (n[u.v] || 0) + 1; return n; };
const named = blob => /"[^"]*\baxe|axe"/i.test(JSON.stringify({ after: blob.after, beatsDone: blob.beatsDone }));

group('a save from before the grove\'s rebuild comes back on the new layout, every unit kept and nothing named after the axe', async () => {
  const r = raw(), was = before(r);
  localStorage.setItem(KEY, JSON.stringify(r));
  yard.restore();
  const a = S.after, plots = a.plots.map(p => ({ ...p }));
  const now = byValue(), stock = goodsRead();
  const acorns = now[Object.keys(now).find(v => units().find(u => u.v === +v)?.kind === 'acorn')] || 0;
  delete now[Object.keys(now).find(v => units().find(u => u.v === +v)?.kind === 'acorn')];
  const loose = lying().filter(q => q.kind === 'log');
  const inGrove = loose.every(q => plots.some((p, i) => { const [x0, x1] = plotSpan(i); return q.x >= x0 && q.x + q.w <= x1; }));
  run(1);
  yard.persist();
  const blob = JSON.parse(localStorage.getItem(KEY));
  const cutter = a.bodies.find(b => b.job === 'woodcutter');
  return [
    ok(r.saveV === 34 && r.after.axe && r.after.ups['after-tree'] && r.after.plots[1].stage === 2 && r.after.plots[2].stump && r.after.ground.blocks.length > 0,
       'the fixture is a v34 save: the axe in hand, bigger trees bought, a tree mid-growth, a stump, units on the ground', `v${r.saveV}`),
    ok(JSON.stringify(now) === JSON.stringify(was), 'every unit of every kind and tone is still there', `${JSON.stringify(was)} -> ${JSON.stringify(now)}`),
    ok(stock.grovelogs === r.after.ground.blocks.filter(ai => ai % r.after.ground.cols >= 179 && ai % r.after.ground.cols < 199).length && stock.timber > 0,
       'the units that lay on a pile lie on that pile', JSON.stringify(stock)),
    ok(loose.length === 2 && inGrove, 'the felled tree\'s loose logs lie in the grove, each inside a plot', JSON.stringify(loose.map(q => q.x))),
    ok(Math.abs(plots[1].grow - (30 + 10) / 60) < 1e-6 && plots[3].grow === 1 && plots[0].grow == null, 'the growth carries over: a pole ten seconds into its stage is two thirds grown, a grown tree whole', JSON.stringify(plots.map(p => p.grow))),
    ok(plots[0].stump && plots[2].stump && plots[2].dug === 1, 'the stumps stand, the dug one with its root dug', JSON.stringify(plots.map(p => [p.stump, p.dug]))),
    ok(a.ups['after-selfseed'] === 1 && !('after-tree' in a.ups), 'bigger trees is self-seeding\'s first rung', JSON.stringify(a.ups)),
    ok(a.sawBought && a.sawHanded && a.ups['after-saw'] === 1 && S.beatsDone.includes('saw') && !S.beatsDone.includes('axe'), 'the saw is bought and handed over where the axe was'),
    ok(stock.seeds === 5 && acorns === 5, 'the seed basket starts full', `${stock.seeds} in the basket`),
    ok(cutter && cutter.target == null, 'the woodcutter chooses again', JSON.stringify(cutter && { target: cutter.target, t: cutter.t })),
    ok(blob.saveV === SAVE_V && !named(blob), 'the save written back names nothing after the axe', `v${blob.saveV}`),
    ok(!blockProblems(afterGround).length, 'the ground is sound', blockProblems(afterGround).slice(0, 3).join('; '))
  ];
});
