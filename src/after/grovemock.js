// MOCK grove: act 3's grove redesign, shown live in the real game on the
// review bench (review 'act 3: the grove'), never merged. Every line here is
// mock code; the real game is untouched while `globalThis.__groveMock` is
// unset, and the scenes in src/scenes.js are the only thing that sets it.
//
// The owner's calls (2026-10-28), each an option of its own: a tree planted
// from a cone carried in, by a worker or by the hand (A1, A2); grown cell by
// cell, two ways (B1, B2); felled with today's smooth tip, its crown breaking
// into pieces that scatter and fade (C, the one fade the owner allowed);
// bucked log by log at a tool, the trunk shortening until it is used up
// (D1 a saw, D2 an axe); the woodcutter carrying its tool and working by
// contact (E); and the hand's own work: the saw (F1), the axe (F2), the
// stump dug and carried off whole (F3).
//
// The director: one step a frame on the game clock (`STEPS`, as the saw
// mill's hand scene), a phase machine per option. It plays plot 0 through
// the real plot fields (stage, stump, fall, chops: the real fall, the real
// saw and stump gestures, `chopTree`) and keeps the rest -- the lying trunk,
// the logs still in it, the cut, the bodies, the cone, the cursor -- in `M`,
// read by render/after/grovemock.js. A log cut free becomes a real unit of
// the act's ground (`putSomewhere`, as a felled tree's logs do today), so
// the logs add up on the real ground in their real look.

import { S } from '../state.js';
// the frame's steps are handed in by the scene (game.js imports the drawing, which imports this)
import { P, TREE_CHOPS, AFTER_WALK, GESTURE_SAW_AMP, GESTURE_STRAIN_S, AFTER_DIG_CLICKS, ACT_GATES_CELL, AFTER_SEED_BUNDLE, AFTER_FALL_BOUNCE_S } from '../config.js';
import { plotX, groundOf, floorAt, stationDoor, AP, PINE_GROWN, basketBox } from './place.js';
import { chopTree, digStump } from './grove.js';
import { putSomewhere, tag, fallTag, takeAt } from './ground.js';
import { cellOf } from '../grid.js';
import { source, sink } from '../flow.js';
import { gestureDown, gestureMove, gestureUp, partsOf, gestureView } from './gestures.js';

// --- the mock pine ------------------------------------------------------------------
// One tree for every option, so they combine: a trunk four cells wide (a
// log's width) whose length between the stump and the crown is exactly its
// logs end to end, LOGS of them a LOG cells long, so the pieces add up. The
// trunk spans columns -2..1 off the plot's column, so it and every row of
// the crown are an even number of cells wide, centered on the plot line
// with no half cell. Rows count up from the floor: row -1 the bottom.
export const MT = { c0: -2, w: 4, stump: 4, logs: 4, log: 4,   // the stump a whole log's block, its cut a log up (the owner: the saw higher off the floor)
  // the crown's tiers, the lowest first: h rows, its top row `top` cells wide,
  // a cell wider a side every row down
  tiers: [{ h: 6, top: 6 }, { h: 5, top: 4 }, { h: 4, top: 2 }] };
export const TRUNK_H = MT.logs * MT.log;               // the trunk past the stump, cells
export const TRUNK_TOP = -(MT.stump + TRUNK_H);        // its top row
// The crown's shapes (the owner: "lets try a few diff tree crown designs. it
// looks a bit unbalanced"), each rows top to bottom as [width, tier], every
// width even so the row is centred on the trunk's middle line, the bottom
// row on the trunk's top: 0 the pine as it was, from its tiers;
//   1 a classic tiered pine: four tiers stepped evenly, each two cells wider
//     at its foot than the last, a point on top
//   2 a tall narrow spruce: a slim column tapering to a point, eased in at
//     its foot
//   3 a round broadleaf crown: full and round on the trunk (as an acorn tree)
const tierRows = tiers => tiers.slice().reverse().flatMap(({ h, top }, k) => Array.from({ length: h }, (_, j) => [top + 2 * j, tiers.length - 1 - k]));
const band = (ws, n) => ws.map((w, i) => [w, Math.floor(i / n)]);
export const CROWN_ROWS = {
  0: tierRows(MT.tiers),
  1: [[2, 0], [4, 0], [6, 0], [8, 0], [4, 1], [6, 1], [8, 1], [10, 1], [6, 2], [8, 2], [10, 2], [12, 2], [8, 3], [10, 3], [12, 3], [14, 3]],
  2: band([2, 2, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 8, 10, 10, 10, 10, 8, 6], 5),
  3: band([8, 12, 14, 16, 18, 18, 20, 20, 20, 20, 18, 18, 16, 14, 10], 99)   // one mass, as wide as a plot holds: only its underside in shadow
};
// The oaks (the owner, on CR-3: "can it look more like an oak tree?"): a
// crown of lumpy clumps, each a disc [x, y, radius] in cells (x off the
// trunk's middle line, y up from the trunk's top), mirrored either side so
// the mass balances; sky showing where the clumps leave gaps; boughs in the
// log's darkest brown from the trunk's top out to each side clump, seen only
// through the gaps. The lowest clumps hang over the trunk's top, so the
// trunk reads shorter, but it is still its four logs under the leaves. Never
// wider than a big pine's foot (OAK_HALF a side), so a plot holds it.
//   4 OAK-1 broad and spreading: wider than tall, three clumps a side
//   5 OAK-2 a dome of clumps: a tall middle clump, two a side and one low
//   6 OAK-3 gnarled: two great side clumps on two boughs, a notch between
const mirror = lobes => lobes.flatMap(([x, y, r]) => (x ? [[x, y, r], [-x, y, r]] : [[x, y, r]]));
export const OAKS = {
  4: mirror([[0, 3.5, 4.6], [0, 8, 3], [4.4, 4.5, 3.8], [5.8, -1.5, 3.2], [2.4, -3, 3]]),
  5: mirror([[0, 7.5, 4.4], [3.8, 3.5, 3.8], [6, -1.5, 3], [0, -2.5, 3.4]]),
  6: mirror([[4.6, 2.5, 4.3], [0, 7.5, 3.2], [7.2, -2.5, 1.8]])
};
const OAK_HALF = 9;
function oakCells(lobes) {
  const out = [], leaf = new Set(), inLobe = (cx, cy) => lobes.some(([x, y, r]) => (cx - x) ** 2 + (cy - y) ** 2 <= r * r);
  for (let y = 16; y >= -8; y--) for (let c = -OAK_HALF; c < OAK_HALF; c++) {
    const cx = c + 0.5, cy = y - 0.5;
    // each leaf the clump it sits deepest in, as its tier: the crown's shading and its breaking go by clump
    if (inLobe(cx, cy)) { const k = lobes.reduce((b, [x, y, r], i) => (Math.hypot(cx - x, cy - y) - r < Math.hypot(cx - lobes[b][0], cy - lobes[b][1]) - lobes[b][2] ? i : b), 0); leaf.add(`${c}|${y}`); out.push([c, TRUNK_TOP - y, 'crown', k]); }
  }
  // the trunk carried on up into the crown as its leader, to the leaves over it
  for (let c = MT.c0 + 1; c < MT.c0 + MT.w - 1; c++) for (let y = 1; y <= 16 && !leaf.has(`${c}|${y}`); y++) out.push([c, TRUNK_TOP - y, 'bough', 0]);
  // boughs: from the trunk's top out to each clump off the middle, where the leaves leave them showing
  for (const [x, y] of lobes) {
    if (Math.abs(x) < 2) continue;
    const x0 = Math.sign(x) * 1, steps = 24;
    for (let k = 0; k <= steps; k++) {
      const cx = x0 + (x - x0) * k / steps, cy = 0 + y * k / steps, c = Math.floor(cx), yy = Math.ceil(cy);
      const key = `${c}|${yy}`;
      if (yy > 0 && !leaf.has(key) && Math.abs(c + 0.5) > MT.w / 2 - 0.01 && !out.some(q => q[0] === c && q[1] === TRUNK_TOP - yy)) out.push([c, TRUNK_TOP - yy, 'bough', 0]);
    }
  }
  return out;
}
// The tree's cells [c, r, part, tier], part 'stump', 'trunk' or 'crown',
// for the crown shape the option names (M.crown), worked out once a shape.
const CELLS = new Map();
export function treeCells() {
  const key = M.crown || 0;
  if (CELLS.has(key)) return CELLS.get(key);
  const out = [];
  for (let r = -1; r >= -MT.stump; r--) for (let c = MT.c0; c < MT.c0 + MT.w; c++) out.push([c, r, 'stump']);
  for (let r = -MT.stump - 1; r >= TRUNK_TOP; r--) for (let c = MT.c0; c < MT.c0 + MT.w; c++) out.push([c, r, 'trunk']);
  if (OAKS[key]) out.push(...oakCells(OAKS[key]));
  else {
    const rows = CROWN_ROWS[key];
    rows.forEach(([wd, ti], i) => { const r = TRUNK_TOP - rows.length + i; for (let c = -wd / 2; c < wd / 2; c++) out.push([c, r, 'crown', ti]); });
  }
  CELLS.set(key, out);
  return out;
}
// The tree's shape at fraction f of its growth, all over at once (B2): the
// trunk and every tier scaled, each a whole number of cells, an even width;
// at f = 1 exactly the grown pine.
export function grownShape(f) {
  if (f >= 1) return treeCells();
  const out = [], even = v => Math.max(2, 2 * Math.round(v / 2));
  const tw = f < 0.3 ? 2 : MT.w, c0 = -tw / 2;
  const th = Math.max(1, Math.round((MT.stump + TRUNK_H) * f));
  for (let r = -1; r >= -th; r--) for (let c = c0; c < c0 + tw; c++) out.push([c, r, r >= -MT.stump ? 'stump' : 'trunk']);
  const n = f < 0.2 ? 1 : f < 0.5 ? 2 : 3, tiers = MT.tiers.slice(MT.tiers.length - n);
  let r0 = -th - 1;
  tiers.forEach(({ h, top }) => {
    const hh = Math.max(2, Math.round(h * Math.max(f, 0.3))), tt = even(top * f);
    for (let j = hh - 1; j >= 0; j--) {
      const wd = tt + 2 * j, r = r0 - (hh - 1 - j);
      for (let c = -wd / 2; c < wd / 2; c++) out.push([c, r, 'crown']);
    }
    r0 -= hh;
  });
  return out;
}
// The order the cells come in row by row (B1): the stump and trunk from the
// ground up, then the crown from its lowest row up, each row from the middle
// out.
const ROWWISE = new Map();
export function rowOrder() {
  const key = M.crown || 0;
  if (ROWWISE.has(key)) return ROWWISE.get(key);
  const cells = treeCells().slice();
  cells.sort((a, b) => (b[1] - a[1]) || (Math.abs(a[0] + 0.5) - Math.abs(b[0] + 0.5)) || (a[0] - b[0]));
  ROWWISE.set(key, cells);
  return cells;
}

