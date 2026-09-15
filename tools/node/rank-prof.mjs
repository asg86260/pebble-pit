// A .cpuprofile ranked by self time: the twenty-five functions the run was
// actually in, with the share of the whole.
//
//   node --cpu-prof --cpu-prof-dir=prof --test test/shield.test.mjs
//   node tools/node/rank-prof.mjs prof/*.cpuprofile
//
// Self time and not total, because total puts `fast` and `step` at the top of
// every profile ever taken and says nothing. Every slow file so far has been
// one line here at forty per cent -- `addGrain` searching a full hole,
// `apronReport` walking the floor four times a snapshot -- and none of them
// was where reading the test suggested.

import fs from 'node:fs';

const f = process.argv[2];
if (!f) { console.error('usage: node tools/node/rank-prof.mjs <file.cpuprofile>'); process.exit(2); }
const p = JSON.parse(fs.readFileSync(f, 'utf8'));
const byId = new Map(p.nodes.map(n => [n.id, n]));
const us = new Map();
for (let i = 0; i < p.samples.length; i++) us.set(p.samples[i], (us.get(p.samples[i]) || 0) + (p.timeDeltas[i] || 0));
const self = new Map();
for (const [id, t] of us) {
  const cf = byId.get(id).callFrame;
  const key = `${cf.functionName || '(anon)'} ${cf.url.split('/').slice(-1)[0]}:${cf.lineNumber + 1}`;
  self.set(key, (self.get(key) || 0) + t);
}
const total = [...self.values()].reduce((a, b) => a + b, 0);
[...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)
  .forEach(([k, t]) => console.log(`${String(t / 1000 | 0).padStart(7)}ms ${(100 * t / total).toFixed(1).padStart(5)}%  ${k}`));
