// Act 3's goods by hand (DESIGN.md, "Act 3's goods are blocks, and bodies
// carry every one", rule 5): picked up as act 1's dust is. A sweep on a pile
// takes the blocks under the cursor into the hand and off the pile's stock,
// a let-go throws them, and a thrown block lands on a pile of its kind under
// it or lies on the floor for a gatherer to carry home. One kind in the
// hand: a hand of timber sweeps no logs.
//
// Driven through the hand's own calls (hands.js: `track`, `sweep`,
// `release`), at the world points where each pile's plot stands. The setup
// it is not about: the act on and its opening played, the saw mill
// standing, goods granted on its piles, the yard's carry bought up a rung
// (its own checks are the yard's).
import { group, ok, run, runUntil, yard, restartReloadClock } from './helpers.mjs';
import { P, RIM_PIECES, AFTER_BLOCK } from '../src/config.js';
import { capacity } from '../src/levels.js';
import { track, sweep, release, heldGoods, handTakes, handDown, handHolds } from '../src/hands.js';
import { layGood } from '../src/after/grove.js';
import { LADDER } from '../src/config.js';
import { plotOf, AFTER_PLOTS } from '../src/after/piles.js';
import { floorAt, afterX0, afterX1, AP } from '../src/after/place.js';
import { bottomY, addGrain, grainsIn } from '../src/grid.js';
import { floor } from '../src/state.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const stock = () => S.after.stock;
const laid = kind => S.after.groundLogs.filter(q => q.kind === kind);
const inAir = kind => S.chips.filter(c => c.place === 'after' && c.kind === kind).length;
// The middle of a pile's bottom row: a block is there whenever the pile has any.
const on = what => { const b = plotOf(what); return { x: b.x + b.cols * b.p / 2, y: bottomY(b) - b.p / 2 }; };
// Over a pile's heap, a couple of blocks up off its top, where a let-go
// falls straight onto it.
const over = what => { const b = plotOf(what); return { x: b.x + b.cols * b.p / 2, y: b.y - b.p * 2 }; };

function up(members = 0) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };   // the throne's speech is another check's
  if (members) {
    window.__afterCrowd((i, v) => (i < members ? RIM_PIECES : v));
    runUntil(() => window.__afterRead().walking === 0, 240);
  }
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  S.carryLevel = 3;
  window.__afterGrant({ timber: 12, logs: 4 });
  run(1);
  S.held = 0; S.motes = []; S.trail = [];
}
// A let-go held still (no flick): the trail is the one point.
function letGo(p) { S.trail = []; track(p.x, p.y); release(p.x, p.y); }
// Open floor: a spot no pile's plot nor anything lying is near, well up off
// the floor.
function openSpot() {
  let x = afterX0() + AP * 20;
  const clear = x0 => [-3, 0, 3].every(k => !AFTER_PLOTS.at(x0 + k * AFTER_BLOCK.plank * AP, floorAt(x0) - P * 2, AP * 6));
  while (x < afterX1() - AP * 20 && !clear(x)) x += P * 4;
  return { x, y: floorAt(x) - AP * 10 };
}
function down() { return runUntil(() => !S.chips.some(c => c.place), 10); }
const done = () => { S.held = 0; S.motes = []; S.carryLevel = 0; window.__actsOn(null); };