// --- where things stand, world px ------------------------------------------------------
export const bx = () => plotX(0);
export const fl = () => groundOf('tree');   // the grove's shelf (place.js, GROVE_MOCK_SHELF)
// The first plot stands by the forestry shack (the owner's layout), so a
// tree there falls away from it, to the left: the scripts work as if it fell
// right, and the drawing and everything laid on the real ground is that
// turned about the plot's middle line (`mx`), for the options with a fall.
export const mx = x => (M.flip ? 2 * bx() - x : x);
const floorM = x => floorAt(mx(x));
// The fall's pivot: the trunk's right edge on the stump's top. Lying, the
// trunk runs right from here along the floor.
export const pivotX = () => bx() + (MT.c0 + MT.w) * AP;
// The cut that takes the next log off the far end of a trunk with `n` logs left.
export const cutX = n => pivotX() + (n - 1) * MT.log * AP;
// The trunk's top while it lies, world y: where a body standing on it has its feet.
export const trunkTop = () => fl() - MT.w * AP;
const BODY = 3 * P;
// A body's hand, off its left edge and its feet, facing right; the tools'
// shapes (render/after/grovemock.js) off the hand, the handle level: the
// axe's edge, and its head's far face.
export const GRIP = { dx: BODY - 3, dy: -9 };
export const AXE_BIT = [3.5 * AP, 1.5 * AP];
export const AXE_FRONT = 4.5 * AP;
export const HAND_AXE_FRONT = 6.5 * AP;               // the hand's, its handle longer to show past the fist
// The saw held upright in a cut, its blade down the cut line: the grip four
// cells over the blade's tip, the tip as deep as the cut.
export const SAW_ANG = Math.PI / 2, SAW_TIP = 4 * AP;
// A body standing on the trunk to cut the log off its end with `n` logs
// left, facing the cut, where its tool meets the top of the trunk at it.
const onTrunkAt = (n, tool) => (tool === 'saw' ? cutX(n) - BODY - 1 : cutX(n) - GRIP.dx - AXE_BIT[0]);

// --- the mock's state ------------------------------------------------------------------
// Nothing on S: this session's, cleared when the scene changes.
export const M = {
  opt: null, mine: null, ph: '', t: 0, T: 0,
  logs: 0,            // logs still in the lying trunk (0: none lying)
  cut: 0,             // the cut under way at the trunk's far end, 0..1 of the way through
  roll: null,         // a log cut free, tumbling off the end: { x (its left before), at }
  grow: null,         // { kind 'b1' | 'b2', at, dur } growing from the cone
  cone: null,         // { state 'lying' | 'held' | 'falling' | 'set' | 'in', x, y, at }
  bodies: [],         // { x (left), y (feet), face, tool 'axe' | 'saw' | null, pose, ang, s, carry, squat }
  cursor: null,       // the player's hand: { x, y, pose, tool, ang }
  ghost: null,        // the ghost hand teaching: { x, y, pose, tool, ang }
  notch: 0,           // the felling cut, cells into the trunk from the left
  sawAt: null,        // F1's handsaw: across the standing trunk, or `buck` in the hand
  stumpOut: null,     // F3: the stump pulled out whole, { x, y }
  landed: null,       // when the tree last hit the ground: its crown breaks from then
  from: null,
  placed: []          // the ground units the mock laid, taken up again on a loop
};
const plot = () => S.after.plots[0];
const go = ph => { M.ph = ph; M.t = 0; };
const ease = u => u * u * (3 - 2 * u);
const lerp = (a, b, k) => a + (b - a) * k;

const PLOT0 = { fall: null, fell: null, chops: 0, chip: null, dug: 0, big: false, at: null, grow: 0, logs: 0 };
// The trunk's logs each a shade of the log's four, picked once a tree (and
// the stump's, which is a log's block too), kept by each log cut off it.
function shades() { M.tones = Array.from({ length: MT.logs }, () => Math.floor(Math.random() * 4)); M.stumpTone = Math.floor(Math.random() * 3); }   // the stump never the darkest shade, which is its roots'
function standTree() { Object.assign(plot(), PLOT0, { stage: PINE_GROWN, stump: false }); M.landed = null; M.logs = 0; M.notch = 0; shades(); }
function felledPlot() { Object.assign(plot(), PLOT0, { stage: 0, stump: true }); shades(); }
function barePlot() { Object.assign(plot(), PLOT0, { stage: 0, stump: false }); shades(); }
// The logs the mock laid taken up again, so a loop starts as it began.
function takeBack() {
  for (const ai of M.placed) if (takeAt(ai)) sink('log', 1, 'mock');
  M.placed.length = 0;
}
// A log cut free and come to rest at left x on the floor: a unit of the
// act's one ground from now on, sliding into its slot from where it stopped.
// `tone` the shade it had in the trunk; x as the script has it, turned onto
// the real ground with the drawing.
function layLog(x, tone) {
  source('log', 1, 'tree');
  const wx = M.flip ? 2 * bx() - x - MT.log * AP : x;
  const ai = putSomewhere(cellOf('log', tone), wx + MT.log * AP / 2);
  if (ai < 0) return;
  tag(ai, { i: 0, x0: wx, at: S.after.t });
  M.placed.push(ai);
}

// --- the bodies' motion ----------------------------------------------------------------
function walkTo(b, x, dt, y = null) {
  const d = x - b.x, s = AFTER_WALK * dt;
  if (Math.abs(d) > 0.5) b.face = Math.sign(d);
  b.x = Math.abs(d) <= s ? x : b.x + Math.sign(d) * s;
  b.y = y ?? floorM(b.x + BODY / 2);
  return b.x === x;
}
// A hop from `from` to `to` (left, feet), k of the way: a smooth arc.
function hop(b, from, to, k, rise = AP * 3) {
  const e = ease(k);
  b.x = lerp(from.x, to.x, e); b.y = lerp(from.y, to.y, e) - Math.sin(Math.PI * k) * rise;
}
// The axe's blow (the animation feel: held poses, a visible smear): wound up
// and held, the swing in a frame or two with its smear, the blow held on the
// wood, and back. `ang` the axe off the facing (0 level forward, negative
// up), read by the drawing; true on the frame of contact.
export const SWING = { up: 0.34, fly: 0.07, held: 0.24, back: 0.2 };
const BLOW_S = SWING.up + SWING.fly + SWING.held + SWING.back;
function swing(b, t, upAng, hitAng) {
  const { up, fly, held } = SWING;
  if (t < up) { b.pose = 'up'; b.ang = upAng; return false; }
  if (t < up + fly) { b.pose = 'fly'; b.ang = lerp(upAng, hitAng, (t - up) / fly); b.from = upAng; return false; }
  if (t < up + fly + held) { const first = b.pose !== 'hit'; if (first) b.hitAt = S.after.t; b.pose = 'hit'; b.ang = hitAng; return first; }
  b.pose = 'back'; b.ang = lerp(hitAng, -0.9, ease((t - up - fly - held) / SWING.back));
  return false;
}

// Bucking, shared by D1, D2, E and F1: one log at a time off the far end.
// `work(dt)` advances the cut and returns true when it is through; the log
// then tumbles off the end and is laid; then `after(dt)` steps to the next
// ('step') or finishes ('last', one log left: it is a log already).
export const ROLL_S = 0.5;
function buckStep(dt, work, after) {
  if (M.ph === 'cut') {
    if (work(dt)) { M.roll = { x: cutX(M.logs), at: S.after.t }; M.cut = 0; go('roll'); }
  } else if (M.ph === 'roll') {
    if (M.t >= ROLL_S) {
      layLog(M.roll.x + MT.log * AP, M.tones[M.logs - 1]);
      M.roll = null; M.logs -= 1;
      go(M.logs > 1 ? 'step' : 'last');
    }
  } else if (M.ph === 'step' || M.ph === 'last') after(dt);
}
// D1, D2 and E's bucking: the body on the trunk, its tool at the cut; a step
// along to the next; on the last log, a hop down onto the stump's top, and
// the last log left lying where it is, a unit. `blows` the axe's to a log.
function bucker(dt, tool, script, blows = 3) {
  const b = M.bodies[0];
  buckStep(dt, () => {
    if (tool === 'saw') {
      // strokes along the blade, out and back, the cut deeper as they go
      b.pose = 'saw'; b.s = -(1 - Math.cos(M.t / 0.42 * Math.PI)) / 2 * AP * 1.5;
      M.cut = Math.min(1, M.t / 2.4);
      return M.t >= 2.4;
    }
    const k = Math.floor(M.t / BLOW_S), t = M.t - k * BLOW_S;
    if (swing(b, t, -2.7, 0)) M.cut = Math.min(1, (k + 1) / blows);
    return k >= blows - 1 && t >= SWING.up + SWING.fly + SWING.held;
  }, () => {
    if (M.ph === 'step') {
      b.pose = tool === 'saw' ? 'saw' : 'rest'; b.ang = -0.9; b.s = 0;
      if (walkTo(b, onTrunkAt(M.logs, tool), dt * 0.5, trunkTop())) { b.face = 1; go('cut'); }
      return;
    }
    if (!b.from) b.from = { x: b.x, y: b.y };
    const k = Math.min(1, M.t / 0.5);
    hop(b, b.from, { x: bx() + MT.c0 * AP + (MT.w * AP - BODY) / 2, y: fl() - MT.stump * AP }, k, AP * 2);
    if (k >= 1 && M.logs === 1) { layLog(pivotX(), M.tones[0]); M.logs = 0; b.face = 1; b.pose = 'rest'; b.ang = -0.9; }
    if (M.t >= 2.4) { b.from = null; script.init(); }
  });
}

