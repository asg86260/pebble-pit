// Wall time for every file in the node tier, slowest first.
//
//   node tools/node/file-times.mjs            # the whole tier, four at a time
//   node tools/node/file-times.mjs shield sky  # only files whose names contain these
//
// This is a sweep, so it has the sweep's cost and the sweep's rules: run it
// once, on a quiet machine, when a file has to be named rather than guessed.
// A file that takes minutes here is not "a long sim" until a profile says so
// -- every one found so far was a hook doing something a million times
// (see `rank-prof.mjs`). Four at a time, the same cap as `npm test`; the
// numbers are wall time under whatever else the machine is doing, so read
// the ranking rather than the seconds.

import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';

const only = process.argv.slice(2);
const files = readdirSync('test').filter(f => f.endsWith('.test.mjs'))
  .filter(f => !only.length || only.some(s => f.includes(s))).map(f => 'test/' + f);
const out = [];
let next = 0;
const one = () => new Promise(res => {
  const f = files[next++]; if (!f) return res(false);
  const t0 = Date.now();
  const p = spawn('node', ['--test', f], { stdio: ['ignore', 'ignore', 'ignore'] });
  p.on('close', code => {
    const ms = Date.now() - t0;
    out.push([ms, f, code]);
    console.log(`${(ms / 1000).toFixed(1)}s\t${code === 0 ? 'ok' : 'FAIL'}\t${f}`);
    res(true);
  });
});
const worker = async () => { while (await one()) {} };
await Promise.all([worker(), worker(), worker(), worker()]);
out.sort((a, b) => b[0] - a[0]);
console.log('\n--- slowest first ---');
for (const [ms, f, code] of out) console.log(`${(ms / 1000).toFixed(1)}s\t${code === 0 ? 'ok' : 'FAIL'}\t${f}`);
console.log('total file-seconds', (out.reduce((a, r) => a + r[0], 0) / 1000).toFixed(0));
