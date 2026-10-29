// Act 3 is one chain since 2026-10-26 (DESIGN.md, "Act 3's goods are blocks,
// and a unit is followed through the saw mill", "Saves"): an old save with
// the chipper, the paper mill and the press built, seats bought on their
// jobs, members at them and paper, posters and the chipper's logs on hand is
// read through the cut (src/migrations/2026-10-26-cut-paper.js). The save
// is the one the act wrote before the cut, kept as
// test/fixtures/act3-before-cut.json, written by the node yard on b6d3cd9a.
import { readFileSync } from 'node:fs';
import { yard, group, ok, run } from './helpers.mjs';
import { AFTER_JOBS } from '../src/config.js';
import { goodsRead } from '../src/after/piles.js';
import { lying } from '../src/after/ground.js';

const KEY = 'boulder-clicker/v4';
const RAW = readFileSync(new URL('./fixtures/act3-before-cut.json', import.meta.url), 'utf8');
const CUT = ['chipper', 'papermill', 'press'];
const CUT_JOBS = ['feeder', 'pulper', 'printer', 'paster'];
const CUT_UPS = ['after-drum', 'after-spout', 'after-vat', 'after-dry', 'after-stack', 'after-posterreach'];

group('a save from before the cut loads as one chain: the chipper\'s logs at the saw, seats carried to the sawyer, paper and posters gone', async () => {
  const old = JSON.parse(RAW), was = old.after;
  // A builder on a cut station's site, as a save taken mid-raise would hold it.
  const s = JSON.parse(RAW);
  s.after.raising.press = { n: 1, at: [0], claimed: 2, brought: 3, taken: 2, laid: 2, drop: [], pick: [], whole: null };
  s.after.bodies.push({ id: 99902, job: 'builder', site: 'press', pair: null, builds: true, x: 0, y: s.after.bodies[0].y, face: 1, state: 'work', t: 0, load: 'carry', target: null, n: 0 });
  localStorage.setItem(KEY, JSON.stringify(s));
  yard.restore();
  const a = yard.S.after;
  const lyingOf = kind => lying().filter(q => q.kind === kind).length;
  const piled = goodsRead();
  const seat = j => was.ups[`after-seat-${j}`] || 0;
  const carried = Math.max(...['sawyer', ...CUT_JOBS].map(seat));
  const left = a.bodies.filter(b => CUT_JOBS.includes(b.job) || CUT_JOBS.includes(b.errand) || ['posters', 'sheet'].includes(b.load) || CUT.includes(b.site) || CUT.includes(b.at));
  const checks = [
    ok(old.saveV < 29 && CUT.every(k => was.built.includes(k)) && was.stock.paper > 0 && was.stock.posters > 0 && was.stock.chiplogs > 0,
       'the fixture is a save from before the cut, all three built, paper, posters and the chipper\'s logs on hand', `${old.saveV} ${was.built}`),
    ok(!('stock' in a), 'no stock numbers are kept at all: paper, posters and the chipper\'s logs are gone with them', JSON.stringify(piled)),
    // The saw mill's pile holds its brim and the rest lie beside it
    // (after/piles.js); timber is halved a step later, counted in blocks
    // (test/after-pile-plots.test.mjs).
    ok(piled.logs + lyingOf('log') === was.stock.logs + was.stock.chiplogs, 'the chipper\'s logs are laid on the saw mill\'s pile',
       `${was.stock.logs} + ${was.stock.chiplogs} -> ${piled.logs} + ${lyingOf('log')} lying`),
    ok(piled.timber + lyingOf('plank') === Math.floor(was.stock.timber / 2), 'timber is only halved into blocks', `${was.stock.timber} -> ${piled.timber} + ${lyingOf('plank')} lying`),
    ok(!CUT.some(k => a.built.includes(k)) && !CUT.some(k => k in a.raising), 'the three stations are neither built nor going up', JSON.stringify(a.built)),
    ok(!('posters' in a), 'no posters are left on the fence'),
    ok(a.ups['after-seat-sawyer'] === carried && !CUT_JOBS.some(j => `after-seat-${j}` in a.ups) && !CUT_UPS.some(k => k in a.ups),
       'the seats bought on the cut jobs are the sawyer\'s, the larger kept, and the cut upgrades are gone', JSON.stringify(a.ups)),
    ok(!Object.keys(a.crew).some(j => !AFTER_JOBS.includes(j)), 'no roster wants a cut job', JSON.stringify(a.crew)),
    ok(left.length === 0, 'no body is on a cut job, errand, site or load', JSON.stringify(left.map(b => [b.job, b.errand, b.load, b.site])))
  ];
  // And it runs on: the reload check and the rules speak over these frames.
  run(20);
  checks.push(ok(yard.S.after.bodies.every(b => !CUT_JOBS.includes(b.job)), 'stepped on, nobody takes a cut job'));
  return checks;
});
