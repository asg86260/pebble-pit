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
import { P, TREE_CHOPS, AFTER_WALK, GESTURE_SAW_AMP } from '../config.js';
import { plotX, afterFloor, floorAt, stationDoor, AP, PINE_GROWN } from './place.js';
import { chopTree } from './grove.js';
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
export const MT = { c0: -2, w: 4, stump: 2, logs: 4, log: 4,
  // the crown's tiers, the lowest first: h rows, its top row `top` cells wide,
  // a cell wider a side every row down
  tiers: [{ h: 6, top: 6 }, { h: 5, top: 4 }, { h: 4, top: 2 }] };
export const TRUNK_H = MT.logs * MT.log;               // the trunk past the stump, cells
export const TRUNK_TOP = -(MT.stump + TRUNK_H);        // its top row
// The tree's cells [c, r, part, tier], part 'stump', 'trunk' or 'crown',
// worked out once.
const CELLS = [];
export function treeCells() {
  if (CELLS.length) return CELLS;
  for (let r = -1; r >= -MT.stump; r--) for (let c = MT.c0; c < MT.c0 + MT.w; c++) CELLS.push([c, r, 'stump']);
  for (let r = -MT.stump - 1; r >= TRUNK_TOP; r--) for (let c = MT.c0; c < MT.c0 + MT.w; c++) CELLS.push([c, r, 'trunk']);
  let r0 = TRUNK_TOP - 1;
  MT.tiers.forEach(({ h, top }, ti) => {
    for (let j = h - 1; j >= 0; j--) {
      const wd = top + 2 * j, r = r0 - (h - 1 - j);
      for (let c = -wd / 2; c < wd / 2; c++) CELLS.push([c, r, 'crown', ti]);
    }
    r0 -= h;
  });
  return CELLS;
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
const ROWWISE = [];
export function rowOrder() {
  if (ROWWISE.length) return ROWWISE;
  const cells = treeCells().slice();
  cells.sort((a, b) => (b[1] - a[1]) || (Math.abs(a[0] + 0.5) - Math.abs(b[0] + 0.5)) || (a[0] - b[0]));
  ROWWISE.push(...cells);
  return ROWWISE;
}

// --- where things stand, world px ------------------------------------------------------
export const bx = () => plotX(0);
export const fl = () => afterFloor();
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
function standTree() { Object.assign(plot(), PLOT0, { stage: PINE_GROWN, stump: false }); M.landed = null; M.logs = 0; M.notch = 0; }
function felledPlot() { Object.assign(plot(), PLOT0, { stage: 0, stump: true }); }
function barePlot() { Object.assign(plot(), PLOT0, { stage: 0, stump: false }); }
// The logs the mock laid taken up again, so a loop starts as it began.
function takeBack() {
  for (const ai of M.placed) if (takeAt(ai)) sink('log', 1, 'mock');
  M.placed.length = 0;
}
// A log cut free and come to rest at left x on the floor: a unit of the
// act's one ground from now on, sliding into its slot from where it stopped.
function layLog(x) {
  source('log', 1, 'tree');
  const ai = putSomewhere(cellOf('log'), x + MT.log * AP / 2);
  if (ai < 0) return;
  tag(ai, { i: 0, x0: x, at: S.after.t });
  M.placed.push(ai);
}

// --- the bodies' motion ----------------------------------------------------------------
function walkTo(b, x, dt, y = null) {
  const d = x - b.x, s = AFTER_WALK * dt;
  if (Math.abs(d) > 0.5) b.face = Math.sign(d);
  b.x = Math.abs(d) <= s ? x : b.x + Math.sign(d) * s;
  b.y = y ?? floorAt(b.x + BODY / 2);
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
      layLog(M.roll.x + MT.log * AP);
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
    if (k >= 1 && M.logs === 1) { layLog(pivotX()); M.logs = 0; b.face = 1; b.pose = 'rest'; b.ang = -0.9; }
    if (M.t >= 2.4) { b.from = null; script.init(); }
  });
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

