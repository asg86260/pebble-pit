// The deep's creatures (DESIGN.md, "The deep's zones"): sparse, read
// off the seed and the clock. A few slots swim at once and take turns
// through every swimmer kind, each wandering the whole height; none swims
// into the ground or out through the ceiling, and none teleports: a
// creature moves a few cells a second, comes back in at the far end only out
// beyond the deep's walls, and a slot changes kind only out there.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.mjs';                // the yard's page: the creatures now read the deep's floor
import { FAUNA, FAUNA_MOTION, FAUNA_TURNS } from '../src/config.js';
import { POPULATION, COLS, ROWS, faunaAt, visitAt, faunaOut, forgetWalk, reachOf, heightOf, wanderLo, wanderHi, waterTop } from '../src/deep/fauna.js';

const DT = 1 / 60;
const kindAt = (c, t) => visitAt(c, t).kind;
// The rows a kind's top-left may stand on: the jelly's bob is inside its band.
const rowsOf = kind => { const b = kind === 'jelly' ? FAUNA_MOTION.jellyAmp : 0; return [wanderLo(kind) - b, wanderHi(kind) + b]; };

test('the population is the table and the slots, and the same on every load', () => {
  assert.equal(POPULATION.length, FAUNA.reduce((n, r) => n + r.n, 0) + FAUNA_TURNS.slots);
  const again = POPULATION.map(c => faunaAt(c, 12.5));
  assert.deepEqual(again, POPULATION.map(c => faunaAt(c, 12.5)));
});

// The walk is from the clock's start, so a moment asked for out of order --
// a reload, a look back for the smear -- must come out the same as one
// reached frame by frame, kind and all.
test('where a creature is depends only on the clock, however it is asked', () => {
  const T = [0, 3.2, 47.9, 48, 12.25, 300.5, 299.9, 5, 1000.01, 60, 1800.5];
  const ask = (c, t) => ({ ...faunaAt(c, t), kind: kindAt(c, t) });
  const asked = POPULATION.map(c => T.map(t => ask(c, t)));
  forgetWalk();                                     // a new page: nothing walked yet
  const sorted = [...T].sort((a, b) => a - b);
  const fresh = POPULATION.map(c => { const m = new Map(sorted.map(t => [t, ask(c, t)])); return T.map(t => m.get(t)); });
  assert.deepEqual(asked, fresh);
});

// Few, each the whole height (the owner, 2026-10-14, option C of
// docs/mocks/deep-creatures-full-height-2026-10-14.html), taking turns
// through every swimmer (the owner, 2026-10-14: "just pure numbers of
// creatures on the screen at one time").
test('the deep is sparse: three slots, every one a wanderer, every swimmer on the roster', () => {
  assert.equal(FAUNA_TURNS.slots, 3);
  assert.equal(faunaOut(0).length, 3, `${faunaOut(0).length} creatures`);
  assert.ok(faunaOut(0).every(c => c.wander), 'every one wanders the height');
  const floor = FAUNA.filter(r => r.floor || r.low).map(r => r.kind);
  assert.ok(!FAUNA_TURNS.roster.some(k => floor.includes(k)), 'no floor creature on the roster');
  assert.ok(FAUNA_TURNS.roster.length > FAUNA_TURNS.slots, 'more kinds than slots, so they take turns');
});

// Within ten minutes each slot's drawing has been up in the top tenth of the
// water the deep's frame shows and down in the bottom tenth over the floor's
// clearance (the owner, 2026-10-14: "creatures STILL do not take up the whole
// height of the deep"), in the window the yard stands in and in one twice as
// tall, whose water goes on up over the ceiling; and never over the water's
// top or nearer the floor than its clearance, whichever kind it held.
test('each slot travels the whole height of the water shown, never into the floor', async () => {
  const { S } = await import('../src/state.js');
  const W = 10 * 60, H = S.H;
  for (const tall of [1, 2]) {
    S.H = H * tall;
    const top0 = waterTop(), bot0 = ROWS - FAUNA_MOTION.clear, tenth = (bot0 - top0) / 10;
    if (tall > 1) assert.ok(top0 < -ROWS / 4, `a tall window shows water over the ceiling (top row ${top0})`);
    for (const c of POPULATION) {
      let top = null, bottom = null;
      for (let t = 0; t < W; t += 0.25) {
        const { y } = faunaAt(c, t), kind = kindAt(c, t), [lo, hi] = rowsOf(kind);
        assert.ok(y >= lo, `${kind} in slot ${c.i} is over the water at ${t}s (row ${y})`);
        assert.ok(y <= hi, `${kind} in slot ${c.i} is under the floor's clearance at ${t}s (row ${y})`);
        if (top == null && y < top0 + tenth) top = t;
        if (bottom == null && y + heightOf(kind) > bot0 - tenth) bottom = t;
      }
      assert.ok(top != null, `slot ${c.i} never came up into the top tenth (rows ${top0}..${bot0}) in ${W}s`);
      assert.ok(bottom != null, `slot ${c.i} never went down into the bottom tenth (rows ${top0}..${bot0}) in ${W}s`);
    }
  }
  S.H = H;
});

