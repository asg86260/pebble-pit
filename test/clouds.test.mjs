// The clouds (src/render/clouds.js): the facts about a cloud that no shot can
// be trusted to show and that a later tweak to the recipe could quietly break.
//
//   a bake is the same at any frame rate, wherever its slices fall, so
//     spreading the work over frames cannot change the picture
//   hardly a cell is left a spur (alone in its tone, a one-cell bump on a
//     flat edge, or a sliver a cell wide) after a bake, in any kind,
//     treatment, page or moment: a handful at most, where two fixes undo
//     each other at a corner of three tones
//   the roll does not shimmer: over a minute of game time, under one in
//     twenty of the cells a step re-tones goes straight back the next step
//     (a lobe swelling past a cell and settling back, eased by the fade)
//   a shape is the same for the same seed, and a cloud never draws from the
//     yard's own chance (rng.js), so a seeded run plays out the same with the
//     sky on screen
//
// The slide (that a sheet moves as one piece, a pixel at a time, and its
// cells stay whole) needs a canvas: tools/clouds-check.mjs.
//
// No yard: the module is handed a clock and reads nothing else.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloudSheet, tickClouds, bakeNow, setLook, spursOf } from '../src/render/clouds.js';
import { seedRng, rand } from '../src/rng.js';
import { CLOUDS_KINDS, CLOUDS_TREATMENTS } from '../src/config.js';

const KINDS = Object.keys(CLOUDS_KINDS);
const make = (kind, treat = 'C', page = 'light') => {
  const sh = cloudSheet({ kind, seed: 4, w: kind === 'puff' ? undefined : 260 });
  setLook(sh, { page, treat });
  return sh;
};

test('a bake spread over frames is the same at any frame rate', () => {
  // one sheet ticked sixty times a second, one seven: their slices fall on
  // different rows, and every step they show must still be the same
  for (const kind of KINDS) {
    const fast = make(kind), slow = make(kind);
    let checked = 0;
    for (let f = 1; f <= 60 * 20; f++) {
      const t = f / 60;
      tickClouds([fast], t);
      if (f % 9 === 0) {
        tickClouds([slow], t);
        if (slow.k0 === fast.k0) {
          assert.deepEqual(Array.from(slow.roles[0]), Array.from(fast.roles[0]), `${kind}: the step behind differs`);
          assert.deepEqual(Array.from(slow.roles[1]), Array.from(fast.roles[1]), `${kind}: the step ahead differs`);
          checked++;
        }
      }
    }
    assert.ok(checked > 10, `${kind}: compared only ${checked} times`);
  }
});

test('hardly a spur survives a bake, in any kind, treatment or page', () => {
  for (const kind of KINDS) for (const treat of Object.keys(CLOUDS_TREATMENTS)) for (const page of ['light', 'dark']) for (const t of [5, 30, 77]) {
    const sh = make(kind, treat, page);
    tickClouds([sh], t);
    for (const R of sh.roles) { const n = spursOf(sh, R); assert.ok(n <= 16, `${kind} ${treat} ${page} at ${t}s: ${n} spurs`); }
  }
});

test('the roll does not shimmer', () => {
  for (const kind of KINDS) {
    const sh = make(kind);
    let flips = 0, backs = 0, k = null;
    for (let t = 0; t < 60; t += 1 / 30) {
      tickClouds([sh], t);
      if (sh.k0 !== k) { if (k !== null) { flips += sh.flips; backs += sh.backs; } k = sh.k0; }
    }
    assert.ok(flips > 0, `${kind}: the clouds never moved`);
    assert.ok(backs <= flips * 0.05, `${kind}: ${backs} of ${flips} re-toned cells went back a step later`);
  }
});

test('a shape is its seed, and a cloud never draws from the yard\'s chance', () => {
  seedRng(77); const before = rand();
  seedRng(77);
  const a = make('mid'), b = make('mid');
  assert.equal(rand(), before, 'making a cloud moved the yard\'s stream');
  tickClouds([a], 12); tickClouds([b], 12);
  assert.deepEqual(Array.from(a.roles[0]), Array.from(b.roles[0]));
});
