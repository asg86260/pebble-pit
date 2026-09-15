// One full sweep of a tier at a time, on this machine.
//
//   node tools/sweep.mjs --lock node -- node --test --test-concurrency=4 test/*.test.mjs
//   node tools/sweep.mjs --lock browser -- node tools/headless.mjs
//
// `npm test` and the browser scripts go through this. Three agents started a
// full node sweep within twenty minutes of each other one evening, each at
// four workers, on top of the dev servers already up: twelve yards on sixteen
// cores, every file three times slower than alone, and the agents sat on the
// result for hours. A sweep is the one thing in the working agreement that is
// only run once, on main, after a merge (CLAUDE.md, "The loop"), so a second
// one starting while the first is still going is never what anybody wanted.
//
// The lock is a file in the temp directory holding the pid, the checkout and
// the start time of the sweep that owns it. A second sweep of the same tier
// says who is running and stops, exit 3 -- the answer is to run the file or
// two that cover the change, or to wait for that sweep's result. `--wait`
// queues behind it instead, for the one legitimate case: a landing that wants
// its own run on main after somebody else's. A lock whose pid is gone is
// stale, not held, so a killed sweep never blocks the next one.
//
// A different tier is a different lock: both tiers are meant to be kicked off
// on main at once.

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { tmpdir, hostname } from 'node:os';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const dash = argv.indexOf('--');
const opts = dash < 0 ? argv : argv.slice(0, dash);
const cmd = dash < 0 ? [] : argv.slice(dash + 1);
const tier = opts[opts.indexOf('--lock') + 1] || 'node';
const wait = opts.includes('--wait');
if (!cmd.length) {
  console.error('usage: node tools/sweep.mjs --lock <tier> [--wait] -- <command...>');
  process.exit(2);
}

const lockPath = join(tmpdir(), `boulder-clicker-sweep-${tier}.lock`);

const alive = pid => { try { process.kill(pid, 0); return true; } catch { return false; } };
const holder = () => {
  if (!existsSync(lockPath)) return null;
  try {
    const h = JSON.parse(readFileSync(lockPath, 'utf8'));
    return alive(h.pid) ? h : null;               // a dead pid is a stale lock
  } catch { return null; }
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

let other = holder();
if (other && !wait) {
  const mins = Math.round((Date.now() - other.at) / 60000);
  console.error(`another ${tier} sweep is already running on ${hostname()}:`);
  console.error(`  pid ${other.pid}, from ${other.cwd}, started ${mins} min ago`);
  console.error(`run the one or two files that cover the change instead, or wait for that sweep's result.`);
  console.error(`(--wait queues behind it; a sweep whose process has died no longer holds the lock)`);
  process.exit(3);
}
while (other) {
  console.error(`waiting for the ${tier} sweep in ${other.cwd} (pid ${other.pid})...`);
  await sleep(15000);
  other = holder();
}

writeFileSync(lockPath, JSON.stringify({ pid: process.pid, cwd: process.cwd(), at: Date.now(), cmd: cmd.join(' ') }));
const release = () => { try { const h = JSON.parse(readFileSync(lockPath, 'utf8')); if (h.pid === process.pid) unlinkSync(lockPath); } catch {} };
process.on('exit', release);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { release(); process.exit(130); });

const child = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit' });
child.on('close', code => { release(); process.exit(code ?? 1); });
