// One hand for every place (DESIGN.md, "One resource system for every act",
// section 2): the yard, the deep and act 3 are lifted, held, thrown, caught
// and lifted again by the same calls (hands.js: `sweep`, `release`,
// `catchAir`), each place supplying only its ground plot.
//
// Driven the way input.js drives them: a press is `handTakes` then `sweep`, a
// drag is `sweep` again as the pointer moves, a flick is `track` and
// `release`, and the catch is the yard's own step while the hand is down. The
// setup a check is not about (the act on, goods granted, scales strewn) goes
// through the hooks.
import { group, ok, run, runUntil, yard, restartReloadClock } from './helpers.mjs';
import { P, KINDS, AFTER_PILES } from '../src/config.js';
import { capacity } from '../src/levels.js';
import { track, sweep, release, catchAir, handTakes, handHolds, heldGoods } from '../src/hands.js';
import { floor, deepBed, afterGround } from '../src/state.js';
import { bottomY, addGrain, grainsIn } from '../src/grid.js';
import { floorAt, afterX0, afterX1, AP } from '../src/after/place.js';
import { units, lying, stripOf, colX, rowY } from '../src/after/ground.js';
import { deepFloor, crusherRect } from '../src/deep/place.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];

// --- the moves ----------------------------------------------------------------
// A press where the hand's gate says there is something to take, and a drag
// across the points after it; the pointer goes where the hand goes.
function drag(points) {
  const [p0, ...rest] = points;
  if (!handTakes(p0.x, p0.y)) return false;
  S.dragging = true;
  S.trail = []; track(p0.x, p0.y); S.mouse = { ...p0 };
  sweep(p0.x, p0.y);
  for (const p of rest) { S.mouse = { ...p }; track(p.x, p.y); sweep(p.x, p.y); run(1 / 60); }
  return true;
}
// A flick up and to the right off `p`, three frames of the drag, let go.
function flick(p) {
  S.dragging = true;
  S.trail = []; track(p.x, p.y); S.mouse = { ...p };
  for (let k = 1; k <= 3; k++) { run(1 / 60); const q = { x: p.x + k * 20, y: p.y - k * 30 }; S.mouse = q; track(q.x, q.y); }
  S.dragging = false;
  release(S.mouse.x, S.mouse.y);
}
// A let-go held still: the trail is the one point.
function letGo(p) { S.dragging = false; S.trail = []; track(p.x, p.y); S.mouse = { ...p }; release(p.x, p.y); }
const empty = () => { S.held = 0; S.motes = []; S.trail = []; S.dragging = false; };
const mid = cs => ({ x: cs.reduce((a, c) => a + c.x, 0) / cs.length, y: cs.reduce((a, c) => a + c.y, 0) / cs.length });
// Six frames after the throw, the hand down where the thrown things are, and
// kept on them while it is held (game.js, the 'catch' step) until none is left.
function catchBack(air) {
  run(6 / 60);
  const thrown = air().length;
  if (!thrown) return { thrown, pressed: false, left: 0 };
  const at = mid(air());
  const pressed = handTakes(at.x, at.y);
  S.dragging = true; S.trail = []; track(at.x, at.y); S.mouse = { ...at };
  sweep(at.x, at.y);
  for (let k = 0; k < 60 && S.dragging && air().length; k++) { catchAir(S.mouse.x, S.mouse.y); S.mouse = mid(air().length ? air() : [S.mouse]); run(1 / 60); }
  S.dragging = false;
  return { thrown, pressed, left: air().length };
}

// --- the yard -----------------------------------------------------------------
const gx = () => floor.x + floor.cols * P / 2;
const gy = () => bottomY(floor) - P / 2;
function heap(n) { for (let i = 0; i < n; i++) addGrain(floor, gx()); }

group('the yard: a drag over a heap takes a hand of weight, a flick throws it, the air gives it back, and it lies to be lifted again', async () => {
  restartReloadClock();
  S.carryLevel = 3;
  const cap = capacity();
  heap(cap * 3);
  const before = grainsIn(floor);
  empty();
  const pressed = drag([{ x: gx(), y: gy() }, { x: gx() + P, y: gy() }, { x: gx() - P, y: gy() }]);
  const took = S.held, off = before - grainsIn(floor);
  // thrown up, caught in the air
  flick({ x: gx(), y: gy() - P * 4 });
  const air = () => S.chips.filter(c => !c.place && c.y < gy() - P * 4);
  const c = catchBack(air);
  const caught = S.held;
  // let go and left to fall: it lies on the floor, and a drag takes it
  const lyingBefore = grainsIn(floor);
  letGo({ x: gx(), y: gy() - P * 6 });
  runUntil(() => !S.chips.some(h => !h.place), 10);
  const again = grainsIn(floor) - lyingBefore;
  empty();
  drag([{ x: gx(), y: gy() }]);
  const second = S.held;
  empty();
  S.carryLevel = 0;
  return [
    ok(pressed && took === cap && off === cap, 'a drag over a heap takes exactly the hand\'s weight', JSON.stringify({ took, cap, off })),
    ok(c.thrown === cap && caught === cap && c.left === 0, 'thrown, every grain is caught back in the air', JSON.stringify({ caught, ...c })),
    ok(again === cap && second > 0, 'let go, it lands on the floor and is lifted again', `${second}; ${again} landed`)
  ];
});