// D2 and E's bucking from the ground (the owner's D2, standing on the ground
// where it can): the body just past the trunk's far end, facing back along
// it, its axe level at the trunk's middle height so the head's far face meets
// the cut a log in from the end (BUCK_HIT: the head's middle half a cell
// under the trunk's middle). Cut through, the end log is lifted onto its
// head as the yard carries (render/after.js, `drawLoad`), walked to the stack
// past the trunk's end and set down there on the real ground's heap; then
// back to the new end. The last log needs no cut: it is lifted as it lies.
// the D2 axe drawings (render/after/grovemock.js, AXES): the head's far face off the hand, cells
export const AXE_FRONTS = { 0: 4.5, 1: 7.5, 2: 7.5 };
const axeFront = () => (AXE_FRONTS[M.axe || 0]) * AP;
const buckHit = () => Math.asin((GRIP.dy + MT.w * AP / 2) / -axeFront());
const endX = () => pivotX() + M.logs * MT.log * AP;
export const endStand = () => Math.round(endX() - MT.log * AP + axeFront() * Math.cos(buckHit()) - (BODY - GRIP.dx));
const stackX = () => pivotX() + (MT.logs + 3) * MT.log * AP;
function groundBucker(dt, script, blows = 3) {
  const b = M.bodies[0], z = MT.log * AP;
  if (M.ph === 'cut') {
    if (M.logs === 1) { go('lift'); return; }
    const k = Math.floor(M.t / BLOW_S), t = M.t - k * BLOW_S;
    if (swing(b, t, -2.7, buckHit())) M.cut = Math.min(1, (k + 1) / blows);
    if (k >= blows - 1 && t >= SWING.up + SWING.fly + SWING.held) go('lift');
  } else if (M.ph === 'lift') {
    // the end log off the ground and onto the head
    if (!b.carry) { b.carry = { tone: M.tones[M.logs - 1], x: endX() - z, k: 0 }; M.logs -= 1; M.cut = 0; b.pose = 'carry'; b.ang = -1.3; }
    b.carry.k = Math.min(1, M.t / 0.4);
    if (b.carry.k >= 1) go('carry');
  } else if (M.ph === 'carry') {
    if (walkTo(b, stackX(), dt)) go('set');
  } else if (M.ph === 'set') {
    if (M.t >= 0.25) {
      // let go off the head onto the stack: a unit of the real ground, falling onto the heap
      const c = b.carry, x = b.x + BODY / 2 - z / 2, wx = M.flip ? 2 * bx() - x - z : x;
      source('log', 1, 'tree');
      const ai = putSomewhere(cellOf('log', c.tone), wx + z / 2);
      if (ai >= 0) { fallTag(ai, b.y - BODY - z); M.placed.push(ai); }
      b.carry = null;
      go(M.logs > 0 ? 'back' : 'done');
    }
  } else if (M.ph === 'back') {
    if (walkTo(b, endStand(), dt)) { b.face = -1; b.pose = 'rest'; b.ang = -0.9; go('cut'); }
  } else if (M.ph === 'done') {
    b.pose = 'rest';
    if (M.t >= 1.6) script.init();
  }
}

// The hand's axe: a stroke whose head ends on the trunk is a blow, two of
// the tree's chops (`chopTree`, the one door the saw and the woodcutter use
// too). `x, y` where the head is on the contact frame.
function axeStroke(x, y) {
  const p = plot();
  if (!p || p.stage !== PINE_GROWN || p.fall != null) return false;
  const left = bx() + MT.c0 * AP - AP, right = bx() + (MT.c0 + MT.w) * AP;
  if (x < left || x > right || y > fl() || y < fl() - AP * 6) return false;
  chopTree(0, true); chopTree(0, true);
  return true;
}
// Where the hand holds the saw to cut the next log off the lying trunk, the
// blade down the cut line as deep as the cut, slid `s` px up and down.
export const handSaw = s => ({ x: cutX(M.logs) + AP / 2, y: trunkTop() + M.cut * MT.w * AP - SAW_TIP + s, ang: SAW_ANG });
// The saw gesture's record: where the hand has the standing saw.
const sawRec = () => (gestureView() || []).find(r => r.key === 'tree');

// --- the seed basket ----------------------------------------------------------------------
// The acorns in the basket, each a unit, the count what is drawn: a row of
// three sat in it, their lower halves under its rim, and two heaped over
// the gaps between them; the top of the heap taken first.
export const BASKET_FULL = 5;
export function basketSlot(k) {
  const b = basketBox(), aw = 3 * AP, top = b.y - 2 * AP;
  return k < 3 ? { x: b.x + 0.5 * AP + k * aw, y: top } : { x: b.x + 0.5 * AP + aw / 2 + (k - 3) * aw, y: top - 2 * AP };
}

