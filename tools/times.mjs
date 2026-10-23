// test/times.json from CI's logs: every `TIMES browser {...}` and
// `TIMES node {...}` line in the files named, merged over what is there,
// the larger time kept where two shards or windows disagree.
//
//   node tools/times.mjs logs/*.txt
//
// The times only balance the shards (tools/shard.mjs, `cuts` in
// selftest.js); a stale one costs a slower run, never a wrong answer, so
// this is refreshed by hand when the shards drift apart.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'test/times.json';
const into = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const fresh = { browser: {}, node: {} };
for (const file of process.argv.slice(2)) {
  for (const m of readFileSync(file, 'utf8').matchAll(/TIMES (browser|node) (\{.*?\})(?:\s|\\n|$)/g)) {
    for (const [k, ms] of Object.entries(JSON.parse(m[2]))) fresh[m[1]][k] = Math.max(fresh[m[1]][k] || 0, ms);
  }
}
for (const tier of ['browser', 'node']) into[tier] = { ...into[tier], ...fresh[tier] };
const sorted = Object.fromEntries(Object.entries(into).map(([tier, t]) =>
  [tier, Object.fromEntries(Object.entries(t).sort(([a], [b]) => a.localeCompare(b)))]));
writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
console.log(`${OUT}: ${Object.keys(fresh.browser).length} browser groups, ${Object.keys(fresh.node).length} node files read`);