test('nothing teleports: a jump happens only off the deep, at the wrap', () => {
  const M = FAUNA_MOTION, out = x => x < -M.wrap / 2 || x > COLS + M.wrap / 2;
  for (const c of POPULATION) {
    let was = faunaAt(c, 0);
    for (let t = DT; t < 600; t += DT) {
      const p = faunaAt(c, t), dx = Math.abs(p.x - was.x), v = visitAt(c, t).v;
      const wrap = out(p.x) && out(was.x);
      if (dx > v * DT * 2 + 1e-6) assert.ok(wrap, `slot ${c.i} jumped ${dx.toFixed(2)} cells inside the deep at ${t.toFixed(2)}s`);
      // up and down a whole row at a time, never more, but where a new kind comes in out past the end
      assert.ok(wrap || Math.abs(p.y - was.y) <= 1, `slot ${c.i} jumped ${p.y - was.y} rows at ${t.toFixed(2)}s`);
      was = p;
    }
  }
});

// Taking turns, frame by frame over half an hour: every swimmer on the
// roster comes by, never more than the slots at once and never two of a
// kind, and a slot changes kind only with its creature out past the end of
// the deep, its whole drawing off it, so nothing pops in or out.
test('the slots take turns through every swimmer: one kind at a time a slot, changed only off the deep', () => {
  const W = 30 * 60, seen = new Set(), changes = [];
  const off = (c, x) => x + reachOf(c) < 0 || x - reachOf(c) > COLS;
  let was = POPULATION.map(c => ({ v: visitAt(c, 0), x: faunaAt(c, 0).x }));
  for (let t = DT; t < W; t += DT) {
    const now = POPULATION.map(c => ({ v: visitAt(c, t), x: faunaAt(c, t).x }));
    assert.ok(now.length <= FAUNA_TURNS.slots, `${now.length} out at ${t.toFixed(2)}s`);
    const kinds = now.map(n => n.v.kind);
    assert.equal(new Set(kinds).size, kinds.length, `two of a kind out at ${t.toFixed(2)}s: ${kinds}`);
    now.forEach((n, k) => {
      seen.add(n.v.kind);
      if (n.v.kind === was[k].v.kind) return;
      changes.push(`${t.toFixed(1)}s slot ${k}: ${was[k].v.kind} to ${n.v.kind}`);
      assert.ok(off(was[k].v, was[k].x) && off(n.v, n.x),
        `slot ${k} changed ${was[k].v.kind} to ${n.v.kind} at ${t.toFixed(2)}s on the deep (x ${was[k].x.toFixed(1)} then ${n.x.toFixed(1)})`);
      assert.equal(n.v.lap, was[k].v.lap + 1, 'a new kind is a new lap, a new visit');
      assert.notEqual(n.v.key, was[k].v.key, 'with a name of its own');
    });
    was = now;
  }
  const missing = FAUNA_TURNS.roster.filter(k => !seen.has(k));
  assert.deepEqual(missing, [], `never came by in ${W}s: ${missing}; changes ${changes.join('; ')}`);
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
        assert.ok(wrap || Math.abs(p.x - was.x) <= stepMax + visitAt(c, t).v * FAUNA_MOTION.hop.burst * DT * 2 + 1 && Math.abs(p.y - was.y) <= stepMax + 1,
          `${kindAt(c, t)} ${c.i} jumped at ${t.toFixed(2)}s`);
        if (t > T0 + home + 0.01) assert.deepEqual(p, q, `${kindAt(c, t)} ${c.i} is not home ${(t - T0).toFixed(2)}s after`);
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