const seedFall = dt => SCRIPTS._seed.step(dt);
// A felling-saw stroke, in and out, each end held and the slide smeared:
// true on the frame the stroke comes in.
function sawStroke(b, t0) {
  const { held, slide } = STROKE, per = 2 * (held + slide), t = t0 % per, wasIn = b.s >= 1;
  if (t < held) { b.s = 0; b.smear = null; }
  else if (t < held + slide) { b.s = (t - held) / slide; b.smear = 'in'; }
  else if (t < 2 * held + slide) { b.s = 1; b.smear = null; }
  else { b.s = 1 - (t - 2 * held - slide) / slide; b.smear = 'out'; }
  return b.s >= 1 && !wasIn;
}
// The heavy stroke (W-2 with heft): pulled back and held, the push in two
// frames' smear, the bite held at the end of the push (the saw in, the body
// leant in a cell's worth), eased back. 'bite' on the frame the push lands.
export const HEAVY = { back: 0.22, push: 0.08, bite: 0.2, pull: 0.16, travel: 3.5 };
function heavyStroke(b, t0) {
  const { back, push, bite, pull } = HEAVY, per = back + push + bite + pull, t = t0 % per, was = b.phase;
  if (t < back) { b.s = 0; b.smear = null; b.lean = 0; b.phase = 'back'; }
  else if (t < back + push) { b.s = (t - back) / push; b.smear = 'in'; b.lean = AP * b.s; b.phase = 'push'; }
  else if (t < back + push + bite) { b.s = 1; b.smear = null; b.lean = AP; b.phase = 'bite'; }
  else { const k = (t - back - push - bite) / pull; b.s = 1 - k; b.smear = 'out'; b.lean = AP * (1 - k); b.phase = 'pull'; }
  if (b.phase === 'bite' && was !== 'bite') { b.biteAt = S.after.t; return 'bite'; }
  return null;
}
// Sawdust thrown off the kerf, `n` specks: whole half-cells in the timber's
// pale wood, flung out of the cut on the saw's far side and falling to lie on
// the ground where they land (never faded), as the yard's dust lies.
function sprayDust(b, n) {
  const x = bx() + (MT.c0 + MT.w) * AP, y = fl() - MT.stump * AP;   // the kerf's far mouth, as the scripts have it
  for (let k = 0; k < n; k++) M.dust.push({ x, y, at: S.after.t, seed: M.dust.length * 7.7 + k });
}
// W: felled with the saw, then bucked with it from the ground.
const SAW_STROKES = 6;   // strokes to take a log off
function makeW(tool, heavy = false) {
  return {
    init() { takeBack(); standTree();
             M.bodies = [{ x: bx() - AP * 40, y: floorM(bx() - AP * 40), face: 1, tool, heavy, pose: 'carry', s: 0, lean: 0 }]; M.dust = []; go('walk'); },
    step(dt) {
      const b = M.bodies[0], p = plot(), stand = bx() + MT.c0 * AP - BODY - SAW_STAND[tool] * AP;
      if (M.ph === 'walk') { b.pose = 'carry'; if (walkTo(b, stand, dt)) { b.face = 1; b.pose = 'saw'; go('fell'); } }
      else if (M.ph === 'fell' && heavy) {
        // the stroke with heft: a long push-pull, each end held, the push
        // ending in a held bite with sawdust off the kerf and the body leaning
        // into it; the last stroke held a beat of strain before it drops the tree
        const ev = heavyStroke(b, M.t);
        if (ev === 'bite') {
          if (p.chops >= TREE_CHOPS - 1 && !b.strained) { b.strained = true; go('strain'); return; }
          chopTree(0); M.notch = p.fall != null ? MT.w : Math.min(MT.w, Math.ceil(p.chops / TREE_CHOPS * MT.w)); sprayDust(b, 5);
        }
        if (p.fall != null) { b.pose = 'carry'; b.s = 0; b.smear = null; b.lean = 0; go('watch'); }
      } else if (M.ph === 'strain') {
        // the blade bound in the last of the cut: pushed and held, leant hard in
        b.s = 1; b.smear = null; b.lean = AP; b.bite = null;
        if (M.t >= 0.6) { chopTree(0); M.notch = MT.w; sprayDust(b, 8); b.lean = 0; b.pose = 'carry'; b.s = 0; go('watch'); }
      } else if (M.ph === 'fell') {
        if (sawStroke(b, M.t)) { chopTree(0); M.notch = p.fall != null ? MT.w : Math.min(MT.w, Math.ceil(p.chops / TREE_CHOPS * MT.w)); }
        if (p.fall != null) { b.pose = 'carry'; b.s = 0; b.smear = null; go('watch'); }
      } else if (M.ph === 'watch') { if (M.landed != null && S.after.t - M.landed >= 3.2) go(tool === 'saw1' ? 'toend' : 'done'); }   // W-2: the trunk breaks into its logs itself
      else if (M.ph === 'toend') { b.pose = 'carry'; if (walkTo(b, sawEndStand(), dt)) { b.face = -1; b.pose = 'bucksaw'; b.k = 0; go('cut'); } }
      else if (M.ph === 'cut') {
        if (M.logs === 1) { go('lift'); return; }
        b.pose = 'bucksaw';
        if (sawStroke(b, M.t)) { b.k += 1; M.cut = Math.min(1, b.k / SAW_STROKES); }
        if (b.k >= SAW_STROKES && b.s <= 0) { b.k = 0; go('lift'); }
      } else if (M.ph === 'back') {
        b.pose = 'carry';
        if (walkTo(b, sawEndStand(), dt)) { b.face = -1; b.pose = 'bucksaw'; b.k = 0; go('cut'); }
      } else if (M.ph === 'done') b.pose = 'carry';   // held at the end: the four logs stacked, no loop
      else groundBucker(dt, this);
    }
  };
}
// Bucking with a saw from the ground: just past the trunk's far end, facing it.
export const sawEndStand = () => Math.round(endX() + AP);
// CR: a crown shape grown, stood and felled.
function makeCR(shape, pal = 1) {
  return {
    init() { takeBack(); barePlot(); M.crown = shape; M.crownPal = pal; M.cone = { state: 'in', at: S.after.t - 5 }; M.grow = { kind: 'b1', at: S.after.t + 0.4, dur: 8 }; go('grow'); },
    step() {
      const p = plot();
      // grown whole: the tree it grew into, standing (the same cells, nothing redrawn)
      if (M.ph === 'grow' && M.t >= 8.8) { p.stage = PINE_GROWN; M.grow = null; go('stand'); }
      else if (M.ph === 'stand' && M.t >= 1.2) { p.fall = S.after.t; go('fall'); }
      else if (M.ph === 'fall' && M.landed != null) go('lie');
    }
  };
}
// The felled trunk breaks into its logs (the owner: "lets just have the
// tree drop and break into the logs, not extra cutting"): after the fall's
// rock back, the four logs it is made of part along their seams, each
// hopping a cell and coming down BREAK_SPREAD px further from the middle,
// held, then each a real log where it lies. Only the old bucking options
// (BUCKED) still cut log by log.
export const BREAK_S = 0.55, BREAK_SPREAD = 3;
const BUCKED = new Set(['d1', 'd2', 'd2axe1', 'd2axe2', 'e', 'w1']);
// F3a and its three variants: one script, `M.style` what is drawn into it.
function makeF3a(style) {
  return { init() { M.style = style; SCRIPTS._f3a.init(); }, step(dt) { SCRIPTS._f3a.step.call(this, dt); } };
}
// The acorns hanging in the pine's crown for S1, their top lefts in cells off
// the fall's pivot (the trunk's right edge on the stump's top), on its lowest
// shelf either side of the trunk; an acorn AW_C by AH_C cells.
export const TREE_ACORNS = [[-9, -19], [3, -19]];
export const AW_C = 3, AH_C = 4;
// A world x as the scripts have it (the plot's turn undone for a fall to the left).
const simX = x => (M.flip ? 2 * bx() - x : x);
// A body walked to stand at the seed basket's near side, facing it.
function basketWalk(b, dt) {
  const k = basketBox(), wl = k.x - BODY - AP, to = M.flip ? 2 * bx() - wl - BODY : wl;
  if (!walkTo(b, to, dt)) return false;
  b.face = M.flip ? -1 : 1;
  return true;
}
// The acorns on a body's head tipped into the basket one at a time, each
// arcing from the head into its place there: true once the head is empty.
export const TIP_S = 0.35;
function tipInto(b) {
  if (!M.tip && b.acorns > 0) {
    const wl = M.flip ? 2 * bx() - b.x - BODY : b.x;
    M.tip = { from: { x: wl + BODY / 2 - AW_C * AP / 2, y: b.y - BODY - b.acorns * AH_C * AP }, to: basketSlot(M.basket), at: S.after.t };
    b.acorns -= 1;
  }
  if (M.tip && S.after.t - M.tip.at >= TIP_S) { M.tip = null; M.basket += 1; }
  return !M.tip && b.acorns <= 0;
}

