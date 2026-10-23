// The node tier's files for one shard, dealt by measured time:
//
//   node --test $(node tools/shard.mjs 2/4)
//
// Longest first into the emptiest shard, off test/times.json; a file nobody
// has timed counts the median. Each file is its own process, so unlike the
// browser's groups their order means nothing and they can be dealt.

import { readdirSync, existsSync, readFileSync } from 'node:fs';

const [i, n] = process.argv[2].split('/').map(Number);
const times = existsSync('test/times.json') ? JSON.parse(readFileSync('test/times.json', 'utf8')).node || {} : {};
const files = readdirSync('test').filter(f => f.endsWith('.test.mjs')).map(f => `test/${f}`).sort();
const known = Object.values(times).sort((a, b) => a - b), mid = known[known.length >> 1] || 1;
const cost = f => times[f] ?? mid;
const load = Array(n).fill(0), mine = [];
for (const f of [...files].sort((a, b) => cost(b) - cost(a) || a.localeCompare(b))) {
  const k = load.indexOf(Math.min(...load));
  load[k] += cost(f);
  if (k === i - 1) mine.push(f);
}
console.log(mine.join(' '));
