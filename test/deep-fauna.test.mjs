// The deep's creatures (DESIGN.md, "The deep's zones"): sparse, read
// off each one's seed and the clock. Each wanders the whole height, none
// swims into the ground or out through the ceiling, and none teleports: a
// creature moves a few cells a second, and comes back in at the far end only
// out beyond the deep's walls.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.mjs';                // the yard's page: the creatures now read the deep's floor
import { FAUNA, FAUNA_MOTION, FAUNA_WANDER } from '../src/config.js';
import { POPULATION, COLS, ROWS, faunaAt, heightOf } from '../src/deep/fauna.js';

const DT = 1 / 60;

test('the population is the table, and the same on every load', () => {
  assert.equal(POPULATION.length, FAUNA.reduce((n, r) => n + r.n, 0));
  const again = POPULATION.map(c => faunaAt(c, 12.5));
  assert.deepEqual(again, POPULATION.map(c => faunaAt(c, 12.5)));
});

// A wanderer's way is walked from the clock's start, so a moment asked for
// out of order -- a reload, a look back for the smear -- must come out the
// same as one reached frame by frame.
test('where a creature is depends only on the clock, however it is asked', () => {
  const T = [0, 3.2, 47.9, 48, 12.25, 300.5, 299.9, 5, 1000.01, 60];
  const asked = POPULATION.map(c => T.map(t => faunaAt(c, t)));
  for (const c of POPULATION) c.walk = null;        // a new page: nothing walked yet
  const sorted = [...T].sort((a, b) => a - b);
  const fresh = POPULATION.map(c => { const m = new Map(sorted.map(t => [t, faunaAt(c, t)])); return T.map(t => m.get(t)); });
  assert.deepEqual(asked, fresh);
});

// Fewer, and each the whole height (the owner, 2026-10-14, option C of
// docs/mocks/deep-creatures-full-height-2026-10-14.html): three of the five
// there were, each a kind of its own, none kept to a zone.
test('the deep is sparse: three, each a kind of its own, every one a wanderer', () => {
  assert.equal(POPULATION.length, 3, `${POPULATION.length} creatures`);
  assert.deepEqual(POPULATION.map(c => c.kind).sort(), ['angler', 'dumbo', 'lantern']);
  assert.ok(POPULATION.every(c => c.wander), 'every one wanders the height');
});

// Within a quarter hour each has been up in the top quarter of the deep and
// down in the bottom one, and never above the ceiling's row or nearer the
// floor than its clearance.
test('each creature travels the whole height, never into the ceiling or the floor', () => {
  const W = 15 * 60;
  for (const c of POPULATION) {
    const h = heightOf(c.kind);
    let top = null, bottom = null;
    for (let t = 0; t < W; t += 0.25) {
      const { y } = faunaAt(c, t);
      assert.ok(y >= FAUNA_WANDER.top, `${c.kind} ${c.i} is over the ceiling at ${t}s (row ${y})`);
      assert.ok(y + h <= ROWS - FAUNA_MOTION.clear, `${c.kind} ${c.i} is under the floor's clearance at ${t}s (row ${y})`);
      if (top == null && y < ROWS / 4) top = t;
      if (bottom == null && y + h > ROWS * 3 / 4) bottom = t;
    }
    assert.ok(top != null, `${c.kind} ${c.i} never came up into the top quarter in ${W}s`);
    assert.ok(bottom != null, `${c.kind} ${c.i} never went down into the bottom quarter in ${W}s`);
  }
});

test('nothing teleports: a jump happens only off the deep, at the wrap', () => {
  const M = FAUNA_MOTION;
  for (const c of POPULATION) {
    let was = faunaAt(c, 0);
    for (let t = DT; t < 200; t += DT) {
      const p = faunaAt(c, t), dx = Math.abs(p.x - was.x);
      if (dx > c.v * M.hop.burst * DT * 2 + 1e-6) {
        // the wrap: out past one wall, in past the other
        const out = x => x < -M.wrap / 2 || x > COLS + M.wrap / 2;
        assert.ok(out(p.x) && out(was.x), `${c.kind} ${c.i} jumped ${dx.toFixed(2)} cells inside the deep at ${t.toFixed(2)}s`);
      }
      // up and down a whole row at a time, never more
      assert.ok(Math.abs(p.y - was.y) <= 1, `${c.kind} ${c.i} jumped ${p.y - was.y} rows at ${t.toFixed(2)}s`);
      was = p;
    }
  }
});

test('a scare throws the near creatures away and they ease back to their own path', async () => {
  const { addScare, scareEnvelope } = await import('../src/deep/fauna.js');
  const { FAUNA_SCARE: K } = await import('../src/config.js');
  const home = K.rise + K.fall, T0 = 30;
  // the step a creature can take between frames: the push over the rise, a held pose at a time
  const stepMax = Math.ceil(K.break.push / (K.rise * K.rate)) + 1;
  for (const power of [1, 2]) {
    let moved = 0;
    for (const c of POPULATION) {
      const base = faunaAt(c, T0, undefined, []);
      const list = [];
      addScare(base.x - 4, base.y, T0, power, list);
      if (Math.abs(faunaAt(c, T0 + K.rise, undefined, list).x - faunaAt(c, T0 + K.rise, undefined, []).x) > 0) moved++;
      let was = faunaAt(c, T0, undefined, list);
      for (let t = T0 + DT; t < T0 + home + 1; t += DT) {
        const p = faunaAt(c, t, undefined, list), q = faunaAt(c, t, undefined, []);
        const wrap = Math.abs(p.x - was.x) > 100;   // out past one wall, in past the other
        assert.ok(wrap || Math.abs(p.x - was.x) <= stepMax + c.v * FAUNA_MOTION.hop.burst * DT * 2 + 1 && Math.abs(p.y - was.y) <= stepMax + 1,
          `${c.kind} ${c.i} jumped at ${t.toFixed(2)}s`);
        if (t > T0 + home + 0.01) assert.deepEqual(p, q, `${c.kind} ${c.i} is not home ${(t - T0).toFixed(2)}s after`);
        was = p;
      }
    }
    assert.ok(moved > 0, `nobody was pushed by a power-${power} scare`);
  }
  assert.equal(scareEnvelope(home), 0);
  assert.ok(scareEnvelope(K.rise + 1 / K.rate) > 0.9, 'the push peaks just after the rise');
});

test('a scare pushes outward, floor creatures only sideways, and a break harder than a lash', async () => {
  const { addScare, scareOffset } = await import('../src/deep/fauna.js');
  const lash = [], brk = [];
  addScare(50, 60, 0, 1, lash); addScare(50, 60, 0, 2, brk);
  const near = scareOffset(60, 60, 0.3, false, 1, lash), nearB = scareOffset(60, 60, 0.3, false, 1, brk);
  assert.ok(near.x > 0 && nearB.x > near.x, 'away from the point, further for a break');
  assert.ok(scareOffset(40, 60, 0.3, false, 1, lash).x < 0, 'the other side goes the other way');
  assert.equal(scareOffset(60, 70, 0.3, true, 1, brk).y, 0, 'the floor-dwellers keep the floor');
  assert.deepEqual(scareOffset(200, 60, 0.3, false, 1, brk), { x: 0, y: 0 }, 'beyond the reach nothing moves');
});