// --- the scripts -------------------------------------------------------------------------
// Each a phase machine on M.ph and M.t, stepped by the frame's dt; `init`
// stands it again, so each loops.
const SCRIPTS = {
  // A1: a worker brings a cone out of the forestry shack, kneels at the bare
  // plot and plants it; a shoot comes up while it walks back.
  a1: {
    init() {
      takeBack(); barePlot(); M.basket = BASKET_FULL;
      const k = basketBox(), home = k.x - BODY - AP;
      M.bodies = [{ x: home, y: floorAt(home + BODY / 2), face: 1, tool: null, carry: null, home }];
      M.cone = null; M.grow = null; go('reach');
    },
    step(dt) {
      const b = M.bodies[0], spot = bx() + AP;
      if (M.ph === 'reach') {
        // bent to the basket, an acorn lifted off its top onto the head
        b.squat = M.t < 0.5;
        if (M.t >= 0.25 && !M.taking) { const s = basketSlot(M.basket - 1); M.basket -= 1; M.taking = { from: s, at: S.after.t }; }
        if (M.t >= 0.7) { M.taking = null; b.carry = 'cone'; b.squat = false; go('walk'); }
      } else if (M.ph === 'walk') { if (walkTo(b, spot, dt)) { b.face = -1; go('kneel'); } }
      else if (M.ph === 'kneel') {
        b.squat = true;
        if (M.t >= 0.25) { b.carry = null; M.cone = { state: 'set', at: S.after.t, from: { x: b.x + BODY / 2 - 1.5 * AP, y: b.y - BODY + P - 4 * AP } }; go('set'); }
      } else if (M.ph === 'set') {
        if (M.t >= 0.5) { M.cone = { state: 'in', at: S.after.t }; go('press'); }
      } else if (M.ph === 'press') {
        if (M.t >= 0.9) { b.squat = false; M.grow = { kind: 'b1', at: S.after.t, dur: 14 }; go('back'); }
      } else if (M.ph === 'back') {
        if (walkTo(b, b.home, dt)) { b.face = 1; go('hold'); }
      } // held here: the scene ends with the basket an acorn short (no loop, so no acorn comes back from nowhere)
    }
  },
  // R: the grove at rest: the pine standing by the shack, the seed basket on
  // the shack's far side with its acorns in it.
  r: { init() { takeBack(); standTree(); M.basket = BASKET_FULL; go('rest'); }, step() {} },
  // S1: the basket filled from a felled tree (the owner: both ways). Two
  // acorns hang in the pine's crown; it goes over, the crown breaks and
  // fades but the acorns do not: they drop out of it and lie, a worker comes
  // out of the forestry shack, picks each up onto its head and tips them into
  // the seed basket. Held at the end.
  s1: {
    init() { takeBack(); standTree(); M.basket = 2; M.dropped = []; M.bodies = []; M.tip = null; M.drops = TREE_ACORNS; go('stand'); },
    step(dt) { seedFall(dt); }
  },
  // S3a: self-seeding bought, and a felled crown drops an acorn: the grove's
  // board up, the row's first rung bought (a chance in four); the pine goes
  // over and as its crown breaks an acorn falls out of it and stays (the
  // roll came up); a worker carries it to the basket.
  s3a: {
    init() { takeBack(); standTree(); M.basket = 1; M.dropped = []; M.bodies = []; M.tip = null; M.drops = [TREE_ACORNS[0]];
             globalThis.__openAfterBoard?.('grove'); go('board'); },
    step(dt) {
      if (M.ph === 'board' && M.t >= 2.2) { globalThis.__buy?.('after-selfseed'); go('paid'); }
      else if (M.ph === 'paid' && M.t >= 1.4) { globalThis.__groveCloseBoard?.(); go('stand'); M.t = 0.4; }
      else seedFall(dt);
    }
  },
  // S3b: the same tree with self-seeding owned, and the roll not coming up:
  // the crown breaks and fades and nothing stays; the basket as it was.
  s3b: {
    init() { takeBack(); standTree(); S.after.ups['after-selfseed'] = 1; M.basket = 1; M.dropped = []; M.bodies = []; M.tip = null; M.drops = []; go('stand'); },
    step(dt) { seedFall(dt); }
  },
  // S1's and S3's fall: the pine over, and the acorns M.drops (none, one,
  // or the two hanging in S1's crown) out of the crown where it breaks,
  // carried to the basket by a worker out of the forestry shack.
  _seed: {
    step(dt) {
      const p = plot();
      if (M.ph === 'stand' && M.t >= 1.2) { p.fall = S.after.t; go('fall'); }
      else if (M.ph === 'fall' && M.landed != null) {
        if (!M.drops.length) { go('end'); return; }
        // out of the crown where it lies: each from where it hung, turned with the tree
        M.dropped = M.drops.map(([x, y], k) => {
          const cx = (x + AW_C / 2) * AP, cy = (y + AH_C / 2) * AP, sx = pivotX() - cy + k * 3 * AP, sy = fl() + cx;
          return { x: sx - AW_C * AP / 2, y0: Math.min(sy - AH_C * AP / 2, fl() - AH_C * AP), at: S.after.t, lying: false };
        });
        go('drop');
      } else if (M.ph === 'drop') {
        if (M.t >= 1.4) {
          const door = simX(stationDoor('forestry'));
          M.bodies = [{ x: door - BODY / 2, y: floorM(door), face: 1, tool: null, acorns: 0 }];
          go('fetch');
        }
      } else if (M.ph === 'fetch') {
        const b = M.bodies[0], q = M.dropped.find(d => !d.taken);
        if (!q) { go('home'); return; }
        if (walkTo(b, q.x + AW_C * AP / 2 - BODY / 2, dt)) {
          b.squat = true;
          if (!q.liftAt) q.liftAt = S.after.t;
          if (S.after.t - q.liftAt >= 0.35) { q.taken = true; b.acorns += 1; b.squat = false; }
        }
      } else if (M.ph === 'home') {
        if (basketWalk(M.bodies[0], dt)) go('tip');
      } else if (M.ph === 'tip') {
        if (tipInto(M.bodies[0])) go('away');
      } else if (M.ph === 'away') {
        const b = M.bodies[0], door = simX(stationDoor('forestry'));
        if (walkTo(b, door - BODY / 2, dt)) go('end');
      }
    }
  },
  // S2: the seed row bought: the grove's board up with the row and its bill
  // in the earlier acts' coins; pressed, the coins go (the yard's way up
  // through the cloud), a worker walks in from heaven's gates with a bundle
  // of acorns on its head and tips them into the seed basket, then walks
  // back out. Held at the end.
  s2: {
    init() { takeBack(); standTree(); M.basket = 1; M.bodies = []; M.tip = null; M.bought = false;
             globalThis.__groveSeedBought = () => { M.bought = true; };
             globalThis.__openAfterBoard?.('grove'); go('board'); },
    step(dt) {
      if (M.ph === 'board' && M.t >= 2.2) { globalThis.__buy?.('after-seed'); go('paid'); }
      else if (M.ph === 'paid' && M.t >= 1.2) {
        // the board put away, as a press on open ground puts it away (board.js `showPanel`, handed in by the scene)
        globalThis.__groveCloseBoard?.();
        if (M.bought) { const g = ACT_GATES_CELL * P; M.bodies = [{ x: g, y: floorAt(g), face: 1, tool: null, acorns: AFTER_SEED_BUNDLE }]; }
        go(M.bought ? 'in' : 'end');
      } else if (M.ph === 'in') {
        if (basketWalk(M.bodies[0], dt)) go('tip');
      } else if (M.ph === 'tip') {
        if (tipInto(M.bodies[0])) go('out');
      } else if (M.ph === 'out') {
        const b = M.bodies[0];
        if (walkTo(b, ACT_GATES_CELL * P, dt)) { M.bodies = []; go('end'); }
      }
    }
  },
  // A2: the hand takes the cone set out at the forestry shack's door, carries
  // it over the bare plot and lets go: it drops in and sinks, and a shoot
  // comes up. The ghost hand shows the motion first.
  a2: {
    init() {
      barePlot(); M.basket = BASKET_FULL;
      // the top acorn of the basket's heap, taken out of it on the grab
      const s = basketSlot(M.basket - 1);
      M.cone = { state: 'basket', x: s.x, y: s.y };
      M.from = { x: s.x, y: s.y };
      M.bodies = []; M.grow = null; M.cursor = null; go('teach');
    },
    step(dt) {
      const c = M.cone, from = M.from, over = { x: bx() - AP, y: fl() - AP * 9 };
      const at = k => ({ x: lerp(from.x + 1.5 * AP, over.x + AP, ease(k)), y: lerp(from.y - 2 * AP, over.y, ease(k)) - Math.sin(Math.PI * ease(k)) * AP * 8 });
      if (M.ph === 'teach') {
        const u = (M.t % 1.6) / 1.6, k = Math.min(1, u * 1.3);
        M.ghost = { ...at(k), pose: u < 0.08 ? 'point' : 'grab' };
        if (M.t >= 3.2) { M.ghost = null; go('reach'); }
      } else if (M.ph === 'reach') {
        const k = Math.min(1, M.t / 0.6);
        M.cursor = { x: lerp(over.x + AP * 10, from.x + 1.5 * AP, ease(k)), y: lerp(over.y, from.y - 2 * AP, ease(k)), pose: 'point' };
        if (M.t >= 0.8) { M.cursor.pose = 'grab'; c.state = 'held'; M.basket -= 1; go('carry'); }
      } else if (M.ph === 'carry') {
        const k = Math.min(1, M.t / 1.5);
        M.cursor = { ...at(k), pose: 'grab' };
        c.x = M.cursor.x - 1.5 * AP; c.y = M.cursor.y + 2 * AP;   // hanging under the fist, as goods in the hand
        if (M.t >= 1.7) { M.cursor.pose = 'point'; Object.assign(c, { state: 'falling', at: S.after.t, fy: c.y }); go('fall'); }
      } else if (M.ph === 'fall') {
        // under the yard's gravity onto the soil, then in
        const ground = fl() - 5 * AP;   // the acorn's top, sitting on the soil
        c.y = Math.min(ground, c.fy + 0.5 * 900 * M.t * M.t);
        if (c.y >= ground) { M.cone = { state: 'in', at: S.after.t }; go('press'); }
      } else if (M.ph === 'press') {
        M.cursor.x += 30 * dt; M.cursor.y -= 20 * dt;
        if (M.t >= 0.9) { M.grow = { kind: 'b1', at: S.after.t, dur: 14 }; go('hold'); }
      } else if (M.ph === 'hold') {
        if (M.cursor) M.cursor.x += 10 * dt;
        if (M.t >= 3.2) M.cursor = null;   // held here, the basket an acorn short: no loop
      }
    }
  },
  // B1, B2: a cone planted in the bare plot grows into the pine, cell by
  // cell, time-lapsed to ten seconds; held whole, and again.
  b1: { init() { barePlot(); M.cone = { state: 'in', at: S.after.t - 5 }; M.grow = { kind: 'b1', at: S.after.t + 0.6, dur: 10 }; go('grow'); },
        step() { if (M.t >= 13.5) this.init(); } },
  b2: { init() { barePlot(); M.cone = { state: 'in', at: S.after.t - 5 }; M.grow = { kind: 'b2', at: S.after.t + 0.6, dur: 10 }; go('grow'); },
        step() { if (M.t >= 13.5) this.init(); } },
  // C: the pine sawn through goes over whole (today's tip), and its crown
  // breaks apart where it hits and fades; the trunk lies.
  c: {
    init() { takeBack(); standTree(); M.notch = MT.w; go('stand'); },
    step() {
      const p = plot();
      if (M.ph === 'stand' && M.t >= 1.2) { p.fall = S.after.t; go('fall'); }
      else if (M.ph === 'fall' && M.landed != null) go('lie');
      else if (M.ph === 'lie' && M.t >= 3.6) this.init();
    }
  },
  // D1: the woodcutter on the felled trunk saws the log off its far end,
  // one at a time; each rolls off, and the trunk is shorter by a log.
  d1: {
    init() { takeBack(); felledPlot(); M.logs = MT.logs; M.cut = 0;
             M.bodies = [{ x: onTrunkAt(MT.logs, 'saw'), y: trunkTop(), face: 1, tool: 'saw', pose: 'saw', s: 0 }]; go('cut'); },
    step(dt) { bucker(dt, 'saw', this); }
  },
  // D2: with the axe, standing on the ground at the trunk's far end: a level
  // blow into the cut a log in from the end, three to a log; the log cut
  // free is lifted and carried to a stack, and the next cut is the new end.
  d2: {
    init() { takeBack(); felledPlot(); M.logs = MT.logs; M.cut = 0;
             M.bodies = [{ x: endStand(), y: fl(), face: -1, tool: 'axe', pose: 'rest', ang: -0.9 }]; go('cut'); },
    step(dt) { groundBucker(dt, this); }
  },
  // D2 with the axe redrawn (the owner: "give the axe some love. it looks
  // like a hammer right now"): a longer haft and a wedge of a head whose bit
  // flares wider than its poll, in a lighter tone, leading into the cut.
  //   1 a felling axe: a straight wedge, the bit five cells tall
  //   2 a bearded axe: the bit sweeping down below the head
  d2axe1: { init() { M.axe = 1; SCRIPTS.d2.init(); }, step(dt) { groundBucker(dt, this); } },
  d2axe2: { init() { M.axe = 2; SCRIPTS.d2.init(); }, step(dt) { groundBucker(dt, this); } },
  // C with the crown in colour (the owner: "lets give the crown some color
  // too, look sweird with black and brown trunk"): the crown's cells each a
  // shade of four, picked once off where the cell stands (render/after/
  // grovemock.js, CROWNS): 1 a deep pine green, 2 a warmer moss green, 3 a
  // blue-green.
  cg1: { init() { M.crownPal = 1; SCRIPTS.c.init(); }, step() { SCRIPTS.c.step.call(this); } },
  cg2: { init() { M.crownPal = 2; SCRIPTS.c.init(); }, step() { SCRIPTS.c.step.call(this); } },
  cg3: { init() { M.crownPal = 3; SCRIPTS.c.init(); }, step() { SCRIPTS.c.step.call(this); } },
  // E: the woodcutter walks up with its axe on its shoulder, fells the pine
  // a blow at a time from the side away from the fall, hops up on the trunk
  // and bucks it with the same axe.
  e: {
    init() { takeBack(); standTree();
             M.bodies = [{ x: bx() - AP * 40, y: floorM(bx() - AP * 40), face: -1, tool: 'axe', pose: 'carry', ang: -1.3 }]; go('walk'); },
    step(dt) {
      const b = M.bodies[0], p = plot(), HIT = Math.asin((GRIP.dy + MT.stump * AP + 3) / -AXE_FRONT), stand = bx() + MT.c0 * AP - GRIP.dx - Math.round(AXE_FRONT * Math.cos(HIT));
      if (M.ph === 'walk') { b.pose = 'carry'; b.ang = -1.3; if (walkTo(b, stand, dt)) { b.face = 1; go('chop'); } }
      else if (M.ph === 'chop') {
        const k = Math.floor(M.t / BLOW_S), t = M.t - k * BLOW_S;
        if (swing(b, t, -2.6, HIT)) { chopTree(0); chopTree(0); M.notch = p.fall != null ? MT.w : Math.min(MT.w, Math.ceil(p.chops / TREE_CHOPS * MT.w)); }
        if (p.fall != null && b.pose === 'back') go('watch');
      } else if (M.ph === 'watch') {
        b.pose = 'rest'; b.ang = -0.9;
        if (M.landed != null && S.after.t - M.landed >= 1.6) go('toend');
      } else if (M.ph === 'toend') {
        b.pose = 'carry'; b.ang = -1.3;
        if (walkTo(b, endStand(), dt)) { b.face = -1; b.pose = 'rest'; go('cut'); }
      } else groundBucker(dt, this, 2);
    }
  },
  // F1: you saw. The handsaw lies across the pine's trunk; the ghost hand
  // shows the stroke, then the hand takes it and saws it through (the real
  // saw gesture); the tree goes over and its crown breaks; then the hand
  // bucks the trunk log by log with the same saw.
  f1: {
    init() { takeBack(); standTree(); M.cut = 0; M.sawAt = { s: 0 }; M.cursor = null; M.from = null; go('teach'); },
    step(dt) {
      const p = plot(), b = partsOf('tree', 0).sawBox, gx = b.x + P * 2, gy = b.y + b.h / 2;
      if (M.ph === 'teach') {
        M.ghost = { x: gx + Math.sin(M.t / 0.8 * 2 * Math.PI) * GESTURE_SAW_AMP, y: gy, pose: 'grab' };
        if (M.t >= 3.2) { M.ghost = null; go('reach'); }
      } else if (M.ph === 'reach') {
        const k = Math.min(1, M.t / 0.5);
        M.cursor = { x: lerp(gx + AP * 8, gx, ease(k)), y: lerp(gy - AP * 8, gy, ease(k)), pose: k < 1 ? 'point' : 'grab' };
        if (M.t >= 0.6) { gestureDown(gx, gy); go('saw'); }
      } else if (M.ph === 'saw') {
        // the pointer dragged end to end; the saw follows it (the gesture's own lag)
        gestureMove(gx + Math.sin(M.t / 0.5 * Math.PI) * GESTURE_SAW_AMP, gy);
        M.cursor = { x: gx + (sawRec()?.s || 0), y: gy, pose: 'grab' };
        if (p.fall != null) { gestureUp(M.cursor.x, gy); M.sawAt = null; M.notch = MT.w; go('fall'); }
      } else if (M.ph === 'fall') {
        M.cursor = { x: M.cursor.x - 20 * dt, y: M.cursor.y - 30 * dt, pose: 'point' };
        if (M.landed != null && S.after.t - M.landed >= 3.0) { M.cursor = null; go('end'); }   // the trunk breaks into its logs itself: nothing more to saw
      } else if (M.ph === 'hold0') {
        const k = Math.min(1, M.t / 0.8), to = handSaw(0);
        M.cursor = { x: lerp(M.from.x, to.x, ease(k)), y: lerp(M.from.y, to.y, ease(k)), pose: k < 1 ? 'point' : 'grab' };
        if (M.t >= 1.0) { M.from = null; go('cut'); }
      } else buckStep(dt, () => {
        // strokes along the blade, out and back; the cut deeper as they go
        M.sawAt.s = -(1 - Math.cos(M.t / 0.4 * Math.PI)) / 2 * AP * 1.5;
        M.cut = Math.min(1, M.t / 2.0);
        M.cursor = { ...handSaw(M.sawAt.s), pose: 'grab' };
        return M.t >= 2.0;
      }, () => {
        const k = Math.min(1, M.t / 0.6);
        if (M.sawAt) M.sawAt.s = 0;
        if (M.ph === 'last') {
          if (!M.from) M.from = { x: M.cursor.x, y: M.cursor.y };
          M.cursor = { x: lerp(M.from.x, M.from.x + AP * 10, ease(k)), y: lerp(M.from.y, M.from.y - AP * 6, ease(k)), pose: 'point' };
          if (M.t >= 0.3 && M.logs === 1) { layLog(pivotX(), M.tones[0]); M.logs = 0; M.sawAt = null; }
          if (M.t >= 2.2) this.init();
          return;
        }
        // along to the next cut, the saw carried in the hand
        const a = handSaw(0);
        M.cursor = { x: lerp(a.x + MT.log * AP, a.x, ease(k)), y: a.y, pose: 'grab' };
        if (k >= 1) go('cut');
      });
    }
  },
  // F2: you swing the axe. The hand holds it; the ghost hand shows the
  // stroke, then each stroke of the pointer into the trunk is a blow, held
  // on the contact; on the last the pine goes over and its crown breaks.
  f2: {
    init() { takeBack(); standTree(); M.cursor = null; go('teach'); },
    step(dt) {
      const p = plot(), HA = -0.2, face = { x: bx() + MT.c0 * AP, y: fl() - MT.stump * AP - 3 };
      const hit = { x: face.x - HAND_AXE_FRONT * Math.cos(HA), y: face.y - HAND_AXE_FRONT * Math.sin(HA) }, wind = { x: hit.x - AP * 4, y: hit.y - AP * 9 };
      const stroke = t => {
        // wound up and held, the stroke, held on the trunk, back
        const { up, fly, held } = SWING;
        if (t < up) return { ...wind, ang: -2.2, pose: 'grab', phase: 'up' };
        if (t < up + fly) { const k = (t - up) / fly; return { x: lerp(wind.x, hit.x, k), y: lerp(wind.y, hit.y, k), ang: lerp(-2.2, HA, k), pose: 'grab', phase: 'fly', from: -2.2 }; }
        if (t < up + fly + held) return { ...hit, ang: HA, pose: 'grab', phase: 'hit' };
        const k = ease((t - up - fly - held) / SWING.back);
        return { x: lerp(hit.x, wind.x, k), y: lerp(hit.y, wind.y, k), ang: lerp(HA, -2.2, k), pose: 'grab', phase: 'back' };
      };
      if (M.ph === 'teach') {
        M.ghost = { ...stroke(M.t % (BLOW_S + 0.4)), tool: 'axe' };
        if (M.t >= 3.2) { M.ghost = null; M.cursor = { ...wind, ang: -2.2, pose: 'grab', tool: 'axe', phase: 'up' }; go('chop'); }
      } else if (M.ph === 'chop') {
        const k = Math.floor(M.t / BLOW_S), s = stroke(M.t - k * BLOW_S);
        const first = s.phase === 'hit' && M.cursor.phase !== 'hit';
        M.cursor = { ...s, tool: 'axe' };
        if (first && axeStroke(face.x + 1, face.y)) M.notch = p.fall != null ? MT.w : Math.min(MT.w, Math.ceil(p.chops / TREE_CHOPS * MT.w));
        if (p.fall != null && s.phase === 'back') go('fall');
      } else if (M.ph === 'fall') {
        M.cursor = { ...M.cursor, x: M.cursor.x - 15 * dt, y: M.cursor.y - 10 * dt, phase: 'rest', ang: -1.6 };
        if (M.landed != null && S.after.t - M.landed >= 3.0) this.init();
      }
    }
  },
  // F3: you dig the stump. The ghost hand shows the lift; the hand takes the
  // stump and pulls it up (the real stump gesture, a root a strain) until it
  // comes out whole -- a log's block, its two rows of root under the two
  // above ground -- carries it off and lets go on the ground, where it lies
  // as a log for the gatherers.
  f3: {
    init() { takeBack(); felledPlot(); M.logs = 0; M.stumpOut = null; M.cursor = null; go('teach'); },
    step(dt) {
      const p = plot(), g = partsOf('stump', 0).stump, x = g.x + g.w / 2, y = g.y + g.h / 2;
      if (M.ph === 'teach') {
        const u = (M.t % 1.4) / 1.4;
        M.ghost = { x, y: y - Math.round(u * 3) * P, pose: 'grab' };
        if (M.t >= 3.2) { M.ghost = null; go('reach'); }
      } else if (M.ph === 'reach') {
        const k = Math.min(1, M.t / 0.5);
        M.cursor = { x: lerp(x + AP * 8, x, ease(k)), y: lerp(y - AP * 8, y, ease(k)), pose: k < 1 ? 'point' : 'grab' };
        if (M.t >= 0.6) { gestureDown(x, y); go('pull'); }
      } else if (M.ph === 'pull') {
        const up = Math.min(60, M.t * 120);
        gestureMove(x, y - up);
        M.cursor = { x, y: y - up, pose: 'grab' };
        if (!p.stump) {
          gestureUp(x, y - up);
          M.stumpOut = { x: bx() + MT.c0 * AP, y: fl() - MT.stump * AP - AP };
          M.from = { x: M.cursor.x, y: M.cursor.y, sy: M.stumpOut.y };
          go('lift');
        }
      } else if (M.ph === 'lift') {
        // up clear of the ground on the hand
        const k = Math.min(1, M.t / 0.6), s = M.stumpOut, rise = ease(k) * AP * 5;
        M.cursor = { x, y: M.from.y - rise, pose: 'grab' };
        s.y = M.from.sy - rise;
        if (k >= 1) { M.from = { x: M.cursor.x, y: M.cursor.y, sx: s.x, sy: s.y }; go('carry'); }
      } else if (M.ph === 'carry') {
        const k = Math.min(1, M.t / 1.4), s = M.stumpOut, dx = ease(k) * AP * 14, dy = -Math.sin(Math.PI * k) * AP * 3;
        M.cursor = { x: M.from.x + dx, y: M.from.y + dy, pose: 'grab' };
        s.x = M.from.sx + dx; s.y = M.from.sy + dy;
        if (k >= 1) {
          // let go: a log on the ground, falling under the yard's gravity from the hand
          source('log', 1, 'stump');
          const ai = putSomewhere(cellOf('log'), s.x + MT.log * AP / 2);
          if (ai >= 0) { fallTag(ai, s.y); M.placed.push(ai); }
          M.stumpOut = null; M.cursor.pose = 'point'; go('rest');
        }
      } else if (M.ph === 'rest') {
        M.cursor.y -= 20 * dt;
        if (M.t >= 2.6) { M.from = null; this.init(); }
      }
    }
  },
  // E with a saw, three designs (the owner: "lets work on the saw design"):
  // the woodcutter carries it in on its shoulder, stands at the trunk's side
  // away from the fall and saws across it at the felling cut, a stroke in
  // and out, each end held and the slide between smeared; a stroke in is a
  // chop of the tree's, and on the last it goes over.
  ...Object.fromEntries(['saw1', 'saw2', 'saw3'].map(tool => [`e${tool}`, {
    init() { takeBack(); standTree();
             M.bodies = [{ x: bx() - AP * 40, y: floorM(bx() - AP * 40), face: 1, tool, pose: 'carry', s: 0 }]; go('walk'); },
    step(dt) {
      const b = M.bodies[0], p = plot(), stand = bx() + MT.c0 * AP - BODY - SAW_STAND[tool] * AP;
      if (M.ph === 'walk') { b.pose = 'carry'; if (walkTo(b, stand, dt)) { b.face = 1; b.pose = 'saw'; go('saw'); } }
      else if (M.ph === 'saw') {
        const { held, slide } = STROKE, per = 2 * (held + slide), k = Math.floor(M.t / per), t = M.t - k * per;
        const wasIn = b.s >= 1;
        if (t < held) { b.s = 0; b.smear = null; }
        else if (t < held + slide) { b.s = (t - held) / slide; b.smear = 'in'; }
        else if (t < 2 * held + slide) { b.s = 1; b.smear = null; }
        else { b.s = 1 - (t - 2 * held - slide) / slide; b.smear = 'out'; }
        if (b.s >= 1 && !wasIn) { chopTree(0); M.notch = p.fall != null ? MT.w : Math.min(MT.w, Math.ceil(p.chops / TREE_CHOPS * MT.w)); }
        if (p.fall != null) { b.pose = 'carry'; b.s = 0; b.smear = null; go('watch'); }
      } else if (M.ph === 'watch') { if (M.landed != null && S.after.t - M.landed >= 2.6) this.init(); }
    } }])),
  // W-1, W-2: the woodcutter with a saw only (the owner dropped the axe): it
  // fells the pine as E-saw does, then bucks it from the ground at the
  // trunk's far end, the saw upright in the cut a log in from the end, the
  // cut deeper a stroke, each log carried to the stack. W-1 the two-man
  // crosscut; W-2 the handsaw the player uses (F1's), so the grove has one saw.
  w1: makeW('saw1'), w2: makeW('hand'),
  // W-2 with heft (the owner: "a bit longer, give it some sauce, some particles, some heft")
  w2h: makeW('hand', true),
  // CR-1..3: the crown's shapes in the deep pine green (C-green-1): grown
  // row by row from the acorn (B1), standing a beat, felled and broken (C).
  cr1: makeCR(1), cr2: makeCR(2), cr3: makeCR(3),
  // OAK-1..3: the oaks in the oak-leaf green (pal 4), grown, stood and felled
  oak1: makeCR(4, 4), oak2: makeCR(5, 4), oak3: makeCR(6, 4),
  // F3a: the stump is the handle. Press and hold on it and drag up: it comes
  // up with the hand, its roots straining under it and snapping one by one
  // (the real stump gesture, a root a strain), no rope and no grip apart from
  // it; out, it is carried off on the hand and let go, a log on the ground.
  f3a: makeF3a(0),
  // F3a-1, -2, -3: the same pull with more to read in it (the owner: "more
  // sauce/indicators for the stump pulling"), no strip, tag or bar:
  //   1 the earth gives: the soil cracks wider as the strain builds, the root
  //     about to go straightens taut, and each snap is held: the stump jerks
  //     a cell up and holds, dirt chips fly and lie where they land
  //   2 tug of war: the pull in heaves, the stump settling back a little each
  //     time the hand eases; the root under strain stretches, the hand leans
  //     harder the more it strains; the last, biggest root takes a held two
  //     beats before it lets go and the stump comes free into the hand
  //   3 root count: the roots show from the start as cords over the soil,
  //     three to count; each snap breaks one, a held burst at the break,
  //     so what is left to do is the cords still whole
  f3a1: makeF3a(1), f3a2: makeF3a(2), f3a3: makeF3a(3),
  _f3a: {
    init() { takeBack(); felledPlot(); M.stumpOut = null; M.cursor = null; M.stumpUp = 0; M.lastDug = 0; M.snapAt = null; M.snapK = -1; M.chips = []; go('teach'); },
    step(dt) {
      const p = plot(), x = bx(), mid = fl() - MT.stump * AP + AP / 2;   // the stump taken by its top, so the fist leaves the block and its roots in view
      // a root snapping: when and which, for the held pose and the chips
      if ((p.dug || 0) > M.lastDug || (M.lastDug > 0 && !p.stump && M.snapK < AFTER_DIG_CLICKS - 1)) {
        M.snapK = p.stump ? (p.dug || 0) - 1 : AFTER_DIG_CLICKS - 1; M.snapAt = S.after.t; M.lastDug = p.stump ? p.dug : AFTER_DIG_CLICKS;
        if (M.style === 1 || M.style === 3) M.chips.push({ at: S.after.t, k: M.snapK });
      }
      if (M.ph === 'teach') {
        const u = (M.t % 1.4) / 1.4;
        M.ghost = { x, y: mid - Math.round(u * 3) * P, pose: u < 0.1 ? 'point' : 'grab' };
        if (M.t >= 3.2) { M.ghost = null; go('reach'); }
      } else if (M.ph === 'reach') {
        const k = Math.min(1, M.t / 0.5);
        M.cursor = { x: lerp(x + AP * 8, x, ease(k)), y: lerp(mid - AP * 8, mid, ease(k)), pose: k < 1 ? 'point' : 'grab' };
        if (M.t >= 0.6) { gestureDown(x, mid); go('pull'); }
      } else if (M.ph === 'pull') {
        // the pointer dragged up; the stump comes up as far as the gesture
        // lifts it, the hand on it. Tug of war heaves: up, eased a little, up.
        const heave = M.style === 2 ? (M.t % 1.1 < 0.8 ? 0 : 26) : 0;
        gestureMove(x, mid - Math.min(80, M.t * 120) + heave);
        const rec = (gestureView() || []).find(r => r.key === 'stump');
        M.stumpUp = rec ? rec.lift : 0;
        M.strain = rec && rec.grab ? Math.min(1, (rec.strain || 0) / GESTURE_STRAIN_S) : 0;
        M.cursor = { x, y: mid - M.stumpUp, pose: 'grab' };
        if (!p.stump) {
          gestureUp(x, mid);
          // tug of war: the last root held two beats before the stump comes free
          go(M.style === 2 ? 'last' : 'out');
        }
      } else if (M.ph === 'last') {
        if (M.t >= 0.45) go('out');
      } else if (M.ph === 'out') {
        M.stumpOut = { x: bx() + MT.c0 * AP, y: fl() - MT.stump * AP - M.stumpUp, tone: M.stumpTone };
        M.from = { x: M.cursor.x, y: M.cursor.y, sx: M.stumpOut.x, sy: M.stumpOut.y };
        go('carry');
      } else if (M.ph === 'carry') carryOff(dt, this);
      else if (M.ph === 'rest') { if (M.cursor) M.cursor.y -= 20 * dt; if (M.t >= 2.2) M.cursor = null; }   // held: the log lies where it was let go
    }
  },
  // F3b: dig it with the shovel. The shovel stands in the ground beside the
  // stump; press on its handle and lever it, a stroke at a time, each end
  // held and the swing between smeared; each stroke loosens the stump (the
  // real dig, `digStump`), tilting it up off the shovel's side, until it
  // tips out onto its side as a block; then carried off and let go.
  f3b: {
    init() { takeBack(); felledPlot(); M.stumpOut = null; M.cursor = null; M.shovel = { ang: 0 }; M.tilt = 0; M.dug = 0; go('teach'); },
    step(dt) {
      const p = plot(), sh = shovelAt(), top = shovelTop(M.shovel.ang), push = SHOVEL_PUSH;
      const lever = (t, who) => {
        const { held, slide } = STROKE;
        if (t < held) return { ang: 0, sm: null };
        if (t < held + slide) return { ang: push * (t - held) / slide, sm: 'in' };
        if (t < 2 * held + slide) return { ang: push, sm: null };
        return { ang: push * (1 - (t - 2 * held - slide) / slide), sm: 'out' };
      };
      const per = 2 * (STROKE.held + STROKE.slide) + 0.15;
      if (M.ph === 'teach') {
        const l = lever(M.t % per), tp = shovelTop(l.ang);
        M.ghost = { x: tp.x, y: tp.y, pose: 'grab' };
        if (M.t >= 3.2) { M.ghost = null; go('reach'); }
      } else if (M.ph === 'reach') {
        const k = Math.min(1, M.t / 0.5);
        M.cursor = { x: lerp(top.x + AP * 8, top.x, ease(k)), y: lerp(top.y - AP * 6, top.y, ease(k)), pose: k < 1 ? 'point' : 'grab' };
        if (M.t >= 0.6) go('lever');
      } else if (M.ph === 'lever') {
        const k = Math.floor(M.t / per), l = lever(M.t - k * per), was = M.shovel.ang;
        M.shovel = { ang: l.ang, sm: l.sm, from: was };
        const tp = shovelTop(l.ang);
        M.cursor = { x: tp.x, y: tp.y, pose: 'grab' };
        if (l.ang >= push && was < push && p.stump) { digStump(0, true); M.dug += 1; }
        M.tilt = Math.min(1, M.dug / AFTER_DIG_CLICKS) * STUMP_TILT;
        if (!p.stump && l.ang <= 0) { M.tipAt = S.after.t; go('tip'); }
      } else if (M.ph === 'tip') {
        // over onto its side, away from the shovel, about its far foot
        const k = Math.min(1, M.t / 0.5);
        M.tilt = STUMP_TILT + (Math.PI / 2 - STUMP_TILT) * k * k;
        if (k >= 1) {
          M.tilt = 0;
          M.stumpOut = { x: bx() + MT.c0 * AP - MT.log * AP, y: fl() - MT.log * AP, tone: M.stumpTone, lying: true };
          go('grab');
        }
      } else if (M.ph === 'grab') {
        const s = M.stumpOut, c = { x: s.x + MT.log * AP / 2, y: s.y + MT.log * AP / 2 }, k = Math.min(1, M.t / 0.6);
        M.cursor = { x: lerp(top.x, c.x, ease(k)), y: lerp(top.y, c.y, ease(k)), pose: k < 1 ? 'point' : 'grab' };
        if (M.t >= 0.8) { s.lying = false; M.from = { x: c.x, y: c.y, sx: s.x, sy: s.y }; go('carry'); }
      } else if (M.ph === 'carry') carryOff(dt, this, AP * 18);
      else if (M.ph === 'rest') { M.cursor.y -= 20 * dt; if (M.t >= 2.2) { M.from = null; this.init(); } }
    }
  }
};
// The saws' strokes: each end held, the slide between.
export const STROKE = { held: 0.16, slide: 0.07 };
// Where the woodcutter stands off the trunk for each saw, cells, so its
// blade spans the trunk at the cut.
const SAW_STAND = { saw1: 3, saw2: 2, saw3: 1, hand: 1 };
// The stump on the hand, carried off along the floor and let go: a log on the
// real ground, falling from the hand, its shade the stump's.
function carryOff(dt, script, dist = AP * 14) {
  const k = Math.min(1, M.t / 1.3), s = M.stumpOut, dx = ease(k) * dist, dy = -Math.sin(Math.PI * k) * AP * 4 - ease(Math.min(1, k * 3)) * AP * 2;
  M.cursor = { x: M.from.x + dx, y: M.from.y + dy, pose: 'grab' };
  s.x = M.from.sx + dx; s.y = M.from.sy + dy;
  if (k >= 1) {
    source('log', 1, 'stump');
    const ai = putSomewhere(cellOf('log', s.tone), s.x + MT.log * AP / 2);
    if (ai >= 0) { fallTag(ai, s.y); M.placed.push(ai); }
    M.stumpOut = null; M.cursor.pose = 'point'; go('rest');
  }
}
// F3b's shovel: standing in the ground a cell off the stump's shovel side,
// leaned `ang` (radians, away from the stump) about its foot on the ground.
export const SHOVEL_PUSH = 0.45, STUMP_TILT = 0.3;
export const shovelAt = () => ({ x: bx() + (MT.c0 + MT.w) * AP + AP * 1.5, y: fl() });
export const SHOVEL_H = 7 * AP;
export const shovelTop = ang => { const s = shovelAt(); return { x: s.x + Math.sin(ang) * SHOVEL_H, y: s.y - Math.cos(ang) * SHOVEL_H }; };

