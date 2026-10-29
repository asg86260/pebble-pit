// The block rule in grid.js (DESIGN.md, "One resource system for every act",
// step 1): a unit is a cell value, a block is a square of them on its own
// lattice, and a heap of blocks settles like a heap -- a block rests when it is
// held up under half its width or more, rolls off only when it overhangs, a
// whole block at a time toward the side with less under it, and is only ever
// taken off the top. Nothing in the game uses blocks yet, so these are plain
// grids and no yard: a check of the rule, not of a place.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SHADES, KINDS, AFTER_BLOCK, ROCK_CELL, FIND_TOP, BLOCK_CELL } from '../src/config.js';
import {
  addGrain, addBlock, putBlock, takeUnit, takeTop, blockAt, blockProblems,
  settle, put, at, topRow, kindOf, toneOf, cellOf, sizeOfCell
} from '../src/grid.js';

const LOG = cellOf('log', 0), PLANK = cellOf('plank', 0);
const LZ = KINDS.log.size, PZ = KINDS.plank.size;

// a plot, with the awake fields declared as state.js's floor does, and
// `ground` (a height a column, in cells) as fixed terrain
function plot(cols, rows, { ground = null, ceiling, repose = false } = {}) {
  const b = {
    x: 0, y: 0, cols, rows, p: 6,
    grid: new Uint8Array(cols * rows),
    awake: null, awakeOf: null, awakeN: 0, awakeList: null,
    repose
  };
  if (ceiling) b.ceiling = ceiling;
  if (ground) {
    b.fixed = (c, r) => r < ground[c];
    for (let c = 0; c < cols; c++) for (let r = 0; r < ground[c]; r++) put(b, c, r, 1);
  }
  return b;
}
const passes = (b, n) => { for (let i = 0; i < n; i++) settle(b); };
const cellsOf = b => b.grid.reduce((n, v) => n + (v ? 1 : 0), 0);
const supported = (b, c0, r0, z) => r0 === 0 || [...Array(z).keys()].some(i => at(b, c0 + i, r0 - 1));

test('a 4x4 block over open ground falls and rests flush', () => {
  const b = plot(16, 40);
  assert.ok(putBlock(b, 8, 20, LOG));
  passes(b, 40);
  assert.deepEqual(blockAt(b, 9, 2), { c: 8, r: 0 });
  assert.equal(at(b, 8, 0), LOG);
  assert.equal(at(b, 11, 3), LOG);
  assert.equal(at(b, 8, 4), 0);
  assert.equal(cellsOf(b), LZ * LZ);
  assert.deepEqual(blockProblems(b), []);
  // a block off its lattice is refused, and writes nothing
  assert.equal(putBlock(b, 2, 20, LOG), false);
  assert.equal(cellsOf(b), LZ * LZ);
});

test('a block dropped on a peak rolls off a block-width, toward the lower side, and rests with no gap', () => {
  // a one-column peak with a low shoulder on one side only
  const ground = Array(24).fill(0);
  ground[9] = 6; ground[8] = 3; ground[10] = 3; ground[7] = 3; ground[11] = 3;
  const b = plot(24, 40, { ground });
  assert.ok(addBlock(b, 9 * b.p, LOG));
  assert.deepEqual(blockAt(b, 8, 6), { c: 8, r: 6 }, 'lands on the peak, on its lattice');
  passes(b, 2);
  const a = blockAt(b, 8, 5) || blockAt(b, 12, 5);
  assert.ok(a, 'it started rolling a cell down');
  passes(b, 40);
  // overhanging both ways it takes the side with less under it; the right is open to the ground
  const seen = [0, 4, 8, 12, 16, 20].map(c => blockAt(b, c, 0) || blockAt(b, c, 3) || blockAt(b, c, 6)).filter(Boolean);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].c % LZ, 0);
  assert.notEqual(seen[0].c, 8, 'it left the slot it landed on');
  assert.ok(supported(b, seen[0].c, seen[0].r, LZ), 'resting on something, no gap under it');
  const was = [...b.grid];
  passes(b, 200);
  assert.deepEqual([...b.grid], was, 'and then it stays');
  assert.deepEqual(blockProblems(b), []);
});