// --- the deep -----------------------------------------------------------------
function deepFloorOf(n) {
  window.__deepCrew();
  S.portalOpen = true;
  window.__crew(0, 6);
  window.__looseScales(n);
}
// A column of the bed with scales on it, away from the furnace.
function bedSpot() {
  const c = crusherRect();
  let x = c.x + c.w + P * 12;
  for (let i = 0; i < 400; i++, x += P) if (handTakes(x, deepFloor() - P * 2)) return { x, y: deepFloor() - P * 2 };
  return { x: c.x + c.w + P * 12, y: deepFloor() - P * 2 };
}

group('the deep: its scales are lifted, caught and lifted again by the same hand, and the deep keeps no hand counter of its own', async () => {
  deepFloorOf(400);
  S.carryLevel = 3;
  const cap = capacity();
  empty();
  const spot = bedSpot();
  const lyingBefore = deepBed.n;
  const pressed = drag([spot, { x: spot.x + P * 2, y: spot.y }, { x: spot.x - P * 2, y: spot.y }, spot]);
  const took = S.held, off = lyingBefore - deepBed.n;
  const noCounter = !('heldScales' in S);
  // thrown into the water well clear of the furnace and caught as it sinks
  const up = { x: spot.x, y: deepFloor() - P * 40 };
  flick(up);
  const air = () => [...S.chips, ...S.sinking].filter(g => g.arc == null);
  const c = catchBack(air);
  const caught = S.held;
  // let go and left to sink: they lie on the bed, and a drag takes them
  letGo({ x: spot.x, y: deepFloor() - P * 30 });
  runUntil(() => S.sinking.length === 0 && !S.chips.some(h => h.place === 'deep'), 30);
  const second = (() => { empty(); drag([bedSpot()]); return S.held; })();
  empty();
  S.carryLevel = 0;
  return [
    ok(noCounter, 'the deep has no hand of its own on the state'),
    ok(pressed && took === cap && off === cap, 'a drag along the bed takes the hand\'s weight in scales, the same as dust', JSON.stringify({ took, cap, off })),
    ok(caught === took && c.left === 0, 'thrown into the water, they are caught back in the air', JSON.stringify({ caught, ...c })),
    ok(second > 0, 'and scales that came to lie on the bed are lifted again', `${second}`)
  ];
}, { reload: false });

// --- act 3 --------------------------------------------------------------------
function up() {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  window.__afterGrant({ timber: 12, logs: 4 });
  run(1);
  empty();
}
// The top block of a kind in a pile's strip: where a press takes it.
function topOf(kind) {
  const us = units().filter(u => u.kind === kind && !lying().some(q => q.id === u.ai));
  us.sort((a, b) => b.r0 - a.r0);
  const u = us[0];
  return u ? { x: colX(u.c0) + u.z * AP / 2, y: rowY(u.r0) - u.z * AP / 2 } : null;
}
// Open ground with nothing near it, well up off the floor.
function openSpot() {
  const strips = Object.keys(AFTER_PILES).map(stripOf).filter(Boolean);
  let x = afterX0() + AP * 30;
  const clear = x0 => strips.every(s => x0 < colX(s.c0) - AP * 16 || x0 > colX(s.c1) + AP * 16) && lying().every(q => Math.abs(q.x - x0) > AP * 16);
  while (x < afterX1() - AP * 30 && !clear(x)) x += P * 4;
  return { x, y: floorAt(x) - AP * 12 };
}
const done = () => { empty(); S.carryLevel = 0; window.__actsOn(null); };

