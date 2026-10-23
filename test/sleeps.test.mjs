// The browser suite waits on facts, not on the clock (docs/wave-tests.md,
// step 3): `until(fact)` and `quiet()` in src/selftest/kit.js wait a frame at
// a time for what a check needs, where a `sleep(ms)` guesses how long it
// takes and a slow machine makes the guess wrong. Each file's sleeps are
// counted against test/sleeps.allow, which only shrinks; a sleep stays only
// where wall time is the thing checked (a hold, a double-click's gap).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const files = ['src/selftest.js', ...readdirSync('src/selftest').filter(f => f.endsWith('.js')).map(f => `src/selftest/${f}`)];
const count = f => (readFileSync(f, 'utf8').match(/\bsleep\(/g) || []).length;
const now = Object.fromEntries(files.map(f => [f, count(f)]).filter(([, n]) => n));
const allow = Object.fromEntries(readFileSync('test/sleeps.allow', 'utf8').split('\n')
  .filter(l => l.trim() && !l.startsWith('#')).map(l => { const [f, n] = l.trim().split(/\s+/); return [f, +n]; }));

test('no file sleeps more than it did', () => {
  const over = Object.entries(now).filter(([f, n]) => n > (allow[f] || 0)).map(([f, n]) => `${f} ${n} > ${allow[f] || 0}`);
  assert.deepEqual(over, [], `wait on a fact (until, quiet) instead: ${over.join(', ')}`);
});

test('the allowance is no larger than the sleeps left', () => {
  const slack = Object.entries(allow).filter(([f, n]) => (now[f] || 0) < n).map(([f, n]) => `${f} ${now[f] || 0} < ${n}`);
  if (slack.length && process.env.SHRINK) {
    writeFileSync('test/sleeps.allow', readFileSync('test/sleeps.allow', 'utf8').split('\n')
      .filter(l => !l.trim() || l.startsWith('#')).join('\n').trimEnd() + '\n' +
      Object.entries(now).sort().map(([f, n]) => `${f} ${n}`).join('\n') + '\n');
    return;
  }
  assert.deepEqual(slack, [], `lower test/sleeps.allow to match (SHRINK=1 node --test test/sleeps.test.mjs): ${slack.join(', ')}`);
});