test('a block held up under half its width or more rests, however uneven the ground', () => {
  const ground = Array(16).fill(0);
  ground[4] = 4; ground[5] = 4;                // two of four columns under a log
  // and the slots beside it under a block's height lower, so it does not
  // roll off by its repose (a block's height or more over its neighbor)
  for (const c of [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15]) ground[c] = 1;
  const b = plot(16, 40, { ground });
  assert.ok(addBlock(b, 4 * b.p, LOG));
  passes(b, 100);
  assert.deepEqual(blockAt(b, 4, 4), { c: 4, r: 4 });
});

test('blocks never share a cell, however many are dropped', () => {
  const b = plot(48, 60);
  let n = 0, seed = 7;
  const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 14; i++) {
    const v = i % 2 ? PLANK : LOG;
    if (addBlock(b, next() * 48 * b.p, v)) n += sizeOfCell(v) ** 2;
    passes(b, 12);
    assert.deepEqual(blockProblems(b), [], `after drop ${i}`);
  }
  passes(b, 400);
  assert.deepEqual(blockProblems(b), []);
  assert.equal(cellsOf(b), n, 'every cell written is a cell read back: none drawn through, none lost');
});

test('grains and blocks on one plot settle without a cell being drawn through', () => {
  const ground = Array.from({ length: 40 }, (_, c) => (c < 8 ? 3 : c > 30 ? 2 : 0));
  const b = plot(40, 60, { ground, repose: true });
  const fixedN = cellsOf(b);
  let want = fixedN, seed = 3;
  const next = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let i = 0; i < 40; i++) {
    if (i % 5 === 2) { if (addBlock(b, next() * 40 * b.p, LOG)) want += LZ * LZ; }
    else if (i % 5 === 4) { if (addBlock(b, next() * 40 * b.p, PLANK)) want += PZ * PZ; }
    else if (addGrain(b, next() * 40 * b.p, undefined, 3 + (i % 3), true)) want++;
    passes(b, 6);
    assert.deepEqual(blockProblems(b), [], `after drop ${i}`);
  }
  passes(b, 600);
  assert.deepEqual(blockProblems(b), []);
  assert.equal(cellsOf(b), want, 'every unit is still one thing in one place');
  // no loose grain hangs in the air
  for (let c = 0; c < b.cols; c++) for (let r = 1; r < b.rows; r++) {
    const v = at(b, c, r);
    if (v && !kindOf(v) && !(b.fixed && b.fixed(c, r))) assert.ok(at(b, c, r - 1), `grain at ${c},${r} hangs`);
  }
  for (const ai of b.blockSet) {
    const c0 = ai % b.cols, r0 = (ai - c0) / b.cols;
    assert.ok(supported(b, c0, r0, sizeOfCell(b.grid[ai])), `block at ${c0},${r0} floats`);
  }
  const was = [...b.grid];
  passes(b, 300);
  assert.deepEqual([...b.grid], was, 'and the heap is at rest');
});

test('a block reads back its kind and shade, and values stay clear of the shades and finds', () => {
  const b = plot(16, 20);
  putBlock(b, 4, 0, LOG);
  assert.equal(kindOf(at(b, 5, 2)), KINDS.log);
  assert.equal(toneOf(at(b, 5, 2)), 0);
  const dark = cellOf('plank', 1);
  assert.equal(kindOf(dark), KINDS.plank);
  assert.equal(toneOf(dark), 1);
  assert.equal(sizeOfCell(dark), 2);
  for (const k of Object.values(KINDS)) {
    assert.ok(k.first >= BLOCK_CELL && BLOCK_CELL > ROCK_CELL && ROCK_CELL > FIND_TOP && FIND_TOP > SHADES.length);
    assert.ok(k.first + k.tones - 1 <= 255);
  }
  const runs = Object.values(KINDS).map(k => [k.first, k.first + k.tones - 1]).sort((x, y) => x[0] - y[0]);
  for (let i = 1; i < runs.length; i++) assert.ok(runs[i][0] > runs[i - 1][1], 'no two kinds share a value');
  assert.equal(kindOf(1), null);
  assert.equal(kindOf(ROCK_CELL), null);
});