// --- the scripts -------------------------------------------------------------------------
// Each a phase machine on M.ph and M.t, stepped by the frame's dt; `init`
// stands it again, so each loops.
const SCRIPTS = {
  // A1: a worker brings a cone out of the forestry shack, kneels at the bare
  // plot and plants it; a shoot comes up while it walks back.
  a1: {
    init() {
      takeBack(); barePlot();
      const door = stationDoor('forestry');
      M.bodies = [{ x: door - BODY / 2, y: floorAt(door), face: -1, tool: null, carry: 'cone', home: door - BODY / 2 }];
      M.cone = null; M.grow = null; go('walk');
    },
    step(dt) {
      const b = M.bodies[0], spot = bx() + AP;
      if (M.ph === 'walk') { if (walkTo(b, spot, dt)) { b.face = -1; go('kneel'); } }
      else if (M.ph === 'kneel') {
        b.squat = true;
        if (M.t >= 0.25) { b.carry = null; M.cone = { state: 'set', at: S.after.t, from: { x: b.x + BODY / 2 - AP, y: b.y - BODY + P - 2 * AP } }; go('set'); }
      } else if (M.ph === 'set') {
        if (M.t >= 0.5) { M.cone = { state: 'in', at: S.after.t }; go('press'); }
      } else if (M.ph === 'press') {
        if (M.t >= 0.9) { b.squat = false; M.grow = { kind: 'b2', at: S.after.t, dur: 14 }; go('back'); }
      } else if (M.ph === 'back') {
        if (walkTo(b, b.home, dt) || M.t > 4.5) go('hold');
      } else if (M.ph === 'hold' && M.t >= 1.2) this.init();
    }
  },
  // A2: the hand takes the cone set out at the forestry shack's door, carries
  // it over the bare plot and lets go: it drops in and sinks, and a shoot
  // comes up. The ghost hand shows the motion first.
  a2: {
    init() {
      barePlot();
      const door = stationDoor('forestry'), x = door - AP * 5;
      M.cone = { state: 'lying', x, y: floorAt(x) - 2 * AP };
      M.from = { x: M.cone.x, y: M.cone.y };
      M.bodies = []; M.grow = null; M.cursor = null; go('teach');
    },
    step(dt) {
      const c = M.cone, from = M.from, over = { x: bx() - AP, y: fl() - AP * 9 };
      const at = k => ({ x: lerp(from.x + AP, over.x + AP, ease(k)), y: lerp(from.y - 2 * AP, over.y, ease(k)) - Math.sin(Math.PI * ease(k)) * AP * 8 });
      if (M.ph === 'teach') {
        const u = (M.t % 1.6) / 1.6, k = Math.min(1, u * 1.3);
        M.ghost = { ...at(k), pose: u < 0.08 ? 'point' : 'grab' };
        if (M.t >= 3.2) { M.ghost = null; go('reach'); }
      } else if (M.ph === 'reach') {
        const k = Math.min(1, M.t / 0.6);
        M.cursor = { x: lerp(over.x + AP * 10, from.x + AP, ease(k)), y: lerp(over.y, from.y - 2 * AP, ease(k)), pose: 'point' };
        if (M.t >= 0.8) { M.cursor.pose = 'grab'; c.state = 'held'; go('carry'); }
      } else if (M.ph === 'carry') {
        const k = Math.min(1, M.t / 1.5);
        M.cursor = { ...at(k), pose: 'grab' };
        c.x = M.cursor.x - AP; c.y = M.cursor.y + 2 * AP;   // hanging under the fist, as goods in the hand
        if (M.t >= 1.7) { M.cursor.pose = 'point'; Object.assign(c, { state: 'falling', at: S.after.t, fy: c.y }); go('fall'); }
      } else if (M.ph === 'fall') {
        // under the yard's gravity onto the soil, then in
        const ground = fl() - 3 * AP;
        c.y = Math.min(ground, c.fy + 0.5 * 900 * M.t * M.t);
        if (c.y >= ground) { M.cone = { state: 'in', at: S.after.t }; go('press'); }
      } else if (M.ph === 'press') {
        M.cursor.x += 30 * dt; M.cursor.y -= 20 * dt;
        if (M.t >= 0.9) { M.grow = { kind: 'b2', at: S.after.t, dur: 14 }; go('hold'); }
      } else if (M.ph === 'hold') {
        M.cursor.x += 10 * dt;
        if (M.t >= 3.2) { M.cursor = null; this.init(); }
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
  // D2: the same with the axe: a blow a third of the way, the log off in three.
  d2: {
    init() { takeBack(); felledPlot(); M.logs = MT.logs; M.cut = 0;
             M.bodies = [{ x: onTrunkAt(MT.logs, 'axe'), y: trunkTop(), face: 1, tool: 'axe', pose: 'rest', ang: -0.9 }]; go('cut'); },
    step(dt) { bucker(dt, 'axe', this); }
  },
  // E: the woodcutter walks up with its axe on its shoulder, fells the pine
  // a blow at a time from the side away from the fall, hops up on the trunk
  // and bucks it with the same axe.
  e: {
    init() { takeBack(); standTree();
             M.bodies = [{ x: bx() + AP * 40, y: fl(), face: -1, tool: 'axe', pose: 'carry', ang: -1.3 }]; go('walk'); },
    step(dt) {
      const b = M.bodies[0], p = plot(), HIT = -0.25, stand = bx() + MT.c0 * AP - GRIP.dx - Math.round(AXE_FRONT * Math.cos(HIT));
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
        if (walkTo(b, pivotX() + TRUNK_H * AP + AP, dt)) { b.face = -1; b.from = { x: b.x, y: b.y }; go('up'); }
      } else if (M.ph === 'up') {
        const k = Math.min(1, M.t / 0.5);
        hop(b, b.from, { x: onTrunkAt(MT.logs, 'axe'), y: trunkTop() }, k);
        if (k >= 1) { b.face = 1; b.pose = 'rest'; b.from = null; go('cut'); }
      } else bucker(dt, 'axe', this, 2);
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
        if (M.landed != null && S.after.t - M.landed >= 1.2) { M.sawAt = { buck: true, s: 0 }; M.from = { x: M.cursor.x, y: M.cursor.y }; go('hold0'); }
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
          if (M.t >= 0.3 && M.logs === 1) { layLog(pivotX()); M.logs = 0; M.sawAt = null; }
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
        const k = Math.min(1, M.t / 1.4), s = M.stumpOut, dx = ease(k) * AP * 22, dy = -Math.sin(Math.PI * k) * AP * 3;
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
  }
};

// --- the scene's door --------------------------------------------------------------------
// Stand option `opt` on the act now standing: the global set, the state
// cleared, the step put on. The step takes itself off, and clears the
// global, the moment the act it was started on is gone (a new scene).
export function startGroveMock(opt, STEPS) {
  globalThis.__groveMock = opt;
  Object.assign(M, { opt, mine: S.after, ph: '', t: 0, T: 0, logs: 0, cut: 0, roll: null, grow: null, cone: null, bodies: [],
                     cursor: null, ghost: null, notch: 0, sawAt: null, stumpOut: null, landed: null, from: null });
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
    if (p && p.fell != null && M.landed !== p.fell) { M.landed = p.fell; M.logs = MT.logs; M.notch = 0; }
    SCRIPTS[M.opt].step(dt);
  } });
}
// Whether the mock is drawing now: the global set and a scene standing it.
export const groveMockOn = () => !!globalThis.__groveMock && !!M.opt;
// For the shot tool: where the mock is.
globalThis.__groveMockRead = () => ({ opt: M.opt, ph: M.ph, t: +M.t.toFixed(2), logs: M.logs, cut: +M.cut.toFixed(2), placed: M.placed.length,
  chops: S.after?.plots[0]?.chops, stump: S.after?.plots[0]?.stump, stage: S.after?.plots[0]?.stage });
