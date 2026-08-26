// The whole suite, in parallel.
//
//   node tools/test.mjs          # as many shards as the machine has room for
//   node tools/test.mjs 4        # four of them
//
// This shards what is left of the browser suite. The checks about the yard
// itself moved to node (`npm test`), which parallelises by file for free, so
// this is now forty-odd groups of pointer and layout work rather than a hundred
// and forty thousand frames of simulation -- and every group starts from a new
// game, so a shard boundary can fall anywhere.
//
// Each shard is its own browser on its own port with its own profile, so they
// cannot see each other's saves or close each other's tabs. They all talk to the
// one dev server, which is only serving files.

import { spawn } from 'node:child_process';
import { cpus } from 'node:os';

const asked = +process.argv[2];
// Half the cores, and never more than four.
//
// The point of the cap is not the shards -- it is you. This runs on the machine
// you are playing the game on, and a suite that takes every core makes the yard
// stutter while it works. A run that finishes a bit later and leaves the game
// playable is the better trade every time; ask for more explicitly if you are
// going to go and make a cup of tea.
const N = asked > 0 ? asked : Math.max(2, Math.min(4, Math.floor(cpus().length / 2)));

const run = i => new Promise(res => {
  const p = spawn(process.execPath, ['tools/headless.mjs', '--shard', `${i + 1}/${N}`],
                  { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  p.stdout.on('data', d => { out += d; });
  p.stderr.on('data', () => {});
  p.on('close', () => {
    // Whatever the shard printed before the JSON is not JSON. Take from the
    // first brace to the matching end of that object and leave the rest.
    const from = out.indexOf('{');
    const to = out.indexOf('\n}');
    try { res(JSON.parse(out.slice(from, to + 2))); }
    catch { res({ passed: 0, total: 0, seconds: 0, slowest: [], failures: [],
                  errors: [`shard ${i + 1} said nothing a suite would say`] }); }
  });
});

const t0 = Date.now();
const parts = await Promise.all(Array.from({ length: N }, (_, i) => run(i)));
const wall = ((Date.now() - t0) / 1000).toFixed(0);

const passed = parts.reduce((n, p) => n + p.passed, 0);
const total = parts.reduce((n, p) => n + p.total, 0);
const failures = parts.flatMap(p => p.failures || []);
const errors = parts.flatMap(p => p.errors || []);
// the slowest groups anywhere, not the slowest in each shard
const slowest = parts.flatMap(p => p.slowest || [])
                     .sort((a, b) => parseFloat(b) - parseFloat(a)).slice(0, 8);

console.log(JSON.stringify({ passed, total, wall: +wall, shards: N,
                             work: parts.reduce((n, p) => n + p.seconds, 0),
                             slowest, failures, errors }, null, 1));
process.exit(failures.length || errors.length ? 1 : 0);