test('a unit made with no tone asked for takes any of its four, and keeps a tone of its own kind', () => {
  for (const key of ['log', 'plank', 'sign']) {
    const seen = new Set();
    for (let i = 0; i < 400; i++) { const v = cellOf(key); assert.equal(kindOf(v), KINDS[key]); seen.add(toneOf(v)); }
    assert.equal(seen.size, 4, `${key} is born in all four of its tones`);
  }
});

test('KINDS sizes and weights read from config', () => {
  assert.equal(KINDS.log.size, AFTER_BLOCK.log);
  assert.equal(KINDS.plank.size, AFTER_BLOCK.plank);
  assert.equal(KINDS.sign.size, AFTER_BLOCK.sign);
  assert.equal(KINDS.load.size, AFTER_BLOCK.load);
  for (const k of Object.values(KINDS)) {
    assert.equal(k.weight, k.size * k.size, `${k.key} weighs its area`);
    assert.ok(k.palette.length === k.tones && k.palette.length >= 1 && (k.home || k.key === 'load'));          // a site's load is no good's to carry home
  }
});

test('taking from the top of a three-high heap leaves the rest as it was', () => {
  // its slot a region of its own, as a pile's rack is, so the three stand in
  // it rather than rolling off into a mound
  const b = plot(16, 40);
  b.region = c => Math.floor(c / LZ);
  for (let i = 0; i < 3; i++) assert.ok(addBlock(b, 5 * b.p, LOG));
  passes(b, 20);
  assert.deepEqual(blockAt(b, 4, 8), { c: 4, r: 8 });
  const under = [...b.grid].slice(0, 8 * b.cols);
  // the bottom block cannot be taken through any of its cells, nor the middle one
  for (const r of [0, 3, 4, 7]) assert.equal(takeUnit(b, 5, r), 0, `row ${r} is buried`);
  assert.deepEqual([...b.grid].slice(0, 8 * b.cols), under);
  assert.equal(takeTop(b, 5), LOG, 'the pointer takes the top');
  assert.equal(topRow(b, 5), 7);
  assert.deepEqual([...b.grid].slice(0, 8 * b.cols), under, 'the two under it are untouched');
  assert.equal(cellsOf(b), 2 * LZ * LZ);
  passes(b, 40);
  assert.equal(cellsOf(b), 2 * LZ * LZ);
  assert.deepEqual(blockProblems(b), []);
  assert.equal(takeTop(b, 5), LOG);
  assert.equal(takeTop(b, 5), LOG);
  assert.equal(takeTop(b, 5), 0, 'nothing left');
  assert.equal(cellsOf(b), 0);
});

test('a block with another resting on its far side is not the top of its column', () => {
  const b = plot(16, 40);
  assert.ok(putBlock(b, 4, 0, LOG));
  assert.ok(putBlock(b, 6, 4, PLANK));         // overhangs: resting on the log's right half
  assert.equal(takeTop(b, 5), 0, 'column 5 tops out on the log, which carries the plank');
  assert.equal(takeTop(b, 6), PLANK, 'the plank is the top of its own column');
  assert.equal(takeTop(b, 5), LOG);
});