group('a sweep on the timber pile takes blocks into the hand, and a let-go over it puts them back', async () => {
  up();
  restartReloadClock();
  const t0 = stock().timber, logs0 = stock().logs;
  const p = on('timber');
  S.trail = []; track(p.x, p.y);
  sweep(p.x, p.y);
  const took = S.held, g = heldGoods(), t1 = stock().timber, cap = capacity();
  // a hand of timber over the log pile takes no logs
  const q = on('logs');
  sweep(q.x, q.y);
  const noLogs = S.held === took && stock().logs === logs0;
  // nor the yard's dust: a grain set on the floor stays there
  const yardHeld = S.held, gx = floor.x + floor.cols * P / 2;
  addGrain(floor, gx);
  const grains = grainsIn(floor);
  sweep(gx, bottomY(floor) - P / 2);
  const noDust = S.held === yardHeld && grainsIn(floor) === grains;
  letGo(over('timber'));
  const thrown = inAir('plank'), empty = S.held === 0 && S.motes.length === 0;
  const landed = down();
  const back = stock().timber, lying = laid('plank').length;
  done();
  return [
    ok(took > 0 && took <= cap && g && g.kind === 'plank', 'the sweep takes planks into the hand, as many as the brush finds and the carry holds', `${took} of ${cap}, ${JSON.stringify(g && g.kind)}`),
    ok(t1 === t0 - took, 'and each one off the pile\'s stock', `${t0} -> ${t1}`),
    ok(noLogs, 'a hand of timber sweeps no logs', `${S.held} held, ${stock().logs} logs`),
    ok(noDust, 'and no dust', `${yardHeld} -> ${S.held}`),
    ok(empty && thrown === took, 'let go, every plank leaves the hand as a thrown block', `${thrown} in the air`),
    ok(landed && back + lying === t0, 'they come down, not one lost', `${back} on the pile, ${lying} lying, from ${t0}`),
    ok(back >= t0 - 1, 'let go over the pile, they land on it', `${back} of ${t0}`)
  ];
});

group('logs carried in the hand across the camp, frame by frame, and let go over the saw mill\'s pile land on it', async () => {
  up();
  window.__afterGrant({ grovelogs: 6, logs: -stock().logs });
  run(1);
  restartReloadClock();
  const g0 = stock().grovelogs, m0 = stock().logs;
  const from = on('grovelogs'), to = over('logs');
  S.dragging = true;
  S.trail = []; track(from.x, from.y);
  S.mouse = { ...from };
  sweep(from.x, from.y);
  const took = S.held;
  // a second of the sim with the load on the cursor as it crosses; the
  // yard's catch runs every frame of it (game.js, 'catch')
  let kept = true;
  for (let k = 1; k <= 60; k++) {
    const p = { x: from.x + (to.x - from.x) * k / 60, y: from.y + (to.y - from.y) * k / 60 };
    S.mouse = p; track(p.x, p.y);
    run(1 / 60);
    kept = kept && S.held === took && stock().grovelogs === g0 - took;
  }
  S.dragging = false;
  letGo(to);
  const landed = down();
  const counts = { shack: stock().grovelogs, mill: stock().logs, lying: laid('log').length };
  done();
  return [
    ok(took > 0 && kept, 'held across the camp, the load stays in the hand and off the shack\'s pile', `${took} held`),
    ok(landed && counts.mill - m0 + counts.lying === took && counts.mill > m0, 'let go over the saw mill\'s pile, they land on it', JSON.stringify(counts))
  ];
});

group('let go over open ground, the blocks lie on the floor and a member carries them home', async () => {
  up(4);
  restartReloadClock();
  const t0 = stock().timber;
  const p = on('timber');
  S.trail = []; track(p.x, p.y);
  sweep(p.x, p.y);
  const took = S.held;
  const spot = openSpot();
  letGo(spot);
  const landed = down();
  const lying = laid('plank');
  const whole = lying.length === took && stock().timber === t0 - took;
  const near = lying.every(q => Math.abs(q.x - spot.x) <= AFTER_BLOCK.plank * AP * 2);
  const total = () => stock().timber + laid('plank').length + inAir('plank')
    + S.after.bodies.reduce((n, b) => n + (b.load === 'plank' ? b.carry || 0 : 0), 0);
  const home = runUntil(() => laid('plank').length === 0 && stock().timber === t0, 400);
  const kept = total() === t0;
  done();
  return [
    ok(took > 0 && landed && whole, 'let go over open ground, every plank comes down onto the floor', `${lying.length} of ${took} lying, ${stock().timber} on the pile`),
    ok(near, 'under where it was let go', lying.map(q => Math.round(q.x - spot.x)).join(' ')),
    ok(home && kept, 'and a member carries every one back to the timber pile', `${stock().timber} of ${t0}`)
  ];
});

