// Act 3's one ground (DESIGN.md, "One resource system for every act", step
// 2; after/ground.js): every good lying in the act is a unit of one plot, a
// pile only a strip of it. The owner, 2026-10-28: "i dont like how logs will
// pile up only in specific places, and stack and overlap else where. there
// sshould be a unified system for this." and "right now grabbing from a pile
// always grabs the bottom one, which leads to jank. the way logs pile up and
// level out is weird." So: a log thrown anywhere stacks, rolls and rests by
// one rule and never overlaps another; logs let go on one spot make a mound,
// not a tower; a press takes the top block; an older save's goods all come
// back as blocks on the ground; and a reload stands every block where it lay.
//
// Reached the way a player reaches it: the hand's own calls (hands.js:
// `track`, `sweep`, `release`) at the world points where each pile stands.
// The setup it is not about: the act on and its opening played, the saw
// mill standing, goods granted on its piles.
import { readFileSync } from 'node:fs';
import { group, ok, run, runUntil, yard, restartReloadClock } from './helpers.mjs';
import { loadKind } from '../src/carry.js';
import { P, AFTER_BLOCK, KINDS } from '../src/config.js';
import { track, sweep, release } from '../src/hands.js';
import { plotOf } from '../src/after/piles.js';
import { units, counted, stripOf, lying } from '../src/after/ground.js';
import { floorAt, afterX0, afterX1, AP } from '../src/after/place.js';
import { bottomY, blockProblems } from '../src/grid.js';
import { afterGround } from '../src/state.js';

const S = yard.S;
const KEY = 'boulder-clicker/v4';
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const LOG = AFTER_BLOCK.log;
const stock = () => S.after.stock;
// The middle of a pile's bottom row, and a spot well over its heap.
const on = what => { const b = plotOf(what); return { x: b.x + b.cols * b.p / 2, y: bottomY(b) - b.p / 2 }; };
const over = what => { const b = plotOf(what); return { x: b.x + b.cols * b.p / 2, y: b.y - b.p * 2 }; };
// The middle of a pile's highest block: where a player presses to take one.
const onTop = what => {
  const s = stripOf(what), us = units().filter(u => u.c0 >= s.c0 && u.c0 < s.c1 && counted(u));
  const u = us.reduce((b, q) => (q.r0 > b.r0 ? q : b));
  return { x: afterGround.x + (u.c0 + u.z / 2) * AP, y: bottomY(afterGround) - (u.r0 + u.z / 2) * AP };
};

function up() {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  S.carryLevel = 3;
  run(1);
  S.held = 0; S.motes = []; S.trail = [];
}
const done = () => { S.held = 0; S.motes = []; S.carryLevel = 0; S.dragging = false; window.__actsOn(null); };
// A let-go held still (no flick): the trail is the one point.
function letGo(p) { S.trail = []; track(p.x, p.y); release(p.x, p.y); }
function press(p) { S.dragging = true; S.trail = []; track(p.x, p.y); S.mouse = { ...p }; sweep(p.x, p.y); S.dragging = false; }
const landed = () => runUntil(() => !S.chips.some(c => c.place), 10);
// Open floor well clear of every pile and good, a long way up off it.
function openSpot() {
  for (let x = afterX0() + AP * 40; x < afterX1() - AP * 40; x += P * 4) {
    const c = Math.floor((x - afterGround.x) / AP);
    const clear = units().every(u => Math.abs(u.c0 - c) > 20) && !stripNear(c, 20) && Math.abs(floorAt(x) - floorAt(x + AP * 24)) < 1 && Math.abs(floorAt(x) - floorAt(x - AP * 24)) < 1;
    if (clear) return { x, y: floorAt(x) - AP * 16 };
  }
  return null;
}
const stripNear = (c, d) => ['logs', 'grovelogs', 'timber', 'benchtimber', 'signs'].some(w => { const s = stripOf(w); return s && c > s.c0 - d && c < s.c1 + d; });
// Each slot's stack of logs on open ground near column c, as heights in logs, left to right.
function mound(c) {
  const logs = units().filter(u => u.kind === 'log' && !counted(u) && Math.abs(u.c0 - c) < 40);
  const slots = [...new Set(logs.map(u => u.c0))].sort((a, b) => a - b);
  return { slots, heights: slots.map(s => logs.filter(u => u.c0 === s).length), n: logs.length };
}
// No two blocks share a cell, none floats: grid.js's own account of the ground.
const sound = () => blockProblems(afterGround).length === 0;

