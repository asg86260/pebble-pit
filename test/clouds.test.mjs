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
//   the liquid sky: layers smaller, flatter and slower toward the horizon, a
//     long tail of sizes, a crust that rides its lobe, an edge that flows
//     across a cell rather than chattering on it
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

// --- the liquid sky (clouds.js's layers; the card's half is tools/clouds-check.mjs) ---

import { skyLayer, groundLayer, layerParams, puffAt, sumsAt, tierOf } from '../src/render/clouds.js';
import { CLOUDS_SKY } from '../src/config.js';

test('toward the horizon a layer is smaller, flatter, slower, and worked less often', () => {
  const P = Array.from({ length: CLOUDS_SKY.layers }, (_, i) => layerParams(i));
  for (let i = 1; i < P.length; i++) {
    assert.ok(P[i].R > P[i - 1].R, `layer ${i} no bigger than the one behind`);
    assert.ok(P[i].flat >= P[i - 1].flat, `layer ${i} flatter than the one behind`);
    assert.ok(P[i].parallax > P[i - 1].parallax && P[i].wind > P[i - 1].wind, `layer ${i} no faster than the one behind`);
    assert.ok(P[i].every <= P[i - 1].every, `layer ${i} worked less often than the one behind`);
  }
});

test('a layer has a long tail of sizes: a few clouds many times the typical one', () => {
  const L = skyLayer({ i: CLOUDS_SKY.layers - 1, seed: 3, W: 1200 });
  const r = L.puffs.filter(p => !p.crust).map(p => p.r).sort((a, b) => a - b);
  const median = r[r.length >> 1], top = r[r.length - 1];
  assert.ok(top / median > 2.5, `biggest lobe ${top.toFixed(1)} is not far past the median ${median.toFixed(1)}`);
});

test('a crust lump rides its lobe: it never drifts off it', () => {
  const L = skyLayer({ i: CLOUDS_SKY.layers - 1, seed: 5, W: 1200 });
  const lumps = L.puffs.filter(p => p.follow).slice(0, 200), a = {}, b = {};
  for (const t of [0, 37, 151, 600]) for (const p of lumps) {
    puffAt(p, t, a); puffAt(p.follow, t, b);
    const d = Math.hypot(a.x - b.x, (a.y - b.y) / p.flat);
    assert.ok(d <= b.r * 1.6 + p.r, `a lump ${d.toFixed(1)} cells off a lobe of ${b.r.toFixed(1)} at ${t}s`);
  }
});

test('a flowing edge crosses a cell once: none chatters, hardly any comes back within a second', () => {
  // the nearest layer, a window over its busiest stretch, worked every
  // frame for ten seconds (the sky changes over minutes, so a shorter look sees
  // too little move) with the same hysteresis the card uses. A cell at
  // the far point of a lobe's sway is crossed out and back as the sway turns,
  // which is the flow and not flicker; a cell back within a tenth of a second
  // is flicker
  const L = skyLayer({ i: CLOUDS_SKY.layers - 1, seed: 7, W: 800 });
  const w = 40, h = L.h, by = x0 => L.puffs.filter(p => Math.abs(((p.x - x0 - w / 2) % 800 + 1200) % 800 - 400) < 90);
  let x0 = 0;
  for (let x = 0; x < 800; x += 20) if (by(x).length > by(x0).length) x0 = x;
  const near = by(x0);
  const view = { ...L, puffs: near };
  const T = new Int8Array(w * h).fill(-9), when = new Float64Array(w * h).fill(-9), from = new Int8Array(w * h);
  let changes = 0, back = 0, chatter = 0;
  const s = [0, 0, 0, 0];
  for (let f = 0; f <= 600; f++) {
    const t = 40 + f / 60;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, was = T[i], now = tierOf(sumsAt(view, t, x0 + x, y, s), was === -9 ? null : was);
      if (was !== -9 && now !== was) {
        changes++;
        if (now === from[i] && t - when[i] < 1) back++;
        if (now === from[i] && t - when[i] < 0.1) chatter++;
        when[i] = t; from[i] = was;
      }
      T[i] = now;
    }
  }
  assert.ok(changes > 20, `only ${changes} cells changed: the sky did not flow`);
  assert.equal(chatter, 0, `${chatter} of ${changes} cells went and came back within a tenth of a second`);
  assert.ok(back <= changes * 0.01, `${back} of ${changes} cells went and came back within a second`);
});

test("a sky's shape is its seed's, and making it never draws from the yard's chance", () => {
  seedRng(91); const before = rand();
  seedRng(91);
  const a = skyLayer({ i: 3, seed: 2, W: 500 }), b = skyLayer({ i: 3, seed: 2, W: 500 }), g = groundLayer({ seed: 2, W: 500 });
  assert.equal(rand(), before, "making a sky moved the yard's stream");
  assert.deepEqual(a.puffs.map(p => [p.x, p.y, p.r]), b.puffs.map(p => [p.x, p.y, p.r]));
  assert.ok(g.puffs.length > 0);
});