group('goods in the hand when the game is saved are laid on the floor where they were held', async () => {
  up();
  restartReloadClock();
  const t0 = stock().timber;
  const p = on('timber');
  S.trail = []; track(p.x, p.y);
  sweep(p.x, p.y);
  const took = S.held;
  S.mouse = { x: p.x + AP * 30, y: p.y - AP * 6 };
  window.__reload();
  const lying = laid('plank');
  done();
  return [
    ok(took > 0 && S.held === 0, 'read back, nothing is on the cursor', `${took} held before`),
    ok(lying.length === took && stock().timber === t0 - took, 'every plank held is lying on the floor', `${lying.length} of ${took}`)
  ];
});

// A held block's weight goes by its size (hands.js, `handHolds`): one log
// however long the hand works the pile, planks a share of the hand by area
// with a floor, and the yard's dust the hand's whole count as before.
group('the hand holds one log, a share of planks by size, and a full hand of dust', async () => {
  up();
  window.__afterGrant({ grovelogs: 6 });
  run(1);
  restartReloadClock();
  const counts = {};
  for (const lvl of [3, 8]) {
    S.carryLevel = lvl;
    const cap = capacity();
    // a second of sweeping on the forestry shack's logs, frame by frame
    S.held = 0; S.motes = [];
    const g0 = stock().grovelogs, p = on('grovelogs');
    let most = 0;
    for (let k = 0; k < 60; k++) { S.mouse = { ...p }; sweep(p.x, p.y); run(1 / 60); most = Math.max(most, S.held); }
    const logs = { held: S.held, most, off: g0 - stock().grovelogs };
    window.__afterGrant({ grovelogs: logs.held }); S.held = 0; S.motes = [];
    // and on the saw mill's timber
    const t0 = stock().timber, q = on('timber');
    for (let k = 0; k < 60; k++) { S.mouse = { ...q }; sweep(q.x, q.y); run(1 / 60); }
    const planks = { held: S.held, off: t0 - stock().timber, want: Math.max(2, Math.floor(cap / 4)) };
    window.__afterGrant({ timber: planks.held }); S.held = 0; S.motes = [];
    // and the yard's dust, a heap set down on its floor
    const gx = floor.x + floor.cols * P / 2;
    for (let i = 0; i < cap * 3; i++) addGrain(floor, gx);
    for (let k = 0; k < 10; k++) { sweep(gx, bottomY(floor) - P / 2); run(1 / 60); }
    const dust = { held: S.held, cap };
    S.held = 0; S.motes = [];
    counts[lvl] = { logs, planks, dust };
  }
  done();
  const all = f => [3, 8].every(l => f(counts[l]));
  return [
    ok(all(c => c.logs.held === 1 && c.logs.most === 1 && c.logs.off === 1), 'swept for a second, the hand holds exactly one log, at any carry', JSON.stringify(counts)),
    ok(all(c => c.planks.held === c.planks.want && c.planks.off === c.planks.want), 'and planks: a quarter of the carry, never fewer than two', JSON.stringify(counts)),
    ok(all(c => c.dust.held === c.dust.cap), 'the yard\'s dust still fills the hand to its carry', JSON.stringify(counts))
  ];
});