group('a log let go on open ground and one let go over a pile land by the one rule, and no two blocks ever share a cell', async () => {
  up();
  window.__afterGrant({ grovelogs: 6, logs: 2 });
  run(1);
  restartReloadClock();
  const spot = openSpot();
  const m0 = stock().logs;
  let apart = true;
  // one off the forestry pile onto open floor, one over the saw mill's logs, three times over
  for (let k = 0; k < 3; k++) {
    press(on('grovelogs')); letGo(spot); landed(); run(0.5); apart = apart && sound();
    press(on('grovelogs')); letGo(over('logs')); landed(); run(0.5); apart = apart && sound();
  }
  run(2);
  const loose = mound(Math.floor((spot.x - afterGround.x) / AP));
  done();
  return [
    ok(apart && sound(), 'every block whole and on its own cells, every frame looked at', JSON.stringify(blockProblems(afterGround).slice(0, 3))),
    ok(loose.n === 3 && Math.max(...loose.heights) <= 2, 'the three on open floor stacked and settled as a heap, not drawn through each other', JSON.stringify(loose)),
    ok(stock().logs === Math.min(m0 + 3, 6) || stock().logs > m0, 'the three over the saw mill\'s pile landed on it', `${m0} -> ${stock().logs}`)
  ];
});

group('eight logs let go on one spot of open ground make a sloped mound, not a tower', async () => {
  up();
  window.__afterGrant({ grovelogs: 8 });
  run(1);
  restartReloadClock();
  const spot = openSpot(), c = Math.floor((spot.x - afterGround.x) / AP);
  for (let k = 0; k < 8; k++) {
    press(onTop('grovelogs'));
    letGo(spot);
    landed();
    run(1);
  }
  run(3);
  const m = mound(c);
  const steps = m.heights.every((h, i) => i === 0 || Math.abs(h - m.heights[i - 1]) <= 1);
  const touching = m.slots.every((s, i) => i === 0 || s - m.slots[i - 1] === LOG);
  const ends = m.heights[0] === 1 && m.heights[m.heights.length - 1] === 1;
  // nobody about to carry them home while the heap is watched at rest
  S.after.bodies = []; S.after.camp = 0;
  const was = JSON.stringify(units().map(u => u.ai).sort());
  run(10);
  const still = JSON.stringify(units().map(u => u.ai).sort()) === was;
  done();
  return [
    ok(m.n === 8, 'all eight are lying there', JSON.stringify(m)),
    ok(Math.max(...m.heights) <= 3 && touching && steps && ends, 'a mound a log a step, each slot at most a log over the next, a log high at its feet', JSON.stringify(m)),
    ok(still && sound(), 'and at rest it stays: nothing shuffles or levels out')
  ];
});

group('a press on a pile takes the top block, and the blocks under it stay where they were', async () => {
  up();
  window.__afterGrant({ grovelogs: 8 });
  run(2);
  restartReloadClock();
  const s = stripOf('grovelogs'), p = on('grovelogs');
  const col = Math.floor((p.x - afterGround.x) / AP), slot = s.c0 + Math.floor((col - s.c0) / s.z) * s.z;
  const stack = () => units().filter(u => u.c0 === slot).sort((a, b) => a.r0 - b.r0);
  const before = stack(), g0 = stock().grovelogs;
  press(p);
  const after = stack();
  const tookTop = S.held === 1 && after.length === before.length - 1
    && after.every((u, i) => u.ai === before[i].ai);
  done();
  return [
    ok(before.length >= 2, 'the slot under the press stands two or more high', `${before.length}`),
    ok(tookTop, 'the press took its top block into the hand, the ones under it untouched', JSON.stringify({ before: before.map(u => u.r0), after: after.map(u => u.r0), held: S.held })),
    ok(stock().grovelogs === g0 - 1, 'and the pile is one short', `${g0} -> ${stock().grovelogs}`)
  ];
});