group('act 3: a drag over mixed goods takes one kind up to the weight limit, a log\'s share is its weight, a plank\'s a quarter', async () => {
  up();
  restartReloadClock();
  const out = {};
  for (const lvl of [0, 3, 8]) {
    S.carryLevel = lvl;
    const cap = capacity();
    window.__afterGrant({ grovelogs: 6, timber: 12 });
    run(0.5);
    empty();
    const lg = topOf('log'), pl = topOf('plank');
    // across the log pile and back, with the hand kept down
    const a = drag(Array.from({ length: 24 }, (_, i) => ({ x: lg.x + (i % 3 - 1) * AP, y: lg.y + Math.floor(i / 3) * AP })));
    const logs = S.held, logKind = heldGoods() && heldGoods().kind;
    window.__afterGrant({ grovelogs: logs }); empty();
    const b = drag(Array.from({ length: 24 }, (_, i) => ({ x: pl.x + (i % 3 - 1) * AP, y: pl.y + Math.floor(i / 3) * AP })));
    const planks = S.held, plankKind = heldGoods() && heldGoods().kind;
    window.__afterGrant({ timber: planks }); empty();
    out[lvl] = { cap, a, b, logs, planks, logKind, plankKind, wantLog: Math.max(1, Math.floor(cap / KINDS.log.weight)), wantPlank: Math.max(1, Math.floor(cap / KINDS.plank.weight)) };
  }
  // one kind from ground where two lie together: a log set down against a plank
  S.carryLevel = 8;
  const spot = openSpot();
  window.__afterGrant({ grovelogs: 1, timber: 1 });
  empty();
  const lg = topOf('log');
  drag([lg]);
  letGo(spot);
  runUntil(() => !S.chips.some(c => c.place), 10);
  const pl = topOf('plank');
  empty();
  drag([pl]);
  letGo({ x: spot.x + AP * 4, y: spot.y });
  runUntil(() => !S.chips.some(c => c.place), 10);
  run(0.5);
  const lay = lying();
  const mixed = new Set(lay.map(q => q.kind)).size;
  const mx = mid(lay.map(q => ({ x: q.x + q.w / 2, y: q.y + q.w / 2 })));
  empty();
  drag([{ x: mx.x - AP * 3, y: mx.y }, { x: mx.x, y: mx.y }, { x: mx.x + AP * 3, y: mx.y }]);
  const one = new Set(S.motes.map(m => m.kind)).size;
  const all = f => [0, 3, 8].every(l => f(out[l]));
  done();
  return [
    ok(all(o => o.a && o.logs === o.wantLog && o.logKind === 'log'), 'a log\'s share is capacity over sixteen, never fewer than one', JSON.stringify(out)),
    ok(all(o => o.b && o.planks === o.wantPlank && o.plankKind === 'plank'), 'a plank\'s share is capacity over four, never fewer than one', JSON.stringify(out)),
    ok(handHolds('log') >= 1 && handHolds('plank') >= 1 && handHolds(null) === capacity(), 'and a grain is the hand\'s whole count'),
    ok(mixed === 2 && one === 1, 'a drag over a log and a plank lying together takes only one kind', JSON.stringify({ mixed, one, held: S.held }))
  ];
});

group('act 3: a thrown unit is caught in the air, and one that lands on the ground is swept up again', async () => {
  up();
  restartReloadClock();
  S.carryLevel = 8;
  window.__afterGrant({ timber: 12, grovelogs: 6 });
  run(0.5);
  empty();
  // caught in the air
  const p = topOf('plank');
  drag([p]);
  const took = S.held;
  flick(p);
  const airOf = () => S.chips.filter(c => c.place === 'after' && c.kind === 'plank');
  const c = catchBack(airOf);
  const caught = S.held, g = heldGoods();
  empty();
  // landed on open ground, then lifted again
  const t0 = lying().length;
  const spot = openSpot();
  window.__afterGrant({ timber: 0 });
  const q = topOf('plank');
  drag([q]);
  const second = S.held;
  letGo(spot);
  runUntil(() => !S.chips.some(h => h.place), 10);
  run(0.5);
  const lay = lying().filter(l => l.kind === 'plank');
  empty();
  const m = lay.length ? mid(lay.map(l => ({ x: l.x + l.w / 2, y: l.y + l.w / 2 }))) : spot;
  const pressed = drag([m, { x: m.x + AP * 2, y: m.y }, { x: m.x - AP * 2, y: m.y }]);
  const again = S.held, left = lying().filter(l => l.kind === 'plank').length;
  done();
  return [
    ok(took > 1 && c.thrown === took && c.pressed && caught === took && g && g.kind === 'plank' && c.left === 0, 'planks thrown up are caught back, every one', JSON.stringify({ took, caught, ...c })),
    ok(lay.length === second && lying().length >= t0, 'let go over open ground, they come down on it', JSON.stringify({ second, lying: lay.length })),
    ok(pressed && again === second && left === 0, 'and a press and drag over them takes every one again', JSON.stringify({ pressed, again, second, left }))
  ];
});
