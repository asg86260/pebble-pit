// The deep's creatures (DESIGN.md, "The deep's zones"): sparse, read
// off each one's seed and the clock. Each stays in its own zone's rows, none
// swims into the ground, and none teleports: a creature moves a few cells a
// second, and comes back in at the far end only out beyond the deep's walls.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.mjs';                // the yard's page: the creatures now read the deep's floor
import { FAUNA, FAUNA_MOTION, FAUNA_ZONES } from '../src/config.js';
import { POPULATION, COLS, ROWS, faunaAt, heightOf, zoneOf } from '../src/deep/fauna.js';

const DT = 1 / 60;

test('the population is the table, and the same on every load', () => {
  assert.equal(POPULATION.length, FAUNA.reduce((n, r) => n + r.n, 0));
  const again = POPULATION.map(c => faunaAt(c, 12.5));
  assert.deepEqual(again, POPULATION.map(c => faunaAt(c, 12.5)));
});

// Sparse, the way the birds are (the owner, 2026-10-13, twice): nine of the
// seventy-six there were, every zone lived in, the midnight band round the
// coil and the bar the quietest.
test('the deep is sparse: a few in every zone, the fewest round the coil', () => {
  assert.ok(POPULATION.length <= 9, `${POPULATION.length} creatures`);
  const per = new Map(FAUNA_ZONES.map(z => [z.key, 0]));
  for (const c of POPULATION) per.set(c.zone, per.get(c.zone) + 1);
  for (const [k, n] of per) assert.ok(n > 0, `nobody lives in ${k}`);
  const mid = per.get('mid');
  for (const [k, n] of per) if (k !== 'mid') assert.ok(n > mid, `${k} (${n}) is no busier than the midnight band (${mid})`);
  assert.ok(new Set(POPULATION.map(c => c.kind)).size >= 9, 'every one a kind of its own');
});

test('each creature stays in its zone, and nothing swims into the floor', () => {
  for (const c of POPULATION) {
    const z = zoneOf(c.zone);
    for (let t = 0; t < 120; t += 0.37) {
      const { y } = faunaAt(c, t);
      const h = heightOf(c.kind);
      assert.ok(y + h <= ROWS, `${c.kind} ${c.i} is in the floor at ${t}s (row ${y})`);
      if (c.floor || c.low) continue;
      // a bob of a row or two either side of its seat
      const slack = Math.max(FAUNA_MOTION.amp, FAUNA_MOTION.jellyAmp) + 1;
      assert.ok(y >= z.from - slack && y < z.to + slack, `${c.kind} ${c.i} left its zone at ${t}s (row ${y})`);
    }
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