// Caught on the way past (hands.js, `catchAir`): a block thrown up off a pile
// is taken back into the hand by a press on it in the air, as act 1's dust
// is. The press goes as input.js's pointerdown has it up there: the hand
// goes down only where the hand's own gate says there is something to take
// (`handTakes`), and the catch is the yard's step that runs every frame the hand is down
// (game.js, 'catch').
function press(p) {
  if (!handTakes(p.x, p.y)) return false;
  S.dragging = true;
  S.trail = []; track(p.x, p.y);
  S.mouse = { ...p };
  sweep(p.x, p.y);
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
// The middle of what is in the air.
const midOf = cs => ({ x: cs.reduce((a, c) => a + c.x, 0) / cs.length, y: cs.reduce((a, c) => a + c.y, 0) / cs.length });
// Six frames after the throw, a press (`down`) where the thrown things are,
// and the hand kept on them while it is held, until none is left in the air
// or a second has gone.
function catchBack(air, down = press) {
  run(6 / 60);
  const thrown = air().length;
  const pressed = thrown > 0 && down(midOf(air()));
  for (let k = 0; k < 60 && S.dragging && air().length; k++) { S.mouse = midOf(air()); track(S.mouse.x, S.mouse.y); run(1 / 60); }
  return { thrown, pressed, left: air().length };
}
const airOf = kind => () => S.chips.filter(c => c.place === 'after' && c.kind === kind);

group('a log thrown up off the forestry pile is caught back into the hand by a press on it in the air', async () => {
  up();
  window.__afterGrant({ grovelogs: 6 });
  run(1);
  restartReloadClock();
  const g0 = stock().grovelogs, p = on('grovelogs');
  press(p);
  const took = S.held;
  flick(p);
  const c = catchBack(airOf('log'));
  const g = heldGoods(), held = S.held, off = g0 - stock().grovelogs, lying = laid('log').length;
  S.dragging = false;
  done();
  return [
    ok(took === 1 && c.thrown === 1, 'the log is swept up and thrown', JSON.stringify({ took, ...c })),
    ok(c.pressed && held === 1 && g && g.kind === 'log' && c.left === 0, 'a press on it in the air catches it back into the hand', JSON.stringify({ held, kind: g && g.kind, ...c })),
    ok(off === 1 && lying === 0, 'still off the pile and nowhere else', JSON.stringify({ off, lying }))
  ];
});

group('planks thrown up off the timber pile are caught back, every one', async () => {
  up();
  restartReloadClock();
  const t0 = stock().timber, p = on('timber');
  press(p);
  const took = S.held;
  flick(p);
  const c = catchBack(airOf('plank'));
  const g = heldGoods(), held = S.held, off = t0 - stock().timber, lying = laid('plank').length;
  S.dragging = false;
  done();
  return [
    ok(took >= 2 && c.thrown === took, 'the planks are swept up and thrown', JSON.stringify({ took, ...c })),
    ok(c.pressed && held === took && g && g.kind === 'plank' && c.left === 0, 'a press on them in the air catches every one back', JSON.stringify({ held, ...c })),
    ok(off === took && lying === 0, 'still off the pile and nowhere else', JSON.stringify({ off, lying }))
  ];
});

// The control: the yard's dust, which a mouse press anywhere in the yard
// takes the hand down for (input.js, the press's last line), caught as it
// always was.
group('the yard\'s dust thrown up is still caught back by a press on it', async () => {
  restartReloadClock();
  S.carryLevel = 3;
  const gx = floor.x + floor.cols * P / 2, gy = bottomY(floor) - P / 2;
  for (let i = 0; i < capacity() * 2; i++) addGrain(floor, gx);
  S.held = 0; S.motes = [];
  S.dragging = true; S.trail = []; track(gx, gy); S.mouse = { x: gx, y: gy };
  for (let k = 0; k < 6 && S.held < capacity(); k++) sweep(gx, gy);
  const took = S.held;
  flick({ x: gx, y: gy - P * 4 });
  const air = () => S.chips.filter(c => !c.place && c.y < gy - P * 4);
  const yardPress = p => { S.dragging = true; S.trail = []; track(p.x, p.y); S.mouse = { ...p }; sweep(p.x, p.y); return true; };
  const c = catchBack(air, yardPress);
  const held = S.held;
  S.dragging = false; S.held = 0; S.motes = []; S.carryLevel = 0;
  return [
    ok(took > 0 && c.thrown === took && held === took && c.left === 0, 'every grain thrown is caught back', JSON.stringify({ took, held, ...c }))
  ];
});

// Picked up again where it came down: a block thrown onto open floor is the
// hand's as a pile's blocks are (after/piles.js, AFTER_PLOTS `at`), as act
// 1's dust is the hand's wherever it lies. A press on it, then the hold
// dragged over each block lying there (input.js's pointermove sweeps).
function repick(kind) {
  const lying = laid(kind);
  const mid = q => ({ x: q.x + AFTER_BLOCK[kind] * AP / 2, y: floorAt(q.x + AP) - AFTER_BLOCK[kind] * AP / 2 });
  const pressed = lying.length > 0 && press(mid(lying[0]));
  for (const q of lying) { const m = mid(q); S.mouse = m; track(m.x, m.y); sweep(m.x, m.y); run(1 / 60); }
  return pressed;
}
// Thrown off `what` onto open floor and let come down and settle.
function throwDown(what) {
  const p = on(what);
  press(p);
  const took = S.held;
  S.dragging = false;
  letGo(openSpot());
  down();
  run(0.5);
  return took;
}

group('a log thrown onto open floor is picked up again by a press and hold on it', async () => {
  up();
  window.__afterGrant({ grovelogs: 6 });
  run(1);
  restartReloadClock();
  const g0 = stock().grovelogs;
  const took = throwDown('grovelogs');
  const lying = laid('log').length;
  const pressed = repick('log');
  const g = heldGoods(), held = S.held;
  S.dragging = false;
  done();
  return [
    ok(took === 1 && lying === 1, 'the log comes down on the floor', JSON.stringify({ took, lying })),
    ok(pressed && held === 1 && g && g.kind === 'log' && laid('log').length === 0, 'a press on it takes it back into the hand', JSON.stringify({ pressed, held, kind: g && g.kind, left: laid('log').length })),
    ok(g0 - stock().grovelogs === 1, 'and the forestry pile is one short, not two', `${g0} -> ${stock().grovelogs}`)
  ];
});

group('planks thrown onto open floor are picked up again, every one', async () => {
  up();
  restartReloadClock();
  const t0 = stock().timber;
  const took = throwDown('timber');
  const lying = laid('plank').length;
  const pressed = repick('plank');
  const g = heldGoods(), held = S.held;
  S.dragging = false;
  done();
  return [
    ok(took >= 2 && lying === took, 'the planks come down on the floor', JSON.stringify({ took, lying })),
    ok(pressed && held === took && g && g.kind === 'plank' && laid('plank').length === 0, 'a press and hold over them takes every one back', JSON.stringify({ pressed, held, left: laid('plank').length })),
    ok(t0 - stock().timber === took, 'and the timber pile is short by just those', `${t0} -> ${stock().timber}`)
  ];
});

group('blocks lying on the floor are still there after a reload, and still the hand\'s', async () => {
  up();
  restartReloadClock();
  const took = throwDown('timber');
  const before = laid('plank').map(q => Math.round(q.x)).sort((a, b) => a - b).join(' ');
  window.__reload();
  run(0.5);
  const after = laid('plank').map(q => Math.round(q.x)).sort((a, b) => a - b).join(' ');
  const pressed = repick('plank');
  const held = S.held;
  S.dragging = false;
  done();
  return [
    ok(took >= 2 && before === after, 'read back, every plank lies where it lay', `${before} / ${after}`),
    ok(pressed && held === took, 'and a press and hold picks them up', `${held} of ${took}`)
  ];
});

// A held drag sweeps as act 1's does: the press takes the hand down wherever
// it lands (hands.js `handDown`, input.js's press on goods or on bare ground
// up there and anywhere in the yard), and every move while it is held sweeps
// under the pointer (input.js's pointermove), a frame of the game apart, so
// everything of the hand's kind the brush passes over joins the hand until
// it is full. Let go at the end.
function drag(from, to, n = 40) {
  handDown(from.x, from.y);
  S.mouse = { ...from };
  const seen = [];
  for (let k = 1; k <= n; k++) {
    const p = { x: from.x + (to.x - from.x) * k / n, y: from.y + (to.y - from.y) * k / n };
    S.mouse = p; track(p.x, p.y); sweep(p.x, p.y);
    run(1 / 60);
    seen.push({ x: p.x, held: S.held });
  }
  return seen;
}
const release0 = p => { S.dragging = false; letGo(p); down(); };
// Two planks laid on the floor just past the timber mound's far side, a
// plank's width apart, and let settle; the row the drag runs along.
function mound() {
  const b = plotOf('timber'), y = bottomY(b) - b.p / 2, right = b.x + (b.cols + 2) * b.p;
  return { b, y, right, end: b.x + (b.cols + 1) * b.p };
}
function layTwo(m) {
  layGood('plank', m.right, floorAt(m.right) - P * 2);
  layGood('plank', m.right + P * 4, floorAt(m.right) - P * 2);
  run(0.6);
}
// Bare ground past the planks: nothing of any pile's or the floor's within a
// brush of it.
function bareRightOf(m, y) {
  let x = m.right + P * 14;
  while (AFTER_PLOTS.at(x, y, P * 6)) x += P * 2;
  return x;
}

group('a drag begun on a lying plank goes on over the timber mound, sweeping planks the whole way to a full hand', async () => {
  up();
  S.carryLevel = LADDER;
  restartReloadClock();
  const m = mound();
  layTwo(m);
  const t0 = stock().timber, holds = handHolds('plank'), lying0 = laid('plank').length;
  const first = laid('plank').sort((a, b) => b.x - a.x)[0];
  const from = { x: first.x + AP, y: m.y }, to = { x: m.b.x + m.b.p, y: m.y };
  const seen = drag(from, to);
  const atMound = seen.find(q => q.x < m.end);
  const held = S.held, g = heldGoods(), off = t0 - stock().timber, left = laid('plank').length;
  release0(to);
  done();
  return [
    ok(lying0 === 2 && holds > 2, 'two planks lie past the mound, and the hand holds more than two', JSON.stringify({ lying0, holds })),
    ok(atMound && atMound.held <= 2 && left === 0, 'the press on one and the drag over the other take both', JSON.stringify({ atMound, left })),
    ok(held === holds && g && g.kind === 'plank' && off === holds - 2, 'and on over the mound the hand fills with its planks, and no more', JSON.stringify({ held, holds, off }))
  ];
});

group('a drag begun on bare ground up there sweeps the planks and the mound it crosses', async () => {
  up();
  S.carryLevel = LADDER;
  restartReloadClock();
  const m = mound();
  layTwo(m);
  const x = bareRightOf(m, m.y);
  const bare = !handTakes(x, m.y);
  const t0 = stock().timber, holds = handHolds('plank');
  const from = { x, y: m.y }, to = { x: m.b.x + m.b.p, y: m.y };
  const seen = drag(from, to, 60);
  const atFirst = seen[0].held;
  const held = S.held, off = t0 - stock().timber, left = laid('plank').length;
  release0(to);
  done();
  return [
    ok(bare && atFirst === 0, 'the press is on bare ground, and takes nothing there', JSON.stringify({ bare, atFirst })),
    ok(left === 0 && held === holds && off === holds - 2, 'dragged across, it sweeps up the planks lying there and fills from the mound', JSON.stringify({ held, holds, off, left }))
  ];
});

// The control: the yard's dust, a heap on the floor, the drag begun off it
// on bare floor and run across it, as it always was.
group('the yard\'s dust is swept by a drag across it begun on bare floor, to a full hand', async () => {
  restartReloadClock();
  S.carryLevel = 3;
  const gx = floor.x + floor.cols * P / 2, gy = bottomY(floor) - P / 2;
  for (let i = 0; i < capacity() * 3; i++) addGrain(floor, gx);
  S.held = 0; S.motes = [];
  const seen = drag({ x: gx + P * 60, y: gy }, { x: gx - P * 20, y: gy }, 60);
  const atFirst = seen[0].held, held = S.held, cap = capacity();
  S.dragging = false; S.held = 0; S.motes = []; S.carryLevel = 0;
  return [
    ok(atFirst === 0 && held === cap, 'nothing at the press, and a full hand of dust by the end', JSON.stringify({ atFirst, held, cap }))
  ];
});
