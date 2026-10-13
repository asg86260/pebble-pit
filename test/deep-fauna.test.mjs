// The deep's creatures (DESIGN.md, "The deep's zones"): picture only, read
// off each one's seed and the clock. Each stays in its own zone's rows, none
// swims into the ground, and none teleports: a creature moves a few cells a
// second, and comes back in at the far end only out beyond the deep's walls.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FAUNA, FAUNA_MOTION } from '../src/config.js';
import { POPULATION, COLS, ROWS, faunaAt, heightOf, zoneOf } from '../src/deep/fauna.js';

const DT = 1 / 60;

test('the population is the table, and the same on every load', () => {
  assert.equal(POPULATION.length, FAUNA.reduce((n, r) => n + r.n, 0));
  const again = POPULATION.map(c => faunaAt(c, 12.5));
  assert.deepEqual(again, POPULATION.map(c => faunaAt(c, 12.5)));
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
