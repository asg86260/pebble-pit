// The save as a file (wave-desk-sound, track A).
//
// electron/store.cjs is plain Node, so it is checked here, against a temp
// directory, with no Electron anywhere. Two promises are what it is for: the
// directory always holds at least one whole save, and last-good.json is never
// anything but a save that has been read back off the disk. Each group below
// is one of the ways a write can go wrong, and what the two files say after.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { openStore } = require('../electron/store.cjs');

const fresh = () => fs.mkdtempSync(path.join(os.tmpdir(), 'boulder-store-'));
const blob = n => JSON.stringify({ stored: n, boulder: 'x', gw: 1, gh: 1 });
const files = dir => fs.readdirSync(dir).sort();

test('a write lands, and the second write keeps the first as last-good', () => {
  const dir = fresh();
  const store = openStore(dir);
  assert.deepEqual(store.read(), { current: null, lastGood: null });

  assert.equal(store.write(1, blob(1)), true);
  assert.deepEqual(store.read(), { current: blob(1), lastGood: null },
    'one write: nothing before it to keep');
  assert.deepEqual(files(dir), ['current.json'], 'no temp file is left behind');

  assert.equal(store.write(1, blob(2)), true);
  assert.deepEqual(store.read(), { current: blob(2), lastGood: blob(1) },
    'last-good is the blob before the last write');
  assert.deepEqual(files(dir), ['current.json', 'last-good.json']);

  assert.equal(store.write(1, blob(3)), true);
  assert.deepEqual(store.read(), { current: blob(3), lastGood: blob(2) }, 'and it rolls');
});

test('a blob that is not JSON is refused and nothing on disk moves', () => {
  const dir = fresh();
  const store = openStore(dir);
  store.write(1, blob(1));
  store.write(1, blob(2));
  assert.equal(store.write(1, '{not json'), false);
  assert.deepEqual(store.read(), { current: blob(2), lastGood: blob(1) });
  assert.deepEqual(files(dir), ['current.json', 'last-good.json']);
});

test('a rename that throws leaves the old file whole, never a torn one', () => {
  const dir = fresh();
  const store = openStore(dir);
  store.write(1, blob(1));
  store.write(1, blob(2));

  // The write is torn at the one step that could tear it: the rename over
  // current.json throws once, as a full disk or a locked file would.
  const real = fs.renameSync;
  let thrown = false;
  fs.renameSync = (...a) => {
    if (!thrown) { thrown = true; throw new Error('disk went away'); }
    return real(...a);
  };
  let took;
  try { took = store.write(1, blob(3)); } finally { fs.renameSync = real; }

  assert.equal(thrown, true, 'the rename was reached');
  assert.equal(took, false, 'and the write says it did not take');
  assert.deepEqual(store.read(), { current: blob(2), lastGood: blob(1) },
    'both files are the saves from before');
  assert.deepEqual(files(dir), ['current.json', 'last-good.json'], 'and the temp is cleaned up');

  // The store is not broken by the throw: the next write lands as usual.
  assert.equal(store.write(1, blob(4)), true);
  assert.deepEqual(store.read(), { current: blob(4), lastGood: blob(2) });
});

test('a rename that throws on the way to last-good leaves last-good alone', () => {
  const dir = fresh();
  const store = openStore(dir);
  store.write(1, blob(1));
  store.write(1, blob(2));
  const real = fs.renameSync;
  let n = 0;
  fs.renameSync = (...a) => {
    // the first rename (current.json) goes through; the second (last-good) throws
    if (++n === 2) throw new Error('disk went away');
    return real(...a);
  };
  let took;
  try { took = store.write(1, blob(3)); } finally { fs.renameSync = real; }
  assert.equal(took, false);
  const r = store.read();
  assert.equal(r.current, blob(3), 'current is the new blob, whole');
  assert.equal(r.lastGood, blob(1), 'last-good is still the old one, whole');
  assert.deepEqual(files(dir), ['current.json', 'last-good.json']);
});

test('the empty string clears current, and the yard that was there is kept', () => {
  const dir = fresh();
  const store = openStore(dir);
  store.write(1, blob(1));
  store.write(1, blob(2));
  assert.equal(store.write(1, ''), true);
  assert.deepEqual(store.read(), { current: '', lastGood: blob(2) });
  // and nothing empty is ever promoted: the next save keeps the reset's
  // last-good, not the blank
  assert.equal(store.write(1, blob(3)), true);
  assert.deepEqual(store.read(), { current: blob(3), lastGood: blob(2) });
});

test('the write refuses anything that is not a string', () => {
  const store = openStore(fresh());
  assert.equal(store.write(1, null), false);
  assert.equal(store.write(1, { stored: 1 }), false);
  assert.deepEqual(store.read(), { current: null, lastGood: null });
});

test('a slot is the same pair of files under another name, beside slot 1', () => {
  const dir = fresh();
  const store = openStore(dir);
  store.write(1, blob(1));
  assert.deepEqual(store.read(2), { current: null, lastGood: null }, 'a fresh slot holds nothing');

  assert.equal(store.write(2, blob(10)), true);
  assert.equal(store.write(2, blob(11)), true);
  assert.deepEqual(store.read(2), { current: blob(11), lastGood: blob(10) }, 'and it rolls like slot 1');
  assert.deepEqual(store.read(1), { current: blob(1), lastGood: null }, 'slot 1 was not touched');
  assert.deepEqual(files(dir), ['current.json', 'slot-2.json', 'slot-2.last-good.json']);

  assert.equal(store.write(2, ''), true);
  assert.deepEqual(store.read(2), { current: '', lastGood: blob(11) }, 'a reset in a slot clears that slot');
  assert.deepEqual(store.read(1).current, blob(1));
});