test('eight logs dropped on one column end as a stable stepped mound', () => {
  // the heap a brim makes: three logs high in the middle, one less a slot out
  const slotOf = c => Math.floor(c / LZ);
  const ceiling = c => Math.max(0, 3 * LZ - LZ * Math.abs(slotOf(c) - 5));
  const b = plot(40, 60, { ceiling });
  for (let i = 0; i < 8; i++) {
    assert.ok(addBlock(b, 21 * b.p, LOG), `log ${i} found room`);
    passes(b, 40);
  }
  const stack = Array(10).fill(0);
  for (const ai of b.blockSet) stack[slotOf(ai % b.cols)]++;
  // a mound under the brim's heap, never a spike: no slot stands two blocks over
  // both its neighbors while there is room beside it (the repose rule, whatever
  // order the rolls came in)
  assert.equal(stack.reduce((n, k) => n + k, 0), 8, 'all eight stand');
  stack.forEach((k, i) => {
    assert.ok(k <= Math.max(0, 3 - Math.abs(i - 5)), `slot ${i} is under the brim's heap`);
    assert.ok(!(k - (stack[i - 1] ?? 0) >= 2 && k - (stack[i + 1] ?? 0) >= 2), `slot ${i} is no spike: ${stack}`);
  });
  assert.deepEqual(blockProblems(b), []);
  for (const ai of b.blockSet) {
    const c0 = ai % b.cols, r0 = (ai - c0) / b.cols;
    assert.ok(r0 % LZ === 0 && supported(b, c0, r0, LZ), `the log at ${c0},${r0} sits flush on the one under it`);
  }
  const was = [...b.grid];
  passes(b, 600);                               // ten game seconds at sixty a second
  assert.deepEqual([...b.grid], was, 'a heap at rest does not shuffle or level out');
});

test('eight logs dropped on one spot of open ground, with no ceiling, make a mound and not a tower', () => {
  const b = plot(64, 60);
  for (let i = 0; i < 8; i++) {
    assert.ok(addBlock(b, 33 * b.p, LOG), `log ${i} found room`);
    passes(b, 40);
  }
  const height = Array(16).fill(0);
  for (let s = 0; s < 16; s++) for (let c = s * LZ; c < s * LZ + LZ; c++) height[s] = Math.max(height[s], topRow(b, c) + 1);
  for (let s = 1; s < 16; s++) assert.ok(Math.abs(height[s] - height[s - 1]) <= LZ, `no slot stands over the next by more than a log: ${height}`);
  assert.ok(Math.max(...height) <= 3 * LZ, `three logs high at most: ${height}`);
  assert.deepEqual(blockProblems(b), []);
  const was = [...b.grid];
  passes(b, 600);
  assert.deepEqual([...b.grid], was, 'and it stays');
});

test('a region laying its own lattice keeps its blocks whole inside it, and none rolls out', () => {
  // a strip from column 6 to 14 laying logs off its own first column, open ground either side
  const b = plot(40, 60);
  b.region = c => (c >= 6 && c < 14 ? 'strip' : null);
  b.lattice = (c, z) => {
    const s0 = b.region(c) ? 6 : 0, s1 = b.region(c) ? 14 : (c < 6 ? 6 : 40), from = c < 6 || b.region(c) ? s0 : 14;
    const s = c - ((c - from) % z);
    return s + z <= s1 ? s : -1;
  };
  for (let i = 0; i < 6; i++) { assert.ok(addBlock(b, 9 * b.p, LOG)); passes(b, 40); }
  assert.deepEqual(blockProblems(b), []);
  for (const ai of b.blockSet) {
    const c0 = ai % b.cols;
    assert.ok(c0 === 6 || c0 === 10, `the strip's blocks stand on its slots: ${c0}`);
  }
  assert.equal(b.blockSet.size, 6, 'six in the strip, stood three high in its two slots');
  assert.equal(putBlock(b, 4, 30, LOG), false, 'a slot across the strip\'s edge is no slot');
});

test('a plot of grains never asks the block rule anything', () => {
  const b = plot(40, 40, { repose: true });
  const perf = globalThis.__perf;
  perf.blocks = 0;
  for (let i = 0; i < 80; i++) addGrain(b, (10 + (i % 7)) * b.p, undefined, 2 + (i % 4));
  passes(b, 200);
  assert.equal(perf.blocks, 0);
  assert.equal(b.blockN, undefined, 'no layer was made');
  assert.equal(b.block, undefined);
});
