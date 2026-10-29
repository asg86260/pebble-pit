// The step-2 adapters are gone (DESIGN.md, "One resource system for every
// act", section 8, steps 2 to 4): act 3's goods are read off the ground's own
// API (after/ground.js) and nothing else. `plotOf` made a pile a coarse plot,
// `AFTER_PLOTS` was the hand's side door, `groundLogs` a lying list on the act's
// state, and `S.after.stock` the count they were held equal to. A name that
// comes back is a second copy of the mechanism, and this file is red for it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const walk = d => readdirSync(d).flatMap(f => {
  const p = join(d, f).replaceAll('\\', '/');
  return statSync(p).isDirectory() ? (f === 'fixtures' || f === 'node_modules' ? [] : walk(p)) : /\.(js|mjs)$/.test(p) ? [p] : [];
});
// The old saves' migrations read the raw shapes of their day, and so do the
// checks that load a raw save from a fixture (`raw.after.stock`, `blob.after.groundLogs`):
// only the live state's names are banned. This file names the words.
const SKIP = f => f.startsWith('src/migrations/') || f === 'test/no-adapters.test.mjs';
const BANNED = [
  [/\bplotOf\b/, 'plotOf (a pile as a plot)'],
  [/\bAFTER_PLOTS\b/, 'AFTER_PLOTS (the hand\'s side door)'],
  [/\bS\.after\.groundLogs\b|\bgroundLogs\s*\(|\bgroundLogs\s*=/, 'groundLogs (a lying list)'],
  [/\bS\.after\.stock\b/, 'S.after.stock (a stored count)'],
  [/\bAFTER_STOCK\b/, 'AFTER_STOCK (the stock\'s keys)'],
  [/\bAFTER_CARRY_SLOTS\b|\bAFTER_LOG_SAWDUST\b/, 'a carry-slots table the weights replaced']
];

test('no adapter of the step-2 ground, and no stock, is read anywhere', () => {
  const found = [];
  for (const f of ['src', 'test', 'tools'].flatMap(walk).filter(f => !SKIP(f))) {
    const text = readFileSync(f, 'utf8').split('\n');
    text.forEach((line, i) => {
      if (/^\s*\/\//.test(line)) return;
      for (const [re, what] of BANNED) if (re.test(line.replace(/\/\/.*$/, ''))) found.push(`${f}:${i + 1} ${what}`);
    });
  }
  assert.deepEqual(found, [], `retired names in use:\n${found.join('\n')}`);
});

test('the retired files are gone', () => {
  for (const f of ['src/render/after/drop.js']) assert.throws(() => statSync(f), `${f} is back`);
});