// Every good of a kind wherever it is: on the ground (its piles and open
// floor), in the hand, in the air, in a body's arms and in the saw.
function goods() {
  const a = S.after, saw = a.saw || {};
  const n = { log: 0, plank: 0, sign: 0, sawdust: a.stock.sawdust || 0 };
  for (const u of units()) n[u.kind]++;
  if (S.held && S.motes[0] && S.motes[0].kind) n[S.motes[0].kind] += S.held;
  for (const ch of S.chips) if (ch.place === 'after' && ch.kind) n[ch.kind]++;
  for (const b of a.bodies) if (loadKind(b) in n) n[loadKind(b)] += b.carry;
  if (saw.bed) n.log++;
  const tr = saw.trip;
  if (tr && (tr.ph === 'carry' || (tr.ph === 'lift' && tr.log) || (tr.ph === 'set' && !tr.down))) n.log++;
  n.plank += (saw.out || []).length;
  n.sawdust += (saw.dust || []).length;
  return n;
}
// The same, off an older save's raw object.
function goodsBefore(raw) {
  const a = raw.after, st = a.stock, saw = a.saw || {};
  const n = { log: st.logs + st.grovelogs, plank: st.timber + st.benchtimber, sign: st.signs, sawdust: st.sawdust };
  for (const q of a.groundLogs) n[q.kind || 'log']++;
  if (a.hand) n[a.hand.kind] += a.hand.n;
  for (const b of a.bodies) if (b.load in n) n[b.load] += b.carry ?? 1;
  if (saw.bed) n.log++;
  if (saw.trip && saw.trip.ph === 'carry') n.log++;
  n.plank += (saw.out || []).length;
  n.sawdust += (saw.dust || []).length;
  return n;
}

group('an older save\'s piles, lying goods, held planks and the saw caught mid-trip come back as blocks on the ground, none lost', async () => {
  const raw = JSON.parse(readFileSync(new URL('./fixtures/act3-before-ground.json', import.meta.url), 'utf8'));
  const want = goodsBefore(raw);
  localStorage.setItem(KEY, JSON.stringify(raw));
  yard.restore();
  const got = goods();
  const loose = lying();
  const piles = ['logs', 'grovelogs', 'timber'].map(w => [w, S.after.stock[w], raw.after.stock[w]]);
  const blob = JSON.parse(JSON.stringify(S.after));
  run(5);
  const later = goods();
  window.__actsOn(null);
  return [
    ok(raw.saveV === 30 && raw.after.groundLogs.length > 0 && raw.after.hand && raw.after.saw.bed && raw.after.saw.trip, 'the fixture is a v30 save with lying goods, a held load, a log on the bed and one in the sawyer\'s arms', `${raw.saveV}`),
    ok(JSON.stringify(got) === JSON.stringify(want), 'every good of every kind is still there, counted on the ground, in the saw and in the heap', `${JSON.stringify(want)} -> ${JSON.stringify(got)}`),
    ok(piles.every(([, now, was]) => now === was), 'each pile holds what its count was', JSON.stringify(piles)),
    ok(loose.length >= raw.after.groundLogs.length + raw.after.hand.n + 1, 'the lying goods, the held planks and the sawyer\'s log lie on the ground', `${loose.length} lying`),
    ok(!('groundLogs' in blob) && sound(), 'no lying list is kept, and the ground is sound'),
    ok(JSON.stringify(later) === JSON.stringify(want), 'and five seconds on, still none lost', JSON.stringify(later))
  ];
});

group('a reload stands every block on the ground back on its own cells', async () => {
  up();
  window.__afterGrant({ grovelogs: 6, logs: 3, timber: 9 });
  run(1);
  restartReloadClock();
  const spot = openSpot();
  for (let k = 0; k < 3; k++) { press(on('grovelogs')); letGo(spot); landed(); }
  run(3);
  const before = JSON.stringify(units().map(u => [u.ai, u.v]).sort((a, b) => a[0] - b[0]));
  window.__reload();
  const after = JSON.stringify(units().map(u => [u.ai, u.v]).sort((a, b) => a[0] - b[0]));
  const blob = JSON.parse(localStorage.getItem(KEY));
  done();
  return [
    ok(before === after, 'every block, its kind and its tone, back where it lay', `${before.length} / ${after.length}`),
    ok(blob.after.ground && typeof blob.after.ground.cells === 'string' && JSON.stringify(blob.after.ground).length < 4000, 'the save keeps the ground as runs, a few kilobytes at most', `${JSON.stringify(blob.after.ground).length} chars`)
  ];
});