// The options with a fall, turned to fall away from the shack.
const FLIP = new Set(['c', 'w2h', 'oak1', 'oak2', 'oak3', 'w1', 'w2', 'cr1', 'cr2', 'cr3', 'cg1', 'cg2', 'cg3', 'd2axe1', 'd2axe2', 's1', 's3a', 's3b', 'd1', 'd2', 'e', 'esaw1', 'esaw2', 'esaw3', 'f1', 'f2']);

// --- the scene's door --------------------------------------------------------------------
// Stand option `opt` on the act now standing: the global set, the state
// cleared, the step put on. The step takes itself off, and clears the
// global, the moment the act it was started on is gone (a new scene).
export function startGroveMock(opt, STEPS) {
  globalThis.__groveMock = opt;
  Object.assign(M, { opt, mine: S.after, ph: '', t: 0, T: 0, logs: 0, cut: 0, roll: null, grow: null, cone: null, bodies: [],
                     cursor: null, ghost: null, notch: 0, sawAt: null, stumpOut: null, landed: null, from: null,
                     flip: FLIP.has(opt), stumpUp: 0, tilt: 0, shovel: null, dug: 0, basket: BASKET_FULL, taking: null, dropped: [], tip: null, bought: false, style: 0, strain: 0, snapAt: null, snapK: -1, chips: [], lastDug: 0, axe: 0, crownPal: 4, crown: 5, breakAt: null, dust: [], lastChops: 0 });   // the crown everywhere the owner's pick: OAK-2 in its oak-leaf green
  M.placed.length = 0;
  const idx = STEPS.findIndex(q => q.name === 'grovemock');
  if (idx >= 0) STEPS.splice(idx, 1);
  SCRIPTS[opt].init();
  STEPS.push({ name: 'grovemock', step: c => {
    if (!S.after || S.after !== M.mine || globalThis.__groveMock !== M.opt) {
      if (globalThis.__groveMock === M.opt) globalThis.__groveMock = undefined;
      M.opt = null; M.cursor = null; M.ghost = null; M.bodies = [];
      const k = STEPS.findIndex(q => q.name === 'grovemock');
      if (k >= 0) STEPS.splice(k, 1);
      return;
    }
    const dt = Math.max(0, c.dt) / 1000;
    if (!dt) return;
    M.t += dt; M.T += dt;
    // A tree that has just hit the ground: from here its trunk lies, all its
    // logs in it, and its crown breaks where it hit.
    const p = plot();
    if (p && p.fell != null && M.landed !== p.fell) { M.landed = p.fell; M.logs = MT.logs; M.notch = 0; M.breakAt = BUCKED.has(M.opt) ? null : p.fell + AFTER_FALL_BOUNCE_S; }
    // F1: sawdust off the kerf each time a stroke of the hand's bites
    if (M.opt === 'f1' && p && p.chops > M.lastChops) sprayDust(null, 5);
    M.lastChops = p ? p.chops : 0;
    // the trunk broken along its log seams: once the logs have hopped apart, each a real log where it lies
    if (M.breakAt != null && M.logs > 0 && S.after.t >= M.breakAt + BREAK_S) { for (let j = M.logs - 1; j >= 0; j--) layLog(pivotX() + j * MT.log * AP + (j - (MT.logs - 1) / 2) * BREAK_SPREAD, M.tones[j]); M.logs = 0; M.breakAt = null; }
    SCRIPTS[M.opt].step(dt);
  } });
}
// Whether the mock is drawing now: the global set and a scene standing it.
export const groveMockOn = () => !!globalThis.__groveMock && !!M.opt;
// For the shot tool: where the mock is.
globalThis.__groveMockRead = () => ({ opt: M.opt, ph: M.ph, t: +M.t.toFixed(2), logs: M.logs, cut: +M.cut.toFixed(2), placed: M.placed.length,
  chops: S.after?.plots[0]?.chops, stump: S.after?.plots[0]?.stump, stage: S.after?.plots[0]?.stage });
// For the shot tool: what shares ground on act 3's map (footprints.js), and
// the gap from the first plot's footprint to the shack's drawing, cells.
import { overlaps, footprints } from '../footprints.js';
globalThis.__groveMockMap = () => {
  const fp = footprints('after'), pine = fp.find(o => o.id === 'pine:0'), shack = { rects: fp.filter(o => o.id === 'forestry' || o.id === 'board:forestry').flatMap(o => o.rects) };
  const pr = pine.rects[0], sx = Math.min(...shack.rects.map(r => r.x));
  const wall = Math.min(...fp.find(o => o.id === 'forestry').rects.map(r => r.x));
  return { wallCells: (wall - (pr.x + pr.w)) / P, trunkToWallCells: (wall - (plotX(0) + (MT.c0 + MT.w) * AP)) / P, overlaps: overlaps('after').map(o => o.key), gapCells: (sx - (pr.x + pr.w)) / P, trunkToShackCells: (sx - (plotX(0) + (MT.c0 + MT.w) * AP)) / P,
           pile: fp.filter(o => o.id.startsWith('pile:grovelogs')).map(o => o.rects[0]), mill: fp.find(o => o.id === 'mill')?.rects.map(r => r.x) };
};
