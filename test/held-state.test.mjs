// Every module-level `let` in the game says what it is, on its own line
// (docs/wave-tests.md, step 2; src/reset.js):
//
//   // held      the game's state kept in a module: the file registers its
//               clearing with `held(...)`, so a new game and a load clear it
//   // cache:    worked out from something else and keyed by it; stale is
//               impossible, so nothing clears it
//   // page:     the page's, not the game's: the audio context, a pad
//               plugged in, the dev panel; it outlives games on purpose
//
// A `let` that says none of them is the bug two checks found on 2026-10-22:
// state no new game cleared, red only after some other check. The ones
// standing when this landed are listed in held-state.allow, a list that
// only shrinks.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MARK = /\/\/ (held\b|cache:|page:)/;
const SKIP = /^src\/(selftest|cutbench|music)\//;
const walk = d => readdirSync(d).flatMap(f => {
  const p = join(d, f).replaceAll('\\', '/');
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
});
const allowed = new Set(readFileSync('test/held-state.allow', 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')));

const unmarked = [], unregistered = [];
for (const file of walk('src').filter(f => !SKIP.test(f) && f !== 'src/selftest.js')) {
  const text = readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^let ([A-Za-z_$][\w$]*)/);
    if (!m) continue;
    const key = `${file}:${m[1]}`;
    if (!MARK.test(line)) { if (!allowed.has(key)) unmarked.push(key); continue; }
    if (/\/\/ held\b/.test(line) && !/from '(\.\.?\/)+reset\.js'/.test(text)) unregistered.push(key);
  }
}

test('every module-level let says whether a new game clears it', () => {
  assert.deepEqual(unmarked, [], `unmarked (add // held, // cache: or // page:): ${unmarked.join(', ')}`);
  assert.deepEqual(unregistered, [], `marked // held in a file that does not import src/reset.js: ${unregistered.join(', ')}`);
});

test('the allowlist only names lets that are still unmarked', () => {
  const stale = [...allowed].filter(key => {
    const [file, name] = key.split(':');
    try { return !readFileSync(file, 'utf8').split('\n').some(l => l.startsWith(`let ${name}`) && !MARK.test(l)); }
    catch { return true; }
  });
  assert.deepEqual(stale, [], `strike these from test/held-state.allow: ${stale.join(', ')}`);
});
